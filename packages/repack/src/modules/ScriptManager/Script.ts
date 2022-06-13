/* globals Headers, FormData, __webpack_public_path__, __webpack_get_script_filename__ */

import shallowEqual from 'shallowequal';
import type { NormalizedScriptLocator, ScriptLocator } from './types';

export class Script {
  static DEFAULT_TIMEOUT = 30000; // 30s

  /**
   * Get URL of a script hosted on development server.
   *
   * @param scriptId Id of the script.
   */
  static getDevServerURL(scriptId: string) {
    return `${__webpack_public_path__}${__webpack_get_script_filename__(
      scriptId
    )}`;
  }

  /**
   * Get URL of a script stored on filesystem on the target mobile device.
   *
   * @param scriptId Id of the script.
   */
  static getFileSystemURL(scriptId: string) {
    return __webpack_get_script_filename__(`file:///${scriptId}`);
  }

  /**
   * Get URL of a script hosted on a remote server.
   *
   * By default `.chunk.bundle` extension will be added to the URL.
   * If your script has different extension, you should pass `{ excludeExtension: true }` as 2nd argument.
   *
   * @param url A URL to remote location where the script is stored.
   * @param options Additional options.
   */
  static getRemoteURL(
    url: string,
    options: { excludeExtension?: boolean } = {}
  ) {
    if (options.excludeExtension) {
      return url;
    }

    return __webpack_get_script_filename__(url);
  }

  static from(locator: ScriptLocator, fetch: boolean) {
    const headers: Record<string, string> = {};
    new Headers(locator.headers).forEach((value: string, key: string) => {
      headers[key.toLowerCase()] = value;
    });

    let body: NormalizedScriptLocator['body'];
    if (locator.body instanceof FormData) {
      const bodyObject: Record<string, string> = {};
      locator.body.forEach((value, key) => {
        if (typeof value === 'string') {
          bodyObject[key] = value;
        } else {
          console.warn('Script does not support File as FormData key in body');
        }
      });
      body = JSON.stringify(bodyObject);
    } else if (locator.body instanceof URLSearchParams) {
      const bodyObject: Record<string, string> = {};
      locator.body.forEach((value, key) => {
        bodyObject[key] = value;
      });
      body = JSON.stringify(bodyObject);
    } else {
      body = locator.body ?? undefined;
    }

    return new Script({
      method: locator.method ?? 'GET',
      url: locator.url,
      absolute: locator.absolute ?? false,
      timeout: locator.timeout ?? Script.DEFAULT_TIMEOUT,
      query: new URLSearchParams(locator.query).toString(),
      body,
      headers,
      fetch,
    });
  }

  constructor(public readonly locator: NormalizedScriptLocator) {}

  shouldRefetch(
    cachedData: Pick<
      NormalizedScriptLocator,
      'method' | 'url' | 'query' | 'headers' | 'body'
    >
  ) {
    const diffs = [
      cachedData.method !== this.locator.method,
      cachedData.url !== this.locator.url,
      cachedData.query !== this.locator.query,
      !shallowEqual(cachedData.headers, this.locator.headers),
      cachedData.body !== this.locator.body,
    ];

    return diffs.some((diff) => diff);
  }

  getCacheData() {
    return {
      method: this.locator.method,
      url: this.locator.url,
      query: this.locator.query,
      headers: this.locator.headers,
      body: this.locator.body,
    };
  }
}