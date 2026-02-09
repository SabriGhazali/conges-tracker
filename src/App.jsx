import { useState, useMemo } from "react";

// ============================================================
// 🗄️ SINGLE SOURCE OF TRUTH — Update this data only
// ============================================================

const EMPLOYEE = {
  name: "GHAZALI Sabri",
  role: "Développeur",
  company: "WENEEDS",
  startDate: "2024-04-22",
  acquisitionPerMonth: 2.5,
};

// All leave periods with acquisition details
const PERIODS = [
  { id: "23/24", startAcq: "2024-04-22", endAcq: "2024-05-31", totalAcquis: 4.0 },
  { id: "24/25", startAcq: "2024-06-01", endAcq: "2025-05-31", totalAcquis: 22.5 },
  { id: "25/26", startAcq: "2025-06-01", endAcq: "2026-05-31", totalAcquis: null }, // null = auto-calculate
];

// All leaves taken — THE source of truth for "pris"
const LEAVES_TAKEN = [
  { dates: "25–27 sept. 2024", days: 3, period: "23/24", month: "2024-09" },
  { dates: "14 janv. 2025", days: 1, period: "23/24", month: "2025-01" },
  { dates: "14–21 mars 2025", days: 6, period: "24/25", month: "2025-03" },
  { dates: "2 mai 2025", days: 1, period: "24/25", month: "2025-05" },
  { dates: "9 mai 2025", days: 1, period: "24/25", month: "2025-05" },
  { dates: "30 mai 2025", days: 1, period: "24/25", month: "2025-05" },
  { dates: "25–29 août 2025", days: 5, period: "24/25", month: "2025-08" },
  { dates: "23, 24, 27 oct. 2025", days: 3, period: "24/25", month: "2025-10" },
  { dates: "12 déc. 2025", days: 1, period: "24/25", month: "2025-12" },
  { dates: "11–13 fév. 2026", days: 3, period: "24/25", month: "2026-02" },
];

// Bulletin data for traceability
const BULLETINS = [
  { month: "Avr. 2024", p1: "22/23", p1a: 0.75, p1p: 0, p1r: 0.75, p2: "—", p2a: null, p2p: null, p2r: null },
  { month: "Mai 2024", p1: "22/23", p1a: 3.25, p1p: 0, p1r: 3.25, p2: "23/24", p2a: null, p2p: null, p2r: null },
  { month: "Juin 2024", p1: "23/24", p1a: 4.0, p1p: 0, p1r: 4.0, p2: "24/25", p2a: 2.5, p2p: 0, p2r: 2.5 },
  { month: "Juil. 2024", p1: "23/24", p1a: 4.0, p1p: 0, p1r: 4.0, p2: "24/25", p2a: 5.0, p2p: 0, p2r: 5.0 },
  { month: "Août 2024", p1: "23/24", p1a: 4.0, p1p: 0, p1r: 4.0, p2: "24/25", p2a: 7.5, p2p: 0, p2r: 7.5 },
  { month: "Sept. 2024", p1: "23/24", p1a: 4.0, p1p: 3.0, p1r: 1.0, p2: "24/25", p2a: 10.0, p2p: 0, p2r: 10.0, highlight: true },
  { month: "Oct. 2024", p1: "23/24", p1a: 4.0, p1p: 3.0, p1r: 1.0, p2: "24/25", p2a: 12.5, p2p: 0, p2r: 12.5 },
  { month: "Nov. 2024", p1: "23/24", p1a: 4.0, p1p: 3.0, p1r: 1.0, p2: "24/25", p2a: 15.0, p2p: 0, p2r: 15.0 },
  { month: "Déc. 2024", p1: "23/24", p1a: 4.0, p1p: 3.0, p1r: 1.0, p2: "24/25", p2a: 17.5, p2p: 0, p2r: 17.5 },
  { month: "Janv. 2025", p1: "23/24", p1a: 4.0, p1p: 3.0, p1r: 1.0, p2: "24/25", p2a: 20.0, p2p: 0, p2r: 20.0 },
  { month: "Fév. 2025", p1: "23/24", p1a: 4.0, p1p: 3.0, p1r: 1.0, p2: "24/25", p2a: 22.5, p2p: 0, p2r: 22.5 },
  { month: "Mars 2025", p1: "—", p1a: null, p1p: null, p1r: null, p2: "24/25", p2a: 22.5, p2p: 7.0, p2r: null, mismatch: true, note: "7j compté au lieu de 6" },
  { month: "Avr. 2025", p1: "23/24", p1a: 4.0, p1p: 4.0, p1r: 0, p2: "24/25", p2a: 27.5, p2p: 7.0, p2r: 20.5, highlight: true },
  { month: "Mai 2025", p1: null, p1a: null, p1p: null, p1r: null, p2: null, p2a: null, p2p: null, p2r: null, missing: true, note: "Bulletin manquant (changement société)" },
  { month: "Juin 2025", p1: "24/25", p1a: 22.5, p1p: 1.0, p1r: 21.5, p2: "25/26", p2a: 2.5, p2p: 0, p2r: 2.5 },
  { month: "Juil. 2025", p1: "24/25", p1a: 22.5, p1p: 1.0, p1r: 21.5, p2: "25/26", p2a: 5.0, p2p: 0, p2r: 5.0 },
  { month: "Août 2025", p1: "24/25", p1a: 22.5, p1p: 6.0, p1r: 16.5, p2: "25/26", p2a: 7.5, p2p: 0, p2r: 7.5, highlight: true },
  { month: "Sept. 2025", p1: "24/25", p1a: 22.5, p1p: 6.0, p1r: 16.5, p2: "25/26", p2a: 10.0, p2p: 0, p2r: 10.0 },
  { month: "Oct. 2025", p1: "24/25", p1a: 22.5, p1p: 9.0, p1r: 13.5, p2: "25/26", p2a: 12.5, p2p: 0, p2r: 12.5, highlight: true },
  { month: "Nov. 2025", p1: "24/25", p1a: 22.5, p1p: 9.0, p1r: 13.5, p2: "25/26", p2a: 15.0, p2p: 0, p2r: 15.0 },
  { month: "Déc. 2025", p1: "24/25", p1a: 22.5, p1p: 9.0, p1r: 13.5, p2: "25/26", p2a: 17.5, p2p: 0, p2r: 17.5 },
];

