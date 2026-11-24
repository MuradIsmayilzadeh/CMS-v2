export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function api(path, { token, body, ...options } = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export function contestStatus(contest, now = Date.now()) {
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  if (now < start) return { key: "upcoming", label: "Upcoming" };
  if (now > end) return { key: "ended", label: "Ended" };
  return { key: "live", label: "Live" };
}

export function formatDuration(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const hh = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${d > 0 ? `${d}d ` : ""}${hh}:${mm}:${ss}`;
}

export const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
