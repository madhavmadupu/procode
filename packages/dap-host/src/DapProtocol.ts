export interface DapRequest {
  seq: number;
  type: 'request';
  command: string;
  arguments?: unknown;
}

export interface DapResponse {
  seq: number;
  type: 'response';
  request_seq: number;
  success: boolean;
  command: string;
  message?: string;
  body?: unknown;
}

export interface DapEvent {
  seq: number;
  type: 'event';
  event: string;
  body?: unknown;
}

export type DapMessage = DapRequest | DapResponse | DapEvent;

export interface InitializeRequest {
  clientID?: string;
  clientName?: string;
  adapterID: string;
  pathFormat?: string;
  linesStartAt1?: boolean;
  columnsStartAt1?: boolean;
  supportsVariableType?: boolean;
  supportsVariablePaging?: boolean;
  supportsRunInTerminalRequest?: boolean;
  locale?: string;
}

export interface InitializeResponse {
  supportsConfigurationDoneRequest?: boolean;
  supportsFunctionBreakpoints?: boolean;
  supportsConditionalBreakpoints?: boolean;
  supportsHitConditionalBreakpoints?: boolean;
  supportsEvaluateForHovers?: boolean;
  exceptionBreakpointFilters?: ExceptionBreakpointFilter[];
  supportsStepBack?: boolean;
  supportsSetVariable?: boolean;
  supportsRestartFrame?: boolean;
  supportsGotoTargetsRequest?: boolean;
  supportsStepInTargetsRequest?: boolean;
  supportsCompletionsRequest?: boolean;
  completionTriggerCharacters?: string[];
  supportsModulesRequest?: boolean;
  additionalModuleColumns?: ColumnDescriptor[];
  supportedChecksumAlgorithms?: ChecksumAlgorithm[];
  supportsRestartRequest?: boolean;
  supportsExceptionOptions?: boolean;
  supportsValueFormattingOptions?: boolean;
  supportsExceptionInfoRequest?: boolean;
  supportTerminateDebuggee?: boolean;
  supportSuspendDebuggee?: boolean;
  supportsLoadedSourcesRequest?: boolean;
  supportsLogPoints?: boolean;
  supportsTerminateThreadsRequest?: boolean;
  supportsSetExpression?: boolean;
  supportsTerminateRequest?: boolean;
  supportsDataBreakpoints?: boolean;
  supportsReadMemoryRequest?: boolean;
  supportsWriteMemoryRequest?: boolean;
  supportsDisassembleRequest?: boolean;
  supportsCancelRequest?: boolean;
  supportsBreakpointLocationsRequest?: boolean;
  supportsClipboardContext?: boolean;
  supportsSteppingGranularity?: boolean;
  supportsInstructionBreakpoints?: boolean;
  supportsExceptionFilterOptions?: boolean;
  supportsDelayedStackTraceLoading?: boolean;
}

export interface ExceptionBreakpointFilter {
  filter: string;
  label: string;
  description?: string;
  default?: boolean;
  supportsCondition?: boolean;
  conditionDescription?: string;
}

export interface ColumnDescriptor {
  attributeName: string;
  label: string;
  format?: string;
  type?: string;
  width?: number;
}

export interface ChecksumAlgorithm {
  algorithm: string;
}

export interface LaunchRequest {
  type?: string;
  name?: string;
  request: 'launch';
  program?: string;
  args?: string[];
  cwd?: string;
  env?: { [key: string]: string };
  stopOnEntry?: boolean;
  console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
  [key: string]: unknown;
}

export interface AttachRequest {
  type?: string;
  name?: string;
  request: 'attach';
  processId?: number;
  port?: number;
  host?: string;
  [key: string]: unknown;
}

export interface ConfigurationDoneRequest {
  // No arguments
}

export interface DisconnectRequest {
  restart?: boolean;
  terminateDebuggee?: boolean;
  suspendDebuggee?: boolean;
}

export interface SetBreakpointsRequest {
  source: Source;
  breakpoints?: SourceBreakpoint[];
  lines?: number[];
  sourceModified?: boolean;
}

export interface Source {
  name?: string;
  path?: string;
  sourceReference?: number;
  presentationHint?: 'normal' | 'emphasize' | 'deemphasize';
  origin?: string;
  sources?: Source[];
  adapterData?: unknown;
}

export interface SourceBreakpoint {
  line: number;
  column?: number;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
}

export interface SetBreakpointsResponse {
  breakpoints: Breakpoint[];
}

export interface Breakpoint {
  id?: number;
  verified: boolean;
  message?: string;
  source?: Source;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  instructionReference?: string;
  offset?: number;
}

export interface SetFunctionBreakpointsRequest {
  breakpoints: FunctionBreakpoint[];
}

export interface FunctionBreakpoint {
  name: string;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
}

