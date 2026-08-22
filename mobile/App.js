import { Platform, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  // Di web/desktop, batasi lebar seperti layar HP agar tidak melebar penuh
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webShell}>
        <View style={styles.webFrame}>
          <StatusBar style="dark" />
          <AppNavigator />
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    backgroundColor: '#D9D7D0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  webFrame: {
    width: 390,
    height: '100vh',
    maxHeight: 844,
    overflow: 'hidden',
    borderRadius: 12,
    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
  },
});
