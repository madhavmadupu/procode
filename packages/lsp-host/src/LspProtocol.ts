export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface InitializeParams {
  processId: number | null;
  clientInfo: { name: string; version: string };
  rootUri: string | null;
  initializationOptions?: unknown;
  capabilities: ClientCapabilities;
  trace?: 'off' | 'messages' | 'verbose';
  workspaceFolders?: WorkspaceFolder[];
}

export interface WorkspaceFolder {
  uri: string;
  name: string;
}

export interface ClientCapabilities {
  workspace?: WorkspaceClientCapabilities;
  textDocument?: TextDocumentClientCapabilities;
  window?: WindowClientCapabilities;
  general?: GeneralClientCapabilities;
}

export interface WorkspaceClientCapabilities {
  workspaceFolders?: boolean;
  didChangeConfiguration?: { dynamicRegistration?: boolean };
  didChangeWatchedFiles?: { dynamicRegistration?: boolean };
}

export interface TextDocumentClientCapabilities {
  synchronization?: {
    dynamicRegistration?: boolean;
    willSave?: boolean;
    didSave?: boolean;
    willSaveWaitUntil?: boolean;
  };
  completion?: {
    dynamicRegistration?: boolean;
    completionItem?: {
      snippetSupport?: boolean;
      commitCharactersSupport?: boolean;
      documentationFormat?: string[];
      deprecatedSupport?: boolean;
      preselectSupport?: boolean;
    };
    contextSupport?: boolean;
  };
  hover?: {
    dynamicRegistration?: boolean;
    contentFormat?: string[];
  };
  signatureHelp?: {
    dynamicRegistration?: boolean;
    signatureInformation?: {
      documentationFormat?: string[];
      parameterInformation?: { labelOffsetSupport?: boolean };
    };
  };
  declaration?: { dynamicRegistration?: boolean; linkSupport?: boolean };
  definition?: { dynamicRegistration?: boolean; linkSupport?: boolean };
  typeDefinition?: { dynamicRegistration?: boolean; linkSupport?: boolean };
  implementation?: { dynamicRegistration?: boolean; linkSupport?: boolean };
  references?: { dynamicRegistration?: boolean };
  documentHighlight?: { dynamicRegistration?: boolean };
  documentSymbol?: {
    dynamicRegistration?: boolean;
    symbolKind?: { valueSet?: number[] };
    hierarchicalDocumentSymbolSupport?: boolean;
  };
  codeAction?: {
    dynamicRegistration?: boolean;
    codeActionLiteralSupport?: {
      codeActionKind: { valueSet: string[] };
    };
    isPreferredSupport?: boolean;
  };
  codeLens?: { dynamicRegistration?: boolean };
  documentFormatting?: { dynamicRegistration?: boolean };
  documentRangeFormatting?: { dynamicRegistration?: boolean };
  documentOnTypeFormatting?: { dynamicRegistration?: boolean };
  rename?: {
    dynamicRegistration?: boolean;
    prepareSupport?: boolean;
    prepareSupportDefaultBehavior?: number;
  };
  documentLink?: { dynamicRegistration?: boolean; tooltipSupport?: boolean };
  colorProvider?: { dynamicRegistration?: boolean };
  foldingRange?: { dynamicRegistration?: boolean; rangeLimit?: number; lineFoldingOnly?: boolean };
  publishDiagnostics?: {
    relatedInformation?: boolean;
    tagSupport?: { valueSet: number[] };
    versionSupport?: boolean;
    codeDescriptionSupport?: boolean;
    dataSupport?: boolean;
  };
  callHierarchy?: { dynamicRegistration?: boolean };
  inlayHint?: { dynamicRegistration?: boolean };
  typeHierarchy?: { dynamicRegistration?: boolean };
  semanticTokens?: {
    dynamicRegistration?: boolean;
    requests: {
      range?: boolean;
      full?: boolean | { delta?: boolean };
    };
    tokenTypes: string[];
    tokenModifiers: string[];
    formats: string[];
    overlappingTokenSupport?: boolean;
    multilineTokenSupport?: boolean;
  };
}

export interface WindowClientCapabilities {
  workDoneProgress?: boolean;
  showMessage?: { messageActionItem?: { additionalPropertiesSupport?: boolean } };
  showDocument?: { support?: boolean };
}

