import { useState, useEffect, useRef } from "react";
import { useLoginMutation } from "../../Redux/Slices/AuthSlice.ts";
import { useNavigate } from "react-router-dom";

// ─── Animated road stripe background ─────────────────────────────
function RoadCanvas() {
  const ref = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let offset = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      const roadGrad = ctx.createLinearGradient(0, 0, W, 0);
      roadGrad.addColorStop(0,   "rgba(4,9,18,0)");
      roadGrad.addColorStop(0.3, "rgba(20,30,50,0.55)");
      roadGrad.addColorStop(0.7, "rgba(20,30,50,0.55)");
      roadGrad.addColorStop(1,   "rgba(4,9,18,0)");
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, 0, W, H);

      const VP_X = W / 2, VP_Y = H / 2, dashCount = 18;
      for (let i = 0; i < dashCount; i++) {
        const progress = ((i / dashCount) + offset * 0.0018) % 1;
        const depth = Math.pow(progress, 2.2);
        const x = VP_X + (W * 0.5 - VP_X) * depth;
        const y = VP_Y + (H * 0.1) * depth;
        const dashW = 2 + depth * 90, dashH = 1 + depth * 10;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = `rgba(245,158,11,${depth * 0.75})`;
        ctx.fillRect(-dashW / 2, -dashH / 2, dashW, dashH);
        ctx.restore();
      }

      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < dashCount; i++) {
          const progress = ((i / dashCount) + offset * 0.0018) % 1;
          const depth = Math.pow(progress, 2.2);
          const kx = VP_X + side * (W * 0.32) * depth;
          const ky = VP_Y + H * 0.05 * depth;
          const kw = 1 + depth * 14, kh = 0.5 + depth * 5;
          const isRed = Math.floor(i / 2) % 2 === 0;
          ctx.save();
          ctx.translate(kx, ky);
          ctx.fillStyle = `rgba(${isRed ? "210,40,30" : "240,240,240"},${depth * 0.5})`;
          ctx.fillRect(-kw / 2, -kh / 2, kw, kh);
          ctx.restore();
        }
      }

      offset++;
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

