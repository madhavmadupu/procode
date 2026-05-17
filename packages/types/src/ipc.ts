export interface IPCRequest<T = unknown> {
  id: string;
  channel: string;
  action: string;
  payload: T;
  timestamp: number;
}

export interface IPCResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}