export interface GeneralClientCapabilities {
  staleRequestSupport?: {
    cancel: boolean;
    retryOnContentModified: string[];
  };
  regularExpressions?: { engine: string; version?: string };
  markdown?: { parser: string; version?: string };
  positionEncodings?: string[];
}

export interface InitializeResult {
  capabilities: ServerCapabilities;
  serverInfo?: { name: string; version?: string };
}

export interface ServerCapabilities {
  positionEncoding?: string;
  textDocumentSync?: TextDocumentSyncOptions | number;
  completionProvider?: CompletionOptions;
  hoverProvider?: boolean | HoverOptions;
  signatureHelpProvider?: SignatureHelpOptions;
  declarationProvider?: boolean | DeclarationOptions | DeclarationRegistrationOptions;
  definitionProvider?: boolean | DefinitionOptions;
  typeDefinitionProvider?: boolean | TypeDefinitionOptions | TypeDefinitionRegistrationOptions;
  implementationProvider?: boolean | ImplementationOptions | ImplementationRegistrationOptions;
  referencesProvider?: boolean | ReferenceOptions;
  documentHighlightProvider?: boolean | DocumentHighlightOptions;
  documentSymbolProvider?: boolean | DocumentSymbolOptions;
  codeActionProvider?: boolean | CodeActionOptions;
  codeLensProvider?: CodeLensOptions;
  documentLinkProvider?: DocumentLinkOptions;
  colorProvider?: boolean | DocumentColorOptions | DocumentColorRegistrationOptions;
  documentFormattingProvider?: boolean | DocumentFormattingOptions;
  documentRangeFormattingProvider?: boolean | DocumentRangeFormattingOptions;
  documentOnTypeFormattingProvider?: DocumentOnTypeFormattingOptions;
  renameProvider?: boolean | RenameOptions;
  foldingRangeProvider?: boolean | FoldingRangeOptions | FoldingRangeRegistrationOptions;
  executeCommandProvider?: ExecuteCommandOptions;
  callHierarchyProvider?: boolean | CallHierarchyOptions | CallHierarchyRegistrationOptions;
  linkedEditingRangeProvider?: boolean | LinkedEditingRangeOptions | LinkedEditingRangeRegistrationOptions;
  semanticTokensProvider?: SemanticTokensOptions | SemanticTokensRegistrationOptions;
  monikerProvider?: boolean | MonikerOptions | MonikerRegistrationOptions;
  typeHierarchyProvider?: boolean | TypeHierarchyOptions | TypeHierarchyRegistrationOptions;
  inlineValueProvider?: boolean | InlineValueOptions | InlineValueRegistrationOptions;
  inlayHintProvider?: boolean | InlayHintOptions | InlayHintRegistrationOptions;
  diagnosticProvider?: DiagnosticOptions | DiagnosticRegistrationOptions;
  workspaceSymbolProvider?: boolean | WorkspaceSymbolOptions;
  workspace?: WorkspaceOptions;
}

export interface TextDocumentSyncOptions {
  openClose?: boolean;
  change?: number;
  willSave?: boolean;
  willSaveWaitUntil?: boolean;
  save?: boolean | SaveOptions;
}

export interface SaveOptions {
  includeText?: boolean;
}

export interface CompletionOptions {
  triggerCharacters?: string[];
  allCommitCharacters?: string[];
  resolveProvider?: boolean;
  completionItem?: { labelDetailsSupport?: boolean };
}

export interface HoverOptions {
  workDoneProgress?: boolean;
}

export interface SignatureHelpOptions {
  triggerCharacters?: string[];
  retriggerCharacters?: string[];
  workDoneProgress?: boolean;
}

export interface DeclarationOptions {
  workDoneProgress?: boolean;
}

export interface DeclarationRegistrationOptions extends DeclarationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface DefinitionOptions {
  workDoneProgress?: boolean;
}

export interface TypeDefinitionOptions {
  workDoneProgress?: boolean;
}

export interface TypeDefinitionRegistrationOptions extends TypeDefinitionOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface ImplementationOptions {
  workDoneProgress?: boolean;
}

export interface ImplementationRegistrationOptions extends ImplementationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface ReferenceOptions {
  workDoneProgress?: boolean;
}

