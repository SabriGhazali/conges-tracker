import { useState, useRef } from "react";
import usePersistedData from "./usePersistedData";

// ============================================================
// PASSWORD HASH — change by hashing your password with SHA-256
// Current password: "conges2024"
// ============================================================
const PASSWORD_HASH = "930b2a61cf15e00ce6cabd9acbeb36ea4d471904faafc88c790344276aa6cd17";
const SESSION_KEY = "conges-tracker-auth";

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================================
// UTILS
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
// COMPONENTS
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
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#6b7280", marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>{label}</div>
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
// PASSWORD GATE
// ============================================================

function PasswordGate({ onAuth }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hash = await hashPassword(password);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onAuth();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0c0e14", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
      `}</style>
      <form onSubmit={handleSubmit} style={{
        background: "#151820", border: "1px solid #252a36", borderRadius: 18,
        padding: "40px", width: 380, textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h1 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Suivi des <span style={{ color: "#818cf8" }}>Congés</span>
        </h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28 }}>Entrez le mot de passe pour accéder au tableau de bord</p>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="Mot de passe"
          autoFocus
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 10,
            border: `1px solid ${error ? "#f87171" : "#252a36"}`,
            background: "#0c0e14", color: "#e2e8f0", fontSize: 15,
            fontFamily: "'JetBrains Mono', monospace", outline: "none",
            marginBottom: 16,
          }}
        />
        {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>Mot de passe incorrect</p>}
        <button type="submit" style={{
          width: "100%", padding: "12px", borderRadius: 10, border: "none",
          background: "#818cf8", color: "#0c0e14", fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Outfit', sans-serif",
        }}>
          Accéder
        </button>
      </form>
    </div>
  );
}

// ============================================================
// ADD LEAVE MODAL
// ============================================================

function AddLeaveModal({ periods, onAdd, onClose }) {
  const [dates, setDates] = useState("");
  const [days, setDays] = useState("");
  const [period, setPeriod] = useState(periods[periods.length - 1]?.id || "");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dates.trim() || !days || !period || !month) return;
    onAdd({
      dates: dates.trim(),
      days: parseFloat(days),
      period,
      month,
    });
    onClose();
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid #252a36", background: "#0c0e14", color: "#e2e8f0",
    fontSize: 14, fontFamily: "'JetBrains Mono', monospace", outline: "none",
  };
  const labelStyle = { display: "block", color: "#6b7280", fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} style={{
        background: "#151820", border: "1px solid #252a36", borderRadius: 18,
        padding: "32px", width: 420, fontFamily: "'Outfit', sans-serif",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700 }}>Ajouter un congé</h2>
          <button type="button" onClick={onClose} style={{
            background: "none", border: "none", color: "#6b7280", fontSize: 22, cursor: "pointer",
          }}>&times;</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Dates (texte libre)</label>
          <input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="ex: 25–27 sept. 2024" style={inputStyle} autoFocus />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Nombre de jours</label>
            <input type="number" min="0.5" step="0.5" value={days} onChange={(e) => setDays(e.target.value)} placeholder="3" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Période</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Mois (pour classement)</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle} />
        </div>

        <button type="submit" style={{
          width: "100%", padding: "12px", borderRadius: 10, border: "none",
          background: "#818cf8", color: "#0c0e14", fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Outfit', sans-serif",
        }}>
          Ajouter
        </button>
      </form>
    </div>
  );
}

// ============================================================
// DELETE CONFIRMATION
// ============================================================

function DeleteConfirm({ leave, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#151820", border: "1px solid #252a36", borderRadius: 18,
        padding: "32px", width: 400, textAlign: "center", fontFamily: "'Outfit', sans-serif",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Supprimer ce congé ?</h3>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
          {leave.dates} — {leave.days}j ({leave.period})
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #252a36",
            background: "transparent", color: "#6b7280", fontSize: 14, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}>Annuler</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px", borderRadius: 10, border: "none",
            background: "#f87171", color: "#0c0e14", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP
// ============================================================

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const {
    data, setData, loading, resetToSeed, exportData, importData,
    syncStatus, syncError, githubConfig, configureGitHub, disconnectGitHub, forcePull,
  } = usePersistedData();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importMsg, setImportMsg] = useState(null);
  const [ghToken, setGhToken] = useState("");
  const [ghOwner, setGhOwner] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghConnecting, setGhConnecting] = useState(false);
  const [ghError, setGhError] = useState(null);
  const fileInputRef = useRef(null);
  const today = new Date();

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  if (loading || !data) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0c0e14", display: "flex",
        alignItems: "center", justifyContent: "center", color: "#818cf8",
        fontFamily: "'Outfit', sans-serif", fontSize: 18,
      }}>
        Chargement...
      </div>
    );
  }

  const { employee, periods: rawPeriods, leavesTaken, bulletins, anomalies } = data;

  const addLeave = (leave) => {
    setData((prev) => ({
      ...prev,
      leavesTaken: [...prev.leavesTaken, leave],
    }));
  };

  const removeLeave = (index) => {
    setData((prev) => ({
      ...prev,
      leavesTaken: prev.leavesTaken.filter((_, i) => i !== index),
    }));
    setDeleteTarget(null);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importData(file);
      setImportMsg({ type: "ok", text: "Données importées avec succès" });
    } catch (err) {
      setImportMsg({ type: "error", text: err.message });
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 3000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  // ── Computed values ──
  const computed = (() => {
    const periods = rawPeriods.map((p) => {
      const pris = leavesTaken.filter((l) => l.period === p.id).reduce((s, l) => s + l.days, 0);

      let acquis;
      if (p.totalAcquis !== null) {
        acquis = p.totalAcquis;
      } else {
        const start = new Date(p.startAcq);
        const end = new Date(p.endAcq);
        const calcEnd = today < end ? today : end;
        const months = getMonthsBetween(start, calcEnd);
        acquis = Math.round(months * employee.acquisitionPerMonth * 100) / 100;
      }

      return { ...p, acquis, pris, restant: Math.round((acquis - pris) * 100) / 100 };
    });

    const totalAcquis = Math.round(periods.reduce((s, p) => s + p.acquis, 0) * 100) / 100;
    const totalPris = periods.reduce((s, p) => s + p.pris, 0);
    const totalRestant = Math.round((totalAcquis - totalPris) * 100) / 100;

    const lastBulletin = bulletins.filter((b) => !b.missing).slice(-1)[0];
    const bulletinPris24 = lastBulletin?.p1p || 0;
    const leavesBeforeBulletin = leavesTaken
      .filter((l) => l.period === "24/25" && l.month <= "2026-02")
      .reduce((s, l) => s + l.days, 0);
    const ecart = leavesBeforeBulletin - bulletinPris24;

    return { periods, totalAcquis, totalPris, totalRestant, ecart, lastBulletin, leavesBeforeBulletin };
  })();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "conges", label: "Congés pris", icon: "🏖️" },
    { id: "bulletins", label: "Bulletins", icon: "📄" },
    { id: "anomalies", label: "Anomalies", icon: "⚠️" },
    { id: "donnees", label: "Données", icon: "💾" },
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
        @media (max-width: 900px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-periods { grid-template-columns: 1fr !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-bulletins { grid-template-columns: 1fr !important; }
          .main-container { padding: 24px 16px !important; }
        }
        @media (max-width: 600px) {
          .grid-4 { grid-template-columns: 1fr !important; }
          .main-container { padding: 16px 12px !important; }
        }
      `}</style>

      {showAddModal && (
        <AddLeaveModal
          periods={rawPeriods}
          onAdd={addLeave}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {deleteTarget !== null && (
        <DeleteConfirm
          leave={leavesTaken[deleteTarget]}
          onConfirm={() => removeLeave(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="main-container" style={{ padding: "32px 48px" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid #1e2230",
          animation: "fadeIn 0.6s ease", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
              Suivi des <span style={{ color: "#818cf8" }}>Congés</span>
            </h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
              Calcul dynamique au {formatDate(today)}
              {githubConfig && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: syncStatus === "synced" ? "rgba(52,211,153,0.12)" : syncStatus === "syncing" ? "rgba(96,165,250,0.12)" : syncStatus === "error" ? "rgba(248,113,113,0.12)" : "rgba(148,163,184,0.12)",
                  color: syncStatus === "synced" ? "#34d399" : syncStatus === "syncing" ? "#60a5fa" : syncStatus === "error" ? "#f87171" : "#94a3b8",
                }}>
                  {syncStatus === "synced" ? "GitHub OK" : syncStatus === "syncing" ? "Sync..." : syncStatus === "error" ? "Sync err" : ""}
                </span>
              )}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: "#818cf8" }}>
              {employee.name}
            </div>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>{employee.role} — {employee.company}</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
              Acquisition : {formatNum(employee.acquisitionPerMonth)} j/mois • Entrée : {employee.startDate}
            </div>
            <button onClick={handleLogout} style={{
              marginTop: 8, padding: "4px 12px", borderRadius: 8, border: "1px solid #252a36",
              background: "transparent", color: "#6b7280", fontSize: 12, cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}>🔓 Déconnexion</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#151820", borderRadius: 12, padding: 4, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: "10px 16px", border: "none", borderRadius: 10, cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                transition: "all 0.2s ease", minWidth: 100,
                background: activeTab === t.id ? "#818cf8" : "transparent",
                color: activeTab === t.id ? "#0c0e14" : "#6b7280",
              }}
            >
              {t.icon} {t.label}
              {t.id === "anomalies" && (
                <span style={{
                  marginLeft: 6, background: activeTab === t.id ? "rgba(0,0,0,0.2)" : "rgba(248,113,113,0.2)",
                  color: activeTab === t.id ? "#0c0e14" : "#f87171",
                  padding: "1px 6px", borderRadius: 8, fontSize: 11,
                }}>{anomalies.filter((a) => a.severity === "error").length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════ DASHBOARD ═══════════ */}
        {activeTab === "dashboard" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
              <StatCard label="Total Acquis" value={formatNum(computed.totalAcquis)} sub="toutes périodes confondues" color="#60a5fa" delay={0.1} />
              <StatCard label="Total Pris" value={computed.totalPris} sub="jours ouvrables" color="#f87171" delay={0.2} />
              <StatCard label="Solde Restant" value={formatNum(computed.totalRestant)} sub="jours disponibles" color="#34d399" delay={0.3} />
              <StatCard label="Écart bulletins" value={`${computed.ecart}j`} sub="non comptés par la paie" color="#fbbf24" delay={0.4} />
            </div>

            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8", display: "inline-block" }} />
                Solde par période
              </h2>
              <div className="grid-periods" style={{ display: "grid", gridTemplateColumns: `repeat(${computed.periods.length}, 1fr)`, gap: 12 }}>
                {computed.periods.map((p) => (
                  <SoldeCard key={p.id} period={p.id} acquis={p.acquis} pris={p.pris} restant={p.restant} />
                ))}
              </div>
            </div>

            <div style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, overflow: "hidden" }}>
              <table>
                <thead><tr><th>Période</th><th>Acquis</th><th>Pris</th><th>Restant</th></tr></thead>
                <tbody>
                  {computed.periods.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", color: "#818cf8", fontSize: 13 }}>{p.id}</td>
                      <td>{formatNum(p.acquis)}</td>
                      <td>{formatNum(p.pris)}</td>
                      <td><Badge type={p.restant > 0 ? "green" : p.restant === 0 ? "gray" : "red"}>{formatNum(p.restant)}</Badge></td>
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

        {/* ═══════════ CONGÉS PRIS ═══════════ */}
        {activeTab === "conges" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button onClick={() => setShowAddModal(true)} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: "#818cf8", color: "#0c0e14", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Outfit', sans-serif",
              }}>
                + Ajouter un congé
              </button>
            </div>

            <div style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
              <table>
                <thead><tr><th>Dates</th><th>Période</th><th>Jours</th><th style={{ width: 50 }}></th></tr></thead>
                <tbody>
                  {leavesTaken.map((l, i) => (
                    <tr key={i}>
                      <td>{l.dates}</td>
                      <td><Badge type={l.period === "23/24" ? "orange" : l.period === "24/25" ? "blue" : "green"}>{l.period}</Badge></td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{l.days}</td>
                      <td>
                        <button onClick={() => setDeleteTarget(i)} style={{
                          background: "none", border: "none", color: "#6b7280", cursor: "pointer",
                          fontSize: 16, padding: "2px 6px", borderRadius: 6,
                        }} title="Supprimer">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#1a1e2a", fontWeight: 700 }}>
                    <td colSpan={2}>TOTAL</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {leavesTaken.reduce((s, l) => s + l.days, 0)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid-periods" style={{ display: "grid", gridTemplateColumns: `repeat(${computed.periods.length}, 1fr)`, gap: 12 }}>
              {computed.periods.map((p) => {
                const leaves = leavesTaken.filter((l) => l.period === p.id);
                return (
                  <div key={p.id} style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, padding: 16 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#818cf8", fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
                      {p.id} — {p.pris}j pris / {formatNum(p.acquis)} acquis
                    </div>
                    {leaves.length === 0 ? (
                      <div style={{ textAlign: "center", color: "#6b7280", fontSize: 13, padding: 8 }}>Aucun congé pris</div>
                    ) : leaves.map((l, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", padding: "6px 0",
                        borderBottom: i < leaves.length - 1 ? "1px solid #1e2230" : "none", fontSize: 13,
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

        {/* ═══════════ BULLETINS ═══════════ */}
        {activeTab === "bulletins" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div className="grid-bulletins" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "#1a1e2a", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                  📄 Dernier bulletin ({computed.lastBulletin?.month})
                </div>
                <div style={{ padding: 16 }}>
                  {[
                    ["24/25 Acquis", computed.lastBulletin?.p1a, "blue"],
                    ["24/25 Pris", computed.lastBulletin?.p1p, "red"],
                    ["24/25 Restant", computed.lastBulletin?.p1r, "blue"],
                    ["25/26 Acquis", computed.lastBulletin?.p2a, "blue"],
                    ["25/26 Pris", computed.lastBulletin?.p2p, "gray"],
                    ["25/26 Restant", computed.lastBulletin?.p2r, "blue"],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e2230", fontSize: 13 }}>
                      <span style={{ color: "#6b7280" }}>{l}</span>
                      <Badge type={c}>{formatNum(v)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#151820", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "rgba(52,211,153,0.08)", fontSize: 13, fontWeight: 600, textAlign: "center", color: "#34d399" }}>
                  Mon décompte réel (même date)
                </div>
                <div style={{ padding: 16 }}>
                  {[
                    ["24/25 Acquis", 22.5, "green"],
                    ["24/25 Pris", computed.leavesBeforeBulletin, "red"],
                    ["24/25 Restant", Math.round((22.5 - computed.leavesBeforeBulletin) * 100) / 100, "green"],
                    ["25/26 Acquis", computed.lastBulletin?.p2a, "green"],
                    ["25/26 Pris", 0, "gray"],
                    ["25/26 Restant", computed.lastBulletin?.p2a, "green"],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e2230", fontSize: 13 }}>
                      <span style={{ color: "#6b7280" }}>{l}</span>
                      <Badge type={c}>{formatNum(v)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
                  {bulletins.map((b, i) => (
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

        {/* ═══════════ ANOMALIES ═══════════ */}
        {activeTab === "anomalies" && (
          <div style={{ animation: "fadeIn 0.4s ease", display: "flex", flexDirection: "column", gap: 10 }}>
            {anomalies.map((a, i) => {
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
                Action requise : régularisation par la paie
              </h3>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>
                • Ajouter les 3 jours de mai 2025 (2, 9, 30 mai) dans le compteur "pris" 24/25<br/>
                • Ajouter le 1 jour du 12 décembre 2025 dans le compteur "pris" 24/25<br/>
                • Ajouter les 3 jours du 11–13 février 2026 dans le compteur "pris" 24/25<br/>
                • Corriger mars 2025 : 6 jours au lieu de 7 dans le compteur "pris" 24/25<br/>
                • Ajouter les 5 jours du 9–13 mars 2026 lors du prochain bulletin
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ DONNÉES ═══════════ */}
        {activeTab === "donnees" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>

            {/* GitHub Sync Config */}
            <div style={{
              background: "#151820", border: `1px solid ${githubConfig ? "rgba(52,211,153,0.3)" : "#252a36"}`,
              borderRadius: 14, padding: 24, marginBottom: 24,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
                  GitHub Sync
                  {githubConfig && (
                    <span style={{
                      padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: syncStatus === "synced" ? "rgba(52,211,153,0.12)" : syncStatus === "syncing" ? "rgba(96,165,250,0.12)" : syncStatus === "error" ? "rgba(248,113,113,0.12)" : "rgba(148,163,184,0.12)",
                      color: syncStatus === "synced" ? "#34d399" : syncStatus === "syncing" ? "#60a5fa" : syncStatus === "error" ? "#f87171" : "#94a3b8",
                    }}>
                      {syncStatus === "synced" ? "Connecté" : syncStatus === "syncing" ? "Synchronisation..." : syncStatus === "error" ? "Erreur" : "Déconnecté"}
                    </span>
                  )}
                </h3>
              </div>

              {githubConfig ? (
                <div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
                    Synchronisation active avec <span style={{ color: "#818cf8", fontFamily: "'JetBrains Mono', monospace" }}>{githubConfig.owner}/{githubConfig.repo}</span>
                  </div>
                  {syncError && (
                    <div style={{
                      padding: "10px 14px", borderRadius: 10, marginBottom: 16,
                      background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                      color: "#f87171", fontSize: 13,
                    }}>{syncError}</div>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={forcePull} disabled={syncStatus === "syncing"} style={{
                      padding: "8px 16px", borderRadius: 8, border: "1px solid #252a36",
                      background: "transparent", color: "#60a5fa", fontSize: 13, fontWeight: 600,
                      cursor: syncStatus === "syncing" ? "not-allowed" : "pointer",
                      fontFamily: "'Outfit', sans-serif", opacity: syncStatus === "syncing" ? 0.5 : 1,
                    }}>Tirer depuis GitHub</button>
                    <button onClick={() => { if (confirm("Déconnecter GitHub ?")) disconnectGitHub(); }} style={{
                      padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.4)",
                      background: "transparent", color: "#f87171", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                    }}>Déconnecter</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
                    Connectez votre dépôt GitHub pour sauvegarder automatiquement les données dans <code style={{ color: "#818cf8" }}>seed.json</code>.
                    Les modifications seront synchronisées sur tous vos appareils.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", color: "#6b7280", fontSize: 11, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Owner</label>
                      <input value={ghOwner} onChange={(e) => setGhOwner(e.target.value)} placeholder="votre-username"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #252a36", background: "#0c0e14", color: "#e2e8f0", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", color: "#6b7280", fontSize: 11, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Repo</label>
                      <input value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} placeholder="conges-tracker"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #252a36", background: "#0c0e14", color: "#e2e8f0", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", color: "#6b7280", fontSize: 11, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Personal Access Token (fine-grained)</label>
                    <input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} placeholder="github_pat_..."
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #252a36", background: "#0c0e14", color: "#e2e8f0", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: "none" }} />
                  </div>
                  {ghError && (
                    <div style={{
                      padding: "10px 14px", borderRadius: 10, marginBottom: 12,
                      background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                      color: "#f87171", fontSize: 13,
                    }}>{ghError}</div>
                  )}
                  <button
                    disabled={!ghOwner || !ghRepo || !ghToken || ghConnecting}
                    onClick={async () => {
                      setGhConnecting(true);
                      setGhError(null);
                      try {
                        await configureGitHub({ owner: ghOwner, repo: ghRepo, token: ghToken });
                        setGhToken("");
                        setGhOwner("");
                        setGhRepo("");
                      } catch (err) {
                        setGhError(err.message);
                      }
                      setGhConnecting(false);
                    }}
                    style={{
                      padding: "10px 24px", borderRadius: 10, border: "none",
                      background: (!ghOwner || !ghRepo || !ghToken || ghConnecting) ? "#333" : "#818cf8",
                      color: "#0c0e14", fontSize: 14, fontWeight: 700,
                      cursor: (!ghOwner || !ghRepo || !ghToken || ghConnecting) ? "not-allowed" : "pointer",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {ghConnecting ? "Connexion..." : "Connecter GitHub"}
                  </button>
                </div>
              )}
            </div>

            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={{
                background: "#151820", border: "1px solid #252a36", borderRadius: 14,
                padding: 24, textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📥</div>
                <h3 style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Exporter</h3>
                <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Télécharger toutes les données en JSON</p>
                <button onClick={exportData} style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: "#818cf8", color: "#0c0e14", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                }}>Exporter JSON</button>
              </div>

              <div style={{
                background: "#151820", border: "1px solid #252a36", borderRadius: 14,
                padding: 24, textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📤</div>
                <h3 style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Importer</h3>
                <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Charger des données depuis un fichier JSON</p>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
                <button onClick={() => fileInputRef.current?.click()} style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: "#60a5fa", color: "#0c0e14", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                }}>Importer JSON</button>
              </div>

              <div style={{
                background: "#151820", border: "1px solid #252a36", borderRadius: 14,
                padding: 24, textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
                <h3 style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Réinitialiser</h3>
                <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Revenir aux données initiales du dépôt</p>
                <button onClick={() => { if (confirm("Réinitialiser toutes les données ?")) resetToSeed(); }} style={{
                  padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(248,113,113,0.4)",
                  background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                }}>Réinitialiser</button>
              </div>
            </div>

            {importMsg && (
              <div style={{
                padding: "12px 18px", borderRadius: 12, marginBottom: 16,
                background: importMsg.type === "ok" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                border: `1px solid ${importMsg.type === "ok" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                color: importMsg.type === "ok" ? "#34d399" : "#f87171",
                fontSize: 14,
              }}>{importMsg.text}</div>
            )}

            <div style={{ background: "#151820", border: "1px solid #252a36", borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#818cf8" }}>Statistiques des données</h3>
              <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  ["Périodes", rawPeriods.length],
                  ["Congés déclarés", leavesTaken.length],
                  ["Bulletins", bulletins.filter((b) => !b.missing).length],
                  ["Anomalies", anomalies.length],
                ].map(([label, value]) => (
                  <div key={label} style={{ textAlign: "center", padding: 12 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: "#818cf8" }}>{value}</div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: "center", paddingTop: 28, marginTop: 32,
          borderTop: "1px solid #1e2230", color: "#4b5563", fontSize: 12,
        }}>
          Calcul dynamique au {formatDate(today)} • {bulletins.filter((b) => !b.missing).length} bulletins • {leavesTaken.length} congés déclarés • Acquisition : {formatNum(employee.acquisitionPerMonth)} j/mois
        </div>
      </div>
    </div>
  );
}
