"use client";
import { useEffect, useState } from "react";
import { api, contestStatus } from "./lib/api";
import ContestRow from "./components/ContestRow";

const groups = [
  ["live", "Live now"],
  ["upcoming", "Upcoming"],
  ["ended", "Past contests"],
];

export default function Home() {
  const [contests, setContests] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/contests").then(setContests).catch((e) => setError(e.message));
  }, []);

  return (
    <main className="container page">
      <section className="hero">
        <span className="pill live">Programming contests</span>
        <h1 style={{ marginTop: 14 }}>Solve problems. Submit C++. Climb the board.</h1>
        <p className="muted">Join a live contest with the credentials from your organiser, read the problems and upload your solutions before the clock runs out.</p>
      </section>

      {error && <p className="alert">Could not load contests: {error}. Is the API running?</p>}
      {!contests && !error && <div className="contest-list">{[0, 1, 2].map((i) => <div key={i} className="card skeleton" />)}</div>}
      {contests && contests.length === 0 && <div className="card empty">No contests yet.</div>}
      {contests &&
        groups.map(([key, title]) => {
          const list = contests.filter((c) => contestStatus(c).key === key);
          if (!list.length) return null;
          return (
            <section key={key}>
              <div className="section-head"><h2>{title}</h2><span className="muted">{list.length}</span></div>
              <div className="contest-list">{list.map((c) => <ContestRow key={c._id} contest={c} />)}</div>
            </section>
          );
        })}
    </main>
  );
}
