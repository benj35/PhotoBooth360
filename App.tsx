import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ConnectionScreen from './src/screens/ConnectionScreen';
import CustomerInputScreen from './src/screens/CustomerInputScreen';
import MusicSelectionScreen from './src/screens/MusicSelectionScreen';
import SessionConfigScreen from './src/screens/SessionConfigScreen';
import ManualControlScreen from './src/screens/ManualControlScreen';

export type RootStackParamList = {
  Home: undefined;
  Connection: undefined;
  CustomerInput: undefined;
  MusicSelection: undefined;
  SessionConfig: undefined;
  ManualControl: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Connection"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a1a',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Connection"
            component={ConnectionScreen}
            options={{ title: 'Device Setup' }}
          />
          <Stack.Screen
            name="CustomerInput"
            component={CustomerInputScreen}
            options={{ title: 'Customer Information' }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: '360° Photo Booth' }}
          />
          <Stack.Screen
            name="MusicSelection"
            component={MusicSelectionScreen}
            options={{ title: 'Select Music' }}
          />
          <Stack.Screen
            name="SessionConfig"
            component={SessionConfigScreen}
            options={{ title: 'Session Settings' }}
          />
          <Stack.Screen
            name="ManualControl"
            component={ManualControlScreen}
            options={{ title: 'Manual Controls' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
