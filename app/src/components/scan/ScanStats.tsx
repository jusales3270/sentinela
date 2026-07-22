import { memo } from 'react';

interface ScanStatsProps {
  stats: {
    elapsed: string;
    endpointsTested: string;
    payloadsSent: string;
    currentAgent: string;
  };
}

const agentColorMap: Record<string, string> = {
  INIT: '#00f0ff',
  RECON: '#00ff88',
  EXPLOIT: '#ffb800',
  VALIDATE: '#b967ff',
};

function ScanStatsInner({ stats }: ScanStatsProps) {
  const items = [
    { label: 'Tempo decorrido', value: stats.elapsed, mono: true },
    { label: 'Endpoints testados', value: stats.endpointsTested, mono: false },
    { label: 'Payloads enviados', value: stats.payloadsSent, mono: false },
    { label: 'Agente atual', value: stats.currentAgent, mono: false, color: agentColorMap[stats.currentAgent] || '#a0a0b8' },
  ];

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <h3 className="text-heading-sm font-medium text-text-primary mb-4">
        Estatisticas
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="text-xs text-text-muted">{item.label}</p>
            <p
              className={`text-sm font-semibold ${item.mono ? 'font-mono' : ''}`}
              style={{ color: item.color || '#ffffff' }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ScanStatsInner);
