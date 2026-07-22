import { useState, memo } from 'react';
import type { VulnerabilityFinding } from './logData';

interface LiveFindingsPanelProps {
  findings: VulnerabilityFinding[];
}

const severityConfig = {
  CRITICAL: { label: 'Critica', color: '#ff0044', bg: 'rgba(255,0,68,0.15)', border: 'rgba(255,0,68,0.3)' },
  HIGH: { label: 'Alta', color: '#ff4444', bg: 'rgba(255,68,68,0.15)', border: 'rgba(255,68,68,0.3)' },
  MEDIUM: { label: 'Media', color: '#ffb800', bg: 'rgba(255,184,0,0.15)', border: 'rgba(255,184,0,0.3)' },
  LOW: { label: 'Baixa', color: '#00ff88', bg: 'rgba(0,255,136,0.15)', border: 'rgba(0,255,136,0.3)' },
};

function FindingCard({ finding, index }: { finding: VulnerabilityFinding; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const sev = severityConfig[finding.severity];

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200 cursor-pointer"
      style={{
        background: `rgba(${finding.severity === 'CRITICAL' ? '255,0,68' : finding.severity === 'HIGH' ? '255,68,68' : finding.severity === 'MEDIUM' ? '255,184,0' : '0,255,136'},0.04)`,
        borderLeft: `4px solid ${sev.color}`,
        animation: `slideInRight 400ms ease-out ${index * 0.05}s both`,
      }}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded); }}
      role="button"
      tabIndex={0}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {finding.name}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#00f0ff' }}>
              {finding.endpoint}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: sev.bg,
                color: sev.color,
                border: `1px solid ${sev.border}`,
              }}
            >
              {sev.label}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{
                background: `${sev.color}15`,
                color: sev.color,
              }}
            >
              {finding.cvss}
            </span>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-text-secondary leading-relaxed">
              {finding.description}
            </p>
            {finding.poc && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#ffb800' }}>
                  Proof of Concept:
                </p>
                <code
                  className="block text-xs font-mono p-2 rounded"
                  style={{
                    background: '#0a0a0f',
                    color: '#b967ff',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {finding.poc}
                </code>
              </div>
            )}
            {finding.remediation && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#00ff88' }}>
                  Correcao:
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {finding.remediation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveFindingsPanelInner({ findings }: LiveFindingsPanelProps) {
  const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length;

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-heading-sm font-medium text-text-primary">
          Vulnerabilidades Encontradas
        </h3>
        {findings.length > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: criticalCount > 0 ? 'rgba(255,0,68,0.15)' : 'rgba(0,255,136,0.15)',
              color: criticalCount > 0 ? '#ff0044' : '#00ff88',
            }}
          >
            {findings.length}
          </span>
        )}
      </div>

      {findings.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-text-muted">
            Nenhuma vulnerabilidade encontrada ainda
          </p>
          <p className="text-xs mt-1" style={{ color: '#4a4a5e' }}>
            As vulnerabilidades aparecerao aqui em tempo real
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a2e transparent' }}>
          {findings.map((finding, i) => (
            <FindingCard key={finding.id} finding={finding} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(LiveFindingsPanelInner);
