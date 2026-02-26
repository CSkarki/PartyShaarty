"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../page.module.css";

export default function EventDashboardPage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const importFileRef = useRef(null);

  const opts = { credentials: "include" };

  useEffect(() => {
    async function load() {
      const [evRes, rsvpRes] = await Promise.all([
        fetch(`/api/host/events/${eventId}`, opts),
        fetch(`/api/rsvp/list?eventId=${eventId}`, opts),
      ]);
      if (!evRes.ok) { router.push("/dashboard"); return; }
      const ev = await evRes.json();
      setEvent(ev);
      if (rsvpRes.ok) {
        const data = await rsvpRes.json();
        setRsvps(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }
    load();
  }, [eventId]);

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
    fd.append("eventId", eventId);
    try {
      const res = await fetch("/api/rsvp/import", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) { setImportResult({ error: data.error || "Import failed" }); return; }
      setImportResult(data);
      if (data.imported > 0) {
        const r = await fetch(`/api/rsvp/list?eventId=${eventId}`, opts);
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

  async function copyInviteLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading event…</p>
      </div>
    );
  }

  const inviteUrl = event ? `${window.location.origin}/${event.slug}/invite` : "";
  const totalRsvps = rsvps.length;
  const attending = rsvps.filter(r => r.attending === "Yes").length;
  const declined = rsvps.filter(r => r.attending === "No").length;
  const acceptanceRate = totalRsvps > 0 ? Math.round((attending / totalRsvps) * 100) : 0;

  const hasEventDetails = !!(event?.event_name && event?.event_date);
  const hasCoverPhoto = !!event?.event_image_path;
  const hasRsvps = totalRsvps > 0;
  const setupComplete = hasEventDetails && hasCoverPhoto && hasRsvps;
  const setupSteps = [hasEventDetails, hasCoverPhoto, hasRsvps].filter(Boolean).length;

  function getDaysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  }
  const daysUntil = getDaysUntil(event?.event_date);

  const filteredRsvps = rsvpFilter === "all"
    ? rsvps
    : rsvps.filter(r => r.attending === (rsvpFilter === "yes" ? "Yes" : "No"));

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.navBrand}>
          <span className={styles.navLogo}>✦</span>
          <span className={styles.navName}>Utsavé</span>
        </div>
        <div className={styles.navRight}>
          <a href="/dashboard" className={styles.navViewInvite}>← All Events</a>
          {event?.slug && (
            <a href={`/${event.slug}/invite`} target="_blank" rel="noreferrer" className={styles.navViewInvite}>
              View Invite ↗
            </a>
          )}
          <button type="button" onClick={handleLogout} className={styles.navLogout}>Log out</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Welcome Banner */}
        <section className={styles.welcomeBanner}>
          <div className={styles.welcomeText}>
            <h1 className={styles.welcomeTitle}>
              {event?.event_name || "Untitled Event"}
            </h1>
            <p className={styles.welcomeSub}>
              {event?.event_date ? (
                <>
                  {event.event_date}
                  {daysUntil !== null && daysUntil > 0 && (
                    <span className={styles.countdown}> · {daysUntil} days to go</span>
                  )}
                  {daysUntil !== null && daysUntil === 0 && (
                    <span className={styles.countdownToday}> · Today!</span>
                  )}
                  {daysUntil !== null && daysUntil < 0 && (
                    <span className={styles.countdownPast}> · Completed</span>
                  )}
                </>
              ) : (
                <a href={`/dashboard/events/${eventId}/settings`} className={styles.noEventLink}>
                  Set up your event details →
                </a>
              )}
            </p>
          </div>
          {event?.slug && (
            <div className={styles.inviteShareBox}>
              <span className={styles.inviteShareLabel}>Invite link</span>
              <div className={styles.inviteShareRow}>
                <a href={inviteUrl} target="_blank" rel="noreferrer" className={styles.inviteShareLink}>
                  {inviteUrl.replace("https://", "")}
                </a>
                <button type="button" onClick={copyInviteLink} className={styles.copyBtn}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Stats Row */}
        <section className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{totalRsvps}</span>
            <span className={styles.statLabel}>Total RSVPs</span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardGreen}`}>
            <span className={styles.statNumber}>{attending}</span>
            <span className={styles.statLabel}>Attending</span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardRed}`}>
            <span className={styles.statNumber}>{declined}</span>
            <span className={styles.statLabel}>Declined</span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardAccent}`}>
            <span className={styles.statNumber}>{acceptanceRate}%</span>
            <span className={styles.statLabel}>Acceptance Rate</span>
          </div>
        </section>

        {/* Setup + Actions Row */}
        <section className={styles.midRow}>
          <div className={styles.setupCard}>
            <div className={styles.cardTitleRow}>
              <div>
                <h2 className={styles.cardTitle}>Event Setup</h2>
                <p className={styles.cardSub}>Complete these steps to go live</p>
              </div>
              <div className={styles.setupProgress}>
                <span className={styles.setupProgressText}>{setupSteps}/3</span>
                <div className={styles.setupProgressBar}>
                  <div className={styles.setupProgressFill} style={{ width: `${(setupSteps / 3) * 100}%` }} />
                </div>
              </div>
            </div>

            <ul className={styles.checkList}>
              <li className={`${styles.checkItem} ${hasEventDetails ? styles.checkDone : ""}`}>
                <span className={`${styles.checkIcon} ${hasEventDetails ? styles.checkIconDone : ""}`}>
                  {hasEventDetails ? "✓" : "1"}
                </span>
                <div className={styles.checkBody}>
                  <span className={styles.checkLabel}>Add event details</span>
                  <span className={styles.checkDesc}>Name, date, location &amp; message</span>
                </div>
                {!hasEventDetails && (
                  <a href={`/dashboard/events/${eventId}/settings`} className={styles.checkAction}>Set up →</a>
                )}
              </li>
              <li className={`${styles.checkItem} ${hasCoverPhoto ? styles.checkDone : ""}`}>
                <span className={`${styles.checkIcon} ${hasCoverPhoto ? styles.checkIconDone : ""}`}>
                  {hasCoverPhoto ? "✓" : "2"}
                </span>
                <div className={styles.checkBody}>
                  <span className={styles.checkLabel}>Upload a cover photo</span>
                  <span className={styles.checkDesc}>Make your invite page beautiful</span>
                </div>
                {!hasCoverPhoto && (
                  <a href={`/dashboard/events/${eventId}/settings`} className={styles.checkAction}>Upload →</a>
                )}
              </li>
              <li className={`${styles.checkItem} ${hasRsvps ? styles.checkDone : ""}`}>
                <span className={`${styles.checkIcon} ${hasRsvps ? styles.checkIconDone : ""}`}>
                  {hasRsvps ? "✓" : "3"}
                </span>
                <div className={styles.checkBody}>
                  <span className={styles.checkLabel}>Share &amp; collect RSVPs</span>
                  <span className={styles.checkDesc}>Send your invite link to guests</span>
                </div>
                {!hasRsvps && event?.slug && (
                  <button type="button" onClick={copyInviteLink} className={styles.checkAction}>
                    {copied ? "Copied!" : "Copy link →"}
                  </button>
                )}
              </li>
            </ul>

            {setupComplete && (
              <div className={styles.setupComplete}>
                ✦ Your event is all set — enjoy the party!
              </div>
            )}
          </div>

          <div className={styles.actionsCard}>
            <h2 className={styles.cardTitle}>Manage Event</h2>
            <p className={styles.cardSub}>All your tools in one place</p>
            <div className={styles.actionGrid}>
              <a href={`/dashboard/events/${eventId}/settings`} className={styles.actionItem}>
                <span className={styles.actionIcon}>⚙</span>
                <div>
                  <span className={styles.actionLabel}>Event Settings</span>
                  <span className={styles.actionDesc}>Details &amp; cover photo</span>
                </div>
              </a>
              <a href={`/dashboard/events/${eventId}/gallery`} className={styles.actionItem}>
                <span className={styles.actionIcon}>⬡</span>
                <div>
                  <span className={styles.actionLabel}>Photo Gallery</span>
                  <span className={styles.actionDesc}>Upload &amp; share albums</span>
                </div>
              </a>
              <a href="/dashboard/reminders" className={styles.actionItem}>
                <span className={styles.actionIcon}>✉</span>
                <div>
                  <span className={styles.actionLabel}>Send Reminders</span>
                  <span className={styles.actionDesc}>Email or WhatsApp</span>
                </div>
              </a>
              <a href="/dashboard/thankyou" className={styles.actionItem}>
                <span className={styles.actionIcon}>♡</span>
                <div>
                  <span className={styles.actionLabel}>Send Thank You</span>
                  <span className={styles.actionDesc}>After the event</span>
                </div>
              </a>
              <a href={`/api/export?eventId=${eventId}`} download="rsvps.xlsx" className={styles.actionItem}>
                <span className={styles.actionIcon}>↓</span>
                <div>
                  <span className={styles.actionLabel}>Export Excel</span>
                  <span className={styles.actionDesc}>Download guest list</span>
                </div>
              </a>
              <button
                type="button"
                onClick={() => setShowImport(v => !v)}
                className={`${styles.actionItem} ${showImport ? styles.actionItemActive : ""}`}
              >
                <span className={styles.actionIcon}>↑</span>
                <div>
                  <span className={styles.actionLabel}>Import CSV</span>
                  <span className={styles.actionDesc}>Bulk add RSVPs</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* CSV Import Panel */}
        {showImport && (
          <section className={styles.importPanel}>
            <div className={styles.importHeader}>
              <h3 className={styles.importTitle}>Import RSVPs from CSV</h3>
              <button
                type="button"
                onClick={() => { setShowImport(false); setImportResult(null); }}
                className={styles.importClose}
              >
                ✕
              </button>
            </div>
            <p className={styles.importNote}>
              Columns marked <strong>*</strong> are required. <em>Attending</em> must be &quot;Yes&quot; or &quot;No&quot;.
            </p>
            <div className={styles.importActions}>
              <a href="/api/rsvp/template" download="rsvp-template.csv" className={styles.btnOutline}>
                Download Template
              </a>
              <input
                ref={importFileRef}
                type="file"
                accept=".csv"
                onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
                className={styles.fileInput}
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={!importFile || importing}
                className={styles.btnPrimary}
              >
                {importing ? "Importing…" : "Import"}
              </button>
            </div>
            {importResult && (
              <div className={styles.importResult}>
                {importResult.error ? (
                  <p className={styles.resultError}>{importResult.error}</p>
                ) : (
                  <>
                    <p className={styles.resultSuccess}>
                      {importResult.imported} imported, {importResult.skipped} skipped.
                    </p>
                    {importResult.errors?.length > 0 && (
                      <ul className={styles.resultErrors}>
                        {importResult.errors.map((e, i) => <li key={i}>Row {e.row}: {e.reason}</li>)}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* Guest List / RSVPs */}
        <section className={styles.rsvpSection}>
          <div className={styles.rsvpHeader}>
            <div>
              <h2 className={styles.rsvpTitle}>Guest List</h2>
              <span className={styles.rsvpCount}>
                {totalRsvps} {totalRsvps === 1 ? "response" : "responses"}
              </span>
            </div>
            <div className={styles.rsvpControls}>
              <div className={styles.filterTabs}>
                <button
                  className={`${styles.filterTab} ${rsvpFilter === "all" ? styles.filterTabActive : ""}`}
                  onClick={() => setRsvpFilter("all")}
                >
                  All ({totalRsvps})
                </button>
                <button
                  className={`${styles.filterTab} ${rsvpFilter === "yes" ? styles.filterTabActive : ""}`}
                  onClick={() => setRsvpFilter("yes")}
                >
                  Attending ({attending})
                </button>
                <button
                  className={`${styles.filterTab} ${rsvpFilter === "no" ? styles.filterTabActive : ""}`}
                  onClick={() => setRsvpFilter("no")}
                >
                  Declined ({declined})
                </button>
              </div>
              <a href={`/api/export?eventId=${eventId}`} download="rsvps.xlsx" className={styles.btnOutlineSmall}>
                Export ↓
              </a>
            </div>
          </div>

          <div className={styles.tableWrap}>
            {filteredRsvps.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>No responses yet</p>
                <p className={styles.emptyText}>Share your invite link to start collecting RSVPs.</p>
                {event?.slug && totalRsvps === 0 && (
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className={styles.btnPrimary}
                    style={{ marginTop: "1.25rem" }}
                  >
                    {copied ? "Copied!" : "Copy Invite Link"}
                  </button>
                )}
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Message</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRsvps.map((r, i) => (
                    <tr key={i}>
                      <td className={styles.tdName}>{r.name}</td>
                      <td className={styles.tdEmail}>{r.email}</td>
                      <td>
                        <span className={`${styles.badge} ${r.attending === "Yes" ? styles.badgeYes : styles.badgeNo}`}>
                          {r.attending === "Yes" ? "Attending" : "Declined"}
                        </span>
                      </td>
                      <td className={styles.tdMsg}>{r.message || <span className={styles.noMsg}>—</span>}</td>
                      <td className={styles.tdDate}>
                        {r.timestamp
                          ? new Date(r.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
