import {createStackNavigator} from '@react-navigation/stack';
import {DemoStackParamList} from './types';
import Home from '../pages/Home';
import SceneGeneral from '../demos/SceneGeneral';

const Stack = createStackNavigator<DemoStackParamList>();

export default function DemoStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="DemoHome" component={Home} />
      <Stack.Screen name="SceneGeneral" component={SceneGeneral} />
    </Stack.Navigator>
  );
}
