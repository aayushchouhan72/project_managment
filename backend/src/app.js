import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//  Basic configuration
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//  cors configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    Credential: true,
    method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

//  Import the Routes
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import { parseConnectionUrl } from "nodemailer/lib/shared/index.js";

app.use("/api/v1/auth", authRouter);

app.use("/api/v1/healthcheck", healthCheckRouter);

export default app;
