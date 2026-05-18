export default function Pagination({ page, totalPages, total, limit, onChange }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div style={styles.wrapper}>
      <span style={styles.info}>
        Mostrando {from}–{to} de {total}
      </span>
      <div style={styles.buttons}>
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} style={btnStyle(page <= 1)}>
          ‹ Anterior
        </button>
        {start > 1 && (
          <>
            <button onClick={() => onChange(1)} style={btnStyle(false)}>1</button>
            {start > 2 && <span style={styles.ellipsis}>…</span>}
          </>
        )}
        {pages.map((p) => (
          <button key={p} onClick={() => onChange(p)}
            style={page === p ? styles.activeBtn : btnStyle(false)}>
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span style={styles.ellipsis}>…</span>}
            <button onClick={() => onChange(totalPages)} style={btnStyle(false)}>{totalPages}</button>
          </>
        )}
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} style={btnStyle(page >= totalPages)}>
          Siguiente ›
        </button>
      </div>
    </div>
  );
}

function btnStyle(disabled) {
  return {
    padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
    background: disabled ? "#f8fafc" : "#fff", color: disabled ? "#cbd5e1" : "#475569",
    fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s",
  };
}

const styles = {
  wrapper: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px", borderTop: "1px solid #f1f5f9",
    flexWrap: "wrap", gap: 12,
  },
  info: { fontSize: 13, color: "#94a3b8", fontWeight: 500 },
  buttons: { display: "flex", alignItems: "center", gap: 4 },
  activeBtn: {
    padding: "6px 12px", border: "none", borderRadius: 8,
    background: "#4f46e5", color: "#fff", fontSize: 13, fontWeight: 700,
    cursor: "pointer",
  },
  ellipsis: { color: "#94a3b8", fontSize: 13, padding: "0 4px" },
};
