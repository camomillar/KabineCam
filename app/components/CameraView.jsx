'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './CameraView.module.css'

const PHOTO_COUNT = 4
const COUNTDOWN_DURATION = 5
const PAUSE_BETWEEN_PHOTOS = 1500

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

  const capturePhoto = () => {
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
      const photo = capturePhoto()
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

      {!capturing && countdown === null && (
        <button
          onClick={handleStartCapture}
          className={styles.captureButton}
        >
          {photoCount === 0 ? 'CAPTURE' : 'RETAKE'}
        </button>
      )}

      {capturing && (
        <p className={styles.capturingText}>Capturing... {photoCount}/4</p>
      )}
    </div>
  )
}
