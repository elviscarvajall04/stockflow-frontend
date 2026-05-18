const pulse = {
  "@keyframes pulse": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.4 },
  },
};

export function Skeleton({ width = "100%", height = 16, variant = "text", style = {} }) {
  const base = {
    background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
    backgroundSize: "200% 100%",
    animation: "pulse 1.5s ease-in-out infinite",
    borderRadius: variant === "circle" ? "50%" : variant === "rect" ? 8 : 4,
    width,
    height,
    ...style,
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={base} />
    </>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
    }}>
      <div style={{
        display: "flex", gap: 24, padding: "16px 20px",
        borderBottom: "1px solid #f1f5f9", background: "#fafafa",
      }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${100 / cols}%`} height={12} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{
          display: "flex", gap: 24, padding: "16px 20px",
          borderBottom: r < rows - 1 ? "1px solid #f8fafc" : "none",
        }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${100 / cols}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 28,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
    }}>
      <Skeleton width="40%" height={22} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: 24 }} />
      <div style={{ display: "flex", gap: 12 }}>
        <Skeleton width={120} height={40} variant="rect" />
        <Skeleton width={120} height={40} variant="rect" />
      </div>
    </div>
  );
}
