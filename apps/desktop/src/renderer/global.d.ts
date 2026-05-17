interface ProcodeIPC {
  invoke: (channel: string, payload: unknown) => Promise<unknown>;
  send: (channel: string, payload: unknown) => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

interface ProcodeWindow {
  procode: {
    ipc: ProcodeIPC;
    onFileChange: (callback: (change: unknown) => void) => () => void;
    onSettingsChange: (callback: (settings: unknown) => void) => () => void;
  };
}

declare global {
  interface Window extends ProcodeWindow {}
}

export {};
