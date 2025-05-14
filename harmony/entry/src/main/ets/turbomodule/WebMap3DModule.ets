import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import { WebMap3D } from 'webmap3d/Index';

export class WebMap3DModule extends TurboModule implements TM.RTNWebMap3D.Spec {

  initEnvironment(clientPort: number): void {
    WebMap3D.initEnvironment(this.ctx.uiAbilityContext, clientPort)
  }

  getServiceBase(): string {
    return WebMap3D.getServiceBase()
  }

  getResourceBase(): string {
    return WebMap3D.getResourceBase()
  }

  getClientUrl(): string {
    return WebMap3D.getClientUrl()
  }

  activate(serialNo: string): Promise<boolean> {
    return WebMap3D.activateLicense(serialNo);
  }

  getLicenseInfo(): Promise<TM.RTNWebMap3D.ILicenseInfo | null> {
    return WebMap3D.getLicenseInfo()
  }
}