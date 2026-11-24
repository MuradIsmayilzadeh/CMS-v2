// Storage layer: MongoDB when MONGODB_URI is set, otherwise a local JSON file (data.json)
// seeded with a demo admin and contest so the app runs out of the box.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const newId = () => crypto.randomBytes(12).toString("hex");

function seedData() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return {
    admins: [{ _id: newId(), authorname: "Demo Admin", username: "admin", password: bcrypt.hashSync("admin123", 10) }],
    contests: [
      {
        _id: newId(),
        name: "Weekly Warm-up #1",
        description: "Three classic problems to warm up: arrays, strings and a bit of math. Submit C++ solutions.",
        author: "Demo Admin",
        startTime: new Date(now - day).toISOString(),
        endTime: new Date(now + 3 * day).toISOString(),
        questions: [
          { questionId: "A", name: "Sum of Array", conditionUrl: "" },
          { questionId: "B", name: "Palindrome Check", conditionUrl: "" },
          { questionId: "C", name: "Prime Sieve", conditionUrl: "" },
        ],
        allowedUsers: [{ userId: newId(), username: "student", password: "student123", submissions: [] }],
      },
      {
        _id: newId(),
        name: "Algorithms Cup",
        description: "Graphs, dynamic programming and greedy algorithms.",
        author: "Demo Admin",
        startTime: new Date(now + 7 * day).toISOString(),
        endTime: new Date(now + 7 * day + 3 * 60 * 60 * 1000).toISOString(),
        questions: [{ questionId: "A", name: "Shortest Path", conditionUrl: "" }],
        allowedUsers: [],
      },
      {
        _id: newId(),
        name: "Season Opener",
        description: "Last season's opening round.",
        author: "Demo Admin",
        startTime: new Date(now - 30 * day).toISOString(),
        endTime: new Date(now - 30 * day + 3 * 60 * 60 * 1000).toISOString(),
        questions: [],
        allowedUsers: [],
      },
    ],
  };
}

function fileStore(file) {
  const load = () => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(seedData(), null, 2));
    return JSON.parse(fs.readFileSync(file, "utf8"));
  };
  const save = (data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return {
    kind: `JSON file (${path.basename(file)})`,
    async listContests() { return load().contests; },
    async getContest(id) { return load().contests.find((c) => c._id === id) || null; },
    async findAdmin(username) { return load().admins.find((a) => a.username === username) || null; },
    async createContest(contest) {
      const data = load();
      const created = { _id: newId(), ...contest };
      data.contests.push(created);
      save(data);
      return created;
    },
    async addSubmission(contestId, userId, submission) {
      const data = load();
      const contest = data.contests.find((c) => c._id === contestId);
      const user = contest && contest.allowedUsers.find((u) => u.userId === userId);
      if (!user) return false;
      user.submissions.push({ _id: newId(), ...submission });
      save(data);
      return true;
    },
  };
}

async function mongoStore(uri) {
  const mongoose = require("mongoose");
  await mongoose.connect(uri);

  const Admins = mongoose.models.Admins || mongoose.model("Admins", new mongoose.Schema({ authorname: String, username: String, password: String }));
  const Contests =
    mongoose.models.Contests ||
    mongoose.model(
      "Contests",
      new mongoose.Schema({
        name: String,
        description: String,
        startTime: Date,
        endTime: Date,
        author: String,
        questions: [{ questionId: String, name: String, conditionUrl: String }],
        allowedUsers: [{ userId: String, username: String, password: String, submissions: [{ questionId: String, result: String, filePath: String, submittedAt: Date }] }],
      })
    );

  const plain = (doc) => (doc ? JSON.parse(JSON.stringify(doc)) : null);
  return {
    kind: "MongoDB",
    async listContests() { return plain(await Contests.find()); },
    async getContest(id) { return mongoose.isValidObjectId(id) ? plain(await Contests.findById(id)) : null; },
    async findAdmin(username) { return plain(await Admins.findOne({ username })); },
    async createContest(contest) { return plain(await Contests.create(contest)); },
    async addSubmission(contestId, userId, submission) {
      const res = await Contests.updateOne({ _id: contestId, "allowedUsers.userId": userId }, { $push: { "allowedUsers.$.submissions": submission } });
      return res.modifiedCount > 0;
    },
  };
}

module.exports = async function createStore() {
  if (process.env.MONGODB_URI) return mongoStore(process.env.MONGODB_URI);
  return fileStore(path.join(__dirname, "data.json"));
};
module.exports.newId = newId;
