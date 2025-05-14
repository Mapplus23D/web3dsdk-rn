import { Client, IMap3D } from 'client/webmap3d-client';
import { useEffect, useRef, useState } from 'react';
import { Button, View } from 'react-native';
import { DemoStackPageProps } from 'src/navigators/types';
import Webmap3DView from '../../components/Webmap3DView';
import { RTNWebMap3D } from '../../specs';

interface Props extends DemoStackPageProps<'DrawObject'> { }

export default function SceneGeneral(props: Props) {
  const [client, setClient] = useState<Client | undefined>();
  const [pointId, setPontId] = useState<string | undefined>();
  const [lineId, setLineId] = useState<string | undefined>();
  const [reginoId, setRegionId] = useState<string | undefined>();

  const saveMapRef = useRef<IMap3D | undefined>()

  const [clientUrl, setClientUrl] = useState<string | undefined>()

  useEffect(() => {
    // 获取 sdk web 服务地址
    RTNWebMap3D?.getClientUrl().then(res => {
      if (res) {
        setClientUrl(res)
      }
    })
  }, [])

  useEffect(() => {
    init();
  }, [client]);

  useEffect(() => {
    return () => {
      setPontId(undefined);
      setLineId(undefined);
      setRegionId(undefined);
    };
  }, []);

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
    await addPointLayer();
    await addLineLayer();
    await addRegionLayer();
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
   * 添加一个entity图层用来存放点对象
   */
  async function addPointLayer() {
    if (!client) return;

    // 添加一个名为 `point` 的图层
    await client.scene.addEntitiesLayer('point');
  }

  /**
   * 添加一个entity图层用来存放线对象
   */
  async function addLineLayer() {
    if (!client) return;

    // 添加一个名为 `line` 的图层
    await client.scene.addEntitiesLayer('line');
  }

  /**
   * 添加一个entity图层用来存放线对象
   */
  async function addRegionLayer() {
    if (!client) return;

    // 添加一个名为 `region` 的图层
    await client.scene.addEntitiesLayer('region');
  }

  /**
   * 向 `point` 图层添加一个点
   */
  async function addPoint() {
    if (!client) return;

    // 向 point 图层添加一个点
    // 参数包含点的位置及样式风格
    const id = await client.scene.addEntity('point', {
      //点位置
      position: {
        x: 101,  // 经度
        y: 29,   // 纬度
        z: 1000, // 高度
      },
      point: {
        color: 'red',
        size: 20,
        heightReference: client.HeightReference.RELATIVE_TO_GROUND,
      },
    });

    // 记录添加的对象的id及更新页面状态
    setPontId(id);
  }

  /**
   * 通过id修改通过 `addPoint()` 方法添加的点对象
   */
  async function modifyPoint() {
    if (!client || !pointId) return;

    // 修改指定图层和id的entity对象内容
    // 这里修改了刚刚添加到 `point` 图层的点对象的位置，颜色和大小
    client.scene.updateEntityModify('point', {
      // 指定要修改对象的id
      id: pointId,
      // 修改坐标，如若不设置 position 参数则不修改坐标
      position: {
        x: 102,
        y: 35,
        z: 12,
      },
      point: {
        color: 'blue',
        size: 40,
      },
    });
  }

  /**
   * 向 `line` 图层添加一条线
   */
  async function addLine() {
    if (!client) return;

    const id = await client.scene.addEntity('line', {
      polyline: {
        // 线的点串，按顺序分别为 [经度，纬度，高度，经度，纬度，高度，... ]
        positions: [
          84.64916879660377, 35.41425337598116, 2441.297051018675,
          94.29962737072826, 29.596452697455458, 3065.81650786256,
          109.86745231651254, 28.211645501645858, -1144.7837444679474,
          115.84428055333031, 35.56131945681637, -2512.2334337425114,
          121.03421361482295, 37.09584519266494, -2044.060080551752,
        ],
        // 线型为实线
        lineType: client.LineType.solid,
        // 实线材质颜色
        material: 'red',
      },
    });

    // 记录添加的对象的id及更新页面状态
    setLineId(id);
  }

  /**
   * 通过id修改通过 `addLine()` 方法添加的线对象
   */
  async function modifyLine() {
    if (!client || !lineId) return;

    // 修改指定图层和id的entity对象内容
    // 这里修改了刚刚添加到 `line` 图层的线对象的颜色和粗细
    client.scene.updateEntityModify('line', {
      // 指定要修改对象的id
      id: lineId,
      polyline: {
        // 修改线型为箭头线
        lineType: client.LineType.arrow,
        // 修改颜色
        material: 'blue',
        // 修改宽度
        width: 20,
      },
    });
  }

  /**
   * 向 `region` 图层添加一条线
   */
  async function addRegion() {
    if (!client) return;

    const id = await client.scene.addEntity('region', {
      polygon: {
        hierarchy: {
          //面的点串，按顺序分别为 [经度，纬度，高度，经度，纬度，高度，... ]
          positions: [
            97.05654907226486, 49.163686913320525, -206.9676341563623,
            113.51998246227959, 42.45171682621987, -307.9664735094599,
            107.49730354358402, 32.15467193547202, -1357.808834758404,
            94.56013180548646, 33.13695036109706, 4180.970800785241,
          ],
        },
        // 贴地模式，这里设置为贴地
        classificationType: client.ClassificationType.BOTH,
        // 面的填充模式，设置为纯色填充
        fillType: client.FillType.solid,
        // 设置填充颜色
        material: 'yellow',
      },
    });

    // 记录添加的对象的id及更新页面状态
    setRegionId(id);
  }

  /**
   * 通过id修改通过 `addRegion()` 方法添加的面对象
   */
  async function modifyRegion() {
    if (!client || !reginoId) return;

    // 修改指定图层和id的entity对象内容
    // 这里修改了刚刚添加到 `region` 图层的面对象的材质颜色
    client.scene.updateEntityModify('region', {
      // 指定要修改对象的id
      id: reginoId,
      polygon: {
        // 材质修改为网格
        fillType: client.FillType.gridding,
        // 设置网格材质颜色
        material: { color: 'pink' },
      },
    });
  }

  /**
   * 获取当前地图并保存下来
   */
  function getMap() {
    if (!client) return;

    client.scene.getMap().then(map => {
      saveMapRef.current = map
    });
  }

  /**
   * 打开保存下来的地图
   */
  function restoreMap() {
    if (client && saveMapRef.current) {
      client.scene.open(saveMapRef.current)
    }
  }

  if (!clientUrl) return

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Webmap3DView
        clientUrl={clientUrl}
        onInited={client => {
          console.log('inited');
          setClient(client);
        }}
        navigation={props.navigation}
      />
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
        }}>
        {client && (
          <View
            style={{
              width: '30%',
            }}>
            <View style={{ marginTop: 20 }}>
              <Button
                title={pointId === undefined ? ' 添加点' : '修改点'}
                onPress={pointId === undefined ? addPoint : modifyPoint}
              />
            </View>
            <View style={{ marginTop: 20 }}>
              <Button
                title={lineId === undefined ? ' 添加线' : '修改线'}
                onPress={lineId === undefined ? addLine : modifyLine}
              />
            </View>
            <View style={{ marginTop: 20 }}>
              <Button
                title={reginoId === undefined ? ' 添加面' : '修改面'}
                onPress={reginoId === undefined ? addRegion : modifyRegion}
              />
            </View>
            <View style={{ marginTop: 20 }}>
              <Button title={'保存地图'} onPress={getMap} />
            </View>
            <View style={{ marginTop: 20 }}>
              <Button title={'打开保存地图'} onPress={restoreMap} />
            </View>
          </View>

        )}
      </View>
    </View>
  );
}
