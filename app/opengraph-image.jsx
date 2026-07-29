import { ImageResponse } from 'next/og'

export const alt = 'KabineCam — your own little photobooth, right in the browser'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Generated at build time, so the shared-link preview stays in sync with
// the app's look without checking a binary into the repo
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(160deg, #fdeff7 0%, #eef0fc 45%, #e8f6fd 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* The booth window, echoing the landing screen */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 190,
            height: 190,
            borderRadius: 28,
            background: '#fff',
            padding: 14,
            marginBottom: 44,
            boxShadow: '0 18px 44px rgba(71, 68, 78, 0.18)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              borderRadius: 16,
              background: '#17161a',
            }}
          >
            {/* Lens */}
            <div
              style={{
                display: 'flex',
                width: 78,
                height: 78,
                borderRadius: '50%',
                background: '#2e2b36',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: '#14121d',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 82, fontWeight: 700 }}>
          <span style={{ color: '#47444e' }}>Kabine</span>
          <span style={{ color: '#b9b5c8' }}>Cam</span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 22,
            fontSize: 30,
            color: '#5b5866',
            maxWidth: 760,
            textAlign: 'center',
          }}
        >
          Your own little photobooth, right in the browser.
        </div>
      </div>
    ),
    size
  )
}
