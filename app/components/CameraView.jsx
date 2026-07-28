'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './CameraView.module.css'

const PHOTO_COUNT = 4
const COUNTDOWN_DURATION = 3
const PAUSE_BETWEEN_PHOTOS = 1500

// Mechanical camera shutter sound: two short filtered noise clicks
// ("k-chik"), like a real shutter opening and closing
const playShutterSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()

  const click = (startTime, duration, volume, frequency) => {
    const bufferSize = Math.floor(audioContext.sampleRate * duration)
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
    }

    const source = audioContext.createBufferSource()
    source.buffer = buffer

    const filter = audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = frequency
    filter.Q.value = 0.8

    const gain = audioContext.createGain()
    gain.gain.value = volume

    source.connect(filter)
    filter.connect(gain)
    gain.connect(audioContext.destination)
    source.start(startTime)
  }

  const now = audioContext.currentTime
  click(now, 0.05, 0.9, 2500) // shutter opens: sharp, bright click
  click(now + 0.08, 0.07, 0.7, 1600) // shutter closes: slightly duller clack
}

export default function CameraView({ onPhotosCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [stream, setStream] = useState(null)
  const photosRef = useRef([])

  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error('Camera error:', err)
      }
    }

    initCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
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
      // Flash effect
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Capture
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
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
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

          {/* Flash Effect */}
          {capturing && photoCount > 0 && (
            <div className={styles.flashEffect} />
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
