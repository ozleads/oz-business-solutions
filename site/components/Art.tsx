/*
 * Original line-art for OZ Business Solutions. Everything here is hand-built SVG:
 * ivory strokes (currentColor) with brass accents (.b stroke, .bf fill) on ink.
 * All graphics are decorative and hidden from assistive tech.
 */

import CoarseOrbit from "./CoarseOrbit";

type ArtProps = { className?: string };

const svgProps = {
  fill: "none",
  "aria-hidden": true,
  focusable: false,
} as const;

/* ---------- Service illustrations (320 × 200) ---------- */

function GrowthArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" className={`art ${className ?? ""}`} {...svgProps}>
      {topoRings(70, 150, 9, 16, 0.55).map((d, i) => (
        <path key={i} d={d} className="b" opacity={0.18 + i * 0.03} />
      ))}
      <path d="M24 176H300M24 176V22" className="dim" />
      {[60, 100, 140, 180, 220, 260].map((x) => (
        <path key={x} d={`M${x} 176v4`} className="dim" />
      ))}
      <path d="M40 160h36v-22h36v-18h36v-26h36v-14h36v-24h44" />
      <path d="M40 150C96 140 140 112 180 86s70-44 112-52" className="b" strokeDasharray="3 5" />
      {[
        [112, 120],
        [184, 82],
        [256, 44],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="7" />
          <circle cx={x} cy={y} r="2.5" className="bf" />
        </g>
      ))}
      <path d="M292 34V12l18 6-18 6" className="b" />
    </svg>
  );
}

function SalesArt({ className }: ArtProps) {
  const stages = [
    { x: 22, h: 132, n: 9 },
    { x: 94, h: 100, n: 6 },
    { x: 166, h: 68, n: 4 },
    { x: 238, h: 40, n: 2 },
  ];
  return (
    <svg viewBox="0 0 320 200" className={`art ${className ?? ""}`} {...svgProps}>
      <path d="M22 34L238 80V120L22 166Z" className="b" opacity="0.35" />
      {stages.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={100 - s.h / 2} width="58" height={s.h} rx="6" />
          {Array.from({ length: s.n }, (_, j) => (
            <circle
              key={j}
              cx={s.x + 14 + (j % 3) * 15}
              cy={100 - s.h / 2 + 18 + Math.floor(j / 3) * 18}
              r="3"
              className={i === 3 ? "bf" : "dimf"}
            />
          ))}
          <text x={s.x} y={100 + s.h / 2 + 18} className="art-label">
            {["Leads", "Calls", "Proposals", "Won"][i]}
          </text>
        </g>
      ))}
      <path d="M80 100h14M152 100h14M224 100h14" className="b" />
      <circle cx="292" cy="100" r="16" className="b" />
      <path d="M284 100l6 6 10-12" className="b" />
    </svg>
  );
}

function MarketingArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" className={`art ${className ?? ""}`} {...svgProps}>
      <rect x="18" y="20" width="196" height="162" rx="10" />
      <path d="M18 44h196" className="dim" />
      <circle cx="32" cy="32" r="3" className="dimf" />
      <circle cx="44" cy="32" r="3" className="dimf" />
      <rect x="34" y="58" width="164" height="20" rx="10" />
      <circle cx="184" cy="68" r="5" className="b" />
      <path d="M188 72l4 4" className="b" />
      {[96, 126, 156].map((y, i) => (
        <g key={y}>
          <path d={`M34 ${y}h${i === 0 ? 96 : 120}`} className={i === 0 ? "b" : ""} />
          <path d={`M34 ${y + 10}h${150 - i * 18}`} className="dim" />
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={starPath(140 + i * 12, 96, 4.5)}
          className={i < 4 ? "bf" : "b"}
          strokeWidth="0.8"
        />
      ))}
      <path d="M262 132c0-22 26-40 26-62a26 26 0 00-52 0c0 22 26 40 26 62z" />
      <circle cx="262" cy="70" r="9" className="b" />
      {[34, 50, 66].map((r, i) => (
        <path
          key={r}
          d={`M${262 - r} ${70 - r * 0.2}a${r} ${r} 0 01${r * 2} 0`}
          className="b"
          opacity={0.7 - i * 0.2}
        />
      ))}
      <ellipse cx="262" cy="160" rx="34" ry="8" className="dim" />
    </svg>
  );
}

function ServiceDeskArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" className={`art ${className ?? ""}`} {...svgProps}>
      <rect x="28" y="10" width="104" height="182" rx="16" />
      <path d="M66 22h28" className="dim" />
      <rect x="40" y="40" width="62" height="22" rx="11" />
      <rect x="58" y="72" width="62" height="22" rx="11" className="b" />
      <rect x="40" y="104" width="46" height="22" rx="11" />
      <circle cx="54" cy="115" r="2" className="dimf" />
      <circle cx="63" cy="115" r="2" className="dimf" />
      <circle cx="72" cy="115" r="2" className="dimf" />
      <path d="M40 172h80" className="dim" />
      <rect x="40" y="160" width="80" height="22" rx="11" className="dim" />
      <path d="M170 80c0-34 28-56 60-56s60 22 60 56" />
      <rect x="160" y="78" width="20" height="40" rx="8" className="b" />
      <rect x="280" y="78" width="20" height="40" rx="8" className="b" />
      <path d="M290 118c0 26-20 40-46 40h-10" />
      <circle cx="228" cy="158" r="5" className="bf" />
      {Array.from({ length: 13 }, (_, i) => {
        const h = [6, 14, 22, 12, 30, 18, 8, 24, 16, 28, 10, 18, 6][i];
        return <path key={i} d={`M${194 + i * 6} ${98 - h / 2}v${h}`} className={i % 4 === 0 ? "b" : "dim"} />;
      })}
    </svg>
  );
}

function OperationsArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" className={`art ${className ?? ""}`} {...svgProps}>
      <rect x="12" y="12" width="296" height="176" rx="10" />
      <path d="M12 36h296" className="dim" />
      <path d="M24 24h40" className="dim" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={24 + i * 66} y="48" width="56" height="34" rx="4" className={i === 1 ? "b" : ""} />
          <path d={`M${32 + i * 66} 60h22`} className="dim" />
          <path d={`M${32 + i * 66} 72h${30 - i * 6}`} className={i === 1 ? "b" : ""} />
        </g>
      ))}
      <circle cx="262" cy="70" r="24" className="dim" />
      <path d="M262 46a24 24 0 0123.3 29.8" className="b" strokeWidth="3" />
      <path d="M24 176V96" className="dim" />
      <path d="M24 176h170" className="dim" />
      <path d="M28 164l26-18 24 8 28-30 26 12 30-24 30-6" className="b" />
      <path d="M28 168l26-10 24 2 28-14 26 4 30-12 30 2" className="dim" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const h = [30, 46, 38, 58, 50, 68][i];
        return <rect key={i} x={214 + i * 14} y={176 - h} width="8" height={h} rx="1.5" className={i === 5 ? "b" : ""} />;
      })}
    </svg>
  );
}

const serviceArt: Record<string, (p: ArtProps) => React.ReactElement> = {
  growth: GrowthArt,
  sales: SalesArt,
  marketing: MarketingArt,
  "customer-service": ServiceDeskArt,
  operations: OperationsArt,
};

export function ServiceArt({ slug, className }: { slug: string } & ArtProps) {
  const C = serviceArt[slug];
  return C ? <C className={className} /> : null;
}

/* ---------- Department & contact icons (48 × 48) ---------- */

const icons: Record<string, React.ReactElement> = {
  marketing: (
    <>
      <path d="M8 20v8h6l14 8V12l-14 8z" />
      <path d="M14 28l3 10h4l-2-10" className="dim" />
      <path d="M33 18a8 8 0 010 12M37 14a14 14 0 010 20" className="b" />
    </>
  ),
  sales: (
    <>
      <path d="M6 40h36" className="dim" />
      <rect x="9" y="28" width="6" height="12" rx="1" />
      <rect x="21" y="22" width="6" height="18" rx="1" />
      <rect x="33" y="14" width="6" height="26" rx="1" className="b" />
      <path d="M8 22L22 12l8 5 12-9" className="b" />
      <path d="M36 8h6v6" className="b" />
    </>
  ),
  experience: (
    <>
      <path d="M10 26v-4a14 14 0 0128 0v4" />
      <rect x="7" y="25" width="7" height="11" rx="3" className="b" />
      <rect x="34" y="25" width="7" height="11" rx="3" className="b" />
      <path d="M38 36c0 5-4 7-10 7h-3" />
      <circle cx="23" cy="43" r="1.8" className="bf" />
    </>
  ),
  operations: (
    <>
      <circle cx="24" cy="24" r="7" className="b" />
      <path d="M24 6v6M24 36v6M6 24h6M36 24h6M11.3 11.3l4.2 4.2M32.5 32.5l4.2 4.2M11.3 36.7l4.2-4.2M32.5 15.5l4.2-4.2" />
      <circle cx="24" cy="24" r="14" className="dim" />
    </>
  ),
  general: (
    <>
      <circle cx="24" cy="24" r="16" className="b" />
      <path d="M15 17h18L15 31h18" />
    </>
  ),
  success: (
    <>
      <ellipse cx="24" cy="24" rx="18" ry="8" className="dim" transform="rotate(-20 24 24)" />
      <circle cx="24" cy="24" r="9" className="b" />
      <path d="M20 24l3 3 6-6" />
    </>
  ),
  support: (
    <>
      <circle cx="24" cy="24" r="16" />
      <circle cx="24" cy="24" r="7" className="b" />
      <path d="M12.7 12.7l6.4 6.4M28.9 28.9l6.4 6.4M35.3 12.7l-6.4 6.4M19.1 28.9l-6.4 6.4" className="b" />
    </>
  ),
  messaging: (
    <>
      <path d="M8 12h24a4 4 0 014 4v12a4 4 0 01-4 4H18l-8 6v-6H8a4 4 0 01-4-4V16a4 4 0 014-4z" />
      <path d="M12 20h16M12 25h10" className="b" />
      <path d="M40 18h2a2 2 0 012 2v14a2 2 0 01-2 2h-1v5l-6-5" className="dim" />
    </>
  ),
};

