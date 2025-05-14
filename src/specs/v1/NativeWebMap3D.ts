import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface ILicenseInfo {
  isValid: boolean
  start: number
  end: number
}

export interface Spec extends TurboModule {
  /**
   * 初始化环境
   * @param clientPort client服务运行端口
   */
  initEnvironment(clientPort?: number): void

  /**
   * 获取 client 服务地址
   */
  getServiceBase(): string
  
  /**
   * 获取资源地址
   */
  getResourceBase(): string
  
  /**
   * 获取 client web 服务地址
   */
  getClientUrl(): string

  /**
   * 通过序列号激活
   * @param serialNo 序列号 
   */
  activate(serialNo: string): Promise<boolean>;

  /**
   * 获取当前许可信息
   * @return 若没有激活，则返回 undefined
   */
  getLicenseInfo(): Promise<ILicenseInfo | undefined>
}

export default TurboModuleRegistry.get<Spec>(
  'RTNWebMap3D',
) as Spec | null;