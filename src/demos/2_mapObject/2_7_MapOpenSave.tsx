/**
 * 图层风格Demo
 */
import { Client } from 'client/webmap3d-client';
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { icon_close, icon_doc, icon_save } from '../../assets';
import Webmap3DView from '../../components/Webmap3DView';
import { DemoStackPageProps } from '../../navigators/types';
import { RTNWebMap3D } from '../../specs';
import NativeHTools from '../../specs/v1/NativeHTools';
import { ILicenseInfo } from '../../specs/v1/NativeWebMap3D';
import { LayerUtil, LicenseUtil, Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'MapOpenSave'> { }

const PointLayer = 'point'
const ImageLayer = 'image'
const LineLayer = 'line'
const RegionLayer = 'region'

type EditMethod = 'aim' | 'hand'

interface SelectData { primitiveId: string, layerName: string, type?: number }

export default function MapOpenSave(props: Props) {
  const [license, setLicense] = useState<ILicenseInfo | undefined>()
  const [clientUrl, setClientUrl] = useState<string | undefined>()

  /** 激活许可 */
  const initLicense = () => {
    LicenseUtil.active().then(res => {
      setLicense(res)
    })
  }

  const resourceBase = useMemo(() => {
    const base = RTNWebMap3D?.getResourceBase()
    return base || ''
  }, [])

  const onLoad = (client: Client) => {
    Web3dUtils.setClient(client);
    initLayers()
  }

  /** 添加点图层 */
  const addDefaultPointLayer = async () => {
    const client = Web3dUtils.getClient()
    if (client?.scene) {
      return await client.scene.primitiveLayers.addPrimitiveLayer(PointLayer, {
        type: client.PrimitiveType.SolidPoint,
        /** 大小pixelSize */
        size: 10,
        /** 填充颜色 */
        color: 'rgba(255, 0, 0, 1)',
        /** 遮挡深度 */
        disableDepthTestDistance: 10000000000,
        /** 随距离缩放参数，默认undefine表示不随距离缩放 */
        scaleByDistance: {
          near: 5000,
          nearValue: 1,
          far: 500000000,
          farValue: 1,
        },
        /** 相对地形的位置 */
        heightReference: client.HeightReference.CLAMP_TO_GROUND,
      })
    }
    return false
  }

  /** 添加图片图层 */
  const addDefaultImageLayer = async () => {
    const client = Web3dUtils.getClient()
    if (client?.scene) {
      return await client.scene.primitiveLayers.addPrimitiveLayer(ImageLayer, {
        type: client.PrimitiveType.Billboard,
        /** 大小pixelSize */
        image: `${resourceBase}/resource/symbol/image/ATM.png`,
        /** 遮挡深度 */
        disableDepthTestDistance: 10000000000,
        /** 图片高，单位px */
        height: 20,
        /** 图片宽，单位px */
        width: 20,
        /** 相对地形的位置 */
        heightReference: client.HeightReference.CLAMP_TO_GROUND,
      })
    }
    return false
  }

  /** 添加线图层 */
  const addDefaultLineLayer = async () => {
    const client = Web3dUtils.getClient()
    if (client?.scene) {
      return await client.scene.primitiveLayers.addPrimitiveLayer(LineLayer, {
        type: client.PrimitiveType.SolidLine,
        color: 'rgba(0, 100, 255, 1)',
        width: 2,
        /** 贴地方式 */
        classificationType: client.ClassificationType.BOTH,
      })
    }
    return false
  }

  /** 添加面图层 */
  const addDefaultRegionLayer = async () => {
    const client = Web3dUtils.getClient()
    if (client?.scene) {
      return await client.scene.primitiveLayers.addPrimitiveLayer(RegionLayer, {
        type: client.PrimitiveType.SolidRegion,
        /** 填充颜色 */
        color: 'rgba(0, 100, 255, 0.5)',
        /** 贴地方式 */
        classificationType: client.ClassificationType.BOTH,
      })
    }
    return false
  }

  /** 初始化默认图层 */
  const initLayers = async () => {
    const client = Web3dUtils.getClient();
    if (!client) return;

    // 若需要使用资源包中的资源，则需要设置资源路径
    client.scene.setResourceBase(resourceBase)

    // 默认添加底图
    LayerUtil.addImageLayer(LayerUtil.BaseLayers.TIAN_MAP)
    // 默认添加图网
    LayerUtil.addRoadLayer(LayerUtil.RoadLayers.ROAD)
    // 默认添加地形
    LayerUtil.addTerrainLayer(LayerUtil.TerrainLayers.TERRAIN_STK)

    client.scene.camera.flyTo({
      longitude: 104.09182,
      latitude: 30.52147,
      altitude: 1000,
      heading: 0,
      pitch: -90,
      roll: 0
    })

    await addDefaultPointLayer()
    await addDefaultImageLayer()
    await addDefaultLineLayer()
    await addDefaultRegionLayer()

    // 添加点、线、面、图片对象
    addPoint()
    addImage()
    addLine()
    addRegion()
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

  /**
   * 添加点
   */
  const addPoint = async () => {
    const client = Web3dUtils.getClient();
    if (!client) return;

    await client.scene.primitiveLayers.layerAddPrimitive(PointLayer, {
      //点位置
      position: {
        x: 104.09197291173261,  // 经度
        y: 30.522202566573696,   // 纬度
        z: 452.210838550299, // 高度
      },
    })
  }

  /**
   * 添加图片
   */
  const addImage = async () => {
    const client = Web3dUtils.getClient();
    if (!client) return;

    // 若添加了资源包，可在这里使用资源中的图片添加一个billboard
    await client.scene.primitiveLayers.layerAddPrimitive(ImageLayer, {
      //点位置
      position: {
        x: 104.09189452473518,  // 经度
        y: 30.52125513242423,   // 纬度
        z: 452.210838550299, // 高度
      },
    })
  }

  /**
   * 添加线
   */
  const addLine = async () => {
    const client = Web3dUtils.getClient();
    if (!client) return;

    await client.scene.primitiveLayers.layerAddPrimitive(LineLayer, {
      // 线的点串，按顺序分别为 [经度，纬度，高度，经度，纬度，高度，... ]
      positions: [
        104.08859448400918, 30.520262722685803, 450.63432308779284,
        104.09134848951884, 30.521003289516923, 451.9439052094984,
        104.09306035594514, 30.52094314089782, 452.72108470829755,
      ],
    });
  }

  /**
   * 添加面
   */
  const addRegion = async () => {
    const client = Web3dUtils.getClient();
    if (!client) return;

    await client.scene.primitiveLayers.layerAddPrimitive(RegionLayer, {
      hierarchy: {
        //面的点串，按顺序分别为 [经度，纬度，高度，经度，纬度，高度，... ]
        positions: [
          104.09041239594507, 30.522565980817113, 451.6263685815248,
          104.09039102991115, 30.52191151632133, 451.57037520826725,
          104.09126063326975, 30.521911503777226, 451.9677855978646,
          104.0912553009503, 30.522581351706652, 452.0128354292317,
        ],
      },
    });
  }

  const _saveMap = () => {
    const client = Web3dUtils.getClient();
    if (!client) return;

    client.scene.getMap().then(map => {
      NativeHTools?.openDocSave({
        fileSuffixChoices: ['.geojson'],
        newFileNames: ['map_' + new Date().getTime()], // 新建文件名
        // 默认文件路径
        defaultFilePathUri: 'file://docs/storage/Users/currentUser/test',
      }).then(async (files) => {
        console.log('openDoc', files);
        const client = Web3dUtils.getClient()
        if (!client) return

        NativeHTools?.writeFile(files[0], JSON.stringify(map)).then((res) => {
          console.log('writeFile', res);
          if (res) {
            console.log('地图已保存到：' + files[0])
          } else {
            console.log('地图保存失败')
          }
        })
      })
    });

  }

  const _openMap = () => {
    NativeHTools?.openDoc({
      fileSuffixFilters: ['文档|geojson'],
      // 默认文件路径
      defaultFilePathUri: 'file://docs/storage/Users/currentUser/test',
    }).then(async (files) => {
      console.log('openDoc', files);
      const client = Web3dUtils.getClient()
      if (!client) return

      NativeHTools?.readFile(files[0]).then((res) => {
        const map = JSON.parse(res)
        client.scene.open(map).then(() => {
          console.log('地图已打开：' + files[0])
        })
      })
    })
  }

  const _closeMap = () => {
    const client = Web3dUtils.getClient()
    if (!client) return
    client.scene.close()
  }

  /**
   * 侧边工具栏
   * @returns 
   */
  const renderTools = () => {
    return (
      <View
        style={{
          position: 'absolute',
          top: 60,
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            width: '30%',
            marginLeft: 10,
          }}>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={() => _saveMap()}
          >
            <Image source={icon_save} style={styles.methodBtnImg} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={() => _openMap()}
          >
            <Image source={icon_doc} style={styles.methodBtnImg} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={() => _closeMap()}
          >
            <Image source={icon_close} style={styles.methodBtnImg} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!license || !clientUrl) return

  return (
    <Webmap3DView
      clientUrl={clientUrl}
      onInited={onLoad}
      navigation={props.navigation}
    >
      {renderTools()}
    </Webmap3DView>
  )
}

const styles = StyleSheet.create({
  methodBtn: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginTop: 20
  },
  methodBtnImg: {
    height: 30,
    width: 30,
  },
});