'use client'

import { useEffect } from 'react'
import styles from './InfoModal.module.css'

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
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <h2 id="info-title" className={styles.modalTitle}>About KabineCam</h2>

        <p className={styles.modalText}>
          KabineCam is a digital homage to the classic black-and-white
          photobooths found around Berlin.
        </p>
        <p className={styles.modalText}>
          Step in, press start, and take a strip of four photos &mdash;
          just like the real thing. No account, no uploads: everything
          happens right in your browser.
        </p>

        <p className={styles.modalFooter}>
          Made with &hearts; in Berlin
        </p>
      </div>
    </div>
  )
}
