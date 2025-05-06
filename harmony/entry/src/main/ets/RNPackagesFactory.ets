import { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony/ts';
import { WebViewPackage } from '@react-native-oh-tpl/react-native-webview/ts';
import {SafeAreaViewPackage} from '@react-native-oh-tpl/react-native-safe-area-context/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new WebViewPackage(ctx),
    new SafeAreaViewPackage(ctx),
  ];
}