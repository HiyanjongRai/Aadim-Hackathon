// CollegesPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetAllCollegesQuery,
  useGetCollegeByIdQuery,
  useCreateCollegeMutation,
  useDeleteCollegeMutation,
  useGetAllEducationLevelsQuery,
  useGetAllFieldsQuery,
  useCreateScholarshipMutation,
  useDeleteScholarshipMutation,
  useToggleScholarshipActiveMutation,
  useUpdateScholarshipMutation,
} from "../Redux/Slices/ScholarshipApiSlice.ts";

// ── Shared styles ─────────────────────────────────────────────
const card = {
  background: "#121e35",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "18px",
  padding: "1.25rem 1.5rem",
};

const inputStyle = {
  width: "100%",
  background: "#0d1526",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "10px",
  padding: "9px 12px",
  fontSize: "13.5px",
  color: "#c2d3e8",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
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

const ScopeBadge = ({ name }) => (
  <span style={{
    background: "rgba(232,197,109,0.08)",
    color: "#e8c56d",
    border: "1px solid rgba(232,197,109,0.2)",
    borderRadius: "99px",
    padding: "2px 10px",
    fontSize: "11px",
    fontWeight: 500,
  }}>
    {name}
  </span>
);

// ── Navbar ────────────────────────────────────────────────────
const Navbar = () => {
  const navigate = useNavigate();
  const staffName   = localStorage.getItem("staff-Name");
  const collegeName = localStorage.getItem("staff-CollegeName");
  const userName    = localStorage.getItem("user-Name");
  const isStaff     = !!localStorage.getItem("staffId");
  const isStudent   = !!localStorage.getItem("userId");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(8,13,26,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "0 1.5rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: "56px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "20px" }}>🏫</span>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: "15px", fontWeight: 500, color: "#e8f0f8" }}>
          ScholarPortal
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {(isStaff || isStudent) && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#c2d3e8" }}>
              {isStaff ? staffName : userName}
            </div>
            <div style={{ fontSize: "11px", color: "#7d92b2" }}>
              {isStaff ? `Staff · ${collegeName}` : "Student"}
            </div>
          </div>
        )}
        <span style={{
          padding: "3px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
          background: isStaff ? "rgba(45,212,160,0.1)" : "rgba(232,197,109,0.1)",
          color: isStaff ? "#2dd4a0" : "#e8c56d",
          border: `1px solid ${isStaff ? "rgba(45,212,160,0.2)" : "rgba(232,197,109,0.2)"}`,
        }}>
          {isStaff ? "Staff" : isStudent ? "Student" : "Guest"}
        </span>
        {(isStaff || isStudent) ? (
          <button onClick={handleLogout} style={{
            padding: "6px 14px",
            background: "rgba(248,113,113,0.08)", color: "#f87171",
            border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px",
            fontSize: "12.5px", fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}>Logout</button>
        ) : (
          <button onClick={() => navigate("/login")} style={{
            padding: "6px 14px",
            background: "rgba(232,197,109,0.1)", color: "#e8c56d",
            border: "1px solid rgba(232,197,109,0.2)", borderRadius: "8px",
            fontSize: "12.5px", fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}>Login</button>
        )}
      </div>
    </nav>
  );
};

