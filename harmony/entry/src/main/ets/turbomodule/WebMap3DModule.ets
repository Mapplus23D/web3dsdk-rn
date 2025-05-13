import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import { WebMap3D } from 'webmap3d/Index';

export class WebMap3DModule extends TurboModule implements TM.RTNWebMap3D.Spec {

  initEnvironment(clientPort: number): Promise<void> {
    return new Promise(resolve => {
      WebMap3D.initEnvironment(this.ctx.uiAbilityContext, clientPort)
      resolve(undefined)
    })
  }

  getClientUrl(): Promise<string> {
    return new Promise(resolve => {
      resolve(WebMap3D.getClientUrl())
    })
  }

  activate(serialNo: string): Promise<boolean> {
    return WebMap3D.activateLicense(serialNo);
  }

  getLicenseInfo(): Promise<TM.RTNWebMap3D.ILicenseInfo | null> {
    return WebMap3D.getLicenseInfo()
  }
}