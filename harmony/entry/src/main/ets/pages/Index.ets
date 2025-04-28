import {
  AnyJSBundleProvider,
  ComponentBuilderContext,
  FileJSBundleProvider,
  MetroJSBundleProvider,
  ResourceJSBundleProvider,
  RNApp,
  RNOHErrorDialog,
  RNOHLogger,
  TraceJSBundleProviderDecorator,
  RNOHCoreContext
} from '@rnoh/react-native-openharmony';
import { createRNPackages } from '../RNPackagesFactory';
import { WebView, WEB_VIEW } from "@react-native-oh-tpl/react-native-webview"
import common from '@ohos.app.ability.common';
import { fileIo } from '@kit.CoreFileKit';
import { BusinessError } from '@kit.BasicServicesKit';
import zlib from '@ohos.zlib'
import webview from '@ohos.web.webview';
import startFileServer from '../server/FileServer';
import fs from '@ohos.file.fs';

// import { webview } from '@kit.ArkWeb';

@Builder
export function buildCustomRNComponent(ctx: ComponentBuilderContext) {
  if (ctx.componentName === WEB_VIEW) {
    WebView({
      ctx: ctx.rnComponentContext,
      tag: ctx.tag
    });
  }
}

const wrappedCustomRNComponentBuilder = wrapBuilder(buildCustomRNComponent)

@Entry
@Component
struct Index {
  @StorageLink('RNOHCoreContext') rnohCoreContext: RNOHCoreContext | undefined = undefined
  @State shouldShow: boolean = false
  private logger!: RNOHLogger
  @State message: string = 'Hello World';

  aboutToAppear() {
    if(!this.rnohCoreContext) return;
    // webview.WebviewController.setWebDebuggingAccess(true);
    ;(async () => {
      try {
        console.log('zxt','about to read')
        const res = await this.rnohCoreContext!.uiAbilityContext.resourceManager.getRawFileList('')
        console.log('zxt', 'res', JSON.stringify(res))
        res.forEach((file => {
          if(file.endsWith('.zip')) {
            copyRawFileToFiles(this.rnohCoreContext!.uiAbilityContext, file)
          }
        }))
      } catch (e) {
        console.log('zxt', 'error', JSON.stringify(e))
      }
    })()
    startFileServer(this.rnohCoreContext!.uiAbilityContext)

    this.logger = this.rnohCoreContext!.logger.clone("Index")
    const stopTracing = this.logger.clone("aboutToAppear").startTracing();

    this.shouldShow = true
    stopTracing();
  }

  onBackPress(): boolean | undefined {
    // NOTE: this is required since `Ability`'s `onBackPressed` function always
    // terminates or puts the app in the background, but we want Ark to ignore it completely
    // when handled by RN
    this.rnohCoreContext!.dispatchBackPress()
    return true
  }

  build() {
    Column() {
      if (this.rnohCoreContext && this.shouldShow) {
        if (this.rnohCoreContext?.isDebugModeEnabled) {
          RNOHErrorDialog({ ctx: this.rnohCoreContext })
        }
        RNApp({
          rnInstanceConfig: {
            createRNPackages,
            enableNDKTextMeasuring: true, // 该项必须为true，用于开启NDK文本测算
            enableBackgroundExecutor: false,
            enableCAPIArchitecture: true, // 该项必须为true，用于开启CAPI
            arkTsComponentNames: [
              WEB_VIEW
            ]
          },
          initialProps: { "foo": "bar" } as Record<string, string>,
          appKey: "AwesomeProject0752",
          wrappedCustomRNComponentBuilder: wrappedCustomRNComponentBuilder,
          onSetUp: (rnInstance) => {
            rnInstance.enableFeatureFlag("ENABLE_RN_INSTANCE_CLEAN_UP")
          },
          jsBundleProvider: new TraceJSBundleProviderDecorator(
            new AnyJSBundleProvider([
              new MetroJSBundleProvider(),
              // NOTE: to load the bundle from file, place it in
              // `/data/app/el2/100/base/com.rnoh.tester/files/bundle.harmony.js`
              // on your device. The path mismatch is due to app sandboxing on OpenHarmony
              // new FileJSBundleProvider('/data/storage/el2/base/files/bundle.harmony.js'),
              new ResourceJSBundleProvider(this.rnohCoreContext.uiAbilityContext.resourceManager, 'hermes_bundle.hbc'),
              new ResourceJSBundleProvider(this.rnohCoreContext.uiAbilityContext.resourceManager, 'bundle.harmony.js')
            ]),
            this.rnohCoreContext.logger),
        })
      }
    }
    .height('100%')
    .width('100%')
  }
}

async function copyRawFileToFiles(context: common.Context, rowFilePath: string) {
  let destRoot = context.filesDir;
  let srcFileName = rowFilePath // rawFile下的文件名
  let destFilePath = destRoot + "/" + srcFileName;
  console.log("copyRawFileToSdcard filepath : " + destFilePath)
  // 创建文件目录
    // 创建目录成功
    // console.log("copyRawFileToSdcard mkdir success ")
    // context.resourceManager.isRawDir()
    context.resourceManager.getRawFileContent(srcFileName, async (error: BusinessError, value: Uint8Array) => {
      if (error != null) {
        console.error("error is " + error);
      } else {
        let rawFile = value;
        let fileStream = fileIo.createStreamSync(destFilePath, "w+");
        fileStream.writeSync(rawFile.buffer);
        fileStream.close();
        // 文件拷贝成功
        console.log("copyRawFileToSdcard write success")

        try {
          console.log('zxt', 'decompressFile',destFilePath, destRoot)
          await zlib.decompressFile(destFilePath, destRoot)
          fileIo.unlink(destFilePath)
        } catch (e) {
          console.log('zxt', 'error',e)
        }
      }
    });
}