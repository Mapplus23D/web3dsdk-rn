/**
 * 几何图形绘制Demo
 */
import { Circle, Client, Primitive, Vector3 } from 'client/webmap3d-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { icon_aim_point, icon_circle_region, icon_line_black, icon_line_curve_black, icon_line_dashed, icon_pic, icon_point_black, icon_region_black } from '../../assets';
import Webmap3DView from '../../components/Webmap3DView';
import { DemoStackPageProps } from '../../navigators/types';
import { RTNWebMap3D } from '../../specs';
import { ILicenseInfo } from '../../specs/v1/NativeWebMap3D';
import { LayerUtil, LicenseUtil, Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'DrawObject'> { }

/** 绘制类型 */
enum DrawType {
  Null,
  /** 点 */
  Point,
  /** 线 */
  Line,
  /** 虚线 */
  DashLine,
  /** 曲线 */
  Spline,
  /** 面 */
  Region,
  /** 圆 */
  Circle,
  /**  图片 */
  Image,
}

export default function DrawObject(props: Props) {
  const PointLayer = 'point'
  const ImageLayer = 'image'
  const LineLayer = 'line'
  const DashLine = 'dashline'
  const SplineLayer = 'spline'
  const RegionLayer = 'region'
  const CircleLayer = 'circle'

  const [license, setLicense] = useState<ILicenseInfo | undefined>()
  const [client, setClient] = useState<Client | undefined>();

  const [drawType, setDrawType] = useState<DrawType>(DrawType.Null);

  /** 准星图标句柄 用于获取屏幕坐标 */
  const aimPointImageRef = useRef<Image>(null)
  const editTimer = useRef<number | null>(null)
  const editPoints = useRef<Vector3[]>([])
  const history = useRef<{ layer: string, id: string }[]>([])

  const [clientUrl, setClientUrl] = useState<string | undefined>()

  const resourceBase = useMemo(() => {
    const base = RTNWebMap3D?.getResourceBase()
    return base || ''
  }, [])

  /** 激活许可 */
  const initLicense = () => {
    LicenseUtil.active().then(res => {
      setLicense(res)
    })
  }

  useEffect(() => {
    // 激活 sdk 许可
    initLicense()
    return () => {
      // 退出页面，关闭场景
      client?.scene.close()
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

  useEffect(() => {
    init();
  }, [client]);

  /**
   * 初始化方法
   *
   * 当sdk场景初始化完成，我们通过这里的初始化方法开始进行场景参数设置及地图初始化工作
   */
  function init() {
    if (!client) return;

    // 开启主动刷新模式
    // 对于静态地图建议开启主动刷新，大幅降低设备发热和电量消耗
    // 开启后，动态效果在不刷新的时候会完全静止
    client.scene.setRequestRenderMode(true);

    // 若需要使用资源包中的资源，则需要设置资源路径
    client.scene.setResourceBase(resourceBase)

    // prepareInitMap()通过相机飞行，手动添加地形影像图层来达到相同效果
    prepareInitMap();
  }

  /**
   * 通过接口的形式初始化一副地图
   *
   * 通过手动调用相机飞行接口及添加影像和地形图层等初始化地图
   *
   * 实现与 `openInitMap()` 一样的效果
   */
  async function prepareInitMap() {
    // 默认添加底图
    LayerUtil.addImageLayer(LayerUtil.BaseLayers.TIAN_MAP)
    // 默认添加图网
    LayerUtil.addRoadLayer(LayerUtil.RoadLayers.ROAD)
    // 默认添加地形
    LayerUtil.addTerrainLayer(LayerUtil.TerrainLayers.TERRAIN_STK)

    flyToInitPosition()

    await addDefaultLayer();
  }

  /**
   * 相机飞行（地图定位）到指定点位
   */
  async function flyToInitPosition() {
    if (!client) return;
    await client.scene.camera.flyTo({
      //经度
      longitude: 104.09182,
      //维度
      latitude: 30.52147,
      //高度
      altitude: 1000,
      //正北方向角度
      heading: 0,
      //俯仰角度
      pitch: -90,
      //倾斜角度
      roll: 0,
    });
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
        image: `${resourceBase}/resource/symbol/image/起点.png`,
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

  /** 添加线图层 */
  const addDefaultDashLineLayer = async () => {
    const client = Web3dUtils.getClient()
    if (client?.scene) {
      return await client.scene.primitiveLayers.addPrimitiveLayer(DashLine, {
        type: client.PrimitiveType.DashedLine,
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

  /**
   * 添加一个entity图层用来存放对应类型对象，名称可自定义
   */
  async function addDefaultLayer() {
    if (!client) return;

    // 添加默认图层
    await addDefaultPointLayer()
    await addDefaultImageLayer()
    await addDefaultLineLayer()
    await addDefaultDashLineLayer()
    await addDefaultRegionLayer()
  }

  const getDrawPosition = async (): Promise<Vector3 | null> => {
    return new Promise(resolve => {
      if (!client) return resolve(null)
      aimPointImageRef.current?.measure(async (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const pointX = x + width / 2
        const pointY = y + height / 2
        // 屏幕坐标转为地理坐标
        const tempPoint = await client.scene?.pickPosition({
          x: pointX,
          y: pointY,
        }, false)
        resolve(tempPoint)
      })
    })
  }

  /** 开启画线面定时器（提交前的虚线） */
  const startTimer = () => {
    // 相机、手绘和打点不使用定时器
    if (!client || editTimer.current !== null) return
    editTimer.current = window.setInterval(async () => {
      const scene = client.scene
      const tempPoint = await getDrawPosition()
      // tempPoint && scene.trackingLayer.testEditAddVertex(tempPoint, -1)
      tempPoint && scene.trackingLayer.testEditAddVertex(tempPoint, -1)
    }, 200)
  }

  /** 结束绘制虚线 */
  const endTimer = async () => {
    // await client.scene.trackingLayer.editEnd()
    if (editTimer.current) {
      window.clearInterval(editTimer.current)
      editTimer.current = null
    }
  }

  /**
   * 向 `point` 图层添加一个点
   */
  async function addPoint() {
    if (!client) return;

    // 获取点位置
    const position = await getDrawPosition()
    if (!position) return

    const id = await client.scene.primitiveLayers.layerAddPrimitive(PointLayer, {
      position: position,
    })
    // 记录添加的对象的id
    id && history.current.push({ layer: PointLayer, id })
  }

  /**
   * 向 `point` 图层添加一个图片
   */
  async function addImage() {
    if (!client) return;

    // 获取点位置
    const position = await getDrawPosition()
    if (!position) return

    const id = await client.scene.primitiveLayers.layerAddPrimitive(ImageLayer, {
      position: position,
    })
    // 记录添加的对象的id
    id && history.current.push({ layer: ImageLayer, id })
  }

  /** 在跟踪层上绘制线/面过程画点 */
  const drawPoint = async () => {
    const llPoint = await getDrawPosition()
    if (!client || !llPoint) return
    if (editTimer.current) {
      // 绘制点，有虚线连接
      await client.scene.trackingLayer.editAddVertex(llPoint, -1)
      editPoints.current.push(llPoint)
    } else {
      switch (drawType) {
        case DrawType.Line:
        case DrawType.DashLine:
          // 开始绘制线/虚线
          await client.scene.trackingLayer.editPolyline(client.ClassificationType.BOTH)
          break
        case DrawType.Spline:
          // 开始绘制曲线
          await client.scene.trackingLayer.editSpline(client.ClassificationType.BOTH, 1, 10)
          break
        case DrawType.Region:
          // 开始绘制面
          await client.scene.trackingLayer.editPolygon(client.ClassificationType.BOTH)
          break
        case DrawType.Circle:
          // 开始绘制圆
          await client.scene.trackingLayer.editCircle(client.ClassificationType.BOTH, false)
          break
      }

      await client.scene.trackingLayer.editAddVertex(llPoint, -1)
      // 记录绘制的点
      editPoints.current.push(llPoint)
      startTimer()
    }
  }

  /** 提交绘制 */
  const _submit = async () => {
    if (!client || drawType === DrawType.Null || drawType === DrawType.Point) return
    if ((drawType === DrawType.Line || drawType === DrawType.Spline || drawType === DrawType.DashLine) && editPoints.current.length < 2) {
      // 画线需要至少2个点
      return
    }
    if (drawType === DrawType.Region && editPoints.current.length < 3) {
      // 画面需要至少3个点
      return
    }
    let layerName = ''
    const points = await client.scene.trackingLayer.editEnd()
    let _primitive: Partial<Primitive> | null = null
    switch (drawType) {
      case DrawType.Line:
      case DrawType.Spline:
        layerName = LineLayer
        _primitive = {
          positions: points,
        }
        break
      case DrawType.DashLine:
        layerName = DashLine
        _primitive = {
          positions: points,
        }
        break
      case DrawType.Region:
        layerName = RegionLayer
        _primitive = {
          hierarchy: {
            positions: points as Vector3[],
          },
        }
        break
      case DrawType.Circle:
        layerName = RegionLayer
        _primitive = {
          hierarchy: points as Circle,
        }
        break
    }
    if (!layerName || !_primitive) return
    editPoints.current = []
    // 添加对象
    const entityId = await client.scene.primitiveLayers.layerAddPrimitive(layerName, _primitive as any)

    // 记录添加的对象的id
    entityId && history.current.push({ layer: layerName, id: entityId })

    // 清除绘制虚线对象
    await client.scene.trackingLayer.removeAll()
    // 清除绘制虚线timer
    endTimer()
  }

  const _undo = async () => {
    const _h = history.current.pop()
    if (_h) {
      return await client?.scene.primitiveLayers.layerRemovePrimitive(_h.layer, _h.id)
    }
    return false
  }

  /** 开始绘制 */
  const _draw = () => {
    switch (drawType) {
      case DrawType.Point:
        addPoint()
        break
      case DrawType.Image:
        addImage()
        break
      case DrawType.Line:
      case DrawType.DashLine:
      case DrawType.Spline:
      case DrawType.Region:
      case DrawType.Circle:
        drawPoint()
        break
    }
  }

  /** 左侧工具栏 */
  const _renderDrawMethods = () => {
    if (!client) return null
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
            style={[styles.methodBtn, { backgroundColor: drawType === DrawType.Image ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setDrawType(type => type === DrawType.Image ? DrawType.Null : DrawType.Image)}
          >
            <Image source={icon_pic} style={styles.methodBtnImg} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: drawType === DrawType.Point ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setDrawType(type => type === DrawType.Point ? DrawType.Null : DrawType.Point)}
          >
            <Image source={icon_point_black} style={styles.methodBtnImg} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: drawType === DrawType.Line ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setDrawType(type => type === DrawType.Line ? DrawType.Null : DrawType.Line)}
          >
            <Image source={icon_line_black} style={[styles.methodBtnImg, { width: 24, height: 24 }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: drawType === DrawType.DashLine ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setDrawType(type => type === DrawType.DashLine ? DrawType.Null : DrawType.DashLine)}
          >
            <Image source={icon_line_dashed} style={[styles.methodBtnImg, { width: 24, height: 24 }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: drawType === DrawType.Region ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setDrawType(type => type === DrawType.Region ? DrawType.Null : DrawType.Region)}
          >
            <Image source={icon_region_black} style={styles.methodBtnImg} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: drawType === DrawType.Spline ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setDrawType(type => type === DrawType.Spline ? DrawType.Null : DrawType.Spline)}
          >
            <Image source={icon_line_curve_black} style={styles.methodBtnImg} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: drawType === DrawType.Circle ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setDrawType(type => type === DrawType.Circle ? DrawType.Null : DrawType.Circle)}
          >
            <Image source={icon_circle_region} style={styles.methodBtnImg} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  /** 画图中心点 */
  const _renderAim = () => {
    if (!drawType) return null
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

  /** 绘制工具 */
  const _renderBar = () => {
    if (!drawType) return null
    return (
      <View style={styles.textBar}>
        <TouchableOpacity onPress={_undo} style={styles.bottomBtn}>
          <Text style={styles.bottomBtnText}>撤销</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={_draw} style={styles.bottomBtn}>
          <Text style={[styles.bottomBtnText, { fontSize: 30 }]}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => _submit()} style={styles.bottomBtn}>
          <Text style={styles.bottomBtnText}>提交</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!clientUrl) return

  return (
    <Webmap3DView
      clientUrl={clientUrl}
      onInited={client => {
        setClient(client);
        Web3dUtils.setClient(client)
      }}
      navigation={props.navigation}
    >
      {_renderDrawMethods()}
      {_renderAim()}
      {_renderBar()}
    </Webmap3DView>

  );
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
    width: 40,
    backgroundColor: '#3499E5'
  },
  bottomBtnText: {
    color: '#fff',
  },
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
  }
});