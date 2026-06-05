import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import aa from "./aa.png";

import {
  useGetSnapshotQuery, useGetSponsorsQuery, useGetScheduleQuery,
  useGetRewardsQuery, useGetRulesQuery, useGetTeamsQuery,
  useGetThemesQuery,
  useUpdateConfigMutation, useUpdateThemeMutation,
  useCreateSponsorMutation, useUpdateSponsorMutation, useDeleteSponsorMutation,
  useCreateScheduleItemMutation, useUpdateScheduleItemMutation, useDeleteScheduleItemMutation,
  useCreateRewardMutation, useUpdateRewardMutation, useDeleteRewardMutation,
  useCreateRuleMutation, useUpdateRuleMutation, useDeleteRuleMutation,
  useCreateThemeMutation, useDeleteThemeMutation,
  useDeleteTeamMutation, useUploadImageMutation,
  useInitiateEsewaMutation, useInitiateKhaltiMutation, useGetPaymentInfoQuery,
} from "../Redux/Slices/HackDriveSlice.ts";
import { logout } from "../Redux/Slices/AuthSlice.ts";
import BASE_URL from "../Redux/Slices/baseUrl.ts";
import * as THREE from "three";

function resolveImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL.replace(/\/api\/?$/, "")}${path}`;
}

const FALLBACK_SNAPSHOT = {
  config: {
    configId: 1, eventName: "Aadim Hackathon", edition: "",
    tagline: "48 hours. One road. Infinite possibilities.",
    location: "Kathmandu, Nepal", format: "48-hour hackathon",
    teamSizeMin: 1, teamSizeMax: 3,
  },
  theme: {
    themeId: 1, title: "This Year's Theme",
    subtitle: "Where human experience meets motion.",
    focusArea: "Future of Mobility",
    coreQuestion: "How does AI reshape the way we move?",
    approach: "Human-centered design thinking",
    scaleNote: "Last-mile to emotional UI",
  },
  sponsors: [
    { sponsorId: 1, name: "Google Cloud", logo: "", color: "#4285F4", tier: "Gold",   sortOrder: 1, link: "", role: "Title Sponsor" },
    { sponsorId: 2, name: "AWS",          logo: "", color: "#FF9900", tier: "Gold",   sortOrder: 2, link: "", role: "Cloud Partner" },
    { sponsorId: 3, name: "Vercel",       logo: "", color: "#a78bfa", tier: "Silver", sortOrder: 3, link: "", role: "Hosting Partner" },
    { sponsorId: 4, name: "OpenAI",       logo: "", color: "#10a37f", tier: "Silver", sortOrder: 4, link: "", role: "AI Partner" },
    { sponsorId: 5, name: "GitHub",       logo: "", color: "#6e40c9", tier: "Bronze", sortOrder: 5, link: "", role: "Dev Tools" },
  ],
  schedule: [
    { itemId: 1, icon: "", dayLabel: "Day 1", timeLabel: "9:00 AM",  eventLabel: "Opening Ceremony",  sortOrder: 1 },
    { itemId: 2, icon: "", dayLabel: "Day 1", timeLabel: "1:00 PM",  eventLabel: "Lunch & Mentors",   sortOrder: 2 },
    { itemId: 3, icon: "", dayLabel: "Day 1", timeLabel: "11:00 PM", eventLabel: "Midnight Check-in", sortOrder: 3 },
    { itemId: 4, icon: "", dayLabel: "Day 2", timeLabel: "3:00 PM",  eventLabel: "Demo Day Finals",   sortOrder: 4 },
  ],
  rewards: [
    { rewardId: 1, icon: "", label: "1st Place",      value: "NPR 50,000 + Incubation",  sortOrder: 1 },
    { rewardId: 2, icon: "", label: "2nd Place",      value: "NPR 25,000 + Credits",     sortOrder: 2 },
    { rewardId: 3, icon: "", label: "3rd Place",      value: "NPR 10,000 + Swag Pack",   sortOrder: 3 },
    { rewardId: 4, icon: "", label: "Special Awards", value: "Best UI · AI · Impact",    sortOrder: 4 },
  ],
  rules: [
    { ruleId: 1, icon: "", label: "Code",  value: "Written during event only", sortOrder: 1 },
    { ruleId: 2, icon: "", label: "Teams", value: "1–3 participants",          sortOrder: 2 },
    { ruleId: 3, icon: "", label: "Tools", value: "Open source & APIs ok",     sortOrder: 3 },
    { ruleId: 4, icon: "", label: "Demo",  value: "Working demo required",     sortOrder: 4 },
  ],
};

const ICON_FALLBACKS = {
  schedule: ["🌅","🍕","🌙","🏁","📅","⏰","🎤","🎯"],
  rewards:  ["🥇","🥈","🥉","⭐","🏆","🎖","💎","🎁"],
  rules:    ["⚡","🤝","🔓","🎨","📋","📌","✅","🔒"],
};

function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(() => {
    const token = localStorage.getItem("authToken");
    const expiresAt = localStorage.getItem("authExpiresAt");
    return !!token && !(expiresAt ? new Date(expiresAt) < new Date() : true);
  });
  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem("authToken");
      const expiresAt = localStorage.getItem("authExpiresAt");
      setIsAdmin(!!token && !(expiresAt ? new Date(expiresAt) < new Date() : true));
    };
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);
  return isAdmin;
}

const SECTION_ACCENTS = {
  overview: { accent: "#f59e0b", accentDark: "#78350f" },
  schedule: { accent: "#10b981", accentDark: "#064e3b" },
  rewards:  { accent: "#f97316", accentDark: "#7c2d12" },
  theme:    { accent: "#8b5cf6", accentDark: "#3b0764" },
  rules:    { accent: "#06b6d4", accentDark: "#0c4a6e" },
};
const SECTION_IDS = ["overview", "schedule", "rewards", "theme", "rules"];
const SEC_T = [0.0, 0.2, 0.4, 0.6, 0.8];

const ROAD_WP = [
  [0, 52], [14, 48], [26, 36], [36, 18], [40, 0],
  [36, -18], [24, -34], [8, -44], [-8, -44], [-24, -34],
  [-36, -18], [-40, 0], [-36, 18], [-26, 36], [-14, 48], [0, 52],
];

function catmullRomClosedStatic(pts, t) {
  const n = pts.length - 1;
  const raw = ((t % 1) + 1) % 1;
  const seg = raw * n;
  const i1 = Math.floor(seg), f = seg - i1;
  const i0 = (i1 - 1 + n) % n, i2 = (i1 + 1) % n, i3 = (i1 + 2) % n;
  const [p0, p1, p2, p3] = [pts[i0], pts[i1], pts[i2], pts[i3]];
  const interp = u =>
    0.5 * (2*p1[u] + (-p0[u]+p2[u])*f + (2*p0[u]-5*p1[u]+4*p2[u]-p3[u])*f*f + (-p0[u]+3*p1[u]-3*p2[u]+p3[u])*f*f*f);
  return [interp(0), interp(1)];
}

function getRoadDirClosedStatic(pts, t) {
  const dt = 0.002;
  const [x1, z1] = catmullRomClosedStatic(pts, t - dt);
  const [x2, z2] = catmullRomClosedStatic(pts, t + dt);
  const len = Math.sqrt((x2-x1)**2 + (z2-z1)**2) || 1;
  return [(x2-x1)/len, (z2-z1)/len];
}

const BLDG_POS = SEC_T.map(t => {
  const [rx, rz] = catmullRomClosedStatic(ROAD_WP, t);
  const [ddx, ddz] = getRoadDirClosedStatic(ROAD_WP, t);
  return [rx - ddz * 18, rz + ddx * 18];
});

const FONT_BODY = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', 'Consolas', monospace";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

const INPUT_STYLE = {
  width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, color: "#e8f4ff",
  fontFamily: FONT_BODY, fontSize: 14, outline: "none", boxSizing: "border-box",
};

// ─────────────────────────────────────────────────────────────────
// IMAGE UPLOAD FIELD
// ─────────────────────────────────────────────────────────────────
function ImageUploadField({ value, onChange, accent }) {
  const [uploading, setUploading] = useState(false);
  const [uploadImage] = useUploadImageMutation();
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImage(fd).unwrap();
      if (res.success && res.data) onChange(res.data);
    } catch { alert("Image upload failed."); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {value && (
        <img src={resolveImageUrl(value)} alt="preview"
          style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }} />
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder="/images/abc123.png or paste URL"
          style={{ ...INPUT_STYLE, fontFamily: FONT_MONO, fontSize: 11 }} />
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{ padding: "10px 12px", background: `${accent}22`, border: `1px solid ${accent}55`,
            borderRadius: 8, color: accent, fontFamily: FONT_MONO, fontSize: 10,
            cursor: "pointer", whiteSpace: "nowrap" }}>
          {uploading ? "..." : "📁 UPLOAD"}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ICON DISPLAY
// ─────────────────────────────────────────────────────────────────
function IconDisplay({ icon, fallbackEmoji = "📌", size = 22 }) {
  const [imgErr, setImgErr] = useState(false);
  const isUrl = icon && (icon.startsWith("http") || icon.startsWith("/"));
  if (isUrl && !imgErr) {
    return <img src={resolveImageUrl(icon)} alt="" onError={() => setImgErr(true)}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }} />;
  }
  return <span style={{ fontSize: size * 0.7 }}>{fallbackEmoji}</span>;
}

// ─────────────────────────────────────────────────────────────────
// ADMIN MODAL
// ─────────────────────────────────────────────────────────────────
function AdminModal({ title, fields, initial, accent, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError(null);
    try { await onSave(form); onClose(); }
    catch (e) { setError(e?.data?.message || e?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!onDelete || !window.confirm("Delete this item?")) return;
    setDeleting(true); setError(null);
    try { await onDelete(); onClose(); }
    catch (e) { setError(e?.data?.message || e?.message || "Failed to delete"); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)",
      backdropFilter: "blur(12px)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#060e1c",
        border: `1px solid ${accent}44`, borderTop: `3px solid ${accent}`,
        borderRadius: 16, padding: "28px 28px",
        boxShadow: `0 0 60px ${accent}22, 0 24px 48px rgba(0,0,0,0.8)`,
        position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.06)", border: "none", color: "#fff",
          width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, letterSpacing: ".28em", color: accent,
            fontFamily: FONT_MONO, marginBottom: 4 }}>ADMIN · AADIM HACKATHON</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#ffffff",
            fontFamily: FONT_SERIF }}>{title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map(({ key, label, type = "text" }) => (
            <div key={key}>
              <div style={{ fontSize: 10, color: "#7aa8cc", letterSpacing: ".12em",
                fontFamily: FONT_MONO, marginBottom: 6, fontWeight: 600 }}>{label.toUpperCase()}</div>
              {type === "image" ? (
                <ImageUploadField value={form[key] ?? ""} onChange={v => update(key, v)} accent={accent} />
              ) : type === "color" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="color" value={form[key] ?? "#ffffff"}
                    onChange={e => update(key, e.target.value)}
                    style={{ width: 44, height: 36, border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6, background: "none", cursor: "pointer" }} />
                  <input type="text" value={form[key] ?? ""} onChange={e => update(key, e.target.value)}
                    placeholder="#4285F4" style={INPUT_STYLE} />
                </div>
              ) : type === "number" ? (
                <input type="number" value={form[key] ?? 0}
                  onChange={e => update(key, Number(e.target.value))}
                  style={INPUT_STYLE} />
              ) : (
                <input type="text" value={form[key] ?? ""} onChange={e => update(key, e.target.value)}
                  style={INPUT_STYLE} />
              )}
            </div>
          ))}
        </div>
        {error && (
          <div style={{ marginTop: 14, padding: "10px 14px",
            background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,80,80,0.3)",
            borderRadius: 8, color: "#ff9999", fontFamily: FONT_BODY, fontSize: 13 }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {onDelete && (
            <button onClick={handleDelete} disabled={deleting}
              style={{ flex: 1, padding: "11px", background: "rgba(255,50,50,0.12)",
                border: "1px solid rgba(255,80,80,0.3)", borderRadius: 8,
                color: "#ff8888", fontFamily: FONT_MONO, fontSize: 11,
                fontWeight: 700, cursor: "pointer", letterSpacing: ".1em" }}>
              {deleting ? "DELETING..." : "🗑 DELETE"}
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: "11px", background: accent, border: "none",
              borderRadius: 8, color: "#000", fontWeight: 700, fontFamily: FONT_MONO,
              fontSize: 12, letterSpacing: ".1em", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "SAVING..." : "✓ SAVE CHANGES"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ADMIN BUTTON
// ─────────────────────────────────────────────────────────────────
function AdminBtn({ icon, accent, onClick, style: extraStyle = {} }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ width: 22, height: 22, borderRadius: 5, background: `${accent}22`,
        border: `1px solid ${accent}55`, color: accent, fontFamily: FONT_MONO,
        fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, lineHeight: 1,
        transition: "all .15s", ...extraStyle }}
      title={icon === "+" ? "Add" : icon === "🗑" ? "Delete" : "Edit"}>
      {icon}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// ADMIN TOOLBAR
// ─────────────────────────────────────────────────────────────────
function AdminToolbar({ isAdmin, isMobile, onNavigateLogin }) {
  const dispatch = useDispatch();
  return (
    <div style={{ position: "absolute", top: isMobile ? 52 : 62,
      right: isMobile ? 8 : 22, zIndex: 15, display: "flex", gap: 6 }}>
      {!isAdmin ? (
        <button onClick={onNavigateLogin}
          style={{ padding: "5px 10px", background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6,
            color: "rgba(245,158,11,0.85)", fontFamily: FONT_MONO,
            fontSize: 9, letterSpacing: ".15em", cursor: "pointer" }}>
          🔑 ADMIN
        </button>
      ) : (
        <button onClick={() => { if (window.confirm("Log out of admin mode?")) dispatch(logout()); }}
          style={{ padding: "5px 10px", background: "rgba(255,50,50,0.1)",
            border: "1px solid rgba(255,80,80,0.3)", borderRadius: 6,
            color: "rgba(255,120,120,0.9)", fontFamily: FONT_MONO,
            fontSize: 9, letterSpacing: ".15em", cursor: "pointer" }}>
          ⏏ LOGOUT
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────
function validateName(name) {
  if (!name.trim()) return "Name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  if (/[0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/.test(name.trim())) return "Name must not contain numbers or special characters.";
  return null;
}

function validateEmail(email) {
  if (!email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return "Please enter a valid email address.";
  return null;
}

function validatePhone(phone) {
  if (!phone.trim()) return "Phone number is required.";
  const cleaned = phone.trim().replace(/[\s\-]/g, "");
  if (!/^(\+977)?[9][6-8][0-9]{8}$/.test(cleaned)) {
    return "Enter a valid Nepal phone number (e.g. 98XXXXXXXX or +97798XXXXXXXX).";
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// REGISTER MODAL
// ─────────────────────────────────────────────────────────────────
function RegisterModal({ accent, onClose, eventName }) {
  const [step, setStep]     = useState(1);
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);   // duplicate-check loading

  const [teamName,     setTeamName]     = useState("");
  const [captainName,  setCaptainName]  = useState("");
  const [captainPhone, setCaptainPhone] = useState("");
  const [captainEmail, setCaptainEmail] = useState("");
  const [members, setMembers]           = useState([""]);

  const [initiateEsewa,  { isLoading: esewaLoad }]  = useInitiateEsewaMutation();
  const [initiateKhalti, { isLoading: khaltiLoad }] = useInitiateKhaltiMutation();
  const { data: payInfo } = useGetPaymentInfoQuery();
  const fee      = payInfo?.data?.amount   ?? 500;
  const currency = payInfo?.data?.currency ?? "NPR";

  const labelStyle = {
    fontSize: 11, color: "#7aa8cc", letterSpacing: ".1em",
    fontFamily: FONT_MONO, marginBottom: 6, display: "block", fontWeight: 600,
  };

  const errorStyle = {
    fontSize: 12, color: "#ff8888", fontFamily: FONT_BODY,
    marginTop: 4, display: "block",
  };

  const MAX_TOTAL = 3;
  const totalMembers = 1 + members.filter(m => m.trim()).length;

  // ── Duplicate check against /api/payment/check-duplicate ──────
  async function checkDuplicates() {
    setChecking(true);
    try {
      const res = await fetch(`${BASE_URL}/payment/check-duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName:     teamName.trim(),
          captainEmail: captainEmail.trim(),
          captainPhone: captainPhone.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) return null; // network / server error — let through
      return json.data; // { teamName: bool, email: bool, phone: bool }
    } catch {
      return null; // don't block on network error
    } finally {
      setChecking(false);
    }
  }

  const goStep2 = async () => {
    // ── Client-side validation first ──────────────────────────
    const newErrors = {};
    const nameErr = validateName(captainName);
    if (!teamName.trim())   newErrors.teamName    = "Team name is required.";
    if (nameErr)            newErrors.captainName = nameErr;
    const phoneErr = validatePhone(captainPhone);
    if (phoneErr)           newErrors.captainPhone = phoneErr;
    const emailErr = validateEmail(captainEmail);
    if (emailErr)           newErrors.captainEmail = emailErr;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    // ── Server-side duplicate check ───────────────────────────
    const dupes = await checkDuplicates();
    if (dupes) {
      const dupErrors = {};
      if (dupes.teamName) dupErrors.teamName    = "This team name is already registered. Please choose another.";
      if (dupes.email)    dupErrors.captainEmail = "This email address is already registered with another team.";
      if (dupes.phone)    dupErrors.captainPhone = "This phone number is already registered with another team.";
      if (Object.keys(dupErrors).length > 0) { setErrors(dupErrors); return; }
    }

    setErrors({}); setStep(2);
  };

  const updateMember = (i, val) =>
    setMembers(ms => ms.map((m, idx) => idx === i ? val : m));

  const addMember = () => {
    const filledCount = members.filter(m => m.trim()).length;
    if (1 + filledCount >= MAX_TOTAL) {
      setErrors(e => ({ ...e, members: `Maximum team size is ${MAX_TOTAL} members.` }));
      return;
    }
    setErrors(e => { const n = {...e}; delete n.members; return n; });
    setMembers(ms => [...ms, ""]);
  };

  const removeMember = (i) => {
    setErrors(e => { const n = {...e}; delete n.members; return n; });
    setMembers(ms => ms.filter((_, idx) => idx !== i));
  };

  const buildPayload = () => ({
    teamName: teamName.trim(),
    members: [
      { userName: captainName.trim(), phone: captainPhone.trim(), email: captainEmail.trim(), isLead: true },
      ...members.filter(m => m.trim()).map(name => ({ userName: name.trim(), isLead: false })),
    ],
  });

  const handleEsewa = async () => {
    setErrors({});
    try {
      const payload = buildPayload();
      localStorage.setItem("pendingRegistration", JSON.stringify(payload));
      localStorage.setItem("pendingTeamName", payload.teamName);
      const d = (await initiateEsewa({ teamName: payload.teamName }).unwrap()).data;
      const form = document.createElement("form");
      form.method = "POST"; form.action = d.paymentUrl;
      const fields = {
        amount: d.amount, tax_amount: 0, total_amount: d.amount,
        transaction_uuid: d.transactionUuid, product_code: d.productCode,
        product_service_charge: 0, product_delivery_charge: 0,
        success_url: d.successUrl, failure_url: d.failureUrl,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: d.signature,
      };
      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden"; input.name = k; input.value = String(v);
        form.appendChild(input);
      });
      document.body.appendChild(form); form.submit();
    } catch (e) {
      setErrors({ payment: e?.data?.message || e?.message || "eSewa payment failed." });
    }
  };

  const handleKhalti = async () => {
    setErrors({});
    try {
      const payload = buildPayload();
      localStorage.setItem("pendingRegistration", JSON.stringify(payload));
      localStorage.setItem("pendingTeamName", payload.teamName);
      const res = await initiateKhalti({
        teamName: payload.teamName,
        captainEmail: captainEmail.trim(),
        captainPhone: captainPhone.trim(),
      }).unwrap();
      window.location.href = res.data.paymentUrl;
    } catch (e) {
      setErrors({ payment: e?.data?.message || e?.message || "Khalti payment failed." });
    }
  };

  const fieldRow = (label, type, value, setter, placeholder, errKey) => (
    <div key={errKey}>
      <span style={labelStyle}>{label}</span>
      <input
        style={{
          ...INPUT_STYLE,
          borderColor: errors[errKey] ? "rgba(255,100,100,0.6)" : "rgba(255,255,255,0.18)",
        }}
        type={type}
        value={value}
        onChange={e => {
          setter(e.target.value);
          setErrors(er => { const n = {...er}; delete n[errKey]; return n; });
        }}
        placeholder={placeholder}
      />
      {errors[errKey] && <span style={errorStyle}>⚠ {errors[errKey]}</span>}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, background: "#060e1c",
        border: `1px solid ${accent}44`, borderTop: `3px solid ${accent}`,
        borderRadius: 16, padding: "28px 28px",
        boxShadow: `0 0 60px ${accent}22, 0 24px 48px rgba(0,0,0,0.8)`,
        position: "relative", maxHeight: "90vh", overflowY: "auto",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.06)", border: "none", color: "#fff",
          width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16,
        }}>✕</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 10, letterSpacing: ".28em", color: accent,
            fontFamily: FONT_MONO, marginBottom: 6,
          }}>
            {eventName.toUpperCase()} · REGISTRATION
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", fontFamily: FONT_SERIF }}>
            Join the Hackathon
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                height: 3, flex: 1, borderRadius: 2,
                background: step >= s ? accent : "rgba(255,255,255,0.08)",
                transition: "background .3s",
              }} />
            ))}
          </div>
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: FONT_MONO,
            letterSpacing: ".12em", marginTop: 6,
          }}>
            {step === 1
              ? "STEP 1 OF 3 · TEAM INFO"
              : step === 2
              ? `STEP 2 OF 3 · MEMBERS · ${totalMembers}/${MAX_TOTAL}`
              : "STEP 3 OF 3 · PAYMENT"}
          </div>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Team name */}
            <div>
              <span style={labelStyle}>TEAM NAME</span>
              <input
                style={{
                  ...INPUT_STYLE,
                  borderColor: errors.teamName ? "rgba(255,100,100,0.6)" : "rgba(255,255,255,0.18)",
                }}
                type="text"
                value={teamName}
                onChange={e => {
                  setTeamName(e.target.value);
                  setErrors(er => { const n = {...er}; delete n.teamName; return n; });
                }}
                placeholder="Team Innovators"
              />
              {errors.teamName && <span style={errorStyle}>⚠ {errors.teamName}</span>}
            </div>

            {/* Captain block */}
            <div style={{
              padding: 14, background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.18)", borderRadius: 10,
            }}>
              <div style={{
                fontSize: 11, color: "rgba(245,158,11,0.9)", letterSpacing: ".18em",
                fontFamily: FONT_MONO, marginBottom: 12, fontWeight: 700,
              }}>⭐ TEAM CAPTAIN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {fieldRow("FULL NAME",     "text",  captainName,  setCaptainName,  "Jane Doe",              "captainName")}
                {fieldRow("PHONE NUMBER",  "tel",   captainPhone, setCaptainPhone, "+977-98XXXXXXXX",       "captainPhone")}
                {fieldRow("EMAIL ADDRESS", "email", captainEmail, setCaptainEmail, "captain@example.com",   "captainEmail")}
              </div>
            </div>

            <button
              onClick={goStep2}
              disabled={checking}
              style={{
                marginTop: 4, padding: "13px", background: checking ? "rgba(245,158,11,0.4)" : accent,
                border: "none", borderRadius: 8, color: "#000", fontWeight: 700,
                fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".1em",
                cursor: checking ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {checking ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14"
                    style={{ animation: "spin 0.8s linear infinite" }}>
                    <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
                    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  CHECKING...
                </>
              ) : "NEXT: ADD MEMBERS →"}
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Locked captain row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)",
              borderRadius: 8,
            }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#fde68a", fontFamily: FONT_BODY, fontWeight: 600 }}>
                  {captainName}
                </div>
                <div style={{ fontSize: 11, color: "rgba(245,158,11,0.6)", fontFamily: FONT_BODY }}>
                  Captain · {captainPhone} · {captainEmail}
                </div>
              </div>
              <span style={{ fontSize: 10, color: "rgba(245,158,11,0.45)", fontFamily: FONT_MONO }}>LOCKED</span>
            </div>

            <div>
              <span style={{ ...labelStyle, display: "block" }}>
                ADDITIONAL MEMBERS (optional · max {MAX_TOTAL - 1} more)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {members.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      style={{ ...INPUT_STYLE, flex: 1 }}
                      type="text"
                      value={m}
                      onChange={e => updateMember(i, e.target.value)}
                      placeholder={`Member ${i + 2} full name`}
                    />
                    {members.length > 1 && (
                      <button onClick={() => removeMember(i)} style={{
                        width: 32, height: 40, borderRadius: 6,
                        background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,80,80,0.25)",
                        color: "#ff7777", cursor: "pointer", fontSize: 14, flexShrink: 0,
                      }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {(1 + members.length) < MAX_TOTAL && (
              <button onClick={addMember} style={{
                padding: "9px 14px", background: "transparent",
                border: `1px dashed ${accent}55`, borderRadius: 8, color: accent,
                fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer",
              }}>
                + ADD ANOTHER MEMBER
              </button>
            )}

            {errors.members && (
              <div style={{
                padding: "8px 12px", background: "rgba(255,50,50,0.1)",
                border: "1px solid rgba(255,80,80,0.3)", borderRadius: 8,
                color: "#ff8888", fontFamily: FONT_BODY, fontSize: 13,
              }}>⚠ {errors.members}</div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => { setStep(1); setErrors({}); }} style={{
                flex: 1, padding: "13px", background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
                color: "#7aa8cc", fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer",
              }}>← BACK</button>
              <button onClick={() => { setErrors({}); setStep(3); }} style={{
                flex: 2, padding: "13px", background: accent, border: "none",
                borderRadius: 8, color: "#000", fontWeight: 700,
                fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer",
              }}>NEXT: PAYMENT →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Order summary */}
            <div style={{
              padding: "14px 16px", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
            }}>
              <div style={{
                fontSize: 11, color: "#7aa8cc", letterSpacing: ".18em",
                fontFamily: FONT_MONO, marginBottom: 10, fontWeight: 600,
              }}>ORDER SUMMARY</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#e2f0ff", fontFamily: FONT_BODY }}>
                  Team: <strong>{teamName}</strong>
                </span>
                <span style={{ fontSize: 13, color: "#e2f0ff", fontFamily: FONT_BODY }}>
                  {totalMembers} member{totalMembers > 1 ? "s" : ""}
                </span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 8,
              }}>
                <span style={{ fontSize: 13, color: "#fde68a", fontFamily: FONT_BODY, fontWeight: 700 }}>
                  Registration Fee
                </span>
                <span style={{ fontSize: 16, color: accent, fontFamily: FONT_MONO, fontWeight: 700 }}>
                  {currency} {fee}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#7aa8cc", letterSpacing: ".18em", fontFamily: FONT_MONO, fontWeight: 600 }}>
              CHOOSE PAYMENT METHOD
            </div>

            {[
              {
                handler: handleEsewa, loading: esewaLoad,
                bg: "rgba(95,188,68,0.08)", border: "rgba(95,188,68,0.4)", hoverBorder: "rgba(95,188,68,0.8)",
                iconBg: "#5fbc44", iconText: "e", iconFontSize: 20,
                label: "Pay with eSewa", labelColor: "#6dd46e",
                subLabel: "SECURE · INSTANT · NEPAL", subColor: "rgba(95,188,68,0.55)",
              },
              {
                handler: handleKhalti, loading: khaltiLoad,
                bg: "rgba(102,46,155,0.08)", border: "rgba(102,46,155,0.45)", hoverBorder: "rgba(167,139,250,0.8)",
                iconBg: "#662e9b", iconText: "💜", iconFontSize: 16,
                label: "Pay with Khalti", labelColor: "#c084fc",
                subLabel: "SECURE · INSTANT · NEPAL", subColor: "rgba(167,139,250,0.5)",
              },
            ].map(({ handler, loading, bg, border, hoverBorder, iconBg, iconText, iconFontSize, label, labelColor, subLabel, subColor }) => (
              <button
                key={label}
                onClick={handler}
                disabled={esewaLoad || khaltiLoad}
                style={{
                  padding: "14px 16px", background: bg, border: `2px solid ${border}`,
                  borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center",
                  gap: 12, transition: "all .2s", opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = hoverBorder}
                onMouseLeave={e => e.currentTarget.style.borderColor = border}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 9, background: iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: iconFontSize, fontWeight: 900, color: "#fff" }}>{iconText}</span>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 14, color: labelColor, fontFamily: FONT_BODY, fontWeight: 700 }}>
                    {loading ? "PROCESSING..." : label}
                  </div>
                  <div style={{ fontSize: 10, color: subColor, fontFamily: FONT_MONO, letterSpacing: ".1em" }}>
                    {subLabel}
                  </div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 14, color: labelColor, fontFamily: FONT_MONO, fontWeight: 700 }}>
                  {currency} {fee}
                </span>
              </button>
            ))}

            {errors.payment && (
              <div style={{
                padding: "10px 14px", background: "rgba(255,50,50,0.1)",
                border: "1px solid rgba(255,80,80,0.3)", borderRadius: 8,
                color: "#ff8888", fontFamily: FONT_BODY, fontSize: 13,
              }}>⚠ {errors.payment}</div>
            )}

            <button onClick={() => { setStep(2); setErrors({}); }} style={{
              padding: "11px", background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
              color: "#7aa8cc", fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer",
            }}>← BACK</button>
          </div>
        )}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────
