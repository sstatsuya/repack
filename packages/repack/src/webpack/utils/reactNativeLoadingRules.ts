import type { RuleSetRule } from '@rspack/core';

export const REACT_NATIVE_MODULE_RULES: RuleSetRule = {
  test: /\.jsx?$/,
  include: [
    /node_modules(.*[/\\])+react-native/,
    /node_modules(.*[/\\])+@react-native/,
  ],
  use: ({ realResource }) => {
    const forceCJS = realResource?.match(
      /node_modules(.*[/\\])+react-native[/\\]Libraries[/\\]Renderer[/\\]shims[/\\]ReactNativeViewConfigRegistry/
    );
    return [
      {
        loader: 'builtin:swc-loader',
        options: {
          isModule: forceCJS ? false : 'unknown',
          jsc: {
            target: 'es5',
            parser: {
              syntax: 'ecmascript',
              jsx: true,
            },
            externalHelpers: true,
          },
          module: {
            type: 'commonjs',
            strict: false,
            strictMode: true,
            noInterop: false,
            lazy: REACT_NATIVE_LAZY_IMPORTS,
          },
        },
      },
      { loader: '@callstack/repack/react-native-loader' },
    ];
  },
};

const REACT_NATIVE_LAZY_IMPORTS = [
  'AccessibilityInfo',
  'ActivityIndicator',
  'Button',
  'DatePickerIOS',
  'DrawerLayoutAndroid',
  'FlatList',
  'Image',
  'ImageBackground',
  'InputAccessoryView',
  'KeyboardAvoidingView',
  'Modal',
  'Pressable',
  'ProgressBarAndroid',
  'ProgressViewIOS',
  'SafeAreaView',
  'ScrollView',
  'SectionList',
  'Slider',
  'Switch',
  'RefreshControl',
  'StatusBar',
  'Text',
  'TextInput',
  'Touchable',
  'TouchableHighlight',
  'TouchableNativeFeedback',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
  'View',
  'VirtualizedList',
  'VirtualizedSectionList',
  'ActionSheetIOS',
  'Alert',
  'Animated',
  'Appearance',
  'AppRegistry',
  'AppState',
  'AsyncStorage',
  'BackHandler',
  'Clipboard',
  'DeviceInfo',
  'Dimensions',
  'Easing',
  'ReactNative',
  'I18nManager',
  'InteractionManager',
  'Keyboard',
  'LayoutAnimation',
  'Linking',
  'LogBox',
  'NativeEventEmitter',
  'PanResponder',
  'PermissionsAndroid',
  'PixelRatio',
  'PushNotificationIOS',
  'Settings',
  'Share',
  'StyleSheet',
  'Systrace',
  'ToastAndroid',
  'TVEventHandler',
  'UIManager',
  'ReactNative',
  'UTFSequence',
  'Vibration',
  'RCTDeviceEventEmitter',
  'RCTNativeAppEventEmitter',
  'NativeModules',
  'Platform',
  'processColor',
  'requireNativeComponent',
];
