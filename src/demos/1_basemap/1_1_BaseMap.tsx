import { useEffect, useRef, useState } from 'react';
import { Animated, SectionList, SectionListData, SectionListRenderItemInfo, Text, TouchableOpacity, View } from 'react-native';
import { DemoStackPageProps } from 'src/navigators/types';
import Webmap3DView from "../../components/Webmap3DView";
import { RTNWebMap3D } from '../../specs';
import { Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'BaseMap'> { }
interface Section {
  title: string
  data: string[]
}

const tiandituTokens = [
  'f1a8416261b97ae978e755060db0638f',
  '347ab5a4378dc173c4601cb7a9984207',
  '7dcd4bcb67f04b4f3962a250c408c036',
  'a2f64889ada70d272f13d1e4c6796c86',
  '9faa3ff752cf23ac3fe2b3078d26b026',
  '1e12081bc50e75b960d852a20d69e03b',
]

export function getTiandituToken() {
  const rad = Math.floor(Math.random() * tiandituTokens.length)
  const token = tiandituTokens[rad]
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

const RoadLayers = {
  ROAD: '天地图路网',
  ROAD_CHINA: '全国大字体路网',
  XINGQIU_ROAD: '星图地球路网',
}

const TerrainLayers = {
  TERRAIN_STK: 'STK地形',
  TERRAIN_TIAN: '天地图地形',
  TERRAIN_SUPERMAP: '超图在线地形',
}

export default function BaseMap(props: Props) {

  const [clientUrl, setClientUrl] = useState<string | undefined>()
  const [panelVisible, setPanelVisible] = useState(false)
  const [layerData, setLayerData] = useState<Section[]>([])

  const rotateValue = useRef(new Animated.Value(0)).current; // 初始角度为0度

  const initData = () => {
    const _baseLayers = Object.keys(BaseLayers).map((value, index) => {
      return BaseLayers[value as keyof typeof BaseLayers];
    })
    const _roadLayers = Object.keys(RoadLayers).map((value, index) => {
      return RoadLayers[value as keyof typeof RoadLayers];
    })
    const _terrainLayers = Object.keys(TerrainLayers).map((value, index) => {
      return TerrainLayers[value as keyof typeof TerrainLayers];
    })
    setLayerData([
      {
        title: '影像图层',
        data: _baseLayers,
      },
      {
        title: '路网图层',
        data: _roadLayers,
      },
      {
        title: '地形图层',
        data: _terrainLayers,
      },
    ])
  }

  const initLayers = () => {
    // 默认添加底图
    addImageLayer(BaseLayers.TIAN_MAP)
    addRoadLayer(RoadLayers.ROAD)
    addTerrainLayer(TerrainLayers.TERRAIN_STK)
  }

  useEffect(() => {
    // 获取 sdk web 服务地址
    const res = RTNWebMap3D?.getClientUrl()
    if (res) {
      setClientUrl(res)
    }
    initData()
    return () => {
      // 退出页面，关闭场景
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
          // 图层类型
          type: client.ProviderType.TIANDITU,
          // 天地图服务类型
          mapStyle: client.TiandituMapsStyle.IMG_C,
          /** 天地图访问 token */
          token: getTiandituToken(),
          /** 最大层级 默认 不限制 */
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
          /** 服务 url */
          url: 'https://dev.virtualearth.net',
          /** bing 地图服务类型 */
          mapStyle: client.BingMapsStyle.AERIAL,
          /** bing 地图服务访问 key */
          key: 'AtPtWBbxwoSMbcSNcICiUFaQg345fZfN7N6ZE_7UNHna1T84Q81myLQDCIfKIAMU',
        })
        break
      case BaseLayers.GEOVIS_IMG:
        client.scene.addImagelayer(name, {
          type: client.ProviderType.SUPERMAP,
          /** 服务 url */
          url: 'https://service.mapplus.com/iserver/services/map-geovis-img/rest/maps/GEOVIS_Img',
        })
        break
      case BaseLayers.SIWEIEARTH:
        client.scene.addImagelayer(name, {
          type: client.ProviderType.SUPERMAP,
          /** 服务 url */
          url: 'https://service.mapplus.com/iserver/services/map-siweidata-4326/rest/maps/siweiearth4326',
        })
        break
      case BaseLayers.GEOVIS_TER:
        client.scene.addImagelayer(name, {
          type: client.ProviderType.SUPERMAP,
          /** 服务 url */
          url: 'https://www.supermapol.com/proxy/of6bhhbv/iserver/services/map-geovis-ter-v2/rest/maps/GEOVIS_Ter',
          /** 认证信息 */
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
          /** 服务 url */
          url: 'https://service.mapplus.com/iserver/services/map-geovis-vec/rest/maps/GEOVIS_Vec',
        })
        break
      case BaseLayers.CHANG_GUANG:
        client.scene.addImagelayer(name, {
          type: client.ProviderType.CHANGGUANG,
          /** 最大层级 默认 不限制 */
          maximumLevel: 18,
          /** 服务 url */
          url: 'https://api.jl1mall.com/getMap/{z}/{x}/{reverseY}?mk=2d9bf902749f1630bc25fc720ba7c29f&tk=',
        })
        break
    }
  }

  /** 添加路网 */
  async function addRoadLayer(name: string) {
    // 获取三维地图sdk实例
    const client = Web3dUtils.getClient()
    if (!client) return
    let url = ''
    if (name !== '') {
      // 获取影像图层
      const layer = await client.scene.getImageLayers()
      if (layer && layer?.length > 0) {
        layer.forEach(async (data, index) => {
          if (data.name !== name && (
            data.name === RoadLayers.ROAD
            || data.name !== RoadLayers.ROAD_CHINA
          )) {
            // 添加底图前，先移除之前的底图
            await client.scene.removeImageLayer(index)
          }
        })
      }

      switch (name) {
        case RoadLayers.ROAD: {
          client.scene.addImagelayer(RoadLayers.ROAD, {
            type: client.ProviderType.TIANDITU,
            mapStyle: client.TiandituMapsStyle.CIA_C,
            token: getTiandituToken(),
            maximumLevel: 18,
          })
          break
        }
        case RoadLayers.ROAD_CHINA: {
          client.scene.addImagelayer(RoadLayers.ROAD_CHINA, {
            type: 0,
            url: 'https://service.mapplus.com/iserver/services/map-ugcv5-QuanguoBigRoad/rest/maps/QuanguoBigRoad',
            minimumLevel: 3,
            maximumLevel: 18,
            tilingSchemeType: client.TilingSchemeType.GCJ02TilingScheme,
          })
          break
        }
        case RoadLayers.XINGQIU_ROAD: {
          client.scene.addImagelayer(RoadLayers.XINGQIU_ROAD, {
            type: client.ProviderType.SUPERMAP,

            url: 'https://www.supermapol.com/proxy/g2yw6g0o/iserver/services/map-geovis-cia/rest/maps/GEOVIS_Cia',
          })
          break
        }
      }
    }
  }

  /** 添加地形, 使用client.scene.openTerrainLayer */
  async function addTerrainLayer(name: string) {
    // 获取三维地图sdk实例
    const client = Web3dUtils.getClient()
    if (!client) return
    const s3mLayer = await client.scene.getS3MLayers()
    client.scene.closeTerrainLayer()
    switch (name) {
      case TerrainLayers.TERRAIN_STK: {
        client.scene.openTerrainLayer(TerrainLayers.TERRAIN_STK, {
          type: client.ProviderType.SUPERMAP,
          url: 'https://service.mapplus.com/iserver/services/3D-stk_terrain/rest/realspace/datas/info/data/path',
          invisibility: true,
          requestWaterMask: true,
          requestVertexNormals: true,
          isSct: false,
        })
        if (s3mLayer && s3mLayer?.length > 0) {
          s3mLayer.forEach((item) => {
            client.scene.setTilesLayerBottomAltitude(item.name, 0)
          })
        }
        break
      }
      case TerrainLayers.TERRAIN_TIAN: {
        client.scene.openTerrainLayer(TerrainLayers.TERRAIN_TIAN, {
          type: client.ProviderType.TIANDITU,
          token: getTiandituToken(),
        })
        break
      }
      case TerrainLayers.TERRAIN_SUPERMAP:
        client.scene.openTerrainLayer(TerrainLayers.TERRAIN_SUPERMAP, {
          type: client.ProviderType.SCT,
          urls: ['https://maptiles.supermapol.com/iserver/services/3D-local3DCache-GlobalTIN30M/rest/realspace/datas/Global_TIN_30M'],
        })
        break
    }
  }

  const _renderSection = (info: { section: SectionListData<string, Section> }) => {
    return (
      <View
        style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center', backgroundColor: 'transparent' }}>
        <Text style={[{ fontSize: 16, color: '#333', marginTop: 10, marginBottom: 10 }]}>{info.section.title}</Text>
      </View>
    )
  }

  const _renderItem = ({ section, index }: SectionListRenderItemInfo<string, Section>) => {
    return (
      <TouchableOpacity
        key={index}
        style={{
          marginBottom: 8,
          borderRadius: 8,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#ddd',
        }}
        onPress={() => {
          switch (section.title) {
            case '影像图层':
              addImageLayer(section.data[index]);
              break
            case '路网图层':
              addRoadLayer(section.data[index]);
              break
            case '地形图层':
              addTerrainLayer(section.data[index]);
              break
          }
          setPanelVisible(false);
        }}
      >
        <Text style={{ textAlign: 'center', padding: 8 }}>{section.data[index]}</Text>
      </TouchableOpacity>
    )
  }

  if (!clientUrl) return

  return (
    <Webmap3DView
      clientUrl={clientUrl}
      onInited={client => {
        console.log('inited');
        Web3dUtils.setClient(client);
        initLayers()
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
              top: 0,
              right: 0,
              width: 300,
              backgroundColor: 'white',
              padding: 16,
            }}
          >
            <SectionList
              style={{ width: '100%' }}
              refreshing={false}
              sections={layerData}
              renderItem={_renderItem}
              renderSectionHeader={_renderSection}
              keyExtractor={(item, index) => index.toString()}
              initialNumToRender={15}
              ListFooterComponent={<View style={{ height: 8 }} />}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ paddingBottom: 60 }}
            />
          </View>
        )}
      </>
    </Webmap3DView>
  )
}