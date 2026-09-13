import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { PublicRoute } from "./components/common/PublicRoute";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { FindJobs } from "./pages/FindJobs";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { JobVacancies } from "./pages/JobVacancies";
import { EditJob } from "./pages/EditJob";
import { CreateJob } from "./pages/CreateJob";
import { UserManagement } from "./pages/UserManagement";
import { JobDetailsPublic } from "./pages/JobDetailsPublic";
import { PublicCompanyProfile } from "./pages/PublicCompanyProfile";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const isDashboardOrAuth =
    location.pathname === "/company-login" ||
    location.pathname === "/company-register" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/pipelines") ||
    location.pathname.startsWith("/hiring-pipeline") ||
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

            {/* Public Auth Routes (Redirect to dashboard if already logged in) */}
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
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/pipelines"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="pipelines" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/hiring-pipeline"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="hiring-pipeline" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hiring-pipeline"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="hiring-pipeline" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pipelines"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="pipelines" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/jobs/new"
              element={
                <ProtectedRoute>
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/jobs/create"
              element={
                <ProtectedRoute>
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/jobs/:id/edit"
              element={
                <ProtectedRoute>
                  <EditJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vacancies"
              element={
                <ProtectedRoute>
                  <JobVacancies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vacancies/new"
              element={
                <ProtectedRoute>
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vacancies/create"
              element={
                <ProtectedRoute>
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vacancies/:id/edit"
              element={
                <ProtectedRoute>
                  <EditJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/create"
              element={
                <ProtectedRoute>
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/details/:id/edit"
              element={
                <ProtectedRoute>
                  <EditJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="settings" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company-settings"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="settings" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/settings"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="settings" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/security"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="security" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company-security"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="security" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/security"
              element={
                <ProtectedRoute>
                  <Dashboard defaultTab="security" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security"
              element={
                <ProtectedRoute>
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
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
