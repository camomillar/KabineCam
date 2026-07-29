import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

// A booth window with a pink lens. Kept to two shapes so it still reads
// at the 16px browsers actually render a favicon at.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#17161a',
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#f9c6dd',
          }}
        >
          <div
            style={{
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: '#17161a',
            }}
          />
        </div>
      </div>
    ),
    size
  )
}
