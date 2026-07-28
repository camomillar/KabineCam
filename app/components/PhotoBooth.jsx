'use client'

import { useState } from 'react'
import CameraView from './CameraView'
import ResultsView from './ResultsView'
import InfoModal from './InfoModal'
import styles from './PhotoBooth.module.css'

export default function PhotoBooth() {
  const [screen, setScreen] = useState('landing') // landing | camera | results
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)

  const handleStartClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      stream.getTracks().forEach(track => track.stop())
      setScreen('camera')
      setError(null)
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions and try again.')
    }
  }

  const handlePhotosCapture = (capturedPhotos) => {
    setPhotos(capturedPhotos)
    setScreen('results')
  }

  const handleRetake = () => {
    setPhotos([])
    setScreen('landing')
    setError(null)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.logo} href="/" aria-label="KabineCam home">
          <span className={styles.logoMark}>K</span>
        </a>
        <button
          className={styles.infoButton}
          onClick={() => setInfoOpen(true)}
          aria-label="About KabineCam"
        >
          i
        </button>
      </header>

      <h1 className={styles.title}>KabineCam</h1>

      <main className={styles.content}>
        {screen === 'landing' && (
          <div className={styles.landingScreen}>
            <div className={styles.boothWindow}>
              <div className={styles.boothFrame}>
                <span className={styles.boothHint}>
                  4 photos &middot; black &amp; white
                </span>
              </div>
            </div>
            <button
              onClick={handleStartClick}
              className={styles.startButton}
            >
              Start
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        )}

        {screen === 'camera' && (
          <CameraView onPhotosCapture={handlePhotosCapture} />
        )}

        {screen === 'results' && (
          <ResultsView
            photos={photos}
            onRetake={handleRetake}
          />
        )}
      </main>

      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
    </div>
  )
}
