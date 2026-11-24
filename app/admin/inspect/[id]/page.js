"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api, API_URL, contestStatus, fmtDate } from "../../../lib/api";

export default function ContestInspectPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) return router.replace("/adminlogin");
    api(`/api/admin/contest/${id}`, { token })
      .then(setContest)
      .catch((e) => {
        if (e.message.includes("authentication")) {
          Cookies.remove("adminToken");
          router.replace("/adminlogin");
        } else setError(e.message);
      });
  }, [id, router]);

  if (error) return <main className="container page"><p className="alert">{error}</p></main>;
  if (!contest) return <main className="container page"><div className="card skeleton" /></main>;

  const status = contestStatus(contest);
  const questionName = (qid) => contest.questions.find((q) => q.questionId === qid)?.name || qid;
  const submissions = contest.allowedUsers.flatMap((u) => u.submissions.map((s) => ({ ...s, username: u.username })));

  return (
    <main className="container page">
      <Link href="/admin-dashboard" className="muted">← Dashboard</Link>
      <div className="card panel" style={{ marginTop: 14 }}>
        <span className={`pill ${status.key}`}>{status.label}</span>
        <h1>{contest.name}</h1>
        <p className="muted">{contest.description}</p>
        <div className="stat-grid">
          <div className="stat"><span>Author</span><strong>{contest.author}</strong></div>
          <div className="stat"><span>Starts</span><strong>{fmtDate(contest.startTime)}</strong></div>
          <div className="stat"><span>Ends</span><strong>{fmtDate(contest.endTime)}</strong></div>
          <div className="stat"><span>Submissions</span><strong>{submissions.length}</strong></div>
        </div>
      </div>

      <div className="admin-grid" style={{ marginTop: 20 }}>
        <div className="card panel">
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Problems</h2>
          <table className="table">
            <thead><tr><th>#</th><th>Title</th><th>Statement</th></tr></thead>
            <tbody>
              {contest.questions.map((q) => (
                <tr key={q.questionId}>
                  <td><span className="qid">{q.questionId}</span></td>
                  <td>{q.name}</td>
                  <td>{q.conditionUrl ? <a className="link" href={q.conditionUrl} target="_blank" rel="noopener noreferrer">Open</a> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card panel">
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Participants</h2>
          <table className="table">
            <thead><tr><th>Username</th><th>Password</th><th>Submissions</th></tr></thead>
            <tbody>
              {contest.allowedUsers.map((u) => (
                <tr key={u.userId}><td>{u.username}</td><td className="mono">{u.password}</td><td>{u.submissions.length}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card panel" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Submissions</h2>
        {submissions.length === 0 ? <p className="muted">No submissions yet.</p> : (
          <table className="table">
            <thead><tr><th>Participant</th><th>Problem</th><th>Submitted</th><th>Result</th><th>File</th></tr></thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr key={s._id || i}>
                  <td>{s.username}</td>
                  <td>{questionName(s.questionId)}</td>
                  <td>{s.submittedAt ? fmtDate(s.submittedAt) : "—"}</td>
                  <td>{s.result}</td>
                  <td><a className="link" href={`${API_URL}/api/files/${encodeURIComponent(s.filePath.replace(/^files\//, ""))}`}>Download</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
