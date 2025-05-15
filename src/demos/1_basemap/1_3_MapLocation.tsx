import Geolocation from '@react-native-oh-tpl/geolocation';
import { Client } from 'client/webmap3d-client';
import { useEffect, useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { icon_location } from '../../assets';
import Webmap3DView from "../../components/Webmap3DView";
import { DemoStackPageProps } from '../../navigators/types';
import { RTNWebMap3D } from '../../specs';
import { ILicenseInfo } from '../../specs/v1/NativeWebMap3D';
import { LicenseUtil, Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'MapLocation'> { }

export default function MapLocation(props: Props) {

  const [license, setLicense] = useState<ILicenseInfo | undefined>()
  const [clientUrl, setClientUrl] = useState<string | undefined>()

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

  if (!license || !clientUrl) return

  return (
    <Webmap3DView
      clientUrl={clientUrl}
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