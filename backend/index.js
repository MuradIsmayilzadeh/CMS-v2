require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const createStore = require("./store");
const { newId } = require("./store");

const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";
const FILES_DIR = path.join(__dirname, "files");
fs.mkdirSync(FILES_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 }, abortOnLimit: true }));

// Remove participant passwords from public responses.
const publicContest = (c) => ({ ...c, allowedUsers: (c.allowedUsers || []).map(({ password, ...u }) => u) });

const requireAdmin = (req, res, next) => {
  const token = (req.header("Authorization") || "").replace(/^Bearer /, "");
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Admin authentication required" });
  }
};

const requireParticipant = (req, res, next) => {
  const token = (req.header("Authorization") || "").replace(/^Bearer /, "");
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.contestId !== req.params.contestId) throw new Error("wrong contest");
    req.participant = payload;
    next();
  } catch {
    res.status(401).json({ message: "Please log in to this contest" });
  }
};

createStore().then((store) => {
  console.log(`Using ${store.kind} storage`);

  app.get("/api/contests", async (req, res) => {
    const contests = await store.listContests();
    res.json(contests.map(({ allowedUsers, ...c }) => ({ ...c, participants: (allowedUsers || []).length })));
  });

  app.get("/api/contest/:contestId", async (req, res) => {
    const contest = await store.getContest(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    res.json(publicContest(contest));
  });

  app.post("/api/contest/:contestId/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: "Username and password are required" });
    const contest = await store.getContest(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    const user = contest.allowedUsers.find((u) => u.username === username);
    if (!user) return res.status(403).json({ message: "You are not registered for this contest" });
    if (user.password !== password) return res.status(401).json({ message: "Invalid username or password" });
    const token = jwt.sign({ contestId: req.params.contestId, userId: user.userId, username }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, userId: user.userId, username });
  });

  app.post("/api/contest/:contestId/submit", requireParticipant, async (req, res) => {
    const { questionId } = req.body || {};
    const file = req.files && req.files.file;
    if (!file || !questionId) return res.status(400).json({ message: "A question and a .cpp file are required" });
    if (!/\.(cpp|cc|cxx)$/i.test(file.name)) return res.status(400).json({ message: "Only C++ source files are accepted" });

    const contest = await store.getContest(req.params.contestId);
    const now = Date.now();
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    if (now < new Date(contest.startTime).getTime()) return res.status(403).json({ message: "The contest has not started yet" });
    if (now > new Date(contest.endTime).getTime()) return res.status(403).json({ message: "The contest has ended" });

    const safeName = `${req.participant.userId}_${questionId}_${Date.now()}_${path.basename(file.name).replace(/[^\w.-]/g, "_")}`;
    await file.mv(path.join(FILES_DIR, safeName));
    const ok = await store.addSubmission(contest._id, req.participant.userId, { questionId, result: "Pending", filePath: safeName, submittedAt: new Date().toISOString() });
    if (!ok) return res.status(404).json({ message: "Participant not found" });
    res.json({ message: "File submitted successfully" });
  });

  app.get("/api/files/:filename", (req, res) => {
    const filePath = path.join(FILES_DIR, path.basename(req.params.filename));
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    res.download(filePath);
  });

  // ---- Admin ----
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body || {};
    const admin = username && (await store.findAdmin(username));
    const valid = admin && (admin.password.startsWith("$2") ? await bcrypt.compare(password || "", admin.password) : admin.password === password);
    if (!valid) return res.status(401).json({ message: "Invalid username or password" });
    const token = jwt.sign({ username: admin.username, authorname: admin.authorname }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, username: admin.username, authorname: admin.authorname });
  });

  app.get("/api/admin/contest/:contestId", requireAdmin, async (req, res) => {
    const contest = await store.getContest(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    res.json(contest);
  });

  app.post("/api/admin/contests", requireAdmin, async (req, res) => {
    const { name, description, startTime, endTime, questions = [], allowedUsers = [] } = req.body || {};
    if (!name || !startTime || !endTime) return res.status(400).json({ message: "Name, start and end time are required" });
    if (new Date(endTime) <= new Date(startTime)) return res.status(400).json({ message: "End time must be after start time" });
    const contest = await store.createContest({
      name,
      description: description || "",
      author: req.admin.authorname || req.admin.username,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      questions: questions.filter((q) => q.name).map((q, i) => ({ questionId: q.questionId || String.fromCharCode(65 + i), name: q.name, conditionUrl: q.conditionUrl || "" })),
      allowedUsers: allowedUsers.filter((u) => u.username && u.password).map((u) => ({ userId: newId(), username: u.username, password: u.password, submissions: [] })),
    });
    res.status(201).json(contest);
  });

  app.listen(PORT, () => console.log(`CMS API running on http://localhost:${PORT}`));
}).catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
