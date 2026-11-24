"use client";
import { useCallback, useEffect, useState } from "react";
import { api, API_URL, contestStatus, formatDuration, fmtDate } from "../../lib/api";

export default function ContestShower({ contestId, session, onLogout }) {
  const [contest, setContest] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => api(`/api/contest/${contestId}`).then(setContest).catch((e) => setError(e.message)), [contestId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (error) return <main className="container page"><p className="alert">{error}</p></main>;
  if (!contest) return <main className="container page"><div className="card skeleton" /></main>;

  const status = contestStatus(contest, now);
  const questions = contest.questions || [];
  const me = contest.allowedUsers.find((u) => u.userId === session.userId);
  const mySubs = (me?.submissions || []).slice().reverse();
  const question = questions.find((q) => q.questionId === selected);
  const subsFor = (qid) => mySubs.filter((s) => s.questionId === qid);

  const submit = async () => {
    if (!file) return setNotice({ ok: false, text: "Choose a .cpp file first." });
    setSubmitting(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.append("questionId", selected);
      form.append("file", file);
      await api(`/api/contest/${contestId}/submit`, { method: "POST", body: form, token: session.token });
      setFile(null);
      setNotice({ ok: true, text: "Solution submitted! It will be graded shortly." });
      load();
    } catch (e) {
      if (e.message.includes("log in")) onLogout();
      setNotice({ ok: false, text: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container arena">
      <aside className="card sidebar">
        <button className={`side-btn ${selected === null ? "active" : ""}`} onClick={() => setSelected(null)}>🏠 Overview</button>
        <h4>Problems</h4>
        {questions.length === 0 && <p className="muted" style={{ fontSize: 14, margin: "0 8px" }}>No problems yet.</p>}
        {questions.map((q) => (
          <button key={q.questionId} className={`side-btn ${selected === q.questionId ? "active" : ""}`} onClick={() => { setSelected(q.questionId); setFile(null); setNotice(null); }}>
            <span className="qid">{q.questionId}</span>
            {q.name}
            {subsFor(q.questionId).length > 0 && <span className="count">{subsFor(q.questionId).length}</span>}
          </button>
        ))}
        <h4>Signed in</h4>
        <div className="side-btn" style={{ cursor: "default" }}>👤 {session.username}</div>
        <button className="side-btn" onClick={onLogout}>↩ Leave contest</button>
      </aside>

      <section className="card panel">
        {!question ? (
          <>
            <span className={`pill ${status.key}`}>{status.label}</span>
            <h1>{contest.name}</h1>
            <p className="muted">{contest.description}</p>
            <div className="timer">
              <div className="timer-label">{status.key === "upcoming" ? "Starts in" : status.key === "live" ? "Time remaining" : "Contest finished"}</div>
              <div className="timer-value">
                {status.key === "upcoming" && formatDuration(new Date(contest.startTime) - now)}
                {status.key === "live" && formatDuration(new Date(contest.endTime) - now)}
                {status.key === "ended" && "00:00:00"}
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat"><span>Author</span><strong>{contest.author}</strong></div>
              <div className="stat"><span>Problems</span><strong>{questions.length}</strong></div>
              <div className="stat"><span>Starts</span><strong>{fmtDate(contest.startTime)}</strong></div>
              <div className="stat"><span>Ends</span><strong>{fmtDate(contest.endTime)}</strong></div>
            </div>
          </>
        ) : (
          <>
            <span className="qid">{question.questionId}</span>
            <h1>{question.name}</h1>
            {question.conditionUrl ? (
              <a className="btn" href={question.conditionUrl} target="_blank" rel="noopener noreferrer">📄 Open problem statement</a>
            ) : (
              <p className="muted">The problem statement will be shared by the organiser.</p>
            )}

            {status.key === "live" ? (
              <>
                <label className="dropzone">
                  <input type="file" accept=".cpp,.cc,.cxx" onChange={(e) => setFile(e.target.files[0] || null)} />
                  <strong>{file ? file.name : "Choose your .cpp solution"}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>{file ? `${(file.size / 1024).toFixed(1)} KB` : "C++ source, up to 10 MB"}</span>
                </label>
                <button className="btn btn-primary" onClick={submit} disabled={submitting || !file}>{submitting ? "Submitting…" : "Submit solution"}</button>
              </>
            ) : (
              <p className="alert" style={{ marginTop: 20 }}>{status.key === "upcoming" ? "Submissions open when the contest starts." : "This contest has ended. Submissions are closed."}</p>
            )}
            {notice && <p className={`alert ${notice.ok ? "ok" : ""}`} style={{ marginTop: 14 }}>{notice.text}</p>}

            <div className="subs">
              <h3>Your submissions</h3>
              {subsFor(question.questionId).length === 0 && <p className="muted" style={{ fontSize: 14 }}>No submissions yet.</p>}
              {subsFor(question.questionId).map((s, i) => (
                <div key={s._id || i} className="sub">
                  <span className="mono">{s.submittedAt ? fmtDate(s.submittedAt) : `#${i + 1}`}</span>
                  <span className="result">{/^\d+$/.test(String(s.result)) ? `${s.result}%` : s.result || "Pending"}</span>
                  <a className="link" href={`${API_URL}/api/files/${encodeURIComponent(s.filePath.replace(/^files\//, ""))}`}>Download</a>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
