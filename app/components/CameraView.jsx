'use client'

import { useState, useRef, useEffect } from 'react'
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision'
import styles from './CameraView.module.css'

const PHOTO_COUNT = 4
const COUNTDOWN_DURATION = 3
const PAUSE_BETWEEN_PHOTOS = 1500

// Person segmentation (background removal), loaded once and shared
let segmenterPromise = null
const getSegmenter = () => {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
        },
        runningMode: 'IMAGE',
        outputConfidenceMasks: true,
      })
    })()
  }
  return segmenterPromise
}

// Replace everything behind the person with a clean white booth background
const applyBoothBackground = async (canvas, ctx) => {
  const segmenter = await getSegmenter()
  const result = segmenter.segment(canvas)

  const masks = result.confidenceMasks
  const personMask = masks[masks.length - 1]
  const mw = personMask.width
  const mh = personMask.height
  const maskData = personMask.getAsFloat32Array()

  // Build a white overlay whose alpha is the background confidence,
  // then scale it over the photo (bilinear scaling feathers the edges)
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = mw
  maskCanvas.height = mh
  const maskCtx = maskCanvas.getContext('2d')
  const maskImage = maskCtx.createImageData(mw, mh)

  for (let i = 0; i < maskData.length; i++) {
    const alpha = Math.max(0, Math.min(255, Math.round((1 - maskData[i]) * 255)))
    maskImage.data[i * 4] = 255
    maskImage.data[i * 4 + 1] = 255
    maskImage.data[i * 4 + 2] = 255
    maskImage.data[i * 4 + 3] = alpha
  }

  maskCtx.putImageData(maskImage, 0, 0)
  ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height)
  result.close()
}

// Camera shutter sound
const playShutterSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const now = audioContext.currentTime

  // High-pitched beep for camera shutter
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(800, now)
  oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1)

  gainNode.gain.setValueAtTime(0.3, now)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

  oscillator.start(now)
  oscillator.stop(now + 0.1)
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

    // Warm up the segmentation model so it's ready by the first capture
    getSegmenter().catch(() => {})

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

    // Swap the real background for a white booth backdrop.
    // If the model isn't available (e.g. offline), keep the original frame.
    try {
      await applyBoothBackground(canvas, ctx)
    } catch (err) {
      console.warn('Background removal unavailable, keeping original frame', err)
    }

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
