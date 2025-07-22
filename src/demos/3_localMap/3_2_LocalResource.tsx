import {useEffect, useMemo, useRef, useState} from 'react';
import Webmap3DView from '../../components/Webmap3DView';
import {
  Client,
  ILicenseInfo,
  IResourceTile,
  MapError,
  RTNWebMap3D,
} from '@mapplus/react-native-webmap3d';
import {DemoStackPageProps} from '../../navigators/types';
import {
  Image,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Loading from '../../components/Loading';
import SlideCard from '../../components/SlideCard';
import {LicenseUtil} from '../../utils';
import { icon_doc, icon_import, icon_save} from '../../assets';
import Toast from 'react-native-toast-message';

interface Props extends DemoStackPageProps<'LocalResource'> {}

export default function LocalResource(props: Props) {
  const [license, setLicense] = useState<ILicenseInfo | undefined>();
  const clientRef = useRef<Client | undefined>();

  const [show, setShow] = useState(false);
  const [tiles, setTiles] = useState<IResourceTile[]>([]);

  const [loading, setLoading] = useState(false);

  /** 激活许可 */
  const initLicense = () => {
    LicenseUtil.active().then(res => {
      setLicense(res);
    });
  };

  useEffect(() => {
    // 激活 sdk 许可
    initLicense();
  }, []);

  /**
   * 导入地形，影像以及s3m缓存瓦片的 zip 包
   */
  const onImportTiles = async () => {
    const client = clientRef.current;
    if (!client) return;

    setLoading(true);
    try {
      const res = await RTNWebMap3D.importTiles();

      setLoading(false);
      Toast.show({
        text1: '导入成功',
        text2: `已导入数据: ${res.name}`,
      });
    } catch (e) {
      setLoading(false);
      if (e instanceof MapError) {
        let reason = '';
        if (e.code === 1) {
          reason = '用户取消操作';
        } else if (e.code === 2) {
          reason = '选择数据未包含瓦片数据';
        } else {
          reason = '其他错误';
        }
        Toast.show({
          type: 'error',
          text1: '导入失败',
          text2: reason,
        });
      }
    }
  };

  /**
   * 获取所有导入的内部资源列表
   */
  const showList = async () => {
    const res = RTNWebMap3D.getTiles();
    setTiles(res);

    setShow(true);
  };

  /**
   * 保存当前地图
   */
  const saveMap = async () => {
    const client = clientRef.current;
    if (!client) return;

    const mapName = '本地资源地图'
    const res = await client.scene.saveMap(mapName);

    if(res) {
      Toast.show({
        text2: `已保存地图: ${res}`
      })
    }
  };

  /**
   * 将指定瓦片资源添加到当前地图
   * @param tile 内部管理的地形影像以及s3m缓存瓦片资源
   */
  const onAdd = async (tile: IResourceTile) => {
    const client = clientRef.current;
    if (!client) return;

    if (tile.type === 'image') {
      const res = await client.scene.addImagelayer('testImage', {
        type: client.ProviderType.SUPERMAP,
        url: tile.uri,
      });

      const ids = await client.scene.getImageLayers();

      client.scene.viewEntireImageLayer(ids.length - 1, 1);

      console.log('add image', res);
    } else if (tile.type === 'terrain') {
      const res = await client.scene.openTerrainLayer('testTerrain', {
        type: client.ProviderType.SUPERMAP,
        url: tile.uri,
      });

      console.log('open terrain', res);
    } else if (tile.type === 's3m') {
      const res = await client.scene.addS3MTilesLayer('testS3M', tile.uri);

      console.log('add s3m', res);
    }

    setShow(false);
  };

  /**
   * 从内部存储删除指定瓦片数据
   * @param tile 内部管理的地形影像以及s3m缓存瓦片资源
   */
  const onDelete = async (tile: IResourceTile) => {
    const res = await RTNWebMap3D.deleteTile(tile.uri);

    if (res) {
      const ts = RTNWebMap3D.getTiles();
      setTiles(ts);
    }
  };

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
        }}>
        <View
          style={{
            width: '30%',
            marginLeft: 10,
          }}>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={onImportTiles}>
            <Image source={icon_import} style={styles.methodBtnImg} />
            <Text style={styles.methodBtnTxt}>导入瓦片</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={showList}>
            <Image source={icon_doc} style={styles.methodBtnImg} />
            <Text style={styles.methodBtnTxt}>管理</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={saveMap}>
            <Image source={icon_save} style={styles.methodBtnImg} />
            <Text style={styles.methodBtnTxt}>保存地图</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!license) return;

  return (
    <Webmap3DView
      onInited={client => (clientRef.current = client)}
      navigation={props.navigation}>
      {renderTools()}
      <Loading visible={loading} />
      <SlideCard visible={show} onClose={() => setShow(false)}>
        <TileList tiles={tiles} onAdd={onAdd} onDelete={onDelete} />
      </SlideCard>
    </Webmap3DView>
  );
}

interface TileListProps {
  tiles: IResourceTile[];
  onAdd: (tile: IResourceTile) => void;
  onDelete: (tile: IResourceTile) => void;
}

interface SectionData {
  data: IResourceTile[];
  title: string;
}

function TileList(props: TileListProps) {
  const sectionDatas: SectionData[] = useMemo(() => {
    const image: SectionData = {
      data: [],
      title: '影像',
    };

    const terrain: SectionData = {
      data: [],
      title: '地形',
    };

    const s3m: SectionData = {
      data: [],
      title: 's3m',
    };

    props.tiles.forEach(t => {
      if (t.type === 'image') {
        image.data.push(t);
      } else if (t.type === 'terrain') {
        terrain.data.push(t);
      } else if (t.type === 's3m') {
        s3m.data.push(t);
      }
    });

    return [image, terrain, s3m];
  }, [props.tiles]);

  return (
    <View>
      <SectionList
        sections={sectionDatas}
        renderItem={info => {
          return (
            <TileItem
              tile={info.item}
              onAdd={() => props.onAdd(info.item)}
              onDelete={() => props.onDelete(info.item)}
            />
          );
        }}
        renderSectionHeader={info => {
          return <TileHeader title={info.section.title} />;
        }}
      />
    </View>
  );
}

function TileHeader(props: {title: string}) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        backgroundColor: '#EBEBEB',
        height: 40,
        justifyContent: 'center',
      }}>
      <Text>{props.title}</Text>
    </View>
  );
}

interface TileItemProps {
  tile: IResourceTile;
  onAdd: () => void;
  onDelete: () => void;
}

function TileItem(props: TileItemProps) {
  return (
    <View
      style={{
        height: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        flexDirection: 'row',
      }}>
      <Text
        style={{
          flex: 1,
        }}>
        {props.tile.name}
      </Text>

      <TouchableOpacity
        style={{
          borderWidth: 1,
          padding: 4,
          borderColor: 'rgba(230,74,25, 0.6)',
          marginRight: 5,
        }}
        onPress={props.onDelete}>
        <Text style={{color: 'rgba(230,74,25, 0.6)'}}>删除</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          borderWidth: 1,
          padding: 4,
          borderColor: 'rgb(66,165,245)',
        }}
        onPress={props.onAdd}>
        <Text style={{color: 'rgb(66,165,245)'}}>添加</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  methodBtn: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    width: 45,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginTop: 20,
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
