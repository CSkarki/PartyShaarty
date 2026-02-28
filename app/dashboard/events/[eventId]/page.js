"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
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
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const importFileRef = useRef(null);

  // Lifecycle state
  const [launching, setLaunching] = useState(false);
  const [launchConfirm, setLaunchConfirm] = useState(false);
  const [launchError, setLaunchError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showDeleteRequest, setShowDeleteRequest] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [deletionRequestSent, setDeletionRequestSent] = useState(false);

  const opts = { credentials: "include" };

  async function loadEvent() {
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

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
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

  async function toggleQr() {
    if (showQr) { setShowQr(false); return; }
    if (!qrDataUrl && event?.slug) {
      const url = `${window.location.origin}/${event.slug}/invite`;
      const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 2, color: { dark: "#2a1f00", light: "#faf7f2" } });
      setQrDataUrl(dataUrl);
    }
    setShowQr(true);
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${event?.slug || "invite"}-qr.png`;
    a.click();
  }

  async function handleLaunch() {
    if (!launchConfirm) { setLaunchConfirm(true); return; }
    setLaunching(true);
    setLaunchError(null);
    try {
      const res = await fetch(`/api/host/events/${eventId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "launch" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Launch failed");
      setLaunchConfirm(false);
      await loadEvent();
    } catch (err) {
      setLaunchError(err.message);
    } finally {
      setLaunching(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/host/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Delete failed");
        setDeleting(false);
        setDeleteConfirm(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      alert("Network error. Please try again.");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  async function handleRequestDeletion(e) {
    e.preventDefault();
    setRequestingDeletion(true);
    try {
      const res = await fetch(`/api/host/events/${eventId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_deletion", reason: deleteReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setDeletionRequestSent(true);
      setShowDeleteRequest(false);
      await loadEvent();
    } catch (err) {
      alert(err.message);
    } finally {
      setRequestingDeletion(false);
    }
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
  const setupSteps = [hasEventDetails, hasCoverPhoto, hasRsvps].filter(Boolean).length;

  const isLive = event?.status === "active";
  const isDraft = !isLive;

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
        <a href="/" className={styles.navBrand}>
          <span className={styles.navLogo}>✦</span>
          <span className={styles.navName}>Utsavé</span>
        </a>
        <div className={styles.navRight}>
          <a href="/dashboard" className={styles.navViewInvite}>← All Events</a>
          {event?.slug && (
            <a href={`/${event.slug}/invite`} target="_blank" rel="noreferrer" className={styles.navViewInvite}>
              View Invite ↗
            </a>
          )}
          {event?.slug && (
            <a href={`/${event.slug}/memory`} target="_blank" rel="noreferrer" className={styles.navViewInvite}>
              Memories ✦
            </a>
          )}
          <button type="button" onClick={handleLogout} className={styles.navLogout}>Log out</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Welcome Banner */}
        <section className={styles.welcomeBanner}>
          <div className={styles.welcomeText}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
              <h1 className={styles.welcomeTitle}>
                {event?.event_name || "Untitled Event"}
              </h1>
              {isDraft
                ? <span className={styles.statusDraft}>Draft</span>
                : <span className={styles.statusLive}>● Live</span>
              }
            </div>
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem" }}>
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
            {/* Launch button */}
            {isDraft && (
              <div style={{ textAlign: "right" }}>
                {launchConfirm ? (
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Confirm launch?</span>
                    <button
                      type="button"
                      onClick={handleLaunch}
                      disabled={launching}
                      className={styles.btnLaunch}
                    >
                      {launching ? "Launching…" : "Yes, Go Live →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaunchConfirm(false)}
                      className={styles.btnOutlineSmall}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={handleLaunch} className={styles.btnLaunch}>
                    🚀 Launch Event
                  </button>
                )}
                {launchError && (
                  <p style={{ fontSize: "0.8rem", color: "var(--error)", marginTop: "0.35rem" }}>{launchError}</p>
                )}
              </div>
            )}
          </div>
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
                <p className={styles.cardSub}>
                  {isLive ? "Your event is live" : "Complete these steps to go live"}
                </p>
              </div>
              {isDraft && (
                <div className={styles.setupProgress}>
                  <span className={styles.setupProgressText}>{setupSteps}/3</span>
                  <div className={styles.setupProgressBar}>
                    <div className={styles.setupProgressFill} style={{ width: `${(setupSteps / 3) * 100}%` }} />
                  </div>
                </div>
              )}
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
                {!hasEventDetails && isDraft && (
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
                {!hasCoverPhoto && isDraft && (
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
                {!hasRsvps && event?.slug && isDraft && (
                  <button type="button" onClick={copyInviteLink} className={styles.checkAction}>
                    {copied ? "Copied!" : "Copy link →"}
                  </button>
                )}
              </li>
            </ul>

            {isLive && (
              <div className={styles.setupComplete}>
                ✦ Event is live — guests can now RSVP!
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
                  <span className={styles.actionDesc}>{isLive ? "View details (locked)" : "Details & cover photo"}</span>
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
              <button
                type="button"
                onClick={toggleQr}
                className={`${styles.actionItem} ${showQr ? styles.actionItemActive : ""}`}
              >
                <span className={styles.actionIcon}>◫</span>
                <div>
                  <span className={styles.actionLabel}>QR Code</span>
                  <span className={styles.actionDesc}>Print for table cards</span>
                </div>
              </button>
              {event?.slug && (
                <a
                  href={`/${event.slug}/slideshow`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.actionItem}
                >
                  <span className={styles.actionIcon}>▶</span>
                  <div>
                    <span className={styles.actionLabel}>Live Slideshow</span>
                    <span className={styles.actionDesc}>For projector or TV</span>
                  </div>
                </a>
              )}
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

        {/* QR Code Panel */}
        {showQr && (
          <section className={styles.importPanel}>
            <div className={styles.importHeader}>
              <h3 className={styles.importTitle}>QR Code — {event?.event_name}</h3>
              <button type="button" onClick={() => setShowQr(false)} className={styles.importClose}>✕</button>
            </div>
            <p className={styles.importNote}>
              Guests scan this QR code to open your invite page and RSVP instantly — no typing needed.
            </p>
            <div className={styles.qrContent}>
              {qrDataUrl && <img src={qrDataUrl} alt="Invite QR code" className={styles.qrImage} />}
              <div className={styles.qrActions}>
                <button type="button" onClick={downloadQr} className={styles.btnPrimary}>
                  Download PNG
                </button>
                <a href={inviteUrl} target="_blank" rel="noreferrer" className={styles.btnOutline}>
                  Preview invite ↗
                </a>
              </div>
              <p className={styles.qrUrl}>{inviteUrl}</p>
            </div>
          </section>
        )}

        {/* ── Danger Zone ── */}
        <section className={styles.dangerZone}>
          <h3 className={styles.dangerZoneTitle}>
            {isDraft ? "Delete Event" : "Request Deletion"}
          </h3>
          {isDraft ? (
            <>
              <p className={styles.dangerZoneDesc}>
                This will permanently delete the event, all RSVPs, and any uploaded photos. This cannot be undone.
              </p>
              {deleteConfirm ? (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--error)", fontWeight: 500 }}>
                    Are you sure? This is permanent.
                  </span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`${styles.btnDanger} ${styles.btnDangerSolid}`}
                  >
                    {deleting ? "Deleting…" : "Yes, Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className={styles.btnOutlineSmall}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" onClick={handleDelete} className={styles.btnDanger}>
                  Delete this event
                </button>
              )}
            </>
          ) : (
            <>
              <p className={styles.dangerZoneDesc}>
                Live events cannot be self-deleted. Submit a request and our team will review and process it.
                {event?.deletion_requested && (
                  <strong style={{ display: "block", marginTop: "0.4rem", color: "var(--error)" }}>
                    ✓ Deletion request already submitted.
                  </strong>
                )}
              </p>
              {deletionRequestSent && (
                <p style={{ color: "#16a34a", fontSize: "0.875rem", fontWeight: 500 }}>
                  ✓ Deletion request sent. Our team will be in touch.
                </p>
              )}
              {!event?.deletion_requested && !deletionRequestSent && (
                showDeleteRequest ? (
                  <form onSubmit={handleRequestDeletion} className={styles.deleteRequestForm}>
                    <textarea
                      className={styles.deleteReasonTextarea}
                      placeholder="Why do you want to delete this event? (optional)"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      rows={3}
                      maxLength={500}
                    />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="submit"
                        disabled={requestingDeletion}
                        className={`${styles.btnDanger} ${styles.btnDangerSolid}`}
                      >
                        {requestingDeletion ? "Sending…" : "Send Deletion Request"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteRequest(false)}
                        className={styles.btnOutlineSmall}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteRequest(true)}
                    className={styles.btnDanger}
                  >
                    Request event deletion
                  </button>
                )
              )}
            </>
          )}
        </section>

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
