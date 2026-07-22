import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Terminal, ChevronDown, Copy, Download } from 'lucide-react';
import type { LogEntry } from './logData';
import TerminalLine from './TerminalLine';

interface TerminalWindowProps {
  logs: LogEntry[];
  isComplete: boolean;
  isPaused: boolean;
  scanId: string;
  targetUrl: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'completed';
}

function TerminalWindowInner({
  logs,
  isComplete,
  isPaused,
  scanId,
  targetUrl,
  connectionStatus,
}: TerminalWindowProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flashLines, setFlashLines] = useState<Set<number>>(new Set());
  const prevLogCount = useRef(0);

  // Auto-scroll to bottom on new logs (unless user scrolled up)
  useEffect(() => {
    if (terminalRef.current && !userScrolledUp) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, userScrolledUp]);

  // Track which lines are new for flash animation
  useEffect(() => {
    if (logs.length > prevLogCount.current) {
      const newFlashLines = new Set<number>();
      for (let i = prevLogCount.current; i < logs.length; i++) {
        if (logs[i]?.level === 'VULN') {
          newFlashLines.add(i);
        }
      }
      if (newFlashLines.size > 0) {
        setFlashLines(newFlashLines);
        setTimeout(() => setFlashLines(new Set()), 900);
      }
      prevLogCount.current = logs.length;
    }
  }, [logs]);

  const handleScroll = useCallback(() => {
    if (!terminalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    setUserScrolledUp(!isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      setUserScrolledUp(false);
    }
  }, []);

  const copyToClipboard = useCallback(async () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.agent}] ${l.level}: ${l.message}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [logs]);

  const exportLogs = useCallback(() => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.agent}] ${l.level}: ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strix-scan-${scanId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs, scanId]);

  const statusConfig = {
    connecting: { dot: '#ffb800', text: 'CONECTANDO', pulse: false },
    connected: { dot: '#00ff88', text: 'AO VIVO', pulse: true },
    disconnected: { dot: '#ff0044', text: 'DESCONECTADO', pulse: false },
    completed: { dot: '#00ff88', text: 'CONCLUIDO', pulse: false },
  };

  const status = statusConfig[connectionStatus];

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        border: '1px solid rgba(0,255,136,0.12)',
        height: 'calc(100vh - 220px)',
        minHeight: 500,
      }}
    >
      {/* Terminal Top Bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: 40,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #12121a 100%)',
        }}
      >
        {/* Left: Three dots */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: '#ff5f57' }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: '#febc2e' }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: '#28c840' }}
            />
          </div>
        </div>

        {/* Center: Title */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <Terminal size={14} color="#6a6a82" />
          <span className="font-mono text-xs" style={{ color: '#a0a0b8' }}>
            strixguard scan
          </span>
          <span className="font-mono text-xs" style={{ color: '#4a4a5e' }}>
            —
          </span>
          <span
            className="font-mono text-xs truncate max-w-[200px]"
            style={{ color: '#00f0ff' }}
          >
            {targetUrl}
          </span>
        </div>

        {/* Right: Connection status + actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={copyToClipboard}
            className="p-1 rounded transition-colors duration-200 hover:bg-white/5"
            title="Copiar logs"
          >
            <Copy size={12} color={copied ? '#00ff88' : '#6a6a82'} />
          </button>
          <button
            onClick={exportLogs}
            className="p-1 rounded transition-colors duration-200 hover:bg-white/5"
            title="Exportar logs"
          >
            <Download size={12} color="#6a6a82" />
          </button>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: status.dot,
                animation: status.pulse ? 'livePulse 1.5s ease-in-out infinite' : undefined,
              }}
            />
            <span
              className="font-mono text-[0.6875rem] font-medium"
              style={{ color: status.dot }}
            >
              {status.text}
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="relative flex-1 overflow-hidden">
        {/* CRT Scanline Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 6px)',
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%)',
          }}
        />

        {/* Scrollable content */}
        <div
          ref={terminalRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto font-mono p-4 pb-6"
          style={{
            background: '#08080e',
            scrollbarWidth: 'thin',
            scrollbarColor: '#1a1a2e transparent',
          }}
        >
          {logs.map((log, i) => (
            <TerminalLine
              key={`${log.timestamp}-${i}`}
              log={log}
              isNew={flashLines.has(i)}
            />
          ))}

          {/* Typing cursor */}
          {!isComplete && !isPaused && (
            <div className="font-mono text-[0.8125rem] mt-1 flex items-center">
              <span style={{ color: '#4a4a5e' }}>
                [{new Date().toLocaleTimeString('pt-BR', { hour12: false })}]
              </span>
              <span className="ml-2" style={{ color: '#00ff88' }}>
                <span
                  style={{
                    animation: 'cursorBlink 530ms steps(1) infinite',
                  }}
                >
                  _
                </span>
              </span>
            </div>
          )}

          {isPaused && (
            <div className="font-mono text-[0.8125rem] mt-1" style={{ color: '#ffb800' }}>
              [ESCANEAMENTO PAUSADO]
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {userScrolledUp && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: '#1a1a2e',
              border: '1px solid rgba(0,240,255,0.3)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              animation: 'fadeSlideUp 200ms ease-out',
            }}
          >
            <ChevronDown size={18} color="#00f0ff" />
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(TerminalWindowInner);
