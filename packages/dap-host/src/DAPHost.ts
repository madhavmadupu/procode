import { spawn, ChildProcess } from 'child_process';
import type {
  DapRequest,
  DapResponse,
  DapEvent,
  InitializeRequest,
  InitializeResponse,
  LaunchRequest,
  AttachRequest,
  ConfigurationDoneRequest,
  DisconnectRequest,
  SetBreakpointsRequest,
  SetBreakpointsResponse,
  ContinueRequest,
  ContinueResponse,
  NextRequest,
  StepInRequest,
  StepOutRequest,
  PauseRequest,
  StackTraceRequest,
  StackTraceResponse,
  ScopesRequest,
  ScopesResponse,
  VariablesRequest,
  VariablesResponse,
  ThreadsResponse,
  EvaluateRequest,
  EvaluateResponse,
  StoppedEvent,
  ContinuedEvent,
  ExitedEvent,
  TerminatedEvent,
  ThreadEvent,
  OutputEvent,
  BreakpointEvent,
  CapabilitiesEvent,
  ProcessEvent,
  Source,
  SourceBreakpoint,
  Breakpoint,
  StackFrame,
  Scope,
  Variable,
  Thread,
} from './DapProtocol.js';

export type DapState = 'stopped' | 'starting' | 'running' | 'stopped-debug' | 'error';

export interface DapHostEvents {
  stateChange: (state: DapState) => void;
  stopped: (event: StoppedEvent) => void;
  continued: (event: ContinuedEvent) => void;
  exited: (event: ExitedEvent) => void;
  terminated: (event: TerminatedEvent) => void;
  threadStarted: (event: ThreadEvent) => void;
  threadExited: (event: ThreadEvent) => void;
  output: (event: OutputEvent) => void;
  breakpointChanged: (event: BreakpointEvent) => void;
  capabilities: (event: CapabilitiesEvent) => void;
  process: (event: ProcessEvent) => void;
  error: (error: Error) => void;
}

export interface BreakpointInfo {
  id: number;
  path: string;
  line: number;
  column?: number;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
  verified: boolean;
}

export interface DebugSessionConfig {
  type: 'launch' | 'attach';
  program: string;
  args?: string[];
  cwd?: string;
  env?: { [key: string]: string };
  stopOnEntry?: boolean;
  console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
  [key: string]: unknown;
}

export class DAPHost {
  private process: ChildProcess | null = null;
  private state: DapState = 'stopped';
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private messageBuffer = '';
  private capabilities: InitializeResponse | null = null;
  private breakpoints = new Map<string, BreakpointInfo[]>();
  private threads = new Map<number, Thread>();
  private currentThreadId: number | null = null;
  private stackFrames = new Map<number, StackFrame>();
  private variables = new Map<number, Variable[]>();

  get currentState(): DapState {
    return this.state;
  }

  get serverCapabilities(): InitializeResponse | null {
    return this.capabilities;
  }

  get allThreads(): Thread[] {
    return Array.from(this.threads.values());
  }

  get currentThread(): number | null {
    return this.currentThreadId;
  }

  get allBreakpoints(): Map<string, BreakpointInfo[]> {
    return this.breakpoints;
  }

  async start(adapterPath: string, config: DebugSessionConfig): Promise<void> {
    if (this.state !== 'stopped') {
      throw new Error(`Debug adapter is already ${this.state}`);
    }

    this.setState('starting');

    try {
      this.process = spawn(process.execPath, [adapterPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleMessage(data.toString());
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        this.emit('output', {
          category: 'stderr',
          output: data.toString(),
        } as OutputEvent);
      });

      this.process.on('error', (error: Error) => {
        this.setState('error');
        this.emit('error', error);
      });

      this.process.on('exit', (code: number | null) => {
        this.setState('stopped');
        this.process = null;
        this.rejectAllPending(new Error(`Debug adapter exited with code ${code}`));
      });

      await this.initialize();

      if (config.type === 'launch') {
        await this.launch(config as unknown as LaunchRequest);
      } else {
        await this.attach(config as unknown as AttachRequest);
      }

      if (this.capabilities?.supportsConfigurationDoneRequest) {
        await this.configurationDone();
      }

      this.setState('running');
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state === 'stopped') {
      return;
    }

    try {
      await this.disconnect({ terminateDebuggee: true });
    } catch {
      // Ignore errors during disconnect
    }

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    this.setState('stopped');
    this.capabilities = null;
    this.threads.clear();
    this.breakpoints.clear();
    this.stackFrames.clear();
    this.variables.clear();
    this.currentThreadId = null;
  }

