type Props = { value: number; size?: number };

export default function Stars({ value, size = 16 }: Props) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const total = 5;
  const stars = Array.from({ length: total }, (_, i) => i < full ? "full" : i === full && hasHalf ? "half" : "empty");
  return (
    <div className="inline-flex items-center" aria-label={`${value} out of 5 stars`}>
      {stars.map((s, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={s === "empty" ? "none" : "#FFD166"}
          stroke="#FFD166"
          strokeWidth="2"
          className="-mr-0.5"
        >
          {s === "half" ? (
            <defs>
              <linearGradient id={`half-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="50%" stopColor="#FFD166" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          ) : null}
          <path
            fill={s === "half" ? `url(#half-${i})` : s === "full" ? "#FFD166" : "none"}
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      ))}
    </div>
  );
}
