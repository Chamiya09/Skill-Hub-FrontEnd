import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { PublicRoute } from "./components/common/PublicRoute";
import { CandidateLayout } from "./components/layout/CandidateLayout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { FindJobs } from "./pages/FindJobs";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { CandidateLogin } from "./pages/CandidateLogin";
import { CandidateRegister } from "./pages/CandidateRegister";
import { CandidateProfile } from "./pages/CandidateProfile";
import { CandidateApplications } from "./pages/CandidateApplications";
import { CandidateSavedJobs } from "./pages/CandidateSavedJobs";
import { CandidateSecurity } from "./pages/CandidateSecurity";
import { Dashboard } from "./pages/Dashboard";
import { JobVacancies } from "./pages/JobVacancies";
import { EditJob } from "./pages/EditJob";
import { CreateJob } from "./pages/CreateJob";
import { UserManagement } from "./pages/UserManagement";
import { JobDetailsPublic } from "./pages/JobDetailsPublic";
import { PublicCompanyProfile } from "./pages/PublicCompanyProfile";
import { CandidateExam } from "./pages/CandidateExam";
import { CandidateAssessments } from "./pages/CandidateAssessments";

import "./App.css";

function AppContent() {
  const location = useLocation();
  const isDashboardOrAuth =
    location.pathname === "/company-login" ||
    location.pathname === "/company-register" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/candidate-login" ||
    location.pathname === "/candidate/login" ||
    location.pathname === "/candidate-register" ||
    location.pathname === "/candidate/register" ||
    location.pathname.startsWith("/candidate") ||
    location.pathname === "/candidate-profile" ||
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/pipelines") ||
    location.pathname.startsWith("/hiring-pipeline") ||
    location.pathname.startsWith("/assessments") ||
    location.pathname.startsWith("/exam") ||
    location.pathname.startsWith("/vacancies") ||
    location.pathname.startsWith("/users") ||
    location.pathname.startsWith("/team") ||
    location.pathname === "/company-settings" ||
    location.pathname.startsWith("/company/settings") ||
    location.pathname === "/company-security" ||
    location.pathname.startsWith("/company/security") ||
    location.pathname === "/security";

  return (
    <div className={`page-container ${isDashboardOrAuth ? "dashboard-view-mode auth-full-screen" : ""}`}>
      <div className={`content-wrapper ${isDashboardOrAuth ? "dashboard-wrapper-full auth-wrapper-full" : ""}`}>
        {!isDashboardOrAuth && <Header />}
        <main className={`main-content ${isDashboardOrAuth ? "dashboard-main-full auth-main-full" : ""}`}>
          <Routes>
            {/* Public General Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/jobs" element={<FindJobs />} />
            <Route path="/jobs/:id" element={<JobDetailsPublic />} />
            <Route path="/job/:id" element={<JobDetailsPublic />} />
            <Route path="/company/:id" element={<PublicCompanyProfile />} />
            <Route path="/company/profile/:id" element={<PublicCompanyProfile />} />
            <Route path="/companies/:id" element={<PublicCompanyProfile />} />

            {/* Candidate Public Auth Routes */}
            <Route
              path="/candidate-login"
              element={
                <PublicRoute>
                  <CandidateLogin />
                </PublicRoute>
              }
            />
            <Route
              path="/candidate/login"
              element={
                <PublicRoute>
                  <CandidateLogin />
                </PublicRoute>
              }
            />
            <Route
              path="/candidate-register"
              element={
                <PublicRoute>
                  <CandidateRegister />
                </PublicRoute>
              }
            />
            <Route
              path="/candidate/register"
              element={
                <PublicRoute>
                  <CandidateRegister />
                </PublicRoute>
              }
            />

            {/* Candidate Portal Layout & Nested Protected Routes */}
            <Route
              path="/candidate"
              element={
                <ProtectedRoute allowedRoles={['Candidate']} redirectPath="/dashboard">
                  <CandidateLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/jobs" replace />} />
              <Route path="dashboard" element={<Navigate to="/jobs" replace />} />
              <Route path="profile" element={<CandidateProfile />} />
              <Route path="recommended" element={<Navigate to="/jobs" replace />} />
              <Route path="applications" element={<CandidateApplications />} />
              <Route path="saved" element={<CandidateSavedJobs />} />
              <Route path="assessments" element={<CandidateAssessments />} />
              <Route path="settings" element={<CandidateSecurity />} />
              <Route path="security" element={<CandidateSecurity />} />
            </Route>
            
            {/* Legacy / Direct candidate redirects */}
            <Route
              path="/candidate-profile"
              element={
                <ProtectedRoute allowedRoles={['Candidate']} redirectPath="/dashboard">
                  <Navigate to="/candidate/profile" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/digital-cv"
              element={
                <ProtectedRoute allowedRoles={['Candidate']} redirectPath="/dashboard">
                  <Navigate to="/candidate/profile" replace />
                </ProtectedRoute>
              }
            />

            {/* Employer / Company Auth Routes */}
            <Route
              path="/company-login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/company-register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Enterprise ATS Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/pipelines"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="pipelines" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/hiring-pipeline"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="hiring-pipeline" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hiring-pipeline"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="hiring-pipeline" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pipelines"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="pipelines" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/assessments"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="assessments" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="assessments" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/take/:submissionId"
              element={<CandidateExam />}
            />
            <Route
              path="/dashboard/jobs/new"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/jobs/create"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/jobs/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <EditJob />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vacancies"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <JobVacancies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vacancies/new"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vacancies/create"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vacancies/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <EditJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/create"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/details/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <EditJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="settings" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company-settings"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="settings" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/settings"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="settings" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/security"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="security" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company-security"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="security" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/security"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="security" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security"
              element={
                <ProtectedRoute allowedRoles={['Company', 'Employer', 'Admin']} redirectPath="/candidate/profile">
                  <Dashboard defaultTab="security" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
      {!isDashboardOrAuth && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
