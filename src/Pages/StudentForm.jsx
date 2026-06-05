import { useState, useRef } from "react";
import {
  useGetStudentByIdQuery,
  useUpdateStudentProfileMutation,
  useSetCurrentEducationMutation,
  useUploadCvMutation,
  useGetAllFieldsQuery,
  useGetAllEducationLevelsQuery,
  useResetProfileMutation,
} from "../Redux/Slices/ScholarshipApiSlice.ts";
import "./style.css";

export const StudentDashboard = () => {
  const studentId = parseInt(localStorage.getItem("userId") || "0");

  const { data: studentData, isLoading, refetch } = useGetStudentByIdQuery(studentId, { skip: !studentId });
  const { data: fieldsData }  = useGetAllFieldsQuery();
  const { data: levelsData }  = useGetAllEducationLevelsQuery();

  const [updateProfile, { isLoading: saving }]        = useUpdateStudentProfileMutation();
  const [setCurrentEdu, { isLoading: switchingEdu }]  = useSetCurrentEducationMutation();
  const [uploadCv,      { isLoading: uploadingCv }]   = useUploadCvMutation();
  const [resetProfile,  { isLoading: resetting }]     = useResetProfileMutation();

  const student = studentData?.data;
  const fields  = fieldsData?.data  ?? [];
  const levels  = levelsData?.data  ?? [];

  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState(null);
  const [msg, setMsg]                 = useState({ type: "", text: "" });
  const [cvTab, setCvTab]             = useState(false);
  const [cvResult, setCvResult]       = useState(null);
  const [cvApplied, setCvApplied]     = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);   // ← reset confirm state
  const fileInputRef                  = useRef(null);

  const notify = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const startEdit = () => {
    setForm({
      FamilyIncome: student.familyIncome ?? 0,
      Trainings: student.trainings.map((t) => ({
        fieldId:            t.fieldId,
        experienceYears:    t.experienceYears,
        trainingsCompleted: t.trainingsCompleted,
        notes:              t.notes || "",
      })),
      Educations: student.educations.map((e) => ({
        educationLevelId: e.educationLevelId,
        fieldId:          e.fieldId ?? "",
        gpa:              e.gpa ?? 0,
        institutionName:  e.institutionName || "",
        major:            e.major || "",
        graduationYear:   e.graduationYear || "",
        isCurrent:        e.isCurrent,
      })),
    });
    setEditing(true);
  };

  // ── training helpers ─────────────────────────────────────
  const addTraining = () =>
    setForm((p) => ({
      ...p,
      Trainings: [...p.Trainings, { fieldId: "", experienceYears: 0, trainingsCompleted: 0, notes: "" }],
    }));

  const removeTraining = (i) =>
    setForm((p) => ({ ...p, Trainings: p.Trainings.filter((_, idx) => idx !== i) }));

  const updateTraining = (i, key, val) =>
    setForm((p) => {
      const t = [...p.Trainings];
      t[i] = { ...t[i], [key]: val };
      return { ...p, Trainings: t };
    });

  // ── education helpers ────────────────────────────────────
  const addEducation = () =>
    setForm((p) => ({
      ...p,
      Educations: [
        ...p.Educations.map((e) => ({ ...e, isCurrent: false })),
        { educationLevelId: "", fieldId: "", gpa: 0, institutionName: "", major: "", graduationYear: "", isCurrent: true },
      ],
    }));

  const removeEducation = (i) => {
    setForm((p) => {
      let eds = p.Educations.filter((_, idx) => idx !== i);
      if (!eds.some((e) => e.isCurrent) && eds.length > 0)
        eds[eds.length - 1].isCurrent = true;
      return { ...p, Educations: eds };
    });
  };

  const updateEducation = (i, key, val) =>
    setForm((p) => {
      let eds = [...p.Educations];
      if (key === "isCurrent" && val)
        eds = eds.map((e, idx) => ({ ...e, isCurrent: idx === i }));
      else
        eds[i] = { ...eds[i], [key]: val };
      return { ...p, Educations: eds };
    });

  // ── save ─────────────────────────────────────────────────
  const saveProfile = async () => {
    try {
      await updateProfile({
        id: studentId,
        data: {
          FamilyIncome: parseFloat(form.FamilyIncome) || 0,
          Trainings: form.Trainings.map((t) => ({
            fieldId:            parseInt(t.fieldId),
            experienceYears:    parseInt(t.experienceYears),
            trainingsCompleted: parseInt(t.trainingsCompleted),
            notes:              t.notes || null,
          })),
          Educations: form.Educations.map((e) => ({
            educationLevelId: parseInt(e.educationLevelId),
            fieldId:          e.fieldId ? parseInt(e.fieldId) : null,
            gpa:              parseFloat(e.gpa) || 0,
            institutionName:  e.institutionName || null,
            major:            e.major || null,
            graduationYear:   e.graduationYear ? parseInt(e.graduationYear) : null,
            isCurrent:        e.isCurrent,
          })),
        },
      }).unwrap();
      notify("success", "Profile saved successfully!");
      setEditing(false);
      refetch();
    } catch (err) {
      notify("error", err?.data?.message || "Save failed.");
    }
  };

  // ── reset ─────────────────────────────────────────────────
  const handleReset = async () => {
    try {
      await resetProfile(studentId).unwrap();
      notify("success", "Profile reset. Only your name, email, gender and age remain.");
      setConfirmReset(false);
      setEditing(false);
      refetch();
    } catch {
      notify("error", "Reset failed. Please try again.");
    }
  };

  // ── set current degree ────────────────────────────────────
  const switchCurrent = async (educationId) => {
    try {
      await setCurrentEdu({ studentId, educationId }).unwrap();
      notify("success", "Current degree updated.");
      refetch();
    } catch {
      notify("error", "Could not update current degree.");
    }
  };

  // ── CV upload ─────────────────────────────────────────────
  const handleCvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadCv({ studentId, file }).unwrap();
      setCvResult(res.data);
      setCvApplied(false);
      notify("success", "CV parsed! Review suggestions below.");
    } catch (err) {
      notify("error", err?.data?.message || "CV upload failed.");
    }
  };

  const applyCvSuggestions = () => {
    if (!cvResult) return;
    startEdit();
    setForm((p) => ({
      ...p,
      Trainings: cvResult.suggestedTrainings?.length
        ? cvResult.suggestedTrainings.map((t) => ({
            fieldId:            t.fieldId,
            experienceYears:    t.experienceYears,
            trainingsCompleted: t.trainingsCompleted,
            notes:              t.notes || "",
          }))
        : p.Trainings,
      Educations: cvResult.suggestedEducations?.length
        ? cvResult.suggestedEducations.map((e) => ({
            educationLevelId: e.educationLevelId,
            fieldId:          e.fieldId ?? "",
            gpa:              cvResult.extractedGPA ?? e.gpa ?? 0,
            institutionName:  e.institutionName || "",
            major:            e.major || "",
            graduationYear:   e.graduationYear || "",
            isCurrent:        e.isCurrent,
          }))
        : p.Educations,
    }));
    setCvApplied(true);
    notify("success", "Suggestions applied — review and save.");
  };

  if (isLoading) return <div className="loading">Loading your profile…</div>;
  if (!student)  return <div className="error-msg">Student not found.</div>;

  return (
    <div className="student-dashboard">

      {/* Status message */}
      {msg.text && (
        <div className={`alert alert-${msg.type}`}>
          {msg.type === "success" ? "✅" : "⚠️"} {msg.text}
        </div>
      )}

      {/* ── Reset confirmation modal ── */}
      {confirmReset && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>⚠️ Reset Profile?</h3>
            <p>
              This will permanently delete all your trainings, education records,
              and financial info. Only your <strong>name, email, gender and age</strong> will remain.
            </p>
            <div className="modal-actions">
              <button onClick={handleReset} disabled={resetting} className="btn btn-danger">
                {resetting ? "⏳ Resetting…" : "Yes, Reset Everything"}
              </button>
              <button onClick={() => setConfirmReset(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ HEADER CARD ══════════ */}
      <div className="profile-header-card">
        <div className="profile-avatar">
          {student.fullName?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{student.fullName}</h2>
          <p>{student.email} · {student.gender || "—"} · Age {student.age}</p>
          <p className="profile-meta">
            Member since {new Date(student.createdDate).toLocaleDateString()}
          </p>
        </div>
        <div className="profile-actions">
          {!editing ? (
            <>
              <button onClick={startEdit} className="btn btn-primary">✏️ Edit Profile</button>
              <button onClick={() => setCvTab(!cvTab)} className="btn btn-secondary">
                📄 {cvTab ? "Hide CV Upload" : "Upload CV"}
              </button>
              <button onClick={() => setConfirmReset(true)} className="btn btn-danger">
                🗑️ Reset Profile
              </button>
            </>
          ) : (
            <>
              <button onClick={saveProfile} disabled={saving} className="btn btn-success">
                {saving ? "⏳ Saving…" : "💾 Save"}
              </button>
              <button onClick={() => setEditing(false)} className="btn btn-ghost">Cancel</button>
            </>
          )}
        </div>
      </div>

      {/* ══════════ CV UPLOAD PANEL ══════════ */}
      {cvTab && (
        <div className="card cv-panel">
          <h3 className="card-title">📄 Upload Your CV</h3>
          <p className="card-subtitle">
            We'll extract your education, fields, and experience automatically.
            Review before saving.
          </p>

          <div className="cv-upload-area" onClick={() => fileInputRef.current?.click()}>
            <span className="cv-upload-icon">📂</span>
            <p>Click to select a <strong>.pdf</strong> or <strong>.txt</strong> file</p>
            <input
              ref={fileInputRef} type="file" accept=".pdf,.txt"
              onChange={handleCvUpload} style={{ display: "none" }}
            />
          </div>

          {uploadingCv && <p className="loading-text">⏳ Parsing your CV…</p>}

          {cvResult && (
            <div className="cv-results">
              <h4>Parsed Suggestions</h4>

              {/* GPA — show 0.00 as a valid value, only hide if truly absent */}
              {cvResult.extractedGPA != null && (
                <p>📊 GPA detected: <strong>{Number(cvResult.extractedGPA).toFixed(2)}</strong></p>
              )}

              {cvResult.suggestedEducations?.length > 0 && (
                <>
                  <h5>🎓 Education</h5>
                  <ul>
                    {cvResult.suggestedEducations.map((e, i) => (
                      <li key={i}>
                        {levels.find((l) => l.educationLevelId === e.educationLevelId)?.levelName || `Level ${e.educationLevelId}`}
                        {e.institutionName && ` — ${e.institutionName}`}
                        {e.major          && `, ${e.major}`}
                        {e.graduationYear && ` (${e.graduationYear})`}
                        {e.isCurrent && <span className="badge-current"> ✓ current</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {cvResult.suggestedTrainings?.length > 0 && (
                <>
                  <h5>💼 Training / Experience</h5>
                  <ul>
                    {cvResult.suggestedTrainings.map((t, i) => (
                      <li key={i}>
                        {fields.find((f) => f.fieldId === t.fieldId)?.fieldName || `Field ${t.fieldId}`}
                        {` — ${t.experienceYears} yrs, ${t.trainingsCompleted} trainings`}
                        {t.notes && ` (${t.notes})`}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="cv-raw-preview">
                <h5>Raw CV Text (preview)</h5>
                <pre>{cvResult.rawPreview}</pre>
              </div>

              {!cvApplied ? (
                <button onClick={applyCvSuggestions} className="btn btn-primary">
                  ✅ Apply Suggestions to Profile
                </button>
              ) : (
                <p className="success-note">✅ Applied — scroll down to review and save.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════ VIEW MODE ══════════ */}
      {!editing && (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-value">{student.totalExperienceYears ?? "—"}</span>
              <span className="stat-label">Experience Years</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{student.totalTrainingsCompleted ?? "—"}</span>
              <span className="stat-label">Trainings</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {student.familyIncome != null ? `$${student.familyIncome.toLocaleString()}` : "—"}
              </span>
              <span className="stat-label">Family Income</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{student.highestEducationLevel ?? "—"}</span>
              <span className="stat-label">Highest Education</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">💼 Training & Experience</h3>
            {student.trainings.length === 0
              ? <p className="empty-note">No training records yet. Edit your profile to add them.</p>
              : student.trainings.map((t) => (
                <div key={t.studentTrainingId} className="list-row">
                  <div>
                    <strong>{t.fieldName}</strong>
                    <span className="meta-tag">{t.experienceYears} yrs</span>
                    <span className="meta-tag">{t.trainingsCompleted} trainings</span>
                  </div>
                  {t.notes && <p className="notes-text">{t.notes}</p>}
                </div>
              ))
            }
          </div>

          <div className="card">
            <h3 className="card-title">🎓 Education History</h3>
            {student.educations.length === 0
              ? <p className="empty-note">No education records yet.</p>
              : student.educations.map((e) => (
                <div key={e.studentEducationId} className={`list-row ${e.isCurrent ? "row-current" : ""}`}>
                  <div>
                    <strong>{e.levelName}</strong>
                    {e.institutionName && <span className="meta-text"> · {e.institutionName}</span>}
                    {e.major          && <span className="meta-text"> · {e.major}</span>}
                    {e.graduationYear && <span className="meta-text"> ({e.graduationYear})</span>}
                    {e.gpa > 0        && <span className="meta-tag">GPA {e.gpa.toFixed(2)}</span>}
                    {e.isCurrent      && <span className="badge-current">✓ Current</span>}
                  </div>
                  {!e.isCurrent && (
                    <button
                      onClick={() => switchCurrent(e.studentEducationId)}
                      disabled={switchingEdu}
                      className="btn btn-xs btn-ghost"
                    >
                      Set as Current
                    </button>
                  )}
                </div>
              ))
            }
          </div>
        </>
      )}

      {/* ══════════ EDIT MODE ══════════ */}
      {editing && form && (
        <div className="edit-form">

          {/* Income */}
          <div className="card">
            <h3 className="card-title">💰 Financial Info</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Family Income ($)</label>
                <input type="number" min="0"
                  value={form.FamilyIncome}
                  onChange={(e) => setForm((p) => ({ ...p, FamilyIncome: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Trainings */}
          <div className="card">
            <div className="card-header-row">
              <h3 className="card-title">💼 Training & Experience</h3>
              <button onClick={addTraining} className="btn btn-sm btn-secondary">+ Add Field</button>
            </div>
            {form.Trainings.map((t, i) => (
              <div key={i} className="edit-row">
                <div className="form-group">
                  <label className="form-label">Field of Study</label>
                  <select value={t.fieldId}
                    onChange={(e) => updateTraining(i, "fieldId", e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Field</option>
                    {fields.map((f) => (
                      <option key={f.fieldId} value={f.fieldId}>{f.fieldName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group form-group-sm">
                  <label className="form-label">Exp. Years</label>
                  <input type="number" min="0" value={t.experienceYears}
                    onChange={(e) => updateTraining(i, "experienceYears", e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group form-group-sm">
                  <label className="form-label">Trainings</label>
                  <input type="number" min="0" value={t.trainingsCompleted}
                    onChange={(e) => updateTraining(i, "trainingsCompleted", e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group form-group-grow">
                  <label className="form-label">Notes</label>
                  <input type="text" value={t.notes}
                    onChange={(e) => updateTraining(i, "notes", e.target.value)}
                    placeholder="Optional"
                    className="form-input"
                  />
                </div>
                <button onClick={() => removeTraining(i)} className="btn btn-danger btn-sm remove-btn">✕</button>
              </div>
            ))}
          </div>

          {/* Educations */}
          <div className="card">
            <div className="card-header-row">
              <h3 className="card-title">🎓 Education History</h3>
              <button onClick={addEducation} className="btn btn-sm btn-secondary">+ Add Degree</button>
            </div>
            {form.Educations.map((e, i) => (
              <div key={i} className={`edit-row ${e.isCurrent ? "row-current" : ""}`}>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select value={e.educationLevelId}
                    onChange={(ev) => updateEducation(i, "educationLevelId", ev.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Level</option>
                    {levels.map((l) => (
                      <option key={l.educationLevelId} value={l.educationLevelId}>{l.levelName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Institution</label>
                  <input type="text" value={e.institutionName}
                    onChange={(ev) => updateEducation(i, "institutionName", ev.target.value)}
                    placeholder="University name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Major</label>
                  <select value={e.major}
                    onChange={(ev) => updateEducation(i, "major", ev.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Major</option>
                    {fields.map((f) => (
                      <option key={f.fieldId} value={f.fieldName}>{f.fieldName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group form-group-sm">
                  <label className="form-label">GPA</label>
                  <input type="number" step="0.01" min="0" max="4"
                    value={e.gpa}
                    onChange={(ev) => updateEducation(i, "gpa", ev.target.value)}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group form-group-sm">
                  <label className="form-label">Grad Year</label>
                  <input type="number" min="1990" max="2100" value={e.graduationYear}
                    onChange={(ev) => updateEducation(i, "graduationYear", ev.target.value)}
                    placeholder="2024"
                    className="form-input"
                  />
                </div>
                <div className="form-group form-group-sm current-toggle">
                  <label className="form-label">Current?</label>
                  <input type="radio" name="currentEdu"
                    checked={e.isCurrent}
                    onChange={() => updateEducation(i, "isCurrent", true)}
                  />
                </div>
                <button onClick={() => removeEducation(i)} className="btn btn-danger btn-sm remove-btn">✕</button>
              </div>
            ))}
            <p className="hint-text">🔘 Select the radio button next to your active/current degree.</p>
          </div>

          <div className="save-bar">
            <button onClick={saveProfile} disabled={saving} className="btn btn-success btn-lg">
              {saving ? "⏳ Saving…" : "💾 Save Profile"}
            </button>
            <button onClick={() => setEditing(false)} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;