"use client";

import { useState } from "react";
import styles from "../landing-config/page.module.css";

export default function DeletionRequestsPanel({ requests: initial }) {
  const [requests, setRequests] = useState(initial);
  const [busy, setBusy] = useState(null); // eventId currently being actioned

  async function handleDelete(eventId) {
    if (!confirm("Permanently delete this event and all its data? This cannot be undone.")) return;
    setBusy(eventId);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Delete failed");
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== eventId));
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDismiss(eventId) {
    setBusy(eventId);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Dismiss failed");
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== eventId));
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (requests.length === 0) {
    return (
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Deletion Requests</h2>
        <p className={styles.panelDesc} style={{ marginBottom: 0 }}>
          No pending deletion requests. 🎉
        </p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Deletion Requests</h2>
      <p className={styles.panelDesc}>
        {requests.length} pending {requests.length === 1 ? "request" : "requests"}.
        Review and either delete the event or dismiss the request.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {requests.map((r) => (
          <div key={r.id} style={{
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "1.1rem 1.25rem",
            background: "#fff8f8",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "1rem", color: "#1a1a1a" }}>
                  {r.event_name}
                </p>
                <p style={{ margin: "0 0 0.15rem", fontSize: "0.825rem", color: "#5c5c5c" }}>
                  Host: {r.host_display_name || "Unknown"} &nbsp;·&nbsp;
                  <a href={`/${r.slug}/invite`} target="_blank" rel="noreferrer" style={{ color: "#c9941a" }}>
                    /{r.slug}/invite ↗
                  </a>
                </p>
                {r.event_date && (
                  <p style={{ margin: "0 0 0.15rem", fontSize: "0.825rem", color: "#5c5c5c" }}>
                    Date: {r.event_date}
                  </p>
                )}
                <p style={{ margin: "0 0 0.15rem", fontSize: "0.825rem", color: "#5c5c5c" }}>
                  Requested: {new Date(r.deletion_requested_at).toLocaleString("en-IN", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
                {r.deletion_reason && (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#1a1a1a", fontStyle: "italic" }}>
                    &ldquo;{r.deletion_reason}&rdquo;
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  onClick={() => handleDismiss(r.id)}
                  disabled={busy === r.id}
                  style={{
                    padding: "0.45rem 0.9rem",
                    background: "none",
                    border: "1px solid #d8d4cd",
                    borderRadius: "7px",
                    fontSize: "0.825rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: "#5c5c5c",
                  }}
                >
                  {busy === r.id ? "…" : "Dismiss"}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={busy === r.id}
                  style={{
                    padding: "0.45rem 0.9rem",
                    background: "#dc2626",
                    border: "none",
                    borderRadius: "7px",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: "#fff",
                  }}
                >
                  {busy === r.id ? "…" : "Delete Event"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
