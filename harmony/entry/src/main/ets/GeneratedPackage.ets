import { RNPackage, TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import type {
  TurboModule,
  TurboModuleContext
} from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { WebMap3DModule } from './turbomodule/WebMap3DModule';

class GeneratedTurboModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name === TM.RTNWebMap3D.NAME) {
      return new WebMap3DModule(this.ctx);
    }
    return null;
  }
  hasTurboModule(name: string): boolean {
    return name === TM.RTNWebMap3D.NAME;
  }
}
export class GeneratedPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new GeneratedTurboModulesFactory(ctx);
  }
}