"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = [
  { value: "wedding_suite", icon: "💍", label: "Wedding Suite", special: true, detail: "5 linked functions" },
  { value: "birthday",      icon: "🎂", label: "Birthday" },
  { value: "diwali",        icon: "🪔", label: "Festival / Diwali" },
  { value: "puja",          icon: "🙏", label: "Puja / Ceremony" },
  { value: "namkaran",      icon: "👶", label: "Namkaran" },
  { value: "godh_bharai",   icon: "🌸", label: "Godh Bharai" },
  { value: "graduation",    icon: "🎓", label: "Graduation" },
  { value: "other",         icon: "✦",  label: "Other" },
];

const DEFAULT_WEDDING_FUNCTIONS = [
  { key: "mehndi",    name: "Mehndi",     date: "", included: true },
  { key: "haldi",     name: "Haldi",      date: "", included: true },
  { key: "sangeet",   name: "Sangeet",    date: "", included: true },
  { key: "wedding",   name: "Wedding",    date: "", included: true },
  { key: "reception", name: "Reception",  date: "", included: true },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventCard({ event, getDaysUntil, onDeleted }) {
  const typeOpt = EVENT_TYPE_OPTIONS.find((t) => t.value === event.event_type)
    || EVENT_TYPE_OPTIONS.find((t) => t.value === "other");
  const daysUntil = getDaysUntil(event.event_date);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = `${origin}/${event.slug}/invite`;
  const isLive = event.status === "active";

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/host/events/${event.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        onDeleted(event.id);
      } else {
        const data = await res.json();
        alert(data.error || "Delete failed");
        setDeleting(false);
        setDeleteConfirm(false);
      }
    } catch {
      alert("Network error. Please try again.");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventCardTop}>
        <div className={styles.eventCardTitleRow}>
          <span className={styles.eventTypeChip}>{typeOpt.icon}</span>
          <h2 className={styles.eventCardName}>{event.event_name || "Untitled"}</h2>
          {isLive
            ? <span className={styles.statusLive}>● Live</span>
            : <span className={styles.statusDraft}>Draft</span>
          }
        </div>
        {event.event_date && <span className={styles.eventCardDate}>{event.event_date}</span>}
        {daysUntil !== null && (
          <span className={
            daysUntil > 0 ? styles.countdown :
            daysUntil === 0 ? styles.countdownToday :
            styles.countdownPast
          }>
            {daysUntil > 0 ? `${daysUntil} days to go` :
             daysUntil === 0 ? "Today!" : "Completed"}
          </span>
        )}
        {event.event_location && (
          <span className={styles.eventCardMeta}>{event.event_location}</span>
        )}
      </div>
      <div className={styles.eventCardLink}>
        <a href={inviteUrl} target="_blank" rel="noreferrer" className={styles.inviteShareLink}>
          {inviteUrl.replace(/^https?:\/\//, "")}
        </a>
      </div>
      <div className={styles.eventCardActions}>
        <a href={`/dashboard/events/${event.id}`} className={styles.btnPrimary}>Manage →</a>
        <a href={`/${event.slug}/invite`} target="_blank" rel="noreferrer" className={styles.btnOutlineSmall}>
          View Invite ↗
        </a>
        {!isLive && (
          deleteConfirm ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={`${styles.btnDanger} ${styles.btnDangerSolid}`}
                style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}
              >
                {deleting ? "…" : "Confirm?"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className={styles.btnOutlineSmall}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              className={styles.btnDanger}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}
            >
              Delete
            </button>
          )
        )}
      </div>
    </div>
  );
}