export interface DocumentHighlightOptions {
  workDoneProgress?: boolean;
}

export interface DocumentSymbolOptions {
  label?: string;
  workDoneProgress?: boolean;
}

export interface CodeActionOptions {
  codeActionKinds?: string[];
  resolveProvider?: boolean;
  workDoneProgress?: boolean;
}

export interface CodeLensOptions {
  resolveProvider?: boolean;
}

export interface DocumentLinkOptions {
  resolveProvider?: boolean;
  workDoneProgress?: boolean;
}

export interface DocumentColorOptions {
  workDoneProgress?: boolean;
}

export interface DocumentColorRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface DocumentFormattingOptions {
  workDoneProgress?: boolean;
}

export interface DocumentRangeFormattingOptions {
  workDoneProgress?: boolean;
}

export interface DocumentOnTypeFormattingOptions {
  firstTriggerCharacter: string;
  moreTriggerCharacter?: string[];
}

export interface RenameOptions {
  prepareProvider?: boolean;
  workDoneProgress?: boolean;
}

export interface FoldingRangeOptions {
  workDoneProgress?: boolean;
}

export interface FoldingRangeRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface ExecuteCommandOptions {
  commands: string[];
  workDoneProgress?: boolean;
}

export interface CallHierarchyOptions {
  workDoneProgress?: boolean;
}

export interface CallHierarchyRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface LinkedEditingRangeOptions {
  workDoneProgress?: boolean;
}

export interface LinkedEditingRangeRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface SemanticTokensOptions {
  legend: SemanticTokensLegend;
  range?: boolean | Record<string, never>;
  full?: boolean | { delta?: boolean };
}

export interface SemanticTokensRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface SemanticTokensLegend {
  tokenTypes: string[];
  tokenModifiers: string[];
}

export interface MonikerOptions {
  workDoneProgress?: boolean;
}

export interface MonikerRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface TypeHierarchyOptions {
  workDoneProgress?: boolean;
}

export interface TypeHierarchyRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface InlineValueOptions {
  workDoneProgress?: boolean;
}

export interface InlineValueRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface InlayHintOptions {
  resolveProvider?: boolean;
  workDoneProgress?: boolean;
}

export interface InlayHintRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface DiagnosticOptions {
  identifier?: string;
  interFileDependencies: boolean;
  workspaceDiagnostics: boolean;
}

export interface DiagnosticRegistrationOptions {
  documentSelector: string[] | null;
  id?: string;
}

export interface WorkspaceSymbolOptions {
  resolveProvider?: boolean;
  workDoneProgress?: boolean;
}

export interface WorkspaceOptions {
  workspaceFolders?: {
    supported?: boolean;
    changeNotifications?: string | boolean;
  };
  fileOperations?: {
    didCreate?: FileOperationRegistrationOptions;
    willCreate?: FileOperationRegistrationOptions;
    didRename?: FileOperationRegistrationOptions;
    willRename?: FileOperationRegistrationOptions;
    didDelete?: FileOperationRegistrationOptions;
    willDelete?: FileOperationRegistrationOptions;
  };
}

export interface FileOperationRegistrationOptions {
  filters: FileOperationFilter[];
}

export interface FileOperationFilter {
  scheme?: string;
  pattern: FileOperationPattern;
}

export interface FileOperationPattern {
  glob: string;
  matches?: string;
  options?: { ignoreCase?: boolean };
}

export interface DidOpenTextDocumentParams {
  textDocument: TextDocumentItem;
}

export interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

export interface DidChangeTextDocumentParams {
  textDocument: VersionedTextDocumentIdentifier;
  contentChanges: TextDocumentContentChangeEvent[];
}

export interface VersionedTextDocumentIdentifier {
  uri: string;
  version: number;
}

export interface TextDocumentContentChangeEvent {
  range?: Range;
  rangeLength?: number;
  text: string;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface DidCloseTextDocumentParams {
  textDocument: TextDocumentIdentifier;
}

export interface TextDocumentIdentifier {
  uri: string;
}

export interface DidSaveTextDocumentParams {
  textDocument: TextDocumentIdentifier;
  text?: string;
}

export interface CompletionParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
  context?: CompletionContext;
}