// Anomalies to track
const ANOMALIES = [
  { type: "trop", desc: "Mars 2025 : 7 jours comptés au lieu de 6 (+1 en trop)", severity: "warning" },
  { type: "manque", desc: "Mai 2025 : 3 jours déclarés par email, non comptés sur bulletins", severity: "error" },
  { type: "manque", desc: "Déc. 2025 : 1 jour déclaré par email, non compté sur bulletin", severity: "error" },
  { type: "info", desc: "Bulletin mai 2025 manquant (changement Le Sanctuaire → WENEEDS)", severity: "info" },
  { type: "ok", desc: "Régularisation 14 janv. 2025 sur 23/24 : effectuée en avril 2025 ✓", severity: "ok" },
];

// ============================================================
// 🧮 DYNAMIC CALCULATIONS
// ============================================================

function getMonthsBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return Math.max(0, Math.min(months, 12));
}

function formatDate(d) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatNum(n) {
  if (n === null || n === undefined) return "—";
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(".", ",");
}

// ============================================================
// 🎨 COMPONENTS
// ============================================================

const Badge = ({ type, children }) => {
  const colors = {
    green: { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
    red: { bg: "rgba(248,113,113,0.12)", color: "#f87171" },
    blue: { bg: "rgba(96,165,250,0.12)", color: "#60a5fa" },
    orange: { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
    gray: { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
  };
  const c = colors[type] || colors.gray;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 6,
      fontSize: 12, fontWeight: 600, background: c.bg, color: c.color,
    }}>{children}</span>
  );
};

const StatCard = ({ label, value, sub, color, delay }) => (
  <div style={{
    background: "#151820", border: "1px solid #252a36", borderRadius: 14,
    padding: "20px", animation: `slideUp 0.5s ease ${delay}s both`,
  }}>
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#6b7280", marginBottom: 8 }}>{label}</div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{sub}</div>
  </div>
);

