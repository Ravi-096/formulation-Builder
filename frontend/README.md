# Enterprise Portal - Modern React SPA Web Client

A production-grade, responsive Single-Page Application (SPA) built with **React (Vite)**, **Tailwind CSS**, **React Router v6**, **Axios**, and **Lucide React**.

---

## 🌟 Key Features

1. **Authentication & Global State Management**:
   - React Context (`AuthContext`) managing `user`, `token`, `login()`, `register()`, `logout()`, and `isAuthenticated`.
   - JWT token storage in `localStorage` with auto-session restoration on boot.
   - Axios Request Interceptor automatically injects `Authorization: Bearer <token>`.
   - Axios Response Interceptor catches `401 Unauthorized` token expiration and performs automatic logout.
   - Built-in zero-config intelligent Mock API fallback for instant testing without a running backend.

2. **Route Protection & Routing (React Router v6)**:
   - **Public Routes** (`/login`, `/register`): Automatically redirect authenticated users to `/dashboard`.
   - **Root Route** (`/`): Redirects to `/dashboard` (which triggers redirect to `/login` if unauthenticated).
   - **Protected Routes** (`/dashboard`, `/dashboard/overview`, `/dashboard/analytics`, `/dashboard/settings`): Wrapped with `ProtectedRoute` guard.
   - **404 Page**: Custom wildcard error page.

3. **UI Pages & Components**:
   - **Register Page**: Card layout with Email, Username, Password, Confirm Password, real-time password strength meter, validation, and direct link to Login.
   - **Login Page**: Email/Username, Password with toggle visibility, one-click demo credentials autofill pills, error alerts, and direct link to Register.
   - **Dashboard Overview**:
     - Metric cards display stats from `/api/dashboard/stats`.
     - Recent Activity Table with search bar, status filter tabs (`completed`, `pending`, `in_progress`, `failed`), and live refresh.
     - Action buttons (Create Project, Export CSV).
   - **Dashboard Analytics**: Telemetry cards (SLA uptime, latency, error rate, throughput), interactive 7-day traffic chart, and device platform breakdowns.
   - **Dashboard Settings**: Tabbed management for Profile, Password change, Light/Dark appearance switcher, and Bearer JWT token preview with copy button.
   - **Top Navigation Bar**: User avatar, user name, role, dark/light mode toggle, notification dropdown, and sign-out button.
   - **Sidebar**: Collapsible responsive sidebar with navigation links and mobile slide-over drawer.

4. **Design & Aesthetics**:
   - Tailwind CSS with modern **zinc/slate** color palette.
   - Dark mode and Light mode with persistent preferences.
   - Crisp icons using `lucide-react`.
   - Skeleton loaders, smooth spinners, and toast notifications.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

The application will launch on `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

---

## 🔑 Pre-Configured Demo Credentials

You can log in using either of the following accounts or register a brand-new account directly:

| Role | Email / Identifier | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` or `admin_alex` | `password123` |
| **Engineer** | `user@example.com` or `sarah_dev` | `password123` |

*(You can also click the quick demo buttons on the Login page to autofill credentials).*

---

## ⚙️ Connecting to a Live Backend

If you have a backend server running (e.g. at `http://localhost:5000/api`), configure your `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MOCK_FALLBACK=false
```
