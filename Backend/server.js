const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

dotenv.config();

const db = require("./controllers/DB");
const authRoutes = require("./routes/Auth");
const sessionRoutes = require("./routes/SessionInsert");
const protectedRoutes = require("./routes/ProtectedRoute");
const ProfileRoutes = require("./routes/Profile");
const analyzeRouter = require("./routes/analyse");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const app = express();

app.use(compression());
app.use(helmet());
app.set("trust proxy", 1);
app.use(
  cors({
    origin: ["http://localhost:5173", "https://collab-code-one.vercel.app"],
    credentials: true,
  }),
);
app.use(morgan("combined"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  mongoSanitize({
    replaceWith: "_",
    allowDots: true,
  }),
);

const PORT = 5000;

const htmlPageContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Backend Server</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    body {
      height: 100vh;
      background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
    }

    .container {
      text-align: center;
      padding: 40px;
      border-radius: 16px;
      backdrop-filter: blur(15px);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      width: 90%;
      max-width: 600px;
      animation: fadeIn 1.2s ease-in-out;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      background: linear-gradient(90deg, #00dbde, #fc00ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p {
      font-size: 1.1rem;
      margin-bottom: 25px;
      color: #e0e0e0;
    }

    .status {
      padding: 10px 20px;
      border-radius: 50px;
      display: inline-block;
      background: #00c853;
      font-weight: bold;
      animation: pulse 2s infinite;
    }

    footer {
      margin-top: 30px;
      font-size: 0.85rem;
      color: #aaa;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 200, 83, 0.7); }
      70% { box-shadow: 0 0 0 15px rgba(0, 200, 83, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 200, 83, 0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Backend Server Running</h1>
    <p>Your Express + PostgreSQL server is successfully up and running.</p>
    <div class="status">● Connected</div>
    <footer>
      Built with Node.js, Express & Sequelize ❤️
    </footer>
  </div>
</body>
</html>
`;

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

app.get("/", (req, res) => {
  res.status(200).send(htmlPageContent);
});

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/auth", protectedRoutes);
app.use("/api/profile", ProfileRoutes);
app.use("/api", analyzeRouter);
app.use("/api/sharing", require("./routes/sharedView"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
