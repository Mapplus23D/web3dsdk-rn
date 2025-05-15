/**
 * 底图 Demo
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, SectionList, SectionListData, SectionListRenderItemInfo, Text, TouchableOpacity, View } from 'react-native';
import Webmap3DView from "../../components/Webmap3DView";
import { DemoStackPageProps } from '../../navigators/types';
import { RTNWebMap3D } from '../../specs';
import { ILicenseInfo } from '../../specs/v1/NativeWebMap3D';
import { LayerUtil, LicenseUtil, Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'BaseMap'> { }
interface Section {
  title: string
  data: string[]
}

export default function BaseMap(props: Props) {

  const [license, setLicense] = useState<ILicenseInfo | undefined>()
  const [clientUrl, setClientUrl] = useState<string | undefined>()
  const [panelVisible, setPanelVisible] = useState(false)
  const [layerData, setLayerData] = useState<Section[]>([])

  const rotateValue = useRef(new Animated.Value(0)).current; // 初始角度为0度

  /** 激活许可 */
  const initLicense = () => {
    LicenseUtil.active().then(res => {
      setLicense(res)
    })
  }

  /** 初始化数据 */
  const initData = () => {
    const _baseLayers = Object.keys(LayerUtil.BaseLayers).map((value, index) => {
      return LayerUtil.BaseLayers[value as keyof typeof LayerUtil.BaseLayers];
    })
    const _roadLayers = Object.keys(LayerUtil.RoadLayers).map((value, index) => {
      return LayerUtil.RoadLayers[value as keyof typeof LayerUtil.RoadLayers];
    })
    const _terrainLayers = Object.keys(LayerUtil.TerrainLayers).map((value, index) => {
      return LayerUtil.TerrainLayers[value as keyof typeof LayerUtil.TerrainLayers];
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

  /** 初始化默认图层 */
  const initLayers = () => {
    // 默认添加底图
    LayerUtil.addImageLayer(LayerUtil.BaseLayers.TIAN_MAP)
    // 默认添加图网
    LayerUtil.addRoadLayer(LayerUtil.RoadLayers.ROAD)
    // 默认添加地形
    LayerUtil.addTerrainLayer(LayerUtil.TerrainLayers.TERRAIN_STK)
  }

  useEffect(() => {
    // 激活 sdk 许可
    initLicense()
  }, [])

  useEffect(() => {
    // 激活sdk后，初始化
    if (license) {
      // 获取 sdk web 服务地址
      const res = RTNWebMap3D?.getClientUrl()
      if (res) {
        setClientUrl(res)
      }
      initData()
    }
    return () => {
      // 退出页面，关闭场景
      Web3dUtils.getClient()?.scene.close()
      Web3dUtils.setClient(null)
    }
  }, [license])

  useEffect(() => {
    // 添加按钮旋转动画
    Animated.timing(rotateValue, {
      toValue: panelVisible ? 45 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [panelVisible])

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
              LayerUtil.addImageLayer(section.data[index]);
              break
            case '路网图层':
              LayerUtil.addRoadLayer(section.data[index]);
              break
            case '地形图层':
              LayerUtil.addTerrainLayer(section.data[index]);
              break
          }
          setPanelVisible(false);
        }}
      >
        <Text style={{ textAlign: 'center', padding: 8 }}>{section.data[index]}</Text>
      </TouchableOpacity>
    )
  }

  if (!license || !clientUrl) return

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