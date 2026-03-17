# Devise Iris - Project Overview

Devise Iris is a sophisticated monitoring and analytics dashboard designed for agent tracking, event logging, and organizational spend management. It features a robust backend powered by FastAPI and a modern, high-performance frontend built with React and Vite.

## 🚀 Tech Stack

### Backend
- **Language:** Python 3.10+
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous Web Framework)
- **Database / Auth:** [Supabase](https://supabase.com/) (PostgreSQL with Real-time capabilities)
- **Validation:** Pydantic V2
- **ORM/Client:** Supabase Python SDK
- **Web Server:** Uvicorn (ASGI server)
- **Authentication:** JWT (JSON Web Tokens) with JWKS validation from Supabase Auth.

### Frontend
- **Language:** TypeScript
- **Framework:** [React 18](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** CSS (Vanilla) & [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) (Unstyled, accessible components)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management / Data Fetching:** [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Routing:** React Router DOM

---

## 📂 Project Structure

```text
devise-iris/
├── api/                # Vercel serverless entry points
│   └── index.py        # ASGI bridge to the main backend
├── backend/            # Main Python Backend Source
│   ├── server.py       # FastAPI application logic and routes
│   └── .env            # Environment variables (DB keys, etc.)
├── frontend/           # React TypeScript Frontend
│   ├── src/            # UI Source code (Components, Hooks, Pages)
│   ├── public/         # Static assets
│   └── package.json    # Node.js dependencies and scripts
├── vercel.json         # Deployment configuration for Vercel
├── requirements.txt    # Python dependencies
└── PROJECT_DETAILS.md  # This document
```

---

## 🛠️ Performance & Architecture Highlights

1.  **Unified Auth:** The backend validates Supabase JWTs directly using JWKS (JSON Web Key Sets), ensuring secure and efficient authentication without redundant database round-trips.
2.  **Stateless API:** Designed for horizontal scalability, utilizing Supabase as a centralized data and auth provider.
3.  **Modern UI/UX:** The frontend uses **Vite** for near-instant hot module replacement (HMR) and **TanStack Query** for intelligent caching and synchronization of server state.
4.  **Type Safety:** End-to-end type safety using TypeScript on the frontend and Pydantic models on the backend.

---

## 💻 Running the Project

### Environment Variables
Ensure `backend/.env` contains valid Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

### Backend
```powershell
pip install -r requirements.txt
python -m uvicorn backend.server:app --reload --port 8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

---

## ✨ Key Features
- **Event Ingestion:** High-performance endpoints for logging agent events and heartbeats.
- **Analytics Dashboard:** Real-time visualization of tool usage, risk levels, and categories.
- **Alerting System:** Automated detection of tampering, suspicious gaps, and high-risk activity.
- **Team Management:** Organization-based user management and invitation system.
- **Spend Tracking:** Subscription and budget monitoring for organizational SaaS tools.
