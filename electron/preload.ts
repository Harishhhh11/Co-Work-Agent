import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  onEmergencyStop: (callback: (data: any) => void) => {
    ipcRenderer.on('emergency-stop-triggered', (_event, value) => callback(value));
  },
  toggleAlwaysOnTop: (enable: boolean) => ipcRenderer.invoke('toggle-always-on-top', enable),
});
