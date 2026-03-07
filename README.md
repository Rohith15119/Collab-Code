# 🖥️ Collab-Code

> A unique session-based online compiler platform where developers write and run code in isolated environments, and share their sessions with others.

🔗 **Live Demo:** [collab-code-one.vercel.app](https://collab-code-one.vercel.app)

---

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
│   ├── database.js        # MongoDB connection setup
│   ├── mongo.js           # Mongoose configuration
│   └── passport.js        # Passport.js JWT auth strategy
│
├── controllers/
│   └── DB.js              # Core database logic and query handlers
│
├── middleware/
│   └── auth.js            # JWT verification — protects private routes
│
├── models/
│   ├── Session.js         # Session schema (code, language, owner, created date)
│   └── User.js            # User schema (name, email, hashed password)
│
├── routes/
│   ├── Auth.js            # Register, login, logout
│   ├── Profile.js         # View and update user profile
│   ├── ProtectedRoute.js  # Auth-gated route handler
│   ├── SessionInsert.js   # Create, update, delete sessions
│   ├── sharedView.js      # Serve shared view of a session to external users
│   └── analyse.js         # Code execution / analysis endpoints
│
├── services/
│   └── EmailService.js    # Nodemailer — password reset & notification emails
│
├── Tests/
│   └── SqlconnectionTest.js  # Database connection health test
│
├── validators/
│   └── AuthValidator.js   # Input validation for auth routes
│
├── server.js              # Express app entry point — mounts all routes
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

| Layer         | Technology                             |
|---------------|----------------------------------------|
| Frontend      | React.js, Vite                         |
| Styling       | CSS                                    |
| State/Context | React Context API                      |
| HTTP Client   | Axios                                  |
| Backend       | Node.js, Express.js                    |
| Auth          | Passport.js, JWT                       |
| Database      | MongoDB, Mongoose                      |
| Email         | Nodemailer                             |
| Deployment    | Vercel (Frontend), Node Host (Backend) |
| Language      | JavaScript (99.7%)                     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 16
- MongoDB (local or Atlas)
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
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:5173
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
VITE_API_URL=http://localhost:5000
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
4. Copy the **Shared View** link to let others view your session

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
