"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "../lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Cookies.get("adminToken")) router.replace("/admin-dashboard");
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/admin/login", { method: "POST", body: { username, password } });
      Cookies.set("adminToken", data.token, { expires: 1, sameSite: "strict" });
      Cookies.set("adminName", data.authorname || data.username, { expires: 1, sameSite: "strict" });
      window.location.href = "/admin-dashboard";
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <form className="card auth-card form" onSubmit={handleLogin}>
        <div>
          <h1>Admin login</h1>
          <p className="muted">Manage contests, participants and submissions.</p>
        </div>
        <label className="field">Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required /></label>
        <label className="field">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {error && <p className="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
