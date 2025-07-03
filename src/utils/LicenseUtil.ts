import { RTNWebMap3D } from '@mapplus/react-native-webmap3d'

export const active = async (code?: string) => {
  let license = await RTNWebMap3D?.getLicenseInfo()
  if (!license) {
    // 激活序列号，替换为有效的序列号
    const serial = code || 'JNGPN-DN2RX-UZCQT-EXUB3-X9UHT'
    const result = await RTNWebMap3D?.activate(serial)
    if (result.success) {
      license = await RTNWebMap3D?.getLicenseInfo()
    } else {
      console.warn(result.message)
    }
  }
  if(!license?.isValid) {
    console.warn(license ? license.message : '没有获取到许可')
  }
  return license
}

export const getLicenseInfo = async () => {
  return await RTNWebMap3D?.getLicenseInfo()
}
