/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';
import WebView from 'react-native-webview';



function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View
        style={{
          width: '100%',
          height: '100%',
          // backgroundColor: 'red',
        }}>
        <WebView
        //  source={{uri: 'http://172.16.15.237:3100'}}
         source={{uri: 'file:///data/storage/el2/base/haps/entry/files/build/index.html'}}
        // chrome debug：
        // hdc shell
        // cat /proc/net/unix | grep devtools
        // hdc fport tcp:9222 localabstract:webview_devtools_remote_22341
          webviewDebuggingEnabled={true}
        />
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