// TOP SCROLL HINT
// ─────────────────────────────────────────────────────────────────
function TopScrollHint({ opacity, isMobile }) {
  if (isMobile) {
    return (
      <div style={{
        position: "absolute", top: 64, left: "50%", transform: "translateX(-50%)",
        zIndex: 30, pointerEvents: "none", opacity, transition: "opacity 0.6s ease",
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 16px",
        background: "rgba(6,182,212,0.15)",
        border: "1px solid rgba(6,182,212,0.35)",
        borderRadius: 24, backdropFilter: "blur(10px)",
        boxShadow: "0 0 20px rgba(6,182,212,0.2)",
        whiteSpace: "nowrap",
      }}>
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
          <rect x="1" y="1" width="12" height="18" rx="6" stroke="rgba(6,182,212,0.8)" strokeWidth="1.5" fill="none" />
          <rect x="5.5" y="4" width="3" height="4" rx="1.5" fill="rgba(6,182,212,0.9)"
            style={{ animation: "wheelScroll 1.6s ease-in-out infinite" }} />
        </svg>
        <span style={{ fontSize: 11, color: "rgba(6,182,212,0.95)", fontFamily: FONT_BODY,
          fontWeight: 600, letterSpacing: ".04em" }}>Swipe to explore</span>
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none"
          style={{ animation: "chevronBounce 1.4s ease-in-out infinite" }}>
          <path d="M1 2 L6 7 L11 2" stroke="rgba(6,182,212,0.8)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
      zIndex: 30, pointerEvents: "none", opacity, transition: "opacity 0.6s ease",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      padding: "20px 40px 24px",
      background: "linear-gradient(0deg, rgba(6,20,40,0.95) 0%, rgba(6,20,40,0.6) 100%)",
      borderTop: "1px solid rgba(6,182,212,0.35)",
      borderLeft: "1px solid rgba(6,182,212,0.15)",
      borderRight: "1px solid rgba(6,182,212,0.15)",
      borderRadius: "20px 20px 0 0",
      backdropFilter: "blur(14px)",
      boxShadow: "0 -4px 30px rgba(6,182,212,0.15), 0 0 60px rgba(6,182,212,0.08)",
      minWidth: 300,
    }}>
      <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
        <rect x="2" y="2" width="28" height="44" rx="14"
          stroke="rgba(6,182,212,0.7)" strokeWidth="2" fill="none" />
        <rect x="13" y="10" width="6" height="10" rx="3"
          fill="rgba(6,182,212,0.95)"
          style={{ animation: "wheelScroll 1.6s ease-in-out infinite" }} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 16, color: "rgba(103,232,249,0.98)", fontFamily: FONT_BODY,
          fontWeight: 700, letterSpacing: ".04em", whiteSpace: "nowrap" }}>Scroll to Drive</span>
        <span style={{ fontSize: 10, color: "rgba(6,182,212,0.6)", fontFamily: FONT_MONO,
          letterSpacing: ".22em", whiteSpace: "nowrap" }}>MOUSE WHEEL · TRACKPAD · SWIPE</span>
      </div>
      <svg width="20" height="18" viewBox="0 0 20 18" fill="none"
        style={{ animation: "chevronBounce 1.4s ease-in-out infinite" }}>
        <path d="M3 3 L10 9 L17 3" stroke="rgba(6,182,212,0.8)"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 9 L10 15 L17 9" stroke="rgba(6,182,212,0.35)"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TEAMS PANEL
