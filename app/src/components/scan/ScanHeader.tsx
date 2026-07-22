import { memo } from 'react';
import { ArrowLeft, FileText, Square, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScanHeaderProps {
  scanId: string;
  targetUrl: string;
  startTime: string;
  progress: number;
  isComplete: boolean;
  isPaused: boolean;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

function ScanHeaderInner({
  scanId,
  targetUrl,
  startTime,
  progress,
  isComplete,
  isPaused,
  onStop,
  onPause,
  onResume,
}: ScanHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className="w-full mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      style={{
        animation: 'fadeSlideDown 400ms ease-out',
      }}
    >
      {/* Left: Target Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg transition-colors duration-200 hover:bg-bg-secondary shrink-0"
          title="Voltar ao Dashboard"
        >
          <ArrowLeft size={20} color="#a0a0b8" />
        </button>
        <div className="min-w-0">
          <h1 className="text-heading-md font-semibold text-text-primary break-all">
            {targetUrl}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#6a6a82' }}>
            Escaneamento iniciado em {startTime}
          </p>
        </div>
      </div>

      {/* Center: Progress Bar */}
      <div className="flex items-center gap-3 lg:flex-1 lg:justify-center">
        <div className="w-full max-w-[300px]">
          <p className="text-xs mb-1" style={{ color: '#6a6a82' }}>
            Progresso
          </p>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: '#1a1a2e' }}
            >
              <div
                className="h-full rounded-full relative transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #00f0ff, #00ff88)',
                  boxShadow: '0 0 10px rgba(0,240,255,0.3)',
                }}
              >
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite',
                  }}
                />
              </div>
            </div>
            <span
              className="font-mono text-sm font-semibold shrink-0"
              style={{ color: '#00ff88' }}
            >
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => isComplete && navigate(`/reports/${scanId}`)}
          disabled={!isComplete}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#a0a0b8',
          }}
          onMouseEnter={(e) => {
            if (isComplete) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#a0a0b8';
          }}
        >
          <FileText size={16} />
          <span className="hidden sm:inline">Ver Relatorio</span>
        </button>

        {isComplete ? (
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,240,255,0.4)',
              color: '#00f0ff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,240,255,0.08)';
              e.currentTarget.style.borderColor = '#00f0ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(0,240,255,0.4)';
            }}
          >
            <Play size={16} />
            <span className="hidden sm:inline">Novo Escaneamento</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,240,255,0.4)',
              color: '#00f0ff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,240,255,0.08)';
              e.currentTarget.style.borderColor = '#00f0ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(0,240,255,0.4)';
            }}
          >
            <Play size={16} />
            <span className="hidden sm:inline">Retomar</span>
          </button>
        ) : (
          <>
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,240,255,0.4)',
                color: '#00f0ff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,240,255,0.08)';
                e.currentTarget.style.borderColor = '#00f0ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(0,240,255,0.4)';
              }}
            >
              <Pause size={14} />
              <span className="hidden sm:inline">Pausar</span>
            </button>
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: 'rgba(255,0,68,0.15)',
                border: '1px solid rgba(255,0,68,0.4)',
                color: '#ff0044',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,0,68,0.25)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255,0,68,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,0,68,0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Square size={14} />
              <span className="hidden sm:inline">Parar</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(ScanHeaderInner);
