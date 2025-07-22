import { Client, WebMap3DView } from "@mapplus/react-native-webmap3d"
import React from "react"
import { Image, TouchableOpacity, View } from "react-native"
import { DemoStackNavigationProps, DemoStackParamList } from 'src/navigators/types'
import { icon_back } from '../assets'

interface Props {
  onInited: (client: Client) => void
  children?: React.ReactNode | React.ReactNode[]
  navigation?: DemoStackNavigationProps<keyof DemoStackParamList>
}

export default function Webmap3DView(props: Props) {

  const renderBackBtn = () => {
    if (!props.navigation) {
      return null
    }
    return (
      <TouchableOpacity
        style={{
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          top: 10,
          left: 10,
          width: 40,
          height: 40,
          zIndex: 100,
          borderRadius: 4,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
        onPress={() => {
          console.log('back', props.navigation)
          props.navigation?.goBack()
        }}
      >
        <Image
          source={icon_back}
          style={[
            {
              height: 30,
              width: 30,
            },
          ]}
        />
      </TouchableOpacity>
    )
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
      }}>
      <WebMap3DView 
        onInited={c => {
          props.onInited(c)
        }}
        debug
      />
      {renderBackBtn()}
      {props.children}
    </View>
  )
}