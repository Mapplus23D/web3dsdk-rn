/**
 * 定位 Demo
 */
import Geolocation from '@react-native-oh-tpl/geolocation';
import { useEffect, useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { icon_location } from '../../assets';
import Webmap3DView from "../../components/Webmap3DView";
import { DemoStackPageProps } from '../../navigators/types';
import { LicenseUtil, Web3dUtils } from '../../utils';
import { Client, ILicenseInfo } from '@mapplus/react-native-webmap3d';

interface Props extends DemoStackPageProps<'MapLocation'> { }

export default function MapLocation(props: Props) {

  const [license, setLicense] = useState<ILicenseInfo | undefined>()

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

    return () => {
      Web3dUtils.getClient()?.scene.close()
      Web3dUtils.setClient(null)
    }
  }, [license])

  const _onLoad = (client: Client) => {
    Web3dUtils.setClient(client);
    // 添加底图
    client.scene.addImagelayer('天地图', {
      type: client.ProviderType.BING,
      url: 'https://dev.virtualearth.net',
      mapStyle: client.BingMapsStyle.AERIAL,
      key: 'AtPtWBbxwoSMbcSNcICiUFaQg345fZfN7N6ZE_7UNHna1T84Q81myLQDCIfKIAMU',
    })
  }

  const _locate = () => {
    // 申请定位全新啊
    Geolocation.requestAuthorization(() => {
      // 获取当前位置
      Geolocation.getCurrentPosition((position) => {
        // 相机移动到当前位置
        Web3dUtils.getClient()?.scene.camera.flyTo({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          altitude: 1000,
          heading: 0,
          pitch: -90,
          roll: 0
        })
      })
    })
  }

  if (!license) return

  return (
    <Webmap3DView
      onInited={_onLoad}
      navigation={props.navigation}
    >
      <>
        <TouchableOpacity
          onPress={_locate}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: 100,
            right: 20,
            backgroundColor: 'rgba(255,255,255,1)',
            borderRadius: 4,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <Image
            source={icon_location}
            style={[
              {
                height: 30,
                width: 30,
              },
            ]}
            resizeMode='contain'
          />
        </TouchableOpacity>
      </>
    </Webmap3DView>
  )
}