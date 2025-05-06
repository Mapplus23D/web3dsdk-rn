import {Text, View} from 'react-native';
import Webmap3DView from '../components/Webmap3DView';
import {DemoStackPageProps} from 'src/navigators/types';

interface Props extends DemoStackPageProps<'SceneGeneral'> {}

export default function SceneGeneral(props: Props) {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Webmap3DView
        onInited={client => {
          console.log('inited');
        }}
      />
    </View>
  );
}
