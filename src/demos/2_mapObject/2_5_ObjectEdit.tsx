/**
 * 图层风格Demo
 */
import { Client, PolygonHierarchy, Primitive, PrimitiveSolidLine, Vector2, Vector3, RTNWebMap3D, ILicenseInfo } from '@mapplus/react-native-webmap3d';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageRequireSource, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { icon_aim, icon_aim_disabled, icon_aim_point, icon_close, icon_editor, icon_hand_point, icon_hand_point_disabled, icon_node_add, icon_node_delete, icon_node_move, icon_node_select, icon_submit_black } from '../../assets';
import Webmap3DView from '../../components/Webmap3DView';
import { DemoStackPageProps } from '../../navigators/types';
import { LayerUtil, LicenseUtil, Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'ObjectEdit'> { }

const PointLayer = 'point'
const ImageLayer = 'image'
const LineLayer = 'line'
const RegionLayer = 'region'

type EditMethod = 'aim' | 'hand'

interface SelectData { primitiveId: string, layerName: string, type?: number }

export default function ObjectEdit(props: Props) {
  const [license, setLicense] = useState<ILicenseInfo | undefined>()

  const [editMethod, setEditMethod] = useState<EditMethod>('aim');
  const [isEdit, setIsEdit] = useState(false);

  const [selectData, setSelectData] = useState<SelectData>();
  const currentObject = useRef<Primitive & {
    id: string;
  } | undefined>(undefined)

  /** 准星图标句柄 用于获取屏幕坐标 */
  const aimPointImageRef = useRef<Image>(null)
  const editTimer = useRef<number | null>(null)
  const nodeIndex = useRef(-1)

  /** 历史记录，用于撤销 */
  const history = useRef<{
    /** 线面历史记录 */
    rlPositions: Vector3[][],
    /** 点历史记录 */
    pPositions: Vector3[],
  }>({
    rlPositions: [],
    pPositions: [],
  })

  /** 激活许可 */
  const initLicense = () => {
    LicenseUtil.active().then(res => {
      setLicense(res)
    })
  }

  useEffect(() => {
    // 选中对象后，开始编辑
    if (selectData) {
      startEdit(editMethod)
    }
  }, [selectData])

  const onLoad = (client: Client) => {
    Web3dUtils.setClient(client);
    initLayers()
    addSelectListener()
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
        image: 'appresource://symbol/image/ATM.png',
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
    const resourceBase = RTNWebMap3D.getResourceBase()
    client.scene.setAppResourceBase(resourceBase)

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
      removeSelectListener()
      stopTimer()
      // 退出页面，关闭场景
      Web3dUtils.getClient()?.scene.close()
      Web3dUtils.setClient(null)
    }
  }, [])

  /**
   * 切换编辑方式
   * @param method 
   * @returns 
   */
  const changeEditMethod = (method: EditMethod) => {
    const client = Web3dUtils.getClient();
    if (!client) return;
    setEditMethod(method)

    // submit(method)

    if (method === 'aim') {
      client.removeListener('touch_event', handleDrawListener)
      client.scene.setAction(client.SceneAction.NONE)
      client.scene.enableSceneTouch(true)
      client.scene.trackingLayer.removeAll()
    } else {
      startEdit(method)
    }
  }

  /**
   * 开始编辑
   * @param method 
   * @returns 
   */
  const startEdit = async (method: EditMethod) => {
    const client = Web3dUtils.getClient();
    if (!client || !selectData) return;
    // const primitive = await client.scene.primitiveLayers.getPrimitive(selectData.layerName, selectData.primitiveId)
    if (!currentObject.current) return

    if (method === 'aim') {
      client.scene.setAction(client.SceneAction.NONE)
      client.scene.enableSceneTouch(true)
      client.removeListener('touch_event', handleDrawListener)
    } else {
      client.addListener('touch_event', handleDrawListener)
      client.scene.enableSceneTouch(false)
      if (currentObject.current.type === client.PrimitiveType.SolidLine || currentObject.current.type === client.PrimitiveType.SolidRegion) {
        client.scene.setAction(client.SceneAction.TOUCH)
      }
    }

    await client.scene.trackingLayer.removeAll()

    switch (currentObject.current.type) {
      case client.PrimitiveType.SolidPoint:
      case client.PrimitiveType.Billboard: {
        if (method === 'hand') {
          client.scene.setAction(client.SceneAction.TRANSLATION)
          await client.scene.beginTranslation(selectData.layerName, currentObject.current.id, 'primitive')
        }

        break;
      }
      case client.PrimitiveType.SolidLine:
        client.scene.trackingLayer.editPolyline(
          client.ClassificationType.BOTH,
          (currentObject.current as PrimitiveSolidLine).positions as (number[] | Vector3[]),
        )
        break;
      case client.PrimitiveType.SolidRegion:
        client.scene.trackingLayer.editPolygon(
          client.ClassificationType.BOTH,
          (currentObject.current.hierarchy as PolygonHierarchy).positions,
        )
        break;
    }

  }

  let lastX: number, lastY: number
  /** 手势监听 */
  const handleDrawListener = async (data: { eventType: string, x: number, y: number }) => {
    const client = Web3dUtils.getClient();
    if (!client?.scene) return;
    const scene = client.scene
    const position = {
      x: data?.x,
      y: data?.y,
    }
    if (!position) return
    const llPoint = await scene.pickPosition({
      x: position.x,
      y: position.y,
    }, false)
    if (!llPoint) return

    if (data.eventType === 'touchBegin') {
      lastX = llPoint.x
      lastY = llPoint.y

      const index = await setEditNode(position)

      if (nodeIndex.current < 0 && index !== undefined && index >= 0) {
        nodeIndex.current = index
        scene.trackingLayer.setEditVertexIndex(index)
      }
    } else if (data.eventType === 'touchMove') {
      if (nodeIndex.current >= 0) {

        scene.trackingLayer.testEditMoveVertex(llPoint)
      }
    } else if (data.eventType === 'touchEnd') {
      if (lastX !== llPoint.x || lastY !== llPoint.y) {
        if (nodeIndex.current >= 0) {
          await addHistory()
          await scene.trackingLayer.editMoveVertex(
            llPoint,
            nodeIndex.current,
          )
        }
      }

    }

  }

  /** 设置编辑点 */
  const setEditNode = async (point: Vector2) => {
    const client = Web3dUtils.getClient();
    if (!client || !selectData) return;
    const trackingLayer = client.scene.trackingLayer
    if (!trackingLayer || !point) return -1
    // 通过屏幕点拾取编辑对象顶点索引
    const index = await trackingLayer?.editPickVertex({
      x: point?.x,
      y: point?.y,
    })
    if (index !== undefined && index >= 0) {
      nodeIndex.current = index
      // 设置编辑点
      trackingLayer.setEditVertexIndex(index)
      startTimer()
    }
    return index
  }

  /** 开启画线面定时器（提交前的虚线） */
  const startTimer = () => {
    const client = Web3dUtils.getClient();
    if (!client || !selectData) return;
    if (editTimer.current !== null || !client.scene || !client.scene.trackingLayer) return
    editTimer.current = window.setInterval(() => {
      // if (!scene.trackingLayer) return
      client.scene && aimPointImageRef.current?.measure(async (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const pointX = x + width / 2
        const pointY = y + height / 2
        const tempPoint = await client.scene?.pickPosition({
          x: pointX,
          y: pointY,
        }, false)
        tempPoint && client.scene.trackingLayer.testEditMoveVertex(tempPoint)
      })
    }, 200)
  }

  const stopTimer = () => {
    const client = Web3dUtils.getClient();
    if (!client || !selectData) return;
    if (editTimer.current !== null) {
      clearInterval(editTimer.current)
      editTimer.current = null
    }
    nodeIndex.current = -1
    client.scene.trackingLayer.removeAll()
    client.scene.trackingLayer.endEditTest()
    client.scene.trackingLayer.setEditVertexIndex(-1)
  }

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
      if (primitive) {
        currentObject.current = primitive
      }
      // 选中对象
      setSelectData({
        primitiveId: d.primitiveId,
        layerName: d.layerName,
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
  }

  /** 移除选择监听 */
  const removeSelectListener = () => {
    const client = Web3dUtils.getClient();
    if (!client) return;
    // 监听对象被选中事件
    client.removeListener('selected_primitive', selectHandler);
  }

  /** 编辑按钮 */
  const editAction = (edit?: boolean) => {
    const client = Web3dUtils.getClient();
    if (!client) return;
    let _edit = !isEdit
    if (edit !== undefined) _edit = edit
    if (!_edit) {
      // 取消编辑状态
      client.scene.setAction(client.SceneAction.NONE);
      client.scene.enableSceneTouch(true)
      client.scene.trackingLayer.editEnd()
      // 取消选中对象
      setSelectData(undefined)
      currentObject.current = undefined
      client.scene.trackingLayer.removeAll()
      stopTimer()
    } else {
      client.scene.setAction(client.SceneAction.SELECT);
    }
    setIsEdit(_edit);
  }

  const cancel = async () => {
    const client = Web3dUtils.getClient();
    if (!client) return;
    const action = await client.scene.getAction()
    if (action === client.SceneAction.TRANSLATION) {
      // 若是平移，则先结束平移
      client.scene.endTranslation(false)
    }
    // 取消编辑状态
    client.scene.setAction(client.SceneAction.SELECT);
    client.scene.enableSceneTouch(true)
    client.scene.trackingLayer.endEditTest()
    client.scene.trackingLayer.editEnd()
    // 取消选中对象
    setSelectData(undefined)
    currentObject.current = undefined
    client.scene.trackingLayer.removeAll()
    stopTimer()
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

  /** 添加一个历史记录 */
  const addHistory = async (position?: Vector3) => {
    const client = Web3dUtils.getClient();
    if (!client) return;
    const trackingLayer = client.scene.trackingLayer
    if (!trackingLayer) return

    const positions = await trackingLayer.currentEditVertex() as Vector3[]

    // 添加记录
    if (positions.length === 1 && position) {
      // 点或图片
      history.current.pPositions.push(position)
    } else if (positions.length > 1) {
      // 线或面
      Array.isArray(positions) && history.current.rlPositions.push(positions)
    }
  }

  /**  获取准星屏幕坐标 */
  const getAimPoint = (): Promise<Vector2 | null> => {
    return new Promise((resolve, reject) => {
      try {
        aimPointImageRef.current?.measure(async (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          const pointX = x + width / 2
          const pointY = y + height / 2

          resolve({
            x: pointX,
            y: pointY,
          })
        })
      } catch (error) {
        resolve(null)
      }
    })
  }

  const selectMode = () => {
    getAimPoint().then(async point => {
      point && setEditNode(point)
    })
  }

  /** 添加节点 */
  const addNode = async () => {
    const client = Web3dUtils.getClient();
    if (!client || !currentObject.current || !selectData) return;
    client.scene.enableSceneTouch(true)

    client.scene.setAction(client.SceneAction.NONE)
    getAimPoint().then(async point => {
      const trackingLayer = client.scene.trackingLayer
      if (!trackingLayer || !point) return
      const segment = await trackingLayer?.editPickSegment({
        x: point?.x,
        y: point?.y,
      })
      if (segment && segment.segmetIndex !== -1) {
        // 添加记录
        await addHistory()
        await trackingLayer.editAddVertex({
          x: segment.position.x, // point?.x,
          y: segment.position.y,
          z: segment.position.z,
        }, segment.segmetIndex + 1)
      }
    })
  }

  /** 删除节点 */
  const deleteNode = async () => {
    const client = Web3dUtils.getClient();
    if (!client || !currentObject.current || !selectData) return;
    const trackingLayer = client.scene.trackingLayer
    if (!trackingLayer || nodeIndex.current < 0) return
    await addHistory()
    const _nodeIndex = nodeIndex.current
    stopTimer()
    await trackingLayer.editRemoveVertex(_nodeIndex)

  }

  /** 移动节点 */
  const moveNode = async () => {
    const client = Web3dUtils.getClient();
    if (!client || !currentObject.current || !selectData) return;
    const trackingLayer = client.scene.trackingLayer
    if (!trackingLayer) return
    const point = await getAimPoint()
    if (!point) return

    await addHistory()

    switch (currentObject.current.type) {
      case client.PrimitiveType.SolidPoint:
      case client.PrimitiveType.Billboard: {
        const _p = await getAimPoint()
        const tempPoint = _p && await client.scene?.pickPosition(_p, false)
        if (tempPoint) {
          await client.scene.primitiveLayers.layerModifyPrimitive(
            selectData.layerName,
            {
              id: selectData.primitiveId,
              position: {
                x: tempPoint.x,
                y: tempPoint.y,
                z: currentObject.current.position.z,
              },
            },
          )
        }
        break
      }
      case client.PrimitiveType.SolidLine:
      case client.PrimitiveType.SolidRegion:
        client.scene.trackingLayer.editMoveVertex(point)
        break
    }
  }

  /** 移动对象 */
  const moveObject = async () => {
    const client = Web3dUtils.getClient();
    if (!client || !currentObject.current || !selectData) return;
    // 结束编辑预览
    await client.scene.trackingLayer.endEditTest()
    // 结束编辑
    await client.scene.trackingLayer.editEnd()

    // 设置平移Action
    client.scene.setAction(client.SceneAction.TRANSLATION)
    // 开始平移
    await client.scene.beginTranslation(selectData.layerName, currentObject.current.id, 'primitive')
  }

  /** 编辑后提交 */
  const submit = async (method?: EditMethod) => {
    const client = Web3dUtils.getClient();
    if (!client || !currentObject.current || !selectData) return;

    nodeIndex.current = -1

    switch (currentObject.current.type) {
      case client.PrimitiveType.SolidPoint:
      case client.PrimitiveType.Billboard: {
        if (!currentObject.current) break
        if (editMethod === 'hand') {
          await client.scene.endTranslation(true)
          await client.scene.setAction(client.SceneAction.NONE)
        } else {
          const _p = await getAimPoint()
          if (_p) {
            await client.scene.primitiveLayers.layerModifyPrimitive(
              selectData.layerName,
              {
                id: selectData.primitiveId,
                position: {
                  x: _p.x,
                  y: _p.y,
                  z: currentObject.current.position.z,
                },
              },
            )
            currentObject.current.position = {
              x: _p.x,
              y: _p.y,
              z: currentObject.current.position.z,
            }
          }
        }

        break
      }
      case client.PrimitiveType.SolidLine: {
        if (!currentObject.current) break
        const action = await client.scene.getAction()
        let positions: Vector3[] = [];
        if (action === client.SceneAction.TRANSLATION) {
          // 若是平移，结束平移
          await client.scene.endTranslation(true)
          await client.scene.setAction(client.SceneAction.NONE)
          // 获取平移后的对象点串
          const element = await client.scene.primitiveLayers.getPrimitive(selectData.layerName, currentObject.current.id)
          if (element && element.type === client.PrimitiveType.SolidLine) {
            positions = element.positions as Vector3[]
          }
        } else {
          // 结束预览
          await client.scene.trackingLayer.endEditTest()
          // 结束编辑
          positions = await client.scene.trackingLayer.editEnd() as Vector3[]
          stopTimer()
        }
        // 更新对象
        await client.scene.primitiveLayers.layerModifyPrimitive(
          selectData.layerName,
          {
            id: selectData.primitiveId,
            positions: positions as Vector3[],
          },
        );

        // 更新当前对象点串
        currentObject.current.positions = positions as Vector3[]
        break
      }
      case client.PrimitiveType.SolidRegion: {
        if (!currentObject.current) break
        let positions: Vector3[] = [];
        const action = await client.scene.getAction()
        if (action === client.SceneAction.TRANSLATION) {
          // 若是平移，结束平移
          await client.scene.endTranslation(true)
          await client.scene.setAction(client.SceneAction.NONE)
          // 获取平移后的对象点串
          const element = await client.scene.primitiveLayers.getPrimitive(selectData.layerName, currentObject.current.id)
          if (element && element.type === client.PrimitiveType.SolidRegion) {
            positions = (element.hierarchy as PolygonHierarchy).positions as Vector3[]
          }
        } else {
          // 结束预览
          await client.scene.trackingLayer.endEditTest()
          // 结束编辑
          positions = await client.scene.trackingLayer.editEnd() as Vector3[]
          stopTimer()
        }

        // 更新对象
        await client.scene.primitiveLayers.layerModifyPrimitive(
          selectData.layerName,
          {
            id: selectData.primitiveId,
            hierarchy: {
              positions: positions as Vector3[],
            },
          },
        );

        // 更新当前对象点串
        (currentObject.current.hierarchy as PolygonHierarchy).positions = positions as Vector3[]
        break
      }
    }

    await client.scene.trackingLayer.removeAll()
    // 提交后，继续编辑对象
    startEdit(method || editMethod)
  }

  /**
   * 图片按钮
   * @param image 
   * @returns 
   */
  const renderImageBtn = (image: ImageRequireSource, title: string, action: () => void) => {
    return (
      <TouchableOpacity
        style={styles.imgBtn}
        onPress={() => {
          if (!selectData) return
          action()
        }}
      >
        <Image source={image} style={{ width: 30, height: 30 }} />
        <Text style={{ fontSize: 10, color: '#000' }}>{title}</Text>
      </TouchableOpacity>
    )
  }

  /**
   * 编辑视图
   * @returns 
   */
  const renderToolsView = () => {
    const client = Web3dUtils.getClient();
    if (!selectData || !currentObject.current || !client) return null

    if (currentObject.current.type === client.PrimitiveType.SolidPoint || currentObject.current.type === client.PrimitiveType.Billboard) {
      return (
        <View style={styles.editBar}>
          <View style={styles.rowContent}>
            {editMethod === 'aim' && renderImageBtn(icon_node_move, '移动节点', moveNode)}
            {editMethod === 'hand' && renderImageBtn(icon_submit_black, '提交', submit)}
            {/* {renderImageBtn(icon_node_delete, '删除节点', deleteNode)} */}
            {renderImageBtn(icon_close, '取消', cancel)}
          </View>
        </View>
      )
    } else {
      return (
        <View style={styles.editBar}>
          <View style={styles.rowContent}>
            {renderImageBtn(icon_node_select, '选择节点', selectMode)}
            {renderImageBtn(icon_node_move, '移动节点', moveNode)}
            {renderImageBtn(icon_node_delete, '删除节点', deleteNode)}
            {renderImageBtn(icon_node_add, '添加节点', addNode)}
          </View>

          <View style={styles.rowContent}>
            {renderImageBtn(icon_node_move, '平移', moveObject)}
            {renderImageBtn(icon_submit_black, '提交', submit)}
            {renderImageBtn(icon_close, '取消', cancel)}
          </View>
        </View>
      )
    }
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
            style={[styles.methodBtn, { backgroundColor: isEdit ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => editAction()}
          >
            <Image source={icon_editor} style={styles.methodBtnImg} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  /**
   * 侧边编辑方式
   * @returns 
   */
  const renderToolsMethod = () => {
    if (!isEdit || !selectData) return null
    return (
      <View
        style={{
          position: 'absolute',
          top: 60,
          right: 10,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TouchableOpacity
          style={[styles.methodBtn, { backgroundColor: 'transparent' }]}
          activeOpacity={0.8}
          onPress={() => changeEditMethod('aim')}
        >
          <Image source={editMethod === 'aim' ? icon_aim : icon_aim_disabled} style={styles.methodBtnImg} />
          <Text style={{ fontSize: 10, color: '#fff', marginTop: 6 }}>准星打点</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodBtn, { backgroundColor: 'transparent' }]}
          activeOpacity={0.8}
          onPress={() => changeEditMethod('hand')}
        >
          <Image source={editMethod === 'hand' ? icon_hand_point : icon_hand_point_disabled} style={styles.methodBtnImg} />
          <Text style={{ fontSize: 10, color: '#fff', marginTop: 6 }}>手势打点</Text>
        </TouchableOpacity>
      </View>
    )
  }

  /** 画图中心点 */
  const renderAim = () => {
    if (editMethod !== 'aim') return null
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

  const renderTips = () => {
    if (!isEdit || selectData) return null
    return (
      <View style={styles.tipsView}>
        <View style={styles.tips}>
          <Text style={styles.tipsTxt}>请选择对象</Text>
        </View>
      </View>
    )
  }

  if (!license) return

  return (
    <Webmap3DView
      onInited={onLoad}
      navigation={props.navigation}
    >
      {renderTips()}
      {renderAim()}
      {renderTools()}
      {renderToolsMethod()}
      {renderToolsView()}
    </Webmap3DView>
  )
}

const styles = StyleSheet.create({
  editBar: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
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
  rowContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
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