export interface SetExceptionBreakpointsRequest {
  filters: string[];
  filterOptions?: ExceptionFilterOptions[];
  exceptionOptions?: ExceptionOptions[];
}

export interface ExceptionFilterOptions {
  filterId: string;
  condition?: string;
}

export interface ExceptionOptions {
  path: ExceptionPathSegment[];
  breakMode: 'never' | 'always' | 'unhandled' | 'userUnhandled';
}

export interface ExceptionPathSegment {
  negate?: boolean;
  names: string[];
}

export interface ContinueRequest {
  threadId: number;
  singleThread?: boolean;
}

export interface ContinueResponse {
  allThreadsContinued?: boolean;
}

export interface NextRequest {
  threadId: number;
  granularity?: SteppingGranularity;
}

export type SteppingGranularity = 'statement' | 'line' | 'instruction';

export interface StepInRequest {
  threadId: number;
  targetId?: number;
  granularity?: SteppingGranularity;
}

export interface StepOutRequest {
  threadId: number;
  granularity?: SteppingGranularity;
}

export interface PauseRequest {
  threadId: number;
}

export interface StackTraceRequest {
  threadId: number;
  startFrame?: number;
  levels?: number;
  format?: StackFrameFormat;
}

export interface StackTraceResponse {
  stackFrames: StackFrame[];
  totalFrames?: number;
}

export interface StackFrame {
  id: number;
  name: string;
  source?: Source;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  canRestart?: boolean;
  instructionPointerReference?: string;
  moduleId?: number | string;
  presentationHint?: 'normal' | 'label' | 'subtle';
}

export interface StackFrameFormat {
  parameters?: boolean;
  parameterTypes?: boolean;
  parameterNames?: boolean;
  parameterValues?: boolean;
  line?: boolean;
  module?: boolean;
  includeAll?: boolean;
}

export interface ScopesRequest {
  frameId: number;
}

export interface ScopesResponse {
  scopes: Scope[];
}

