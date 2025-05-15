import { useEffect, useState } from 'react';
import Webmap3DView from "../../components/Webmap3DView";
import { DemoStackPageProps } from '../../navigators/types';
import { RTNWebMap3D } from '../../specs';
import { ILicenseInfo } from '../../specs/v1/NativeWebMap3D';
import { LicenseUtil, Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'MapStyle'> { }

export default function MapStyle(props: Props) {

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
      // 退出页面，关闭场景
      Web3dUtils.getClient()?.scene.close()
      Web3dUtils.setClient(null)
    }
  }, [license])

  if (!license || !clientUrl) return

  return (
    <Webmap3DView
      clientUrl={clientUrl}
      onInited={client => {
        console.log('inited');
        Web3dUtils.setClient(client);
      }}
      navigation={props.navigation}
    >

    </Webmap3DView>
  )
}