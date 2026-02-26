import styles from "../auth.module.css";

export default function VerifyEmailPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoText}>Utsavé</span>
        </div>

        <div className={styles.icon}>✉️</div>

        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.subtitle}>
          We sent a confirmation link to your inbox.
        </p>

        <ul className={styles.list}>
          <li>Open the email from Utsavé</li>
          <li>Click the confirmation link</li>
          <li>You&apos;ll be taken to your dashboard</li>
        </ul>

        <p className={styles.footer}>
          Already confirmed?{" "}
          <a href="/auth/login" className={styles.link}>
            Log in
          </a>
        </p>

        <a href="/auth/register" className={styles.backLink}>
          Wrong email? Sign up again
        </a>
      </div>
    </main>
  );
}
