import { RouteProp } from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

export type DemoStackParamList = {
  DemoHome: undefined;

  SceneGeneral: undefined;
};

export type DemoStackNavigationProps<
  RouteName extends keyof DemoStackParamList,
> = StackNavigationProp<DemoStackParamList, RouteName>;

export type DemoStackRouteProp<
  RouteName extends keyof DemoStackParamList,
> = RouteProp<DemoStackParamList, RouteName>

export interface DemoStackPageProps<RouteName extends keyof DemoStackParamList> {
  navigation: DemoStackNavigationProps<RouteName>
  route: DemoStackRouteProp<RouteName>
}