'use client'

import { useState, useEffect } from 'react'
import CameraView from './CameraView'
import ResultsView from './ResultsView'
import InfoModal from './InfoModal'
import styles from './PhotoBooth.module.css'

// Dev helper: /?demo skips the camera and shows results with placeholder photos
const makeDemoPhotos = () => {
  return Array.from({ length: 4 }, (_, i) => {
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 480, 480)
    gradient.addColorStop(0, '#cfc9dd')
    gradient.addColorStop(1, '#8f8b9c')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 480, 480)
    ctx.fillStyle = '#47444e'
    ctx.beginPath()
    ctx.arc(240, 210, 90, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(120, 330, 240, 150)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(i + 1), 240, 100)
    return canvas.toDataURL('image/png')
  })
}

export default function PhotoBooth() {
  const [screen, setScreen] = useState('landing') // landing | camera | results
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    const query = window.location.search
    if (query.includes('demo-camera')) {
      setScreen('camera')
    } else if (query.includes('demo')) {
      setPhotos(makeDemoPhotos())
      setScreen('results')
    }
  }, [])

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
        <a className={styles.logo} href="https://milla.work/" aria-label="Camilla Almeida's website">
          <img src="/logo.png" alt="Camilla Almeida logo" className={styles.logoMark} />
        </a>
        <button
          className={styles.infoButton}
          onClick={() => setInfoOpen(true)}
          aria-label="About KabineCam"
        >
          i
        </button>
      </header>

      <main className={styles.content}>
        {screen === 'landing' && (
          <div className={styles.landingScreen}>
            <div className={styles.boothWindow}>
              <div className={styles.boothFrame}>
                <div className={styles.lens}>
                  <div className={styles.lensInner}>
                    <span className={styles.lensGlint} />
                    <span className={styles.lensGlintSmall} />
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.landingInfo}>
              <h1 className={styles.landingTitle}>
                Kabine<span className={styles.titleAccent}>Cam</span>
              </h1>
              <p className={styles.description}>
                Your own little photobooth, right in the browser.
                Press start, strike a pose, and let the booth do the rest! &#x2728;
              </p>
              <button
                onClick={handleStartClick}
                className={styles.startButton}
              >
                Start
              </button>
              {error && <p className={styles.error}>{error}</p>}
            </div>
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
