// RecommendationList.jsx
import { useEffect, useState } from "react";
import { useGetRecommendationsByStudentQuery } from "../Redux/Slices/ScholarshipApiSlice.ts";

// ── Score component bar ──
// value is now 0-100 directly from the backend
const ScoreBar = ({ label, value, color }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7d92b2" }}>
        {label}
      </span>
      <span style={{ fontSize: "12px", fontWeight: 600, color }}>
        {value.toFixed(0)}%
      </span>
    </div>
    <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: color,
          borderRadius: "99px",
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  </div>
);

const getLevelConfig = (level) => {
  switch (level?.toLowerCase()) {
    case "high":   return { color: "#2dd4a0", bg: "rgba(45,212,160,0.1)",  border: "rgba(45,212,160,0.25)",  label: "High Match" };
    case "medium": return { color: "#e8c56d", bg: "rgba(232,197,109,0.1)", border: "rgba(232,197,109,0.25)", label: "Medium Match" };
    case "low":    return { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", label: "Low Match" };
    default:       return { color: "#7d92b2", bg: "rgba(125,146,178,0.1)", border: "rgba(125,146,178,0.25)", label: level };
  }
};

const scoreColors = ["#e8c56d", "#2dd4a0", "#a0b4d0", "#c084fc", "#60a5fa", "#f97316"];

const RecCard = ({ r, index }) => {
  const lvl = getLevelConfig(r.recommendationLevel);
  // finalScore is already 0-100 from backend, just round to 1 decimal
  const pct = r.finalScore.toFixed(1);

  return (
    <div
      style={{
        background: "#121e35",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "18px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        animation: `fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) ${index * 0.07}s both`,
        transition: "border-color 0.2s, transform 0.2s",
      }}
      className="rec-card-hover"
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "16px",
            fontWeight: 500,
            color: "#e8f0f8",
            margin: "0 0 6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {r.scholarshipName}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <span style={{
              background: "#0d1526",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#a0b4d0",
              borderRadius: "99px",
              padding: "2px 10px",
              fontSize: "11.5px",
              fontWeight: 500,
            }}>
              🏫 {r.collegeName}
            </span>
            <span style={{
              background: "#0d1526",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#a0b4d0",
              borderRadius: "99px",
              padding: "2px 10px",
              fontSize: "11.5px",
              fontWeight: 500,
            }}>
              📚 {r.targetFieldName}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{
            background: lvl.bg,
            color: lvl.color,
            border: `1px solid ${lvl.border}`,
            borderRadius: "99px",
            padding: "3px 12px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "6px",
          }}>
            {lvl.label}
          </span>
          <span style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "22px",
            fontWeight: 600,
            color: lvl.color,
            display: "block",
            lineHeight: 1,
          }}>
            {pct}%
          </span>
          <span style={{ fontSize: "10px", color: "#7d92b2" }}>match score</span>
        </div>
      </div>

      {/* Main progress bar — width is directly pct (already 0-100) */}
      <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${lvl.color}88, ${lvl.color})`,
          borderRadius: "99px",
          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>

      {/* Score breakdown */}
      <div style={{
        background: "#0d1526",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "12px",
        padding: "1rem",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px 16px",
      }}>
        {[
          { label: "GPA",        value: r.gpaComponent },
          { label: "Field",      value: r.fieldComponent },
          { label: "Experience", value: r.experienceComponent },
          { label: "Training",   value: r.trainingComponent },
          { label: "Education",  value: r.educationComponent },
          { label: "Income",     value: r.incomeComponent },
        ].map(({ label, value }, i) => (
          // value is already 0-100, ScoreBar uses it directly
          <ScoreBar key={label} label={label} value={value} color={scoreColors[i]} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "11px", color: "#3d5580", fontWeight: 500 }}>
          Scholarship #{r.scholarshipId}
        </span>
      </div>
    </div>
  );
};

export const RecommendationList = () => {
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setStudentId(parseInt(id));
  }, []);

  const { data, isLoading, error } = useGetRecommendationsByStudentQuery(
    studentId, { skip: studentId === null }
  );

  const empty = (icon, title, text) => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "5rem 2rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.6 }}>{icon}</div>
      <h3 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: "18px",
        fontWeight: 500,
        color: "#c2d3e8",
        margin: "0 0 6px",
      }}>{title}</h3>
      <p style={{ fontSize: "13px", color: "#7d92b2", maxWidth: "300px" }}>{text}</p>
    </div>
  );

  if (!studentId) return empty("🔒", "Not Logged In", "Please log in to view your recommendations.");

  if (isLoading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5rem", gap: "1rem" }}>
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "3px solid rgba(232,197,109,0.15)",
        borderTopColor: "#e8c56d",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{ fontSize: "13px", color: "#7d92b2" }}>Loading recommendations…</span>
    </div>
  );

  if (error) return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "1.25rem 1.5rem",
      background: "rgba(248,113,113,0.08)",
      border: "1px solid rgba(248,113,113,0.2)",
      borderRadius: "14px",
      color: "#f87171",
      fontSize: "13.5px",
    }}>
      ⚠️ Failed to load recommendations. Please try again later.
    </div>
  );

  const recs = data?.data ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .rec-card-hover:hover { border-color: rgba(232,197,109,0.2) !important; transform: translateY(-2px); }
      `}</style>
      <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: "900px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "1.75rem", animation: "fadeUp 0.4s ease both" }}>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "22px",
            fontWeight: 500,
            color: "#e8f0f8",
            margin: "0 0 4px",
          }}>
            Your Scholarship Recommendations
          </h2>
          <p style={{ fontSize: "13px", color: "#7d92b2", margin: 0 }}>
            Personalized matches based on your academic profile and experience
          </p>
        </div>

        {recs.length === 0
          ? empty("🏆", "No Recommendations Yet", "Complete your profile to get personalized scholarship matches.")
          : (
            <>
              {/* Summary strip */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.75rem",
                marginBottom: "1.5rem",
                animation: "fadeUp 0.4s 0.1s ease both",
              }}>
                {[
                  { label: "Total Matches", value: recs.length },
                  { label: "High Matches",  value: recs.filter(r => r.recommendationLevel?.toLowerCase() === "high").length },
                  // finalScore is already 0-100, no *100 needed
                  { label: "Best Score",    value: `${Math.max(...recs.map(r => r.finalScore)).toFixed(1)}%` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: "#121e35",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "14px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 600, color: "#e8c56d", lineHeight: 1 }}>{value}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7d92b2" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Cards grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1rem" }}>
                {recs.map((r, i) => <RecCard key={r.scholarshipId} r={r} index={i} />)}
              </div>
            </>
          )}
      </div>
    </>
  );
};

export default RecommendationList;