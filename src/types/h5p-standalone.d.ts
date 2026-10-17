declare module 'h5p-standalone' {
  export interface H5PPlayerOptions {
    h5pJsonPath: string;
    frameJs: string;
    frameCss: string;
    librariesPath?: string;
    contentJsonPath?: string;
    frame?: boolean;
    fullScreen?: boolean;
    id?: string;
    [key: string]: unknown;
  }
  export interface H5PPlayerInstance {
    then(onFulfilled: () => void): void;
  }
  export interface H5PPlayerClass {
    new (el: HTMLElement, options: H5PPlayerOptions): H5PPlayerInstance;
  }
  /**
   * Paket ini UMD tanpa named export ESM (module.exports = { H5P } /
   * { default: { H5P } } tergantung bundler). Jangan import { H5P } —
   * pakai resolver loadPlayerClass di H5PRealPlayer.
   */
  const H5PStandalone: {
    H5P: H5PPlayerClass;
    default: { H5P: H5PPlayerClass };
  };
  export default H5PStandalone;
}