  async setBreakpoints(path: string, breakpoints: SourceBreakpoint[]): Promise<Breakpoint[]> {
    const source: Source = { path, name: path.split('/').pop() };
    const request: SetBreakpointsRequest = {
      source,
      breakpoints,
      sourceModified: false,
    };

    const response = await this.sendRequest('setBreakpoints', request) as SetBreakpointsResponse;

    // Update local breakpoint state
    const breakpointInfos: BreakpointInfo[] = breakpoints.map((bp, i) => ({
      id: response.breakpoints[i]?.id ?? i,
      path,
      line: bp.line,
      column: bp.column,
      condition: bp.condition,
      hitCondition: bp.hitCondition,
      logMessage: bp.logMessage,
      verified: response.breakpoints[i]?.verified ?? false,
    }));

    this.breakpoints.set(path, breakpointInfos);
    return response.breakpoints;
  }

  async clearBreakpoints(path: string): Promise<void> {
    await this.setBreakpoints(path, []);
    this.breakpoints.delete(path);
  }

  async continue(threadId?: number): Promise<boolean> {
    const tid = threadId ?? this.currentThreadId;
    if (tid === null) {
      throw new Error('No thread to continue');
    }

    const request: ContinueRequest = { threadId: tid };
    const response = await this.sendRequest('continue', request) as ContinueResponse;
    this.setState('running');
    return response.allThreadsContinued ?? false;
  }

  async next(threadId?: number): Promise<void> {
    const tid = threadId ?? this.currentThreadId;
    if (tid === null) {
      throw new Error('No thread to step');
    }

    const request: NextRequest = { threadId: tid };
    await this.sendRequest('next', request);
  }

  async stepIn(threadId?: number): Promise<void> {
    const tid = threadId ?? this.currentThreadId;
    if (tid === null) {
      throw new Error('No thread to step');
    }

    const request: StepInRequest = { threadId: tid };
    await this.sendRequest('stepIn', request);
  }

  async stepOut(threadId?: number): Promise<void> {
    const tid = threadId ?? this.currentThreadId;
    if (tid === null) {
      throw new Error('No thread to step');
    }

    const request: StepOutRequest = { threadId: tid };
    await this.sendRequest('stepOut', request);
  }

  async pause(threadId?: number): Promise<void> {
    const tid = threadId ?? this.currentThreadId;
    if (tid === null) {
      throw new Error('No thread to pause');
    }

    const request: PauseRequest = { threadId: tid };
    await this.sendRequest('pause', request);
  }

  async getStackTrace(threadId?: number, startFrame = 0, levels = 20): Promise<StackFrame[]> {
    const tid = threadId ?? this.currentThreadId;
    if (tid === null) {
      throw new Error('No thread to get stack trace');
    }

    const request: StackTraceRequest = {
      threadId: tid,
      startFrame,
      levels,
    };

    const response = await this.sendRequest('stackTrace', request) as StackTraceResponse;
    for (const frame of response.stackFrames) {
      this.stackFrames.set(frame.id, frame);
    }
    return response.stackFrames;
  }

  async getScopes(frameId: number): Promise<Scope[]> {
    const request: ScopesRequest = { frameId };
    const response = await this.sendRequest('scopes', request) as ScopesResponse;
    return response.scopes;
  }

  async getVariables(variablesReference: number): Promise<Variable[]> {
    const request: VariablesRequest = { variablesReference };
    const response = await this.sendRequest('variables', request) as VariablesResponse;
    this.variables.set(variablesReference, response.variables);
    return response.variables;
  }

  async evaluate(expression: string, frameId?: number): Promise<EvaluateResponse> {
    const request: EvaluateRequest = {
      expression,
      frameId,
      context: 'repl',
    };
    return this.sendRequest('evaluate', request) as Promise<EvaluateResponse>;
  }

  async getThreads(): Promise<Thread[]> {
    const response = await this.sendRequest('threads', {}) as ThreadsResponse;
    this.threads.clear();
    for (const thread of response.threads) {
      this.threads.set(thread.id, thread);
    }
    return response.threads;
  }

  private async initialize(): Promise<InitializeResponse> {
    const request: InitializeRequest = {
      clientID: 'procode',
      clientName: 'ProCode',
      adapterID: 'procode-debug',
      pathFormat: 'path',
      linesStartAt1: true,
      columnsStartAt1: true,
      supportsVariableType: true,
      supportsVariablePaging: false,
      supportsRunInTerminalRequest: true,
    };

    const response = await this.sendRequest('initialize', request) as InitializeResponse;
    this.capabilities = response;
    return response;
  }

