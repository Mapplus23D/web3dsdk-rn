import RNFS from '@react-native-ohos/react-native-fs';
import NativeHTools from '../specs/v1/NativeHTools';

/**
 * 拷贝外部文件
 * @description 读取外部文件，写入到应用目录
 * @param from 外部文件路径
 * @param to 内部文件路径
 * @returns 
 */
export const copyExternalFile = async (from: string, to: string): Promise<boolean> => {
  const content = await NativeHTools?.readFile(from)
  if (!content) return false
  try {
    await RNFS.writeFile(
      to,
      content,
      'base64',
    )
    return true
  } catch (e) {
    console.error('copyExternalFile', e)
    return false
  }
}