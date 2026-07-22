import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import TerminalWindow from '@/components/scan/TerminalWindow';
import ScanHeader from '@/components/scan/ScanHeader';
import AgentStatusPanel from '@/components/scan/AgentStatusPanel';
import LiveFindingsPanel from '@/components/scan/LiveFindingsPanel';
import ScanStats from '@/components/scan/ScanStats';
import {
  mockLogs,
  vulnerabilityFindings,
  getProgressForLogIndex,
  getAgentStatus,
  getScanStats,
} from '@/components/scan/logData';
import type { LogEntry, VulnerabilityFinding } from '@/components/scan/logData';

// Type for connection status
 type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'completed';

// Stream interval (ms between each log line)
const LOG_STREAM_INTERVAL = 180;

export default function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const scanId = id || 'demo';

  // Core state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isPaused, setIsPaused] = useState(false);
  const [, setIsStopped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  // Derived state for right panel
  const [activeFindings, setActiveFindings] = useState<VulnerabilityFinding[]>([]);
  const [agentStatus, setAgentStatus] = useState<{
    recon: { status: string; progress: number; phase: string };
    exploit: { status: string; progress: number; phase: string };
    validate: { status: string; progress: number; phase: string };
  }>({
    recon: { status: 'pending', progress: 0, phase: 'Aguardando...' },
    exploit: { status: 'pending', progress: 0, phase: 'Aguardando...' },
    validate: { status: 'pending', progress: 0, phase: 'Aguardando...' },
  });
  const [stats, setStats] = useState({
    elapsed: '00:00',
    endpointsTested: '0/47',
    payloadsSent: '0',
    currentAgent: 'INIT',
  });

  // Refs for streaming control
  const logIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const targetUrl = 'https://demo-app.strixguard.com';
  const startTime = '15/01/2025, 14:32';

  // WebSocket connection attempt
  useEffect(() => {
    // Try WebSocket first
    try {
      const ws = new WebSocket(`ws://localhost:8000/api/ws/scans/${scanId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        // Clear any fallback interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'log') {
            setLogs((prev) => [...prev, data.log]);
          } else if (data.type === 'vulnerability') {
            setActiveFindings((prev) => [data.finding, ...prev]);
          } else if (data.type === 'progress') {
            setProgress(data.progress);
          } else if (data.type === 'status') {
            setAgentStatus(data.agents);
          } else if (data.type === 'complete') {
            setIsComplete(true);
            setConnectionStatus('completed');
            ws.close();
          }
        } catch {
          // If not JSON, treat as plain log line
          setLogs((prev) => [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
              agent: 'SYSTEM',
              level: 'INFO',
              message: event.data,
            },
          ]);
        }
      };

      ws.onerror = () => {
        // WebSocket not available, fall back to mock data
        ws.close();
        startMockStream();
      };

      ws.onclose = () => {
        if (!isComplete) {
          startMockStream();
        }
      };
    } catch {
      // WebSocket not supported or failed, use mock data
      startMockStream();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  // Start mock data stream
  const startMockStream = useCallback(() => {
    setConnectionStatus('connected');
    logIndexRef.current = 0;
    setLogs([]);
    setActiveFindings([]);

    intervalRef.current = setInterval(() => {
      if (logIndexRef.current >= mockLogs.length) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsComplete(true);
        setConnectionStatus('completed');
        setProgress(100);
        return;
      }

      const nextLog = mockLogs[logIndexRef.current];
      logIndexRef.current += 1;

      setLogs((prev) => [...prev, nextLog]);

      // Update progress
      const newProgress = getProgressForLogIndex(logIndexRef.current - 1);
      setProgress(newProgress);

      // Update agent status
      const newAgentStatus = getAgentStatus(logIndexRef.current - 1);
      setAgentStatus(newAgentStatus);

      // Update stats
      setStats(getScanStats(logIndexRef.current - 1));

      // Add vulnerability finding if this log entry is a VULN
      if (nextLog.level === 'VULN' && nextLog.vulnName) {
        const finding = vulnerabilityFindings.find(
          (v) => v.name === nextLog.vulnName || v.endpoint === nextLog.endpoint
        );
        if (finding) {
          setActiveFindings((prev) => {
            if (prev.find((p) => p.id === finding.id)) return prev;
            return [finding, ...prev];
          });
        }
      }
    }, LOG_STREAM_INTERVAL);
  }, []);

  // Pause handler
  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Resume handler
  const handleResume = useCallback(() => {
    setIsPaused(false);
    // Resume from current position
    intervalRef.current = setInterval(() => {
      if (logIndexRef.current >= mockLogs.length) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsComplete(true);
        setConnectionStatus('completed');
        setProgress(100);
        return;
      }

      const nextLog = mockLogs[logIndexRef.current];
      logIndexRef.current += 1;

      setLogs((prev) => [...prev, nextLog]);

      const newProgress = getProgressForLogIndex(logIndexRef.current - 1);
      setProgress(newProgress);

      const newAgentStatus = getAgentStatus(logIndexRef.current - 1);
      setAgentStatus(newAgentStatus);

      setStats(getScanStats(logIndexRef.current - 1));

      if (nextLog.level === 'VULN' && nextLog.vulnName) {
        const finding = vulnerabilityFindings.find(
          (v) => v.name === nextLog.vulnName || v.endpoint === nextLog.endpoint
        );
        if (finding) {
          setActiveFindings((prev) => {
            if (prev.find((p) => p.id === finding.id)) return prev;
            return [finding, ...prev];
          });
        }
      }
    }, LOG_STREAM_INTERVAL);
  }, []);

  // Stop handler
  const handleStop = useCallback(() => {
    setIsStopped(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setConnectionStatus('disconnected');
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
        agent: 'SYSTEM',
        level: 'WARN',
        message: 'Escaneamento interrompido pelo usuario.',
      },
    ]);
  }, []);

  // Risk score calculation
  const riskScore = useMemo(() => {
    if (activeFindings.length === 0) return 0;
    const totalCvss = activeFindings.reduce((sum, f) => sum + f.cvss, 0);
    return (totalCvss / (activeFindings.length * 10) * 10).toFixed(1);
  }, [activeFindings]);

  return (
    <div
      className="min-h-[calc(100dvh-64px)] px-4 sm:px-6 py-6"
      style={{ background: '#0a0a0f' }}
    >
      {/* Scan Header */}
      <ScanHeader
        scanId={scanId}
        targetUrl={targetUrl}
        startTime={startTime}
        progress={progress}
        isComplete={isComplete}
        isPaused={isPaused}
        onStop={handleStop}
        onPause={handlePause}
        onResume={handleResume}
      />

      {/* Main Content: Two-column layout */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
        style={{
          animation: 'terminalEntrance 500ms ease-out',
        }}
      >
        {/* Left: Terminal */}
        <div>
          <TerminalWindow
            logs={logs}
            isComplete={isComplete}
            isPaused={isPaused}
            scanId={scanId}
            targetUrl={targetUrl}
            connectionStatus={connectionStatus}
          />
        </div>

        {/* Right: Status Panel */}
        <div
          className="flex flex-col gap-4"
          style={{
            animation: 'panelSlideIn 500ms ease-out 200ms both',
          }}
        >
          <AgentStatusPanel agents={agentStatus} />
          <ScanStats stats={stats} />
          <LiveFindingsPanel findings={activeFindings} />

          {/* Scan Summary Card (shown after completion) */}
          {isComplete && (
            <div
              className="rounded-xl p-5"
              style={{
                background: '#12121a',
                border: '1px solid rgba(0,255,136,0.15)',
                animation: 'slideInUp 400ms ease-out',
              }}
            >
              <h3 className="text-heading-sm font-medium text-text-primary mb-3">
                Resumo do Escaneamento
              </h3>

              {/* Severity counts */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => {
                  const count = activeFindings.filter((f) => f.severity === sev).length;
                  const colors = {
                    CRITICAL: { text: '#ff0044', bg: 'rgba(255,0,68,0.15)' },
                    HIGH: { text: '#ff4444', bg: 'rgba(255,68,68,0.15)' },
                    MEDIUM: { text: '#ffb800', bg: 'rgba(255,184,0,0.15)' },
                    LOW: { text: '#00ff88', bg: 'rgba(0,255,136,0.15)' },
                  };
                  return (
                    <div
                      key={sev}
                      className="text-center p-2 rounded-lg"
                      style={{ background: colors[sev].bg }}
                    >
                      <p
                        className="font-mono text-lg font-bold"
                        style={{ color: colors[sev].text }}
                      >
                        {count}
                      </p>
                      <p className="text-[0.625rem] uppercase font-medium" style={{ color: colors[sev].text, opacity: 0.8 }}>
                        {sev === 'CRITICAL' ? 'Crit' : sev === 'HIGH' ? 'Alta' : sev === 'MEDIUM' ? 'Med' : 'Baixa'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Risk Score */}
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: '#0a0a0f' }}
              >
                <span className="text-sm text-text-secondary">Score de Risco</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-16 h-2 rounded-full overflow-hidden"
                    style={{ background: '#1a1a2e' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Number(riskScore) * 10}%`,
                        background:
                          Number(riskScore) >= 8
                            ? 'linear-gradient(90deg, #ff0044, #ff4444)'
                            : Number(riskScore) >= 5
                              ? 'linear-gradient(90deg, #ffb800, #febc2e)'
                              : 'linear-gradient(90deg, #00ff88, #00f0ff)',
                      }}
                    />
                  </div>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{
                      color:
                        Number(riskScore) >= 8
                          ? '#ff0044'
                          : Number(riskScore) >= 5
                            ? '#ffb800'
                            : '#00ff88',
                    }}
                  >
                    {riskScore}/10
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
