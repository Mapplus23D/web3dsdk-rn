import {ActivityIndicator, View} from 'react-native';

interface Props {
  visible: boolean;
}

export default function Loading(props: Props) {
  if (!props.visible) return null;
  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <ActivityIndicator size={80} color={'#999999'} />
    </View>
  );
}
