import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
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
    location.pathname.startsWith("/vacancies");

  return (
    <div className={`page-container ${isDashboardOrAuth ? "dashboard-view-mode auth-full-screen" : ""}`}>
      <div className={`content-wrapper ${isDashboardOrAuth ? "dashboard-wrapper-full auth-wrapper-full" : ""}`}>
        {!isDashboardOrAuth && <Header />}
        <main className={`main-content ${isDashboardOrAuth ? "dashboard-main-full auth-main-full" : ""}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/jobs" element={<FindJobs />} />
            <Route path="/jobs/:id" element={<JobDetailsPublic />} />
            <Route path="/job/:id" element={<JobDetailsPublic />} />
            <Route path="/company-login" element={<Login />} />
            <Route path="/company-register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/pipelines" element={<Dashboard defaultTab="pipelines" />} />
            <Route path="/dashboard/hiring-pipeline" element={<Dashboard defaultTab="hiring-pipeline" />} />
            <Route path="/hiring-pipeline" element={<Dashboard defaultTab="hiring-pipeline" />} />
            <Route path="/dashboard/jobs/new" element={<CreateJob />} />
            <Route path="/dashboard/jobs/create" element={<CreateJob />} />
            <Route path="/dashboard/jobs/:id/edit" element={<EditJob />} />
            <Route path="/vacancies" element={<JobVacancies />} />
            <Route path="/vacancies/new" element={<CreateJob />} />
            <Route path="/vacancies/create" element={<CreateJob />} />
            <Route path="/vacancies/:id/edit" element={<EditJob />} />
            <Route path="/pipelines" element={<Dashboard defaultTab="pipelines" />} />
            <Route path="/jobs/create" element={<CreateJob />} />
            <Route path="/jobs/details/:id/edit" element={<EditJob />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/team" element={<UserManagement />} />
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
