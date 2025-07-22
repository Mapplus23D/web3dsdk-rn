import {
  Client,
  ILicenseInfo,
  IResource,
  MapError,
  RTNWebMap3D,
} from '@mapplus/react-native-webmap3d';
import {useEffect, useRef, useState} from 'react';
import {LicenseUtil} from '../../utils';
import Webmap3DView from '../../components/Webmap3DView';
import {DemoStackPageProps} from '../../navigators/types';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SlideCard from '../../components/SlideCard';
import {icon_import, icon_close, icon_save, icon_doc} from '../../assets';
import Toast from 'react-native-toast-message';
import Loading from '../../components/Loading';

interface Props extends DemoStackPageProps<'LocalMap'> {}

let isTempMap = true;

export default function LocalMap(props: Props) {
  const [license, setLicense] = useState<ILicenseInfo | undefined>();
  const clientRef = useRef<Client | undefined>();

  const [show, setShow] = useState(false);
  const [maps, setMaps] = useState<IResource[]>([]);

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
   * 初始化成功回调
   */
  const onInited = (client: Client) => {
    clientRef.current = client

    // 若需要使用资源包中的资源，则需要设置资源路径
    const base = RTNWebMap3D.getResourceBase()
    client.scene.setAppResourceBase(base)
  }

  /**
   * 导入地图
   * 支持扩展名为 .smam .sm3d 的地图
   * 以及导出的包含地图及资源的 .zip 压缩包
   */
  const onImport = async () => {
    setLoading(true);
    try {
      const res = await RTNWebMap3D.importMap();

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
          reason = '选择数据未包含地图数据';
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
   * 获取当前内部的地图列表并展示出来
   */
  const showMapList = () => {
    const res = RTNWebMap3D.getMaps();
    setMaps(res);

    setShow(true);
  };

  /**
   * 根据地图 uri 打开地图
   */
  const onOpen = async (uri: string) => {
    const client = clientRef.current;
    if (!client) return;

    setShow(false);

    const res = await client.scene.openMap(uri);

    isTempMap = false;

    console.log('open map', res);

    if(res) {
      const duration = await client.animation.getDuration()
      if(duration > 0) {
        client.animation.play()
      }
    }
  };

  /**
   * 保存地图
   */
  const onSave = async () => {
    const client = clientRef.current;
    if (!client) return;

    const mapName = isTempMap ? '未命名地图' : undefined;
    const res = await client.scene.saveMap(mapName);

    isTempMap = false;

    if (res) {
      Toast.show({
        text2: `已保存地图: ${res}`,
      });
    }
  };

  /**
   * 关闭当前打开的地图
   */
  const onClose = async () => {
    const client = clientRef.current;
    if (!client) return;

    isTempMap = true;

    client.scene.close();
  };

  /**
   * 从内部存储删除指定 uri 的地图
   * @param uri
   */
  const onDelete = async (uri: string) => {
    const res = await RTNWebMap3D.deleteMap(uri);

    if (res) {
      const mm = RTNWebMap3D.getMaps();
      setMaps(mm);
    }
  };

  /**
   * 导出指定 uri 的地图
   * 若地图包含资源，会将地图及资源打包到 .zip 压缩包中导出
   */
  const onExport = async (uri: string) => {
    const res = await RTNWebMap3D.exportMap(uri);

    setShow(false);
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
            onPress={onImport}>
            <Image source={icon_import} style={styles.methodBtnImg} />
            <Text style={styles.methodBtnTxt}>导入</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={showMapList}>
            <Image source={icon_doc} style={styles.methodBtnImg} />
            <Text style={styles.methodBtnTxt}>管理</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={onSave}>
            <Image source={icon_save} style={styles.methodBtnImg} />
            <Text style={styles.methodBtnTxt}>保存</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodBtn}
            activeOpacity={0.8}
            onPress={onClose}>
            <Image source={icon_close} style={styles.methodBtnImg} />
            <Text style={styles.methodBtnTxt}>关闭</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!license) return;

  return (
    <Webmap3DView
      onInited={onInited}
      navigation={props.navigation}>
      {renderTools()}
      <Loading visible={loading} />
      <SlideCard visible={show} onClose={() => setShow(false)}>
        <MapList
          maps={maps}
          onOpen={onOpen}
          onDelete={onDelete}
          onExport={onExport}
        />
      </SlideCard>
    </Webmap3DView>
  );
}

interface MapListProps {
  maps: IResource[];
  onOpen: (uri: string) => void;
  onDelete: (uri: string) => void;
  onExport: (uri: string) => void;
}

function MapList(props: MapListProps) {
  return (
    <FlatList
      data={props.maps}
      renderItem={item => {
        return (
          <MapItem
            map={item.item}
            onOpen={() => props.onOpen(item.item.uri)}
            onDelete={() => props.onDelete(item.item.uri)}
            onExport={() => props.onExport(item.item.uri)}
          />
        );
      }}
    />
  );
}

interface MapItemProps {
  map: IResource;
  onOpen: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function MapItem(props: MapItemProps) {
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
        {props.map.name}
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
          marginRight: 5,
        }}
        onPress={props.onExport}>
        <Text style={{color: 'rgb(66,165,245)'}}>导出</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          borderWidth: 1,
          padding: 4,
          borderColor: 'rgb(66,165,245)',
        }}
        onPress={props.onOpen}>
        <Text style={{color: 'rgb(66,165,245)'}}>打开</Text>
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
    width: 40,
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
