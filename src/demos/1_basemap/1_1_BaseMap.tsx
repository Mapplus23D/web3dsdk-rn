import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { DemoStackPageProps } from 'src/navigators/types';
import Webmap3DView from "../../components/Webmap3DView";
import { RTNWebMap3D } from '../../specs';
import { Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'BaseMap'> { }

const tiandituTokens = [
  'f1a8416261b97ae978e755060db0638f',
  '347ab5a4378dc173c4601cb7a9984207',
  '7dcd4bcb67f04b4f3962a250c408c036',
  'a2f64889ada70d272f13d1e4c6796c86',
  // '67ccdbe6cc313cfc77842ebe01756b1a',
  '9faa3ff752cf23ac3fe2b3078d26b026',
  '1e12081bc50e75b960d852a20d69e03b',
]

export function getTiandituToken() {
  const rad = Math.floor(Math.random() * tiandituTokens.length)
  const token = tiandituTokens[rad]
  // console.log('xzy2', rad + ' ' + token)
  return token
}

const BaseLayers = {
  TIAN_MAP: '天地图',
  TIAN_VEC: '天地图矢量',
  TIAN_TER: '天地图地形晕渲',
  BING_MAP: 'BingMap',
  GEOVIS_IMG: '星图地球',
  SIWEIEARTH: '四维地球',
  GEOVIS_TER: '星图地球地形渲染图',
  GEOVIS_VEC: '星图地球矢量',
  CHANG_GUANG: '长光卫星',
}

export default function BaseMap(props: Props) {

  const [clientUrl, setClientUrl] = useState<string | undefined>()
  const [panelVisible, setPanelVisible] = useState(false)

  const rotateValue = useRef(new Animated.Value(0)).current; // 初始角度为0度

  useEffect(() => {
    // 获取 sdk web 服务地址
    RTNWebMap3D?.getClientUrl().then(res => {
      if (res) {
        setClientUrl(res)
      }
    })
    return () => {
      Web3dUtils.getClient()?.scene.close()
      Web3dUtils.setClient(null)
    }
  }, [])

  useEffect(() => {
    // 添加按钮旋转动画
    Animated.timing(rotateValue, {
      toValue: panelVisible ? 45 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [panelVisible])

  /** 添加影像底图 */
  async function addImageLayer(name: string) {
    // 获取三维地图sdk实例
    const client = Web3dUtils.getClient()
    if (!client) return
    // 获取影像图层
    const layer = await client.scene.getImageLayers()
    if (layer && layer?.length > 0) {
      layer.forEach(async (data, index) => {
        if (data.name !== name && (
          data.name === BaseLayers.BING_MAP
          || data.name !== BaseLayers.GEOVIS_TER
          || data.name !== BaseLayers.GEOVIS_IMG
          || data.name !== BaseLayers.SIWEIEARTH
          || data.name !== BaseLayers.GEOVIS_VEC
          || data.name !== BaseLayers.TIAN_MAP
          || data.name !== BaseLayers.TIAN_VEC
          || data.name !== BaseLayers.TIAN_TER
          || data.name !== BaseLayers.CHANG_GUANG
        )) {
          // 添加底图前，先移除之前的底图
          await client.scene.removeImageLayer(index)
        }
      })
    }
    // 根据名称，使用client.scene.addImagelayer添加对应底图
    switch (name) {
      case BaseLayers.TIAN_MAP:
        client.scene.addImagelayer(BaseLayers.TIAN_MAP, {
          type: client.ProviderType.TIANDITU,
          mapStyle: client.TiandituMapsStyle.IMG_C,
          token: getTiandituToken(),
          maximumLevel: 17,
        })
        break
      case BaseLayers.TIAN_VEC:
        client.scene.addImagelayer(BaseLayers.TIAN_VEC, {
          type: client.ProviderType.TIANDITU,
          mapStyle: client.TiandituMapsStyle.VEC_C,
          token: getTiandituToken(),
          maximumLevel: 17,
        })
        break
      case BaseLayers.TIAN_TER:
        client.scene.addImagelayer(BaseLayers.TIAN_TER, {
          type: client.ProviderType.TIANDITU,
          mapStyle: client.TiandituMapsStyle.TER_C,
          token: getTiandituToken(),
          maximumLevel: 13,
        })
        break
      case BaseLayers.BING_MAP:
        client.scene.addImagelayer(BaseLayers.BING_MAP, {
          type: client.ProviderType.BING,
          url: 'https://dev.virtualearth.net',
          mapStyle: client.BingMapsStyle.AERIAL,
          key: 'AtPtWBbxwoSMbcSNcICiUFaQg345fZfN7N6ZE_7UNHna1T84Q81myLQDCIfKIAMU',
        })
        break
      case BaseLayers.GEOVIS_IMG:
        client.scene.addImagelayer(name, {
          type: client.ProviderType.SUPERMAP,
          url: 'https://service.mapplus.com/iserver/services/map-geovis-img/rest/maps/GEOVIS_Img',
        })
        break
      case BaseLayers.SIWEIEARTH:
        client.scene.addImagelayer(name, {
          type: client.ProviderType.SUPERMAP,
          url: 'https://service.mapplus.com/iserver/services/map-siweidata-4326/rest/maps/siweiearth4326',
        })
        break
      case BaseLayers.GEOVIS_TER:
        client.scene.addImagelayer(name, {
          type: client.ProviderType.SUPERMAP,
          url: 'https://www.supermapol.com/proxy/of6bhhbv/iserver/services/map-geovis-ter-v2/rest/maps/GEOVIS_Ter',
          credential: {
            rootUrl: 'https://www.supermapol.com/proxy/of6bhhbv/iserver/services/map-geovis-ter-v2/rest/maps/GEOVIS_Ter',
            type: 'key',
            value: 'e5Kz2qKewduqXfET673s6m4e',
          },
        })
        break
      case BaseLayers.GEOVIS_VEC:
        client.scene.addImagelayer(name, {
          type: client.ProviderType.SUPERMAP,
          url: 'https://service.mapplus.com/iserver/services/map-geovis-vec/rest/maps/GEOVIS_Vec',
        })
        break
      case BaseLayers.CHANG_GUANG:
        client.scene.addImagelayer(name, {
          type: client.ProviderType.CHANGGUANG,
          maximumLevel: 18,
          url: 'https://api.jl1mall.com/getMap/{z}/{x}/{reverseY}?mk=2d9bf902749f1630bc25fc720ba7c29f&tk=',
        })
        break
    }
  }

  if (!clientUrl) return

  return (
    <Webmap3DView
      clientUrl={clientUrl}
      onInited={client => {
        console.log('inited');
        Web3dUtils.setClient(client);
      }}
      navigation={props.navigation}
    >
      <>
        <TouchableOpacity
          onPress={() => setPanelVisible(visible => !visible)}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            backgroundColor: '#007AFF',
            borderRadius: 30,
            width: 60,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <Animated.Text style={{
            color: 'white',
            fontSize: 36,
            transform: [{
              rotate: rotateValue.interpolate({
                inputRange: [0, 45],
                outputRange: ['0deg', '45deg']
              })
            }]
          }}>+</Animated.Text>
        </TouchableOpacity>

        {panelVisible && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 16,
            }}
          >
            <ScrollView>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {Object.keys(BaseLayers).map((value, index) => {
                  const name = BaseLayers[value as keyof typeof BaseLayers];
                  return (
                    <TouchableOpacity
                      key={index}
                      style={{
                        width: '48%',
                        marginBottom: 16,
                        borderRadius: 8,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: '#ddd',
                      }}
                      onPress={() => {
                        addImageLayer(name);
                        setPanelVisible(false);
                      }}
                    >
                      <Text style={{ textAlign: 'center', padding: 8 }}>{name}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </>
    </Webmap3DView>
  )
}