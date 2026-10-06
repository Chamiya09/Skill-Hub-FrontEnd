# Skill Hub — Frontend Web Application

[![CI/CD Frontend](https://github.com/Chamiya09/Skill-Hub-FrontEnd/actions/workflows/frontend-deploy.yml/badge.svg)](https://github.com/Chamiya09/Skill-Hub-FrontEnd/actions)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Azure App Service](https://img.shields.io/badge/Azure-App%20Service-0078D4.svg)](https://app-skillhub-frontend.azurewebsites.net)

The modern, responsive Single-Page Application (SPA) for **Skill Hub**, an enterprise AI-driven Applicant Tracking System (ATS) and talent marketplace. This client portal provides distinct role-based experiences for Job Seekers (Candidates), Recruiters/Companies, and Super Administrators.

---

## 🌟 Component Overview & Responsibilities

- **Candidate Portal:** Vacancy discovery, digital resume builder, technical assessment coding IDE (Monaco Editor), real-time application tracking, and interview slot booking.
- **Employer / HR Dashboard:** Job vacancy authoring, applicant scoring & candidate shortlisting, AI semantic gap radar, and monthly interview planner.
- **Admin Console:** System-wide audit logs, user management, and platform metrics monitoring.
- **Production URL:** [https://app-skillhub-frontend.azurewebsites.net](https://app-skillhub-frontend.azurewebsites.net)

---

## 🛠️ Technology Stack & Core Dependencies

- **Core Library:** React 19 with TypeScript
- **Build Tooling & Bundler:** Vite (with ESBuild & TypeScript compiler `tsc`)
- **Routing:** React Router DOM v6 (HTML5 History API with SPA fallback)
- **Code Editor IDE:** `@monaco-editor/react` (for in-browser candidate coding assessments)
- **Rich Text Editing:** `react-quill-new` & `dompurify` (sanitized job description authoring)
- **Icons & UI Utilities:** `lucide-react`

---

## 📋 Prerequisites

Ensure the following runtimes are installed locally:
- **Node.js:** `v20.x LTS` (or higher)
- **Package Manager:** `npm` (v10+)
- **Git**

---

## 🚀 Quickstart & Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/Chamiya09/Skill-Hub-FrontEnd.git
cd Skill-Hub-FrontEnd
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Populate `.env` with your backend API endpoint:
```env
# Backend API URL
VITE_API_BASE_URL=<ENTER_BACKEND_API_URL> # e.g. http://localhost:5155/api
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

---

## 🧪 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with Hot Module Replacement (HMR). |
| `npm run build` | Executes `tsc -b` type checking and generates production bundle in `./dist`. |
| `npm run preview` | Spins up a local web server to preview the production build output. |
| `npm run lint` | Runs ESLint across all `.ts` and `.tsx` source files. |

---

## ☁️ Deployment & CI/CD Pipeline

The frontend is continuously delivered via **GitHub Actions** to **Azure App Service (Linux)**.

- **Pipeline File:** `.github/workflows/frontend-deploy.yml`
- **Deployment Strategy:** 
  1. Automated clean install (`npm ci`) and compilation (`npm run build`).
  2. Artifact packaged into a deployment bundle.
  3. Deployed via `azure/webapps-deploy@v3` using the repository secret `AZURE_WEBAPP_PUBLISH_PROFILE`.
- **SPA Routing Resilience:** Deployed with PM2 and `serve -s dist -l 8080`, redirecting non-asset deep links (e.g. `/candidate/interviews`) back to `index.html` to eliminate 404 errors.
