import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Project from "./models/Project";
import User from "./models/User";
import { generateMockProject } from "./services/mockGenerate";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const MONGO_URI = process.env.MONGO_URI as string;
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!MONGO_URI) throw new Error("MONGO_URI not defined");
if (!JWT_SECRET) throw new Error("JWT_SECRET not defined");

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User created",
      token,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/generate", authMiddleware, async (req, res) => {
  const { idea } = req.body;

  if (!idea) return res.status(400).json({ error: "Idea required" });

  const generated = generateMockProject(idea);
  const project = await Project.create(generated);

  res.json({
    projectId: project._id,
    project,
  });
});

app.get("/project/:id", authMiddleware, async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

app.post("/project/:id/:model", authMiddleware, async (req, res) => {
  const { id, model } = req.params;
  const data = req.body;

  const project = await Project.findById(id);
  if (!project)
    return res.status(404).json({ error: "Project not found" });

  const mapData = project.data as Map<string, any[]>;

  if (!mapData.has(model)) {
    mapData.set(model, []);
  }

  const records = mapData.get(model) as any[];
  records.push(data);

  project.markModified("data");
  await project.save();

  res.json({ message: "Record added", records });
});

app.get("/project/:id/:model", authMiddleware, async (req, res) => {
  const { id, model } = req.params;

  const project = await Project.findById(id);
  if (!project)
    return res.status(404).json({ error: "Project not found" });

  const mapData = project.data as Map<string, any[]>;
  const records = mapData.get(model) || [];

  res.json(records);
});

async function startServer() {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();