function GroupCard({ group, getDaysUntil }) {
  return (
    <div className={styles.groupCard}>
      <div className={styles.groupCardHeader}>
        <div className={styles.groupCardLeft}>
          <span className={styles.groupCardIcon}>💍</span>
          <div>
            <h2 className={styles.groupCardName}>{group.name}</h2>
            <span className={styles.groupCardBadge}>
              Wedding Suite · {group.events.length} function{group.events.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.groupFunctions}>
        {group.events.map((fn) => {
          const daysUntil = getDaysUntil(fn.event_date);
          return (
            <a key={fn.id} href={`/dashboard/events/${fn.id}`} className={styles.groupFunctionRow}>
              <span className={styles.groupFunctionName}>{fn.event_name}</span>
              <span className={styles.groupFunctionMeta}>
                {fn.event_date && <span>{fn.event_date}</span>}
                {daysUntil !== null && (
                  <span className={daysUntil > 0 ? styles.countdown : daysUntil === 0 ? styles.countdownToday : styles.countdownPast}>
                    {daysUntil > 0 ? `${daysUntil}d` : daysUntil === 0 ? "Today!" : "Done"}
                  </span>
                )}
              </span>
              <span className={styles.groupFunctionArrow}>→</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configMissing, setConfigMissing] = useState(false);

  // Create flow state
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState("type"); // "type" | "event" | "suite"
  const [selectedType, setSelectedType] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  // Regular event form
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  // Wedding Suite form
  const [suiteName, setSuiteName] = useState("");
  const [suiteFunctions, setSuiteFunctions] = useState(DEFAULT_WEDDING_FUNCTIONS);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) { setConfigMissing(true); setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: hp } = await supabase
        .from("host_profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      setProfile(hp);

      const res = await fetch("/api/host/events", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
  }

  // ── Create flow helpers ──────────────────────────────────────────────────

  function openCreate() {
    setShowCreate(true);
    setCreateStep("type");
    setSelectedType(null);
    setCreateError("");
    setNewName("");
    setNewDate("");
    setNewLocation("");
    setSuiteName("");
    setSuiteFunctions(DEFAULT_WEDDING_FUNCTIONS);
  }

  function closeCreate() {
    setShowCreate(false);
  }

  function selectType(type) {
    setSelectedType(type);
    setNewName(type.label);
    setCreateError("");
    setCreateStep(type.value === "wedding_suite" ? "suite" : "event");
  }

  async function reloadEvents() {
    const res = await fetch("/api/host/events", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/host/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          event_name: newName.trim(),
          event_date: newDate.trim() || null,
          event_location: newLocation.trim() || null,
          event_type: selectedType?.value || "other",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || "Failed to create"); return; }
      router.push(`/dashboard/events/${data.id}`);
    } catch {
      setCreateError("Network error. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateSuite(e) {
    e.preventDefault();
    if (!suiteName.trim()) return;
    const included = suiteFunctions.filter((f) => f.included && f.name.trim());
    if (included.length === 0) {
      setCreateError("Select at least one function.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/host/event-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          group_name: suiteName.trim(),
          group_type: "wedding",
          functions: included.map((f) => ({
            event_name: f.name.trim(),
            event_date: f.date.trim() || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || "Failed to create"); return; }
      await reloadEvents();
      closeCreate();
    } catch {
      setCreateError("Network error. Try again.");
    } finally {
      setCreating(false);
    }
  }

  function getDaysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  }

  // ── Group events by event_group_id ───────────────────────────────────────

  function buildDisplayItems(evList) {
    const items = [];
    const groupMap = {};
    evList.forEach((ev) => {
      if (ev.event_group_id) {
        if (!groupMap[ev.event_group_id]) {
          groupMap[ev.event_group_id] = {
            id: ev.event_group_id,
            name: ev.group_name || "Wedding Suite",
            type: ev.group_type || "wedding",
            events: [],
          };
          items.push({ kind: "group", data: groupMap[ev.event_group_id] });
        }
        groupMap[ev.event_group_id].events.push(ev);
      } else {
        items.push({ kind: "event", data: ev });
      }
    });
    return items;
  }

  // ── Loading / error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (configMissing) {
    return (
      <main className={styles.page}>
        <p style={{ padding: "2rem", color: "var(--text-muted)" }}>
          Supabase is not configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>.
        </p>
      </main>
    );
  }

  const displayItems = buildDisplayItems(events);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <a href="/" className={styles.navBrand}>
          <span className={styles.navLogo}>✦</span>
          <span className={styles.navName}>Utsavé</span>
        </a>
        <div className={styles.navRight}>
          <button type="button" onClick={handleLogout} className={styles.navLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeText}>
            <h1 className={styles.welcomeTitle}>
              Welcome back, {profile?.display_name?.split(" ")[0] || "there"}
            </h1>
            <p className={styles.welcomeSub}>Manage your celebrations and guest lists</p>
          </div>
          <button type="button" className={styles.btnPrimary} onClick={openCreate}>
            + New Celebration
          </button>
        </div>

        {/* ── Create Panel ── */}
        {showCreate && (
          <section className={styles.createPanel}>

            {/* Step 1: Choose type */}
            {createStep === "type" && (
              <>
                <div className={styles.importHeader}>
                  <h3 className={styles.importTitle}>What are you celebrating?</h3>
                  <button type="button" onClick={closeCreate} className={styles.importClose}>✕</button>
                </div>
                <div className={styles.typeGrid}>
                  {EVENT_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`${styles.typeCard}${type.special ? ` ${styles.typeCardSpecial}` : ""}`}
                      onClick={() => selectType(type)}
                    >
                      <span className={styles.typeCardIcon}>{type.icon}</span>
                      <span className={styles.typeCardLabel}>{type.label}</span>
                      {type.detail && <span className={styles.typeCardDetail}>{type.detail}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: Regular event form */}
            {createStep === "event" && (
              <>
                <div className={styles.importHeader}>
                  <div className={styles.createStepHeader}>
                    <button type="button" onClick={() => setCreateStep("type")} className={styles.backBtn}>
                      ← Back
                    </button>
                    <h3 className={styles.importTitle}>
                      {selectedType?.icon} {selectedType?.label}
                    </h3>
                  </div>
                  <button type="button" onClick={closeCreate} className={styles.importClose}>✕</button>
                </div>
                <form onSubmit={handleCreateEvent} className={styles.createForm}>
                  <input
                    type="text"
                    placeholder="Celebration name *"
                    className={styles.createInput}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    maxLength={100}
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Date & time (optional, e.g. March 15, 2026, 6 PM)"
                    className={styles.createInput}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    maxLength={100}
                  />
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    className={styles.createInput}
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    maxLength={200}
                  />
                  {createError && <p className={styles.resultError}>{createError}</p>}
                  <div className={styles.createFormActions}>
                    <button type="button" className={styles.btnOutline} onClick={closeCreate}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.btnPrimary} disabled={creating}>
                      {creating ? "Creating…" : "Create Celebration"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3: Wedding Suite builder */}
            {createStep === "suite" && (
              <>
                <div className={styles.importHeader}>
                  <div className={styles.createStepHeader}>
                    <button type="button" onClick={() => setCreateStep("type")} className={styles.backBtn}>
                      ← Back
                    </button>
                    <h3 className={styles.importTitle}>💍 Wedding Suite</h3>
                  </div>
                  <button type="button" onClick={closeCreate} className={styles.importClose}>✕</button>
                </div>
                <form onSubmit={handleCreateSuite} className={styles.createForm}>
                  <input
                    type="text"
                    placeholder="Wedding name, e.g. The Singh-Sharma Wedding *"
                    className={styles.createInput}
                    value={suiteName}
                    onChange={(e) => setSuiteName(e.target.value)}
                    required
                    maxLength={100}
                    autoFocus
                  />
                  <p className={styles.importNote}>
                    Customise each function below — names and dates can be changed anytime.
                  </p>
                  <div className={styles.suiteRows}>
                    {suiteFunctions.map((fn, i) => (
                      <div key={fn.key} className={styles.suiteRow}>
                        <input
                          type="checkbox"
                          className={styles.suiteCheck}
                          checked={fn.included}
                          id={`fn-${fn.key}`}
                          onChange={() =>
                            setSuiteFunctions((prev) =>
                              prev.map((f, j) => j === i ? { ...f, included: !f.included } : f)
                            )
                          }
                        />
                        <input
                          type="text"
                          className={`${styles.createInput} ${styles.suiteNameInput}`}
                          value={fn.name}
                          disabled={!fn.included}
                          maxLength={80}
                          onChange={(e) =>
                            setSuiteFunctions((prev) =>
                              prev.map((f, j) => j === i ? { ...f, name: e.target.value } : f)
                            )
                          }
                        />
                        <input
                          type="text"
                          placeholder="Date (optional)"
                          className={`${styles.createInput} ${styles.suiteDateInput}`}
                          value={fn.date}
                          disabled={!fn.included}
                          maxLength={80}
                          onChange={(e) =>
                            setSuiteFunctions((prev) =>
                              prev.map((f, j) => j === i ? { ...f, date: e.target.value } : f)
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                  {createError && <p className={styles.resultError}>{createError}</p>}
                  <div className={styles.createFormActions}>
                    <button type="button" className={styles.btnOutline} onClick={closeCreate}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.btnPrimary} disabled={creating}>
                      {creating
                        ? "Creating…"
                        : `Create ${suiteFunctions.filter((f) => f.included).length} Functions`}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        )}

        {/* ── Events Grid / Empty State ── */}
        {displayItems.length === 0 && !showCreate ? (
          <div className={styles.rsvpSection}>
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No celebrations yet</p>
              <p className={styles.emptyText}>
                Create your first celebration to get started.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ marginTop: "1.25rem" }}
                onClick={openCreate}
              >
                + New Celebration
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.eventsGrid}>
            {displayItems.map((item) =>
              item.kind === "group" ? (
                <GroupCard key={item.data.id} group={item.data} getDaysUntil={getDaysUntil} />
              ) : (
                <EventCard
                  key={item.data.id}
                  event={item.data}
                  getDaysUntil={getDaysUntil}
                  onDeleted={(id) => setEvents((prev) => prev.filter((e) => e.id !== id))}
                />
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
