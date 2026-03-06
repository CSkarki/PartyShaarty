"use client";

import Image from "next/image";
import styles from "./UserStoryMarquee.module.css";

export default function UserStoryMarquee({ photos }) {
  // Ensure enough tiles to fill a wide screen — triple the source array then split into two rows
  const base = photos.length < 6 ? [...photos, ...photos, ...photos] : photos;
  const mid = Math.ceil(base.length / 2);
  const sourceRow1 = base.slice(0, mid);
  const sourceRow2 = base.slice(mid).length ? base.slice(mid) : base;

  // Duplicate each row so the seamless loop works (CSS scrolls -50% then resets)
  const row1 = [...sourceRow1, ...sourceRow1];
  const row2 = [...sourceRow2, ...sourceRow2];

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>Memories made with Utsavé</p>
      <h2 className={styles.headline}>
        Real celebrations. Real families. Real moments.
      </h2>
      <div className={styles.marqueeWrapper}>
        {/* Row 1 — scrolls left */}
        <div className={`${styles.marqueeTrack} ${styles.scrollLeft}`}>
          {row1.map((url, i) => (
            <div key={`r1-${i}`} className={styles.tile}>
              <Image
                src={url}
                alt=""
                fill
                className={styles.tileImg}
                sizes="160px"
                unoptimized
              />
            </div>
          ))}
        </div>
        {/* Row 2 — scrolls right */}
        <div className={`${styles.marqueeTrack} ${styles.scrollRight}`}>
          {row2.map((url, i) => (
            <div key={`r2-${i}`} className={styles.tile}>
              <Image
                src={url}
                alt=""
                fill
                className={styles.tileImg}
                sizes="160px"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
