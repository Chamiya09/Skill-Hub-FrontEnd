import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { FindJobs } from "./pages/FindJobs";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { UserManagement } from "./pages/UserManagement";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="page-container">
        <div className="content-wrapper">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/jobs" element={<FindJobs />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/users" element={<UserManagement />} />
            </Routes>
          </main>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
