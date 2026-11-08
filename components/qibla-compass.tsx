"use client";

import { useEffect, useState } from "react";
import { angleDelta, normalizeDeg } from "@/lib/qibla";

const R = 140;
const KAABA_R = 100;
const CARDINALS = [
  { deg: 0, label: "ش" },
  { deg: 90, label: "ق" },
  { deg: 180, label: "ج" },
  { deg: 270, label: "غ" },
];

function polar(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
}

// زاوية دوران مستمرة تتجنب لفّة كاملة عند العبور بين 359° و 0°
function useContinuousRotation(target: number) {
  const [rotation, setRotation] = useState(target);
  useEffect(() => {
    setRotation((prev) => prev + angleDelta(normalizeDeg(prev), normalizeDeg(target)));
  }, [target]);
  return rotation;
}

export function QiblaCompass({ bearing, heading, aligned }: { bearing: number; heading: number | null; aligned: boolean }) {
  const rotation = useContinuousRotation(heading === null ? 0 : -heading);
  const kaaba = polar(bearing, KAABA_R);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[330px]">
      {/* مؤشر الهاتف: أعلى الشاشة هو الاتجاه الذي تواجهه */}
      <svg viewBox="-12 0 24 20" aria-hidden className="absolute top-0 left-1/2 z-10 w-6 -translate-x-1/2">
        <path d="M0 20 L-10 0 H10 Z" fill={aligned ? "var(--accent)" : "var(--fg)"} />
      </svg>

      <svg viewBox="-160 -160 320 320" aria-hidden className="size-full pt-4">
        <circle
          r={R + 10}
          fill={aligned ? "var(--accent)" : "var(--surface)"}
          fillOpacity={aligned ? 0.18 : 1}
          stroke="var(--line)"
          className="transition-[fill,fill-opacity] duration-300"
        />
        <g style={{ transform: `rotate(${rotation}deg)` }} className="transition-transform duration-200 ease-out">
          {Array.from({ length: 72 }, (_, i) => {
            const deg = i * 5;
            const major = deg % 30 === 0;
            const a = polar(deg, R);
            const b = polar(deg, R - (major ? 14 : 7));
            return (
              <line
                key={deg}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--fg)"
                strokeOpacity={deg === 0 ? 1 : major ? 0.7 : 0.3}
                strokeWidth={major ? 2 : 1}
              />
            );
          })}
          {CARDINALS.map(({ deg, label }) => {
            const p = polar(deg, R - 32);
            return (
              <text
                key={deg}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={deg === 0 ? 22 : 17}
                fontWeight={700}
                fill="var(--fg)"
                fillOpacity={deg === 0 ? 1 : 0.6}
                // يبقى الحرف قائمًا مهما دار القرص
                style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: `${p.x}px ${p.y}px` }}
                className="transition-transform duration-200 ease-out"
              >
                {label}
              </text>
            );
          })}
          <line x1={0} y1={0} x2={kaaba.x} y2={kaaba.y} stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />
          <g transform={`translate(${kaaba.x} ${kaaba.y}) rotate(${bearing})`}>
            <rect x={-14} y={-14} width={28} height={28} rx={3} fill="#15110c" stroke="var(--accent)" strokeWidth={1.5} />
            <rect x={-14} y={-7} width={28} height={4.5} fill="#d6b25e" />
          </g>
        </g>
        <circle r={6} fill="var(--fg)" />
      </svg>
    </div>
  );
}