  private async launch(config: LaunchRequest): Promise<void> {
    await this.sendRequest('launch', config);
  }

  private async attach(config: AttachRequest): Promise<void> {
    await this.sendRequest('attach', config);
  }

  private async configurationDone(): Promise<void> {
    const request: ConfigurationDoneRequest = {};
    await this.sendRequest('configurationDone', request);
  }

  private async disconnect(request: DisconnectRequest): Promise<void> {
    await this.sendRequest('disconnect', request);
  }

  private sendRequest(command: string, args: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const seq = ++this.requestId;
      const request: DapRequest = {
        seq,
        type: 'request',
        command,
        arguments: args,
      };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(seq);
        reject(new Error(`Request ${command} timed out after 30s`));
      }, 30000);

      this.pendingRequests.set(seq, { resolve, reject, timeout });
      this.send(request);
    });
  }

  private send(message: DapRequest): void {
    if (!this.process?.stdin) {
      throw new Error('Debug adapter process not available');
    }

    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content, 'utf-8')}\r\n\r\n`;
    this.process.stdin.write(header + content, 'utf-8');
  }

  private handleMessage(data: string): void {
    this.messageBuffer += data;

    while (this.messageBuffer.length > 0) {
      const headerEnd = this.messageBuffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        break;
      }

      const header = this.messageBuffer.substring(0, headerEnd);
      const contentLengthMatch = header.match(/Content-Length: (\d+)/i);
      if (!contentLengthMatch || !contentLengthMatch[1]) {
        this.messageBuffer = this.messageBuffer.substring(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1], 10);
      const messageStart = headerEnd + 4;

      if (this.messageBuffer.length < messageStart + contentLength) {
        break;
      }

      const content = this.messageBuffer.substring(messageStart, messageStart + contentLength);
      this.messageBuffer = this.messageBuffer.substring(messageStart + contentLength);

      try {
        const message = JSON.parse(content) as DapResponse | DapEvent;
        this.dispatchMessage(message);
      } catch (error) {
        this.emit('error', new Error(`Failed to parse DAP message: ${error}`));
      }
    }
  }

  private dispatchMessage(message: DapResponse | DapEvent): void {
    if (message.type === 'response') {
      const response = message as DapResponse;
      const pending = this.pendingRequests.get(response.request_seq);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(response.request_seq);

        if (response.success) {
          pending.resolve(response.body);
        } else {
          pending.reject(new Error(response.message ?? 'Unknown error'));
        }
      }
    } else if (message.type === 'event') {
      this.handleEvent(message as DapEvent);
    }
  }

  private handleEvent(event: DapEvent): void {
    switch (event.event) {
      case 'stopped':
        this.setState('stopped-debug');
        this.currentThreadId = (event.body as StoppedEvent).threadId ?? null;
        this.emit('stopped', event.body as StoppedEvent);
        break;
      case 'continued':
        this.setState('running');
        this.emit('continued', event.body as ContinuedEvent);
        break;
      case 'exited':
        this.emit('exited', event.body as ExitedEvent);
        break;
      case 'terminated':
        this.setState('stopped');
        this.emit('terminated', event.body as TerminatedEvent);
        break;
      case 'thread':
        const threadEvent = event.body as ThreadEvent;
        if (threadEvent.reason === 'started') {
          this.emit('threadStarted', threadEvent);
        } else {
          this.emit('threadExited', threadEvent);
        }
        break;
      case 'output':
        this.emit('output', event.body as OutputEvent);
        break;
      case 'breakpoint':
        this.emit('breakpointChanged', event.body as BreakpointEvent);
        break;
      case 'capabilities':
        this.emit('capabilities', event.body as CapabilitiesEvent);
        break;
      case 'process':
        this.emit('process', event.body as ProcessEvent);
        break;
      default:
        // Unknown event
        break;
    }
  }

  private setState(state: DapState): void {
    this.state = state;
    this.emit('stateChange', state);
  }

  private rejectAllPending(error: Error): void {
    for (const [seq, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  private events = new Map<string, Set<Function>>();

  on<K extends keyof DapHostEvents>(event: K, listener: DapHostEvents[K]): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  off<K extends keyof DapHostEvents>(event: K, listener: DapHostEvents[K]): void {
    this.events.get(event)?.delete(listener);
  }

  private emit<K extends keyof DapHostEvents>(event: K, ...args: Parameters<DapHostEvents[K]>): void {
    const listeners = this.events.get(event) as Set<Function> | undefined;
    if (listeners) {
      for (const listener of listeners) {
        listener.apply(null, args);
      }
    }
  }
}
