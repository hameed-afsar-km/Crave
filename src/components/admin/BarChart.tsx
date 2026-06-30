'use client';

import { useId } from 'react';

function formatValue(v: number): string {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

export function BarChart({
  data,
  color = '#d4af37',
  className = 'w-full h-auto mt-2',
}: {
  data: { label: string; value: number }[];
  color?: string;
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, '');
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 36;
  const gap = 12;
  const chartH = 150;
  const topGap = 20;
  const bottomGap = 28;
  const gridSteps = 4;
  const viewW = Math.max(data.length * (barW + gap) + 24, 260);
  const viewH = chartH + bottomGap + topGap;

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} className={className} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`bg_${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {Array.from({ length: gridSteps }, (_, i) => {
        const y = topGap + (chartH / gridSteps) * i;
        return (
          <line key={`g${i}`} x1="0" y1={y} x2={viewW} y2={y} stroke="#27272a" strokeWidth="0.5" />
        );
      })}
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * chartH, 2);
        const x = i * (barW + gap) + gap / 2 + 12;
        const y = topGap + chartH - barH;
        const isActive = d.value > 0;
        return (
          <g key={i} className="group">
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={barW / 2}
              ry={barW / 2}
              fill={`url(#bg_${gradientId})`}
              className="transition-all duration-300"
              style={{ opacity: isActive ? 1 : 0.25 }}
            >
              <title>{d.label}: {d.value.toLocaleString('en-IN')}</title>
            </rect>
            <text x={x + barW / 2} y={topGap + chartH + 16} textAnchor="middle" fill="#52525b" fontSize="9" fontFamily="inherit">
              {d.label}
            </text>
            {isActive && (
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fill="#e4e4e7"
                fontSize="10"
                fontFamily="inherit"
                fontWeight="600"
                className="group-hover:opacity-100 transition-opacity"
              >
                {formatValue(d.value)}
              </text>
            )}
          </g>
        );
      })}

    </svg>
  );
}
