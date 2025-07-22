import React, { ReactNode } from 'react'
import { Animated, BackHandler, Dimensions, Easing, Pressable } from 'react-native'

interface Props {
  visible: boolean
  onBackPress?: () => void
  children?: ReactNode
}

interface State {
  childrenVisible: boolean
}

interface DefaultProps {
  transparent: boolean
}

const defaultProps: DefaultProps = {
  transparent: true,
}

export default class SlideView extends React.Component<Props & DefaultProps, State> {
  static defaultProps = defaultProps

  bottom = new Animated.Value(-Dimensions.get('screen').height)

  backgroundOpacity = new Animated.Value(0)

  backgroundHeight = new Animated.Value(0)

  constructor(props: Props & DefaultProps) {
    super(props)
  }

  componentDidUpdate(prevProps: Props & DefaultProps) {
    if (prevProps.visible !== this.props.visible) {
      this.onShow(this.props.visible)
      this.showBackground(this.props.visible)
      this.handleBackListener(this.props.visible)
    }
  }

  //处理物理返回
  handleBackListener = (visible: boolean) => {
    if (visible) {
      BackHandler.addEventListener('hardwareBackPress', this.onBackPress)
    } else {
      BackHandler.removeEventListener('hardwareBackPress', this.onBackPress)
    }
  }

  //显示时拦截物理返回事件
  onBackPress = (): boolean => {
    if (this.props.onBackPress) {
      this.props.onBackPress()
    }
    return true
  }

  backgroundPressed = false
  onPressBackground = () => {
    if (!this.props.transparent && !this.backgroundPressed) {
      this.backgroundPressed = true
      this.props.onBackPress?.()
      //防止重复点击
      setTimeout(() => {
        this.backgroundPressed = false
      }, 1000)
    }
  }

  onShow = (visible: boolean) => {
    Animated.timing(this.bottom, {
      toValue: visible ? 0 : -2000,
      duration: 150,
      easing: visible ? Easing.bezier(0.28, 0, 0.63, 1) : Easing.cubic,
      useNativeDriver: false,
    }).start()
    if (visible) {
      this.setState({ childrenVisible: true })
    } else {
      setTimeout(() => {
        this.setState({ childrenVisible: this.props.visible })
      }, 1000)
    }
  }

  showBackground = (visible: boolean) => {
    Animated.timing(this.backgroundHeight, {
      toValue: visible ? 100 : 0,
      duration: 1,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start()
    if (!visible) {
      Animated.timing(this.backgroundOpacity, {
        toValue: visible ? 0.6 : 0,
        duration: 1,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start()
    } else {
      setTimeout(() => {
        Animated.timing(this.backgroundOpacity, {
          toValue: visible ? 0.6 : 0,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start()
      }, 300)
    }
  }

  renderBackground = () => {
    const inputRange = [0, 100]
    const outputRange = ['0%', '100%']
    const h = this.backgroundHeight.interpolate({ inputRange, outputRange })
    return (
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          backgroundColor: this.props.transparent ? 'transparent' : 'gray',
          opacity: this.backgroundOpacity,
          height: h, //concat(this.backgroundHeight, '%'),
        }}
      >
        <Pressable onPress={this.onPressBackground} style={{ flex: 1 }} />
      </Animated.View>
    )
  }

  render() {
    return (
      <>
        {this.renderBackground()}
        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            bottom: this.bottom,
          }}
        >
          {this.props.children}
        </Animated.View>
      </>
    )
  }
}
