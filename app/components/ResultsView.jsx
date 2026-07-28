'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './ResultsView.module.css'

const FRAME_SPACING = 8
const BORDER_COLOR = '#000'

export default function ResultsView({ photos, onRetake }) {
  const stripCanvasRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

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
      const totalHeight = frameHeight * photos.length + FRAME_SPACING * (photos.length - 1)

      // Set canvas size with white background border
      canvas.width = frameWidth + 40
      canvas.height = totalHeight + 40

      // White background
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw each photo with vintage filter
      images.forEach((img, index) => {
        const y = 20 + index * (frameHeight + FRAME_SPACING)

        // Draw frame border
        ctx.strokeStyle = BORDER_COLOR
        ctx.lineWidth = 2
        ctx.strokeRect(18, y - 2, frameWidth + 4, frameHeight + 4)

        // Draw image
        ctx.drawImage(img, 20, y)

        // Apply vintage filter via canvas
        applyVintageFilter(ctx, 20, y, frameWidth, frameHeight)
      })
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

      // Grayscale
      const gray = r * 0.299 + g * 0.587 + b * 0.114

      // Sepia effect
      data[i] = Math.min(gray * 1.1, 255) // Red
      data[i + 1] = gray * 0.95 // Green
      data[i + 2] = gray * 0.8 // Blue

      // Slight contrast boost
      const adjusted = (data[i] - 128) * 1.1 + 128
      data[i] = Math.max(0, Math.min(255, adjusted))
    }

    ctx.putImageData(imageData, x, y)
  }

  const downloadStrip = () => {
    setDownloading(true)
    const canvas = stripCanvasRef.current

    setTimeout(() => {
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `kabinecam-strip-${Date.now()}.png`
      link.click()
      setDownloading(false)
    }, 100)
  }

  return (
    <div className={styles.resultsView}>
      <div className={styles.boothWindow}>
        <div className={styles.stripContainer}>
          <canvas
            ref={stripCanvasRef}
            className={styles.stripCanvas}
          />
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={downloadStrip}
          disabled={downloading}
          className={styles.downloadButton}
        >
          {downloading ? 'DOWNLOADING...' : 'DOWNLOAD'}
        </button>
        <button
          onClick={onRetake}
          className={styles.retakeButton}
        >
          RETAKE
        </button>
      </div>
    </div>
  )
}
