// ScholarshipForm.jsx
import React, { useState } from "react";
import {
  useGetAllFieldsQuery,
  useGetAllCollegesQuery,
  useCreateScholarshipMutation,
} from "../Redux/Slices/ScholarshipApiSlice.ts";

const inputStyle = {
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
  appearance: "none",
  WebkitAppearance: "none",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#7d92b2",
  marginBottom: "6px",
};

const fieldWrap = { marginBottom: "1.1rem" };

export const ScholarshipForm = () => {
  const { data: fieldsData }   = useGetAllFieldsQuery();
  const { data: collegesData } = useGetAllCollegesQuery();
  const [createScholarship, { isLoading }] = useCreateScholarshipMutation();

  const [form, setForm] = useState({
    CollegeId: "", ScholarshipName: "", Description: "",
    TargetFieldId: "", MinEducationLevelId: "", IsActive: true,
  });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [focus, setFocus]     = useState(null);

  const selectedCollege = collegesData?.data?.find((c) => c.collegeId === parseInt(form.CollegeId));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "CollegeId" ? { MinEducationLevelId: "" } : {}),
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await createScholarship({
        CollegeId: parseInt(form.CollegeId),
        ScholarshipName: form.ScholarshipName,
        Description: form.Description || null,
        TargetFieldId: parseInt(form.TargetFieldId),
        MinEducationLevelId: parseInt(form.MinEducationLevelId),
        IsActive: form.IsActive,
      }).unwrap();
      setSuccess("Scholarship created successfully!");
      setForm({ CollegeId: "", ScholarshipName: "", Description: "", TargetFieldId: "", MinEducationLevelId: "", IsActive: true });
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.data?.message || "Failed to create scholarship.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const focusInput = (name) => ({ ...inputStyle, borderColor: focus === name ? "#e8c56d" : "rgba(255,255,255,0.07)", boxShadow: focus === name ? "0 0 0 3px rgba(232,197,109,0.1)" : "none" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .sch-submit:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
        .sch-submit:disabled { opacity:0.5; cursor:not-allowed; }
        select option { background:#121e35; color:#c2d3e8; }
      `}</style>
      <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: "600px", animation: "fadeUp 0.4s ease both" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "1.75rem" }}>
          <div style={{
            width: "48px", height: "48px",
            background: "linear-gradient(135deg, #e8c56d, #c9963e)",
            borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px",
            boxShadow: "0 4px 16px rgba(232,197,109,0.25)",
          }}>🏆</div>
          <div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 500, color: "#e8f0f8", margin: 0 }}>Add Scholarship</h2>
            <p style={{ fontSize: "12.5px", color: "#7d92b2", margin: 0 }}>Create a new scholarship for your college</p>
          </div>
        </div>

        {/* Form card */}
        <div style={{ background: "#121e35", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "1.75rem" }}>
          <form onSubmit={handleSubmit}>

            {/* College */}
            <div style={fieldWrap}>
              <label style={labelStyle}>College</label>
              <select name="CollegeId" value={form.CollegeId} onChange={handleChange} required
                style={focusInput("CollegeId")}
                onFocus={() => setFocus("CollegeId")} onBlur={() => setFocus(null)}
              >
                <option value="">Select College</option>
                {collegesData?.data?.map((c) => (
                  <option key={c.collegeId} value={c.collegeId}>{c.collegeName}</option>
                ))}
              </select>
            </div>

            {/* Scholarship Name */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Scholarship Name</label>
              <input type="text" name="ScholarshipName" value={form.ScholarshipName} onChange={handleChange}
                placeholder="Enter scholarship name" required
                style={focusInput("ScholarshipName")}
                onFocus={() => setFocus("ScholarshipName")} onBlur={() => setFocus(null)}
              />
            </div>

            {/* Grid: field + edu level */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Target Field</label>
                <select name="TargetFieldId" value={form.TargetFieldId} onChange={handleChange} required
                  style={focusInput("TargetFieldId")}
                  onFocus={() => setFocus("TargetFieldId")} onBlur={() => setFocus(null)}
                >
                  <option value="">Select Field</option>
                  {fieldsData?.data?.map((f) => (
                    <option key={f.fieldId} value={f.fieldId}>{f.fieldName}</option>
                  ))}
                </select>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Min Education Level</label>
                <select name="MinEducationLevelId" value={form.MinEducationLevelId} onChange={handleChange} required
                  disabled={!form.CollegeId}
                  style={{ ...focusInput("MinEducationLevelId"), opacity: form.CollegeId ? 1 : 0.5 }}
                  onFocus={() => setFocus("MinEducationLevelId")} onBlur={() => setFocus(null)}
                >
                  <option value="">{form.CollegeId ? "Select Level" : "Select college first"}</option>
                  {selectedCollege?.educationScopes?.map((es) => (
                    <option key={es.educationLevelId} value={es.educationLevelId}>{es.levelName}</option>
                  ))}
                </select>
                {form.CollegeId && selectedCollege && (
                  <div style={{ fontSize: "11px", color: "#7d92b2", marginTop: "4px" }}>
                    Offers: {selectedCollege.educationScopes.map((es) => es.levelName).join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Description (optional)</label>
              <textarea name="Description" value={form.Description} onChange={handleChange}
                placeholder="Brief description of the scholarship"
                rows={3}
                style={{ ...focusInput("Description"), resize: "vertical" }}
                onFocus={() => setFocus("Description")} onBlur={() => setFocus(null)}
              />
            </div>

            {/* Active toggle */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: "#0d1526",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              marginBottom: "1.25rem",
              cursor: "pointer",
            }} onClick={() => setForm((p) => ({ ...p, IsActive: !p.IsActive }))}>
              <div style={{
                width: "36px", height: "20px",
                borderRadius: "99px",
                background: form.IsActive ? "linear-gradient(135deg, #2dd4a0, #1a9e75)" : "rgba(255,255,255,0.1)",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}>
                <div style={{
                  width: "14px", height: "14px",
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: "3px",
                  left: form.IsActive ? "19px" : "3px",
                  transition: "left 0.2s",
                }} />
              </div>
              <span style={{ fontSize: "13px", fontWeight: 500, color: form.IsActive ? "#2dd4a0" : "#7d92b2" }}>
                {form.IsActive ? "Active Scholarship" : "Inactive Scholarship"}
              </span>
            </div>

            {error   && <div style={{ padding: "10px 13px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "9px", color: "#f87171", fontSize: "13px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>⚠️ {error}</div>}
            {success && <div style={{ padding: "10px 13px", background: "rgba(45,212,160,0.1)",  border: "1px solid rgba(45,212,160,0.2)",  borderRadius: "9px", color: "#2dd4a0", fontSize: "13px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>✅ {success}</div>}

            <button type="submit" disabled={isLoading} className="sch-submit" style={{
              width: "100%",
              padding: "12px",
              background: "linear-gradient(135deg, #e8c56d, #c9963e)",
              color: "#080d1a",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(232,197,109,0.2)",
              transition: "opacity 0.2s, transform 0.2s",
            }}>
              {isLoading ? "⏳ Creating…" : "✨ Create Scholarship"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ScholarshipForm;