// MainRoutes.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// layout import removed (unused)
import LoginPage from "../Pages/Login-SignUp/Login";
import Signup from "../Pages/Login-SignUp/Signup";
import StaffLogin from "../Pages/StaffLogin";

// Student Protected Pages
import Dashboard from "../Pages/Dashboard";
import StudentDashboard from "../Pages/StudentForm";
import { ScholarshipForm } from "../Pages/ScholarshipForm";
import { RecommendationList } from "../Pages/RecommendationList";

// Other existing pages
// removed unused page imports: Landing, HotPolls, PollDetails, SearchPolls, AddPoll, UserPolls
import BusJourneyPlanner from "../Pages/AllPolls/Test";
import HackDrive3D from "../Pages/HackDrive3D";
import PaymentSuccess from "../Pages/PaymentSuccess";
import PaymentFailure from "../Pages/PaymentFailure";

// ====================== ROUTE GUARDS ======================

const ProtectedStudentRoute = ({ children }) => {
  const userId = localStorage.getItem("userId");
  if (!userId) return <Navigate to="/login" replace />;
  return children;
};

// ProtectedStaffRoute removed (unused in this file)

const PublicStudentRoute = ({ children }) => {
  const userId  = localStorage.getItem("userId");
  const staffId = localStorage.getItem("staffId");
  if (userId)  return <Navigate to="/" replace />;
  if (staffId) return <Navigate to="/college" replace />;
  return children;
};

const PublicStaffRoute = ({ children }) => {
  const staffId = localStorage.getItem("staffId");
  const userId  = localStorage.getItem("userId");
  if (staffId) return <Navigate to="/college" replace />;
  if (userId)  return <Navigate to="/" replace />;
  return children;
};

// ====================== MAIN ROUTES ======================
export const MainRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* ── Auth ── */}
        <Route path="/login" element={<PublicStudentRoute><LoginPage /></PublicStudentRoute>} />
        <Route path="/staff" element={<PublicStaffRoute><StaffLogin /></PublicStaffRoute>} />
        <Route path="/signup" element={<PublicStudentRoute><Signup /></PublicStudentRoute>} />

        {/* ── Protected dashboard ── */}
        <Route path="/" element={<ProtectedStudentRoute><Dashboard /></ProtectedStudentRoute>}>
          <Route index element={<Navigate to="students" replace />} />
          <Route path="students"        element={<StudentDashboard />} />
          <Route path="scholarships"    element={<ScholarshipForm />} />
          <Route path="recommendations" element={<RecommendationList />} />
        </Route>

        {/* ── Other public ── */}
        <Route path="/bus" element={<BusJourneyPlanner />} />
        <Route path="/car" element={<HackDrive3D />} />

        {/* ── Payment ─────────────────────────────────────────────────
            eSewa appends ?data=BASE64 to whatever SuccessUrl you give it.
            If SuccessUrl already contains ?provider=esewa the redirect becomes
              ?provider=esewa?data=...   ← double ?, params.get("data") === null
            Fix: put the provider in the PATH so eSewa only adds ?data=BASE64.
            Khalti does the same with ReturnUrl → ?pidx=...
        ── */}
        <Route path="/payment/success/esewa"  element={<PaymentSuccess />} />
        <Route path="/payment/success/khalti" element={<PaymentSuccess />} />
        {/* fallback in case something links to the old URL */}
        <Route path="/payment/success"        element={<PaymentSuccess />} />
        <Route path="/payment/failure"        element={<PaymentFailure />} />

        {/* Catch-all */}
        {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
      </Routes>
    </Router>
  );
};

export default MainRoutes;