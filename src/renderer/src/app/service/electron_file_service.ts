class ElectronFileService {
  static async saveLocalFile(filename: string, data: ArrayBuffer) {
    const response = await window.electron.ipcRenderer.invoke("saveFileLocal", filename, data);
    return response;
  }

  static async loadFile(filename: string) {
    const response = await window.electron.ipcRenderer.invoke("loadFile", filename);
    return response;
  }
}

export default ElectronFileService;
