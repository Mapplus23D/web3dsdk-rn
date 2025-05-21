import { Buffer } from 'buffer';
import { Client } from 'client/webmap3d-client';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { icon_import } from '../../assets';
import Webmap3DView from '../../components/Webmap3DView';
import { DemoStackPageProps } from '../../navigators/types';
import { RTNWebMap3D } from '../../specs';
import NativeHTools from '../../specs/v1/NativeHTools';
import { ILicenseInfo } from '../../specs/v1/NativeWebMap3D';
import { LayerUtil, LicenseUtil, Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'DataImport'> { }

const DEFAULT_POINT_LAYER = 'default_point_layer'
const DEFAULT_LINE_LAYER = 'default_line_layer'
const DEFAULT_REGION_LAYER = 'default_region_layer'

export default function DataImport(props: Props) {
  const [license, setLicense] = useState<ILicenseInfo | undefined>()
  const [clientUrl, setClientUrl] = useState<string | undefined>()

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

    // 添加图层
    addDefaultPointLayer().then((result) => {
      console.log('添加点图层', result);
    })
    addDefaultLineLayer().then((result) => {
      console.log('添加线图层', result);
    })
    addDefaultRegionLayer().then((result) => {
      console.log('添加面图层', result);
    })
  }

  /** 添加点图层 */
  const addDefaultPointLayer = async () => {
    const client = Web3dUtils.getClient()
    if (client?.scene) {
      return await client.scene.primitiveLayers.addPrimitiveLayer(DEFAULT_POINT_LAYER, {
        type: client.PrimitiveType.SolidPoint,
        /** 大小pixelSize */
        size: 10,
        /** 填充颜色 */
        color: 'rgba(255, 0, 0, 1)',
        /** 遮挡深度 */
        disableDepthTestDistance: 10000,
        /** 随距离缩放参数，默认undefine表示不随距离缩放 */
        scaleByDistance: {
          near: 5000,
          nearValue: 1,
          far: 500000,
          farValue: 1,
        },
        /** 相对地形的位置 */
        heightReference: client.HeightReference.RELATIVE_TO_GROUND,
      })
    }
    return false
  }

  /** 添加线图层 */
  const addDefaultLineLayer = async () => {
    const client = Web3dUtils.getClient()
    if (client?.scene) {
      return await client.scene.primitiveLayers.addPrimitiveLayer(DEFAULT_LINE_LAYER, {
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
      return await client.scene.primitiveLayers.addPrimitiveLayer(DEFAULT_REGION_LAYER, {
        type: client.PrimitiveType.SolidRegion,
        /** 填充颜色 */
        color: 'rgba(0, 100, 255, 0.5)',
        /** 贴地方式 */
        classificationType: client.ClassificationType.BOTH,
      })
    }
    return false
  }

  useEffect(() => {
    // 1. 激活 sdk 许可
    initLicense()
    return () => {
      // 退出页面，关闭场景
      Web3dUtils.getClient()?.scene.close()
      Web3dUtils.setClient(null)
    }
  }, [])

  useEffect(() => {
    if (license) {
      // 2. 获取 sdk web 服务地址
      const res = RTNWebMap3D?.getClientUrl()
      if (res) {
        setClientUrl(res)
      }
    }
  }, [license])

  const _onLoad = (client: Client) => {
    // 3. 场景加载后，初始化图层
    Web3dUtils.setClient(client);
    initLayers()
  }

  /**
   * 打开文件管理器，选择文件
   */
  const openDict = async () => {
    NativeHTools?.openDoc({
      // fileSuffixFilters: ['文档|.shp,xlsx,txt,kml'],
      fileSuffixFilters: ['文档|kml'],
      // 默认文件路径
      defaultFilePathUri: 'file://docs/storage/Users/currentUser/test',
    }).then(async (files) => {
      console.log('openDoc', files);
      const client = Web3dUtils.getClient()
      if (!client) return

      let result = false
      for (const file of files) {
        if (file.endsWith('.kml')) {
          result = await importKml(file)
          console.log('添加', file, result);
        } else if (file.endsWith('.shp')) {
          result = await importShp(file)
          console.log('添加', file, result);
        }
      }
    })
  }

  /**
   * 导入kml文件
   * @param file 
   * @returns 
   */
  const importKml = async (file: string) => {
    let result = false
    const client = Web3dUtils.getClient()
    if (!client) return result
    const _content = await NativeHTools?.readFile(file)
    if (!_content) return result
    const fileName = file.split('/').pop()
    if (!fileName) return result

    const content = Buffer.from(_content, 'base64').toString()

    /** 导入到点图层 */
    result = await client.scene.primitiveLayers.addPrimitivesFromKml(
      DEFAULT_POINT_LAYER,
      content,
    )

    /** 导入到线图层 */
    result = await client.scene.primitiveLayers.addPrimitivesFromKml(
      DEFAULT_LINE_LAYER,
      content,
    )

    /** 导入到面图层 */
    result = await client.scene.primitiveLayers.addPrimitivesFromKml(
      DEFAULT_REGION_LAYER,
      content,
    )
    return result
  }

  /**
   * 导入shp文件
   * @param file 
   * @returns 
   */
  const importShp = async (file: string) => {
    let result = false
    const client = Web3dUtils.getClient()
    if (!client) return result
    const content = await NativeHTools?.readFile(file)
    if (!content) return result
    const fileName = file.split('/').pop()
    if (!fileName) return result

    // FileUtils.copyExternalFile(file, `${RNFS.DocumentDirectoryPath + '/' + fileName}`).then((res) => {
    //   console.log('copyExternalFile', res);
    // })
    // const _file = DataUtils.base64ToFile(content, fileName)
    // console.log('base64ToFile', _file);

    // const f = await DataUtils.vectorFile2Geojson([_file])

    // for (const element of f) {
    //   result = await client.scene.primitiveLayers.addPrimitivesFromGeojson(
    //     DEFAULT_POINT_LAYER,
    //     element,
    //   )
    //   console.log('addPrimitivesFromGeojson', result);
    // }

    // result = await client.scene.primitiveLayers.addPrimitivesFromGeojson(
    //   DEFAULT_POINT_LAYER,
    //   content,
    // )

    // result = await client.scene.primitiveLayers.addPrimitivesFromGeojson(
    //   DEFAULT_LINE_LAYER,
    //   content,
    // )

    // result = await client.scene.primitiveLayers.addPrimitivesFromGeojson(
    //   DEFAULT_REGION_LAYER,
    //   content,
    // )
    return result
  }


  /** 左侧工具栏 */
  const _renderTools = () => {
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
            onPress={openDict}
          >
            <Image source={icon_import} style={styles.methodBtnImg} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!license || !clientUrl) return

  return (
    <Webmap3DView
      clientUrl={clientUrl}
      onInited={_onLoad}
      navigation={props.navigation}
    >
      {_renderTools()}
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
    height: 24,
    width: 24,
  }
});