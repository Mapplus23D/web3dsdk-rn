/**
 * 几何图形绘制Demo
 */
import { Circle, Client, Entity, Vector3 } from 'client/webmap3d-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { icon_aim_point, icon_circle_region, icon_line_black, icon_line_curve_black, icon_line_dashed, icon_point_black, icon_region_black } from '../../assets';
import Webmap3DView from '../../components/Webmap3DView';
import { DemoStackPageProps } from '../../navigators/types';
import { RTNWebMap3D } from '../../specs';
import { ILicenseInfo } from '../../specs/v1/NativeWebMap3D';
import { LicenseUtil } from '../../utils';

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
}

export default function DrawObject(props: Props) {
  const PointLayer = 'point'
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
  }, [])

  useEffect(() => {
    if (license) {
      // 获取 sdk web 服务地址
      const res = RTNWebMap3D?.getClientUrl()
      if (res) {
        setClientUrl(res)
      }
    }
    return () => {
      // 退出页面，关闭场景
      client?.scene.close()
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

    //对于地图初始化可以通过 `client.scene.open` 直接打开配置好的地图参数进行
    //或者手动调用相关方法进行

    // openInitMap() 方法内直接通过 `client.scene.open`来打开地图
    // openInitMap()

    // prepareInitMap()通过相机飞行，手动添加地形影像图层来达到相同效果
    prepareInitMap();
  }

  /**
   * 打开地图
   *
   * 通常我们完成一副地图后，可以通过
   *
   * `client.scene.getMap()` 以JSON形式获取当前地图的各种参数
   *
   * 后续可以通过 `client.scene.open()` 接口打开保存的地图，还原制作的场景
   *
   * 这里我们直接构造一个简单的地图结构来打开
   *
   * 地图的类型为 IMap3D, 除了 version， id 及 camera 外，其他参数可省略
   */
  async function openInitMap() {
    if (!client) return;

    client.scene.open({
      version: 1,
      id: 1,
      /** 相机所在地理位置及俯仰姿态角度参数 */
      camera: {
        //经度
        longitude: 101.64439721507041,
        //维度
        latitude: 29.08165789172511,
        //高度
        altitude: 5999049.208713511,
        //正北方向角度
        heading: 0,
        //俯仰角度
        pitch: -90,
        //倾斜角度
        roll: 0,
      },

      /** entity 图层，用来存放点线面等对象 */
      entitiesLayers: [
        {
          name: 'point',
          visible: true,
        },
        {
          name: 'line',
          visible: true,
        },
        {
          name: 'spline',
          visible: true,
        },
        {
          name: 'region',
          visible: true,
        },
      ],

      /** 影像图层，可填多个，后面的图层会盖再前面的图层上面 */
      imageLayers: [
        {
          //图层名
          name: 'image 1',
          visible: true,
          //图层参数， 目前支持 Supermap ，bing 和天地图，详细参数参考 ImageProvider
          provider: {
            type: client.ProviderType.BING,
            url: 'https://dev.virtualearth.net',
            mapStyle: client.BingMapsStyle.AERIAL,
            key: 'AgYCj_VzN0MWJ-4pgJj3I7bZym9kmbb-HDWjG5cgHFJxNOokbRcSEtUwJM3uWweh',
          },
        },
      ],

      /** 地形图层 只能有一个*/
      terrainLayer: {
        //图层名
        name: 'terrain',
        //图层参数， 目前支持 Supermap 和天地图，详细参数参考 TerrainProvider
        provider: {
          type: client.ProviderType.SUPERMAP,
          url: 'https://www.supermapol.com/realspace/services/3D-stk_terrain/rest/realspace/datas/info/data/path',
          invisibility: true,
          requestWaterMask: true,
          requestVertexNormals: true,
          isSct: false,
        },
        visible: true,
      },
    });
  }

  /**
   * 通过接口的形式初始化一副地图
   *
   * 通过手动调用相机飞行接口及添加影像和地形图层等初始化地图
   *
   * 实现与 `openInitMap()` 一样的效果
   */
  async function prepareInitMap() {
    await flyToInitPosition();
    await addImageLayer();
    await setTerrainLayer();
    await addDefaultLayer();
  }

  /**
   * 相机飞行（地图定位）到指定点位
   */
  async function flyToInitPosition() {
    if (!client) return;
    await client.scene.camera.flyTo({
      //经度
      longitude: 101.64439721507041,
      //维度
      latitude: 29.08165789172511,
      //高度
      altitude: 5999049.208713511,
      //正北方向角度
      heading: 0,
      //俯仰角度
      pitch: -90,
      //倾斜角度
      roll: 0,
    });
  }

  /**
   * 向当前地图中添加一个影像底图
   */
  async function addImageLayer() {
    if (!client) return;

    return client.scene.addImagelayer('image 1', {
      type: client.ProviderType.BING,
      url: 'https://dev.virtualearth.net',
      mapStyle: client.BingMapsStyle.AERIAL,
      key: 'AgYCj_VzN0MWJ-4pgJj3I7bZym9kmbb-HDWjG5cgHFJxNOokbRcSEtUwJM3uWweh',
    });
  }

  /**
   * 设置当前底图的地形
   */
  async function setTerrainLayer() {
    if (!client) return;

    client.scene.openTerrainLayer('terrain', {
      type: client.ProviderType.SUPERMAP,
      url: 'https://www.supermapol.com/realspace/services/3D-stk_terrain/rest/realspace/datas/info/data/path',
      invisibility: true,
      requestWaterMask: true,
      requestVertexNormals: true,
      isSct: false,
    });
  }

  /**
   * 添加一个entity图层用来存放对应类型对象，名称可自定义
   */
  async function addDefaultLayer() {
    if (!client) return;

    // 添加一个名为 `point` 的图层，存放点对象
    await client.scene.addEntitiesLayer(PointLayer);
    // 添加一个名为 `line` 的图层，存放线对象
    await client.scene.addEntitiesLayer(LineLayer);
    // 添加一个名为 `dashline` 的图层，存放虚线对象
    await client.scene.addEntitiesLayer(DashLine);
    // 添加一个名为 `spline` 的图层，存放曲线对象
    await client.scene.addEntitiesLayer(SplineLayer);
    // 添加一个名为 `region` 的图层，存放面对象
    await client.scene.addEntitiesLayer(RegionLayer);
    // 添加一个名为 `circle` 的图层，存放圆对象
    await client.scene.addEntitiesLayer(CircleLayer);
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

    // 向 point 图层添加一个点
    // 参数包含点的位置及样式风格
    const id = await client.scene.addEntity(PointLayer, {
      //点位置
      position: position,
      point: {
        color: 'rgba(0,126,235,1)',
        size: 10,
        heightReference: client.HeightReference.RELATIVE_TO_GROUND,
      },
    });

    // 若添加了资源包，可在这里使用资源中的图片添加一个billboard
    await client.scene.addEntity(PointLayer, {
      //点位置
      position: {
        x: 102,  // 经度
        y: 30,   // 纬度
        z: 1000, // 高度
      },
      billboard: {
        image: `${resourceBase}/resource/symbol/image/ATM.png`,
      }
    });

    // 记录添加的对象的id
    history.current.push({ layer: PointLayer, id })
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
    let _entity: Entity | null = null
    switch (drawType) {
      case DrawType.Line:
        layerName = LineLayer
        _entity = {
          polyline: {
            positions: points,
            // 线型为实线
            lineType: client.LineType.solid,
            // 贴地模式，这里设置为贴地
            classificationType: client.ClassificationType.BOTH,
            // 实线材质颜色
            material: 'rgba(0,235,235,.6)',
          },
        }
        break
      case DrawType.DashLine:
        layerName = DashLine
        _entity = {
          polyline: {
            positions: points,
            width: 6,
            // 线型为实线
            lineType: client.LineType.dashed,
            // 贴地模式，这里设置为贴地
            classificationType: client.ClassificationType.BOTH,
            // 实线材质颜色
            material: {
              /** 前景色 */
              color: 'rgba(0,235,235,.6)',
              /** 背景色 */
              gapColor: 'rgba(250, 28, 28, 0.6)',
              /** 间隔 */
              dashLength: 10,
            },
          },
        }
        break
      case DrawType.Spline:
        layerName = SplineLayer
        _entity = {
          polyline: {
            positions: points,
            width: 6,
            // 线型为实线
            lineType: client.LineType.solid,
            // 贴地模式，这里设置为贴地
            classificationType: client.ClassificationType.BOTH,
            // 实线材质颜色
            material: 'rgba(0,235,235,.6)',
          },
        }
        break
      case DrawType.Region:
        layerName = LineLayer
        _entity = {
          polygon: {
            hierarchy: {
              //面的点串，按顺序分别为 [经度，纬度，高度，经度，纬度，高度，... ]
              positions: points as Vector3[],
            },
            // 贴地模式，这里设置为贴地
            classificationType: client.ClassificationType.BOTH,
            // 面的填充模式，设置为纯色填充
            fillType: client.FillType.solid,
            // 设置填充颜色
            material: 'rgba(245,158,52,.6)',
          },
        }
        break
      case DrawType.Circle:
        layerName = CircleLayer
        _entity = {
          polygon: {
            hierarchy: points as Circle,
            // 贴地模式，这里设置为贴地
            classificationType: client.ClassificationType.BOTH,
            // 面的填充模式，设置为纯色填充
            fillType: client.FillType.solid,
            // 设置填充颜色
            material: 'rgba(245,158,52,.6)',
          },
        }
        break
    }
    if (!layerName || !_entity) return
    editPoints.current = []
    // 添加对象
    const entityId = await client.scene.addEntity(layerName, _entity)

    // 记录添加的对象的id
    history.current.push({ layer: layerName, id: entityId })

    // 清除绘制虚线对象
    await client.scene.trackingLayer.removeAll()
    // 清除绘制虚线timer
    endTimer()
  }

  const _undo = async () => {
    const _h = history.current.pop()
    if (_h) {
      return await client?.scene.removeEntity(_h.layer, _h.id)
    }
    return false
  }

  /** 开始绘制 */
  const _draw = () => {
    switch (drawType) {
      case DrawType.Point:
        addPoint()
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
        console.log('inited');
        setClient(client);
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