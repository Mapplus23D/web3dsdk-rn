import {RTNWebMap3D} from '@mapplus/react-native-webmap3d'

export const active = async (code?: string) => {
  let license = await RTNWebMap3D?.getLicenseInfo()
  if (!license) {
    // 激活序列号，替换为有效的序列号
    const serial = code || 'XXV8W-2VZBM-WQNY7-VFQBV-7UDM2'
    const result = await RTNWebMap3D?.activate(serial)
    if (result) {
      license = await RTNWebMap3D?.getLicenseInfo()
    }
  }
  return license
}

export const getLicenseInfo = async () => {
  return await RTNWebMap3D?.getLicenseInfo()
}
