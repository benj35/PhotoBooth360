/**
 * @format
 */

// Buffer polyfill for React Native (required for GoPro BLE communication)
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
