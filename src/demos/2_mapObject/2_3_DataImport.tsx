import { Client, ILicenseInfo, RTNWebMap3D } from '@mapplus/react-native-webmap3d';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { icon_import } from '../../assets';
import Webmap3DView from '../../components/Webmap3DView';
import { DemoStackPageProps } from '../../navigators/types';
import NativeHTools from '../../specs/v1/NativeHTools';
import { LayerUtil, LicenseUtil, Web3dUtils } from '../../utils';
import RNFS from '@react-native-ohos/react-native-fs';

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
  const openDict = async (type: 'kml' | 'shp') => {
    NativeHTools?.openDoc({
      // fileSuffixFilters: ['文档|.shp,xlsx,txt,kml'],
      fileSuffixFilters: ['文档|' + (type === 'kml' ? 'kml' : 'shp,dbf,prj,shx')],
      // 默认文件路径
      defaultFilePathUri: 'file://docs/storage/Users/currentUser/test',
    }).then(async (files) => {
      const client = Web3dUtils.getClient()
      if (!client) return

      let result = false
      if (type === 'kml') {
        for (const file of files) {
          console.log('openDoc kml-', type, files);
          result = await importKml(file)
          console.log('导入KML', file, result);
        }
      } else {
        console.log('openDoc shp-', type, files);
        result = await importShp(files)
        console.log('导入SHP', files, result);
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
    const _path = decodeURI( file.split('file://docs')[1] )
    console.log('_path', _path)
    const content = await RNFS.readFile( _path)
    // const content = await NativeHTools?.readFile(file)
    if (!content) return result
    const fileName = file.split('/').pop()
    if (!fileName) return result

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
  const importShp = async (files: string[]) => {
    let result = false
    const client = Web3dUtils.getClient()
    if (!client) return result
    const contents: {
      type: "base64";
      fileName: string;
      base64: string;
    }[] = []
    // 读取shp相关文件的base64内容，放到数组中
    console.log('读取文件----')
    for (const file of files) {
      const fileName = file.substring(file.lastIndexOf('/') + 1)
      const _path = decodeURI( file.split('file://docs')[1] )
      console.log('_path', _path)
      const content = await RNFS.readFile( _path, 'base64')
      // console.log('file', r)
      // const content = btoa(r);
      // const content = await NativeHTools?.readFile(file, 'base64')

      content && contents.push({
        type: "base64",
        fileName: fileName,
        base64: content,
      })
    }

    // 解析文件base64内容，转为geojson格式数据
    console.log('转换shp----')
    const f = await client.fileConverter.shp2Geojson(contents)

    console.log('添加----')
    // 添加geojson数据到图层中
    for (const element of f) {
      // 一份数据中可能会有点，线，面
      // 添加到图层时，会根据图层类型，把对应数据添加到图层中
      // 若当前图层和数据类型不一致，则不会添加到图层中
      result = await client.scene.primitiveLayers.addPrimitivesFromGeojson(
        DEFAULT_POINT_LAYER,
        element,
      )

      result = await client.scene.primitiveLayers.addPrimitivesFromGeojson(
        DEFAULT_LINE_LAYER,
        element,
      )

      result = await client.scene.primitiveLayers.addPrimitivesFromGeojson(
        DEFAULT_REGION_LAYER,
        element,
      )
    }
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
            onPress={() => openDict('kml')}
          >
            <Image source={icon_import} style={styles.methodBtnImg} />
            <Text style={styles.methodBtnTxt}>KML</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={() => openDict('shp')}
          >
            <Image source={icon_import} style={styles.methodBtnImg} />
            <Text style={styles.methodBtnTxt}>SHP</Text>
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
    height: 60,
    width: 40,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginTop: 20
  },
  methodBtnImg: {
    height: 24,
    width: 24,
  },
  methodBtnTxt: {
    fontSize: 10,
    marginTop: 4,
  },
});