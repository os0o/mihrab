import { LABELS, type DayTimes, type TimelineKey } from "@/lib/prayer";

const W = 360;
const HORIZON = 138;
const CX = W / 2;
const RX = 150;
const RY = 112; // قوس النهار
const NIGHT_RY = 24; // قوس الليل تحت الأفق

// النهار يتحرك من الشروق (يمينًا، الشرق في الاتجاه العربي) إلى المغرب (يسارًا)
function dayPoint(t: number) {
  const a = Math.PI * Math.min(1, Math.max(0, t));
  return { x: CX + RX * Math.cos(a), y: HORIZON - RY * Math.sin(a) };
}

// الليل يعود من المغرب إلى الشروق تحت الأفق
function nightPoint(t: number) {
  const a = Math.PI * Math.min(1, Math.max(0, t));
  return { x: CX - RX * Math.cos(a), y: HORIZON + NIGHT_RY * Math.sin(a) };
}

const frac = (at: Date, from: Date, to: Date) => (at.getTime() - from.getTime()) / (to.getTime() - from.getTime());

export function SunArc({ today, tomorrow, now }: { today: DayTimes; tomorrow: DayTimes; now: Date }) {
  const isDay = now >= today.sunrise && now < today.maghrib;
  // قبل الشروق: الليل بدأ بمغرب الأمس (تقريبًا قبل 24 ساعة من مغرب اليوم)
  const nightStart = now < today.sunrise ? new Date(today.maghrib.getTime() - 86_400_000) : today.maghrib;
  const nightEnd = now < today.sunrise ? today.sunrise : tomorrow.sunrise;
  const nightFajr = now < today.sunrise ? today.fajr : tomorrow.fajr;

  const dayT = frac(now, today.sunrise, today.maghrib);
  const nightT = frac(now, nightStart, nightEnd);
  const body = isDay ? dayPoint(dayT) : nightPoint(nightT);

  const markers: { key: TimelineKey; p: { x: number; y: number }; below?: boolean }[] = [
    { key: "sunrise", p: dayPoint(0) },
    { key: "dhuhr", p: dayPoint(frac(today.dhuhr, today.sunrise, today.maghrib)) },
    { key: "asr", p: dayPoint(frac(today.asr, today.sunrise, today.maghrib)) },
    { key: "maghrib", p: dayPoint(1) },
    { key: "isha", p: nightPoint(frac(today.isha, today.maghrib, tomorrow.sunrise)), below: true },
    { key: "fajr", p: nightPoint(frac(nightFajr, nightStart, nightEnd)), below: true },
  ];

  const progressEnd = dayPoint(dayT);
  const dayArc = `M ${CX + RX} ${HORIZON} A ${RX} ${RY} 0 0 0 ${CX - RX} ${HORIZON}`;
  const nightArc = `M ${CX - RX} ${HORIZON} A ${RX} ${NIGHT_RY} 0 0 0 ${CX + RX} ${HORIZON}`;
  const percent = Math.round((isDay ? dayT : nightT) * 100);

  return (
    <svg
      viewBox={`0 0 ${W} 178`}
      role="img"
      aria-label={isDay ? `الشمس قطعت ${percent}٪ من النهار` : `مضى ${percent}٪ من الليل`}
      className="w-full overflow-visible"
    >
      <defs>
        <radialGradient id="sun-glow">
          <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
        </radialGradient>
        <mask id="crescent">
          <rect x="-20" y="-20" width="40" height="40" fill="#fff" />
          <circle cx="5" cy="-4" r="9" fill="#000" />
        </mask>
      </defs>

      <path d={dayArc} fill="none" stroke="var(--fg)" strokeOpacity="0.28" strokeWidth="1.25" strokeDasharray="2 5" />
      {isDay && (
        <path
          d={`M ${CX + RX} ${HORIZON} A ${RX} ${RY} 0 0 0 ${progressEnd.x} ${progressEnd.y}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
      <path d={nightArc} fill="none" stroke="var(--fg)" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 5" />
      <line x1="0" x2={W} y1={HORIZON} y2={HORIZON} stroke="var(--fg)" strokeOpacity="0.35" strokeWidth="1" />

      {markers.map(({ key, p, below }) => (
        <g key={key}>
          <circle cx={p.x} cy={p.y} r="3" fill="var(--fg)" fillOpacity={below ? 0.5 : 0.75} />
          <text
            x={p.x}
            y={below ? p.y + 16 : p.y - 10}
            textAnchor="middle"
            fontSize="10.5"
            fill="var(--fg)"
            fillOpacity="0.72"
          >
            {LABELS[key]}
          </text>
        </g>
      ))}

      {isDay ? (
        <g transform={`translate(${body.x} ${body.y})`}>
          <circle r="30" fill="url(#sun-glow)" />
          <circle r="10" fill="var(--sun)" />
        </g>
      ) : (
        <g transform={`translate(${body.x} ${body.y - 2})`}>
          <circle r="22" fill="url(#sun-glow)" opacity="0.6" />
          <circle r="9" fill="var(--fg)" mask="url(#crescent)" />
        </g>
      )}
    </svg>
  );
}
