"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser";
import styles from "./intake.module.css";

/* ─── Full-mode step definitions (mirrors event intake) ─────────────────── */
const FULL_STEPS = [
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
    subSteps: [
      {
        label: "How big are we thinking?",
        field: "guest_count_range",
        options: ["Under 40 (Close Family)", "40–100", "100–250", "250+"],
      },
      {
        label: "Where will it be held?",
        field: "venue_type",
        options: ["At Home", "Banquet Hall", "Hotel Ballroom", "Temple", "Outdoor Venue", "Still Exploring"],
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
    options: ["Under $5,000", "$5,000 – $15,000", "$15,000 – $30,000", "$30,000+", "Still deciding"],
  },
];

const FULL_TOTAL = 6; // steps 1–5 + contact step

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Festival",
  "Puja / Religious",
  "Anniversary",
  "Baby Shower",
  "Family Gathering",
  "Other",
];

const GUEST_COUNTS = ["Under 50", "50–150", "150–350", "350+"];
const BUDGETS = ["Under $5,000", "$5,000 – $15,000", "$15,000 – $30,000", "$30,000+", "Still deciding"];

/* ─── Component ─────────────────────────────────────────────────────────── */
function OnboardingIntakeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "full" ? "full" : "light";

  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  /* Light mode fields */
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [budget, setBudget] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  /* Full mode fields */
  const [answers, setAnswers] = useState({
    experience_vibes: [],
    guest_count_range: null,
    venue_type: null,
    essentials: [],
    memories_priority: null,
    investment_range: null,
    contact_email: "",
    contact_phone: "",
  });

  /* Optional: pre-fill email if user is logged in; no login required to view form */
  useEffect(() => {
    async function init() {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          if (user.email) {
            setContactEmail(user.email);
            setAnswers((prev) => ({ ...prev, contact_email: user.email || "" }));
          }
        }
      }
      setAuthChecked(true);
    }
    init();
  }, []);

  /* ── Helpers ── */
  function selectFull(field, value, multi, max) {
    setAnswers((prev) => {
      if (!multi) return { ...prev, [field]: value };
      const current = prev[field] || [];
      if (current.includes(value)) return { ...prev, [field]: current.filter((v) => v !== value) };
      if (max && current.length >= max) return prev;
      return { ...prev, [field]: [...current, value] };
    });
  }

  function isFullStepComplete(stepNum) {
    if (stepNum === 1) return answers.experience_vibes.length > 0;
    if (stepNum === 2) return !!answers.guest_count_range && !!answers.venue_type;
    if (stepNum === 3) return answers.essentials.length > 0;
    if (stepNum === 4) return !!answers.memories_priority;
    if (stepNum === 5) return !!answers.investment_range;
    if (stepNum === 6) return !!(answers.contact_email?.trim()) && !!(answers.contact_phone?.trim());
    return false;
  }

  function isValidEmail(str) {
    if (!str?.trim()) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(str.trim());
  }

  function isValidUSPhone(str) {
    if (!str?.trim()) return false;
    let digits = str.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
    if (digits.length !== 10) return false;
    const allSame = /^(\d)\1{9}$/.test(digits);
    const sequential = digits === "1234567890" || digits === "0123456789" || digits === "9876543210";
    return !allSame && !sequential;
  }

  function isLightValid() {
    return isValidEmail(contactEmail) && isValidUSPhone(contactPhone);
  }

  const emailError = contactEmail.trim() && !isValidEmail(contactEmail);
  const phoneError = contactPhone.trim() && !isValidUSPhone(contactPhone);

  /* ── Submit ── */
  async function handleSubmit() {
    setSaving(true);
    setSaveError(null);
    try {
      const body =
        mode === "light"
          ? {
              intake_mode: "light",
              event_type: eventType || null,
              event_date: eventDate || null,
              guest_count_range: guestCount || null,
              investment_range: budget || null,
              contact_email: contactEmail.trim(),
              contact_phone: contactPhone.trim(),
            }
          : {
              intake_mode: "full",
              experience_vibes: answers.experience_vibes,
              guest_count_range: answers.guest_count_range,
              venue_type: answers.venue_type,
              essentials: answers.essentials,
              memories_priority: answers.memories_priority,
              investment_range: answers.investment_range,
              contact_email: answers.contact_email.trim(),
              contact_phone: answers.contact_phone.trim(),
            };

      const res = await fetch("/api/onboarding/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      if (!isLoggedIn) {
        router.replace("/");
        return;
      }
      setDone(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  /* ── Thank-you screen ── */
  if (done) {
    return (
      <div className={styles.page}>
        <header className={styles.nav}>
          <span className={styles.navBrand}>
            <span className={styles.navLogo}>✦</span>
            <span className={styles.navName}>Utsavé</span>
          </span>
        </header>
        <main className={styles.main}>
          <div className={styles.thankYouCard}>
            <div className={styles.thankYouIcon}>🎉</div>
            <h1 className={styles.thankYouTitle}>We&apos;ve got your request!</h1>
            <p className={styles.thankYouSub}>
              Our team will be in touch with you shortly to discuss your celebration.
            </p>
            <a href="/dashboard" className={styles.btnContinue}>
              Go to Dashboard →
            </a>
          </div>
        </main>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading…</p>
      </div>
    );
  }

  /* ── Light mode (single page) ── */
  if (mode === "light") {
    return (
      <div className={styles.page}>
        <header className={styles.nav}>
          <span className={styles.navBrand}>
            <span className={styles.navLogo}>✦</span>
            <span className={styles.navName}>Utsavé</span>
          </span>
        </header>
        <main className={styles.main}>
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Tell us about your celebration</h1>
              <p className={styles.stepSubtitle}>
                Share a few quick details and our team will reach out to plan your perfect event.
              </p>
            </div>

            <div className={styles.lightField}>
              <p className={styles.subLabel}>What kind of event?</p>
              <div className={styles.optionGrid}>
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.optionTile} ${eventType === t ? styles.optionTileSelected : ""}`}
                    onClick={() => setEventType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.lightField}>
              <p className={styles.subLabel}>Approximate date</p>
              <input
                type="text"
                className={styles.contactInput}
                placeholder="e.g. June 2025, Diwali weekend, Next spring"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            <div className={styles.lightField}>
              <p className={styles.subLabel}>Expected guest count</p>
              <div className={styles.optionGrid}>
                {GUEST_COUNTS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`${styles.optionTile} ${guestCount === g ? styles.optionTileSelected : ""}`}
                    onClick={() => setGuestCount(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.lightField}>
              <p className={styles.subLabel}>Budget range</p>
              <div className={styles.optionGrid}>
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`${styles.optionTile} ${budget === b ? styles.optionTileSelected : ""}`}
                    onClick={() => setBudget(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.lightField}>
              <p className={styles.subLabel}>How can we reach you?</p>
              <div className={styles.contactFields}>
                <label className={styles.contactLabel}>
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  required
                  className={`${styles.contactInput} ${emailError ? styles.inputError : ""}`}
                  placeholder="you@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
                {emailError && (
                  <p id="email-error" className={styles.fieldError}>
                    Please enter a valid email address.
                  </p>
                )}
                <label className={styles.contactLabel}>
                  Phone number <span className={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  className={`${styles.contactInput} ${phoneError ? styles.inputError : ""}`}
                  placeholder="(555) 123-4567 or 555-123-4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? "phone-error" : undefined}
                />
                {phoneError && (
                  <p id="phone-error" className={styles.fieldError}>
                    Please enter a valid US phone number (10 digits).
                  </p>
                )}
              </div>
            </div>

            {saveError && <p className={styles.saveError}>{saveError}</p>}

            <div className={styles.navRow}>
              <div className={styles.navRowRight}>
                <button
                  type="button"
                  className={styles.btnContinue}
                  disabled={!isLightValid() || saving}
                  onClick={handleSubmit}
                >
                  {saving ? "Submitting…" : "Submit →"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Full mode (6-step) ── */
  const currentStepDef = FULL_STEPS[step - 1];

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <span className={styles.navBrand}>
          <span className={styles.navLogo}>✦</span>
          <span className={styles.navName}>Utsavé</span>
        </span>
      </header>
      <main className={styles.main}>
        <div className={styles.stepper}>

          {/* Progress */}
          {step <= FULL_TOTAL && (
            <div className={styles.progressWrap}>
              <div className={styles.stepNumber}>Step {step} of {FULL_TOTAL}</div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${(step / FULL_TOTAL) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Steps 1–5 */}
          {step >= 1 && step <= 5 && currentStepDef && (
            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <h1 className={styles.stepTitle}>{currentStepDef.title}</h1>
                {currentStepDef.subtitle && (
                  <p className={styles.stepSubtitle}>{currentStepDef.subtitle}</p>
                )}
              </div>

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
                          onClick={() => selectFull(sub.field, opt, false)}
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
                          onClick={() => selectFull(currentStepDef.field, opt, currentStepDef.multi, currentStepDef.max)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {saveError && <p className={styles.saveError}>{saveError}</p>}

              <div className={styles.navRow}>
                {step > 1 && (
                  <button type="button" className={styles.btnBack} onClick={() => setStep((s) => s - 1)}>
                    ← Back
                  </button>
                )}
                <div className={styles.navRowRight}>
                  <button
                    type="button"
                    className={styles.btnContinue}
                    disabled={!isFullStepComplete(step)}
                    onClick={() => setStep((s) => s + 1)}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Contact */}
          {step === 6 && (
            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <h1 className={styles.stepTitle}>How can we reach you?</h1>
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
                  value={answers.contact_email}
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
                  value={answers.contact_phone}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, contact_phone: e.target.value }))}
                />
              </div>

              {saveError && <p className={styles.saveError}>{saveError}</p>}

              <div className={styles.navRow}>
                <button type="button" className={styles.btnBack} onClick={() => setStep(5)}>
                  ← Back
                </button>
                <div className={styles.navRowRight}>
                  <button
                    type="button"
                    className={styles.btnContinue}
                    disabled={!isFullStepComplete(6) || saving}
                    onClick={handleSubmit}
                  >
                    {saving ? "Submitting…" : "Submit →"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function OnboardingIntakePage() {
  return (
    <Suspense>
      <OnboardingIntakeForm />
    </Suspense>
  );
}
