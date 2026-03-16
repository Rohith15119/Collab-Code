# 🖥️ Collab-Code

> A unique session-based online compiler platform where developers write and run code in isolated environments, and share their sessions with others.

🔗 **Live Demo:** [collab-code-one.vercel.app](https://collab-code-one.vercel.app)

---

## Screenshots

🔐 Login

<img width="3136" height="1478" alt="1-Picsart-AiImageEnhancer" src="https://github.com/user-attachments/assets/9bebd9bc-84d1-4b63-82a9-3d7f646adc48" />

📝 Register

![2](https://github.com/user-attachments/assets/e53d2b8b-2fda-4a37-a6ad-08a56f94a4ff)

🔑 Forgot Password

![3](https://github.com/user-attachments/assets/1bcf97d1-eb4e-4402-8429-4084e70a7d30)

📊 Dashboard

![4](https://github.com/user-attachments/assets/0990e650-da60-4b3e-aef7-8c7ba8511d25)

💻 Editor

![5](https://github.com/user-attachments/assets/87a31898-76a7-40c5-91aa-8aff18f24154)

▶️ Editor — Run Output & Complexity Analysis

![6](https://github.com/user-attachments/assets/cbd14551-d54f-44e8-954d-5fc142381edb)

⚙️ Settings

![7](https://github.com/user-attachments/assets/b4bb1bcb-d94a-4b74-b808-1ea9945c81d6)

👁️ Shared View

## ![8](https://github.com/user-attachments/assets/a71a8abe-789e-464b-abce-00cf542b2cd9)

## 📖 About

Collab-Code is an online compiler platform built around the concept of **coding sessions**. Users register, log in, and create personal coding sessions — each acting as an isolated environment where they can write and execute code in their browser. Sessions can be shared with others via a shared view link, making it easy to showcase solutions, teach concepts, or review code without any local setup.

---

## ✨ Features

- ⚙️ **Online Compiler** — Write and execute code directly in the browser
- 🧩 **Session-Based Environments** — Each coding session is isolated and uniquely identifiable
- 👁️ **Shared View** — Share your session with others via a dedicated read-only link
- 🔐 **Authentication** — Secure register, login, forgot password, and reset password flows
- 📊 **Dashboard** — Create, manage, and revisit all your coding sessions
- 👤 **Profile & Settings** — Manage your account information and preferences
- 📧 **Email Notifications** — Password reset and account-related emails
- 🛡️ **Protected Routes** — Auth guards on both frontend and backend to secure user data

---

## 🏗️ Architecture

Collab-Code is a **full-stack JavaScript monorepo** split into a React + Vite frontend and a Node.js + Express + MongoDB backend.

```
Collab-Code/
├── Backend/        # Node.js + Express REST API
├── Frontend/       # React + Vite client (compiler UI + session management)
├── README.md
└── gitattributes
```

---

## 🗂️ Project Structure

### Backend (`/Backend`)

```
Backend/
├── config/
│   ├── database.js              # MongoDB connection setup
│   ├── Google.js                # Passport.js Google OAuth strategy
│   └── mongo.js                 # Mongoose configuration
│
├── controllers/
│   ├── AuthController.js        # Auth-related logic and error handling
│   ├── ComplexityController.js  # Time and space complexity analyser logic
│   ├── Database.js              # Core database logic and query handlers
│   ├── ProfileController.js     # Profile settings — username and email logic
│   ├── RedisController.js       # Redis caching optimisation logic
│   ├── SessionController.js     # Individual user session logic and queries
│   └── SharedViewController.js  # Shared view logic — sockets, etc.
│
├── middleware/
│   ├── auth.js                  # JWT verification — protects private routes
│   └── role.js                  # Role-based access control middleware
│
├── models/
│   ├── Session.js               # Session schema (code, language, owner, created date)
│   └── User.js                  # User schema (name, email, hashed password)
│
├── routes/
│   ├── analyse.js               # Code execution / analysis endpoints
│   ├── Auth.js                  # Register, login, logout
│   ├── Profile.js               # View and update user profile
│   ├── Sessions.js              # Create, update, delete sessions
│   └── sharedView.js            # Serve shared view of a session to external users
│
├── services/
│   ├── AuthService.js           # Auth business logic and helpers
│   ├── ComplexityService.js     # Complexity analysis service layer
│   ├── EmailService.js          # Nodemailer — password reset & notification emails
│   ├── Limiter.js               # Rate limiting service
│   ├── ProfileService.js        # Profile update service logic
│   ├── SessionService.js        # Session management service layer
│   └── SharedViewService.js     # Shared view service and socket helpers
│
├── Tests/
│   └── SqlconnectionTest.js     # Database connection health test
│
├── validators/
│   └── AuthValidator.js         # Input validation for auth routes
│
├── server.js                    # Express app entry point — mounts all routes
└── package.json
```

### Frontend (`/Frontend`)

Built with **React + Vite**, deployed on **Vercel**.

```
Frontend/
├── src/
│   ├── api/
│   │   └── index.js            # Axios instance with base URL & auth headers
│   │
│   ├── components/
│   │   ├── Navbar.jsx           # Navigation bar (auth-aware)
│   │   ├── ProtectedRoute.jsx   # Redirects unauthenticated users
│   │   └── SessionCard.jsx      # Card UI for displaying a session summary
│   │
│   ├── context/
│   │   └── AuthContext.jsx      # Global auth state — user, token, login, logout
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx        # Lists user's sessions; create & manage sessions
│   │   ├── Editor.jsx           # Online compiler — code editor + execution output
│   │   ├── Forget_password.jsx  # Forgot password form
│   │   ├── Login.jsx            # Login page
│   │   ├── Profile.jsx          # User profile view & edit
│   │   ├── Register.jsx         # New user registration
│   │   ├── ResetPassword.jsx    # Reset password via email token
│   │   ├── Settings.jsx         # Account settings
│   │   └── SharedView.jsx       # Public shared view of a coding session
│   │
│   ├── App.jsx                  # Route definitions (public + protected)
│   ├── main.jsx                 # Vite app entry point
│   └── index.css                # Global styles
│
├── index.html
├── vite.config.js               # Vite build config
├── vercel.json                  # SPA routing config for Vercel deployment
└── package.json
```

---

## 🔄 Request Flow

```
Browser (React + Vite)
        │
        │  HTTP REST (Axios)
        ▼
Express Server  ──── server.js
        │
        ├── auth.js middleware        ← Verifies JWT on every protected request
        ├── role.js middleware        ← Role-based access control
        │
        ├── POST /api/auth/register   ← Create account
        ├── POST /api/auth/login      ← Authenticate & receive JWT
        ├── POST /api/auth/reset      ← Password reset via email token
        │
        ├── GET  /api/profile         ← View profile
        ├── PUT  /api/profile         ← Update profile
        │
        ├── POST /api/sessions        ← Create a new coding session
        ├── GET  /api/sessions        ← List user's sessions
        ├── PUT  /api/sessions/:id    ← Save / update code in session
        ├── DELETE /api/sessions/:id  ← Delete a session
        │
        ├── GET  /api/shared/:id      ← Public shared view of a session
        └── POST /api/analyse         ← Submit code for execution
                 │
                 ▼
          MongoDB (Mongoose)
          ├── users      — credentials & profile
          └── sessions   — code, language, owner, timestamps
```

---

## 🛠️ Tech Stack

| Layer         | Technology                          |
| ------------- | ----------------------------------- |
| Frontend      | React.js, Vite                      |
| Styling       | TailWind CSS                        |
| State/Context | React Context API                   |
| HTTP Client   | Axios                               |
| Backend       | Node.js, Express.js                 |
| Auth          | Passport.js, JWT                    |
| Database      | MongoDB, Mongoose                   |
| Email         | Nodemailer, Resend, BREVO           |
| Deployment    | Vercel (Frontend), Render (Backend) |
| Language      | JavaScript (99.7%)                  |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 16
- MongoDB (local or Atlas)
- PostgreSQL (Supabase or any other)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/Rohith15119/Collab-Code.git
cd Collab-Code
```

### 2. Set up the Backend

```bash
cd Backend
npm install
```

Create a `.env` file in `/Backend`:

```env
PORT=5000
DATABASE_URL=database_string
JWT_SECRET=ur_secret
MONGO_URL=mongo_db_atlas or mongo_db_local
GOOGLE_CLIENT_ID=client_id
GOOGLE_CLIENT_SECRET=client_secret
REFRESH_SECRET=other_secrets
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=api_key_
BACKEND_URL=http://localhost:5000
REDIS_URL=redis_url
BREVO_API_KEY=your_api_key
```

```bash
npm start
```

### 3. Set up the Frontend

```bash
cd ../Frontend
npm install
```

Create a `.env` file in `/Frontend`:

```env
VITE_API_URL=backend_url
```

```bash
npm run dev
```

App runs at `http://localhost:5173`.

---

## 💻 Usage

1. **Register** or **Log in** to your account
2. From the **Dashboard**, create a new coding session
3. Open the **Editor** — write your code, select a language, and run it
4. Copy the **Shared View** link to let others view your session (Currently under Development)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Rohith** — [@Rohith15119](https://github.com/Rohith15119)

---

> Built with ❤️ for developers who believe coding is better together.