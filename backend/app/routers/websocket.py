"""
StrixGuard - WebSocket Router

Real-time log streaming for scan execution.
Provides live updates via WebSocket connection including:
- Log lines from the scan process
- Vulnerability discoveries
- Progress updates
- Status changes
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Any, Dict, Optional, Set

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    ScanORM,
    ScanStatus,
    UserORM,
    VulnerabilityORM,
    get_db,
)
from app.services.strix_runner import run_strix_scan

router = APIRouter(prefix="/ws")
settings = get_settings()

# Track active scan tasks and connected clients
# scan_id -> {task, clients}
_active_scans: Dict[str, Dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Message Parsing
# ---------------------------------------------------------------------------

def parse_log_line(line_json: str) -> Optional[Dict[str, Any]]:
    """Parse a JSON log line into a structured message."""
    try:
        data = json.loads(line_json)
        if isinstance(data, dict):
            return data
        return {"type": "log", "message": str(data)}
    except (json.JSONDecodeError, TypeError):
        return {
            "type": "log",
            "message": line_json,
            "timestamp": datetime.utcnow().isoformat(),
            "agent": "Strix",
            "level": "info",
        }


# ---------------------------------------------------------------------------
# Scan Runner Task
# ---------------------------------------------------------------------------

async def run_scan_task(scan_id: str, db: Session) -> None:
    """
    Background task that runs the Strix scan and broadcasts messages.

    This runs independently of WebSocket connections so the scan
    continues even if the client disconnects.
    """
    scan = db.query(ScanORM).filter(ScanORM.id == scan_id).first()
    if not scan:
        return

    scan_info = _active_scans.get(scan_id)
    if not scan_info:
        return

    # Broadcast start
    start_msg = {
        "type": "status",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "running",
        "message": "Iniciando scan de penetração",
    }
    await _broadcast(scan_id, start_msg)

    try:
        async for line in run_strix_scan(
            target_url=scan.target_url,
            scan_mode=scan.scan_mode.value,
            llm_provider=scan.llm_provider or settings.default_llm_provider,
            api_key=settings.llm_api_key,
            scan_id=scan_id,
            instruction=scan.instruction,
        ):
            # Parse and broadcast
            msg = parse_log_line(line)

            # Update scan state based on message type
            if msg.get("type") == "vuln":
                await _handle_vulnerability(scan_id, msg, db)

            elif msg.get("type") == "progress":
                scan.progress_percent = msg.get("percent", scan.progress_percent)
                scan.current_agent = msg.get("current_agent", scan.current_agent)
                db.commit()

            elif msg.get("type") == "agent_change":
                scan.current_agent = msg.get("agent")
                db.commit()

            elif msg.get("type") == "status":
                status_val = msg.get("status")
                if status_val == "completed":
                    scan.status = ScanStatus.COMPLETED
                    scan.completed_at = datetime.utcnow()
                    scan.progress_percent = 100
                    db.commit()
                elif status_val == "failed":
                    scan.status = ScanStatus.FAILED
                    scan.completed_at = datetime.utcnow()
                    scan.error_message = msg.get("message", "Scan falhou")
                    db.commit()

            # Broadcast to all connected clients
            await _broadcast(scan_id, msg)

        # Scan completed successfully
        if scan.status == ScanStatus.RUNNING:
            scan.status = ScanStatus.COMPLETED
            scan.completed_at = datetime.utcnow()
            scan.progress_percent = 100
            db.commit()

            completion_msg = {
                "type": "status",
                "timestamp": datetime.utcnow().isoformat(),
                "status": "completed",
                "message": "Scan concluído com sucesso",
            }
            await _broadcast(scan_id, completion_msg)

    except Exception as e:
        scan.status = ScanStatus.FAILED
        scan.completed_at = datetime.utcnow()
        scan.error_message = str(e)
        db.commit()

        error_msg = {
            "type": "status",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "failed",
            "message": f"Erro no scan: {str(e)}",
        }
        await _broadcast(scan_id, error_msg)

    finally:
        # Clean up but keep record for a while
        scan_info["running"] = False
        scan.current_agent = None
        db.commit()


async def _handle_vulnerability(scan_id: str, msg: Dict[str, Any], db: Session) -> None:
    """Save a discovered vulnerability to the database."""
    try:
        vuln_data = msg.get("vulnerability", {})
        if not vuln_data or not vuln_data.get("title"):
            return

        vuln = VulnerabilityORM(
            id=vuln_data.get("id", str(uuid.uuid4())),
            scan_id=scan_id,
            title=vuln_data["title"],
            severity=vuln_data.get("severity", "info"),
            cvss_score=vuln_data.get("cvss_score", 0.0),
            category=vuln_data.get("category", "Outros"),
            description=vuln_data.get("description", ""),
            proof_of_concept=vuln_data.get("proof_of_concept"),
            remediation=vuln_data.get("remediation"),
            cwe_id=vuln_data.get("cwe_id"),
            evidence=vuln_data.get("evidence"),
            affected_urls=vuln_data.get("affected_urls"),
            references=vuln_data.get("references"),
        )
        db.add(vuln)
        db.commit()
    except Exception as e:
        # Log but don't stop the scan
        print(f"[ERROR] Falha ao salvar vulnerabilidade: {e}")


async def _broadcast(scan_id: str, message: Dict[str, Any]) -> None:
    """Broadcast a message to all connected clients for a scan."""
    scan_info = _active_scans.get(scan_id)
    if not scan_info:
        return

    dead_clients = set()
    msg_json = json.dumps(message)

    for client_id, ws in list(scan_info["clients"].items()):
        try:
            await ws.send_text(msg_json)
        except Exception:
            dead_clients.add(client_id)

    # Remove dead clients
    for client_id in dead_clients:
        scan_info["clients"].pop(client_id, None)


# ---------------------------------------------------------------------------
# WebSocket Endpoint
# ---------------------------------------------------------------------------

@router.websocket("/scans/{scan_id}")
async def scan_logs(websocket: WebSocket, scan_id: str):
    """
    WebSocket endpoint for real-time scan log streaming.

    Connect to receive live updates during scan execution:
    - Log messages from the scan process
    - Vulnerability discoveries (type: "vuln")
    - Progress updates (type: "progress")
    - Status changes (type: "status")
    - Agent changes (type: "agent_change")

    If the scan is not running when connecting, it will be started automatically
    (if domain verification and authorization are complete).
    """
    await websocket.accept()
    client_id = str(uuid.uuid4())

    # Get database session
    db = next(get_db())

    try:
        scan = db.query(ScanORM).filter(ScanORM.id == scan_id).first()

        if not scan:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Scan não encontrado",
            }))
            await websocket.close()
            return

        # Initialize scan tracking if needed
        if scan_id not in _active_scans:
            _active_scans[scan_id] = {
                "task": None,
                "clients": {},
                "running": False,
            }

        # Register client
        _active_scans[scan_id]["clients"][client_id] = websocket

        # Send current status
        await websocket.send_text(json.dumps({
            "type": "status",
            "timestamp": datetime.utcnow().isoformat(),
            "status": scan.status.value,
            "progress_percent": scan.progress_percent,
            "current_agent": scan.current_agent,
            "message": f"Status atual: {scan.status.value}",
        }))

        # Start scan if pending and ready
        if scan.status in [ScanStatus.PENDING, ScanStatus.AWAITING_AUTHORIZATION]:
            if scan.domain_verified and scan.authorization_signed:
                # Update status and start
                scan.status = ScanStatus.RUNNING
                scan.started_at = datetime.utcnow()
                scan.progress_percent = 0
                db.commit()

                # Launch background task
                _active_scans[scan_id]["running"] = True
                task = asyncio.create_task(run_scan_task(scan_id, db))
                _active_scans[scan_id]["task"] = task

                await websocket.send_text(json.dumps({
                    "type": "status",
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "running",
                    "message": "Scan iniciado automaticamente",
                }))
            else:
                await websocket.send_text(json.dumps({
                    "type": "status",
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": scan.status.value,
                    "message": "Aguardando verificação de domínio e autorização",
                }))

        # Start scan if already in running state but no task (e.g., reconnection)
        elif scan.status == ScanStatus.RUNNING and not _active_scans[scan_id].get("running"):
            _active_scans[scan_id]["running"] = True
            task = asyncio.create_task(run_scan_task(scan_id, db))
            _active_scans[scan_id]["task"] = task

        # Keep connection alive and handle client messages
        while True:
            try:
                data = await websocket.receive_text()
                msg = json.loads(data)

                # Handle client commands
                command = msg.get("command")
                if command == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat(),
                    }))

                elif command == "start":
                    # Manual start command
                    if scan.status not in [ScanStatus.RUNNING, ScanStatus.COMPLETED]:
                        if scan.domain_verified and scan.authorization_signed:
                            scan.status = ScanStatus.RUNNING
                            scan.started_at = datetime.utcnow()
                            db.commit()

                            if not _active_scans[scan_id].get("running"):
                                _active_scans[scan_id]["running"] = True
                                task = asyncio.create_task(run_scan_task(scan_id, db))
                                _active_scans[scan_id]["task"] = task
                        else:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "message": "Verificação de domínio e autorização necessárias",
                            }))

            except WebSocketDisconnect:
                break
            except Exception:
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Erro no WebSocket: {str(e)}",
            }))
        except Exception:
            pass
    finally:
        # Unregister client
        if scan_id in _active_scans:
            _active_scans[scan_id]["clients"].pop(client_id, None)

            # Clean up if no clients and scan is done
            scan_info = _active_scans[scan_id]
            if not scan_info["clients"] and not scan_info.get("running"):
                if scan_info.get("task"):
                    scan_info["task"].cancel()
                _active_scans.pop(scan_id, None)

        try:
            await websocket.close()
        except Exception:
            pass
