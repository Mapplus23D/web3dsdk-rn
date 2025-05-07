import { Button, Text, View } from "react-native";
import { DemoStackPageProps } from "src/navigators/types";

interface Props extends DemoStackPageProps<'DemoHome'> {

}

export default function Home({navigation}: Props) {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Button title="地图操作示例" onPress={() => navigation.navigate('SceneGeneral')} />
    </View>
  )
}