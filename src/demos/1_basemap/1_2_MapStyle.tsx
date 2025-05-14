import { useEffect, useState } from 'react';
import { DemoStackPageProps } from 'src/navigators/types';
import Webmap3DView from "../../components/Webmap3DView";
import { RTNWebMap3D } from '../../specs';
import { Web3dUtils } from '../../utils';

interface Props extends DemoStackPageProps<'MapStyle'> { }

export default function MapStyle(props: Props) {

  const [clientUrl, setClientUrl] = useState<string | undefined>()

  useEffect(() => {
    // 获取 sdk web 服务地址
    const res = RTNWebMap3D?.getClientUrl()
    if (res) {
      setClientUrl(res)
    }
    return () => {
      Web3dUtils.setClient(null)
    }
  }, [])

  if (!clientUrl) return

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