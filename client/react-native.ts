import WebView from 'react-native-webview'
import {createClient} from './webmap3d-client'
import { Buffer } from 'buffer'
import './FastestTextEncoderPolyfill'
import './FastestTextDecoderPolyfill'

export default function createSuperMap3D(getWebview: () => WebView | null) {
  return createClient({
    sendHandler: (event) => {
      getWebview()?.postMessage(event)
    },
    handleLargeMessage: (str, limit) => {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(str)

      const isLarge = bytes.length > limit

      if (isLarge) {
        const base64 = Buffer.from(bytes).toString('base64')
        return {
          isLarge: true,
          message: base64,
        }
      } else {
        return {
          isLarge: false,
          message: str,
        }
      }
    },
    decodeLargeMessage: (base64) => {
      const binstr = atob(base64)
      const bytes = Uint8Array.from(binstr, (c) => c.charCodeAt(0))
      const decoder = new TextDecoder()
      const str = decoder.decode(bytes)
      return str
    },
  })
}
