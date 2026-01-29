"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function HostPage() {
  const [loggedIn, setLoggedIn] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const opts = { credentials: "include" };

  useEffect(() => {
    fetch("/api/auth/check", opts)
      .then((r) => {
        if (r.ok) {
          setLoggedIn(true);
          return fetch("/api/rsvp/list", opts).then((res) => res.json());
        }
        setLoggedIn(false);
        return [];
      })
      .then((data) => {
        setRsvps(Array.isArray(data) ? data : []);
      })
      .catch(() => setLoggedIn(false))
      .finally(() => setLoading(false));
  }, [loggedIn === true]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoginError(data.error || "Login failed");
      return;
    }
    setLoggedIn(true);
    const listRes = await fetch("/api/rsvp/list", opts);
    const list = await listRes.json().catch(() => []);
    setRsvps(Array.isArray(list) ? list : []);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setLoggedIn(false);
    setRsvps([]);
  }

  if (loading) {
    return (
      <main className={styles.host}>
        <p className={styles.loading}>Loading…</p>
      </main>
    );
  }

  if (loggedIn !== true) {
    return (
      <main className={styles.host}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>Host login</h1>
          <p className={styles.loginSubtitle}>View and download RSVPs</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {loginError && <p className={styles.error}>{loginError}</p>}
            <button type="submit" className={styles.submit}>
              Log in
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.host}>
      <div className={styles.header}>
        <h1 className={styles.title}>RSVPs</h1>
        <div className={styles.actions}>
          <a href="/api/export" download="rsvps.xlsx" className={styles.download}>
            Download Excel
          </a>
          <a href="/api/export/json" download="rsvps.json" className={styles.download}>
            Download JSON
          </a>
          <button type="button" onClick={handleLogout} className={styles.logout}>
            Log out
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {rsvps.length === 0 ? (
          <p className={styles.empty}>No RSVPs yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Name</th>
                <th>Email</th>
                <th>Attending</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r, i) => (
                <tr key={i}>
                  <td>{r.timestamp}</td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.attending}</td>
                  <td>{r.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