// ── Add Scholarship inline form ───────────────────────────────
const AddScholarshipForm = ({ collegeId, onClose, onSuccess }) => {
  const { data: fieldsData } = useGetAllFieldsQuery();
  const { data: eduData }    = useGetAllEducationLevelsQuery();
  const [createScholarship, { isLoading }] = useCreateScholarshipMutation();

  const [form, setForm] = useState({
    ScholarshipName: "", Description: "",
    TargetFieldId: "", MinEducationLevelId: "", IsActive: true,
  });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.TargetFieldId || !form.MinEducationLevelId) {
      setError("Please select a field and education level.");
      return;
    }
    try {
      await createScholarship({
        CollegeId: collegeId,
        ScholarshipName: form.ScholarshipName,
        Description: form.Description || null,
        TargetFieldId: Number(form.TargetFieldId),
        MinEducationLevelId: Number(form.MinEducationLevelId),
        IsActive: form.IsActive,
      }).unwrap();
      setSuccess("Scholarship added!");
      setTimeout(() => { onSuccess?.(); onClose(); }, 1200);
    } catch (err) {
      setError(err?.data?.message || "Failed to create scholarship.");
    }
  };

  return (
    <div style={{
      marginTop: "1.25rem", padding: "1.25rem",
      background: "#0d1526",
      border: "1px solid rgba(45,212,160,0.15)",
      borderRadius: "14px",
      animation: "fadeUp 0.25s ease both",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#2dd4a0" }}>➕ New Scholarship</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#7d92b2", fontSize: "16px", cursor: "pointer" }}>✕</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Scholarship Name *</label>
          <input type="text" required value={form.ScholarshipName}
            onChange={(e) => setForm(p => ({ ...p, ScholarshipName: e.target.value }))}
            placeholder="e.g., Merit Excellence Award" style={inputStyle} />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Description</label>
          <textarea value={form.Description}
            onChange={(e) => setForm(p => ({ ...p, Description: e.target.value }))}
            placeholder="Brief description (optional)" rows={2}
            style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Target Field *</label>
            <select value={form.TargetFieldId}
              onChange={(e) => setForm(p => ({ ...p, TargetFieldId: e.target.value }))}
              required style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Select field…</option>
              {fieldsData?.data?.map((f) => (
                <option key={f.fieldId} value={f.fieldId}>{f.fieldName}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Min Education *</label>
            <select value={form.MinEducationLevelId}
              onChange={(e) => setForm(p => ({ ...p, MinEducationLevelId: e.target.value }))}
              required style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Select level…</option>
              {eduData?.data?.map((el) => (
                <option key={el.educationLevelId} value={el.educationLevelId}>{el.levelName}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
          <label style={{ position: "relative", display: "inline-block", width: "36px", height: "20px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.IsActive}
              onChange={(e) => setForm(p => ({ ...p, IsActive: e.target.checked }))}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: "absolute", inset: 0, borderRadius: "99px", transition: "0.2s", background: form.IsActive ? "rgba(45,212,160,0.6)" : "rgba(255,255,255,0.1)" }} />
            <span style={{ position: "absolute", top: "3px", left: form.IsActive ? "19px" : "3px", width: "14px", height: "14px", borderRadius: "50%", transition: "0.2s", background: form.IsActive ? "#2dd4a0" : "#7d92b2" }} />
          </label>
          <span style={{ fontSize: "12.5px", color: "#7d92b2" }}>Active immediately</span>
        </div>
        {error   && <div style={{ padding: "8px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", color: "#f87171", fontSize: "12.5px", marginBottom: "0.75rem" }}>⚠️ {error}</div>}
        {success && <div style={{ padding: "8px 12px", background: "rgba(45,212,160,0.1)",  border: "1px solid rgba(45,212,160,0.2)",  borderRadius: "8px", color: "#2dd4a0", fontSize: "12.5px", marginBottom: "0.75rem" }}>✅ {success}</div>}
        <button type="submit" disabled={isLoading} style={{
          width: "100%", padding: "10px",
          background: isLoading ? "rgba(45,212,160,0.3)" : "linear-gradient(135deg, #2dd4a0, #1a9e75)",
          color: "#080d1a", border: "none", borderRadius: "9px",
          fontSize: "13.5px", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          cursor: isLoading ? "not-allowed" : "pointer",
        }}>
          {isLoading ? "⏳ Adding…" : "✨ Add Scholarship"}
        </button>
      </form>
    </div>
  );
};

// ── Edit Scholarship inline form ──────────────────────────────
const EditScholarshipForm = ({ scholarship, onClose, onSuccess }) => {
  const { data: fieldsData } = useGetAllFieldsQuery();
  const { data: eduData }    = useGetAllEducationLevelsQuery();
  const [updateScholarship, { isLoading }] = useUpdateScholarshipMutation();

  const [form, setForm] = useState({
    ScholarshipName: scholarship.scholarshipName,
    Description: scholarship.description || "",
    TargetFieldId: String(scholarship.targetFieldId),
    MinEducationLevelId: String(scholarship.minEducationLevelId),
    IsActive: scholarship.isActive,
  });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await updateScholarship({
        id: scholarship.scholarshipId,
        data: {
          ScholarshipName: form.ScholarshipName,
          Description: form.Description || null,
          TargetFieldId: Number(form.TargetFieldId),
          MinEducationLevelId: Number(form.MinEducationLevelId),
          IsActive: form.IsActive,
        },
      }).unwrap();
      setSuccess("Scholarship updated!");
      setTimeout(() => { onSuccess?.(); onClose(); }, 1200);
    } catch (err) {
      setError(err?.data?.message || "Failed to update scholarship.");
    }
  };

  return (
    <div style={{
      marginTop: "0.75rem", padding: "1.25rem",
      background: "#0d1526",
      border: "1px solid rgba(232,197,109,0.15)",
      borderRadius: "14px",
      animation: "fadeUp 0.2s ease both",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#e8c56d" }}>✏️ Edit Scholarship</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#7d92b2", fontSize: "16px", cursor: "pointer" }}>✕</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Scholarship Name *</label>
          <input type="text" required value={form.ScholarshipName}
            onChange={(e) => setForm(p => ({ ...p, ScholarshipName: e.target.value }))}
            style={inputStyle} />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Description</label>
          <textarea value={form.Description}
            onChange={(e) => setForm(p => ({ ...p, Description: e.target.value }))}
            rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Target Field *</label>
            <select value={form.TargetFieldId}
              onChange={(e) => setForm(p => ({ ...p, TargetFieldId: e.target.value }))}
              required style={{ ...inputStyle, cursor: "pointer" }}>
              {fieldsData?.data?.map((f) => (
                <option key={f.fieldId} value={f.fieldId}>{f.fieldName}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Min Education *</label>
            <select value={form.MinEducationLevelId}
              onChange={(e) => setForm(p => ({ ...p, MinEducationLevelId: e.target.value }))}
              required style={{ ...inputStyle, cursor: "pointer" }}>
              {eduData?.data?.map((el) => (
                <option key={el.educationLevelId} value={el.educationLevelId}>{el.levelName}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
          <label style={{ position: "relative", display: "inline-block", width: "36px", height: "20px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.IsActive}
              onChange={(e) => setForm(p => ({ ...p, IsActive: e.target.checked }))}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: "absolute", inset: 0, borderRadius: "99px", transition: "0.2s", background: form.IsActive ? "rgba(45,212,160,0.6)" : "rgba(255,255,255,0.1)" }} />
            <span style={{ position: "absolute", top: "3px", left: form.IsActive ? "19px" : "3px", width: "14px", height: "14px", borderRadius: "50%", transition: "0.2s", background: form.IsActive ? "#2dd4a0" : "#7d92b2" }} />
          </label>
          <span style={{ fontSize: "12.5px", color: "#7d92b2" }}>Active</span>
        </div>
        {error   && <div style={{ padding: "8px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", color: "#f87171", fontSize: "12.5px", marginBottom: "0.75rem" }}>⚠️ {error}</div>}
        {success && <div style={{ padding: "8px 12px", background: "rgba(45,212,160,0.1)",  border: "1px solid rgba(45,212,160,0.2)",  borderRadius: "8px", color: "#2dd4a0", fontSize: "12.5px", marginBottom: "0.75rem" }}>✅ {success}</div>}
        <button type="submit" disabled={isLoading} style={{
          width: "100%", padding: "10px",
          background: isLoading ? "rgba(232,197,109,0.3)" : "linear-gradient(135deg, #e8c56d, #c9963e)",
          color: "#080d1a", border: "none", borderRadius: "9px",
          fontSize: "13.5px", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          cursor: isLoading ? "not-allowed" : "pointer",
        }}>
          {isLoading ? "⏳ Saving…" : "💾 Save Changes"}
        </button>
      </form>
    </div>
  );
};

// ── Scholarship card with edit/delete ─────────────────────────
const ScholarshipCard = ({ s, canManage, onRefetch }) => {
  const [showEdit,          setShowEdit]          = useState(false);
  const [deleteConfirm,     setDeleteConfirm]     = useState(false);
  const [deleteScholarship, { isLoading: deleting }]   = useDeleteScholarshipMutation();
  const [toggleActive,      { isLoading: toggling }]   = useToggleScholarshipActiveMutation();

  const handleDelete = async () => {
    try {
      await deleteScholarship(s.scholarshipId).unwrap();
      onRefetch();
    } catch (err) {
      alert(err?.data?.message || "Failed to delete scholarship.");
    }
  };

  const handleToggle = async () => {
    try {
      await toggleActive(s.scholarshipId).unwrap();
      onRefetch();
    } catch (err) {
      alert(err?.data?.message || "Failed to toggle scholarship.");
    }
  };

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", overflow: "hidden", opacity: s.isActive ? 1 : 0.6 }}>
      {/* Main row */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 12px", background: "#0d1526",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#c2d3e8", marginBottom: "2px" }}>
            {s.scholarshipName}
          </div>
          <div style={{ fontSize: "11.5px", color: "#7d92b2" }}>
            {s.targetFieldName} · Min: {s.minEducationLevelName}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {/* Active badge — clickable for staff */}
          <span
            onClick={canManage ? handleToggle : undefined}
            title={canManage ? (s.isActive ? "Click to deactivate" : "Click to activate") : undefined}
            style={{
              padding: "2px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
              background: s.isActive ? "rgba(45,212,160,0.1)" : "rgba(255,255,255,0.05)",
              color: s.isActive ? "#2dd4a0" : "#7d92b2",
              border: `1px solid ${s.isActive ? "rgba(45,212,160,0.2)" : "rgba(255,255,255,0.06)"}`,
              cursor: canManage ? "pointer" : "default",
              transition: "all 0.15s",
            }}>
            {toggling ? "…" : s.isActive ? "Active" : "Inactive"}
          </span>

          {canManage && (
            <>
              <button
                onClick={() => { setShowEdit((v) => !v); setDeleteConfirm(false); }}
                style={{
                  padding: "3px 9px", fontSize: "11.5px", cursor: "pointer",
                  background: showEdit ? "rgba(232,197,109,0.15)" : "rgba(232,197,109,0.07)",
                  color: "#e8c56d", border: "1px solid rgba(232,197,109,0.2)",
                  borderRadius: "7px", fontFamily: "'DM Sans', sans-serif",
                }}>
                ✏️
              </button>
              <button
                onClick={() => { setDeleteConfirm((v) => !v); setShowEdit(false); }}
                style={{
                  padding: "3px 9px", fontSize: "11.5px", cursor: "pointer",
                  background: deleteConfirm ? "rgba(248,113,113,0.15)" : "rgba(248,113,113,0.07)",
                  color: "#f87171", border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: "7px", fontFamily: "'DM Sans', sans-serif",
                }}>
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirm bar */}
      {deleteConfirm && (
        <div style={{
          padding: "10px 12px", background: "rgba(248,113,113,0.06)",
          borderTop: "1px solid rgba(248,113,113,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "12.5px", color: "#f87171" }}>Delete this scholarship?</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={handleDelete} disabled={deleting} style={{
              padding: "4px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              background: "rgba(248,113,113,0.2)", color: "#f87171",
              border: "1px solid rgba(248,113,113,0.3)", borderRadius: "7px",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {deleting ? "…" : "Delete"}
            </button>
            <button onClick={() => setDeleteConfirm(false)} style={{
              padding: "4px 12px", fontSize: "12px", cursor: "pointer",
              background: "#0d1526", color: "#7d92b2",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: "7px",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {showEdit && (
        <div style={{ padding: "0 12px 12px", background: "#0d1526", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <EditScholarshipForm
            scholarship={s}
            onClose={() => setShowEdit(false)}
            onSuccess={() => { setShowEdit(false); onRefetch(); }}
          />
        </div>
      )}
    </div>
  );
};

// ── College detail panel ──────────────────────────────────────
const CollegeDetail = ({ collegeId, onClose }) => {
  const { data, isLoading, refetch } = useGetCollegeByIdQuery(collegeId);
  const [showAddScholarship, setShowAddScholarship] = useState(false);

  const isStaff        = !!localStorage.getItem("staffId");
  const staffCollegeId = Number(localStorage.getItem("staff-CollegeId"));
  const canManage      = isStaff ;
  const college = data?.data;

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", color: "#7d92b2", fontSize: "13px" }}>
      Loading…
    </div>
  );
  if (!college) return null;

  return (
    <div style={{ ...card, animation: "fadeUp 0.3s ease both" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 500, color: "#e8f0f8", margin: "0 0 4px" }}>
            {college.collegeName}
          </h3>
          {college.website && (
            <a href={college.website} target="_blank" rel="noreferrer" style={{ fontSize: "12.5px", color: "#e8c56d", textDecoration: "none" }}>
              {college.website}
            </a>
          )}
          {college.description && (
            <p style={{ fontSize: "13px", color: "#7d92b2", marginTop: "8px", lineHeight: 1.6 }}>{college.description}</p>
          )}
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#7d92b2", fontSize: "18px", cursor: "pointer", padding: "2px 6px", lineHeight: 1 }}>✕</button>
      </div>

      {/* Education levels */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#3d5580", marginBottom: "8px" }}>
          Education Levels Offered
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {college.educationScopes.map((es) => <ScopeBadge key={es.educationLevelId} name={es.levelName} />)}
        </div>
      </div>

      {/* Scholarships */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#3d5580" }}>
            Scholarships ({college.scholarships.length})
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddScholarship((v) => !v)}
              style={{
                padding: "4px 12px",
                background: showAddScholarship ? "rgba(45,212,160,0.15)" : "rgba(45,212,160,0.08)",
                color: "#2dd4a0", border: "1px solid rgba(45,212,160,0.2)",
                borderRadius: "8px", fontSize: "11.5px", fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              }}>
              {showAddScholarship ? "✕ Cancel" : "+ Add Scholarship"}
            </button>
          )}
        </div>

        {college.scholarships.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#7d92b2", fontStyle: "italic" }}>No scholarships yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {college.scholarships.map((s) => (
              <ScholarshipCard
                key={s.scholarshipId}
                s={s}
                canManage={canManage}
                onRefetch={refetch}
              />
            ))}
          </div>
        )}

        {showAddScholarship && (
          <AddScholarshipForm
            collegeId={collegeId}
            onClose={() => setShowAddScholarship(false)}
            onSuccess={() => refetch()}
          />
        )}
      </div>
    </div>
  );
};

// ── Create college modal ──────────────────────────────────────
const CreateCollegeForm = ({ onClose }) => {
  const { data: educationData } = useGetAllEducationLevelsQuery();
  const [createCollege, { isLoading }] = useCreateCollegeMutation();
  const [form, setForm] = useState({ CollegeName: "", Description: "", Website: "" });
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const toggleLevel = (id) =>
    setSelectedLevels((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (selectedLevels.length === 0) { setError("Select at least one education level."); return; }
    try {
      await createCollege({
        CollegeName: form.CollegeName,
        Description: form.Description || null,
        Website: form.Website || null,
        EducationLevelIds: selectedLevels,
      }).unwrap();
      setSuccess("College created successfully!");
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err?.data?.message || "Failed to create college.");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
      <div style={{ background: "#121e35", border: "1px solid rgba(232,197,109,0.2)", borderRadius: "20px", padding: "1.75rem", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", animation: "fadeUp 0.3s ease both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "17px", fontWeight: 500, color: "#e8f0f8", margin: 0 }}>Add College</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#7d92b2", fontSize: "18px", cursor: "pointer" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {[
            { label: "College Name *", key: "CollegeName", type: "text", placeholder: "e.g., MIT", required: true },
            { label: "Website", key: "Website", type: "url", placeholder: "https://..." },
          ].map(({ label, key, type, placeholder, required }) => (
            <div key={key} style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>{label}</label>
              <input type={type} value={form[key]} required={required} placeholder={placeholder}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.Description}
              onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
              placeholder="Brief description" rows={2}
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={labelStyle}>Education Levels Offered *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {educationData?.data?.map((el) => {
                const checked = selectedLevels.includes(el.educationLevelId);
                return (
                  <label key={el.educationLevelId} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "5px 12px",
                    background: checked ? "rgba(232,197,109,0.1)" : "#0d1526",
                    border: `1px solid ${checked ? "rgba(232,197,109,0.3)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: "99px", cursor: "pointer", fontSize: "12.5px",
                    color: checked ? "#e8c56d" : "#a0b4d0", transition: "all 0.15s",
                  }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleLevel(el.educationLevelId)} style={{ display: "none" }} />
                    {checked ? "✓ " : ""}{el.levelName}
                  </label>
                );
              })}
            </div>
          </div>
          {error   && <div style={{ padding: "9px 13px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "9px", color: "#f87171", fontSize: "13px", marginBottom: "1rem" }}>⚠️ {error}</div>}
          {success && <div style={{ padding: "9px 13px", background: "rgba(45,212,160,0.1)",  border: "1px solid rgba(45,212,160,0.2)",  borderRadius: "9px", color: "#2dd4a0", fontSize: "13px", marginBottom: "1rem" }}>✅ {success}</div>}
          <button type="submit" disabled={isLoading} style={{
            width: "100%", padding: "11px",
            background: isLoading ? "rgba(232,197,109,0.4)" : "linear-gradient(135deg, #e8c56d, #c9963e)",
            color: "#080d1a", border: "none", borderRadius: "10px",
            fontSize: "14px", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}>
            {isLoading ? "⏳ Creating…" : "✨ Create College"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────
export const CollegesPage = () => {
  const { data: collegesData, isLoading, error } = useGetAllCollegesQuery();
  const [deleteCollege] = useDeleteCollegeMutation();
  const [selectedId,    setSelectedId]    = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const isStaff = !!localStorage.getItem("staffId");

  const handleDelete = async (id) => {
    try {
      await deleteCollege(id).unwrap();
      if (selectedId === id) setSelectedId(null);
      setDeleteConfirm(null);
    } catch (err) {
      alert(err?.data?.message || "Failed to delete college.");
    }
  };

  if (isLoading) return <><Navbar /><div style={{ textAlign: "center", padding: "4rem", color: "#7d92b2", fontSize: "13px" }}>Loading colleges…</div></>;
  if (error)     return <><Navbar /><div style={{ textAlign: "center", padding: "4rem", color: "#f87171", fontSize: "13px" }}>Failed to load colleges.</div></>;

  const colleges = collegesData?.data ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .college-item:hover { border-color: rgba(255,255,255,0.12) !important; }
        .college-item-selected { border-color: rgba(232,197,109,0.3) !important; background: rgba(232,197,109,0.04) !important; }
        .del-btn:hover { background: rgba(248,113,113,0.15) !important; }
        .add-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        select option { background: #0d1526; color: #c2d3e8; }
      `}</style>

      <Navbar />

      <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: "1050px", margin: "0 auto", padding: "1.5rem" }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", animation: "fadeUp 0.3s ease both" }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 500, color: "#e8f0f8", margin: "0 0 4px" }}>Colleges</h1>
            <p style={{ fontSize: "13px", color: "#7d92b2", margin: 0 }}>Browse colleges and scholarship offerings</p>
          </div>
          {isStaff && (
            <button onClick={() => setShowCreate(true)} className="add-btn" style={{
              padding: "9px 18px",
              background: "linear-gradient(135deg, #e8c56d, #c9963e)",
              color: "#080d1a", border: "none", borderRadius: "10px",
              fontSize: "13.5px", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer", boxShadow: "0 4px 16px rgba(232,197,109,0.2)",
            }}>
              + Add College
            </button>
          )}
        </div>

        {/* Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem" }}>
          {/* Left: list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {colleges.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: "2.5rem", color: "#7d92b2", fontSize: "13px", fontStyle: "italic" }}>
                No colleges yet.
              </div>
            ) : colleges.map((c, i) => (
              <div
                key={c.collegeId}
                className={`college-item${selectedId === c.collegeId ? " college-item-selected" : ""}`}
                onClick={() => setSelectedId(c.collegeId === selectedId ? null : c.collegeId)}
                style={{
                  background: "#121e35", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px", padding: "11px 13px", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  gap: "10px", transition: "border-color 0.15s, background 0.15s",
                  animation: `fadeUp 0.3s ${i * 0.05}s ease both`,
                }}
              >
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: "rgba(232,197,109,0.12)", color: "#e8c56d",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Fraunces', serif", fontSize: "16px", fontWeight: 500, flexShrink: 0,
                  }}>
                    {c.collegeName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 500, color: "#c2d3e8", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.collegeName}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#7d92b2", marginBottom: "5px" }}>
                      {c.totalScholarships} scholarship{c.totalScholarships !== 1 ? "s" : ""} · {c.educationScopes.length} level{c.educationScopes.length !== 1 ? "s" : ""}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {c.educationScopes.map((es) => <ScopeBadge key={es.educationLevelId} name={es.levelName} />)}
                    </div>
                  </div>
                </div>
                {isStaff && (
                  <button
                    className="del-btn"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c.collegeId); }}
                    style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "7px", padding: "3px 9px", fontSize: "11.5px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Right: detail */}
          <div>
            {selectedId ? (
              <CollegeDetail collegeId={selectedId} onClose={() => setSelectedId(null)} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center" }}>
                <span style={{ fontSize: "3rem", opacity: 0.4, marginBottom: "1rem" }}>🏫</span>
                <p style={{ fontSize: "13px", color: "#3d5580" }}>Select a college to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete college confirm */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div style={{ background: "#121e35", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "18px", padding: "1.75rem", maxWidth: "380px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "17px", fontWeight: 500, color: "#e8f0f8", margin: "0 0 0.75rem" }}>Delete College</h3>
            <p style={{ fontSize: "13px", color: "#7d92b2", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
              This will permanently delete the college and all associated scholarships. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: "9px", background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "9px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Delete
              </button>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "9px", background: "#0d1526", color: "#a0b4d0", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "9px", fontSize: "13.5px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <CreateCollegeForm onClose={() => setShowCreate(false)} />}
    </>
  );
};

export default CollegesPage;