export interface Scope {
  name: string;
  presentationHint?: 'arguments' | 'locals' | 'registers' | string;
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
  expensive: boolean;
  source?: Source;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface VariablesRequest {
  variablesReference: number;
  filter?: 'indexed' | 'named';
  start?: number;
  count?: number;
  format?: ValueFormat;
}

export interface VariablesResponse {
  variables: Variable[];
}

export interface Variable {
  name: string;
  value: string;
  type?: string;
  presentationHint?: VariablePresentationHint;
  evaluateName?: string;
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
  memoryReference?: string;
}

export interface VariablePresentationHint {
  kind?: string;
  attributes?: string[];
  visibility?: string;
  lazy?: boolean;
}

export interface ValueFormat {
  hex?: boolean;
}

export interface ThreadsResponse {
  threads: Thread[];
}

export interface Thread {
  id: number;
  name: string;
}

export interface EvaluateRequest {
  expression: string;
  frameId?: number;
  context?: string;
  format?: ValueFormat;
}

export interface EvaluateResponse {
  result: string;
  type?: string;
  presentationHint?: VariablePresentationHint;
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
  memoryReference?: string;
}

export interface StoppedEvent {
  reason: 'step' | 'breakpoint' | 'exception' | 'pause' | 'entry' | 'goto' | 'function breakpoint' | 'data breakpoint' | 'instruction breakpoint';
  description?: string;
  threadId?: number;
  preserveFocusHint?: boolean;
  text?: string;
  allThreadsStopped?: boolean;
  hitBreakpointIds?: number[];
}

export interface ContinuedEvent {
  threadId: number;
  allThreadsContinued?: boolean;
}

export interface ExitedEvent {
  exitCode: number;
}

export interface TerminatedEvent {
  restart?: unknown;
}

export interface ThreadEvent {
  reason: 'started' | 'exited';
  threadId: number;
}

export interface OutputEvent {
  category?: 'console' | 'stdout' | 'stderr' | 'telemetry' | string;
  output: string;
  group?: 'start' | 'startCollapsed' | 'end';
  variablesReference?: number;
  source?: Source;
  line?: number;
  column?: number;
  data?: unknown;
}

export interface BreakpointEvent {
  reason: 'changed' | 'new' | 'removed';
  breakpoint: Breakpoint;
}

export interface LoadedSourceEvent {
  reason: 'new' | 'changed' | 'removed';
  source: Source;
}

export interface CapabilitiesEvent {
  capabilities: InitializeResponse;
}

export interface ProcessEvent {
  name: string;
  systemProcessId?: number;
  isLocalProcess?: boolean;
  startMethod?: 'launch' | 'attach' | 'attachForSuspendedLaunch';
  pointerSize?: number;
}

export interface ProgressStartEvent {
  progressId: string;
  title: string;
  requestId?: number;
  cancellable?: boolean;
  message?: string;
  percentage?: number;
}

export interface ProgressUpdateEvent {
  progressId: string;
  message?: string;
  percentage?: number;
}

export interface ProgressEndEvent {
  progressId: string;
  message?: string;
}

export interface InvalidatedEvent {
  areas?: ('stacks' | 'threads' | 'variables')[];
  threadId?: number;
  stackFrameId?: number;
}

export interface MemoryEvent {
  memoryReference: string;
  offset: number;
  count: number;
}

export interface SetExpressionRequest {
  expression: string;
  value: string;
  frameId?: number;
}

export interface SetExpressionResponse {
  value: string;
  type?: string;
  presentationHint?: VariablePresentationHint;
  variablesReference?: number;
}

export interface StepInTargetsRequest {
  frameId: number;
}

export interface StepInTargetsResponse {
  targets: StepInTarget[];
}

export interface StepInTarget {
  id: number;
  label: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  instructionPointerReference?: string;
}

export interface GotoTargetsRequest {
  source: Source;
  line: number;
  column?: number;
}

export interface GotoTargetsResponse {
  targets: GotoTarget[];
}

export interface GotoTarget {
  id: number;
  label: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  instructionPointerReference?: string;
}

export interface GotoRequest {
  threadId: number;
  targetId: number;
}

export interface CompletionsRequest {
  frameId: number;
  text: string;
  column: number;
  line?: number;
}

export interface CompletionsResponse {
  targets: CompletionItem[];
}

export interface CompletionItem {
  label: string;
  text?: string;
  sortText?: string;
  detail?: string;
  type?: 'method' | 'function' | 'constructor' | 'field' | 'variable' | 'class' | 'interface' | 'module' | 'property' | 'unit' | 'value' | 'enum' | 'keyword' | 'snippet' | 'text' | 'color' | 'file' | 'reference' | 'customcolor';
  start?: number;
  length?: number;
  selectionStart?: number;
  selectionLength?: number;
}

export interface ReadMemoryRequest {
  memoryReference: string;
  offset?: number;
  count: number;
}

export interface ReadMemoryResponse {
  address: string;
  unreadableBytes?: number;
  data?: string;
}

export interface WriteMemoryRequest {
  memoryReference: string;
  offset?: number;
  allowPartial?: boolean;
  data: string;
}

export interface WriteMemoryResponse {
  bytesWritten?: number;
  offset?: number;
}

export interface DisassembleRequest {
  memoryReference: string;
  offset?: number;
  instructionOffset?: number;
  instructionCount: number;
  resolveSymbols?: boolean;
}

export interface DisassembleResponse {
  instructions: InstructionBreakpoint[];
}

export interface InstructionBreakpoint {
  address: string;
  instructionBytes?: string;
  instruction: string;
  symbol?: string;
  location?: Source;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface SetInstructionBreakpointsRequest {
  breakpoints: InstructionBreakpoint[];
}

export interface SetInstructionBreakpointsResponse {
  breakpoints: Breakpoint[];
}

export interface DataBreakpointInfoRequest {
  name: string;
  variablesReference?: number;
  frameId?: number;
}

export interface DataBreakpointInfoResponse {
  dataId: string | null;
  description: string;
  canPersist?: boolean;
  accessTypes?: ('read' | 'write' | 'readWrite')[];
  accessType?: 'read' | 'write' | 'readWrite';
}

export interface SetDataBreakpointsRequest {
  breakpoints: DataBreakpoint[];
}

export interface DataBreakpoint {
  dataId: string;
  accessType?: 'read' | 'write' | 'readWrite';
  condition?: string;
  hitCondition?: string;
}

export interface SetDataBreakpointsResponse {
  breakpoints: Breakpoint[];
}

export interface BreakpointLocationsRequest {
  source: Source;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface BreakpointLocationsResponse {
  breakpoints: BreakpointLocation[];
}

export interface BreakpointLocation {
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface ExceptionInfoRequest {
  threadId: number;
}

export interface ExceptionInfoResponse {
  exceptionId: string;
  description?: string;
  breakMode: 'never' | 'always' | 'unhandled' | 'userUnhandled';
  details?: ExceptionDetails;
}

export interface ExceptionDetails {
  message?: string;
  typeName?: string;
  fullTypeName?: string;
  evaluateName?: string;
  stackTrace?: string;
  innerException?: ExceptionDetails[];
}

export interface LoadedSourcesResponse {
  sources: Source[];
}

export interface ModulesRequest {
  startModule?: number;
  moduleCount?: number;
}

export interface ModulesResponse {
  modules: Module[];
  totalModules?: number;
}

export interface Module {
  id: number | string;
  name: string;
  path?: string;
  isOptimized?: boolean;
  isUserCode?: boolean;
  version?: string;
  symbolStatus?: string;
  symbolFilePath?: string;
  dateTimeStamp?: string;
  addressRange?: string;
}