export interface CompletionContext {
  triggerKind: number;
  triggerCharacter?: string;
}

export interface CompletionList {
  isIncomplete: boolean;
  items: CompletionItem[];
}

export interface CompletionItem {
  label: string;
  labelDetails?: CompletionItemLabelDetails;
  kind?: number;
  tags?: number[];
  detail?: string;
  documentation?: string | MarkupContent;
  deprecated?: boolean;
  preselect?: boolean;
  sortText?: string;
  filterText?: string;
  insertText?: string;
  insertTextFormat?: number;
  insertTextMode?: number;
  textEdit?: TextEdit | InsertReplaceEdit;
  textEditText?: string;
  additionalTextEdits?: TextEdit[];
  commitCharacters?: string[];
  command?: Command;
  data?: unknown;
}

export interface CompletionItemLabelDetails {
  detail?: string;
  description?: string;
}

export interface MarkupContent {
  kind: 'plaintext' | 'markdown';
  value: string;
}

export interface TextEdit {
  range: Range;
  newText: string;
}

export interface InsertReplaceEdit {
  insert: Range;
  replace: Range;
  newText: string;
}

export interface Command {
  title: string;
  command: string;
  arguments?: unknown[];
}

export interface HoverParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
}

export interface Hover {
  contents: MarkupContent | MarkedString | MarkedString[];
  range?: Range;
}

export type MarkedString = string | { language: string; value: string };

export interface DefinitionParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
}

export type Definition = Location | Location[];

export interface Location {
  uri: string;
  range: Range;
}

export interface ReferenceParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
  context: ReferenceContext;
}

export interface ReferenceContext {
  includeDeclaration: boolean;
}

export interface DocumentSymbolParams {
  textDocument: TextDocumentIdentifier;
}

export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: number;
  tags?: number[];
  deprecated?: boolean;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}

export interface WorkspaceSymbolParams {
  query: string;
}

export interface WorkspaceSymbol {
  name: string;
  kind: number;
  tags?: number[];
  location: Location | { uri: string };
  data?: unknown;
}

export interface RenameParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
  newName: string;
}

export interface WorkspaceEdit {
  changes?: { [uri: string]: TextEdit[] };
  documentChanges?: (TextDocumentEdit | CreateFile | RenameFile | DeleteFile)[];
  changeAnnotations?: { [id: string]: ChangeAnnotation };
}

export interface TextDocumentEdit {
  textDocument: OptionalVersionedTextDocumentIdentifier;
  edits: (TextEdit | AnnotatedTextEdit)[];
}

export interface OptionalVersionedTextDocumentIdentifier {
  uri: string;
  version: number | null;
}

export interface AnnotatedTextEdit extends TextEdit {
  annotationId: string;
}

export interface CreateFile {
  kind: 'create';
  uri: string;
  options?: { overwrite?: boolean; ignoreIfExists?: boolean };
  annotationId?: string;
}

export interface RenameFile {
  kind: 'rename';
  oldUri: string;
  newUri: string;
  options?: { overwrite?: boolean; ignoreIfExists?: boolean };
  annotationId?: string;
}

export interface DeleteFile {
  kind: 'delete';
  uri: string;
  options?: { recursive?: boolean; ignoreIfNotExists?: boolean };
  annotationId?: string;
}

export interface ChangeAnnotation {
  label: string;
  needsConfirmation?: boolean;
  description?: string;
}

export interface PublishDiagnosticsParams {
  uri: string;
  version?: number;
  diagnostics: LspDiagnostic[];
}

export interface LspDiagnostic {
  range: Range;
  severity?: number;
  code?: number | string;
  codeDescription?: { href: string };
  source?: string;
  message: string;
  tags?: number[];
  relatedInformation?: DiagnosticRelatedInformation[];
  data?: unknown;
}

export interface DiagnosticRelatedInformation {
  location: Location;
  message: string;
}

export interface SignatureHelpParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
  context?: SignatureHelpContext;
}

export interface SignatureHelpContext {
  triggerKind: number;
  triggerCharacter?: string;
  isRetrigger: boolean;
  activeSignatureHelp?: SignatureHelp;
}

export interface SignatureHelp {
  signatures: SignatureInformation[];
  activeSignature?: number;
  activeParameter?: number;
}

