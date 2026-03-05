"use client";

import { useState } from "react";
import styles from "./intakes.module.css";

const PREF_LABELS = {
  experience_vibe: "Experience",
  essential: "Priorities",
  memory_priority: "Memories",
};

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function IntakesPanel({ intakes, onboardingIntakes }) {
  const [expandedId, setExpandedId] = useState(null);
  const [expandedOnboardingId, setExpandedOnboardingId] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* ── Onboarding Inquiries (from landing page) ── */}
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Onboarding inquiries</h2>
        <p className={styles.panelDesc}>
          {onboardingIntakes?.length
            ? `${onboardingIntakes.length} inquiry${onboardingIntakes.length !== 1 ? "s" : ""} from the landing page "Get Started" flow.`
            : "No onboarding inquiries yet. They appear here when visitors submit the intake form from the landing page."}
        </p>
        {onboardingIntakes?.length > 0 && (
          <ul className={styles.list}>
            {onboardingIntakes.map((i) => {
              const open = expandedOnboardingId === i.id;
              return (
                <li key={i.id} className={styles.card}>
                  <div className={styles.cardHead}>
                    <div className={styles.cardMeta}>
                      <span className={styles.eventName}>{i.event_type || "General inquiry"}</span>
                      <span className={styles.host}>
                        {i.intake_mode === "full" ? "Full intake" : "Light intake"}
                        {i.guest_count_range ? ` · ${i.guest_count_range} guests` : ""}
                        {i.investment_range ? ` · ${i.investment_range}` : ""}
                      </span>
                    </div>
                    <div className={styles.contact}>
                      {i.contact_email ? (
                        <a href={`mailto:${i.contact_email}`} className={styles.link}>{i.contact_email}</a>
                      ) : (
                        <span className={styles.muted}>No email</span>
                      )}
                      {i.contact_phone ? (
                        <a href={`tel:${i.contact_phone}`} className={styles.link}>{i.contact_phone}</a>
                      ) : (
                        <span className={styles.muted}>No phone</span>
                      )}
                    </div>
                    <span className={styles.updated}>{formatDate(i.created_at)}</span>
                    <button
                      type="button"
                      className={styles.toggle}
                      onClick={() => setExpandedOnboardingId(open ? null : i.id)}
                      aria-expanded={open}
                    >
                      {open ? "▼ Less" : "▶ More"}
                    </button>
                  </div>
                  {open && (
                    <div className={styles.detail}>
                      {i.event_date && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Date</span>
                          <span>{i.event_date}</span>
                        </div>
                      )}
                      {i.venue_type && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Venue</span>
                          <span>{i.venue_type}</span>
                        </div>
                      )}
                      {i.memories_priority && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Memories</span>
                          <span>{i.memories_priority}</span>
                        </div>
                      )}
                      {i.experience_vibes?.length > 0 && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Experience</span>
                          <span>{i.experience_vibes.join(", ")}</span>
                        </div>
                      )}
                      {i.essentials?.length > 0 && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Priorities</span>
                          <span>{i.essentials.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Celebration Intakes (from event dashboard) ── */}
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Celebration intakes</h2>
        <p className={styles.panelDesc}>
          {intakes?.length
            ? `${intakes.length} submission${intakes.length !== 1 ? "s" : ""}. Use contact details to reach out; expand to see full preferences.`
            : "No intake submissions yet. When hosts complete \"Design your celebration\", their preferences and contact details appear here so you can reach out and help."}
        </p>
        {intakes?.length > 0 && (
          <ul className={styles.list}>
            {intakes.map((i) => {
              const open = expandedId === i.id;
              return (
                <li key={i.id} className={styles.card}>
                  <div className={styles.cardHead}>
                    <div className={styles.cardMeta}>
                      <span className={styles.eventName}>{i.event_name || "Unnamed event"}</span>
                      {i.slug && (
                        <a href={`/${i.slug}/invite`} target="_blank" rel="noopener noreferrer" className={styles.slug}>
                          /{i.slug}/invite
                        </a>
                      )}
                      {i.host_name && (
                        <span className={styles.host}>Host: {i.host_name}</span>
                      )}
                    </div>
                    <div className={styles.contact}>
                      {i.contact_email ? (
                        <a href={`mailto:${i.contact_email}`} className={styles.link}>{i.contact_email}</a>
                      ) : (
                        <span className={styles.muted}>No email</span>
                      )}
                      {i.contact_phone ? (
                        <a href={`tel:${i.contact_phone}`} className={styles.link}>{i.contact_phone}</a>
                      ) : (
                        <span className={styles.muted}>No phone</span>
                      )}
                    </div>
                    <span className={styles.updated}>{formatDate(i.updated_at)}</span>
                    <button
                      type="button"
                      className={styles.toggle}
                      onClick={() => setExpandedId(open ? null : i.id)}
                      aria-expanded={open}
                    >
                      {open ? "▼ Less" : "▶ More"}
                    </button>
                  </div>

                  {open && (
                    <div className={styles.detail}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Guest count</span>
                        <span>{i.guest_count_range || "—"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Venue</span>
                        <span>{i.venue_type || "—"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Budget</span>
                        <span>{i.investment_range || "—"}</span>
                      </div>
                      {i.involvement_level && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Involvement</span>
                          <span>{i.involvement_level}</span>
                        </div>
                      )}
                      {Object.entries(i.preferences || {}).map(([cat, values]) => (
                        <div key={cat} className={styles.detailRow}>
                          <span className={styles.detailLabel}>{PREF_LABELS[cat] || cat}</span>
                          <span>{Array.isArray(values) ? values.join(", ") : values}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
