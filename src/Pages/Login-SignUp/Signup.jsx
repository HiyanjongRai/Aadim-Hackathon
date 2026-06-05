import { useState } from "react";
import { useSignupMutation } from "../../Redux/Slices/ScholarshipApiSlice.ts";
import { useNavigate, Link } from "react-router-dom";

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
  glow: {
    position: "absolute",
    top: "-120px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "400px",
    background:
      "radial-gradient(ellipse, rgba(232,197,109,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#121e35",
    border: "1px solid rgba(232,197,109,0.25)",
    borderRadius: "24px",
    padding: "2.5rem 2rem",
    boxShadow:
      "0 4px 24px rgba(232,197,109,0.1), 0 20px 60px rgba(0,0,0,0.5)",
    position: "relative",
    animation: "fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both",
  },
  logoWrap: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #e8c56d, #c9963e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.25rem",
    boxShadow: "0 0 0 4px rgba(232,197,109,0.15)",
    fontSize: "26px",
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
    transition: "border-color 0.2s",
  },
  select: {
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
    transition: "border-color 0.2s",
    appearance: "none",
    cursor: "pointer",
  },
  alertError: {
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
  alertSuccess: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 13px",
    borderRadius: "9px",
    background: "rgba(45,212,160,0.1)",
    border: "1px solid rgba(45,212,160,0.2)",
    color: "#2dd4a0",
    fontSize: "13px",
    marginBottom: "1rem",
  },
  btnPrimary: {
    width: "100%",
    padding: "11px",
    background: "linear-gradient(135deg, #e8c56d, #c9963e)",
    color: "#080d1a",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    marginBottom: "0.75rem",
    boxShadow: "0 4px 16px rgba(232,197,109,0.2)",
    transition: "opacity 0.2s, transform 0.2s",
  },
  btnSecondary: {
    width: "100%",
    padding: "10px",
    background: "transparent",
    color: "#a0b4d0",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    fontSize: "13.5px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
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

const SignupPage = () => {
  const [signup, { isLoading }] = useSignupMutation();
  const nav = useNavigate();
  const [focusField, setFocusField] = useState(null);

  const [formData, setFormData] = useState({
    FullName: "",
    Email: "",
    Password: "",
    Gender: "",
    Age: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        FullName: formData.FullName,
        Email: formData.Email,
        Password: formData.Password,
        Gender: formData.Gender,
        Age: Number(formData.Age),
      };

      const res = await signup(payload).unwrap();

      if (res.success && res.data) {
        localStorage.setItem("userId", res.data.studentId.toString());
        localStorage.setItem("userName", res.data.fullName);
        localStorage.setItem("userEmail", res.data.email);
        localStorage.setItem("hasProfile", "false");

        setSuccess(`Welcome, ${res.data.fullName}! Redirecting…`);

        setTimeout(() => {
          nav("/complete-profile");
        }, 1500);
      } else {
        setError(res.message || "Signup failed");
      }
    } catch (err) {
      setError(err?.data?.message || "Signup failed.");
    }
  };

  const focusStyle = (field) =>
    focusField === field ? { borderColor: "#e8c56d", boxShadow: "0 0 0 3px rgba(232,197,109,0.1)" } : {};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .signup-input:focus  { border-color: #e8c56d !important; box-shadow: 0 0 0 3px rgba(232,197,109,0.1) !important; }
        .signup-select:focus { border-color: #e8c56d !important; box-shadow: 0 0 0 3px rgba(232,197,109,0.1) !important; }
        .signup-select option { background: #121e35; color: #c2d3e8; }
        .btn-primary-signup:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-secondary-signup:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.15) !important; }
        .btn-primary-signup:disabled { opacity: 0.55; cursor: not-allowed; }
      `}</style>

      <div style={S.page}>
        <div style={S.glow} />
        <div style={S.card}>
          <div style={S.logoWrap}>🎓</div>
          <h1 style={S.heading}>Create Account</h1>
          <p style={S.sub}>Join the scholarship portal</p>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={S.inputWrap}>
              <label style={S.label}>Full Name</label>
              <input
                className="signup-input"
                style={{ ...S.input, ...focusStyle("FullName") }}
                type="text"
                name="FullName"
                placeholder="Enter your full name"
                value={formData.FullName}
                onChange={handleChange}
                onFocus={() => setFocusField("FullName")}
                onBlur={() => setFocusField(null)}
                required
              />
            </div>

            {/* Email */}
            <div style={S.inputWrap}>
              <label style={S.label}>Email</label>
              <input
                className="signup-input"
                style={{ ...S.input, ...focusStyle("Email") }}
                type="email"
                name="Email"
                placeholder="you@email.com"
                value={formData.Email}
                onChange={handleChange}
                onFocus={() => setFocusField("Email")}
                onBlur={() => setFocusField(null)}
                required
              />
            </div>

            {/* Password */}
            <div style={S.inputWrap}>
              <label style={S.label}>Password</label>
              <input
                className="signup-input"
                style={{ ...S.input, ...focusStyle("Password") }}
                type="password"
                name="Password"
                placeholder="Min 6 characters"
                value={formData.Password}
                onChange={handleChange}
                onFocus={() => setFocusField("Password")}
                onBlur={() => setFocusField(null)}
                required
                minLength={6}
              />
            </div>

            {/* Gender */}
            <div style={S.inputWrap}>
              <label style={S.label}>Gender</label>
              <select
                className="signup-select"
                style={{ ...S.select, ...focusStyle("Gender") }}
                name="Gender"
                value={formData.Gender}
                onChange={handleChange}
                onFocus={() => setFocusField("Gender")}
                onBlur={() => setFocusField(null)}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Age */}
            <div style={S.inputWrap}>
              <label style={S.label}>Age</label>
              <input
                className="signup-input"
                style={{ ...S.input, ...focusStyle("Age") }}
                type="number"
                name="Age"
                min="10"
                max="100"
                placeholder="Enter your age"
                value={formData.Age}
                onChange={handleChange}
                onFocus={() => setFocusField("Age")}
                onBlur={() => setFocusField(null)}
                required
              />
            </div>

            {/* Alerts */}
            {error && (
              <div style={S.alertError}>
                <span>⚠️</span> {error}
              </div>
            )}
            {success && (
              <div style={S.alertSuccess}>
                <span>✅</span> {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={S.btnPrimary}
              className="btn-primary-signup"
            >
              {isLoading ? "⏳ Creating Account…" : "Sign Up"}
            </button>

            <Link to="/login" style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={S.btnSecondary}
                className="btn-secondary-signup"
              >
                Already have an account? Login
              </button>
            </Link>
          </form>

          <div style={S.footer}>By signing up, you agree to our Terms of Service</div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;