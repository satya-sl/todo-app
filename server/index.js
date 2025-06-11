// server/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dayjs = require("dayjs");

const app = express();
const PORT = 3000;
const LIMIT = 5;


app.use(cors({
  origin: "https://papaya-sunshine-030d80.netlify.app"
}));

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date, default: null },
}, { timestamps: true });

const Task = mongoose.model("Task", TaskSchema);

// GET with filters + pagination
app.get("/tasks", async (req, res) => {
  try {
    const { page = 1, filter = "all" } = req.query;
    let query = {};

    if (filter === "complete") query.completed = true;
    else if (filter === "incomplete") query.completed = false;
    else if (filter === "today") {
      const start = dayjs().startOf("day").toDate();
      const end = dayjs().endOf("day").toDate();
      query.dueDate = { $gte: start, $lte: end };
    }

    const total = await Task.countDocuments(query);
    const pages = Math.ceil(total / LIMIT);

    const tasks = await Task.find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .skip((page - 1) * LIMIT)
      .limit(LIMIT);

    res.json({ tasks, total, page: Number(page), pages });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    const task = new Task({ title, dueDate, completed: false });
    await task.save();
    res.json(task);
  } catch {
    res.status(400).json({ error: "Invalid input" });
  }
});

app.patch("/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch {
    res.status(400).json({ error: "Invalid update" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(400).json({ error: "Deletion failed" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
