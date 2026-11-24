"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "../lib/api";
import ContestRow from "../components/ContestRow";

const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function NewContestForm({ token, onCreated }) {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const [form, setForm] = useState({ name: "", description: "", startTime: toLocalInput(start), endTime: toLocalInput(new Date(start.getTime() + 3 * 3600 * 1000)) });
  const [questions, setQuestions] = useState([{ name: "", conditionUrl: "" }]);
  const [users, setUsers] = useState([{ username: "", password: "" }]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const editList = (setter, i, k) => (e) => setter((list) => list.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)));
  const removeFrom = (setter, i) => () => setter((list) => (list.length > 1 ? list.filter((_, j) => j !== i) : list));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await api("/api/admin/contests", {
        method: "POST",
        token,
        body: { ...form, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString(), questions, allowedUsers: users },
      });
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form" style={{ padding: 24 }} onSubmit={submit}>
      <h2 style={{ fontSize: "1.2rem" }}>New contest</h2>
      <label className="field">Name<input value={form.name} onChange={set("name")} required /></label>
      <label className="field">Description<textarea rows={3} value={form.description} onChange={set("description")} /></label>
      <div className="row">
        <label className="field">Starts<input type="datetime-local" value={form.startTime} onChange={set("startTime")} required /></label>
        <label className="field">Ends<input type="datetime-local" value={form.endTime} onChange={set("endTime")} required /></label>
      </div>

      <p className="legend">Problems</p>
      {questions.map((q, i) => (
        <div key={i} className="repeat-row">
          <span className="qid" style={{ marginBottom: 8 }}>{String.fromCharCode(65 + i)}</span>
          <label className="field">Title<input value={q.name} onChange={editList(setQuestions, i, "name")} /></label>
          <label className="field">Statement URL<input value={q.conditionUrl} onChange={editList(setQuestions, i, "conditionUrl")} placeholder="https://…" /></label>
          <button type="button" className="icon-btn" onClick={removeFrom(setQuestions, i)} aria-label="Remove problem">✕</button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost" onClick={() => setQuestions((q) => [...q, { name: "", conditionUrl: "" }])}>+ Add problem</button>

      <p className="legend">Participants</p>
      {users.map((u, i) => (
        <div key={i} className="repeat-row">
          <label className="field">Username<input value={u.username} onChange={editList(setUsers, i, "username")} /></label>
          <label className="field">Password<input value={u.password} onChange={editList(setUsers, i, "password")} /></label>
          <button type="button" className="icon-btn" onClick={removeFrom(setUsers, i)} aria-label="Remove participant">✕</button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost" onClick={() => setUsers((u) => [...u, { username: "", password: "" }])}>+ Add participant</button>

      {error && <p className="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Creating…" : "Create contest"}</button>
    </form>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [contests, setContests] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = Cookies.get("adminToken");
    if (!t) return router.replace("/adminlogin");
    setToken(t);
    api("/api/contests").then(setContests).catch((e) => setError(e.message));
  }, [router]);

  const logout = () => {
    Cookies.remove("adminToken");
    Cookies.remove("adminName");
    window.location.href = "/";
  };

  if (!token) return null;

  return (
    <main className="container page">
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <span className="muted">Signed in as {Cookies.get("adminName")}</span>
          <h1 style={{ fontSize: "1.9rem" }}>Admin dashboard</h1>
        </div>
        <button className="btn" onClick={logout}>Log out</button>
      </div>
      {error && <p className="alert">{error}</p>}
      <div className="admin-grid">
        <div className="contest-list">
          {!contests && <div className="card skeleton" />}
          {contests && contests.length === 0 && <div className="card empty">No contests yet. Create the first one.</div>}
          {contests && contests.map((c) => <ContestRow key={c._id} contest={c} href={`/admin/inspect/${c._id}`} />)}
        </div>
        <NewContestForm token={token} onCreated={(c) => setContests((list) => [{ ...c, participants: c.allowedUsers.length }, ...(list || [])])} />
      </div>
    </main>
  );
}
