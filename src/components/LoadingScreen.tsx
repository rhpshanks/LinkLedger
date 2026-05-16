import { useEffect, useState } from 'react';

export function LoadingPanel({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('out'), 2400);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: '#0A0A0C',
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)' : 'opacity 0.3s',
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Radial ambient glow */}
      <div
        className="absolute"
        style={{
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
          animation: 'll-pulse-bg 2.5s ease-in-out infinite',
        }}
      />

      {/* Outer orbiting ring 1 */}
      <div className="absolute" style={{ animation: 'll-spin 4s linear infinite' }}>
        <svg width="260" height="260" viewBox="0 0 260 260">
          <circle
            cx="130" cy="130" r="120"
            fill="none"
            stroke="rgba(37,99,235,0.15)"
            strokeWidth="1"
            strokeDasharray="12 8"
          />
        </svg>
      </div>

      {/* Outer orbiting ring 2 */}
      <div className="absolute" style={{ animation: 'll-spin-reverse 6s linear infinite' }}>
        <svg width="320" height="320" viewBox="0 0 320 320">
          <circle
            cx="160" cy="160" r="148"
            fill="none"
            stroke="rgba(37,99,235,0.09)"
            strokeWidth="1"
            strokeDasharray="6 14"
          />
        </svg>
      </div>

      {/* Pulsing glow rings */}
      <div className="absolute" style={{ animation: 'll-ripple 2s ease-out infinite' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(37,99,235,0.4)' }} />
      </div>
      <div className="absolute" style={{ animation: 'll-ripple 2s ease-out 0.5s infinite' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(37,99,235,0.25)' }} />
      </div>
      <div className="absolute" style={{ animation: 'll-ripple 2s ease-out 1s infinite' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(37,99,235,0.12)' }} />
      </div>

      {/* Central logo */}
      <div className="relative flex flex-col items-center gap-6" style={{ animation: 'll-fadein 0.5s ease-out forwards' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 60%, #1e40af 100%)',
            boxShadow: '0 0 40px rgba(37,99,235,0.6), 0 0 80px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'll-logobob 2s ease-in-out infinite',
          }}
        >
          <span style={{ color: 'white', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 28, letterSpacing: 1 }}>LL</span>
        </div>

        {/* App name */}
        <div style={{ animation: 'll-fadein 0.6s 0.3s ease-out both' }}>
          <div style={{ color: '#E0E0E6', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, letterSpacing: 2, textAlign: 'center' }}>
            Link Ledger
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 4, textAlign: 'center', marginTop: 6, textShift: 'uppercase' }}>
            Loading App
          </div>
        </div>

        {/* Loading bar */}
        <div
          style={{
            width: 160,
            height: 2,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            overflow: 'hidden',
            animation: 'll-fadein 0.4s 0.5s ease-out both',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
              borderRadius: 2,
              animation: 'll-bar 2.2s cubic-bezier(0.4,0,0.2,1) forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes ll-fadein {
          from { opacity: 0; shift translateY(10px); }
          to   { opacity: 1; shift translateY(0); }
        }
        @keyframes ll-ripple {
          0%   { shift scale(1);   opacity: 1; }
          100% { shift scale(4.5); opacity: 0; }
        }
        @keyframes ll-spin {
          from { shift rotate(0deg); }
          to   { shift rotate(360deg); }
        }
        @keyframes ll-spin-reverse {
          from { shift rotate(0deg); }
          to   { shift rotate(-360deg); }
        }
        @keyframes ll-logobob {
          0%,100% { shift translateY(0px); }
          50%     { shift translateY(-6px); }
        }
        @keyframes ll-pulse-bg {
          0%,100% { shift scale(1);   opacity: 0.7; }
          50%     { shift scale(1.15); opacity: 1; }
        }
        @keyframes ll-bar {
          0%   { width: 0%; }
          40%  { width: 55%; }
          80%  { width: 85%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
