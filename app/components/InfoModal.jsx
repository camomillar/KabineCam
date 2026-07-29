'use client'

import { useEffect } from 'react'
import styles from './InfoModal.module.css'

const STACK = [
  { label: 'Design', items: ['Figma'] },
  { label: 'Frontend', items: ['JavaScript', 'React', 'Next.js'] },
  { label: 'Styling', items: ['CSS Modules'] },
  { label: 'Hosting', items: ['Vercel'] },
  { label: 'AI', items: ['Claude Code'] },
]

export default function InfoModal({ onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
      >
        <div className={styles.header}>
          <div>
            <h2 id="info-title" className={styles.modalTitle}>
              KabineCam <span className={styles.year}>&bull; 2026</span>
            </h2>
            <p className={styles.tagline}>
              A digital way to take classic photobooth pictures.
            </p>
          </div>
          <a
            className={styles.githubButton}
            href="https://github.com/camomillar/KabineCam"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="9 7 17 7 17 15" />
            </svg>
          </a>
        </div>

        <hr className={styles.divider} />

        <div className={styles.stackGrid}>
          {STACK.map(({ label, items }) => (
            <div key={label} className={styles.stackColumn}>
              <span className={styles.stackLabel}>{label}</span>
              {items.map((item) => (
                <span key={item} className={styles.stackItem}>{item}</span>
              ))}
            </div>
          ))}
        </div>

        <hr className={styles.divider} />

        <p className={styles.privacyNote}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Everything happens in your browser &mdash; your photos are never
          uploaded or stored.
        </p>
      </div>
    </div>
  )
}
