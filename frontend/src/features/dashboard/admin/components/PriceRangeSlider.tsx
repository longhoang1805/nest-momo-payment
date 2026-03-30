const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

export function PriceRangeSlider({
  min,
  max,
  value,
  step = 10000,
  onChange,
}: {
  min: number
  max: number
  value: [number, number]
  step?: number
  onChange: (v: [number, number]) => void
}) {
  const [lo, hi] = value
  const range = max - min || 1
  const pctLo = ((lo - min) / range) * 100
  const pctHi = ((hi - min) / range) * 100

  return (
    <>
      <style>{`
        .price-slider {
          -webkit-appearance: none;
          appearance: none;
          position: absolute;
          width: 100%;
          height: 4px;
          background: transparent;
          pointer-events: none;
          outline: none;
        }
        .price-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: all;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: transform 0.1s;
        }
        .price-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .price-slider::-moz-range-thumb {
          pointer-events: all;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        }
      `}</style>
      <div className="relative w-full pt-2 pb-1">
        {/* Track */}
        <div className="relative h-1.5 w-full bg-slate-200 rounded-full">
          {/* Left inactive segment */}
          <div
            className="absolute h-full bg-slate-200 rounded-l-full"
            style={{ left: 0, width: `${pctLo}%` }}
          />
          {/* Active segment between thumbs */}
          <div
            className="absolute h-full bg-primary rounded-full"
            style={{ left: `${pctLo}%`, width: `${pctHi - pctLo}%` }}
          />
          {/* Right inactive segment */}
          <div
            className="absolute h-full bg-slate-200 rounded-r-full"
            style={{ left: `${pctHi}%`, right: 0 }}
          />
        </div>
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi - step)
            onChange([v, hi])
          }}
          className="price-slider"
          style={{ zIndex: lo >= hi - step ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo + step)
            onChange([lo, v])
          }}
          className="price-slider"
          style={{ zIndex: 4 }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-1">
        <span className="text-sm font-medium text-primary">{fmt(lo)}</span>
        <span className="text-sm font-medium text-primary">{fmt(hi)}</span>
      </div>
    </>
  )
}