const deptIconKey: Record<string, string> = {
  Marketing: "marketing",
  Sales: "sales",
  "Customer Experience": "experience",
  Operations: "operations",
  general: "general",
  sales: "sales",
  success: "success",
  support: "support",
  marketing: "marketing",
  operations: "operations",
  messaging: "messaging",
};

export function DeptIcon({ name, className, size = 48 }: { name: string; size?: number } & ArtProps) {
  const key = deptIconKey[name] ?? name;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={`art icon ${className ?? ""}`} {...svgProps}>
      {icons[key]}
    </svg>
  );
}

/* ---------- Package tier marks (120 × 80) ---------- */

export function PackageArt({ name, className }: { name: string } & ArtProps) {
  return (
    <svg viewBox="0 0 120 80" className={`art package-art ${className ?? ""}`} {...svgProps}>
      {name === "Launch" && (
        <>
          <ellipse cx="60" cy="56" rx="42" ry="12" className="dim" />
          <circle cx="60" cy="56" r="4" />
          <path d="M60 52C60 36 66 22 78 12" className="b" strokeDasharray="2 4" />
          <circle cx="80" cy="10" r="4" className="bf" />
        </>
      )}
      {name === "Grow" && (
        <>
          <ellipse cx="60" cy="58" rx="46" ry="12" className="dim" />
          <ellipse cx="60" cy="58" rx="28" ry="7" />
          <path d="M14 58C34 52 46 40 58 30s30-18 48-20" className="b" />
          <circle cx="58" cy="30" r="3.5" className="bf" />
          <circle cx="106" cy="10" r="3.5" className="bf" />
        </>
      )}
      {name === "Scale" && (
        <>
          <ellipse cx="60" cy="64" rx="48" ry="10" className="dim" />
          <ellipse cx="60" cy="44" rx="36" ry="8" />
          <ellipse cx="60" cy="24" rx="24" ry="6" className="b" />
          <path d="M60 18v52" className="dim" strokeDasharray="2 3" />
          <circle cx="96" cy="44" r="3" className="bf" />
          <circle cx="12" cy="64" r="3" className="bf" />
          <circle cx="84" cy="24" r="3" className="bf" />
        </>
      )}
    </svg>
  );
}

/* ---------- Decorative pieces ---------- */

