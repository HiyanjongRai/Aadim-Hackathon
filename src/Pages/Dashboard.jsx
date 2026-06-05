// Dashboard.jsx
import { useNavigate, Outlet, NavLink } from "react-router-dom";

const S = {
  root: {
    minHeight: "100vh",
    background: "#080d1a",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#0d1526",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "0 1.75rem",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(8px)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoMark: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #e8c56d, #c9963e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Fraunces', serif",
    fontSize: "16px",
    fontWeight: 500,
    color: "#e8f0f8",
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: "11px",
    color: "#7d92b2",
    marginTop: "1px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  userWrap: {
    textAlign: "right",
  },
  userName: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#c2d3e8",
    display: "block",
  },
  userRole: {
    fontSize: "11px",
    color: "#7d92b2",
    display: "block",
  },
  logoutBtn: {
    background: "rgba(248,113,113,0.08)",
    color: "#f87171",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "12.5px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  },
  body: {
    display: "flex",
    flex: 1,
  },
  sidebar: {
    width: "220px",
    flexShrink: 0,
    background: "#0d1526",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    padding: "1.5rem 0.875rem",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  sectionLabel: {
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#3d5580",
    padding: "0 0.625rem",
    marginBottom: "6px",
    marginTop: "4px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "8px 10px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#7d92b2",
    textDecoration: "none",
    transition: "background 0.15s, color 0.15s",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    width: "100%",
    fontFamily: "'DM Sans', sans-serif",
  },
  navLinkActive: {
    background: "rgba(232,197,109,0.1)",
    color: "#e8c56d",
    border: "1px solid rgba(232,197,109,0.15)",
  },
  navLinkHover: {
    background: "rgba(255,255,255,0.04)",
    color: "#c2d3e8",
  },
  staffNavActive: {
    background: "rgba(45,212,160,0.1)",
    color: "#2dd4a0",
    border: "1px solid rgba(45,212,160,0.15)",
  },
  content: {
    flex: 1,
    padding: "2rem 1.75rem",
    overflowY: "auto",
  },
  collegeBadge: {
    margin: "0.875rem 0.625rem 0",
    padding: "10px 10px",
    background: "rgba(45,212,160,0.06)",
    border: "1px solid rgba(45,212,160,0.15)",
    borderRadius: "10px",
  },
  collegeBadgeLabel: {
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "#2dd4a0",
    fontWeight: 600,
  },
  collegeBadgeName: {
    fontSize: "12.5px",
    color: "#a0b4d0",
    marginTop: "2px",
    fontWeight: 500,
  },
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const studentName  = localStorage.getItem("user-Name");
  const studentId    = localStorage.getItem("userId");
  const staffName    = localStorage.getItem("staff-Name");
  const staffId      = localStorage.getItem("staffId");
  const staffCollege = localStorage.getItem("staff-CollegeName");
  const isStaff      = !!staffId;
  const isStudent    = !!studentId;

  const handleLogout = () => {
    ["authToken","user-Name","userId","staffId","staff-Name","staff-CollegeId","staff-CollegeName"].forEach(
      (k) => localStorage.removeItem(k)
    );
    navigate("/login");
  };

  const activeStyle = isStaff ? S.staffNavActive : S.navLinkActive;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        .dash-nav-link:hover { background: rgba(255,255,255,0.04) !important; color: #c2d3e8 !important; }
        .dash-logout:hover { background: rgba(248,113,113,0.15) !important; }
        @media (max-width: 700px) {
          .dash-sidebar { display: none !important; }
          .dash-content { padding: 1.25rem !important; }
        }
      `}</style>
      <div style={S.root}>
        {/* ── Header ── */}
        <header style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.logoMark}>🎓</div>
            <div>
              <div style={S.logoText}>ScholarPath</div>
              <div style={S.logoSub}>
                {isStaff ? `${staffCollege} · Staff` : "Student Portal"}
              </div>
            </div>
          </div>
          <div style={S.headerRight}>
            <div style={S.userWrap}>
              <span style={S.userName}>{isStaff ? staffName : studentName || "User"}</span>
              <span style={S.userRole}>
                {isStaff ? "🏫 College Staff" : "👤 Student"}
              </span>
            </div>
            <button onClick={handleLogout} style={S.logoutBtn} className="dash-logout">
              Logout
            </button>
          </div>
        </header>

        <div style={S.body}>
          {/* ── Sidebar ── */}
          <nav style={S.sidebar} className="dash-sidebar">
            {isStudent && (
              <>
                <div style={S.sectionLabel}>Student</div>
                <NavLink
                  to="/dashboard/profile"
                  style={({ isActive }) => ({
                    ...S.navLink,
                    ...(isActive ? activeStyle : {}),
                  })}
                  className="dash-nav-link"
                >
                  <span>👤</span> My Profile
                </NavLink>
                <NavLink
                  to="/recommendations"
                  style={({ isActive }) => ({
                    ...S.navLink,
                    ...(isActive ? activeStyle : {}),
                  })}
                  className="dash-nav-link"
                >
                  <span>🏆</span> Recommendations
                </NavLink>

                <NavLink
                  to="/college"
                  style={({ isActive }) => ({
                    ...S.navLink,
                    ...(isActive ? activeStyle : {}),
                  })}
                  className="dash-nav-link"
                >
                  <span>🏆</span> Colleges
                </NavLink>
              </>
            )}

            {isStaff && (
              <>
                <div style={S.sectionLabel}>Scholarships</div>
                <NavLink
                  to="/dashboard/scholarships/add"
                  style={({ isActive }) => ({
                    ...S.navLink,
                    ...(isActive ? activeStyle : {}),
                  })}
                  className="dash-nav-link"
                >
                  <span>➕</span> Add Scholarship
                </NavLink>
                <NavLink
                  to="/dashboard/scholarships"
                  style={({ isActive }) => ({
                    ...S.navLink,
                    ...(isActive ? activeStyle : {}),
                  })}
                  className="dash-nav-link"
                >
                  <span>📋</span> Manage Scholarships
                </NavLink>
                <div style={{ ...S.sectionLabel, marginTop: "1rem" }}>College</div>
                <NavLink
                  to="/dashboard/college"
                  style={({ isActive }) => ({
                    ...S.navLink,
                    ...(isActive ? activeStyle : {}),
                  })}
                  className="dash-nav-link"
                >
                  <span>🏫</span> College Profile
                </NavLink>
                <NavLink
                  to="/dashboard/colleges"
                  style={({ isActive }) => ({
                    ...S.navLink,
                    ...(isActive ? activeStyle : {}),
                  })}
                  className="dash-nav-link"
                >
                  <span>🏛️</span> All Colleges
                </NavLink>

                {staffCollege && (
                  <div style={S.collegeBadge}>
                    <div style={S.collegeBadgeLabel}>Your College</div>
                    <div style={S.collegeBadgeName}>{staffCollege}</div>
                  </div>
                )}
              </>
            )}

            {!isStudent && !isStaff && (
              <button
                onClick={() => navigate("/login")}
                style={S.navLink}
                className="dash-nav-link"
              >
                🔑 Login
              </button>
            )}
          </nav>

          {/* ── Content ── */}
          <main style={S.content} className="dash-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;