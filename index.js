import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// CORS must come before session and routes
app.use(cors({
  origin: 'https://kodcommunity.netlify.app', // your frontend Netlify URL
  credentials: true
}));

// Body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration (must be after cors)
app.set('trust proxy', 1); 
app.use(session({
  secret: 'fix_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // ✅ Render uses HTTPS
    httpOnly: true,
    sameSite: 'none',    // ✅ Needed for cross-origin cookies
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes
app.use("/auth", authRoutes);

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
