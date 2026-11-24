import Link from "next/link";
import { contestStatus, fmtDate } from "../lib/api";

export default function ContestRow({ contest, href }) {
  const status = contestStatus(contest);
  const body = (
    <>
      <div>
        <span className={`pill ${status.key}`}>{status.label}</span>
        <h3>{contest.name}</h3>
        <div className="contest-meta">
          <span>by {contest.author}</span>
          <span>{(contest.questions || []).length} problems</span>
          {contest.participants !== undefined && <span>{contest.participants} participants</span>}
        </div>
      </div>
      <div className="contest-side">
        {status.key === "upcoming" && <>Starts<strong>{fmtDate(contest.startTime)}</strong></>}
        {status.key === "live" && <>Ends<strong>{fmtDate(contest.endTime)}</strong></>}
        {status.key === "ended" && <>Ended<strong>{fmtDate(contest.endTime)}</strong></>}
      </div>
    </>
  );
  if (status.key === "ended" && !href) return <div className={`card contest-row ended`}>{body}</div>;
  return <Link href={href || `/contest/${contest._id}`} className={`card contest-row ${status.key}`}>{body}</Link>;
}
