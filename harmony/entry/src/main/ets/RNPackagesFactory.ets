import { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony/ts';
import { WebViewPackage } from '@react-native-oh-tpl/react-native-webview/ts';
import { WebMap3DPackage }  from '@mapplus/react-native-webmap3d/ts'
import {SafeAreaViewPackage} from '@react-native-oh-tpl/react-native-safe-area-context/ts';
import { GeneratedPackage } from './GeneratedPackage';
import {GeoLocationPackage} from '@react-native-oh-tpl/geolocation/ts';
import { FsPackage } from '@react-native-ohos/react-native-fs/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new WebViewPackage(ctx),
    new WebMap3DPackage(ctx),
    new SafeAreaViewPackage(ctx),
    new GeneratedPackage(ctx),
    new GeoLocationPackage(ctx),
    new FsPackage(ctx),
  ];
}