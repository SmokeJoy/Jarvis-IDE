declare module 'get-folder-size' {
  function getFolderSize(path: string): Promise<number>;
  export default getFolderSize;
}
