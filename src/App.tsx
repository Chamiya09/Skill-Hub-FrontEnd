import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { FindJobs } from "./pages/FindJobs";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { UserManagement } from "./pages/UserManagement";
import { Dashboard } from "./pages/Dashboard";
import { JobVacancies } from "./pages/JobVacancies";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const hideHeaderFooter =
    location.pathname === "/company-login" ||
    location.pathname === "/company-register" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/dashboard");

  return (
    <div className={`page-container ${hideHeaderFooter ? "auth-full-screen" : ""}`}>
      <div className={`content-wrapper ${hideHeaderFooter ? "auth-wrapper-full" : ""}`}>
        {!hideHeaderFooter && <Header />}
        <main className={`main-content ${hideHeaderFooter ? "auth-main-full" : ""}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/jobs" element={<FindJobs />} />
            <Route path="/company-login" element={<Login />} />
            <Route path="/company-register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vacancies" element={<JobVacancies />} />
          </Routes>
        </main>
      </div>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

