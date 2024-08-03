import path from 'node:path';
import fs from 'fs-extra';
import execa from 'execa';

/**
 * {@link composeSourceMaps} options.
 */
interface ComposeSourceMapsOptions {
  /** Path to the React Native root directory. */
  reactNativePath: string;

  /**
   * Path to the source map generated by webpack-bundle.
   *
   * This will be replaced with the composed source map.
   */
  packagerMapPath: string;

  /** Path to React-Native package inside node_modules. */
  compilerMapPath: string;
}

/**
 * Composes source maps generated by webpack-bundle and Hermes.
 *
 * Removes original source map files.
 */
export const composeSourceMaps = async ({
  reactNativePath,
  packagerMapPath,
  compilerMapPath,
}: ComposeSourceMapsOptions): Promise<void> => {
  const composedSourceMapPath = packagerMapPath + '.composed';

  try {
    await execa.node(
      path.join(reactNativePath, 'scripts', 'compose-source-maps.js'),
      [packagerMapPath, compilerMapPath, '-o', composedSourceMapPath]
    );

    // Remove intermediate files
    await fs.unlink(packagerMapPath);
    await fs.unlink(compilerMapPath);

    await fs.rename(composedSourceMapPath, packagerMapPath);
  } catch (error) {
    const message = (error as Error).toString();
    throw new Error(
      `ChunksToHermesBytecodePlugin: Failed to compose source maps. Reason:\n${message})`
    );
  }
};
