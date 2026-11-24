"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ContestShower from "./contestShower";
import { api } from "../../lib/api";

const storageKey = (id) => `contestSession:${id}`;

export default function ContestDetail({ params }) {
  const { id } = params;
  const [session, setSession] = useState(undefined);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setSession(JSON.parse(localStorage.getItem(storageKey(id))) || null);
    } catch {
      setSession(null);
    }
  }, [id]);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api(`/api/contest/${id}/login`, { method: "POST", body: { username, password } });
      localStorage.setItem(storageKey(id), JSON.stringify(data));
      setSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(storageKey(id));
    setSession(null);
  };

  if (session === undefined) return null;
  if (session) return <ContestShower contestId={id} session={session} onLogout={logout} />;

  return (
    <main className="auth">
      <form className="card auth-card form" onSubmit={login}>
        <div>
          <h1>Enter contest</h1>
          <p className="muted">Use the username and password from your contest organiser.</p>
        </div>
        <label className="field">Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required /></label>
        <label className="field">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {error && <p className="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Checking…" : "Enter contest"}</button>
        <Link href="/" className="muted" style={{ textAlign: "center", fontSize: 14 }}>← Back to contests</Link>
      </form>
    </main>
  );
}
