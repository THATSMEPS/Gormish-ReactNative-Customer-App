import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const VERCEL_URL = 'https://gormish-customer.vercel.app/'; // <-- Replace with your actual Vercel URL

export const screenOptions = {
  headerShown: false,
  gestureEnabled: false, // Disable swipe back gesture
};

export default function Index() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Request location permission on app start
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }
      setHasLocationPermission(true);
    })();
  }, []);

  // Handle messages from the WebView
  const handleWebViewMessage = async (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      // Handle get location request
      if (message.type === 'GET_LOCATION') {
        if (!hasLocationPermission) {
          // If we don't have permission yet, try to request it again
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            sendLocationErrorToWebView('Permission denied');
            return;
          }
          setHasLocationPermission(true);
        }
        
        try {
          // Fetch current location
          const location = await Location.getCurrentPositionAsync({});
          
          // Prepare location data
          const locationData = {
            coords: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            timestamp: location.timestamp,
          };
          
          // Inject location into WebView
          injectLocationIntoWebView(locationData);
        } catch (error) {
          console.error('Error getting location:', error);
          sendLocationErrorToWebView(error.message);
        }
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  };

  // Inject location data into WebView
  const injectLocationIntoWebView = (locationData) => {
    if (!webViewRef.current) return;
    
    const injectedJavaScript = `
      (function() {
        // Mock location data from React Native
        const mockLocation = ${JSON.stringify(locationData)};
        
        // Override getCurrentPosition
        navigator.geolocation.getCurrentPosition = function(success, error, options) {
          console.log("Geolocation requested - using injected location from React Native");
          success(mockLocation);
        };
        
        // Override watchPosition
        navigator.geolocation.watchPosition = function(success, error, options) {
          console.log("Watch position requested - using injected location from React Native");
          // Call success once with our mock data
          success(mockLocation);
          // Return a watchID that can be cleared
          return Math.floor(Math.random() * 1000000);
        };
        
        // Send a message to the website that location is available
        window.dispatchEvent(new CustomEvent('reactNativeLocationAvailable', { 
          detail: mockLocation 
        }));
        
        console.log("Location services overridden with data from React Native app");
      })();
      true;
    `;
    
    webViewRef.current.injectJavaScript(injectedJavaScript);
  };
  
  // Send error message to WebView
  const sendLocationErrorToWebView = (errorMessage) => {
    if (!webViewRef.current) return;
    
    const script = `
      (function() {
        console.error("Location error from React Native:", ${JSON.stringify(errorMessage)});
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('reactNativeLocationError', { 
          detail: ${JSON.stringify(errorMessage)} 
        }));
      })();
      true;
    `;
    
    webViewRef.current.injectJavaScript(script);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // Prevent default behavior (exit app)
      }
      return false; // Allow default behavior (exit app)
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  // Initial script to inject when WebView loads
  const injectedJavaScriptBeforeContentLoaded = `
    (function() {
      console.log("Setting up location bridge between React Native and WebView");
      window.isInReactNativeApp = true;
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebView
        ref={webViewRef}
        source={{ uri: VERCEL_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={navState => setCanGoBack(navState.canGoBack)}
        onLoad={() => {
          // Inject the script that sets up the message handler on page load
          const setupScript = `
            (function() {
              if (!window.locationBridgeSetup) {
                // Set up a way for the website to request location
                window.requestLocationFromApp = function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'GET_LOCATION'
                  }));
                  console.log("Location request sent to React Native app");
                };
                
                // Override geolocation API to use our bridge
                navigator.geolocation.getCurrentPosition = function(success, error, options) {
                  console.log("Geolocation requested - requesting from React Native app");
                  
                  // Set up a one-time listener for the location data
                  const locationListener = function(event) {
                    success(event.detail);
                    window.removeEventListener('reactNativeLocationAvailable', locationListener);
                  };
                  
                  // Set up a one-time listener for location errors
                  const errorListener = function(event) {
                    if (error) error({ code: 1, message: event.detail });
                    window.removeEventListener('reactNativeLocationError', errorListener);
                  };
                  
                  window.addEventListener('reactNativeLocationAvailable', locationListener);
                  window.addEventListener('reactNativeLocationError', errorListener);
                  
                  // Request location from the app
                  window.requestLocationFromApp();
                };
                
                // Similarly for watchPosition
                navigator.geolocation.watchPosition = function(success, error, options) {
                  console.log("Watch position requested - requesting from React Native app");
                  
                  // Set up a listener for the location data
                  const locationListener = function(event) {
                    success(event.detail);
                  };
                  
                  // Set up a listener for location errors
                  const errorListener = function(event) {
                    if (error) error({ code: 1, message: event.detail });
                  };
                  
                  window.addEventListener('reactNativeLocationAvailable', locationListener);
                  window.addEventListener('reactNativeLocationError', errorListener);
                  
                  // Request location from the app
                  window.requestLocationFromApp();
                  
                  // Return an ID that can be used with clearWatch
                  const watchId = Math.floor(Math.random() * 1000000);
                  return watchId;
                };
                
                console.log("Location bridge set up between React Native and WebView");
                window.locationBridgeSetup = true;
              }
            })();
            true;
          `;
          
          webViewRef.current.injectJavaScript(setupScript);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F5',
    // Removed marginTop for responsive safe area
  },
  webview: {
    flex: 1,
  },
});