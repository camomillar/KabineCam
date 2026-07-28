'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './CameraView.module.css'

const PHOTO_COUNT = 4
const COUNTDOWN_DURATION = 3
const PAUSE_BETWEEN_PHOTOS = 1500

// Browsers cap how many AudioContexts a page may hold, so keep one
// around rather than opening a fresh one per shot
let audioContext = null
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

// A burst of filtered noise: the mechanical rustle of moving parts
const noiseBurst = (ctx, { at, duration, volume, type, frequency, Q }) => {
  const frames = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = frequency
  filter.Q.value = Q

  // Near-instant attack, quick decay — percussive, not a "whoosh"
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)

  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start(at)
  source.stop(at + duration)
}

// A low pitched-down thud: the weight of the mirror hitting the body
const thump = (ctx, { at, duration, volume, from, to }) => {
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(to, at + duration)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)

  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + duration)
}

// An SLR firing: mirror up and curtain open, then curtain close and
// mirror down about 110ms later — the classic "ka-chunk"
const playShutterSound = () => {
  const ctx = getAudioContext()
  const t = ctx.currentTime

  // Mirror slap + first curtain
  thump(ctx, { at: t, duration: 0.07, volume: 0.32, from: 320, to: 90 })
  noiseBurst(ctx, { at: t, duration: 0.045, volume: 0.5, type: 'bandpass', frequency: 2600, Q: 1.1 })
  noiseBurst(ctx, { at: t + 0.004, duration: 0.03, volume: 0.26, type: 'highpass', frequency: 5200, Q: 0.7 })

  // Second curtain + mirror returning: duller, a touch softer
  const back = t + 0.11
  thump(ctx, { at: back, duration: 0.09, volume: 0.26, from: 260, to: 70 })
  noiseBurst(ctx, { at: back, duration: 0.06, volume: 0.4, type: 'bandpass', frequency: 1500, Q: 0.9 })
  noiseBurst(ctx, { at: back + 0.005, duration: 0.035, volume: 0.18, type: 'highpass', frequency: 4000, Q: 0.7 })
}

export default function CameraView({ onPhotosCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [flashCount, setFlashCount] = useState(0)
  const streamRef = useRef(null)
  const photosRef = useRef([])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  useEffect(() => {
    let cancelled = false

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        // The view may have been left while the permission was resolving
        if (cancelled) {
          mediaStream.getTracks().forEach(track => track.stop())
          return
        }
        streamRef.current = mediaStream
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error('Camera error:', err)
      }
    }

    initCamera()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [])

  const capturePhoto = async () => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) return null

    const ctx = canvas.getContext('2d')
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    // Make canvas square
    canvas.width = Math.min(videoWidth, videoHeight)
    canvas.height = Math.min(videoWidth, videoHeight)

    // Draw centered square crop
    const offsetX = (videoWidth - canvas.width) / 2
    const offsetY = (videoHeight - canvas.height) / 2

    ctx.drawImage(
      video,
      offsetX,
      offsetY,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    )

    return canvas.toDataURL('image/png')
  }

  const startCountdown = async () => {
    for (let i = COUNTDOWN_DURATION; i >= 1; i--) {
      setCountdown(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    setCountdown(null)
    await captureSequence()
  }

  const captureSequence = async () => {
    setCapturing(true)
    photosRef.current = []
    setPhotoCount(0)

    for (let i = 0; i < PHOTO_COUNT; i++) {
      // Fire a fresh flash for every shot
      setFlashCount(f => f + 1)
      playShutterSound()

      const photo = await capturePhoto()
      if (photo) {
        photosRef.current.push(photo)
        setPhotoCount(i + 1)
      }

      // Pause between photos (except after last)
      if (i < PHOTO_COUNT - 1) {
        await new Promise(resolve => setTimeout(resolve, PAUSE_BETWEEN_PHOTOS))
      }
    }

    setCapturing(false)

    // Show developing screen
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Pass to results
    stopCamera()
    onPhotosCapture(photosRef.current)
  }

  const handleStartCapture = () => {
    if (!capturing && countdown === null) {
      startCountdown()
    }
  }

  return (
    <div className={styles.cameraView}>
      <div className={styles.boothWindow}>
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.video}
          />
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            style={{ display: 'none' }}
          />

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className={styles.countdownOverlay}>
              <div className={styles.countdownNumber}>{countdown}</div>
            </div>
          )}

          {/* Flash: the key remounts the node so it replays on every shot */}
          {flashCount > 0 && (
            <div key={flashCount} className={styles.flashEffect} />
          )}
        </div>

        {/* Progress Indicator */}
        <div className={styles.progressDots}>
          {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i < photoCount ? styles.filled : ''}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.cameraInfo}>
        <h1 className={styles.cameraTitle}>
          Kabine<span className={styles.titleAccent}>Cam</span>
        </h1>
        <p className={styles.description}>
          Smile for the camera! After a quick countdown the booth snaps
          four photos in a row. Just have fun and let it happen.
        </p>

        {!capturing && countdown === null && (
          <button
            onClick={handleStartCapture}
            className={styles.captureButton}
          >
            Capture
          </button>
        )}

        {countdown !== null && (
          <p className={styles.capturingText}>Strike a pose!</p>
        )}

        {capturing && (
          <p className={styles.capturingText}>Looking good! {photoCount}/4</p>
        )}
      </div>
    </div>
  )
}
