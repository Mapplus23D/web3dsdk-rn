/**
 * 图层风格Demo
 */
import { Client, Primitive, RTNWebMap3D, ILicenseInfo } from '@mapplus/react-native-webmap3d';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageRequireSource, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { icon_add, icon_close, icon_delete, icon_submit_black } from '../../assets';
import Webmap3DView from '../../components/Webmap3DView';
import { DemoStackPageProps } from '../../navigators/types';
import { LayerUtil, LicenseUtil, Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'ObjectAttribute'> { }

const PointLayer = 'point'
const ImageLayer = 'image'
const LineLayer = 'line'
const RegionLayer = 'region'

interface SelectData { primitiveId: string, layerName: string, type: number, properties?: Record<string, any> }

export default function ObjectAttribute(props: Props) {
  const [license, setLicense] = useState<ILicenseInfo | undefined>()
  const [clientUrl, setClientUrl] = useState<string | undefined>()

  const [selectData, setSelectData] = useState<SelectData>();
  const currentObject = useRef<Primitive & {
    id: string;
  } | undefined>(undefined)

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

    // 设置为选择模式
    setSelectAction(true)
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
      }, [
        // 默认属性
        {
          propertyName: '名称',
          valueType: 'string',
          defualtValue: 'point',
        },
        {
          propertyName: '地址',
          valueType: 'string',
          defualtValue: '',
        },
      ])
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
      }, [
        // 默认属性
        {
          propertyName: '名称',
          valueType: 'string',
          defualtValue: 'image',
        },
        {
          propertyName: '地址',
          valueType: 'string',
          defualtValue: '',
        },
      ])
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
      }, [
        // 默认属性
        {
          propertyName: '名称',
          valueType: 'string',
          defualtValue: 'line',
        },
        {
          propertyName: '地址',
          valueType: 'string',
          defualtValue: '',
        },
      ])
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
      }, [
        // 默认属性
        {
          propertyName: '名称',
          valueType: 'string',
          defualtValue: 'region',
        },
        {
          propertyName: '地址',
          valueType: 'string',
          defualtValue: '',
        },
      ])
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

    // 定位到指定位置
    client.scene.camera.flyTo({
      longitude: 104.09182,
      latitude: 30.52147,
      altitude: 1000,
      heading: 0,
      pitch: -90,
      roll: 0
    })

    // 添加默认图层
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
      removeSelectListener()
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

  const selectHandler = (data: {
    layerName: string;
    primitiveId: string;
  }[]) => {
    const client = Web3dUtils.getClient();
    if (!client) return;
    data.map(async (d: {
      layerName: string;
      primitiveId: string;
    }) => {
      const primitive = await client.scene.primitiveLayers.getPrimitive(d.layerName, d.primitiveId)
      if (!primitive) {
        return
      }
      currentObject.current = primitive

      // 选中对象
      setSelectData({
        primitiveId: d.primitiveId,
        layerName: d.layerName,
        properties: primitive.properties,
        type: primitive.type,
      })

      return { layerName: d.layerName, id: d.primitiveId }
    })
  }

  /** 添加选择监听 */
  const addSelectListener = () => {
    const client = Web3dUtils.getClient();
    if (!client) return;
    // 监听对象被选中事件
    client.addListener('selected_primitive', selectHandler);
    client.scene.setAction(client.SceneAction.SELECT)
  }

  /** 移除选择监听 */
  const removeSelectListener = () => {
    const client = Web3dUtils.getClient();
    if (!client) return;
    // 监听对象被选中事件
    client.removeListener('selected_primitive', selectHandler);
    client.scene.setAction(client.SceneAction.NONE)
  }

  /**
   * 设置选择操作
   * @param select 
   */
  const setSelectAction = (select: boolean) => {
    if (select) {
      addSelectListener()
    } else {
      removeSelectListener()
    }
  }

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
      properties: {
        '名称': '点' + new Date().getTime(),
        '地址': '点地址',
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
      properties: {
        '名称': '图片' + new Date().getTime(),
        '地址': '图片地址',
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
      properties: {
        '名称': '线' + new Date().getTime(),
        '地址': '线地址',
      },
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
      properties: {
        '名称': '面' + new Date().getTime(),
        '地址': '面地址',
      },
    });
  }

  /** 编辑后提交 */
  const submit = async () => {
    const client = Web3dUtils.getClient();
    if (!client || !currentObject.current || !selectData) return;

    // 提交修改的属性
    await client.scene.primitiveLayers.layerModifyPrimitive(
      selectData.layerName,
      {
        id: selectData.primitiveId,
        properties: currentObject.current.properties || {},
      },
    )
    // 提交后，可继续选择对象
    setSelectAction(true)
  }

  const close = () => {
    // 关闭属性编辑界面
    setSelectData(undefined)
    currentObject.current = undefined
    // 开始选择对象
    setSelectAction(true)
  }

  const addAttribute = async () => {
    const client = Web3dUtils.getClient();
    if (!client || !currentObject.current || !selectData) return;
    // 添加属性
    const result = await client.scene.primitiveLayers.addLayerPrimitivePropertyInfo(selectData.layerName, {
      propertyName: '新属性',
      valueType: 'string',
      defualtValue: '',
    })
    if (result) {
      currentObject.current.properties = currentObject.current.properties || {}
      currentObject.current.properties['新属性'] = ''
      setSelectData((data) => {
        if (!data) return undefined
        return {
          ...data,
          properties: currentObject.current?.properties,
        }
      })
    }
  }

  const deleteAttribute = async () => {
    const client = Web3dUtils.getClient();
    if (!client || !currentObject.current || !selectData) return;
    // 删除属性
    const result = await client.scene.primitiveLayers.removeLayerPrimitivePropertyInfo(selectData.layerName, '新属性')
    if (result) {
      currentObject.current.properties = currentObject.current.properties || {}
      delete currentObject.current.properties['新属性']
      // 删除后，重新渲染属性视图
      setSelectData((data) => {
        if (!data) return undefined
        return {
          ...data,
          properties: currentObject.current?.properties,
        }
      })

    }
  }

  const renderTips = () => {
    if (selectData) return null
    return (
      <View style={styles.tipsView}>
        <View style={styles.tips}>
          <Text style={styles.tipsTxt}>请选择对象</Text>
        </View>
      </View>
    )
  }

  const onChangeText = (key: string, value: string) => {
    if (!selectData || !currentObject.current) return
    // 更新选中对象的属性
    currentObject.current.properties = currentObject.current.properties || {}
    currentObject.current.properties[key] = value
  }

  const renderInputRow = (key: string, value: string) => {
    return (
      <View style={styles.rowView}>
        <Text style={styles.rowTitle}>{key}:</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={'#000000ff'}
          defaultValue={value}
          onChangeText={(text) => {
            onChangeText(key, text)
          }}
        />
      </View>
    )
  }

  /**
   * 图片按钮
   * @param image 
   * @returns 
   */
  const renderImageBtn = (image: ImageRequireSource, action: () => void) => {
    return (
      <TouchableOpacity
        style={styles.imgBtn}
        onPress={action}
      >
        <Image source={image} style={{ width: 30, height: 30 }} />
      </TouchableOpacity>
    )
  }

  const renderAttributeView = () => {
    if (!selectData) return null
    selectData.properties = selectData.properties || {}
    const keys = Object.keys(selectData.properties)
    const views: ReactNode[] = []
    for (const key of keys) {
      if (selectData.properties[key] === undefined || selectData.properties[key] === null) {
        selectData.properties[key] = ''
      } else if (typeof selectData.properties[key] === 'object') {
        selectData.properties[key] = JSON.stringify(selectData.properties[key])
      }

      views.push(renderInputRow(key, selectData.properties[key]))
    }
    return (
      <KeyboardAvoidingView behavior={'position'} keyboardVerticalOffset={36}>
        <View style={styles.attributeView}>
          {views}
          <View style={styles.attributeBottomView}>
            {renderImageBtn(icon_close, close)}
            {renderImageBtn(icon_add, addAttribute)}
            {renderImageBtn(icon_delete, deleteAttribute)}
            {renderImageBtn(icon_submit_black, submit)}
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  if (!license || !clientUrl) return

  return (
    <Webmap3DView
      clientUrl={clientUrl}
      onInited={onLoad}
      navigation={props.navigation}
    >
      {renderTips()}
      {renderAttributeView()}
    </Webmap3DView>
  )
}

const styles = StyleSheet.create({
  attributeView: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
  },
  attributeBottomView: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rowView: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    width: '100%',
  },
  rowTitle: {
    fontSize: 14,
    color: '#000',
    width: 50,
  },
  input: {
    flex: 1,
    backgroundColor: '#efefef',
    height: 40,
    color: '#000',
    borderRadius: 4,
    textAlign: 'center',
  },
  imgBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 4,
    height: 40,
    width: '25%',
  },
  tipsView: {
    position: 'absolute',
    top: 20,
    left: 0,
    height: 30,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tips: {
    backgroundColor: '#rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 5,
    textAlign: 'center',
  },
  tipsTxt: {
    color: '#fff',
    fontSize: 14,
  }
});