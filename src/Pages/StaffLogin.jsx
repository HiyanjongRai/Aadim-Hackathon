// StaffLogin.jsx – College staff login page
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStaffLoginMutation } from "../Redux/Slices/ScholarshipApiSlice.ts";

const S = {
  page: {
    minHeight: "100vh",
    background: "#080d1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  glowLeft: {
    position: "absolute",
    bottom: "-80px",
    left: "-80px",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(45,212,160,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  glowTop: {
    position: "absolute",
    top: "-100px",
    right: "-60px",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(232,197,109,0.05) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#121e35",
    border: "1px solid rgba(45,212,160,0.2)",
    borderRadius: "24px",
    padding: "2.5rem 2rem",
    boxShadow: "0 4px 24px rgba(45,212,160,0.08), 0 20px 60px rgba(0,0,0,0.5)",
    position: "relative",
    animation: "fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both",
  },
  logoWrap: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, rgba(45,212,160,0.2), rgba(45,212,160,0.08))",
    border: "1px solid rgba(45,212,160,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.25rem",
    fontSize: "26px",
  },
  pillBadge: {
    display: "inline-block",
    background: "rgba(45,212,160,0.1)",
    color: "#2dd4a0",
    border: "1px solid rgba(45,212,160,0.2)",
    borderRadius: "99px",
    padding: "3px 12px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    margin: "0 auto 0.5rem",
    display: "block",
    width: "fit-content",
    textAlign: "center",
  },
  heading: {
    fontFamily: "'Fraunces', serif",
    fontSize: "22px",
    fontWeight: 500,
    color: "#e8f0f8",
    textAlign: "center",
    margin: "0 0 4px",
  },
  sub: {
    fontSize: "13px",
    color: "#7d92b2",
    textAlign: "center",
    margin: "0 0 2rem",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "#7d92b2",
    marginBottom: "6px",
  },
  inputWrap: { marginBottom: "1rem" },
  input: {
    width: "100%",
    background: "#0d1526",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "10px",
    padding: "10px 13px",
    fontSize: "13.5px",
    color: "#c2d3e8",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  },
  alert: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 13px",
    borderRadius: "9px",
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.2)",
    color: "#f87171",
    fontSize: "13px",
    marginBottom: "1rem",
  },
  btnPrimary: {
    width: "100%",
    padding: "11px",
    background: "linear-gradient(135deg, #2dd4a0, #1a9e75)",
    color: "#080d1a",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    marginBottom: "0.75rem",
    boxShadow: "0 4px 16px rgba(45,212,160,0.2)",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "1rem 0",
  },
  divLine: { flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" },
  divText: { fontSize: "11px", color: "#7d92b2", whiteSpace: "nowrap" },
  studentBtn: {
    width: "100%",
    padding: "10px",
    background: "rgba(232,197,109,0.08)",
    color: "#e8c56d",
    border: "1px solid rgba(232,197,109,0.2)",
    borderRadius: "10px",
    fontSize: "13.5px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    textDecoration: "none",
    display: "block",
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    fontSize: "11.5px",
    color: "#7d92b2",
    marginTop: "1.5rem",
    paddingTop: "1.25rem",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
};

export const StaffLogin = () => {
  const navigate = useNavigate();
  const [staffLogin, { isLoading }] = useStaffLoginMutation();
  const [form, setForm] = useState({ Email: "", Password: "" });
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await staffLogin({ Email: form.Email, Password: form.Password }).unwrap();
      const staff = res.data;
      localStorage.setItem("staffId", String(staff.staffId));
localStorage.setItem("staff-Name", staff.fullName);
localStorage.setItem("staff-CollegeId", String(staff.collegeId));
localStorage.setItem("staff-CollegeName", staff.collegeName);
localStorage.setItem("authToken", staff.accessToken);
      navigate("/college");
    } catch (err) {
      setError(err?.data?.message || "Login failed. Check your credentials.");
    }
  };

  const focusStyle = (field) =>
    focusField === field
      ? { ...S.input, borderColor: "#2dd4a0", boxShadow: "0 0 0 3px rgba(45,212,160,0.1)" }
      : S.input;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .staff-btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .staff-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .student-link-btn:hover { background: rgba(232,197,109,0.14) !important; }
      `}</style>
      <div style={S.page}>
        <div style={S.glowLeft} />
        <div style={S.glowTop} />
        <div style={S.card}>
          <div style={S.logoWrap}>🏫</div>
          <span style={S.pillBadge}>College Staff</span>
          <h1 style={S.heading}>Staff Portal</h1>
          <p style={S.sub}>Sign in to manage your college's scholarships</p>

          <form onSubmit={handleSubmit}>
            <div style={S.inputWrap}>
              <label style={S.label}>Email</label>
              <input
                style={focusStyle("Email")}
                type="email"
                name="Email"
                value={form.Email}
                onChange={handleChange}
                onFocus={() => setFocusField("Email")}
                onBlur={() => setFocusField(null)}
                required
                placeholder="staff@college.edu"
              />
            </div>
            <div style={S.inputWrap}>
              <label style={S.label}>Password</label>
              <input
                style={focusStyle("Password")}
                type="password"
                name="Password"
                value={form.Password}
                onChange={handleChange}
                onFocus={() => setFocusField("Password")}
                onBlur={() => setFocusField(null)}
                required
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={S.alert}><span>⚠️</span> {error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={S.btnPrimary}
              className="staff-btn-primary"
            >
              {isLoading ? "⏳ Signing in…" : "🔑 Sign In as Staff"}
            </button>
          </form>

          <div style={S.divider}>
            <div style={S.divLine} />
            <span style={S.divText}>or</span>
            <div style={S.divLine} />
          </div>

          <Link to="/login" style={S.studentBtn} className="student-link-btn">
            🎓 Sign In as Student
          </Link>

          <div style={S.footer}>
            Staff access is restricted to registered college personnel
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffLogin;  