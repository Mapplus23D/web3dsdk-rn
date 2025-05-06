import { Client } from "client/webmap3d-client"
import createSuperMap3D from "../../client/react-native"
import { useMemo, useRef } from "react"
import { View } from "react-native"
import WebView from "react-native-webview"

interface Props {
  onInited: (client: Client) => void
}

export default function Webmap3DView(props: Props) {
  const webViewRef = useRef<WebView>(null)

  const client = useMemo(() => {
    const client = createSuperMap3D(() => {
      return webViewRef.current
    })
    return client
  }, [])

  return (
    <View
    style={{
      width: '100%',
      height: '100%',
      // backgroundColor: 'red',
    }}>
    <WebView
      ref={webViewRef}
      onMessage={e => {
        client.handleMessage(e.nativeEvent.data)
      }}
      onLoadEnd={() => {
        client.init().then(() => {
          props.onInited(client)
        })
      }}
      source={{ uri: 'http://localhost:9999/webapp3d/index.html' }}
      // chrome debug：
      // hdc shell
      // cat /proc/net/unix | grep devtools
      // hdc fport tcp:9222 localabstract:webview_devtools_remote_22341
      webviewDebuggingEnabled={true}
    />
  </View>
  )
}