export interface SignatureInformation {
  label: string;
  documentation?: string | MarkupContent;
  parameters?: ParameterInformation[];
  activeParameter?: number;
}

export interface ParameterInformation {
  label: string | [number, number];
  documentation?: string | MarkupContent;
}

export interface CodeActionParams {
  textDocument: TextDocumentIdentifier;
  range: Range;
  context: CodeActionContext;
}

export interface CodeActionContext {
  diagnostics: LspDiagnostic[];
  only?: string[];
  triggerKind?: number;
}

export interface CodeAction {
  title: string;
  kind?: string;
  diagnostics?: LspDiagnostic[];
  isPreferred?: boolean;
  disabled?: { reason: string };
  edit?: WorkspaceEdit;
  command?: Command;
  data?: unknown;
}

export interface CodeLensParams {
  textDocument: TextDocumentIdentifier;
}

export interface CodeLens {
  range: Range;
  command?: Command;
  data?: unknown;
}

export interface DocumentFormattingParams {
  textDocument: TextDocumentIdentifier;
  options: FormattingOptions;
}

export interface FormattingOptions {
  tabSize: number;
  insertSpaces: boolean;
  trimTrailingWhitespace?: boolean;
  insertFinalNewline?: boolean;
  trimFinalNewlines?: boolean;
}

export interface DocumentRangeFormattingParams {
  textDocument: TextDocumentIdentifier;
  range: Range;
  options: FormattingOptions;
}

export interface SemanticTokensParams {
  textDocument: TextDocumentIdentifier;
}

export interface SemanticTokens {
  resultId?: string;
  data: number[];
}

export interface SemanticTokensDeltaParams {
  textDocument: TextDocumentIdentifier;
  previousResultId: string;
}

export interface SemanticTokensDelta {
  resultId?: string;
  edits: SemanticTokensEdit[];
}

export interface SemanticTokensEdit {
  start: number;
  deleteCount: number;
  data?: number[];
}

export interface SemanticTokensRangeParams {
  textDocument: TextDocumentIdentifier;
  range: Range;
}

export interface InlayHintParams {
  textDocument: TextDocumentIdentifier;
  range: Range;
}

export interface InlayHint {
  position: Position;
  label: string | InlayHintLabelPart[];
  kind?: number;
  textEdits?: TextEdit[];
  tooltip?: string | MarkupContent;
  paddingLeft?: boolean;
  paddingRight?: boolean;
  data?: unknown;
}

export interface InlayHintLabelPart {
  value: string;
  tooltip?: string | MarkupContent;
  location?: Location;
  command?: Command;
}

export interface CallHierarchyPrepareParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
}

export interface CallHierarchyItem {
  name: string;
  kind: number;
  tags?: number[];
  detail?: string;
  uri: string;
  range: Range;
  selectionRange: Range;
  data?: unknown;
}

export interface CallHierarchyIncomingCallsParams {
  item: CallHierarchyItem;
}

export interface CallHierarchyIncomingCall {
  from: CallHierarchyItem;
  fromRanges: Range[];
}

export interface CallHierarchyOutgoingCallsParams {
  item: CallHierarchyItem;
}

export interface CallHierarchyOutgoingCall {
  to: CallHierarchyItem;
  fromRanges: Range[];
}

export interface TypeHierarchyPrepareParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
}

export interface TypeHierarchyItem {
  name: string;
  kind: number;
  tags?: number[];
  detail?: string;
  uri: string;
  range: Range;
  selectionRange: Range;
  data?: unknown;
}

export interface TypeHierarchySupertypesParams {
  item: TypeHierarchyItem;
}

export interface TypeHierarchySubtypesParams {
  item: TypeHierarchyItem;
}

export interface DidChangeConfigurationParams {
  settings: unknown;
}

export interface DidChangeWatchedFilesParams {
  changes: FileEvent[];
}

export interface FileEvent {
  uri: string;
  type: number;
}

export interface ExecuteCommandParams {
  command: string;
  arguments?: unknown[];
  workDoneToken?: string;
}

export interface ApplyWorkspaceEditParams {
  label?: string;
  edit: WorkspaceEdit;
}

export interface ApplyWorkspaceEditResponse {
  applied: boolean;
  failureReason?: string;
  failedChange?: number;
}
