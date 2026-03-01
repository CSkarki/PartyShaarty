"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./intake.module.css";

const STEPS = [
  {
    id: 1,
    title: "What kind of experience do you want your guests to feel?",
    subtitle: "Select up to two that resonate most.",
    field: "experience_vibes",
    multi: true,
    max: 2,
    options: [
      "Elegant & Classy",
      "Traditional & Cultural",
      "Grand & Impressive",
      "Fun & High Energy",
      "Intimate & Emotional",
      "Simple & Well-Organized",
    ],
  },
  {
    id: 2,
    title: "Scale & Setting",
    subtitle: "Help us understand the shape of your celebration.",
    // Step 2 has two sub-fields rendered together
    subSteps: [
      {
        label: "How big are we thinking?",
        field: "guest_count_range",
        options: ["Under 40 (Close Family)", "40–100", "100–250", "250+"],
      },
      {
        label: "Where will it be held?",
        field: "venue_type",
        options: [
          "At Home",
          "Banquet Hall",
          "Hotel Ballroom",
          "Temple",
          "Outdoor Venue",
          "Still Exploring",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Where would you like support?",
    subtitle: "Select all that apply.",
    field: "essentials",
    multi: true,
    options: [
      "Venue Booking",
      "Décor & Styling",
      "DJ / Entertainment",
      "Professional Photography",
      "Videography",
      "Guest RSVP Tracking",
      "Private Digital Photo Album",
      "End-to-End Management",
    ],
  },
  {
    id: 4,
    title: "How important are lasting memories?",
    subtitle: "Choose what resonates most.",
    field: "memories_priority",
    multi: false,
    options: [
      "Professional coverage is a must",
      "We'd love guests to upload their own photos",
      "A beautifully organized private album matters",
      "Basic coverage is enough",
    ],
  },
  {
    id: 5,
    title: "What investment range feels comfortable?",
    subtitle: "All amounts are approximate and confidential.",
    field: "investment_range",
    multi: false,
    options: [
      "Under $5,000",
      "$5,000 – $15,000",
      "$15,000 – $30,000",
      "$30,000+",
      "Still deciding",
    ],
  },
];

const TOTAL_STEPS = 6; // Steps 1–5: choices; Step 6: summary + contact form

function buildRecommendation(answers) {
  const lines = [];

  if (answers.experience_vibes?.length > 0) {
    const vibes = answers.experience_vibes.join(" & ");
    lines.push(`You want your guests to feel **${vibes}**, and we'll make sure every detail reflects that vision.`);
  }

  const scaleparts = [];
  if (answers.guest_count_range) scaleparts.push(`${answers.guest_count_range} guests`);
  if (answers.venue_type) scaleparts.push(`held at a **${answers.venue_type}**`);
  if (scaleparts.length) {
    lines.push(`With ${scaleparts.join(", ")}, we can design an experience that feels perfectly proportioned.`);
  }

  if (answers.essentials?.length > 0) {
    const top = answers.essentials.slice(0, 3).join(", ");
    lines.push(`Key priorities you've flagged: **${top}**${answers.essentials.length > 3 ? ` and ${answers.essentials.length - 3} more` : ""}.`);
  }

  if (answers.memories_priority) {
    lines.push(`For memories: "${answers.memories_priority}" — we'll make sure this is covered.`);
  }

  if (answers.investment_range) {
    lines.push(`With a budget of **${answers.investment_range}**, we can build a plan that maximizes every rupee.`);
  }

  return lines;
}

function buildSummaryList(answers) {
  const items = [];
  if (answers.experience_vibes?.length > 0) {
    items.push({ label: "Experience", value: answers.experience_vibes.join(", ") });
  }
  if (answers.guest_count_range) items.push({ label: "Guest count", value: answers.guest_count_range });
  if (answers.venue_type) items.push({ label: "Venue", value: answers.venue_type });
  if (answers.essentials?.length > 0) {
    items.push({ label: "Priorities", value: answers.essentials.join(", ") });
  }
  if (answers.memories_priority) items.push({ label: "Memories", value: answers.memories_priority });
  if (answers.investment_range) items.push({ label: "Budget", value: answers.investment_range });
  return items;
}

export default function IntakePage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    event_type: null,
    experience_vibes: [],
    guest_count_range: null,
    venue_type: null,
    essentials: [],
    memories_priority: null,
    investment_range: null,
    involvement_level: null,
    contact_email: "",
    contact_phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [eventName, setEventName] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(true);

  const opts = { credentials: "include" };

  useEffect(() => {
    async function init() {
      const [evRes, intakeRes] = await Promise.all([
        fetch(`/api/host/events/${eventId}`, opts),
        fetch(`/api/host/events/${eventId}/intake`, opts),
      ]);
      if (evRes.ok) {
        const ev = await evRes.json();
        setEventName(ev.event_name || "");
      }
      if (intakeRes.ok) {
        const data = await intakeRes.json();
        if (data.intake) {
          const prefs = data.preferences || {};
          setAnswers({
            event_type: data.intake.event_type || null,
            experience_vibes: prefs.experience_vibe || [],
            guest_count_range: data.intake.guest_count_range || null,
            venue_type: data.intake.venue_type || null,
            essentials: prefs.essential || [],
            memories_priority: prefs.memory_priority?.[0] || null,
            investment_range: data.intake.investment_range || null,
            involvement_level: data.intake.involvement_level || null,
            contact_email: data.intake.contact_email || "",
            contact_phone: data.intake.contact_phone || "",
          });
          setStep(7); // Jump to recommendation if already completed
        }
      }
      setLoadingExisting(false);
    }
    init();
  }, [eventId]);

  function select(field, value, multi, max) {
    setAnswers((prev) => {
      if (!multi) return { ...prev, [field]: value };
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) };
      }
      if (max && current.length >= max) return prev; // enforce max
      return { ...prev, [field]: [...current, value] };
    });
  }

  function isStepComplete(stepNum) {
    if (stepNum === 1) return answers.experience_vibes.length > 0;
    if (stepNum === 2) return !!answers.guest_count_range && !!answers.venue_type;
    if (stepNum === 3) return answers.essentials.length > 0;
    if (stepNum === 4) return !!answers.memories_priority;
    if (stepNum === 5) return !!answers.investment_range;
    if (stepNum === 6) {
      const email = (answers.contact_email || "").trim();
      const phone = (answers.contact_phone || "").trim();
      return email.length > 0 && phone.length > 0;
    }
    return false;
  }

  async function handleFinish() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/host/events/${eventId}/intake`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setStep(7);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingExisting) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading…</p>
      </div>
    );
  }

  const currentStepDef = STEPS[step - 1];
  const recommendation = buildRecommendation(answers);

  return (
    <div className={styles.page}>
      {/* Nav */}
      <header className={styles.nav}>
        <a href="/" className={styles.navBrand}>
          <span className={styles.navLogo}>✦</span>
          <span className={styles.navName}>Utsavé</span>
        </a>
        <div className={styles.navRight}>
          <a href={`/dashboard/events/${eventId}`} className={styles.navBack}>
            ← Event Dashboard
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.stepper}>

          {/* Progress bar (hidden on step 8) */}
          {step <= TOTAL_STEPS && (
            <div className={styles.progressWrap}>
              <div className={styles.stepNumber}>Step {step} of {TOTAL_STEPS}</div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Steps 1–5: choice steps ── */}
          {step >= 1 && step <= 5 && currentStepDef && (
            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <h1 className={styles.stepTitle}>{currentStepDef.title}</h1>
                {currentStepDef.subtitle && (
                  <p className={styles.stepSubtitle}>{currentStepDef.subtitle}</p>
                )}
              </div>

              {/* Step 3: two sub-grids */}
              {currentStepDef.subSteps ? (
                currentStepDef.subSteps.map((sub) => (
                  <div key={sub.field} className={styles.subGroup}>
                    <p className={styles.subLabel}>{sub.label}</p>
                    <div className={styles.optionGrid}>
                      {sub.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`${styles.optionTile} ${answers[sub.field] === opt ? styles.optionTileSelected : ""}`}
                          onClick={() => select(sub.field, opt, false)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {currentStepDef.multi && currentStepDef.max && (
                    <p className={styles.multiHint}>
                      Select up to {currentStepDef.max} · {(answers[currentStepDef.field] || []).length}/{currentStepDef.max} chosen
                    </p>
                  )}
                  <div className={styles.optionGrid}>
                    {currentStepDef.options.map((opt) => {
                      const isSelected = currentStepDef.multi
                        ? (answers[currentStepDef.field] || []).includes(opt)
                        : answers[currentStepDef.field] === opt;
                      const isDisabled =
                        currentStepDef.multi &&
                        currentStepDef.max &&
                        !isSelected &&
                        (answers[currentStepDef.field] || []).length >= currentStepDef.max;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={isDisabled}
                          className={`${styles.optionTile} ${isSelected ? styles.optionTileSelected : ""} ${isDisabled ? styles.optionTileDisabled : ""}`}
                          onClick={() => select(currentStepDef.field, opt, currentStepDef.multi, currentStepDef.max)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {saveError && (
                <p className={styles.saveError}>{saveError}</p>
              )}

              <div className={styles.navRow}>
                {step > 1 && (
                  <button
                    type="button"
                    className={styles.btnBack}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    ← Back
                  </button>
                )}
                <div className={styles.navRowRight}>
                  <button
                    type="button"
                    className={styles.btnContinue}
                    disabled={!isStepComplete(step)}
                    onClick={() => setStep((s) => s + 1)}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Summary + contact (email & phone required) ── */}
          {step === 6 && (
            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <h1 className={styles.stepTitle}>Summary &amp; contact</h1>
                <p className={styles.stepSubtitle}>
                  Our team will reach you via the email and phone number below.
                </p>
              </div>

              <div className={styles.summaryBlock}>
                <p className={styles.summaryLabel}>Your choices</p>
                <ul className={styles.summaryList}>
                  {buildSummaryList(answers).map((item, i) => (
                    <li key={i} className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>{item.label}</span>
                      <span className={styles.summaryItemValue}>{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.contactFields}>
                <label className={styles.contactLabel}>
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  required
                  className={styles.contactInput}
                  placeholder="you@example.com"
                  value={answers.contact_email || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, contact_email: e.target.value }))}
                />
                <label className={styles.contactLabel}>
                  Phone number <span className={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  className={styles.contactInput}
                  placeholder="+1 234 567 8900"
                  value={answers.contact_phone || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, contact_phone: e.target.value }))}
                />
              </div>

              {saveError && (
                <p className={styles.saveError}>{saveError}</p>
              )}

              <div className={styles.navRow}>
                <button
                  type="button"
                  className={styles.btnBack}
                  onClick={() => setStep(5)}
                >
                  ← Back
                </button>
                <div className={styles.navRowRight}>
                  <button
                    type="button"
                    className={styles.btnContinue}
                    disabled={!isStepComplete(6) || saving}
                    onClick={handleFinish}
                  >
                    {saving ? "Saving…" : "Submit &amp; see recommendation →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 7: Recommendation Screen ── */}
          {step === 7 && (
            <div className={styles.recommendWrap}>
              <div className={styles.recommendHeader}>
                <div className={styles.recommendOrnament}>✦ ❁ ✦</div>
                <h1 className={styles.recommendTitle}>Your Celebration Blueprint</h1>
                <p className={styles.recommendSubtitle}>
                  Based on your vision, here's what we recommend for{eventName ? ` ${eventName}` : " your event"}.
                </p>
              </div>

              <div className={styles.recommendCard}>
                {recommendation.map((line, i) => (
                  <p
                    key={i}
                    className={styles.recommendLine}
                    dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
                  />
                ))}
              </div>

              <div className={styles.ctaRow}>
                <button
                  type="button"
                  className={styles.ctaPrimary}
                  onClick={() => router.push(`/dashboard/events/${eventId}`)}
                >
                  Create My Celebration Page →
                </button>
                <a
                  href="mailto:hello@utsave.in?subject=Premium%20Celebration%20Planning"
                  className={styles.ctaSecondary}
                >
                  Explore Premium Options ✦
                </a>
              </div>

              <button
                type="button"
                className={styles.editLink}
                onClick={() => setStep(1)}
              >
                ← Edit your answers
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
