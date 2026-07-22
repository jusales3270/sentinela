import { memo } from 'react';
import { Search, Zap, CheckCircle2 } from 'lucide-react';

interface AgentStatusPanelProps {
  agents: {
    recon: { status: string; progress: number; phase: string };
    exploit: { status: string; progress: number; phase: string };
    validate: { status: string; progress: number; phase: string };
  };
}

const agentConfig = {
  recon: {
    name: 'Recon',
    description: 'Mapeamento e reconhecimento',
    icon: Search,
    color: '#00ff88',
    bgColor: 'rgba(0,255,136,0.08)',
  },
  exploit: {
    name: 'Exploit',
    description: 'Deteccao de vulnerabilidades',
    icon: Zap,
    color: '#ffb800',
    bgColor: 'rgba(255,184,0,0.08)',
  },
  validate: {
    name: 'Validacao',
    description: 'Confirmacao de exploits',
    icon: CheckCircle2,
    color: '#b967ff',
    bgColor: 'rgba(185,103,255,0.08)',
  },
};

function AgentRow({
  config,
  status,
  progress,
  phase,
}: {
  config: (typeof agentConfig)['recon'];
  status: string;
  progress: number;
  phase: string;
}) {
  const Icon = config.icon;
  const isRunning = status === 'running';
  const isComplete = status === 'complete';

  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Status dot */}
      <div className="relative flex items-center justify-center w-3">
        {isRunning ? (
          <>
            <span
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: config.color,
                animation: 'agentPulse 1.5s ease-in-out infinite',
              }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: config.color }}
            />
          </>
        ) : (
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: isComplete ? config.color : status === 'pending' ? '#6a6a82' : '#4a4a5e',
            }}
          />
        )}
      </div>

      {/* Icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: config.bgColor }}
      >
        <Icon size={16} color={config.color} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            {config.name}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: isRunning
                ? 'rgba(0,240,255,0.1)'
                : isComplete
                  ? 'rgba(0,255,136,0.1)'
                  : 'rgba(255,255,255,0.05)',
              color: isRunning ? '#00f0ff' : isComplete ? '#00ff88' : '#6a6a82',
              fontSize: '0.625rem',
            }}
          >
            {isRunning ? 'Executando' : isComplete ? 'Concluido' : 'Pendente'}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-0.5 truncate">
          {config.description}
        </p>
        <p
          className="text-xs mt-0.5 truncate"
          style={{ color: config.color }}
        >
          {phase}
        </p>

        {/* Mini progress bar */}
        <div
          className="w-full h-1 rounded-full mt-2"
          style={{ background: '#1a1a2e' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${config.color}, ${config.color}88)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AgentStatusPanelInner({ agents }: AgentStatusPanelProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <h3 className="text-heading-sm font-medium text-text-primary mb-2">
        Status dos Agentes
      </h3>
      <div className="divide-y divide-white/5">
        <AgentRow
          config={agentConfig.recon}
          status={agents.recon.status}
          progress={agents.recon.progress}
          phase={agents.recon.phase}
        />
        <AgentRow
          config={agentConfig.exploit}
          status={agents.exploit.status}
          progress={agents.exploit.progress}
          phase={agents.exploit.phase}
        />
        <AgentRow
          config={agentConfig.validate}
          status={agents.validate.status}
          progress={agents.validate.progress}
          phase={agents.validate.phase}
        />
      </div>
    </div>
  );
}

export default memo(AgentStatusPanelInner);
