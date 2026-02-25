"use client";

import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [configMissing, setConfigMissing] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importFileRef = useRef(null);

  const opts = { credentials: "include" };

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) { setConfigMissing(true); setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // Load host profile for invite link
      const { data: hp } = await supabase
        .from("host_profiles")
        .select("slug, display_name")
        .eq("user_id", user.id)
        .single();
      setProfile(hp);

      // Load RSVPs
      const res = await fetch("/api/rsvp/list", opts);
      if (res.ok) {
        const data = await res.json();
        setRsvps(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/auth/login");
    router.refresh();
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("file", importFile);
    try {
      const res = await fetch("/api/rsvp/import", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) { setImportResult({ error: data.error || "Import failed" }); return; }
      setImportResult(data);
      if (data.imported > 0) {
        const r = await fetch("/api/rsvp/list", opts);
        if (r.ok) { const d = await r.json(); setRsvps(Array.isArray(d) ? d : []); }
      }
    } catch {
      setImportResult({ error: "Network error during import" });
    } finally {
      setImporting(false);
      setImportFile(null);
      if (importFileRef.current) importFileRef.current.value = "";
    }
  }

  if (loading) {
    return <main className={styles.host}><p className={styles.loading}>Loading…</p></main>;
  }
  if (configMissing) {
    return (
      <main className={styles.host}>
        <p className={styles.loading}>
          Supabase is not configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>.
        </p>
      </main>
    );
  }

  const inviteUrl = profile ? `${window.location.origin}/${profile.slug}/invite` : "";

  return (
    <main className={styles.host}>
      <div className={styles.header}>
        <h1 className={styles.title}>RSVPs</h1>
        <div className={styles.actions}>
          <a href="/dashboard/event" className={styles.download}>Event Settings</a>
          <a href="/dashboard/reminders" className={styles.download}>Send Reminders</a>
          <a href="/dashboard/thankyou" className={styles.download}>Send Thank You</a>
          <a href="/dashboard/gallery" className={styles.download}>Manage Gallery</a>
          <a href="/api/export" download="rsvps.xlsx" className={styles.download}>Download Excel</a>
          <a href="/api/export/json" download="rsvps.json" className={styles.download}>Download JSON</a>
          {profile && (
            <a href={`/${profile.slug}/invite`} target="_blank" rel="noreferrer" className={styles.download}>
              Guest Invite ↗
            </a>
          )}
          <button type="button" onClick={handleLogout} className={styles.logout}>
            Log out
          </button>
        </div>
      </div>

      {profile?.slug && (
        <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Share your invite link:{" "}
          <a href={`/${profile.slug}/invite`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
            {inviteUrl}
          </a>
        </div>
      )}

      <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Import RSVPs from CSV</h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          Columns marked <strong>*</strong> are required. <em>Attending</em> must be &quot;Yes&quot; or &quot;No&quot;.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <a href="/api/rsvp/template" download="rsvp-template.csv" className={styles.download}>
            Download Template
          </a>
          <input
            ref={importFileRef}
            type="file"
            accept=".csv"
            onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
            style={{ fontSize: "0.875rem" }}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={!importFile || importing}
            className={styles.download}
            style={{ opacity: !importFile || importing ? 0.5 : 1, cursor: !importFile || importing ? "not-allowed" : "pointer" }}
          >
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
        {importResult && (
          <div style={{ marginTop: "0.75rem", fontSize: "0.875rem" }}>
            {importResult.error ? (
              <p style={{ color: "#e55" }}>{importResult.error}</p>
            ) : (
              <>
                <p style={{ color: "var(--accent)" }}>{importResult.imported} imported, {importResult.skipped} skipped.</p>
                {importResult.errors?.length > 0 && (
                  <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem", color: "var(--text-muted)" }}>
                    {importResult.errors.map((e, i) => <li key={i}>Row {e.row}: {e.reason}</li>)}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
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
