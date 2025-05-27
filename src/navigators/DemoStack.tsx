import { createStackNavigator } from '@react-navigation/stack';
import BaseMap from '../demos/1_basemap/1_1_BaseMap';
import MapStyle from '../demos/1_basemap/1_2_MapStyle';
import MapLocation from '../demos/1_basemap/1_3_MapLocation';
import DrawObject from '../demos/2_mapObject/2_1_DrawObject';
import DrawText from '../demos/2_mapObject/2_2_DrawText';
import DataImport from '../demos/2_mapObject/2_3_DataImport';
import LayerStyle from '../demos/2_mapObject/2_4_LayerStyle';
import ObjectEdit from '../demos/2_mapObject/2_5_ObjectEdit';
import ObjectAttribute from '../demos/2_mapObject/2_6_ObjectAttribute';
import MapOpenSave from '../demos/2_mapObject/2_7_MapOpenSave';
import DemoList from '../demos/DemoList';
import Home from '../pages/Home';
import { DemoStackParamList } from './types';

const Stack = createStackNavigator<DemoStackParamList>();

export default function DemoStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="DemoHome" component={Home} />
      <Stack.Screen name="DemoList" component={DemoList} />
      <Stack.Screen name="DrawObject" component={DrawObject} />
      <Stack.Screen name="BaseMap" component={BaseMap} />
      <Stack.Screen name="MapLocation" component={MapLocation} />
      <Stack.Screen name="MapStyle" component={MapStyle} />
      <Stack.Screen name="DrawText" component={DrawText} />
      <Stack.Screen name="DataImport" component={DataImport} />
      <Stack.Screen name="LayerStyle" component={LayerStyle} />
      <Stack.Screen name="ObjectEdit" component={ObjectEdit} />
      <Stack.Screen name="ObjectAttribute" component={ObjectAttribute} />
      <Stack.Screen name="MapOpenSave" component={MapOpenSave} />
    </Stack.Navigator>
  );
}
