import React from 'react'
import { Dimensions, View } from 'react-native'
import SlideView from './SlideView'

interface Props extends Partial<DefaultProps> {
  visible: boolean
  onClose?: () => void
  children?: React.ReactNode
}

interface State {}

interface DefaultProps {
  showBackground: boolean
}

const defaultProps: DefaultProps = {
  showBackground: true,
}

export default class SlideCard extends React.Component<Props & DefaultProps, State> {
  static defaultProps = defaultProps

  windowsSize = Dimensions.get('screen')

  constructor(props: Props & DefaultProps) {
    super(props)
  }

  render() {
    return (
      <SlideView visible={this.props.visible} onBackPress={this.props.onClose} transparent={false}>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              maxHeight: this.windowsSize.height * 0.6,
              backgroundColor: 'white',
              paddingTop: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            {this.props.children}
          </View>
        </View>
      </SlideView>
    )
  }
}