const SoldeCard = ({ period, acquis, pris, restant }) => (
  <div style={{
    background: "#151820", border: "1px solid #252a36", borderRadius: 14,
    padding: "20px", textAlign: "center",
  }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#818cf8", fontWeight: 700, marginBottom: 16 }}>{period}</div>
    {[["Acquis", acquis, "#60a5fa"], ["Pris", pris, "#f87171"], ["Restant", restant, "#34d399"]].map(([l, v, c], i) => (
      <div key={l} style={{
        display: "flex", justifyContent: "space-between", padding: "8px 0",
        borderBottom: i < 2 ? "1px solid #252a36" : "none",
        fontWeight: i === 2 ? 700 : 400, fontSize: i === 2 ? 18 : 14,
        marginTop: i === 2 ? 4 : 0,
      }}>
        <span style={{ color: "#6b7280" }}>{l}</span>
        <span style={{ color: c, fontFamily: "'JetBrains Mono', monospace" }}>{formatNum(v)}</span>
      </div>
    ))}
  </div>
);

// ============================================================
// 🏠 MAIN APP
// ============================================================

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const today = new Date();

  // Dynamic calculations
  const computed = useMemo(() => {
    const periods = PERIODS.map((p) => {
      const pris = LEAVES_TAKEN.filter((l) => l.period === p.id).reduce((s, l) => s + l.days, 0);

      let acquis;
      if (p.totalAcquis !== null) {
        acquis = p.totalAcquis;
      } else {
        // Auto-calculate based on today's date
        const start = new Date(p.startAcq);
        const end = new Date(p.endAcq);
        const calcEnd = today < end ? today : end;
        const months = getMonthsBetween(start, calcEnd);
        acquis = Math.round(months * EMPLOYEE.acquisitionPerMonth * 100) / 100;
      }

      return { ...p, acquis, pris, restant: Math.round((acquis - pris) * 100) / 100 };
    });

    const totalAcquis = periods.reduce((s, p) => s + p.acquis, 0);
    const totalPris = periods.reduce((s, p) => s + p.pris, 0);
    const totalRestant = Math.round((totalAcquis - totalPris) * 100) / 100;

    // Bulletin comparison (last bulletin)
    const lastBulletin = BULLETINS.filter((b) => !b.missing).slice(-1)[0];
    const bulletinPris24 = lastBulletin?.p1p || 0;
    const realPris24 = periods.find((p) => p.id === "24/25")?.pris || 0;
    // Only count leaves before or equal to last bulletin month
    const leavesBeforeBulletin = LEAVES_TAKEN.filter(l => l.period === "24/25" && l.month <= "2025-12").reduce((s, l) => s + l.days, 0);
    const ecart = leavesBeforeBulletin - bulletinPris24;

    return { periods, totalAcquis, totalPris, totalRestant, ecart, lastBulletin, leavesBeforeBulletin };
  }, []);

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "conges", label: "Congés pris" },
    { id: "bulletins", label: "Bulletins" },
    { id: "anomalies", label: "Anomalies" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0e14",
      color: "#e2e8f0",
      fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #151820; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        table { width:100%; border-collapse:collapse; }
        th { background:#1a1e2a; padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:1.2px; color:#6b7280; font-weight:600; }
        th:last-child, td:last-child { text-align:right; }
        td { padding:10px 14px; border-top:1px solid #1e2230; font-size:13px; }
        tr:hover td { background:rgba(129,140,248,0.04); }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid #1e2230",
          animation: "fadeIn 0.6s ease",
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
              Suivi des <span style={{ color: "#818cf8" }}>Congés</span>
            </h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
              Calcul dynamique au {formatDate(today)}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: "#818cf8" }}>
              {EMPLOYEE.name}
            </div>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>{EMPLOYEE.role} — {EMPLOYEE.company}</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
              Acquisition : {formatNum(EMPLOYEE.acquisitionPerMonth)} jours/mois
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#151820", borderRadius: 12, padding: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: "10px 16px", border: "none", borderRadius: 10, cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                transition: "all 0.2s ease",
                background: activeTab === t.id ? "#818cf8" : "transparent",
                color: activeTab === t.id ? "#0c0e14" : "#6b7280",
              }}
            >
              {t.label}
              {t.id === "anomalies" && (
                <span style={{
                  marginLeft: 6, background: activeTab === t.id ? "rgba(0,0,0,0.2)" : "rgba(248,113,113,0.2)",
                  color: activeTab === t.id ? "#0c0e14" : "#f87171",
                  padding: "1px 6px", borderRadius: 8, fontSize: 11,
                }}>{ANOMALIES.filter(a => a.severity === "error").length}</span>
              )}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
              <StatCard label="Total Acquis" value={formatNum(computed.totalAcquis)} sub="toutes périodes" color="#60a5fa" delay={0.1} />
              <StatCard label="Total Pris" value={computed.totalPris} sub="jours ouvrables" color="#f87171" delay={0.2} />
              <StatCard label="Solde Restant" value={formatNum(computed.totalRestant)} sub="jours disponibles" color="#34d399" delay={0.3} />
              <StatCard label="Écart bulletins" value={`${computed.ecart}j`} sub="non comptés par Aurélie" color="#fbbf24" delay={0.4} />
            </div>

            {/* Solde par période */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8", display: "inline-block" }} />
                Solde par période
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${computed.periods.length}, 1fr)`, gap: 12 }}>
                {computed.periods.map((p) => (
                  <SoldeCard key={p.id} period={p.id} acquis={p.acquis} pris={p.pris} restant={p.restant} />
                ))}
              </div>
            </div>

            {/* Résumé */}
            <div style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, overflow: "hidden" }}>
              <table>
                <thead>
                  <tr><th>Période</th><th>Acquis</th><th>Pris</th><th>Restant</th></tr>
                </thead>
                <tbody>
                  {computed.periods.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", color: "#818cf8", fontSize: 13 }}>{p.id}</td>
                      <td>{formatNum(p.acquis)}</td>
                      <td>{formatNum(p.pris)}</td>
                      <td><Badge type={p.restant > 0 ? "green" : "red"}>{formatNum(p.restant)}</Badge></td>
                    </tr>
                  ))}
                  <tr style={{ background: "#1a1e2a", fontWeight: 700 }}>
                    <td>TOTAL</td>
                    <td>{formatNum(computed.totalAcquis)}</td>
                    <td>{computed.totalPris}</td>
                    <td><Badge type="green">{formatNum(computed.totalRestant)}</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONGÉS TAB */}
        {activeTab === "conges" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, overflow: "hidden" }}>
              <table>
                <thead>
                  <tr><th>Dates</th><th>Période</th><th>Jours</th></tr>
                </thead>
                <tbody>
                  {LEAVES_TAKEN.map((l, i) => (
                    <tr key={i}>
                      <td>{l.dates}</td>
                      <td><Badge type={l.period === "23/24" ? "orange" : "blue"}>{l.period}</Badge></td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{l.days}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#1a1e2a", fontWeight: 700 }}>
                    <td colSpan={2}>TOTAL</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {LEAVES_TAKEN.reduce((s, l) => s + l.days, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Par période */}
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: `repeat(${computed.periods.length}, 1fr)`, gap: 12 }}>
              {computed.periods.map((p) => {
                const leaves = LEAVES_TAKEN.filter((l) => l.period === p.id);
                return (
                  <div key={p.id} style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, padding: 16 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#818cf8", fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
                      {p.id} — {p.pris} jours
                    </div>
                    {leaves.length === 0 ? (
                      <div style={{ textAlign: "center", color: "#6b7280", fontSize: 13 }}>Aucun congé</div>
                    ) : leaves.map((l, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", padding: "6px 0",
                        borderBottom: i < leaves.length - 1 ? "1px solid #1e2230" : "none",
                        fontSize: 13,
                      }}>
                        <span style={{ color: "#94a3b8" }}>{l.dates}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{l.days}j</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BULLETINS TAB */}
        {activeTab === "bulletins" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Comparison */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24,
            }}>
              <div style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "#1a1e2a", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                  📄 Dernier bulletin ({computed.lastBulletin?.month})
                </div>
                <div style={{ padding: 16 }}>
                  {[
                    ["24/25 Pris", computed.lastBulletin?.p1p, "red"],
                    ["24/25 Restant", computed.lastBulletin?.p1r, "blue"],
                    ["25/26 Acquis", computed.lastBulletin?.p2a, "blue"],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e2230", fontSize: 14 }}>
                      <span style={{ color: "#6b7280" }}>{l}</span>
                      <Badge type={c}>{formatNum(v)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#151820", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "rgba(52,211,153,0.08)", fontSize: 13, fontWeight: 600, textAlign: "center", color: "#34d399" }}>
                  ✅ Mon décompte réel (fin déc. 2025)
                </div>
                <div style={{ padding: 16 }}>
                  {[
                    ["24/25 Pris", computed.leavesBeforeBulletin, "red"],
                    ["24/25 Restant", Math.round((22.5 - computed.leavesBeforeBulletin) * 100) / 100, "green"],
                    ["25/26 Acquis", computed.lastBulletin?.p2a, "green"],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e2230", fontSize: 14 }}>
                      <span style={{ color: "#6b7280" }}>{l}</span>
                      <Badge type={c}>{formatNum(v)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full bulletin history */}
            <div style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, overflow: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Bulletin</th>
                    <th>Pér. 1</th><th>Acq.</th><th>Pris</th><th>Rest.</th>
                    <th>Pér. 2</th><th>Acq.</th><th>Pris</th><th>Rest.</th>
                  </tr>
                </thead>
                <tbody>
                  {BULLETINS.map((b, i) => (
                    <tr key={i} style={{
                      background: b.missing ? "rgba(251,191,36,0.05)" : b.mismatch ? "rgba(248,113,113,0.05)" : b.highlight ? "rgba(52,211,153,0.03)" : "transparent",
                      fontStyle: b.missing ? "italic" : "normal",
                      opacity: b.missing ? 0.6 : 1,
                    }}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#818cf8" }}>
                        {b.month}
                        {b.note && <span title={b.note} style={{ marginLeft: 4, cursor: "help" }}>⚠️</span>}
                      </td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{b.p1 || "—"}</td>
                      <td>{formatNum(b.p1a)}</td><td>{formatNum(b.p1p)}</td><td>{formatNum(b.p1r)}</td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{b.p2 || "—"}</td>
                      <td>{formatNum(b.p2a)}</td><td>{formatNum(b.p2p)}</td><td>{formatNum(b.p2r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANOMALIES TAB */}
        {activeTab === "anomalies" && (
          <div style={{ animation: "fadeIn 0.4s ease", display: "flex", flexDirection: "column", gap: 10 }}>
            {ANOMALIES.map((a, i) => {
              const styles = {
                error: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", icon: "❌", color: "#f87171" },
                warning: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", icon: "⚠️", color: "#fbbf24" },
                info: { bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.25)", icon: "ℹ️", color: "#60a5fa" },
                ok: { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)", icon: "✅", color: "#34d399" },
              };
              const s = styles[a.severity];
              return (
                <div key={i} style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12,
                  padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, color: s.color, fontWeight: 600, marginBottom: 2 }}>
                      {a.type === "trop" ? "Jour compté en trop" : a.type === "manque" ? "Congé non comptabilisé" : a.type === "ok" ? "Régularisation effectuée" : "Information"}
                    </div>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>{a.desc}</div>
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: 12, background: "#151820", border: "1px solid #252a36",
              borderRadius: 14, padding: 20,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#818cf8" }}>
                Action requise : Aurélie doit régulariser
              </h3>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>
                • Ajouter les 3 jours de mai 2025 (2, 9, 30 mai) dans le compteur "pris" 24/25<br/>
                • Ajouter le 1 jour du 12 décembre 2025 dans le compteur "pris" 24/25<br/>
                • Corriger mars 2025 : 6 jours au lieu de 7 dans le compteur "pris" 24/25<br/>
                • Ajouter les 3 jours de février 2026 (11–13 fév.) lors du prochain bulletin
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: "center", paddingTop: 28, marginTop: 32,
          borderTop: "1px solid #1e2230", color: "#4b5563", fontSize: 12,
        }}>
          Calcul dynamique basé sur la date du jour ({formatDate(today)}) • {BULLETINS.filter(b => !b.missing).length} bulletins analysés • {LEAVES_TAKEN.length} congés déclarés
        </div>
      </div>
    </div>
  );
}