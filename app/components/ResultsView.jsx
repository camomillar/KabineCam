'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './ResultsView.module.css'

const FRAME_SPACING = 8
const BORDER_COLOR = '#000'

const toBlob = (canvas) =>
  new Promise((resolve) => {
    if (!canvas) return resolve(null)
    canvas.toBlob(resolve, 'image/png')
  })

export default function ResultsView({ photos, onRetake }) {
  const stripCanvasRef = useRef(null)
  // Encoded up front: iOS Safari only allows navigator.share() inside the
  // user gesture, so awaiting the encode on click can forfeit that window
  const stripBlobRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [stripReady, setStripReady] = useState(false)
  const [printDone, setPrintDone] = useState(false)

  // Fallback: if the animationend event never fires (e.g. tab was
  // backgrounded mid-print), reveal the buttons anyway
  useEffect(() => {
    if (!stripReady) return
    const timer = setTimeout(() => setPrintDone(true), 6000)
    return () => clearTimeout(timer)
  }, [stripReady])

  // Apply vintage B&W + sepia filter and create strip
  useEffect(() => {
    if (!stripCanvasRef.current || photos.length === 0) return

    const createStrip = async () => {
      // Load images
      const images = await Promise.all(
        photos.map(
          photoData =>
            new Promise((resolve, reject) => {
              const img = new Image()
              img.onload = () => resolve(img)
              img.onerror = reject
              img.src = photoData
            })
        )
      )

      const canvas = stripCanvasRef.current
      const ctx = canvas.getContext('2d')

      if (!images[0]) return

      const frameWidth = images[0].width
      const frameHeight = images[0].height
      const margin = 24
      const totalHeight =
        frameHeight * photos.length +
        FRAME_SPACING * (photos.length - 1) +
        margin * 2

      canvas.width = frameWidth + margin * 2
      canvas.height = totalHeight

      // Black strip background (borders between and around frames)
      ctx.fillStyle = BORDER_COLOR
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw each photo with vintage filter
      images.forEach((img, index) => {
        const y = margin + index * (frameHeight + FRAME_SPACING)
        ctx.drawImage(img, margin, y)
        applyVintageFilter(ctx, margin, y, frameWidth, frameHeight)
      })

      setStripReady(true)

      // Encode while the strip prints, so Download is instant
      stripBlobRef.current = await toBlob(canvas)
    }

    createStrip()
  }, [photos])

  const applyVintageFilter = (ctx, x, y, width, height) => {
    const imageData = ctx.getImageData(x, y, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Pure grayscale (black and white)
      const gray = r * 0.299 + g * 0.587 + b * 0.114

      data[i] = gray // Red
      data[i + 1] = gray // Green
      data[i + 2] = gray // Blue

      // Increase contrast for more dramatic B&W
      const contrast = 1.2
      const adjusted = (gray - 128) * contrast + 128
      const finalGray = Math.max(0, Math.min(255, adjusted))

      data[i] = finalGray
      data[i + 1] = finalGray
      data[i + 2] = finalGray
    }

    ctx.putImageData(imageData, x, y)
  }

  const downloadStrip = async () => {
    if (downloading) return
    setDownloading(true)

    try {
      const blob = stripBlobRef.current ?? (await toBlob(stripCanvasRef.current))
      if (!blob) throw new Error('Could not render the strip')

      const filename = `kabinecam-${Date.now()}.png`
      const file = new File([blob], filename, { type: 'image/png' })

      // Phones: the share sheet is the only reliable route to the camera
      // roll. iOS Safari ignores the download attribute and just opens the
      // image in a viewer, leaving no obvious way to save it.
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'KabineCam' })
          return
        } catch (err) {
          // Dismissing the sheet isn't a failure — don't fall through to a
          // download the person just declined
          if (err.name === 'AbortError') return
        }
      }

      // Desktop: a blob URL, which avoids the multi-megabyte data: URL that
      // large canvases produce
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link) // some browsers ignore detached clicks
      link.click()
      link.remove()
      // Revoking immediately can cancel the download still in flight
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      console.error('Could not save the strip', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={styles.resultsView}>
      <div className={styles.machine}>
        <div className={styles.slot} />
        <div className={styles.printWrapper}>
          <canvas
            ref={stripCanvasRef}
            className={`${styles.stripCanvas} ${stripReady ? styles.printing : ''}`}
            onAnimationEnd={() => setPrintDone(true)}
          />
        </div>
      </div>

      <div className={styles.resultsInfo}>
        <h1 className={styles.resultsTitle}>
          Kabine<span className={styles.titleAccent}>Cam</span>
        </h1>
        <p className={styles.description}>
          Wow! It looks great! Download it to keep the moment,
          or hop back in for another round.
        </p>

        {printDone && (
          <div className={styles.buttonGroup}>
            <button
              onClick={downloadStrip}
              disabled={downloading}
              className={styles.downloadButton}
            >
              {downloading ? 'Downloading...' : 'Download'}
            </button>
            <button
              onClick={onRetake}
              className={styles.retakeButton}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Retake
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
