/**
 * 图层风格Demo
 */
import { Client, FillType, ILicenseInfo, LineType, RTNWebMap3D } from '@mapplus/react-native-webmap3d';
import { useEffect, useMemo, useState } from 'react';
import { Image, ImageRequireSource, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { icon_line_arrow, icon_line_black, icon_line_contour, icon_line_dashed, icon_line_solid, icon_pic, icon_point_black, icon_region_black, icon_region_grid, icon_region_solid, icon_region_stripe } from '../../assets';
import Webmap3DView from '../../components/Webmap3DView';
import { DemoStackPageProps } from '../../navigators/types';
import { LayerUtil, LicenseUtil, Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'LayerStyle'> { }

const PointLayer = 'point'
const LineLayer = 'line'
const RegionLayer = 'region'

interface SelectData { entityId: string, layerName: string, type?: number }

export default function LayerStyle(props: Props) {
  const [license, setLicense] = useState<ILicenseInfo | undefined>()

  const [selectData, setSelectData] = useState<SelectData>();

  const [img, setImg] = useState<SelectData>();
  const [point, setPont] = useState<SelectData>();
  const [line, setLine] = useState<SelectData>();
  const [region, setRegion] = useState<SelectData>();


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

    // 添加一个名为 `point` 的图层，存放点对象
    await client.scene.addEntitiesLayer(PointLayer);
    // 添加一个名为 `line` 的图层，存放线对象
    await client.scene.addEntitiesLayer(LineLayer);
    // 添加一个名为 `region` 的图层，存放面对象
    await client.scene.addEntitiesLayer(RegionLayer);

    // 添加点、线、面对象
    addPoint()
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

  const _onLoad = (client: Client) => {
    Web3dUtils.setClient(client);
    initLayers()
  }

  /**
   * 添加点和图片
   */
  async function addPoint() {
    const client = Web3dUtils.getClient();
    if (!client) return;

    // 向 point 图层添加一个点
    // 参数包含点的位置及样式风格
    const id = await client.scene.addEntity(PointLayer, {
      //点位置
      position: {
        x: 101,  // 经度
        y: 20,   // 纬度
        z: 1000, // 高度
      },
      point: {
        color: 'red',
        size: 20,
        heightReference: client.HeightReference.RELATIVE_TO_GROUND,
      },
    });

    setPont({
      entityId: id,
      layerName: PointLayer,
    })

    // 若添加了资源包，可在这里使用资源中的图片添加一个billboard
    const imageId = await client.scene.addEntity(PointLayer, {
      //点位置
      position: {
        x: 102,  // 经度
        y: 24,   // 纬度
        z: 1000, // 高度
      },
      point: undefined,
      billboard: {
        image: 'appresource://symbol/image/ATM.png',
        verticalOrigin: client.VerticalOrigin.baseline,
        width: 20,
        height: 20,
        disableDepthTestDistance: 50000000000,
        distanceDisplayCondition: { near: 0, far: 50000000000 },
        heightReference: 1,
      },
    });
    setImg({
      entityId: imageId,
      layerName: PointLayer,
    })
  }

  /**
   * 添加线
   */
  async function addLine() {
    const client = Web3dUtils.getClient();
    if (!client) return;

    const id = await client.scene.addEntity(LineLayer, {
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
        // 贴地方式
        classificationType: client.ClassificationType.BOTH,
      },
    });
    setLine({
      entityId: id,
      layerName: LineLayer,
      type: client.LineType.solid,
    })
  }

  /**
   * 添加面
   */
  async function addRegion() {
    const client = Web3dUtils.getClient();
    if (!client) return;

    const id = await client.scene.addEntity(RegionLayer, {
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
    setRegion({
      entityId: id,
      layerName: RegionLayer,
      type: client.FillType.solid,
    })
  }

  /**
   * 修改对象大小
   * @param size 
   * @returns 
   */
  const changeSize = (size: number) => {
    if (!selectData) return
    const client = Web3dUtils.getClient()
    if (!client) return
    switch (selectData.layerName) {
      case PointLayer:
        if (selectData.entityId === img?.entityId) {
          // 修改图片大小
          client.scene.updateEntityModify(selectData.layerName, {
            id: selectData.entityId,
            billboard: {
              width: size,
              height: size,
            },
          });
        } else if (selectData.entityId === point?.entityId) {
          // 修改点大小
          client.scene.updateEntityModify(selectData.layerName, {
            id: selectData.entityId,
            point: {
              size: size,
            },
          });
        }
        break;
      case LineLayer:
        if (selectData.entityId === line?.entityId) {
          // 修改线宽
          client.scene.updateEntityModify(selectData.layerName, {
            id: selectData.entityId,
            polyline: {
              lineType: line.type!,
              width: size,
            },
          });
        }
        break;
      case RegionLayer:
        if (selectData.entityId === region?.entityId) {
          // 修改面边框宽度
          client.scene.updateEntityModify(selectData.layerName, {
            id: selectData.entityId,
            polygon: {
              fillType: region.type!,
              outlineWidth: size,
              outline: true,
              outlineColor: 'red',
            },
          });
        }
        break;
      default:
        break;
    }
  }

  /**
   * 颜色按钮
   * @param color 
   * @returns 
   */
  const renderColorBtn = (color: string) => {
    return (
      <TouchableOpacity
        style={[styles.colorBtn, { backgroundColor: color }]}
        onPress={() => {
          if (!selectData) return
          const client = Web3dUtils.getClient()
          if (!client) return
          switch (selectData.layerName) {
            case PointLayer:
              if (selectData.entityId === img?.entityId) {
                client.scene.updateEntityModify(selectData.layerName, {
                  id: selectData.entityId,
                  billboard: {
                    image: color,
                  },
                });
              } else if (selectData.entityId === point?.entityId) {
                client.scene.updateEntityModify(selectData.layerName, {
                  id: selectData.entityId,
                  point: {
                    color: color,
                  },
                });
              }
              break;
            case LineLayer:
              if (selectData.entityId === line?.entityId) {
                let polyline = undefined
                if (line?.type === client.LineType.solid || line?.type === client.LineType.arrow) {
                  polyline = {
                    lineType: line.type,
                    material: color,
                  }
                } else if (line?.type === client.LineType.dashed) {
                  polyline = {
                    lineType: client.LineType.dashed,
                    material: {
                      /** 前景色 */
                      color: color,
                      /** 背景色 */
                      // gapColor?: string | PropertyAnimation<string>;
                      /** 间隔 */
                      // dashLength?: number;
                    },
                  }
                } else if (line?.type === client.LineType.contour) {
                  polyline = {
                    lineType: client.LineType.contour,
                    material: {
                      /** 内部颜色outlineInnerColor */
                      color: color,
                      /** 轮廓宽outlineOuterWidth */
                      outlineWidth: 4,
                      /** 轮廓颜色outlineOuterColor */
                      outlineColor: 'rgba(255, 127, 0, 1)',
                    }
                  }
                }
                polyline && client.scene.updateEntityModify(selectData.layerName, {
                  id: selectData.entityId,
                  polyline: polyline as any,
                });
              }
              break;
            case RegionLayer:
              if (selectData.entityId === region?.entityId) {
                let polygon = undefined
                if (region?.type === client.FillType.solid) {
                  polygon = {
                    fillType: client.FillType.solid,
                    material: color,
                  }
                } else if (region?.type === client.FillType.gridding) {
                  polygon = {
                    fillType: client.FillType.gridding,
                    material: {
                      color: color,
                      // cellAlpha?: number;
                      // lineCount?: number;
                      // lineThickness?: number;
                      // lineOffset?: number;
                    },
                  }
                } else if (region?.type === client.FillType.stripe) {
                  polygon = {
                    fillType: client.FillType.stripe,
                    material: {
                      evenColor: color,
                      oddColor: 'rgba(255, 127, 0, 1)',
                      repeat: 10,
                      // offset: number;
                      // orientationHorizontal: boolean;
                    }
                  }
                }
                polygon && client.scene.updateEntityModify(selectData.layerName, {
                  id: selectData.entityId,
                  polygon: polygon as any,
                });
              }
              break;
            default:
              break;
          }
        }}
      />
    )
  }

  /**
   * 图片按钮
   * @param image 
   * @returns 
   */
  const renderImageBtn = (props: {uri: string, imageUri: string}) => {
    return (
      <TouchableOpacity
        style={styles.imgBtn}
        onPress={() => {
          if (!selectData) return
          const client = Web3dUtils.getClient()
          if (!client) return
          client.scene.updateEntityModify(selectData.layerName, {
            id: selectData.entityId,
            billboard: {
              image: props.uri,
            },
          });
        }}
      >
        <Image source={{ uri: props.imageUri }} style={{ width: 30, height: 30 }} />
      </TouchableOpacity>
    )
  }

  /**
   * 线面类型按钮
   * @param image 
   * @param type 
   * @returns 
   */
  const renderTypeBtn = (image: ImageRequireSource, type: LineType | FillType) => {
    return (
      <TouchableOpacity
        style={styles.imgBtn}
        onPress={() => {
          if (!selectData) return
          const client = Web3dUtils.getClient()
          if (!client) return
          if (selectData && selectData.entityId === line?.entityId) {
            client.scene.updateEntityModify(selectData.layerName, {
              id: selectData.entityId,
              polyline: {
                lineType: type as LineType,
              },
            });

            setLine(data => {
              if (data) {
                return {
                  ...data,
                  type: type as LineType,
                }
              }
              return data
            })

          } else if (selectData && selectData.entityId === region?.entityId) {
            client.scene.updateEntityModify(selectData.layerName, {
              id: selectData.entityId,
              polygon: {
                fillType: type as FillType,
              },
            });

            setRegion(data => {
              if (data) {
                return {
                  ...data,
                  type: type as FillType,
                }
              }
              return data
            })
          }
        }}
      >
        <Image source={typeof image === 'string' ? { uri: image } : image} style={{ width: 30, height: 30 }} />
      </TouchableOpacity>
    )
  }

  /**
   * 线面对象类型
   * @returns 
   */
  const renderObjectType = () => {
    const client = Web3dUtils.getClient()
    if (!client) return
    if (selectData && selectData.entityId === line?.entityId) {
      return (
        <View style={styles.rowView}>
          <Text style={styles.rowTitle}>类型</Text>
          <View style={styles.rowContent}>
            {renderTypeBtn(icon_line_solid, client.LineType.solid)}
            {renderTypeBtn(icon_line_dashed, client.LineType.dashed)}
            {renderTypeBtn(icon_line_contour, client.LineType.contour)}
            {renderTypeBtn(icon_line_arrow, client.LineType.arrow)}
          </View>
        </View>
      )
    } else if (selectData && selectData.entityId === region?.entityId) {
      return (
        <View style={styles.rowView}>
          <Text style={styles.rowTitle}>类型</Text>
          <View style={styles.rowContent}>
            {renderTypeBtn(icon_region_solid, client.FillType.solid)}
            {renderTypeBtn(icon_region_grid, client.FillType.gridding)}
            {renderTypeBtn(icon_region_stripe, client.FillType.stripe)}
          </View>
        </View>
      )
    }
    return null
  }

  /**
   * 样式栏
   * @returns 
   */
  const renderStyleView = () => {
    if (!selectData) return null
    return (

      <KeyboardAvoidingView behavior={'position'} keyboardVerticalOffset={36}>
        <View style={styles.styleBar}>
          {renderObjectType()}
          {
            selectData.entityId !== img?.entityId &&
            <View style={styles.rowView}>
              <Text style={styles.rowTitle}>颜色</Text>
              <View style={styles.rowContent}>
                {renderColorBtn('red')}
                {renderColorBtn('green')}
                {renderColorBtn('blue')}
                {renderColorBtn('yellow')}
                {renderColorBtn('purple')}
              </View>
            </View>
          }
          {
            selectData.entityId === img?.entityId &&
            <View style={styles.rowView}>
              <Text style={styles.rowTitle}>图片</Text>
              <View style={styles.rowContent}>
                {renderImageBtn({uri: `appresource://symbol/image/ATM.png`, imageUri: `${resourceBase}/symbol/image/ATM.png`})}
                {renderImageBtn({uri: `appresource://symbol/image/起点.png`, imageUri: `${resourceBase}/symbol/image/起点.png`})}
                {renderImageBtn({uri: `appresource://symbol/image/终点.png`, imageUri: `${resourceBase}/symbol/image/终点.png`})}
                {renderImageBtn({uri: `appresource://symbol/image/超市.png`, imageUri: `${resourceBase}/symbol/image/超市.png`})}
                {renderImageBtn({uri: `appresource://symbol/image/地铁.png`, imageUri: `${resourceBase}/symbol/image/地铁.png`})}
              </View>
            </View>
          }

          <View style={styles.rowView}>
            <Text style={styles.rowTitle}>大小</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={'#000000ff'}
              keyboardType='numeric'
              onChangeText={(text) => {
                changeSize(Number(text))
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  /**
   * 侧边工具栏
   * @returns 
   */
  const renderTypes = () => {
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
            style={[styles.methodBtn, { backgroundColor: selectData?.entityId !== undefined && selectData?.entityId === img?.entityId ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setSelectData(data => data?.entityId !== undefined && data?.entityId === img?.entityId ? undefined : img)}
          >
            <Image source={icon_pic} style={styles.methodBtnImg} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: selectData?.entityId !== undefined && selectData?.entityId === point?.entityId ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setSelectData(data => data?.entityId !== undefined && data?.entityId === point?.entityId ? undefined : point)}
          >
            <Image source={icon_point_black} style={styles.methodBtnImg} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: selectData?.entityId !== undefined && selectData?.entityId === line?.entityId ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setSelectData(data => data?.entityId !== undefined && data?.entityId === line?.entityId ? undefined : line)}
          >
            <Image source={icon_line_black} style={[styles.methodBtnImg, { width: 24, height: 24 }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: selectData?.entityId !== undefined && selectData?.entityId === region?.entityId ? '#4680DF' : '#fff' }]}
            activeOpacity={0.8}
            onPress={() => setSelectData(data => data?.entityId !== undefined && data?.entityId === region?.entityId ? undefined : region)}
          >
            <Image source={icon_region_black} style={styles.methodBtnImg} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!license) return

  return (
    <Webmap3DView
      onInited={_onLoad}
      navigation={props.navigation}
    >
      {renderTypes()}
      {renderStyleView()}
    </Webmap3DView>
  )
}

const styles = StyleSheet.create({
  styleBar: {
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
    // justifyContent: 'space-between',
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
  colorBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 4,
    height: 40,
    width: 40,
    marginRight: 29,
    backgroundColor: '#3499E5'
  },
  imgBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 4,
    height: 40,
    width: 40,
    marginRight: 29,
    backgroundColor: 'rgba(229, 230, 235, 1)'
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
});