// ─── Tachometer ───────────────────────────────────────────────────
function Tacho({ speed }) {
  const angle = -140 + speed * 2.8;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r="42" fill="none" stroke="rgba(245,158,11,0.12)" strokeWidth="1.5" />
      <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(245,158,11,0.07)" strokeWidth="0.8" />
      {Array.from({ length: 13 }).map((_, i) => {
        const a = (-140 + i * (280 / 12)) * (Math.PI / 180);
        const r1 = 36, r2 = i % 3 === 0 ? 28 : 32;
        return (
          <line key={i}
            x1={45 + Math.cos(a) * r1} y1={45 + Math.sin(a) * r1}
            x2={45 + Math.cos(a) * r2} y2={45 + Math.sin(a) * r2}
            stroke={i % 3 === 0 ? "rgba(245,158,11,0.6)" : "rgba(245,158,11,0.2)"}
            strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
          />
        );
      })}
      <path
        d={`M ${45 + Math.cos(-140 * Math.PI / 180) * 36} ${45 + Math.sin(-140 * Math.PI / 180) * 36} A 36 36 0 ${speed > 50 ? 1 : 0} 1 ${45 + Math.cos(angle * Math.PI / 180) * 36} ${45 + Math.sin(angle * Math.PI / 180) * 36}`}
        fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 4px #f59e0b)" }}
      />
      <line
        x1="45" y1="45"
        x2={45 + Math.cos(angle * Math.PI / 180) * 30}
        y2={45 + Math.sin(angle * Math.PI / 180) * 30}
        stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"
        style={{ transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)", filter: "drop-shadow(0 0 3px #f59e0b)" }}
      />
      <circle cx="45" cy="45" r="4" fill="#f59e0b" style={{ filter: "drop-shadow(0 0 4px #f59e0b)" }} />
      <circle cx="45" cy="45" r="2" fill="#060e1c" />
    </svg>
  );
}

// ─── Login Page ───────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [username,    setUsername]    = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState(null);
  const [tachoSpeed,  setTachoSpeed]  = useState(0);
  const [mounted,     setMounted]     = useState(false);
  const [userFocus,   setUserFocus]   = useState(false);
  const [passFocus,   setPassFocus]   = useState(false);

  // Idle tacho wobble
  useEffect(() => {
    setMounted(true);
    let dir = 1, val = 0;
    const interval = setInterval(() => {
      val += dir * (0.4 + Math.random() * 0.3);
      if (val > 18) dir = -1;
      if (val < 0)  dir =  1;
      setTachoSpeed(val);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Rev while typing
  useEffect(() => {
    setTachoSpeed(Math.min(95, (username.length + password.length) * 4));
  }, [username, password]);

  // ── FIX: e must be declared as parameter ──────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    try {
      const res = await login({ email: username.trim(), password }).unwrap();
      if (res.success) {
        setTachoSpeed(100);
        setTimeout(() => navigate("/"), 400);
      } else {
        setError(res.message || "Login failed.");
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || "Invalid credentials. Check your details.");
      setTachoSpeed(5);
    }
  };

  const inputStyle = (focused) => ({
    width: "100%",
    padding: "13px 16px 13px 44px",
    background: focused ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${focused ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 10,
    color: "#e8d4a0",
    fontFamily: "'Courier New', monospace",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    boxShadow: focused ? "0 0 0 3px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
  });

  return (
    <div style={{ minHeight:"100vh", background:"#060b14", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", fontFamily:"'Courier New', monospace" }}>

      {/* Background */}
      <div style={{ position:"absolute", inset:0 }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 60%, rgba(245,158,11,0.06) 0%, transparent 70%)" }} />
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"35%", background:"linear-gradient(180deg, rgba(245,158,11,0.03) 0%, transparent 100%)" }} />
        <div style={{ position:"absolute", inset:0, opacity:0.18, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize:"200px 200px" }} />
        <RoadCanvas />
      </div>

      {/* Top-left badge */}
      <div style={{ position:"absolute", top:28, left:32, display:"flex", alignItems:"center", gap:10, opacity:mounted?1:0, transition:"opacity 0.6s ease 0.2s" }}>
        <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#f59e0b,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 18px rgba(245,158,11,0.35)" }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M3 14 L7 6 L10 10 L14 4 L17 14 Z" fill="#fff" opacity=".95"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:7, letterSpacing:".4em", color:"rgba(245,158,11,0.6)", lineHeight:1.2 }}>Aadim Hackathon</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"-.02em", fontFamily:"Georgia, serif", lineHeight:1 }}>2025</div>
        </div>
      </div>

      {/* Tacho top-right */}
      <div style={{ position:"absolute", top:24, right:32, opacity:mounted?1:0, transition:"opacity 0.6s ease 0.4s" }}>
        <Tacho speed={tachoSpeed} />
      </div>

      {/* Card */}
      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:440, margin:"0 20px", opacity:mounted?1:0, transform:mounted?"translateY(0)":"translateY(24px)", transition:"opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s" }}>
        <div style={{ background:"linear-gradient(160deg, #1a120a 0%, #0f0a05 60%, #1a1208 100%)", border:"1px solid rgba(180,130,60,0.35)", borderTop:"3px solid #f59e0b", borderRadius:16, overflow:"hidden", boxShadow:"0 -2px 0 rgba(200,150,70,0.3), inset 0 1px 0 rgba(255,220,120,0.1), 0 32px 64px rgba(0,0,0,0.8), 0 0 40px rgba(245,158,11,0.08)", position:"relative" }}>

          {/* Top accent line */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg, transparent, rgba(245,158,11,0.8), rgba(249,115,22,0.6), transparent)" }} />

          {/* Nail dots */}
          {[
            { top:12,   left:12   },
            { top:12,   right:12  },
            { bottom:12, left:12  },
            { bottom:12, right:12 },
          ].map((pos, i) => (
            <div key={i} style={{ position:"absolute", ...pos, width:5, height:5, borderRadius:"50%", background:"rgba(180,130,60,0.35)", boxShadow:"inset 0 1px 1px rgba(255,255,255,0.2)" }} />
          ))}

          {/* Header */}
          <div style={{ padding:"32px 36px 24px", textAlign:"center", borderBottom:"1px solid rgba(180,130,60,0.12)" }}>
            <div style={{ fontSize:8, letterSpacing:".45em", color:"rgba(245,158,11,0.55)", fontFamily:"monospace", marginBottom:10 }}>ADMIN · CONTROL PANEL</div>
            <div style={{ fontSize:28, fontWeight:700, color:"#f0ddb0", fontFamily:"Georgia, serif", letterSpacing:"-.01em", lineHeight:1.1, marginBottom:6 }}>Pit Lane Access</div>
            <div style={{ fontSize:10, color:"rgba(180,130,60,0.45)", fontFamily:"monospace", letterSpacing:".1em", fontStyle:"italic" }}>Authorised crew only. Present your credentials.</div>
            {/* RPM strip */}
            <div style={{ display:"flex", gap:3, marginTop:18, height:3 }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{
                  flex:1, borderRadius:2,
                  background: i < Math.round((tachoSpeed / 100) * 20)
                    ? (i > 16 ? "#ef4444" : i > 12 ? "#f97316" : "#f59e0b")
                    : "rgba(255,255,255,0.05)",
                  transition:"background 0.08s ease",
                  boxShadow: i < Math.round((tachoSpeed / 100) * 20) ? "0 0 4px rgba(245,158,11,0.5)" : "none",
                }} />
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding:"28px 36px 32px" }}>

            {/* Username */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:8, letterSpacing:".22em", color:"rgba(140,100,40,0.7)", fontFamily:"monospace", textTransform:"uppercase", marginBottom:8 }}>Driver ID</div>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:userFocus?0.9:0.35, transition:"opacity 0.2s" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5.5" r="2.5" stroke="#f59e0b" strokeWidth="1.4"/>
                  <path d="M2.5 13.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setUserFocus(true)}
                  onBlur={() => setUserFocus(false)}
                  placeholder="admin"
                  autoComplete="username"
                  style={inputStyle(userFocus)}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:8, letterSpacing:".22em", color:"rgba(140,100,40,0.7)", fontFamily:"monospace", textTransform:"uppercase", marginBottom:8 }}>Pit Code</div>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:passFocus?0.9:0.35, transition:"opacity 0.2s" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#f59e0b" strokeWidth="1.4"/>
                  <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="8" cy="10.5" r="1" fill="#f59e0b"/>
                </svg>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...inputStyle(passFocus), paddingRight:44 }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0, color:"rgba(180,130,60,0.45)", lineHeight:1, fontSize:12, fontFamily:"monospace", letterSpacing:".05em" }}>
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ marginBottom:18, padding:"11px 16px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderLeft:"3px solid #ef4444", borderRadius:8, display:"flex", alignItems:"flex-start", gap:10, animation:"shakeX 0.35s ease" }}>
                <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>⚠</span>
                <span style={{ fontSize:11, color:"#fca5a5", fontFamily:"monospace", letterSpacing:".04em", lineHeight:1.5 }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={isLoading}
              style={{ width:"100%", padding:"14px 20px", background:isLoading?"linear-gradient(135deg, rgba(120,80,20,0.6), rgba(20,10,0,0.8))":"linear-gradient(135deg, #78350f, rgba(20,10,0,0.95))", border:"1px solid rgba(245,158,11,0.55)", borderTop:"1px solid rgba(245,158,11,0.85)", borderRadius:10, color:isLoading?"rgba(245,158,11,0.5)":"#f59e0b", fontWeight:700, fontFamily:"monospace", fontSize:12, letterSpacing:".22em", cursor:isLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:isLoading?"none":"inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.6), 0 0 24px rgba(245,158,11,0.15)", transition:"all 0.2s ease" }}
              onMouseEnter={e => { if(!isLoading){ e.currentTarget.style.borderColor="rgba(245,158,11,0.9)"; e.currentTarget.style.boxShadow="inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.7), 0 0 32px rgba(245,158,11,0.25)"; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(245,158,11,0.55)"; e.currentTarget.style.boxShadow="inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.6), 0 0 24px rgba(245,158,11,0.15)"; }}
            >
              {isLoading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation:"spin 0.8s linear infinite", flexShrink:0 }}>
                    <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5"/>
                    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="rgba(245,158,11,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize:14 }}>🏁</span>
                  <span>ENTER PIT LANE</span>
                </>
              )}
            </button>

            <div style={{ margin:"22px 0 0", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1, height:1, background:"rgba(180,130,60,0.12)" }} />
              <div style={{ width:5, height:5, borderRadius:"50%", background:"rgba(245,158,11,0.3)", boxShadow:"0 0 6px rgba(245,158,11,0.3)" }} />
              <div style={{ flex:1, height:1, background:"rgba(180,130,60,0.12)" }} />
            </div>
          </form>
        </div>

        {/* Status line */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:20 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e", animation:"pulse 2s ease infinite" }} />
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:".28em", fontFamily:"monospace" }}>SYSTEMS ONLINE · SECURE CONNECTION</span>
        </div>
      </div>

      {/* Bottom badge */}
      <div style={{ position:"absolute", bottom:24, left:0, right:0, display:"flex", justifyContent:"center", opacity:mounted?0.35:0, transition:"opacity 0.8s ease 0.6s" }}>
        <span style={{ fontSize:8, color:"rgba(180,130,60,0.6)", letterSpacing:".32em", fontFamily:"monospace" }}>Aadim Hackathon 2025 · ADMIN PORTAL · POWERED BY WEBGL</span>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shakeX { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        input::placeholder { color: rgba(180,130,60,0.25); }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
      `}</style>
    </div>
  );
}