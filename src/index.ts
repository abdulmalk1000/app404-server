import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import Project from "./models/Project";
import { generateMockProject } from "./services/mockGenerate";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
}

app.post("/generate", async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea) {
      return res.status(400).json({ error: "Idea required" });
    }

    const generated = generateMockProject(idea);
    const project = await Project.create(generated);

    res.json({
      projectId: project._id,
      project,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/project/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(project);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/project/:id/:model", async (req, res) => {
  try {
    const { id, model } = req.params;
    const data = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!project.data) {
      project.data = new Map<string, any[]>();
    }

    if (!project.data.has(model)) {
      project.data.set(model, []);
    }

    const records = (project.data.get(model) || []) as any[];
    records.push(data);

    project.data.set(model, records);
    project.markModified("data");

    await project.save();

    res.json({ message: "Record added", records });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/project/:id/:model", async (req, res) => {
  try {
    const { id, model } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const records = project.data?.get(model) || [];

    res.json(records);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

startServer();