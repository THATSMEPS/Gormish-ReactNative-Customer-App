import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

const VERCEL_URL = 'https://gormish-customer.vercel.app/'; 
export const screenOptions = {
  headerShown: false,
  gestureEnabled: false, 
};

let globalExpoPushToken = null;

async function generatePushToken() {
  console.log('=== PUSH TOKEN GENERATION START ===');
  console.log('Device info:', {
    isDevice: Constants.isDevice,
    platform: Platform.OS,
    expoVersion: Constants.expoVersion
  });
  
  try {
    // Request permissions
    console.log('Checking notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Existing permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('New permission status:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      console.error('❌ Permission not granted for push notifications');
      console.error('Final status:', finalStatus);
      return null;
    }

    console.log('✅ Permissions granted, generating token...');
    
    // Generate token 
    const result = await Notifications.getExpoPushTokenAsync();
    console.log('Token generation result:', result);
    
    const token = result.data;
    console.log('✅ Expo Push Token generated:', token);
    console.log('Token length:', token ? token.length : 'null');
    
    if (!token) {
      console.error('❌ Token generation returned null/undefined');
      return null;
    }
    
    globalExpoPushToken = token;
    console.log('✅ Token stored in globalExpoPushToken');
    return token;
    
  } catch (error) {
    console.error('❌ Error generating push token:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return null;
  }
}

// Send token to backend when customer ID is available
async function sendTokenToBackend(customerId, token) {
  console.log('=== BACKEND SUBMISSION START ===');
  console.log('Parameters:', { 
    customerId, 
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
  });
  
  if (!customerId || !token) {
    console.log('❌ Missing required data for backend submission');
    console.log('- customerId:', customerId);
    console.log('- token exists:', !!token);
    return;
  }
  
  try {
    console.log('📤 Sending to backend...');
    const payload = { customerId, expoPushToken: token };
    
    const response = await fetch('https://gormishbackend-4jlj.onrender.com/api/notifications/customers/storeToken', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Token successfully sent to backend!');
    console.log('📦 Backend response:', data);
    
  } catch (error) {
    console.error('❌ Error sending token to backend:', error);
    console.error('❌ Error message:', error.message);
    if (error.message.includes('fetch')) {
      console.error('🌐 Network error - check internet connection');
    }
  }
}

export default function Index() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  // Generate push token once on app start
  useEffect(() => {
    console.log('🚀 App started - initializing push notifications...');
    generatePushToken();
  }, []);

  // Send token to backend when customer ID becomes available
  useEffect(() => {
    console.log('🔄 Customer ID useEffect triggered');
    console.log('State:', { 
      customerId, 
      hasToken: !!globalExpoPushToken 
    });
    
    if (customerId && globalExpoPushToken) {
      console.log('✅ Both customer ID and token available, sending to backend...');
      sendTokenToBackend(customerId, globalExpoPushToken);
    } else {
      console.log('⏳ Waiting for both customer ID and token...');
    }
  }, [customerId]);

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

  // Set up notification listeners
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Forward notification to WebView
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          window.dispatchEvent(new CustomEvent('orderStatusNotification', { 
            detail: ${JSON.stringify(notification.request.content.data)} 
          }));
          true;
        `);
      }
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      // Handle notification tap (navigate, etc.)
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          window.dispatchEvent(new CustomEvent('orderStatusNotificationTap', { 
            detail: ${JSON.stringify(response.notification.request.content.data)} 
          }));
          true;
        `);
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Handle messages from the WebView
  const handleWebViewMessage = async (event) => {
    try {
      console.log('📨 Raw WebView message received:', event.nativeEvent.data);
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📨 Parsed WebView message:', message);

      // Handle customerId sent from WebView
      if (message.customerId) {
        console.log('🆔 Customer ID received from WebView!');
        console.log('🆔 Customer ID value:', message.customerId);
        console.log('🆔 Current token available:', !!globalExpoPushToken);
        setCustomerId(message.customerId);
      }
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