// ─────────────────────────────────────────────────────────────────
function TeamsPanel({ isAdmin, accent }) {
  const { data: teamsResp, isLoading, refetch } = useGetTeamsQuery(undefined, { skip: !isAdmin });
  const [deleteTeam] = useDeleteTeamMutation();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;
  const teams = teamsResp?.data || [];

  const handleDelete = async (teamId, teamName) => {
    if (!window.confirm(`Delete team "${teamName}"? This cannot be undone.`)) return;
    try { await deleteTeam(teamId).unwrap(); }
    catch { alert("Failed to delete team."); }
  };

  return (
    <div style={{ position: "absolute", bottom: 24, right: 140, zIndex: 20 }}>
      <button onClick={() => { setOpen(o => !o); if (!open) refetch(); }}
        style={{ padding: "6px 12px", background: "rgba(6,182,212,0.12)",
          border: "1px solid rgba(6,182,212,0.35)", borderRadius: 7,
          color: "rgba(6,182,212,0.9)", fontFamily: FONT_MONO,
          fontSize: 9, letterSpacing: ".18em", cursor: "pointer" }}>
        👥 TEAMS {teams.length > 0 ? `(${teams.length})` : ""}
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: 34, right: 0, width: 340, maxHeight: 420,
          background: "#060e1c", border: "1px solid rgba(6,182,212,0.3)",
          borderRadius: 10, overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.8)" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(6,182,212,0.12)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, background: "#060e1c", zIndex: 1 }}>
            <span style={{ fontSize: 10, letterSpacing: ".25em",
              color: "rgba(6,182,212,0.8)", fontFamily: FONT_MONO, fontWeight: 600 }}>
              REGISTERED TEAMS · {teams.length}
            </span>
            <button onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
          {isLoading ? (
            <div style={{ padding: 20, textAlign: "center", fontSize: 12,
              color: "rgba(6,182,212,0.5)", fontFamily: FONT_BODY }}>Loading...</div>
          ) : teams.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", fontSize: 12,
              color: "rgba(6,182,212,0.45)", fontFamily: FONT_BODY }}>No teams registered yet</div>
          ) : (
            teams.map(team => (
              <div key={team.teamId} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(6,182,212,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#fde68a", fontFamily: FONT_BODY, fontWeight: 700 }}>{team.teamName}</span>
                    <span style={{ fontSize: 10, color: "rgba(6,182,212,0.5)", fontFamily: FONT_MONO, marginLeft: 8 }}>{team.members.length}P</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: "rgba(6,182,212,0.45)", fontFamily: FONT_MONO }}>{team.registrationId}</span>
                    <button onClick={() => handleDelete(team.teamId, team.teamName)}
                      style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(255,50,50,0.1)",
                        border: "1px solid rgba(255,80,80,0.25)", color: "#ff6666",
                        cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>🗑</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {team.members.map(m => (
                    <div key={m.memberId} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: m.isLead ? "rgba(245,158,11,0.9)" : "rgba(6,182,212,0.7)", fontFamily: FONT_BODY }}>
                        {m.isLead ? "⭐" : "·"} {m.userName}
                      </span>
                      {m.isLead && m.phone && (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: FONT_BODY, marginLeft: "auto" }}>{m.phone}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SPONSOR CARD
// ─────────────────────────────────────────────────────────────────
function SponsorCard({ sp, isAdmin, onEdit, onDelete }) {
  const [imgErr, setImgErr] = useState(false);
  const logoSrc = sp.logo ? resolveImageUrl(sp.logo) : null;
  const showImg = logoSrc && !imgErr;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isAdmin) { onEdit(); return; }
    if (sp.link) {
      const url = sp.link.match(/^https?:\/\//) ? sp.link : `https://${sp.link}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div onClick={handleClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "14px 16px 10px",
        background: `${sp.color}0d`, border: `1px solid ${sp.color}33`,
        borderTop: `3px solid ${sp.color}`,
        borderRadius: 8, cursor: (isAdmin || sp.link) ? "pointer" : "default",
        transition: "all .18s", position: "relative", textAlign: "center" }}>
      {sp.role && (
        <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
          background: sp.color, color: "#000", fontSize: 9, fontWeight: 800,
          fontFamily: FONT_MONO, letterSpacing: ".15em",
          padding: "3px 12px", borderRadius: 10, whiteSpace: "nowrap",
          boxShadow: `0 2px 8px ${sp.color}66` }}>
          {sp.role.toUpperCase()}
        </div>
      )}
      {showImg ? (
        <img src={logoSrc} alt={sp.name} onError={() => setImgErr(true)}
          style={{ width: 52, height: 52, objectFit: "contain", marginTop: 6 }} />
      ) : (
        <div style={{ width: 52, height: 52, borderRadius: 8, background: `${sp.color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 700, color: sp.color, marginTop: 6 }}>
          {sp.name.charAt(0)}
        </div>
      )}
      <span style={{ fontSize: 13, color: sp.color, fontFamily: FONT_BODY, fontWeight: 700 }}>{sp.name}</span>
      {sp.tier && (
        <span style={{ fontSize: 9, color: `${sp.color}88`, fontFamily: FONT_MONO, letterSpacing: ".1em" }}>
          {sp.tier.toUpperCase()}
        </span>
      )}
      {isAdmin && (
        <div style={{ display: "flex", gap: 6, marginTop: 2 }} onClick={e => e.stopPropagation()}>
          <AdminBtn icon="✏" accent={sp.color} onClick={onEdit} />
          <AdminBtn icon="🗑" accent="#ef4444" onClick={onDelete} />
        </div>
      )}
      {!isAdmin && sp.link && (
        <span style={{ fontSize: 8, color: sp.color, opacity: 0.6 }}>↗ VISIT</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// THEME LIST — expandable per-theme cards with CRUD (Change 4)
// ─────────────────────────────────────────────────────────────────
function ThemeList({ isAdmin, accent, refetchAll }) {
  const { data: themesResp, refetch } = useGetThemesQuery();
  const [updateTheme] = useUpdateThemeMutation();
  const [createTheme] = useCreateThemeMutation();
  const [deleteTheme] = useDeleteThemeMutation();
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(null);

  const themes = themesResp?.data || [];

  const THEME_FIELDS = [
    { key: "title",        label: "Title" },
    { key: "subtitle",     label: "Subtitle" },
    { key: "focusArea",    label: "Focus Area" },
    { key: "coreQuestion", label: "Core Question" },
    { key: "approach",     label: "Approach" },
    { key: "scaleNote",    label: "Scale Note" },
  ];

  const afterSave = async (fn) => {
    await fn();
    refetch();
    refetchAll();
    setModal(null);
  };

  return (
    <>
      {modal}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {themes.length === 0 && (
          <div style={{ padding: "12px 14px", fontSize: 12,
            color: "rgba(180,130,60,0.5)", fontFamily: FONT_BODY, fontStyle: "italic" }}>
            No themes defined yet.
          </div>
        )}
        {themes.map(t => (
          <div key={t.themeId}
            style={{
              border: `1px solid ${accent}44`,
              background: expanded === t.themeId ? `${accent}0d` : "rgba(255,255,255,0.02)",
              borderRadius: 10, overflow: "hidden", transition: "background 0.25s",
            }}>
            {/* Clickable header */}
            <div
              onClick={() => setExpanded(e => e === t.themeId ? null : t.themeId)}
              style={{ display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", cursor: "pointer", userSelect: "none" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>✨</span>
              <span style={{ flex: 1, fontSize: 13, color: accent,
                fontFamily: FONT_BODY, fontWeight: 700, lineHeight: 1.3 }}>
                {t.title || "Untitled Theme"}
              </span>
              {isAdmin && (
                <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                  <AdminBtn icon="✏" accent={accent} onClick={() => setModal(
                    <AdminModal
                      title="Edit Theme"
                      accent={accent}
                      fields={THEME_FIELDS}
                      initial={t}
                      onSave={v => afterSave(() => updateTheme(v).unwrap())}
                      onDelete={() => afterSave(() => deleteTheme(t.themeId).unwrap())}
                      onClose={() => setModal(null)}
                    />
                  )} />
                </div>
              )}
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none"
                style={{
                  transform: expanded === t.themeId ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s", flexShrink: 0,
                }}>
                <path d="M1 2 L6 7 L11 2" stroke={accent} strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Expandable details */}
            {expanded === t.themeId && (
              <div style={{
                padding: "0 14px 14px",
                display: "flex", flexDirection: "column", gap: 10,
                borderTop: `1px solid ${accent}22`,
              }}>
                {[
                  { label: "Subtitle",      value: t.subtitle },
                  { label: "Focus Area",    value: t.focusArea },
                  { label: "Core Question", value: t.coreQuestion },
                  { label: "Approach",      value: t.approach },
                  { label: "Scale Note",    value: t.scaleNote },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} style={{ paddingTop: 8 }}>
                    <div style={{ fontSize: 9, color: `${accent}88`, letterSpacing: ".14em",
                      fontFamily: FONT_MONO, textTransform: "uppercase",
                      marginBottom: 3, fontWeight: 600 }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: "#f0ddb0",
                      fontFamily: FONT_BODY, lineHeight: 1.5 }}>{row.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isAdmin && (
          <button
            onClick={() => setModal(
              <AdminModal
                title="Add Theme"
                accent={accent}
                fields={THEME_FIELDS}
                initial={{ title: "", subtitle: "", focusArea: "", coreQuestion: "", approach: "", scaleNote: "" }}
                onSave={v => afterSave(() => createTheme(v).unwrap())}
                onClose={() => setModal(null)}
              />
            )}
            style={{ padding: "9px 14px", background: "transparent",
              border: `1px dashed ${accent}55`, borderRadius: 8, color: accent,
              fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer", letterSpacing: ".08em" }}>
            + ADD THEME
          </button>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// SECTION PANEL
// ─────────────────────────────────────────────────────────────────
function SectionPanel({ secId, snapshot, isAdmin, isMobile, onRegister, refetchAll }) {
  const [collapsed, setCollapsed] = useState(false);
  const [adminModal, setAdminModal] = useState(null);

  const [updateConfig]   = useUpdateConfigMutation();
  const [updateTheme]    = useUpdateThemeMutation();
  const [createSponsor]  = useCreateSponsorMutation();
  const [updateSponsor]  = useUpdateSponsorMutation();
  const [deleteSponsor]  = useDeleteSponsorMutation();
  const [createSchedule] = useCreateScheduleItemMutation();
  const [updateSchedule] = useUpdateScheduleItemMutation();
  const [deleteSchedule] = useDeleteScheduleItemMutation();
  const [createReward]   = useCreateRewardMutation();
  const [updateReward]   = useUpdateRewardMutation();
  const [deleteReward]   = useDeleteRewardMutation();
  const [createRule]     = useCreateRuleMutation();
  const [updateRule]     = useUpdateRuleMutation();
  const [deleteRule]     = useDeleteRuleMutation();

  useEffect(() => { setCollapsed(false); }, [secId]);
  if (!secId || !snapshot) return null;

  const { accent, accentDark } = SECTION_ACCENTS[secId] || SECTION_ACCENTS.overview;
  const cfg   = snapshot.config;
  const theme = snapshot.theme;

  const displayEventName = cfg.eventName || "Aadim Hackathon";

  const renderIcon = (iconPath, fallbackEmoji, size = 13) =>
    iconPath ? <IconDisplay icon={iconPath} fallbackEmoji={fallbackEmoji} size={size * 1.6} /> : fallbackEmoji;

  const afterSave = async fn => { await fn(); refetchAll(); setAdminModal(null); };

  let sectionTitle, sectionSubtitle, sectionIcon, contentRows, addButton;

  if (secId === "overview") {
    sectionTitle = displayEventName;
    sectionSubtitle = cfg.tagline;
    sectionIcon = "🚀";
    const editConfig = isAdmin ? () => openEditConfig() : undefined;
    contentRows = [
      { icon: "🏁", label: "Format",    value: cfg.format,       onEdit: editConfig },
      { icon: "👥", label: "Team size", value: `${cfg.teamSizeMin === cfg.teamSizeMax ? cfg.teamSizeMin : `${cfg.teamSizeMin}–${cfg.teamSizeMax}`} members`, onEdit: editConfig },
      { icon: "🌍", label: "Theme",     value: theme.focusArea,  onEdit: editConfig },
      { icon: "📍", label: "Location",  value: cfg.location,     onEdit: editConfig },
      { icon: "📞", label: "Contact",   value: "info@aadimhackathon.com · +977-98XXXXXXXX", onEdit: undefined },
    ];
    if (isAdmin) addButton = <AdminBtn icon="✏" accent={accent} onClick={() => openEditConfig()} />;
  } else if (secId === "schedule") {
    sectionTitle = "Journey Timeline"; sectionSubtitle = "Every mile counts. Every hour matters."; sectionIcon = "📅";
    contentRows = snapshot.schedule.map((item, i) => ({
      iconNode: renderIcon(item.icon, ICON_FALLBACKS.schedule[i % 8]),
      label: `${item.dayLabel} · ${item.timeLabel}`, value: item.eventLabel,
      onEdit: isAdmin ? () => openEditSchedule(item) : undefined,
      onDelete: isAdmin ? () => { if (window.confirm("Delete this schedule item?")) afterSave(() => deleteSchedule(item.itemId).unwrap()); } : undefined,
    }));
    if (isAdmin) addButton = <AdminBtn icon="+" accent={accent} onClick={() => openAddSchedule()} />;
  } else if (secId === "rewards") {
    sectionTitle = "Epic Rewards Await"; sectionSubtitle = "Build great things. Win greater prizes."; sectionIcon = "🏆";
    contentRows = snapshot.rewards.map((r, i) => ({
      iconNode: renderIcon(r.icon, ICON_FALLBACKS.rewards[i % 8]),
      label: r.label, value: r.value,
      onEdit: isAdmin ? () => openEditReward(r) : undefined,
      onDelete: isAdmin ? () => { if (window.confirm("Delete this reward?")) afterSave(() => deleteReward(r.rewardId).unwrap()); } : undefined,
    }));
    if (isAdmin) addButton = <AdminBtn icon="+" accent={accent} onClick={() => openAddReward()} />;
  } else if (secId === "theme") {
    // Change 4: theme section now uses ThemeList component, not snapshot.theme
    sectionTitle = "Event Themes";
    sectionSubtitle = "Explore this year's challenge areas.";
    sectionIcon = "✨";
    contentRows = []; // ThemeList renders below instead
    if (isAdmin) addButton = null; // Add button is inside ThemeList
  } else if (secId === "rules") {
    sectionTitle = "The Road Rules"; sectionSubtitle = "Fair play, open source, great demos."; sectionIcon = "📋";
    contentRows = snapshot.rules.map((r, i) => ({
      iconNode: renderIcon(r.icon, ICON_FALLBACKS.rules[i % 8]),
      label: r.label, value: r.value,
      onEdit: isAdmin ? () => openEditRule(r) : undefined,
      onDelete: isAdmin ? () => { if (window.confirm("Delete this rule?")) afterSave(() => deleteRule(r.ruleId).unwrap()); } : undefined,
    }));
    if (isAdmin) addButton = <AdminBtn icon="+" accent={accent} onClick={() => openAddRule()} />;
  }

  const SPONSOR_FIELDS = [
    { key: "name",      label: "Name" },
    { key: "logo",      label: "Logo Image",   type: "image" },
    { key: "link",      label: "Website URL" },
    { key: "role",      label: "Role / What they sponsor" },
    { key: "color",     label: "Brand Color",  type: "color" },
    { key: "tier",      label: "Tier (e.g. Gold, Silver, Bronze)" },
    { key: "sortOrder", label: "Sort Order",   type: "number" },
  ];
  const SPONSOR_DEFAULTS = { name: "", logo: "", link: "", role: "", color: "#ffffff", tier: "Silver", sortOrder: 0, isActive: true };

  function openEditConfig() {
    setAdminModal(<AdminModal title="Edit Event Config" accent={accent}
      fields={[
        { key: "eventName",   label: "Event Name" },
        { key: "edition",     label: "Edition" },
        { key: "tagline",     label: "Tagline" },
        { key: "location",    label: "Location" },
        { key: "format",      label: "Format" },
        { key: "teamSizeMin", label: "Team Min", type: "number" },
        { key: "teamSizeMax", label: "Team Max", type: "number" },
      ]}
      initial={cfg}
      onSave={v => afterSave(() => updateConfig(v).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  function openEditTheme() {
    setAdminModal(<AdminModal title="Edit Theme" accent={accent}
      fields={[
        { key: "title",        label: "Title" },
        { key: "subtitle",     label: "Subtitle" },
        { key: "focusArea",    label: "Focus Area" },
        { key: "coreQuestion", label: "Core Question" },
        { key: "approach",     label: "Approach" },
        { key: "scaleNote",    label: "Scale Note" },
      ]}
      initial={theme}
      onSave={v => afterSave(() => updateTheme(v).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  function openEditSponsor(sp) {
    setAdminModal(<AdminModal title="Edit Sponsor" accent={accent} fields={SPONSOR_FIELDS}
      initial={{ ...sp, isActive: true }}
      onSave={v => afterSave(() => updateSponsor({ id: sp.sponsorId, data: v }).unwrap())}
      onDelete={() => afterSave(() => deleteSponsor(sp.sponsorId).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  function openAddSponsor() {
    setAdminModal(<AdminModal title="Add Sponsor" accent={accent} fields={SPONSOR_FIELDS}
      initial={SPONSOR_DEFAULTS}
      onSave={v => afterSave(() => createSponsor(v).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  function openEditSchedule(item) {
    setAdminModal(<AdminModal title="Edit Schedule Item" accent={accent}
      fields={[
        { key: "icon",       label: "Icon Image",  type: "image" },
        { key: "dayLabel",   label: "Day Label" },
        { key: "timeLabel",  label: "Time" },
        { key: "eventLabel", label: "Event Name" },
        { key: "sortOrder",  label: "Sort Order",  type: "number" },
      ]}
      initial={{ ...item, isActive: true }}
      onSave={v => afterSave(() => updateSchedule({ id: item.itemId, data: v }).unwrap())}
      onDelete={() => afterSave(() => deleteSchedule(item.itemId).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  function openAddSchedule() {
    setAdminModal(<AdminModal title="Add Schedule Item" accent={accent}
      fields={[
        { key: "icon",       label: "Icon Image",  type: "image" },
        { key: "dayLabel",   label: "Day Label" },
        { key: "timeLabel",  label: "Time" },
        { key: "eventLabel", label: "Event Name" },
        { key: "sortOrder",  label: "Sort Order",  type: "number" },
      ]}
      initial={{ icon: "", dayLabel: "Day 1", timeLabel: "12:00 PM", eventLabel: "", sortOrder: 0, isActive: true }}
      onSave={v => afterSave(() => createSchedule(v).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  function openEditReward(r) {
    setAdminModal(<AdminModal title="Edit Reward" accent={accent}
      fields={[{ key: "icon", label: "Icon Image", type: "image" }, { key: "label", label: "Label" }, { key: "value", label: "Prize Value" }, { key: "sortOrder", label: "Sort Order", type: "number" }]}
      initial={{ ...r, isActive: true }}
      onSave={v => afterSave(() => updateReward({ id: r.rewardId, data: v }).unwrap())}
      onDelete={() => afterSave(() => deleteReward(r.rewardId).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  function openAddReward() {
    setAdminModal(<AdminModal title="Add Reward" accent={accent}
      fields={[{ key: "icon", label: "Icon Image", type: "image" }, { key: "label", label: "Label" }, { key: "value", label: "Prize Value" }, { key: "sortOrder", label: "Sort Order", type: "number" }]}
      initial={{ icon: "", label: "", value: "", sortOrder: 0, isActive: true }}
      onSave={v => afterSave(() => createReward(v).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  function openEditRule(r) {
    setAdminModal(<AdminModal title="Edit Rule" accent={accent}
      fields={[{ key: "icon", label: "Icon Image", type: "image" }, { key: "label", label: "Label" }, { key: "value", label: "Rule Description" }, { key: "sortOrder", label: "Sort Order", type: "number" }]}
      initial={{ ...r, isActive: true }}
      onSave={v => afterSave(() => updateRule({ id: r.ruleId, data: v }).unwrap())}
      onDelete={() => afterSave(() => deleteRule(r.ruleId).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  function openAddRule() {
    setAdminModal(<AdminModal title="Add Rule" accent={accent}
      fields={[{ key: "icon", label: "Icon Image", type: "image" }, { key: "label", label: "Label" }, { key: "value", label: "Rule Description" }, { key: "sortOrder", label: "Sort Order", type: "number" }]}
      initial={{ icon: "", label: "", value: "", sortOrder: 0, isActive: true }}
      onSave={v => afterSave(() => createRule(v).unwrap())}
      onClose={() => setAdminModal(null)} />);
  }

  const woodGrain = `repeating-linear-gradient(92deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 18px)`;

  const containerStyle = isMobile
    ? { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        maxHeight: collapsed ? 52 : "58vh",
        transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden" }
    : { position: "absolute", bottom: 24, left: 24, width: "min(430px, calc(100vw - 48px))", zIndex: 20, animation: "slideUp .35s ease" };

  return (
    <>
      {adminModal}
      <div style={containerStyle}>
        <div style={{
          background: `${woodGrain}, linear-gradient(160deg, #1a120a 0%, #0f0a05 60%, #1a1208 100%)`,
          border: "1px solid rgba(180,130,60,0.35)",
          borderBottom: isMobile ? "none" : "1px solid rgba(180,130,60,0.35)",
          borderRadius: isMobile ? "16px 16px 0 0" : 12,
          boxShadow: `0 -2px 0 rgba(200,150,70,0.4), inset 0 1px 0 rgba(255,220,120,0.12), inset 0 -1px 0 rgba(0,0,0,0.5), 0 8px 40px rgba(0,0,0,0.7), 0 0 30px ${accent}18`,
          overflow: "hidden", position: "relative",
          display: "flex", flexDirection: "column", maxHeight: isMobile ? "58vh" : "85vh",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${accent}70, transparent)` }} />

          {/* Register button fixed at top */}
          <div style={{ padding: isMobile ? "10px 14px 8px" : "12px 20px 10px", flexShrink: 0,
            background: `${woodGrain}, linear-gradient(160deg, #1a120a 0%, #0f0a05 100%)`,
            borderBottom: `1px solid rgba(180,130,60,0.2)` }}>
            <button onClick={onRegister}
              style={{ width: "100%", padding: isMobile ? "10px 12px" : "11px 16px",
                background: `linear-gradient(135deg, ${accent}dd, ${accentDark}ee)`,
                border: `1px solid ${accent}80`, borderTop: `1px solid ${accent}cc`,
                borderRadius: 8, color: "#000", fontWeight: 800,
                fontFamily: FONT_MONO, fontSize: isMobile ? 11 : 12, letterSpacing: ".14em",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
                boxShadow: `0 4px 20px ${accent}40, inset 0 1px 0 rgba(255,255,255,0.25)`,
                transition: "all 0.18s ease" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 28px ${accent}60, inset 0 1px 0 rgba(255,255,255,0.3)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 20px ${accent}40, inset 0 1px 0 rgba(255,255,255,0.25)`; }}>
              <span style={{ fontSize: 14 }}>🏁</span>
              <span>REGISTER FOR {displayEventName.toUpperCase()}</span>
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: "auto", flex: 1 }}>

            {isMobile && (
              <div onClick={() => setCollapsed(c => !c)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px 8px", cursor: "pointer",
                  background: "rgba(0,0,0,0.2)",
                  borderBottom: collapsed ? "none" : "1px solid rgba(180,130,60,0.15)", userSelect: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{sectionIcon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: accent,
                    fontFamily: FONT_BODY, letterSpacing: ".02em" }}>{sectionTitle}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isAdmin && !collapsed && addButton && (
                    <div onClick={e => e.stopPropagation()}>{addButton}</div>
                  )}
                  <span style={{ fontSize: 9, color: "rgba(180,130,60,0.6)", fontFamily: FONT_MONO, letterSpacing: ".12em" }}>
                    {collapsed ? "EXPAND" : "COLLAPSE"}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                    <path d="M2 9 L7 4 L12 9" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            )}

            <div style={{ opacity: collapsed ? 0 : 1, transition: "opacity 0.3s",
              pointerEvents: collapsed ? "none" : "auto" }}>

              {!isMobile && (
                <div style={{ padding: "16px 20px 12px", position: "relative" }}>
                  {[{top:10,left:10},{top:10,right:10}].map((pos,i) => (
                    <div key={i} style={{ position: "absolute", ...pos, width: 5, height: 5,
                      borderRadius: "50%", background: "rgba(180,130,60,0.45)",
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)" }} />
                  ))}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                      background: `linear-gradient(135deg, ${accent}28, ${accentDark}40)`,
                      border: `1px solid ${accent}50`, display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 16px ${accent}25` }}>
                      <span style={{ fontSize: 22 }}>{sectionIcon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, letterSpacing: ".28em", color: "rgba(180,130,60,0.7)",
                        fontFamily: FONT_MONO, marginBottom: 4, textTransform: "uppercase",
                        fontWeight: 600 }}>Milestone · {secId}</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "#f8e8c0",
                        fontFamily: FONT_SERIF, lineHeight: 1.25 }}>{sectionTitle}</div>
                      <div style={{ fontSize: 11, color: "rgba(220,180,100,0.65)",
                        fontFamily: FONT_BODY, marginTop: 3, fontStyle: "italic" }}>{sectionSubtitle}</div>
                    </div>
                    {isAdmin && addButton && <div style={{ marginTop: 2 }}>{addButton}</div>}
                  </div>
                </div>
              )}

              <div style={{ margin: isMobile ? "0 16px" : "0 20px", height: 1,
                background: `linear-gradient(90deg, transparent, ${accent}55, rgba(180,130,60,0.3), ${accent}55, transparent)`,
                position: "relative" }}>
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
                  width: 6, height: 6, borderRadius: "50%", background: accent, opacity: 0.7,
                  boxShadow: `0 0 8px ${accent}` }} />
              </div>

              {/* Content rows (non-theme sections) */}
              {contentRows.length > 0 && (
                <div style={{ padding: isMobile ? "8px 16px" : "10px 20px" }}>
                  {contentRows.map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 0",
                      borderBottom: i < contentRows.length - 1 ? "1px solid rgba(180,130,60,0.1)" : "none" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                        background: "linear-gradient(135deg, rgba(20,12,4,0.8), rgba(40,24,8,0.6))",
                        border: `1px solid ${accent}35`, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, overflow: "hidden" }}>
                        {row.iconNode !== undefined ? row.iconNode : row.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 9, color: "rgba(180,130,80,0.75)", letterSpacing: ".14em",
                          fontFamily: FONT_MONO, textTransform: "uppercase", marginBottom: 2,
                          fontWeight: 600 }}>{row.label}</div>
                        <div style={{ fontSize: 13, color: "#f0ddb0", fontFamily: FONT_BODY,
                          fontWeight: 600 }}>{row.value}</div>
                      </div>
                      {isAdmin && row.onEdit ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <AdminBtn icon="✏" accent={accent} onClick={row.onEdit} />
                          {row.onDelete && <AdminBtn icon="🗑" accent="#ef4444" onClick={row.onDelete} />}
                        </div>
                      ) : (
                        <div style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                          border: `1px solid ${accent}30`, background: `${accent}12`,
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: accent, opacity: 0.6 }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Change 4: ThemeList for theme section */}
              {secId === "theme" && (
                <div style={{ padding: isMobile ? "8px 16px 12px" : "8px 20px 12px" }}>
                  <ThemeList
                    isAdmin={isAdmin}
                    accent={accent}
                    refetchAll={refetchAll}
                  />
                </div>
              )}

              {/* Sponsors */}
              <div style={{ padding: isMobile ? "4px 16px 8px" : "4px 20px 8px" }}>
                <div style={{ fontSize: 9, color: "rgba(180,130,60,0.6)", letterSpacing: ".2em",
                  fontFamily: FONT_MONO, marginBottom: 10, fontWeight: 600 }}>SPONSORS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {snapshot.sponsors.map(sp => (
                    <div key={sp.sponsorId} style={{ flex: "1 1 calc(50% - 5px)", minWidth: 140 }}>
                      <SponsorCard sp={sp} isAdmin={isAdmin}
                        onEdit={() => openEditSponsor(sp)}
                        onDelete={() => afterSave(() => deleteSponsor(sp.sponsorId).unwrap())} />
                    </div>
                  ))}
                  {isAdmin && (
                    <div style={{ flex: "1 1 calc(50% - 5px)", minWidth: 140,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `1px dashed ${accent}44`, borderRadius: 8, minHeight: 80 }}>
                      <AdminBtn icon="+" accent={accent} onClick={() => openAddSponsor()} />
                    </div>
                  )}
                </div>
              </div>

              {!isMobile && (
                <div style={{ padding: "6px 20px 12px", display: "flex",
                  alignItems: "center", justifyContent: "space-between",
                  borderTop: "1px solid rgba(180,130,60,0.08)" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {SECTION_IDS.map((id, i) => (
                      <div key={i} style={{ width: id === secId ? 14 : 4, height: 4, borderRadius: 2,
                        background: id === secId ? accent : "rgba(180,130,60,0.2)",
                        transition: "all 0.3s ease", boxShadow: id === secId ? `0 0 6px ${accent}80` : "none" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 8, color: "rgba(140,100,40,0.4)",
                    letterSpacing: ".2em", fontFamily: FONT_MONO }}>SCROLL TO DRIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function HackDrive3D() {
  const navigate    = useNavigate();
  const mountRef    = useRef(null);
  const rendererRef = useRef(null);
  const frameRef    = useRef(0);

  const carVelocityRef   = useRef(0);
  const scrollImpulseRef = useRef(0);
  const carPosRef        = useRef(0);
  const touchStartYRef   = useRef(null);
  const lastTouchYRef    = useRef(null);
  const carRef           = useRef(null);
  const wheelsRef        = useRef({});
  const buildingsRef     = useRef([]);
  const cameraRef        = useRef(null);
  const windmillsRef     = useRef([]);
  const carYawRef        = useRef(0);
  const skyUniRef        = useRef(null);
  const fountainRef      = useRef({});
  const birdGroupsRef    = useRef([]);
  const nitroRef         = useRef(null);
  const smoothWorldPos   = useRef({ x: 0, z: 0 });
  const smoothWorldVel   = useRef({ x: 0, z: 0 });

  const sponsorBuildingDataRef = useRef([]);
  const raycasterRef = useRef(null);
  const liveSponsorLinksRef = useRef([]);

  const [activeSectionId, setActiveSectionId] = useState(null);
  const [progress,        setProgress]        = useState(0);
  const [loadProgress,    setLoadProgress]    = useState(0);
  const [loadLabel,       setLoadLabel]       = useState("INITIALIZING");
  const [loaded,          setLoaded]          = useState(false);
  const [speed,           setSpeed]           = useState(0);
  const [showRegister,    setShowRegister]    = useState(false);
  const [nitroActive,     setNitroActive]     = useState(false);
  const [introVisible,    setIntroVisible]    = useState(true);
  const [introOpacity,    setIntroOpacity]    = useState(1);
  const [isMobile,        setIsMobile]        = useState(false);
  const [carMapPos,       setCarMapPos]       = useState({ x: 0, z: 0 });
  const [hoveredBuilding, setHoveredBuilding] = useState(false);

  const isAdmin = useIsAdmin();

  const { data: snapshotResp, isError: snapshotError, refetch: refetchSnapshot } = useGetSnapshotQuery();
  const { data: sponsorsResp, refetch: refetchSponsors } = useGetSponsorsQuery();
  const { data: scheduleResp, refetch: refetchSchedule } = useGetScheduleQuery();
  const { data: rewardsResp,  refetch: refetchRewards  } = useGetRewardsQuery();
  const { data: rulesResp,    refetch: refetchRules    } = useGetRulesQuery();
  useGetTeamsQuery(undefined, { skip: !isAdmin });

  const snapshot = {
    config:   snapshotResp?.data?.config    || FALLBACK_SNAPSHOT.config,
    theme:    snapshotResp?.data?.theme     || FALLBACK_SNAPSHOT.theme,
    sponsors: sponsorsResp?.data?.length
      ? sponsorsResp.data
      : snapshotResp?.data?.sponsors?.length
        ? snapshotResp.data.sponsors
        : FALLBACK_SNAPSHOT.sponsors,
    schedule: scheduleResp?.data || snapshotResp?.data?.schedule || FALLBACK_SNAPSHOT.schedule,
    rewards:  rewardsResp?.data  || snapshotResp?.data?.rewards  || FALLBACK_SNAPSHOT.rewards,
    rules:    rulesResp?.data    || snapshotResp?.data?.rules    || FALLBACK_SNAPSHOT.rules,
  };

  const displayEventName = snapshot.config.eventName || "Aadim Hackathon";

  useEffect(() => {
    liveSponsorLinksRef.current = snapshot.sponsors;
  }, [snapshot.sponsors]);

  const refetchAll = useCallback(() => {
    refetchSnapshot(); refetchSponsors(); refetchSchedule(); refetchRewards(); refetchRules();
  }, [refetchSnapshot, refetchSponsors, refetchSchedule, refetchRewards, refetchRules]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getSectionIdAt = useCallback(t => {
    const tN = ((t % 1) + 1) % 1;
    for (let i = 0; i < SEC_T.length; i++) {
      if (Math.abs(tN - SEC_T[i]) < 0.055 ||
          Math.abs(tN - SEC_T[i] - 1) < 0.055 ||
          Math.abs(tN - SEC_T[i] + 1) < 0.055)
        return SECTION_IDS[i];
    }
    return null;
  }, []);

  // ── THREE.JS INIT ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoadProgress(5); setLoadLabel("LOADING ENGINE");
      if (!mounted) return;

      const steps = [
        [15,"SCULPTING TERRAIN"],[28,"PAINTING SKY & SUN"],[42,"BUILDING COUNTRYSIDE"],
        [58,"PLACING ANIMALS & BIRDS"],[72,"ASSEMBLING VEHICLE"],[82,"LAYING ASPHALT"],
        [90,"FILLING THE POND"],[96,"STARTING ENGINE"],[99,"ALL SYSTEMS GO"],
      ];
      for (const [p, lbl] of steps) {
        if (!mounted) return;
        setLoadProgress(p); setLoadLabel(lbl);
        await new Promise(r => setTimeout(r, 80 + Math.random() * 60));
      }

      const W = mountRef.current.clientWidth, H = mountRef.current.clientHeight;
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.setClearColor(0x7ab0cc);
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      raycasterRef.current = new THREE.Raycaster();

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0xb8d4e8, 0.0045);

      const skyUniforms = { uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(-0.55, 0.70, 0.45).normalize() } };
      skyUniRef.current = skyUniforms;

      const sky = new THREE.Mesh(
        new THREE.SphereGeometry(420, 24, 12),
        new THREE.ShaderMaterial({
          side: THREE.BackSide, uniforms: skyUniforms,
          vertexShader: `varying vec3 vNorm; void main(){ vNorm=normalize((modelMatrix*vec4(position,1.0)).xyz); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
          fragmentShader: `uniform float uTime; uniform vec3 uSunDir; varying vec3 vNorm;
            float hash(vec2 p){p=fract(p*vec2(127.34,311.73));p+=dot(p,p+18.43);return fract(p.x*p.y);}
            float vNoise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
            float fbm(vec2 p){float v=0.,a=0.5;for(int i=0;i<4;i++){v+=a*vNoise(p);p*=2.1;a*=0.5;}return v;}
            void main(){
              vec3 n=normalize(vNorm);float h=clamp(n.y,0.,1.);
              vec3 zenith=vec3(0.05,0.18,0.60),midSky=vec3(0.22,0.52,0.92),horizon=vec3(0.82,0.74,0.60),lowGlow=vec3(0.95,0.55,0.22);
              vec3 skyCol=mix(lowGlow,horizon,smoothstep(0.,0.06,h));skyCol=mix(skyCol,midSky,smoothstep(0.06,0.28,h));skyCol=mix(skyCol,zenith,smoothstep(0.28,0.82,h));
              float sunDot=clamp(dot(n,uSunDir),0.,1.);
              skyCol+=vec3(1.0,1.0,0.9)*smoothstep(0.9998,1.0,sunDot)*3.0;skyCol+=vec3(1.,0.96,0.82)*smoothstep(0.9994,0.9998,sunDot);
              skyCol+=vec3(1.,0.78,0.42)*pow(sunDot,180.)*0.80;skyCol+=vec3(1.,0.88,0.60)*pow(sunDot,28.)*0.22;skyCol+=vec3(1.0,0.95,0.75)*pow(sunDot,8.)*0.08;
              if(h>0.04){vec2 cuv=vec2(atan(n.z,n.x)*0.159+0.5,n.y*1.6)+uTime*vec2(0.0015,0.0003);float cloud=fbm(cuv*3.5)*0.65+fbm(cuv*8.0)*0.35;cloud=smoothstep(0.45,0.82,cloud);float si=clamp(dot(n,uSunDir)*0.5+0.5,0.,1.);vec3 cc=mix(vec3(0.78,0.80,0.88),vec3(1.,0.98,0.94),si);float ha=1.-smoothstep(0.08,0.35,h);cc=mix(cc,vec3(1.,0.76,0.42),ha*0.4*cloud);skyCol=mix(skyCol,cc,cloud*smoothstep(0.04,0.18,h)*0.92);}
              float mist=smoothstep(0.,0.04,h)*(1.-smoothstep(0.04,0.14,h));skyCol=mix(skyCol,vec3(0.88,0.84,0.78),mist*0.4);gl_FragColor=vec4(skyCol,1.);}`,
        })
      );
      scene.add(sky);

      const sunSphere = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfffde0 }));
      sunSphere.position.set(-230, 295, 190); scene.add(sunSphere);
      const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(14, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0.25 }));
      sunGlow.position.copy(sunSphere.position); scene.add(sunGlow);

      const sunLight = new THREE.DirectionalLight(0xffe090, 3.5);
      sunLight.position.set(-55, 110, 45); sunLight.castShadow = true;
      sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -120;
      sunLight.shadow.camera.right = sunLight.shadow.camera.top = 120;
      sunLight.shadow.mapSize.set(1024, 1024); sunLight.shadow.bias = -0.0005; sunLight.shadow.radius = 3;
      scene.add(sunLight);

      const camera = new THREE.PerspectiveCamera(62, W / H, 0.1, 500);
      cameraRef.current = camera;
      scene.add(new THREE.AmbientLight(0xfff0d0, 0.7));
      const fill = new THREE.DirectionalLight(0x90b8e0, 0.5);
      fill.position.set(70, 30, -40); scene.add(fill);
      const bounce = new THREE.DirectionalLight(0x60c860, 0.18);
      bounce.position.set(0, -20, 0); scene.add(bounce);
      const buildingFill = new THREE.HemisphereLight(0xffffff, 0x446644, 1.2);
      scene.add(buildingFill);

      function canvasTex(size, draw, rep = [1, 1]) {
        const c = document.createElement("canvas"); c.width = c.height = size;
        draw(c.getContext("2d"), size);
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
        return t;
      }

      const grassTex = canvasTex(256, (ctx, s) => {
        const g = ctx.createLinearGradient(0, 0, s, s);
        g.addColorStop(0, "#4a7828"); g.addColorStop(0.5, "#5a9030"); g.addColorStop(1, "#527a20");
        ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 4000; i++) {
          const x = Math.random()*s, y = Math.random()*s, v = (Math.random()-.5)*50;
          ctx.fillStyle = `rgba(${35+v|0},${80+Math.random()*60+v|0},${10+Math.abs(v)|0},0.35)`;
          ctx.fillRect(x, y, Math.random()*3+0.5, Math.random()*3+0.5);
        }
      }, [20, 20]);

      const roadTex = canvasTex(256, (ctx, s) => {
        ctx.fillStyle = "#3c3838"; ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 2000; i++) {
          const v = 30 + Math.random()*50;
          ctx.fillStyle = `rgba(${v|0},${v-3|0},${v-8|0},0.8)`;
          ctx.beginPath(); ctx.arc(Math.random()*s, Math.random()*s, Math.random()*2+0.5, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = "#e8d035";
        for (let y = 0; y < s; y += 60) ctx.fillRect(s/2-4, y, 8, 36);
        ctx.fillStyle = "rgba(240,240,235,0.7)";
        ctx.fillRect(18, 0, 5, s); ctx.fillRect(s-23, 0, 5, s);
      }, [1, 8]);

      const stoneTex = canvasTex(128, (ctx, s) => {
        ctx.fillStyle = "#b8a890"; ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 800; i++) {
          const v = (Math.random()-.5)*40;
          ctx.fillStyle = `rgba(${130+v|0},${115+v|0},${85+v|0},0.6)`;
          ctx.fillRect(Math.random()*s, Math.random()*s, Math.random()*3+0.5, Math.random()*2+0.5);
        }
      }, [3, 3]);

      const brickTex = canvasTex(256, (ctx, s) => {
        ctx.fillStyle = "#9a8870"; ctx.fillRect(0, 0, s, s);
        const bw = 48, bh = 22, gap = 3;
        for (let row = 0; row < Math.ceil(s/bh)+1; row++) {
          const off = (row%2)*((bw+gap)/2);
          for (let col = -1; col < Math.ceil(s/bw)+1; col++) {
            const bx = col*(bw+gap)+off, by = row*(bh+gap), v = Math.floor((Math.random()-.5)*30);
            ctx.fillStyle = `rgb(${Math.max(0,Math.min(255,176+v))},${Math.max(0,Math.min(255,80+v))},${Math.max(0,Math.min(255,48+v))})`;
            ctx.fillRect(bx, by, bw, bh);
          }
        }
      }, [2, 2]);

      const roofTex = canvasTex(128, (ctx, s) => {
        ctx.fillStyle = "#7a3018"; ctx.fillRect(0, 0, s, s);
        const tw = 28, th = 18;
        for (let row = 0; row < Math.ceil(s/th)+1; row++) {
          const off = (row%2)*(tw/2);
          for (let col = -1; col < Math.ceil(s/tw)+1; col++) {
            const bx = col*tw+off, by = row*th, v = Math.floor((Math.random()-.5)*30);
            ctx.fillStyle = `rgb(${Math.max(0,Math.min(255,122+v))},${Math.max(0,Math.min(255,48+v))},${Math.max(0,Math.min(255,24+v))})`;
            ctx.fillRect(bx, by, tw-1, th-1);
          }
        }
      }, [2, 2]);

      const woodTex = canvasTex(128, (ctx, s) => {
        ctx.fillStyle = "#8a6040"; ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 60; i++) {
          const v = (Math.random()-.5)*28;
          ctx.strokeStyle = `rgba(${138+v|0},${96+v|0},${64+v|0},0.5)`;
          ctx.lineWidth = 0.8+Math.random()*2;
          ctx.beginPath(); ctx.moveTo(0, i*(s/60)); ctx.lineTo(s, i*(s/60)+(Math.random()-.5)*8); ctx.stroke();
        }
      }, [2, 2]);

      const thatchTex = canvasTex(128, (ctx, s) => {
        ctx.fillStyle = "#c8a040"; ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 100; i++) {
          const x = Math.random()*s, y = Math.random()*s;
          ctx.strokeStyle = `rgba(${140+Math.random()*60|0},${90+Math.random()*40|0},${20+Math.random()*30|0},0.7)`;
          ctx.lineWidth = 0.8+Math.random()*1.5;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+(Math.random()-.5)*20, y+15); ctx.stroke();
        }
      }, [2, 2]);

      const darkRoofTex = canvasTex(128, (ctx, s) => { ctx.fillStyle = "#2a0e04"; ctx.fillRect(0, 0, s, s); }, [2, 2]);
      const marbleTex = canvasTex(128, (ctx, s) => {
        ctx.fillStyle = "#f0ece4"; ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 400; i++) {
          const v = (Math.random()-.5)*18;
          ctx.fillStyle = `rgba(${240+v|0},${236+v|0},${228+v|0},0.4)`;
          ctx.beginPath(); ctx.arc(Math.random()*s, Math.random()*s, Math.random()*2+0.5, 0, Math.PI*2); ctx.fill();
        }
      }, [3, 3]);

      const leafTex = canvasTex(128, (ctx, s) => {
        ctx.fillStyle = "#2d6010"; ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 800; i++) {
          ctx.fillStyle = `rgba(20,${80+Math.random()*80|0},8,0.5)`;
          ctx.beginPath(); ctx.arc(Math.random()*s, Math.random()*s, Math.random()*4+1, 0, Math.PI*2); ctx.fill();
        }
      }, [3, 3]);

      const barkTex = canvasTex(64, (ctx, s) => {
        ctx.fillStyle = "#5a3818"; ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 40; i++) {
          ctx.strokeStyle = `rgba(30,15,5,${0.3+Math.random()*0.4})`;
          ctx.lineWidth = 0.5+Math.random()*2;
          ctx.beginPath(); ctx.moveTo(0, Math.random()*s); ctx.lineTo(s, Math.random()*s+(Math.random()-.5)*10); ctx.stroke();
        }
      }, [2, 3]);

      const waterTex = canvasTex(128, (ctx, s) => { ctx.fillStyle = "#2060a0"; ctx.fillRect(0, 0, s, s); }, [4, 4]);

      const sponsorCanvases = [];
      const sponsorThreeTextures = [];

      function drawWallpaper(ctx, w, h, color) {
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
        const r = parseInt(color.slice(1,3)||"88",16);
        const g = parseInt(color.slice(3,5)||"88",16);
        const b = parseInt(color.slice(5,7)||"88",16);
        ctx.fillStyle = `rgba(${r},${g},${b},0.06)`; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`; ctx.lineWidth = 1;
        const step = 32;
        for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      }

      function updateSponsorCanvas(index, sponsor) {
        if (!sponsorCanvases[index]) return;
        const { canvas, ctx } = sponsorCanvases[index];
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const col = (sponsor?.color && sponsor.color !== "#ffffff") ? sponsor.color : "#8a7050";
        drawWallpaper(ctx, w, h, col);
        ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = col;
        ctx.font = `bold ${w * 0.55}px monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText((sponsor?.name?.charAt(0) || "?").toUpperCase(), w/2, h/2); ctx.restore();
        if (sponsor?.role) {
          ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = "#000000";
          ctx.font = `bold 11px monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(sponsor.role.toUpperCase(), w/2, h * 0.82); ctx.restore();
        }
        sponsorThreeTextures[index].needsUpdate = true;
        if (sponsor?.logo) {
          const img = new Image(); img.crossOrigin = "anonymous";
          img.onload = () => {
            if (!mounted) return;
            ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
            drawWallpaper(ctx, w, h, col);
            const maxW = w * 0.7, maxH = h * 0.7;
            const scale = Math.min(1, maxW / img.width, maxH / img.height);
            const dw = img.width * scale, dh = img.height * scale;
            ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
            sponsorThreeTextures[index].needsUpdate = true;
          };
          img.onerror = (e) => { console.warn(`[Sponsor ${index}] Logo failed:`, resolveImageUrl(sponsor.logo), e); };
          img.src = resolveImageUrl(sponsor.logo);
        }
      }

      for (let i = 0; i < 5; i++) {
        const c = document.createElement("canvas"); c.width = 512; c.height = 512;
        const ctx2d = c.getContext("2d"); ctx2d.fillStyle = "#ffffff"; ctx2d.fillRect(0, 0, 512, 512);
        sponsorCanvases.push({ canvas: c, ctx: ctx2d });
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.repeat.set(1, 1);
        sponsorThreeTextures.push(tex);
      }

      const initialSponsors = snapshot.sponsors?.length ? snapshot.sponsors : FALLBACK_SNAPSHOT.sponsors;
      initialSponsors.slice(0, 5).forEach((sp, i) => updateSponsorCanvas(i, sp));
      window.__hackdriveUpdateSponsor = updateSponsorCanvas;
      if (pendingSponsorUpdateRef.current) {
        pendingSponsorUpdateRef.current.forEach((sp, i) => updateSponsorCanvas(i, sp));
        pendingSponsorUpdateRef.current = null;
      }

      const glassEmissiveMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff, emissive: 0x224488, emissiveIntensity: 0.3, transparent: true, opacity: 0.5, roughness: 0,
      });

      // ── Terrain ──────────────────────────────────────────────
      const tGeo = new THREE.PlaneGeometry(320, 320, 50, 50);
      const tp = tGeo.attributes.position;
      for (let i = 0; i < tp.count; i++) {
        const x = tp.getX(i), z = tp.getY(i), dist = Math.sqrt(x*x+z*z);
        const fw = dist < 52 ? 1 : Math.max(0, 1-(dist-52)/20);
        const bump = (1-fw)*(Math.sin(x*0.044+1.2)*3.0+Math.cos(z*0.038+0.8)*2.4+Math.sin(x*0.09+z*0.07)*1.2);
        tp.setZ(i, Math.max(0, bump));
      }
      tGeo.computeVertexNormals();
      const tMesh = new THREE.Mesh(tGeo, new THREE.MeshLambertMaterial({ map: grassTex, color: 0xddffc8 }));
      tMesh.rotation.x = -Math.PI/2; tMesh.receiveShadow = true; scene.add(tMesh);

      const innerGrass = new THREE.Mesh(new THREE.CircleGeometry(28, 32), new THREE.MeshLambertMaterial({ map: grassTex, color: 0xc5eea0 }));
      innerGrass.rotation.x = -Math.PI/2; innerGrass.position.set(0, 0.02, 0); scene.add(innerGrass);

      // ── Pond ─────────────────────────────────────────────────
      const pond = new THREE.Mesh(new THREE.CircleGeometry(26, 64),
        new THREE.MeshStandardMaterial({ color: 0x2288cc, transparent: true, opacity: 0.88, roughness: 0.05, metalness: 0.1, map: waterTex }));
      pond.rotation.x = -Math.PI/2; pond.position.set(0, 0.05, 0); scene.add(pond);
      const pondRing = new THREE.Mesh(new THREE.RingGeometry(26.0, 27.2, 48),
        new THREE.MeshLambertMaterial({ map: stoneTex, color: 0xccbbaa, side: THREE.DoubleSide }));
      pondRing.rotation.x = -Math.PI/2; pondRing.position.set(0, 0.08, 0); scene.add(pondRing);
      const psm = new THREE.MeshLambertMaterial({ map: stoneTex, color: 0xccbbaa });
      for (let i = 0; i < 36; i++) {
        const ang = (i/36)*Math.PI*2, r = 27.2+Math.random()*0.5;
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.3+Math.random()*0.5, 0.4+Math.random()*0.4, 0.25+Math.random()*0.2, 6), psm);
        st.position.set(Math.cos(ang)*r, 0.1, Math.sin(ang)*r); st.rotation.y = Math.random()*Math.PI; scene.add(st);
      }
      const lilyM = new THREE.MeshLambertMaterial({ color: 0x3a8018 });
      const lilyFM = new THREE.MeshLambertMaterial({ color: 0xff88aa });
      for (let i = 0; i < 22; i++) {
        const ang = Math.random()*Math.PI*2, r = 4+Math.random()*20;
        const l = new THREE.Mesh(new THREE.CircleGeometry(0.6+Math.random()*0.5, 8), lilyM);
        l.rotation.x = -Math.PI/2; l.position.set(Math.cos(ang)*r, 0.08, Math.sin(ang)*r); scene.add(l);
        if (Math.random() > 0.4) {
          const fl = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 6), lilyFM);
          fl.position.set(Math.cos(ang)*r, 0.25, Math.sin(ang)*r); scene.add(fl);
        }
      }

      // ── Fountain ─────────────────────────────────────────────
      const fb2 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.0, 0.9, 16), new THREE.MeshLambertMaterial({ map: stoneTex, color: 0xddd8c8 }));
      fb2.position.set(0, 0.45, 0); fb2.castShadow = true; scene.add(fb2);
      const fp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 3.5, 10), new THREE.MeshLambertMaterial({ map: marbleTex, color: 0xf0ece4 }));
      fp2.position.set(0, 1.5, 0); fp2.castShadow = true; scene.add(fp2);
      const ft2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshLambertMaterial({ map: marbleTex, color: 0xf0ece4 }));
      ft2.position.set(0, 3.2, 0); scene.add(ft2);

      const spCnt = 40, spGeo = new THREE.BufferGeometry();
      const spPos = new Float32Array(spCnt*3), spVel = [];
      for (let i = 0; i < spCnt; i++) {
        const ang = Math.random()*Math.PI*2, r = Math.random()*0.3;
        spPos[i*3] = Math.cos(ang)*r; spPos[i*3+1] = 0; spPos[i*3+2] = Math.sin(ang)*r;
        spVel.push({ vx: (Math.random()-.5)*0.06, vy: 0.08+Math.random()*0.06, vz: (Math.random()-.5)*0.06, life: Math.random(), maxLife: 0.5+Math.random()*0.5 });
      }
      spGeo.setAttribute("position", new THREE.Float32BufferAttribute(spPos, 3));
      const spMesh = new THREE.Points(spGeo, new THREE.PointsMaterial({ color: 0xaaddff, size: 0.25, transparent: true, opacity: 0.7 }));
      spMesh.position.set(0, 3.4, 0); scene.add(spMesh);
      fountainRef.current = { geo: spGeo, vel: spVel };

      // ── Road ─────────────────────────────────────────────────
      const ROAD_STEPS = 120, ROAD_WIDTH = 7.0;
      const roadPoints = [];
      for (let i = 0; i <= ROAD_STEPS; i++) {
        const [rx, rz] = catmullRomClosedStatic(ROAD_WP, i/ROAD_STEPS);
        roadPoints.push(new THREE.Vector3(rx, 0.05, rz));
      }
      const rV = [], rU = [], rI = [];
      for (let i = 0; i <= ROAD_STEPS; i++) {
        const pt = roadPoints[i], next = roadPoints[(i+1)%(ROAD_STEPS+1)];
        const dx = next.x-pt.x, dz = next.z-pt.z, len = Math.sqrt(dx*dx+dz*dz)||1;
        const rx2 = -dz/len, rz2 = dx/len, u = i/ROAD_STEPS;
        rV.push(pt.x+rx2*ROAD_WIDTH/2, 0.05, pt.z+rz2*ROAD_WIDTH/2, pt.x-rx2*ROAD_WIDTH/2, 0.05, pt.z-rz2*ROAD_WIDTH/2);
        rU.push(0, u*14, 1, u*14);
        if (i < ROAD_STEPS) { const a=i*2,b=a+1,c=a+2,d=a+3; rI.push(a,b,c,b,d,c); }
      }
      const rGeo = new THREE.BufferGeometry();
      rGeo.setAttribute("position", new THREE.Float32BufferAttribute(rV, 3));
      rGeo.setAttribute("uv", new THREE.Float32BufferAttribute(rU, 2));
      rGeo.setIndex(rI); rGeo.computeVertexNormals();
      const roadMesh = new THREE.Mesh(rGeo, new THREE.MeshLambertMaterial({ map: roadTex, color: 0xcccccc }));
      roadMesh.receiveShadow = true; scene.add(roadMesh);

      const kW = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
      const kR = new THREE.MeshLambertMaterial({ color: 0xcc2a1e });
      for (let i = 0; i < ROAD_STEPS; i++) {
        const pt = roadPoints[i], next = roadPoints[i+1];
        const dx = next.x-pt.x, dz = next.z-pt.z, sl = Math.sqrt(dx*dx+dz*dz)||1;
        const prx = -dz/sl, prz = dx/sl, angle = Math.atan2(dx, dz);
        const kmat = (Math.floor(i/4)%2===0) ? kW : kR;
        [ROAD_WIDTH/2+0.25, -(ROAD_WIDTH/2+0.25)].forEach(side => {
          const mx = (pt.x+next.x)/2+prx*side, mz = (pt.z+next.z)/2+prz*side;
          const km = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, sl), kmat);
          km.position.set(mx, 0.1, mz); km.rotation.y = angle; scene.add(km);
        });
      }

      // ── Trees ────────────────────────────────────────────────
      const trunkM = new THREE.MeshLambertMaterial({ map: barkTex, color: 0xb07040 });
      const leafM  = new THREE.MeshLambertMaterial({ map: leafTex, color: 0x55a025 });
      const leafM2 = new THREE.MeshLambertMaterial({ map: leafTex, color: 0x3d8018 });
      const leafM3 = new THREE.MeshLambertMaterial({ map: leafTex, color: 0x70b035 });
      const autM   = new THREE.MeshLambertMaterial({ map: leafTex, color: 0xd4780a });
      const pineM  = new THREE.MeshLambertMaterial({ map: leafTex, color: 0x1e6010 });

      function addTree(x, z, s = 1, type = 0) {
        const g = new THREE.Group();
        const th = (1.4+Math.random()*0.8)*s;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1*s, 0.22*s, th, 6), trunkM);
        trunk.position.y = th/2; trunk.castShadow = true; g.add(trunk);
        if (type === 1) {
          for (let li = 0; li < 4; li++) {
            const lr = (1.6-li*0.3)*s; if (lr < 0.1) break;
            const c = new THREE.Mesh(new THREE.ConeGeometry(lr, 1.8*s, 8), pineM);
            c.position.y = th+0.1+li*0.8*s; c.castShadow = true; g.add(c);
          }
        } else {
          const lm = [leafM,leafM2,leafM3,autM][Math.floor(Math.random()*4)];
          const ms = new THREE.Mesh(new THREE.SphereGeometry(1.4*s, 7, 6), lm);
          ms.position.set(0, th+1.2*s, 0); ms.castShadow = true; g.add(ms);
          for (let ci = 0; ci < 2; ci++) {
            const ang = ci*Math.PI+Math.random()*0.6;
            const sp2 = new THREE.Mesh(new THREE.SphereGeometry(0.8*s, 6, 5), lm);
            sp2.position.set(Math.cos(ang)*0.7*s, th+1.0*s, Math.sin(ang)*0.7*s); g.add(sp2);
          }
        }
        g.position.set(x, 0, z); g.rotation.y = Math.random()*Math.PI*2;
        g.scale.setScalar(0.85+Math.random()*0.3); scene.add(g);
      }
      for (let i = 0; i < 45; i++) {
        const angle = (i/45)*Math.PI*2+Math.random()*0.15, r = 62+Math.random()*18;
        addTree(Math.cos(angle)*r, Math.sin(angle)*r, 0.7+Math.random()*0.9, i%4===0?1:0);
      }
      for (let i = 0; i < 6; i++) {
        const angle = (i/6)*Math.PI*2+Math.random()*0.4;
        addTree(Math.cos(angle)*(27.5+Math.random()*3), Math.sin(angle)*(27.5+Math.random()*3), 0.5+Math.random()*0.3, i%3===0?1:0);
      }

      // ── Haystacks ────────────────────────────────────────────
      const hayM = new THREE.MeshLambertMaterial({ color: 0xd4a240 });
      function addHaystack(x, z, scale = 1) {
        const hg = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9*scale, 1.1*scale, 1.6*scale, 10), hayM);
        body.position.y = 0.8*scale; body.castShadow = true; hg.add(body);
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.88*scale, 8, 6, 0, Math.PI*2, 0, Math.PI/2), hayM);
        top.position.y = 1.6*scale; hg.add(top);
        hg.position.set(x, 0, z); hg.rotation.y = Math.random()*Math.PI; scene.add(hg);
      }
      [[-18,22],[-22,19],[14,-38],[16,-36],[8,30],[24,8],[-12,36]].forEach(([x,z]) =>
        addHaystack(x, z, 0.8+Math.random()*0.5));

      // ── Bushes ───────────────────────────────────────────────
      const bushM = new THREE.MeshLambertMaterial({ map: leafTex, color: 0x3a7028 });
      for (let i = 0; i < 25; i++) {
        const angle = (i/25)*Math.PI*2+Math.random()*0.5, r = 48+Math.random()*10;
        const bg = new THREE.Group();
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 7, 6), bushM);
        b.position.y = 0.35; b.scale.y = 0.7; b.castShadow = true; bg.add(b);
        bg.position.set(Math.cos(angle)*r, 0, Math.sin(angle)*r); bg.rotation.y = Math.random()*Math.PI; scene.add(bg);
      }

      // ── Windmills ────────────────────────────────────────────
      function windmill(x, z) {
        const g = new THREE.Group(); g.position.set(x, 0, z);
        const sM2 = new THREE.MeshLambertMaterial({ map: stoneTex, color: 0xddd8c8 });
        const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.52, 8.5, 8), sM2);
        tw.position.y = 4.25; tw.castShadow = true; g.add(tw);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 6), new THREE.MeshLambertMaterial({ map: woodTex, color: 0x8a6030 }));
        cap.position.y = 9.2; g.add(cap);
        const blades = new THREE.Group(); blades.position.set(0.3, 8, 0);
        for (let i = 0; i < 4; i++) {
          const bl = new THREE.Group(); bl.rotation.z = (i*Math.PI)/2;
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.09), new THREE.MeshLambertMaterial({ map: woodTex, color: 0xd0c090 }));
          blade.position.y = 1.6; bl.add(blade); blades.add(bl);
        }
        g.add(blades); g.userData.blades = blades; scene.add(g); windmillsRef.current.push(g);
      }
      windmill(-46, 14); windmill(46, -22);

      // ── Cows ─────────────────────────────────────────────────
      const cowM = new THREE.MeshLambertMaterial({ color: 0xf0ece0 });
      function addCow(x, z) {
        const cg = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), cowM);
        body.scale.set(1.6, 1.0, 1.0); body.position.y = 1.0; body.castShadow = true; cg.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 7, 6), cowM);
        head.position.set(1.0, 1.1, 0); cg.add(head);
        [[0.5,0.22],[0.5,-0.22],[-0.5,0.22],[-0.5,-0.22]].forEach(([lx,lz]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.85, 5), cowM);
          leg.position.set(lx, 0.42, lz); cg.add(leg);
        });
        cg.position.set(x, 0, z); cg.rotation.y = Math.random()*Math.PI*2; scene.add(cg);
      }
      [[-55,10],[-58,-5],[-50,-18],[55,20],[52,-5]].forEach(([x,z]) => addCow(x, z));

      // ── Street lamps ─────────────────────────────────────────
      const lpM = new THREE.MeshStandardMaterial({ color: 0x909090, roughness: 0.25, metalness: 0.88 });
      const lgM = new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffdd44, emissiveIntensity: 2.5, roughness: 0 });
      for (let i = 0; i < 14; i++) {
        const t = i/14;
        const [lx, lz] = catmullRomClosedStatic(ROAD_WP, t);
        const [ddx2, ddz2] = getRoadDirClosedStatic(ROAD_WP, t);
        const prx2 = -ddz2, prz2 = ddx2, side = (i%2===0)?1:-1;
        const lox = lx+prx2*(ROAD_WIDTH/2+1.6)*side, loz = lz+prz2*(ROAD_WIDTH/2+1.6)*side;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 5.5, 6), lpM);
        pole.position.set(lox, 2.75, loz); scene.add(pole);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6, 0, Math.PI*2, 0, Math.PI/2), lgM);
        dome.position.set(lox+1.6*side, 5.3, loz); scene.add(dome);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.8, 5), lpM);
        arm.rotation.z = Math.PI/2; arm.position.set(lox+0.8*side, 5.5, loz); scene.add(arm);
        const pl = new THREE.PointLight(0xffe880, 0.9, 18, 2);
        pl.position.set(lox+1.6*side, 5.2, loz); scene.add(pl);
      }

      function lmat(p) { return new THREE.MeshLambertMaterial(p); }
      function smat(p) { return new THREE.MeshStandardMaterial(p); }

      function aBox(g, geo, m, x, y, z, ry = 0) {
        const mesh = new THREE.Mesh(geo, m);
        mesh.position.set(x, y, z); if (ry) mesh.rotation.y = ry;
        mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh;
      }

      function aWin(g, wx, wy, wz, fw = 1.1, fh = 1.0) {
        const wm = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.1), glassEmissiveMat);
        wm.position.set(wx, wy, wz); g.add(wm);
        const fr = new THREE.Mesh(new THREE.BoxGeometry(fw+0.22, fh+0.22, 0.07), lmat({ color: 0xd0b880 }));
        fr.position.set(wx, wy, wz+0.01); g.add(fr);
      }

      function plat(bx, bz, w = 14, d = 13) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, d), lmat({ map: stoneTex, color: 0xccbba8 }));
        p.position.set(bx, 0.4, bz); p.receiveShadow = true; p.castShadow = true; scene.add(p);
      }

      const BUILDING_BASE_COLORS = [0xf0e8d8, 0xd8e4f0, 0xf8f0d0, 0xe8d8c8, 0xdce8dc];

      function sponsorWallMat(index, sponsorTex) {
        return new THREE.MeshBasicMaterial({ map: sponsorTex, color: 0xffffff });
      }

      function registerWall(mesh, buildingIndex) {
        sponsorBuildingDataRef.current.push({ mesh, buildingIndex });
      }

      function farmhouse(bx, bz, index, sponsorTex) {
        plat(bx, bz, 20, 17);
        const g = new THREE.Group(); g.position.set(bx, 0.8, bz);
        const wM  = sponsorWallMat(index, sponsorTex);
        const wdM = lmat({ map: woodTex, color: 0xddccaa });
        const thM = lmat({ map: thatchTex, color: 0xc8a040 });
        const mainWall = new THREE.Mesh(new THREE.BoxGeometry(9, 3.2, 7.5), wM);
        mainWall.position.set(0, 1.6, 0); mainWall.castShadow = true; mainWall.receiveShadow = true; g.add(mainWall);
        registerWall(mainWall, index);
        const upperWall = new THREE.Mesh(new THREE.BoxGeometry(8.6, 3.0, 7.1), wM);
        upperWall.position.set(0, 4.7, 0); upperWall.castShadow = true; upperWall.receiveShadow = true; g.add(upperWall);
        registerWall(upperWall, index);
        const rfP = new THREE.Mesh(new THREE.ConeGeometry(6.5, 4.5, 4), thM);
        rfP.position.set(0, 7.75, 0); rfP.rotation.y = Math.PI/4; rfP.castShadow = true; g.add(rfP);
        aBox(g, new THREE.BoxGeometry(9.4, 0.3, 7.8), lmat({ map: roofTex, color: 0xeeeeee }), 0, 5.85, 0);
        [-2.2, 2.2].forEach(cx => aBox(g, new THREE.BoxGeometry(0.78, 3.8, 0.78), wM, cx, 8.4, -2.4));
        aBox(g, new THREE.BoxGeometry(1.5, 2.8, 0.15), wdM, 0, 1.4, 3.78);
        [[-3.0, 1.7],[3.0, 1.7]].forEach(([wx, wy]) => aWin(g, wx, wy, 3.78, 1.3, 1.2));
        [-2.5, 2.5].forEach(px => {
          const col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 3.25, 8), wdM);
          col2.position.set(px, 1.62, 6.35); col2.castShadow = true; g.add(col2);
        });
        scene.add(g);
      }

      function clockTower(bx, bz, index, sponsorTex) {
        plat(bx, bz, 18, 18);
        const g = new THREE.Group(); g.position.set(bx, 0.8, bz);
        const sM2 = sponsorWallMat(index, sponsorTex);
        const slM = lmat({ map: darkRoofTex, color: 0xffffff });
        const gdM = smat({ color: 0xffd700, emissive: 0xaa8800, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.1 });
        const baseWall = new THREE.Mesh(new THREE.BoxGeometry(12, 5.5, 10), sM2);
        baseWall.position.set(0, 2.75, 0); baseWall.castShadow = true; baseWall.receiveShadow = true; g.add(baseWall);
        registerWall(baseWall, index);
        const bRf = new THREE.Mesh(new THREE.ConeGeometry(7.5, 3.8, 4), slM);
        bRf.position.set(0, 7.4, 0); bRf.rotation.y = Math.PI/4; bRf.scale.set(1, 1, 1.3); bRf.castShadow = true; g.add(bRf);
        const towerWall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 14, 4.2), lmat({ map: brickTex, color: BUILDING_BASE_COLORS[index] }));
        towerWall.position.set(0, 7.0, 0); towerWall.castShadow = true; towerWall.receiveShadow = true; g.add(towerWall);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(2.0, 7.5, 8), slM);
        spire.position.set(0, 17.75, 0); spire.castShadow = true; g.add(spire);
        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), gdM);
        finial.position.set(0, 21.5, 0); g.add(finial);
        for (let ci = 0; ci < 4; ci++) {
          const ang = ci*Math.PI/2;
          const face = new THREE.Mesh(new THREE.CircleGeometry(1.05, 14), smat({ color: 0xf8f4e8, emissive: 0xf0e8c8, emissiveIntensity: 0.3 }));
          face.position.set(Math.sin(ang)*2.11, 13.5, Math.cos(ang)*2.11); face.rotation.y = -ang+Math.PI; g.add(face);
        }
        aBox(g, new THREE.BoxGeometry(1.8, 3.0, 0.15), lmat({ map: woodTex, color: 0x5a3018 }), 0, 1.5, 5.08);
        scene.add(g);
      }

      function trophyHall(bx, bz, index, sponsorTex) {
        plat(bx, bz, 20, 18);
        const g = new THREE.Group(); g.position.set(bx, 0.8, bz);
        const gdM = smat({ color: 0xffd700, emissive: 0xaa8800, emissiveIntensity: 0.5, metalness: 0.9, roughness: 0.1 });
        const mM  = sponsorWallMat(index, sponsorTex);
        const rfM = lmat({ map: roofTex, color: 0xeeeeee });
        const sM2 = lmat({ map: stoneTex, color: 0xe0d8cc });
        const mainWall = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 10.5), mM);
        mainWall.position.set(0, 4.0, 0); mainWall.castShadow = true; mainWall.receiveShadow = true; g.add(mainWall);
        registerWall(mainWall, index);
        aBox(g, new THREE.BoxGeometry(12.5, 0.5, 11), sM2, 0, 8.25, 0);
        const ped = new THREE.Mesh(new THREE.ConeGeometry(8.2, 3.2, 3), rfM);
        ped.position.set(0, 10.1, 0); ped.rotation.y = Math.PI/6; ped.scale.set(1, 1, 1.28); ped.castShadow = true; g.add(ped);
        [-4.5, -2.25, 0, 2.25, 4.5].forEach(cx => {
          const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.4, 7.5, 10), mM);
          shaft.position.set(cx, 3.95, 5.25); shaft.castShadow = true; g.add(shaft);
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.13, 0.65, 10), gdM);
          cup.position.set(cx, 8.20, 5.25); g.add(cup);
        });
        aBox(g, new THREE.BoxGeometry(2.4, 4.0, 0.14), lmat({ map: woodTex, color: 0x5a3018 }), 0, 2.0, 5.3);
        scene.add(g);
      }

      function countryInn(bx, bz, index, sponsorTex) {
        plat(bx, bz, 22, 20);
        const g = new THREE.Group(); g.position.set(bx, 0.8, bz);
        const thM   = lmat({ map: thatchTex, color: 0xb89030 });
        const beamM = lmat({ map: woodTex,   color: 0x5a3018 });
        const plM   = sponsorWallMat(index, sponsorTex);
        const mainWall = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 12), plM);
        mainWall.position.set(0, 3.5, 0); mainWall.castShadow = true; mainWall.receiveShadow = true; g.add(mainWall);
        registerWall(mainWall, index);
        [0.5, 2.0, 3.5, 5.0].forEach(h => aBox(g, new THREE.BoxGeometry(14.2, 0.18, 0.22), beamM, 0, h, 6.1));
        const rfL = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.3, 13.5), thM);
        rfL.rotation.z = Math.PI/5; rfL.position.set(-3.8, 8.8, 0); rfL.castShadow = true; g.add(rfL);
        const rfR = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.3, 13.5), thM);
        rfR.rotation.z = -Math.PI/5; rfR.position.set(3.8, 8.8, 0); rfR.castShadow = true; g.add(rfR);
        aBox(g, new THREE.BoxGeometry(0.6, 0.4, 13.5), beamM, 0, 10.85, 0);
        aBox(g, new THREE.BoxGeometry(2.4, 3.8, 0.2), lmat({ map: stoneTex, color: 0xccbbaa }), 0, 1.9, 6.16);
        scene.add(g);
      }

      function properHouse(bx, bz, index, sponsorTex) {
        plat(bx, bz, 22, 20);
        const g = new THREE.Group(); g.position.set(bx, 0.8, bz);
        const wlM     = sponsorWallMat(index, sponsorTex);
        const roofMat = lmat({ map: roofTex, color: 0xdd4422 });
        const wdM2    = lmat({ map: woodTex, color: 0x8a6030 });
        const lowerWall = new THREE.Mesh(new THREE.BoxGeometry(11, 3.8, 9), wlM);
        lowerWall.position.set(0, 1.9, 0); lowerWall.castShadow = true; lowerWall.receiveShadow = true; g.add(lowerWall);
        registerWall(lowerWall, index);
        const upperWall2 = new THREE.Mesh(new THREE.BoxGeometry(10, 3.0, 8.5), wlM);
        upperWall2.position.set(0, 5.3, 0); upperWall2.castShadow = true; upperWall2.receiveShadow = true; g.add(upperWall2);
        registerWall(upperWall2, index);
        const rfL2 = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.35, 10.5), roofMat);
        rfL2.rotation.z = Math.PI/5.5; rfL2.position.set(-3.0, 8.5, 0); rfL2.castShadow = true; g.add(rfL2);
        const rfR2 = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.35, 10.5), roofMat);
        rfR2.rotation.z = -Math.PI/5.5; rfR2.position.set(3.0, 8.5, 0); rfR2.castShadow = true; g.add(rfR2);
        aBox(g, new THREE.BoxGeometry(0.5, 0.45, 10.8), wdM2, 0, 10.2, 0);
        aBox(g, new THREE.BoxGeometry(1.2, 4.5, 1.0), wlM, -2.8, 8.8, -3.5);
        aBox(g, new THREE.BoxGeometry(1.7, 3.0, 0.18), wdM2, 0, 1.5, 4.6);
        [[-3.5, 2.0],[3.5, 2.0]].forEach(([wx, wy]) => aWin(g, wx, wy, 4.6, 1.4, 1.3));
        [[-3.0, 5.5],[0, 5.5],[3.0, 5.5]].forEach(([wx, wy]) => aWin(g, wx, wy, 4.51, 1.1, 1.05));
        scene.add(g);
      }

      const builders = [farmhouse, clockTower, trophyHall, countryInn, properHouse];

      SECTION_IDS.forEach((secId2, i) => {
        const [bx2, bz2] = BLDG_POS[i];
        builders[i](bx2, bz2, i, sponsorThreeTextures[i]);

        const col = SECTION_ACCENTS[secId2];
        const pl = new THREE.PointLight(parseInt(col.accent.replace("#",""), 16), 1.8, 32);
        pl.position.set(bx2, 16, bz2); scene.add(pl);
        buildingsRef.current.push({ secId: secId2, pl });

        // ── Change 3: Sponsor role label floating above each building ──
        const sp0 = initialSponsors[i];
        if (sp0?.role) {
          const rc = document.createElement("canvas");
          rc.width = 512; rc.height = 128;
          const rctx = rc.getContext("2d");
          // Background pill
          const hexColor = col.accent;
          rctx.fillStyle = hexColor + "dd";
          if (rctx.roundRect) {
            rctx.beginPath();
            rctx.roundRect(8, 16, 496, 96, 20);
            rctx.fill();
          } else {
            rctx.fillRect(8, 16, 496, 96);
          }
          // Role text
          rctx.fillStyle = "#000000";
          rctx.font = "bold 38px monospace";
          rctx.textAlign = "center";
          rctx.textBaseline = "middle";
          rctx.fillText(sp0.role.toUpperCase(), 256, 64);
          const rt = new THREE.CanvasTexture(rc);
          const rm = new THREE.MeshBasicMaterial({
            map: rt, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          });
          const rplane = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), rm);
          rplane.position.set(bx2, 14.5, bz2);
          // Face toward road / pond center
          rplane.rotation.y = Math.atan2(bx2, bz2);
          scene.add(rplane);
        }

        // Road-side sign
        const [rwx, rwz] = catmullRomClosedStatic(ROAD_WP, SEC_T[i]);
        const [ddx2, ddz2] = getRoadDirClosedStatic(ROAD_WP, SEC_T[i]);
        const sX = rwx - ddz2*(ROAD_WIDTH/2+2.8)*-1, sZ = rwz + ddx2*(ROAD_WIDTH/2+2.8)*-1;

        const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.5, 8), lmat({ map: woodTex, color: 0x7a5030 }));
        sp.position.set(sX, 1.75, sZ); scene.add(sp);

        const sb = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.4, 0.2),
          smat({
            color: parseInt(col.accent.replace("#",""),16),
            emissive: parseInt(col.accent.replace("#",""),16),
            emissiveIntensity: 0.9, roughness: 0.25,
          }));
        sb.position.set(sX, 3.2, sZ+0.01); scene.add(sb);

        const sbGlow = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.8, 0.08),
          smat({
            color: parseInt(col.accent.replace("#",""),16),
            emissive: parseInt(col.accent.replace("#",""),16),
            emissiveIntensity: 0.5, transparent: true, opacity: 0.25, roughness: 1,
          }));
        sbGlow.position.set(sX, 3.2, sZ-0.01); scene.add(sbGlow);

        const spl = new THREE.PointLight(parseInt(col.accent.replace("#",""),16), 2.5, 16);
        spl.position.set(sX, 4.0, sZ); scene.add(spl);
        const spl2 = new THREE.PointLight(parseInt(col.accent.replace("#",""),16), 1.0, 28);
        spl2.position.set(sX, 1.0, sZ); scene.add(spl2);

        const groundGlow = new THREE.Mesh(new THREE.CircleGeometry(5, 24),
          smat({
            color: parseInt(col.accent.replace("#",""),16),
            emissive: parseInt(col.accent.replace("#",""),16),
            emissiveIntensity: 0.3, transparent: true, opacity: 0.18, roughness: 1,
          }));
        groundGlow.rotation.x = -Math.PI/2;
        groundGlow.position.set(sX, 0.06, sZ);
        scene.add(groundGlow);
      });

      // ── Birds ────────────────────────────────────────────────
      function addBirdFlock(cx, cz, cy, count) {
        const flock = new THREE.Group();
        const bm = new THREE.MeshLambertMaterial({ color: 0x333340, side: THREE.DoubleSide });
        for (let bi = 0; bi < count; bi++) {
          const bird = new THREE.Group();
          bird.position.set((Math.random()-.5)*12, (Math.random()-.5)*5, (Math.random()-.5)*12);
          bird.userData.phase = Math.random()*Math.PI*2; bird.userData.speed = 0.8+Math.random()*0.4;
          [-1,1].forEach(side => {
            const wing = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0,0,0), new THREE.Vector3(side*1.0, 0.1, 0.2), new THREE.Vector3(side*0.5, 0, 0.5),
            ]), bm);
            bird.add(wing);
          });
          const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 4), bm);
          body.scale.set(2.0, 0.5, 0.6); bird.add(body);
          flock.add(bird);
        }
        flock.position.set(cx, cy, cz);
        flock.userData.orbitR = 30+Math.random()*20; flock.userData.orbitSpeed = 0.003+Math.random()*0.002;
        flock.userData.orbitPhase = Math.random()*Math.PI*2;
        scene.add(flock); birdGroupsRef.current.push(flock);
      }
      addBirdFlock(0, 0, 35, 6); addBirdFlock(30, 20, 45, 5);

      // ── Car ──────────────────────────────────────────────────
      const car = new THREE.Group();
      const bM  = new THREE.MeshStandardMaterial({ color: 0x1a2e4a, roughness: 0.18, metalness: 0.88 });
      const bM2 = new THREE.MeshStandardMaterial({ color: 0x122436, roughness: 0.22, metalness: 0.84 });
      const dkM = new THREE.MeshStandardMaterial({ color: 0x0a1828, roughness: 0.45, metalness: 0.55 });
      const glM = new THREE.MeshStandardMaterial({ color: 0x3a88aa, transparent: true, opacity: 0.38, roughness: 0, metalness: 0.15 });
      const lM2 = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffcc, emissiveIntensity: 2.5, roughness: 0 });
      const tM  = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff1100, emissiveIntensity: 2.0, roughness: 0 });
      const rbM = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.95, metalness: 0.0 });

      function carBox(geo, m, x, y, z, ry = 0) {
        const mesh = new THREE.Mesh(geo, m);
        mesh.position.set(x, y, z); if (ry) mesh.rotation.y = ry;
        mesh.castShadow = true; car.add(mesh); return mesh;
      }

      carBox(new THREE.BoxGeometry(2.0, 0.15, 4.5), dkM, 0, 0.15, 0);
      carBox(new THREE.BoxGeometry(2.15, 0.68, 4.8), bM, 0, 0.66, 0);
      [-1.09,1.09].forEach(x => carBox(new THREE.BoxGeometry(0.11, 0.22, 4.4), dkM, x, 0.38, 0));
      carBox(new THREE.BoxGeometry(1.95, 0.74, 2.5), bM2, 0, 1.28, -0.15);
      carBox(new THREE.BoxGeometry(1.86, 0.12, 2.25), bM2, 0, 1.68, -0.15);
      carBox(new THREE.BoxGeometry(1.0, 0.08, 1.1), glM, 0, 1.7, -0.15);
      carBox(new THREE.BoxGeometry(2.06, 0.14, 1.7), bM, 0, 1.0, 1.5);
      carBox(new THREE.BoxGeometry(2.06, 0.14, 1.05), bM, 0, 1.0, -1.85);
      const ws = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.68, 0.09), glM);
      ws.position.set(0, 1.16, 0.72); ws.rotation.x = -0.46; car.add(ws);
      const rws = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.58, 0.09), glM);
      rws.position.set(0, 1.16, -1.1); rws.rotation.x = 0.42; car.add(rws);
      carBox(new THREE.BoxGeometry(1.7, 0.44, 0.08), dkM, 0, 0.6, 2.42);
      carBox(new THREE.BoxGeometry(2.14, 0.35, 0.16), dkM, 0, 0.39, 2.41);
      carBox(new THREE.BoxGeometry(2.14, 0.32, 0.16), dkM, 0, 0.39, -2.41);
      [-0.72,0.72].forEach(x => carBox(new THREE.BoxGeometry(0.5, 0.22, 0.09), lM2, x, 0.79, 2.42));
      [-0.74,0.74].forEach(x => carBox(new THREE.BoxGeometry(0.48, 0.24, 0.08), tM, x, 0.79, -2.42));

      const nitroGroup = new THREE.Group(); nitroGroup.visible = false;
      [-0.38,0.38].forEach(ex => {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.8, 6),
          new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.7 }));
        flame.rotation.x = Math.PI/2; flame.position.set(ex, 0.28, -2.9); nitroGroup.add(flame);
      });
      car.add(nitroGroup); nitroRef.current = nitroGroup;

      const fSpot = new THREE.SpotLight(0xfff8e0, 2.0, 28, 0.28, 0.55);
      fSpot.position.set(0, 1.1, 2.8); fSpot.target.position.set(0, 0, 25);
      car.add(fSpot); car.add(fSpot.target);

      [{ pos:[1.12,0.39,1.38], name:"fr" },{ pos:[-1.12,0.39,1.38], name:"fl" },
       { pos:[1.12,0.39,-1.38], name:"rr" },{ pos:[-1.12,0.39,-1.38], name:"rl" }]
        .forEach(({ pos: [wx,wy,wz], name }) => {
          const wg = new THREE.Group(); wg.position.set(wx, wy, wz);
          const tire = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.155, 10, 18), rbM);
          tire.rotation.y = Math.PI/2; tire.castShadow = true; wg.add(tire);
          const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.18, 12),
            new THREE.MeshStandardMaterial({ color: 0xd0d0d8, roughness: 0.12, metalness: 0.92 }));
          disc.rotation.z = Math.PI/2; wg.add(disc);
          car.add(wg); wheelsRef.current[name] = wg;
        });

      const [startX, startZ] = catmullRomClosedStatic(ROAD_WP, 0);
      car.position.set(startX, 0, startZ); scene.add(car); carRef.current = car;
      smoothWorldPos.current = { x: startX, z: startZ };

      setLoadProgress(100); setLoadLabel("LET'S GO!");
      await new Promise(r => setTimeout(r, 600));
      if (mounted) setLoaded(true);

      const camPos  = new THREE.Vector3(startX, 5, startZ+10);
      const camLook = new THREE.Vector3(startX, 1.5, startZ);
      let animT = 0, lastTime = 0, frameCount = 0;

      const MAX_DELTA = 0.05, ENGINE_FORCE = 0.000110, TOP_SPEED = 0.0045;
      const ROLLING_RESISTANCE = 0.991, DRAG_COEFF = 0.018, IMPULSE_DECAY = 0.72;
      const WORLD_SPRING = 0.055, WORLD_DAMPEN = 0.78, CAM_LAG = 0.05, NITRO_THRESHOLD = 100;

      function animate(now = 0) {
        if (!mounted) return;
        frameRef.current = requestAnimationFrame(animate);
        const rawDelta = Math.min((now-lastTime)/1000, MAX_DELTA);
        lastTime = now; animT += rawDelta; frameCount++;

        if (frameCount % 4 === 0 && skyUniRef.current) skyUniRef.current.uTime.value = animT*0.5;

        const engineForce = scrollImpulseRef.current * ENGINE_FORCE;
        scrollImpulseRef.current *= IMPULSE_DECAY;
        carVelocityRef.current += engineForce;
        carVelocityRef.current *= ROLLING_RESISTANCE;
        const vA = Math.abs(carVelocityRef.current);
        carVelocityRef.current += (carVelocityRef.current > 0 ? -1 : 1) * DRAG_COEFF * vA * vA;
        carVelocityRef.current = Math.max(-TOP_SPEED, Math.min(TOP_SPEED, carVelocityRef.current));
        if (Math.abs(carVelocityRef.current) < 0.000015) carVelocityRef.current = 0;
        carPosRef.current += carVelocityRef.current;

        const t = carPosRef.current;
        const vA2 = Math.abs(carVelocityRef.current);
        const spdKmh = Math.min(120, Math.round(vA2*12300));

        if (frameCount % 10 === 0 && ((t%1+1)%1) > 0.12) {
          setIntroOpacity(o => {
            const next = o - 0.04;
            if (next <= 0) { setIntroVisible(false); return 0; }
            return next;
          });
        }

        if (frameCount % 6 === 0) {
          setSpeed(spdKmh);
          const isN = spdKmh >= NITRO_THRESHOLD;
          setNitroActive(isN);
          if (nitroRef.current) nitroRef.current.visible = isN;
          setCarMapPos({ x: smoothWorldPos.current.x, z: smoothWorldPos.current.z });
        }

        const [targetCx, targetCz] = catmullRomClosedStatic(ROAD_WP, t);
        const [ddx, ddz] = getRoadDirClosedStatic(ROAD_WP, t);

        if (carRef.current) {
          const sw = smoothWorldPos.current, sv = smoothWorldVel.current;
          sv.x = sv.x*WORLD_DAMPEN + (targetCx-sw.x)*WORLD_SPRING;
          sv.z = sv.z*WORLD_DAMPEN + (targetCz-sw.z)*WORLD_SPRING;
          sw.x += sv.x; sw.z += sv.z;
          carRef.current.position.x = sw.x; carRef.current.position.z = sw.z;
          carRef.current.position.y = Math.sin(animT*5)*0.012*Math.min(1, spdKmh/40);

          const tY = Math.atan2(ddx, ddz);
          let diff = tY - carYawRef.current;
          while (diff > Math.PI) diff -= Math.PI*2;
          while (diff < -Math.PI) diff += Math.PI*2;
          const ys = 0.06 + Math.min(0.06, vA2*4);
          carYawRef.current += diff * ys;
          carRef.current.rotation.y = carYawRef.current;
          carRef.current.rotation.z += (-diff*0.12*Math.min(1,spdKmh/60) - carRef.current.rotation.z)*0.18;
          const pf = engineForce > 0 ? -0.018*Math.min(1,spdKmh/80) : 0.014*Math.min(1,spdKmh/40);
          carRef.current.rotation.x += (pf - carRef.current.rotation.x)*0.1;
          Object.values(wheelsRef.current).forEach(w => { if (w) w.rotation.x += vA2*95; });
        }

        const yaw = carYawRef.current, sY = Math.sin(yaw), cY = Math.cos(yaw);
        const perpX = Math.cos(yaw), perpZ = -Math.sin(yaw);
        const sw = smoothWorldPos.current;
        const spb = Math.min(3.0, spdKmh*0.015);
        const cld = CAM_LAG * (1 - Math.min(0.4, spdKmh*0.003));
        camPos.x += (sw.x - sY*(9.5+spb) + perpX*2.5 - camPos.x)*cld;
        camPos.y += (4.5 + spb*0.3 - camPos.y)*cld;
        camPos.z += (sw.z - cY*(9.5+spb) + perpZ*2.5 - camPos.z)*cld;
        camLook.x += (sw.x + sY*10.0 - camLook.x)*(cld*1.3);
        camLook.y += (2.0 - camLook.y)*cld;
        camLook.z += (sw.z + cY*10.0 - camLook.z)*(cld*1.3);
        cameraRef.current.position.copy(camPos);
        cameraRef.current.lookAt(camLook);

        if (frameCount % 4 === 0)
          buildingsRef.current.forEach((b, bi) => { b.pl.intensity = 1.5 + Math.sin(animT*1.1+bi)*0.4; });

        windmillsRef.current.forEach((wm, wi) => {
          if (wm.userData.blades) wm.userData.blades.rotation.z += 0.009+wi*0.004;
        });

        if (frameCount % 2 === 0 && fountainRef.current.geo) {
          const fp = fountainRef.current, pos = fp.geo.attributes.position.array;
          fp.vel.forEach((v, i) => {
            v.life += rawDelta*2;
            if (v.life > v.maxLife) {
              v.life = 0;
              const ang = Math.random()*Math.PI*2, r = Math.random()*0.2;
              pos[i*3] = Math.cos(ang)*r; pos[i*3+1] = 0; pos[i*3+2] = Math.sin(ang)*r;
              v.vx = (Math.random()-.5)*0.07; v.vy = 0.08+Math.random()*0.07; v.vz = (Math.random()-.5)*0.07;
            } else {
              pos[i*3] += v.vx; pos[i*3+1] += v.vy; pos[i*3+2] += v.vz; v.vy -= 0.004;
            }
          });
          fp.geo.attributes.position.needsUpdate = true;
        }

        if (frameCount % 3 === 0) {
          birdGroupsRef.current.forEach(flock => {
            flock.userData.orbitPhase += flock.userData.orbitSpeed*3;
            const op = flock.userData.orbitPhase, or = flock.userData.orbitR;
            flock.position.x = Math.cos(op)*or*0.6; flock.position.z = Math.sin(op)*or;
            flock.children.forEach(bird => {
              bird.rotation.z = Math.sin(bird.userData.phase + animT*bird.userData.speed*2)*0.5;
              bird.rotation.y = op + Math.PI;
            });
          });
        }

        if (frameCount % 8 === 0) {
          const sid = getSectionIdAt(t);
          setActiveSectionId(sid);
          setProgress(((t%1)+1)%1);
        }

        renderer.render(scene, cameraRef.current);
      }
      animate();

      function onMouseMove(e) {
        if (!cameraRef.current || !raycasterRef.current) return;
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX-rect.left)/rect.width)*2-1;
        const y = -((e.clientY-rect.top)/rect.height)*2+1;
        raycasterRef.current.setFromCamera({ x, y }, cameraRef.current);
        const meshes = sponsorBuildingDataRef.current.map(b => b.mesh);
        const hits = raycasterRef.current.intersectObjects(meshes, false);
        const hasLink = hits.length > 0 && (() => {
          const entry = sponsorBuildingDataRef.current.find(b => b.mesh === hits[0].object);
          if (!entry) return false;
          const sp = liveSponsorLinksRef.current[entry.buildingIndex];
          return !!(sp?.link);
        })();
        setHoveredBuilding(hasLink);
      }

      function onCanvasClick(e) {
        if (!cameraRef.current || !raycasterRef.current) return;
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX-rect.left)/rect.width)*2-1;
        const y = -((e.clientY-rect.top)/rect.height)*2+1;
        raycasterRef.current.setFromCamera({ x, y }, cameraRef.current);
        const meshes = sponsorBuildingDataRef.current.map(b => b.mesh);
        const hits = raycasterRef.current.intersectObjects(meshes, false);
        if (hits.length > 0) {
          const entry = sponsorBuildingDataRef.current.find(b => b.mesh === hits[0].object);
          if (entry !== undefined) {
            const sp = liveSponsorLinksRef.current[entry.buildingIndex];
            if (sp?.link) {
              const url = sp.link.match(/^https?:\/\//) ? sp.link : `https://${sp.link}`;
              window.open(url, "_blank", "noopener,noreferrer");
            }
          }
        }
      }

      renderer.domElement.addEventListener("mousemove", onMouseMove);
      renderer.domElement.addEventListener("click", onCanvasClick);

      const onResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight;
        cameraRef.current.aspect = w/h; cameraRef.current.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        renderer.domElement.removeEventListener("mousemove", onMouseMove);
        renderer.domElement.removeEventListener("click", onCanvasClick);
        delete window.__hackdriveUpdateSponsor;
      };
    }

    const cleanup = init();
    return () => {
      mounted = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current && mountRef.current) {
        try { mountRef.current.removeChild(rendererRef.current.domElement); } catch {}
        rendererRef.current.dispose();
      }
      cleanup?.then?.(fn => fn?.());
    };
  }, [getSectionIdAt]);

  const pendingSponsorUpdateRef = useRef(null);

  useEffect(() => {
    if (!window.__hackdriveUpdateSponsor) {
      pendingSponsorUpdateRef.current = snapshot.sponsors.slice(0, 5);
      return;
    }
    snapshot.sponsors.slice(0, 5).forEach((sp, i) => { window.__hackdriveUpdateSponsor(i, sp); });
  }, [snapshot.sponsors]);

  useEffect(() => {
    const onWheel = e => {
      e.preventDefault();
      const n = e.deltaY/Math.max(1, Math.abs(e.deltaY)) * Math.min(1.5, Math.abs(e.deltaY)*0.015);
      scrollImpulseRef.current = Math.max(-40, Math.min(40, scrollImpulseRef.current + n));
    };
    const el = mountRef.current;
    if (el) el.addEventListener("wheel", onWheel, { passive: false });
    return () => { if (el) el.removeEventListener("wheel", onWheel); };
  }, []);

  useEffect(() => {
    const onTS = e => {
      const t = e.touches[0];
      if (t.clientY > window.innerHeight*0.45) return;
      touchStartYRef.current = t.clientY; lastTouchYRef.current = t.clientY;
    };
    const onTM = e => {
      if (touchStartYRef.current === null) return;
      const t = e.touches[0];
      const dy = lastTouchYRef.current - t.clientY;
      lastTouchYRef.current = t.clientY;
      scrollImpulseRef.current = Math.max(-40, Math.min(40, scrollImpulseRef.current + dy*0.04));
    };
    const onTE = () => { touchStartYRef.current = null; lastTouchYRef.current = null; };
    const el = mountRef.current;
    if (el) {
      el.addEventListener("touchstart", onTS, { passive: true });
      el.addEventListener("touchmove", onTM, { passive: true });
      el.addEventListener("touchend", onTE, { passive: true });
    }
    return () => {
      if (el) {
        el.removeEventListener("touchstart", onTS);
        el.removeEventListener("touchmove", onTM);
        el.removeEventListener("touchend", onTE);
      }
    };
  }, []);

  // ── Change 2: Teleport car to section position instantly ──────
  const handleNavClick = i => {
    const targetT = SEC_T[i];
    // Instantly set car position — no impulse, no lerp
    carPosRef.current = targetT;
    carVelocityRef.current = 0;
    scrollImpulseRef.current = 0;
    const [cx, cz] = catmullRomClosedStatic(ROAD_WP, targetT);
    smoothWorldPos.current = { x: cx, z: cz };
    smoothWorldVel.current = { x: 0, z: 0 };
    if (carRef.current) {
      carRef.current.position.x = cx;
      carRef.current.position.z = cz;
      carRef.current.position.y = 0;
      const [ddx, ddz] = getRoadDirClosedStatic(ROAD_WP, targetT);
      carYawRef.current = Math.atan2(ddx, ddz);
      carRef.current.rotation.y = carYawRef.current;
      carRef.current.rotation.x = 0;
      carRef.current.rotation.z = 0;
    }
    setActiveSectionId(SECTION_IDS[i]);
    setProgress(targetT);
  };

  const activeSectionAccent = activeSectionId
    ? (SECTION_ACCENTS[activeSectionId]?.accent || "#f59e0b")
    : "#f59e0b";

  return (
    <div style={{ width:"100vw", height:"100vh", position:"relative", overflow:"hidden", background:"#070d18",
      fontFamily: FONT_BODY }}>
      <div ref={mountRef} style={{ width:"100%", height:"100%",
        filter: nitroActive ? "blur(1.4px)" : "none", transition:"filter 0.2s ease",
        cursor: hoveredBuilding ? "pointer" : "default" }} />

      {/* Loading screen */}
      {!loaded && (
        <div style={{ position:"absolute", inset:0, zIndex:100, background:"#060b14",
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", padding:"0 20px" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px",
            background:`linear-gradient(90deg,transparent,#f59e0b ${loadProgress}%,transparent)` }} />

          <div style={{ width:80, height:80, borderRadius:"50%",
            border:"1.5px solid rgba(245,158,11,.15)", display:"flex",
            alignItems:"center", justifyContent:"center", marginBottom:32, position:"relative" }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%",
              border:"1.5px solid transparent", borderTopColor:"#f59e0b",
              animation:"spin 1.0s linear infinite" }} />
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M6 22 L12 10 L16 15 L22 6 L26 22 Z" fill="#f59e0b" opacity=".95" />
            </svg>
          </div>

          {snapshotError && (
            <div style={{ marginBottom:12, padding:"6px 16px",
              background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)",
              borderRadius:8, fontSize:11, color:"rgba(245,158,11,0.8)", fontFamily: FONT_MONO,
              letterSpacing:".1em" }}>
              ⚠ API OFFLINE — RUNNING ON FALLBACK DATA
            </div>
          )}

          <div style={{ fontSize:10, letterSpacing:".42em", color:"rgba(245,158,11,.7)",
            marginBottom:10, fontFamily: FONT_MONO, fontWeight: 600 }}>
            {displayEventName.toUpperCase()}
          </div>
          <div style={{ fontSize: isMobile ? 26 : 38, fontWeight:800, color:"#ffffff",
            letterSpacing:"-.02em", fontFamily: FONT_BODY, marginBottom:6,
            textAlign:"center", textShadow:"0 0 40px rgba(245,158,11,0.3)" }}>
            {displayEventName}
          </div>
          <div style={{ fontSize:13, color:"rgba(200,210,230,0.65)", marginBottom:52,
            letterSpacing:".04em", fontFamily: FONT_BODY, textAlign:"center",
            maxWidth: 320, lineHeight: 1.5 }}>
            {snapshot.config.tagline}
          </div>

          <div style={{ width:"100%", maxWidth:280, marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, alignItems:"center" }}>
              <span style={{ fontSize:11, color:"rgba(180,200,230,0.55)", letterSpacing:".14em",
                fontFamily: FONT_MONO, fontWeight:600 }}>{loadLabel}</span>
              <span style={{ fontSize:12, color:"#f59e0b", fontFamily: FONT_MONO, fontWeight:700 }}>{loadProgress}%</span>
            </div>
            <div style={{ height:"2px", background:"#0e1e30", borderRadius:1 }}>
              <div style={{ height:"100%", width:`${loadProgress}%`,
                background:"linear-gradient(90deg,#92400e,#f59e0b)", borderRadius:1,
                transition:"width .2s ease", boxShadow:"0 0 10px rgba(245,158,11,.4)" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            {[0,20,40,60,80].map((th, i) => (
              <div key={i} style={{ width:6, height:6, borderRadius:"50%",
                background: loadProgress > th ? "#f59e0b" : "#0e1e30",
                transition:"background .3s", boxShadow: loadProgress > th ? "0 0 8px #f59e0b" : "" }} />
            ))}
          </div>
          <div style={{ position:"absolute", bottom:24, fontSize:10, color:"rgba(255,255,255,0.15)",
            letterSpacing:".22em", fontFamily: FONT_MONO }}>
            POWERED BY THREE.JS · WEBGL
          </div>
        </div>
      )}

      {loaded && introVisible && <TopScrollHint opacity={introOpacity} isMobile={isMobile} />}

      {loaded && nitroActive && (
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:5,
          background:"radial-gradient(ellipse at center, transparent 30%, rgba(0,80,255,0.32) 100%)",
          animation:"nitroPulse .15s ease infinite alternate" }} />
      )}

      {loaded && snapshotError && (
        <div style={{ position:"absolute", top: isMobile ? 50 : 60, left:"50%", transform:"translateX(-50%)",
          zIndex:15, padding:"3px 12px", background:"rgba(245,158,11,0.12)",
          border:"1px solid rgba(245,158,11,0.25)", borderRadius:"0 0 8px 8px",
          fontSize:10, color:"rgba(245,158,11,0.75)", fontFamily: FONT_MONO,
          letterSpacing:".12em", whiteSpace:"nowrap" }}>
          ⚠ OFFLINE MODE — SHOWING FALLBACK DATA
        </div>
      )}

      {loaded && isAdmin && (
        <div style={{ position:"absolute", top: isMobile ? 48 : 58, left:0,
          right: isMobile ? 90 : 130, zIndex:15, display:"flex", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ padding:"4px 14px", background:"rgba(245,158,11,0.15)",
            border:"1px solid rgba(245,158,11,0.3)", borderRadius:"0 0 8px 8px",
            fontSize:10, color:"rgba(245,158,11,0.9)", fontFamily: FONT_MONO,
            letterSpacing:".18em", fontWeight:600 }}>
            ⚡ ADMIN MODE — ✏ EDIT · + ADD · 🗑 DELETE
          </div>
        </div>
      )}

      {loaded && <AdminToolbar isAdmin={isAdmin} isMobile={isMobile} onNavigateLogin={() => navigate("/login")} />}

      {/* Top nav bar */}
      {loaded && (
        <div style={{ position:"absolute", top:0, left:0, right:0,
          height: isMobile ? 48 : 58, display:"flex", alignItems:"center",
          padding: isMobile ? "0 12px" : "0 22px",
          zIndex:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 8 : 12, flex:1, minWidth:0 }}>
            <div style={{ width: isMobile ? 30 : 80, height: isMobile ? 30 : 80, borderRadius:9, flexShrink:0,
              display:"flex",
              alignItems:"center", justifyContent:"center"}}>
         <img
  src={aa}
  alt="logo"
  style={{
    width: "100%",
    objectFit: "contain",
    height:"100%"
  }}
/>
            </div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: "#ffffff",
                fontFamily: FONT_BODY, letterSpacing:"-.01em", lineHeight: 1.1,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {displayEventName}
              </div>
           
            </div>
          </div>

          {/* Speedometer */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7,
              padding:"5px 14px 5px 10px", background:"rgba(0,0,0,0.55)",
              border:`1px solid ${nitroActive ? "rgba(68,136,255,0.6)" : "rgba(255,255,255,.12)"}`,
              borderRadius:24, transition:"border .3s" }}>
              <div style={{ width:7, height:7, borderRadius:"50%",
                background: nitroActive ? "#4488ff" : speed > 5 ? "#22c55e" : "#1a2f45",
                boxShadow: nitroActive ? "0 0 10px #4488ff" : speed > 5 ? "0 0 8px #22c55e" : "none",
                transition:"all .3s" }} />
              <span style={{ fontSize: isMobile ? 14 : 17, fontWeight:800,
                color: nitroActive ? "#aaddff" : "#ffffff", fontFamily: FONT_MONO,
                minWidth:32, textAlign:"right", transition:"color .3s" }}>{speed}</span>
              <span style={{ fontSize:9, color: nitroActive ? "#6699cc" : "rgba(180,200,240,0.5)",
                letterSpacing:".14em", fontFamily: FONT_MONO }}>KM/H</span>
              {nitroActive && !isMobile && (
                <span style={{ fontSize:9, color:"#4488ff", letterSpacing:".1em", fontWeight:800,
                  fontFamily: FONT_MONO }}>NITRO</span>
              )}
            </div>
            {!isMobile && (
              <div style={{ width:120, height:2, background:"rgba(255,255,255,0.07)", borderRadius:1, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min(100,speed/1.2)}%`,
                  background: nitroActive ? "linear-gradient(90deg,#4488ff,#aaddff)" : "linear-gradient(90deg,#f59e0b,#f97316)",
                  borderRadius:1, transition:"width .08s" }} />
              </div>
            )}
          </div>

          <div style={{ flex:1, display:"flex", justifyContent:"flex-end" }}>
            {!isMobile && (
              <span style={{ fontSize:10, color:"rgba(180,200,240,0.35)", letterSpacing:".16em",
                fontFamily: FONT_MONO }}>
                {Math.round(progress*100)}% · LAP {Math.floor(carPosRef.current)+1}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {loaded && (
        <div style={{ position:"absolute", top: isMobile ? 48 : 58, left:0, right:0,
          height:2, background:"rgba(255,255,255,.04)", zIndex:10 }}>
          <div style={{ height:"100%", width:`${progress*100}%`,
            background: nitroActive ? "linear-gradient(90deg,#4488ff,#aaddff)" : "linear-gradient(90deg,#f59e0b,#f97316)",
            transition:"width .06s",
            boxShadow: nitroActive ? "0 0 10px rgba(68,136,255,.8)" : "0 0 8px rgba(245,158,11,.6)" }} />
        </div>
      )}

      {/* Mini map */}
      {loaded && !isMobile && (
        <div style={{ position:"absolute", top:72, right:24, width:104, height:104,
          background:"rgba(4,9,18,.88)", border:"1px solid rgba(255,255,255,.1)",
          borderRadius:10, overflow:"hidden", zIndex:10,
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}>
          <svg width="104" height="104" viewBox="-55 -55 110 110">
            <ellipse cx="0" cy="0" rx="42" ry="38" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="5" />
            {SECTION_IDS.map((id, i) => {
              const [bx2, bz2] = BLDG_POS[i];
              const col = SECTION_ACCENTS[id];
              return (
                <g key={i}>
                  <circle cx={bx2*0.7} cy={bz2*0.7} r="5" fill={col.accent} opacity="0.25" />
                  <circle cx={bx2*0.7} cy={bz2*0.7} r="3" fill={col.accent} opacity="0.9" />
                </g>
              );
            })}
            <circle cx={carMapPos.x*0.7} cy={carMapPos.z*0.7} r="4" fill="#ffffff" />
          </svg>
          <div style={{ position:"absolute", bottom:4, left:0, right:0, textAlign:"center",
            fontSize:7, color:"rgba(255,255,255,0.25)", fontFamily: FONT_MONO,
            letterSpacing:".1em" }}>MAP</div>
        </div>
      )}

      {/* Desktop nav dots */}
      {loaded && !isMobile && (
        <div style={{ position:"absolute", right:22, top:"50%", transform:"translateY(-50%)",
          display:"flex", flexDirection:"column", gap:16, alignItems:"flex-end", zIndex:10 }}>
          {SECTION_IDS.map((id, i) => {
            const active = Math.abs(progress-SEC_T[i]) < 0.06 ||
              Math.abs(progress-SEC_T[i]-1) < 0.06 || Math.abs(progress-SEC_T[i]+1) < 0.06;
            const col = SECTION_ACCENTS[id];
            return (
              <button key={id} onClick={() => handleNavClick(i)}
                style={{ display:"flex", alignItems:"center", gap:10, background:"none",
                  border:"none", cursor:"pointer",
                  opacity: active ? 1 : 0.35,
                  transition:"all .4s", transform: active ? "translateX(0)" : "translateX(8px)", padding:0 }}>
                <div style={{
                  padding: active ? "3px 10px" : "2px 6px",
                  background: active ? `${col.accent}22` : "transparent",
                  border: active ? `1px solid ${col.accent}55` : "1px solid transparent",
                  borderRadius: 6, transition:"all .3s",
                }}>
                  <span style={{ fontSize: active ? 10 : 9, color: active ? col.accent : "rgba(180,200,240,0.4)",
                    letterSpacing:".15em", fontFamily: FONT_MONO, fontWeight: active ? 700 : 400,
                    transition:"color .3s" }}>
                    {id.toUpperCase()}
                  </span>
                </div>
                <div style={{ width: active ? 12 : 6, height: active ? 12 : 6, borderRadius:"50%",
                  background: active ? col.accent : "#0e1e30",
                  boxShadow: active ? `0 0 14px ${col.accent}, 0 0 6px ${col.accent}` : "",
                  border:`1.5px solid ${active ? col.accent : "#1a2f45"}`,
                  transition:"all .3s", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile nav dots */}
      {loaded && isMobile && (
        <div style={{ position:"fixed", bottom: activeSectionId ? "calc(58vh + 8px)" : 8,
          left:"50%", transform:"translateX(-50%)", display:"flex", gap:12, zIndex:25,
          transition:"bottom 0.4s ease", background:"rgba(4,9,18,0.75)", borderRadius:20,
          padding:"6px 14px", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.08)" }}>
          {SECTION_IDS.map((id, i) => {
            const active = Math.abs(progress-SEC_T[i]) < 0.06 ||
              Math.abs(progress-SEC_T[i]-1) < 0.06 || Math.abs(progress-SEC_T[i]+1) < 0.06;
            return (
              <button key={id} onClick={() => handleNavClick(i)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:"4px",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <div style={{ width: active ? 22 : 8, height:6, borderRadius:3,
                  background: active ? SECTION_ACCENTS[id].accent : "rgba(255,255,255,0.18)",
                  transition:"all 0.3s",
                  boxShadow: active ? `0 0 10px ${SECTION_ACCENTS[id].accent}` : "none" }} />
              </button>
            );
          })}
        </div>
      )}

      {loaded && (
        <SectionPanel secId={activeSectionId} snapshot={snapshot} isAdmin={isAdmin}
          isMobile={isMobile} onRegister={() => setShowRegister(true)} refetchAll={refetchAll} />
      )}

      {loaded && !isMobile && <TeamsPanel isAdmin={isAdmin} accent="#06b6d4" />}

      {/* Compass */}
      {loaded && !isMobile && (
        <div style={{ position:"absolute", bottom:30, right:30, width:58, height:58,
          background:"rgba(4,9,18,.92)", border:"1px solid rgba(255,255,255,.1)",
          borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(10px)", zIndex:10, boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}>
          <svg width="44" height="44" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="19" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
            <polygon points="21,4 24,21 21,17 18,21" fill="#f59e0b" />
            <polygon points="21,38 24,21 21,25 18,21" fill="rgba(255,255,255,.2)" />
            <circle cx="21" cy="21" r="2.5" fill="rgba(255,255,255,.45)" />
            {["N","E","S","W"].map((l, i) => (
              <text key={l} x={21+16*Math.sin(i*Math.PI/2)} y={21-16*Math.cos(i*Math.PI/2)+3.8}
                textAnchor="middle" fill={i===0?"#f59e0b":"rgba(255,255,255,.3)"}
                fontSize="5.5" fontFamily="monospace">{l}</text>
            ))}
          </svg>
        </div>
      )}

      {showRegister && (
        <RegisterModal
          accent={activeSectionAccent}
          onClose={() => setShowRegister(false)}
          eventName={displayEventName}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes nitroPulse{from{opacity:0.5}to{opacity:1}}
        @keyframes wheelScroll{0%{transform:translateY(0);opacity:1}50%{transform:translateY(8px);opacity:0.15}100%{transform:translateY(0);opacity:1}}
        @keyframes chevronBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}