/**
 * 文本绘制Demo
 */
import Geolocation from '@react-native-oh-tpl/geolocation';
import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { icon_aim_point } from '../../assets';
import Webmap3DView from '../../components/Webmap3DView';
import { EntityStyle } from '../../constValues';
import { DemoStackPageProps } from '../../navigators/types';
import { LayerUtil, LicenseUtil, Web3dUtils } from '../../utils';
import { Client, Entity, ILicenseInfo, RTNWebMap3D } from '@mapplus/react-native-webmap3d';

interface Props extends DemoStackPageProps<'DrawText'> { }

const DEFAULT_LAYER = 'default_layer'

export default function DrawText(props: Props) {
  const [license, setLicense] = useState<ILicenseInfo | undefined>()
  const [clientUrl, setClientUrl] = useState<string | undefined>()

  /** 文本 */
  const textRef = useRef('')
  /** 记录文本ID */
  const textHistory = useRef<string[]>([])
  /** 当前绘制对象 */
  const entity = useRef<Entity>({})

  /** 准星图标句柄 用于获取屏幕坐标 */
  const aimPointImageRef = useRef<Image>(null)

  /** 激活许可 */
  const initLicense = () => {
    LicenseUtil.active().then(res => {
      setLicense(res)
    })
  }

  /** 初始化默认图层 */
  const initLayers = () => {
    // 默认添加底图
    LayerUtil.addImageLayer(LayerUtil.BaseLayers.TIAN_MAP)
    // 默认添加图网
    LayerUtil.addRoadLayer(LayerUtil.RoadLayers.ROAD)
    // 默认添加地形
    LayerUtil.addTerrainLayer(LayerUtil.TerrainLayers.TERRAIN_STK)

    // 添加文本图层
    const client = Web3dUtils.getClient()
    const scene = client?.scene
    if (scene) {
      scene.addEntitiesLayer(DEFAULT_LAYER)
    }
  }

  useEffect(() => {
    // 激活 sdk 许可
    initLicense()
    return () => {
      // 退出页面，关闭场景
      Web3dUtils.getClient()?.scene.close()
      Web3dUtils.setClient(null)
    }
  }, [])

  useEffect(() => {
    if (license) {
      // 获取 sdk web 服务地址
      const res = RTNWebMap3D?.getClientUrl()
      if (res) {
        setClientUrl(res)
      }
    }
  }, [license])

  const _onLoad = (client: Client) => {
    console.log('inited');
    Web3dUtils.setClient(client);
    initLayers()
    _locate()
  }

  const _locate = () => {
    // 申请定位全新啊
    Geolocation.requestAuthorization(() => {
      // 获取当前位置
      Geolocation.getCurrentPosition((position) => {
        // 相机移动到当前位置
        Web3dUtils.getClient()?.scene.camera.flyTo({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          altitude: 1000,
          heading: 0,
          pitch: -90,
          roll: 0
        })
      })
    })
  }

  const _drawText = () => {
    const client = Web3dUtils.getClient()
    const scene = client?.scene
    if (!scene) return
    // 获取绘制图标在屏幕的位置
    aimPointImageRef.current?.measure(async (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      const pointX = x + width / 2
      const pointY = y + height / 2
      // 屏幕坐标转为地理坐标
      const tempPoint = await scene?.pickPosition({
        x: pointX,
        y: pointY,
      }, false)
      if (!tempPoint) return

      // 设置文本样式
      entity.current.label = {
        text: textRef.current,
        verticalOrigin: client.VerticalOrigin.bottom,
        font: EntityStyle.label.fontSize + 'px sans-serif',
        fillColor: EntityStyle.label.color,
        disableDepthTestDistance: 50000000000,
        horizontalOrigin: client.HorizontalOrigin.center,
        heightReference: client.HeightReference.CLAMP_TO_GROUND,
      }
      entity.current.point = {
        size: 0,
        show: false,
      }
      // 设置文本位置
      entity.current.position = tempPoint
      // 添加文本
      const entityId = await scene?.addEntity(DEFAULT_LAYER, entity.current)
      textHistory.current.push(entityId)
    })
  }

  /** 撤销上一次绘制的文本 */
  const _undo = async () => {
    const client = Web3dUtils.getClient()
    const scene = client?.scene
    if (!scene) return
    const entityId = textHistory.current.pop()
    if (!entityId) return
    const result = entity && await scene.removeEntity(DEFAULT_LAYER, entityId)
  }

  const _renderAim = () => {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
        }}
        pointerEvents={'none'}
      >
        <Image
          ref={aimPointImageRef}
          source={icon_aim_point}
          style={{
            width: 36,
            height: 36,
          }}
        />
      </View>
    )
  }

  const _renderTextBar = () => {
    return (
      <KeyboardAvoidingView behavior={'position'} keyboardVerticalOffset={36}>
        <View style={styles.textBar}>
          <TouchableOpacity onPress={_undo} style={styles.bottomBtn}>
            <Text style={styles.bottomBtnText}>撤销</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholderTextColor={'#000000ff'}
            onChangeText={(text) => {
              textRef.current = text
            }}
          />
          <TouchableOpacity onPress={_drawText} style={styles.bottomBtn}>
            <Text style={styles.bottomBtnText}>添加</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  if (!license || !clientUrl) return

  return (
    <Webmap3DView
      clientUrl={clientUrl}
      onInited={_onLoad}
      navigation={props.navigation}
    >
      {_renderAim()}
      {_renderTextBar()}
    </Webmap3DView>
  )
}

const styles = StyleSheet.create({
  textBar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    height: 60,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
  },
  bottomBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 4,
    height: 40,
    backgroundColor: '#3499E5'
  },
  bottomBtnText: {
    color: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#efefef',
    height: 40,
    color: '#000',
    marginHorizontal: 10,
    borderRadius: 4,
    paddingHorizontal: 10,
  }
});