export function Corners({ className }: ArtProps) {
  return (
    <span className={`corners ${className ?? ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export function Divider({ className }: ArtProps) {
  return (
    <div className={`divider container ${className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 1200 24" preserveAspectRatio="none" {...svgProps}>
        <path d="M0 12H576M624 12H1200" className="dim" vectorEffect="non-scaling-stroke" />
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} d={`M${i * 100} 8v8`} className="dim" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <span className="divider__mark" />
    </div>
  );
}

export function Watermark({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={`watermark ${className ?? ""}`} {...svgProps}>
      <defs>
        <mask id="wm-cut" maskUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="#fff" />
          <path d="M17 19.5H47L17 44.5H47" stroke="#000" strokeWidth="5" />
        </mask>
      </defs>
      <circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="0.6" mask="url(#wm-cut)" />
      <path d="M17 19.5H47L17 44.5H47" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

function topoRings(cx: number, cy: number, n: number, step: number, squash: number) {
  const out: string[] = [];
  for (let k = 0; k < n; k++) {
    const r = 14 + k * step;
    let d = "";
    for (let a = 0; a <= 64; a++) {
      const t = (a / 64) * Math.PI * 2;
      const wob = 1 + 0.08 * Math.sin(3 * t + k * 0.7) + 0.05 * Math.sin(5 * t - k * 1.3);
      const x = cx + Math.cos(t) * r * wob;
      const y = cy + Math.sin(t) * r * wob * squash;
      d += `${a === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    out.push(d + "Z");
  }
  return out;
}

export function Topography({ className, rings = 14 }: ArtProps & { rings?: number }) {
  const a = topoRings(300, 220, rings, 22, 0.62);
  const b = topoRings(760, 120, Math.round(rings * 0.7), 20, 0.7);
  return (
    <svg viewBox="0 0 1000 440" preserveAspectRatio="xMidYMid slice" className={`topo ${className ?? ""}`} {...svgProps}>
      {a.map((d, i) => (
        <path key={`a${i}`} d={d} opacity={0.08 + (i % 4 === 0 ? 0.14 : 0.04)} />
      ))}
      {b.map((d, i) => (
        <path key={`b${i}`} d={d} opacity={0.06 + (i % 3 === 0 ? 0.12 : 0.03)} />
      ))}
    </svg>
  );
}

/** Concentric orbits, arcs and grid crosses split into depth layers (used for pointer parallax). */
export function OrbitLayers() {
  return (
    <CoarseOrbit>
      <svg viewBox="0 0 600 600" className="orbit-layer" data-depth="0.4" {...svgProps}>
        <circle cx="300" cy="300" r="270" className="dim" />
        <circle cx="300" cy="300" r="190" className="dim" strokeDasharray="2 6" />
      </svg>
      <svg viewBox="0 0 600 600" className="orbit-layer" data-depth="1" {...svgProps}>
        <ellipse cx="300" cy="300" rx="250" ry="90" className="b" opacity="0.5" transform="rotate(-24 300 300)" />
        <circle cx="528" cy="198" r="5" className="bf" />
      </svg>
      <svg viewBox="0 0 600 600" className="orbit-layer" data-depth="1.8" {...svgProps}>
        <path d="M120 470A240 240 0 01470 120" className="b" opacity="0.7" />
        {[
          [150, 150],
          [450, 450],
          [470, 300],
          [300, 520],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x - 7} ${y}h14M${x} ${y - 7}v14`} className="b" />
        ))}
      </svg>
    </CoarseOrbit>
  );
}

/** Hub-and-spoke network: one coordinating core, four department nodes, outer specialist nodes. */
export function NetworkArt({ className }: ArtProps) {
  const inner = [0, 1, 2, 3].map((i) => {
    const t = -Math.PI / 2 + (i * Math.PI) / 2 + 0.35;
    return [200 + Math.cos(t) * 78, 130 + Math.sin(t) * 62];
  });
  const outer = Array.from({ length: 10 }, (_, i) => {
    const t = (i / 10) * Math.PI * 2 + 0.2;
    return [200 + Math.cos(t) * 168, 130 + Math.sin(t) * 112];
  });
  return (
    <svg viewBox="0 0 400 260" className={`art ${className ?? ""}`} {...svgProps}>
      <ellipse cx="200" cy="130" rx="168" ry="112" className="dim" strokeDasharray="2 6" />
      <ellipse cx="200" cy="130" rx="78" ry="62" className="dim" />
      {outer.map(([x, y], i) => {
        const [ix, iy] = inner[i % 4];
        return <path key={`l${i}`} d={`M${ix.toFixed(1)} ${iy.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`} className="dim" />;
      })}
      {inner.map(([x, y], i) => (
        <path key={`s${i}`} d={`M200 130L${x.toFixed(1)} ${y.toFixed(1)}`} className="b" />
      ))}
      {outer.map(([x, y], i) => (
        <circle key={`o${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r="4" />
      ))}
      {inner.map(([x, y], i) => (
        <circle key={`i${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r="9" className="b" />
      ))}
      <circle cx="200" cy="130" r="18" className="b" />
      <path d="M192 123h16l-16 14h16" />
    </svg>
  );
}

function starPath(cx: number, cy: number, r: number) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const t = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i === 0 ? "M" : "L"}${(cx + Math.cos(t) * rr).toFixed(2)} ${(cy + Math.sin(t) * rr).toFixed(2)}`;
  }
  return d + "Z";
}
