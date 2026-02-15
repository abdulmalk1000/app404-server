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
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

mongoose.connect(process.env.MONGO_URI as string).then(() => {
  console.log("Connected to MongoDB Atlas");
});

app.post("/generate", async (req, res) => {
  const { idea } = req.body;
  if (!idea) return res.status(400).json({ error: "Idea required" });

  const generated = generateMockProject(idea);
  const project = await Project.create(generated);

  res.json({
    projectId: project._id,
    project,
  });
});

app.get("/project/:id", async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

app.post("/project/:id/:model", async (req, res) => {
  const { id, model } = req.params;
  const data = req.body;

  const project = await Project.findById(id);
  if (!project)
    return res.status(404).json({ error: "Project not found" });

  if (!project.data) {
    project.data = new Map<string, any[]>();
  }

  if (!project.data.has(model)) {
    project.data.set(model, []);
  }

  const records = (project.data.get(model) as any[]) || [];
  records.push(data);

  project.data.set(model, records);
  project.markModified("data");

  await project.save();

  res.json({ message: "Record added", records });
});

app.get("/project/:id/:model", async (req, res) => {
  const { id, model } = req.params;

  const project = await Project.findById(id);
  if (!project)
    return res.status(404).json({ error: "Project not found" });

  const records = (project.data?.get(model) as any[]) || [];
  res.json(records);
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});