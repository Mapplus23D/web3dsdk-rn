/**
 * 图层样式 Demo
 */
import { useEffect, useState } from 'react';
import Webmap3DView from "../../components/Webmap3DView";
import { DemoStackPageProps } from '../../navigators/types';
import { LicenseUtil, Web3dUtils } from '../../utils';
import { ILicenseInfo } from '@mapplus/react-native-webmap3d';

interface Props extends DemoStackPageProps<'MapStyle'> { }

export default function MapStyle(props: Props) {

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
      // 退出页面，关闭场景
      Web3dUtils.getClient()?.scene.close()
      Web3dUtils.setClient(null)
    }
  }, [license])

  if (!license) return

  return (
    <Webmap3DView
      onInited={client => {
        console.log('inited');
        Web3dUtils.setClient(client);
      }}
      navigation={props.navigation}
    >

    </Webmap3DView>
  )
}