'use client';

export default function JungleBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* ── Sunbeam & Sky Gradient ──────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#38bdf8] via-[#7dd3fc] to-[#fef08a]" />

      {/* Sun with rotating rays */}
      <div className="absolute -top-16 -right-16 h-72 w-72 sm:h-96 sm:w-96">
        <div className="absolute inset-0 rounded-full bg-yellow-300/40 blur-3xl animate-pulse" />
        <div className="sun-spin absolute inset-0 opacity-25">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={i}
                x1="100"
                y1="100"
                x2="100"
                y2="10"
                stroke="#fef08a"
                strokeWidth="10"
                strokeLinecap="round"
                transform={`rotate(${i * 30} 100 100)`}
              />
            ))}
          </svg>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-gradient-to-br from-yellow-200 to-amber-400 shadow-[0_0_50px_rgba(250,204,21,0.6)]" />
      </div>

      {/* ── Drifting Cartoon Clouds ─────────────────────── */}
      <div className="cloud-drift-slow absolute top-12 left-[-150px] opacity-75">
        <svg width="180" height="70" viewBox="0 0 180 70" fill="#ffffff">
          <path d="M 30 50 A 20 20 0 0 1 65 35 A 30 30 0 0 1 125 35 A 25 25 0 0 1 155 50 A 15 15 0 0 1 145 65 L 30 65 A 15 15 0 0 1 30 50 Z" />
        </svg>
      </div>

      <div className="cloud-drift-fast absolute top-28 left-[-200px] opacity-60">
        <svg width="240" height="90" viewBox="0 0 240 90" fill="#ffffff">
          <path d="M 40 65 A 25 25 0 0 1 85 45 A 40 40 0 0 1 165 45 A 30 30 0 0 1 205 65 A 20 20 0 0 1 190 85 L 40 85 A 20 20 0 0 1 40 65 Z" />
        </svg>
      </div>

      {/* ── Distant Tropical Mountains Layer ─────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-80 sm:h-96 opacity-45">
        <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M 0 400 L 0 250 Q 200 120 400 240 T 800 220 Q 1000 130 1200 260 L 1200 400 Z"
            fill="#15803d"
          />
          <path
            d="M 0 400 L 0 300 Q 300 200 600 310 T 1200 290 L 1200 400 Z"
            fill="#166534"
          />
        </svg>
      </div>

      {/* ── Foreground Lush Jungle Canopy & Palm Leaves ─── */}
      {/* Top Left Hanging Vines */}
      <div className="vine-sway-left absolute -top-4 -left-6 w-48 sm:w-64 opacity-90">
        <svg viewBox="0 0 200 240" fill="none">
          {/* Vine rope */}
          <path
            d="M 20 0 Q 60 70 30 140 T 70 230"
            stroke="#451a03"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Leaves */}
          <path d="M 30 60 C 10 50, 0 70, 20 80 C 40 80, 40 60, 30 60 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
          <path d="M 45 100 C 70 90, 80 110, 60 120 C 40 120, 35 100, 45 100 Z" fill="#16a34a" stroke="#14532d" strokeWidth="2" />
          <path d="M 35 150 C 15 140, 5 160, 25 170 C 45 170, 45 150, 35 150 Z" fill="#4ade80" stroke="#14532d" strokeWidth="2" />
          <path d="M 65 190 C 90 180, 100 200, 80 210 C 60 210, 55 190, 65 190 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
          {/* Hanging Banana on vine */}
          <g transform="translate(62, 215) rotate(20)">
            <path
              d="M 0 0 C 10 -4, 20 6, 22 18 C 18 15, 8 8, 0 0 Z"
              fill="#facc15"
              stroke="#854d0e"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>

      {/* Top Right Hanging Vines */}
      <div className="vine-sway-right absolute -top-4 -right-6 w-48 sm:w-64 opacity-90">
        <svg viewBox="0 0 200 240" fill="none">
          <path
            d="M 180 0 Q 140 70 170 140 T 130 220"
            stroke="#451a03"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M 165 50 C 140 40, 130 60, 150 70 C 170 70, 175 50, 165 50 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
          <path d="M 155 110 C 180 100, 190 120, 170 130 C 150 130, 145 110, 155 110 Z" fill="#16a34a" stroke="#14532d" strokeWidth="2" />
          <path d="M 160 160 C 135 150, 125 170, 145 180 C 165 180, 170 160, 160 160 Z" fill="#4ade80" stroke="#14532d" strokeWidth="2" />
        </svg>
      </div>

      {/* ── Floating Cartoon Bananas with Wings ─────────── */}
      <div className="banana-float-1 absolute top-[25%] left-[8%] opacity-70">
        <div className="animate-spin-slow">🍌</div>
      </div>
      <div className="banana-float-2 absolute top-[60%] right-[10%] opacity-65">
        <div className="animate-bounce-slow">🍌</div>
      </div>
      <div className="banana-float-3 absolute top-[40%] right-[22%] opacity-60">
        <span className="text-xl">✨</span>
      </div>
      <div className="banana-float-1 absolute top-[70%] left-[18%] opacity-60">
        <span className="text-xl">⭐</span>
      </div>

      {/* Bottom Jungle Plants Silhouette */}
      <div className="absolute -bottom-8 left-0 right-0 h-28 sm:h-36 opacity-95">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M 0 120 L 0 60 Q 60 10 120 70 Q 180 20 240 80 Q 320 0 400 70 Q 480 20 560 80 Q 640 10 720 70 Q 800 20 880 80 Q 960 0 1040 70 Q 1120 20 1200 60 L 1200 120 Z"
            fill="#14532d"
          />
          <path
            d="M 0 120 L 0 85 Q 100 40 200 90 Q 350 45 500 95 Q 650 35 800 90 Q 950 45 1100 95 L 1200 85 L 1200 120 Z"
            fill="#052e16"
          />
        </svg>
      </div>

      <style jsx>{`
        @keyframes sun-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .sun-spin {
          animation: sun-spin 60s linear infinite;
        }

        @keyframes cloud-drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(100vw + 350px)); }
        }
        .cloud-drift-slow {
          animation: cloud-drift 45s linear infinite;
        }
        .cloud-drift-fast {
          animation: cloud-drift 30s linear infinite 5s;
        }

        @keyframes vine-sway-l {
          0%, 100% { transform: rotate(0deg); transform-origin: top left; }
          50% { transform: rotate(4deg); transform-origin: top left; }
        }
        .vine-sway-left {
          animation: vine-sway-l 6s ease-in-out infinite;
        }

        @keyframes vine-sway-r {
          0%, 100% { transform: rotate(0deg); transform-origin: top right; }
          50% { transform: rotate(-5deg); transform-origin: top right; }
        }
        .vine-sway-right {
          animation: vine-sway-r 5.5s ease-in-out infinite;
        }

        @keyframes banana-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(12deg); }
        }
        .banana-float-1 { animation: banana-float 4s ease-in-out infinite; }
        .banana-float-2 { animation: banana-float 5s ease-in-out infinite 1s; }
        .banana-float-3 { animation: banana-float 3.5s ease-in-out infinite 2s; }

        .animate-spin-slow {
          animation: sun-spin 20s linear infinite;
        }
        .animate-bounce-slow {
          animation: banana-float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
