import { createRequire } from 'node:module';
import path from 'node:path';
import * as Repack from '@callstack/repack';

const dirname = Repack.getDirname(import.meta.url);
const { resolve } = createRequire(import.meta.url);

/**
 * More documentation, installation, usage, motivation and differences with Metro is available at:
 * https://github.com/callstack/repack/blob/main/README.md
 *
 * The API documentation for the functions and plugins used in this file is available at:
 * https://re-pack.dev
 */

/**
 * Webpack configuration.
 * You can also export a static object or a function returning a Promise.
 *
 * @param env Environment options passed from either Webpack CLI or React Native CLI
 *            when running with `react-native start/bundle`.
 */

const STANDALONE = Boolean(process.env.STANDALONE);

export default (env) => {
  const {
    mode = 'development',
    context = dirname,
    entry = './index.js',
    platform = process.env.PLATFORM,
    minimize = mode === 'production',
    devServer = undefined,
    bundleFilename = undefined,
    sourceMapFilename = undefined,
    assetsPath = undefined,
    reactNativePath = resolve('react-native'),
  } = env;

  if (!platform) {
    throw new Error('Missing platform');
  }

  return {
    mode,
    /**
     * This should be always `false`, since the Source Map configuration is done
     * by `SourceMapDevToolPlugin`.
     */
    devtool: false,
    context,
    entry: STANDALONE ? entry : {},
    resolve: {
      /**
       * `getResolveOptions` returns additional resolution configuration for React Native.
       * If it's removed, you won't be able to use `<file>.<platform>.<ext>` (eg: `file.ios.js`)
       * convention and some 3rd-party libraries that specify `react-native` field
       * in their `package.json` might not work correctly.
       */
      ...Repack.getResolveOptions(platform),

      /**
       * Uncomment this to ensure all `react-native*` imports will resolve to the same React Native
       * dependency. You might need it when using workspaces/monorepos or unconventional project
       * structure. For simple/typical project you won't need it.
       */
      // alias: {
      //   'react-native': reactNativePath,
      // },
    },
    /**
     * Configures output.
     * It's recommended to leave it as it is unless you know what you're doing.
     * By default Webpack will emit files into the directory specified under `path`. In order for the
     * React Native app use them when bundling the `.ipa`/`.apk`, they need to be copied over with
     * `Repack.OutputPlugin`, which is configured by default inside `Repack.RepackPlugin`.
     */
    output: {
      clean: true,
      hashFunction: 'xxhash64',
      path: path.join(dirname, 'build/generated', platform),
      filename: 'index.bundle',
      chunkFilename: '[name].chunk.bundle',
      publicPath: Repack.getPublicPath({ platform, devServer }),
      uniqueName: 'MiniApp-1',
    },
    /**
     * Configures optimization of the built bundle.
     */
    optimization: {
      /** Enables minification based on values passed from React Native CLI or from fallback. */
      minimize,
      /** Configure minimizer to process the bundle. */
      chunkIds: 'named',
    },
    module: {
      rules: [
        Repack.REACT_NATIVE_LOADING_RULES,
        Repack.NODE_MODULES_LOADING_RULES,
        {
          test: /\.jsx?$/,
          include: [
            /node_modules(.*[/\\])+@react-native-masked-view\+masked-view@/,
          ],
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                env: {
                  targets: { 'react-native': '0.74' },
                },
                jsc: {
                  externalHelpers: true,
                  parser: { syntax: 'ecmascript', jsx: true },
                },
                module: {
                  type: 'commonjs',
                  strict: false,
                  strictMode: false,
                },
              },
            },
            { loader: '@callstack/repack/flow-loader' },
          ],
          type: 'javascript/auto',
        },
        /** Here you can adjust loader that will process your files. */
        {
          test: /\.[jt]sx?$/,
          exclude: [/node_modules/],
          type: 'javascript/auto',
          use: {
            loader: 'builtin:swc-loader',
            /** @type {import('@rspack/core').SwcLoaderOptions} */
            options: {
              env: {
                targets: {
                  'react-native': '0.74',
                },
              },
              jsc: {
                externalHelpers: true,
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: mode === 'development',
                    refresh: mode === 'development' && Boolean(devServer),
                  },
                },
              },
            },
          },
        },
        /**
         * This loader handles all static assets (images, video, audio and others), so that you can
         * use (reference) them inside your application.
         *
         * If you want to handle specific asset type manually, filter out the extension
         * from `ASSET_EXTENSIONS`, for example:
         * ```
         * Repack.ASSET_EXTENSIONS.filter((ext) => ext !== 'svg')
         * ```
         */
        {
          test: Repack.getAssetExtensionsRegExp(Repack.ASSET_EXTENSIONS),
          use: {
            loader: '@callstack/repack/assets-loader',
            options: {
              platform,
              devServerEnabled: Boolean(devServer),
            },
          },
        },
      ],
    },
    plugins: [
      /**
       * Configure other required and additional plugins to make the bundle
       * work in React Native and provide good development experience with
       * sensible defaults.
       *
       * `Repack.RepackPlugin` provides some degree of customization, but if you
       * need more control, you can replace `Repack.RepackPlugin` with plugins
       * from `Repack.plugins`.
       */
      new Repack.RepackPlugin({
        context,
        mode,
        platform,
        devServer,
        entryName: STANDALONE ? undefined : null,
        output: {
          bundleFilename,
          sourceMapFilename,
          assetsPath,
        },
      }),
      new Repack.plugins.ModuleFederationPlugin({
        name: 'MiniApp',
        exposes: {
          './MiniAppNavigator': './src/navigation/MainNavigator',
        },
        shared: {
          react: {
            singleton: true,
            eager: STANDALONE,
            requiredVersion: '18.2.0',
          },
          'react-native': {
            singleton: true,
            eager: STANDALONE,
            requiredVersion: '0.74.3',
          },
          'react-native/Libraries/Core/Devtools/getDevServer': {
            singleton: true,
            eager: true,
            requiredVersion: '0.74.3',
            shareScope: 'internal',
          },
          '@react-navigation/native': {
            singleton: true,
            eager: STANDALONE,
            requiredVersion: '^6.1.18',
          },
          '@react-navigation/native-stack': {
            singleton: true,
            eager: STANDALONE,
            requiredVersion: '^6.10.1',
          },
          'react-native-safe-area-context': {
            singleton: true,
            eager: STANDALONE,
            requiredVersion: '^4.10.8',
          },
          'react-native-screens': {
            singleton: true,
            eager: STANDALONE,
            requiredVersion: '^3.32.0',
          },
        },
      }),
    ],
  };
};
