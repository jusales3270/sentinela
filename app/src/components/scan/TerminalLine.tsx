import { memo } from 'react';
import type { LogEntry } from './logData';

interface TerminalLineProps {
  log: LogEntry;
  isNew?: boolean;
}

const agentColors: Record<string, string> = {
  INIT: '#00f0ff',
  SYSTEM: '#00f0ff',
  RECON: '#00ff88',
  EXPLOIT: '#ffb800',
  VALIDATE: '#b967ff',
  ERROR: '#ff0044',
  WARN: '#ffb800',
};



function TerminalLineInner({ log, isNew }: TerminalLineProps) {
  const agentColor = agentColors[log.agent] || '#a0a0b8';
  const messageColor = log.level === 'SUCCESS'
    ? '#00ff88'
    : log.level === 'VULN'
      ? log.severity === 'HIGH'
        ? '#ff4444'
        : log.severity === 'MEDIUM'
          ? '#ffb800'
          : '#ff0044'
      : log.level === 'WARN'
        ? '#ffb800'
        : log.level === 'ERROR'
          ? '#ff0044'
          : '#a0a0b8';

  const isVulnLine = log.level === 'VULN';
  const vulnBorderColor = isVulnLine
    ? log.severity === 'CRITICAL'
      ? '#ff0044'
      : log.severity === 'HIGH'
        ? '#ff4444'
        : log.severity === 'MEDIUM'
          ? '#ffb800'
          : '#00ff88'
    : 'transparent';

  const vulnBgColor = isVulnLine
    ? log.severity === 'CRITICAL'
      ? 'rgba(255,0,68,0.04)'
      : log.severity === 'HIGH'
        ? 'rgba(255,68,68,0.04)'
        : log.severity === 'MEDIUM'
          ? 'rgba(255,184,0,0.04)'
          : 'rgba(0,255,136,0.04)'
    : 'transparent';

  return (
    <div
      className="font-mono text-[0.8125rem] leading-[1.65] flex"
      style={{
        borderLeft: isVulnLine ? `3px solid ${vulnBorderColor}` : '3px solid transparent',
        background: isNew && isVulnLine ? vulnBgColor : vulnBgColor !== 'transparent' ? vulnBgColor : undefined,
        paddingLeft: isVulnLine ? 12 : 15,
        paddingRight: 8,
        animation: isNew ? 'flashVuln 800ms ease-out' : undefined,
      }}
    >
      <span style={{ color: '#4a4a5e' }} className="shrink-0 select-none">
        [{log.timestamp}]
      </span>
      <span
        className="shrink-0 ml-2 font-bold select-none"
        style={{ color: agentColor }}
      >
        [{log.agent}]
      </span>
      <span
        className="ml-2 break-all"
        style={{ color: messageColor }}
      >
        {log.message}
      </span>
    </div>
  );
}

export default memo(TerminalLineInner);
