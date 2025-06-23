import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const VERCEL_URL = 'https://gormish-customer.vercel.app/'; // <-- Replace with your actual Vercel URL

export const screenOptions = {
  headerShown: false,
};

export default function Index() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <WebView
        source={{ uri: VERCEL_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});