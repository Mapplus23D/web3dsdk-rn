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

  // 调用 createSuperMap3D 创建一个 react-native 端专用的 client 对象
  // client 对象负责与 webview 中的 webmap3d sdk 进行通信
  const client = useMemo(() => {
    const client = createSuperMap3D(() => {
      // 返回 webview 引用以便进行消息的发送
      return webViewRef.current
    })
    return client
  }, [])

  return (
    <View
    style={{
      width: '100%',
      height: '100%',
    }}>
    <WebView
      ref={webViewRef}
      onMessage={e => {
        // 处理来自 webview 中 webmap3d sdk 发来的消息
        client.handleMessage(e.nativeEvent.data)
      }}
      onLoadEnd={() => {
        // 加载完成后，初始化 client 对象，与 webview 中的 webmap3d sdk 建立联系
        // 初始化完成后才可以调用 sdk 中的各个方法
        client.init().then(() => {
          props.onInited(client)
        })
      }}
      // 本地的web服务地址，包含实际的 sdk 代码引用
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