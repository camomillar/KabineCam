'use client'

import { useState, useRef, useEffect } from 'react'
import CameraView from './CameraView'
import ResultsView from './ResultsView'
import styles from './PhotoBooth.module.css'

export default function PhotoBooth() {
  const [screen, setScreen] = useState('landing') // landing | camera | results
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState(null)

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
    <div className={styles.booth}>
      {screen === 'landing' && (
        <div className={styles.landingScreen}>
          <div className={styles.boothWindow}>
            <div className={styles.boothFrame}>
              <h1 className={styles.title}>KabineCam</h1>
              <p className={styles.subtitle}>Classic Photobooth Vibes</p>
            </div>
          </div>
          <button
            onClick={handleStartClick}
            className={styles.startButton}
          >
            START
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
    </div>
  )
}
