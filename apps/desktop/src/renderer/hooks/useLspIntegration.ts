import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useLspStore } from '../stores/lsp.store.js';
import { useWorkspaceStore } from '../stores/workspace.js';
import { useTabsStore } from '../stores/tabs.js';

let documentVersion = 0;

export function useLspIntegration(editor: monaco.editor.IStandaloneCodeEditor | null) {
  const lspStore = useLspStore();
  const workspaceStore = useWorkspaceStore();
  const tabsStore = useTabsStore();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!editor || !workspaceStore.rootPath) return;

    const model = editor.getModel();
    if (!model) return;

    const uri = model.uri.toString();
    const languageId = model.getLanguageId();
    const text = model.getValue();

    // Document opened
    documentVersion++;
    lspStore.documentDidOpen(uri, languageId, documentVersion, text);

    // Listen for content changes
    const disposable = model.onDidChangeContent(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        documentVersion++;
        const newText = model.getValue();
        lspStore.documentDidChange(uri, documentVersion, [{ text: newText }]);
      }, 300);
    });

    return () => {
      disposable.dispose();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      lspStore.documentDidClose(uri);
    };
  }, [editor, workspaceStore.rootPath, lspStore]);

  // Register completion provider
  useEffect(() => {
    if (!editor) return;

    const disposable = monaco.languages.registerCompletionItemProvider('*', {
      triggerCharacters: ['.', ':', '<', '"', '/', '@', '*'],
      provideCompletionItems: async (model, position) => {
        const uri = model.uri.toString();
        await lspStore.getCompletions(uri, position.lineNumber - 1, position.column - 1);

        const completions = lspStore.completions.map((item, index) => ({
          label: item.label,
          kind: mapCompletionKind(item.kind),
          detail: item.detail,
          documentation: item.documentation,
          insertText: item.insertText,
          range: item.range
            ? new monaco.Range(
                item.range.start.line + 1,
                item.range.start.character + 1,
                item.range.end.line + 1,
                item.range.end.character + 1
              )
            : new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
          sortText: String(index).padStart(4, '0'),
        }));

        return { suggestions: completions };
      },
    });

    return () => disposable.dispose();
  }, [editor, lspStore]);

  // Register hover provider
  useEffect(() => {
    if (!editor) return;

    const disposable = monaco.languages.registerHoverProvider('*', {
      provideHover: async (model, position) => {
        const uri = model.uri.toString();
        await lspStore.getHover(uri, position.lineNumber - 1, position.column - 1);

        if (lspStore.hover) {
          return {
            contents: [
              { value: lspStore.hover.contents.join('\n') },
            ],
            range: lspStore.hover.range
              ? new monaco.Range(
                  lspStore.hover.range.start.line + 1,
                  lspStore.hover.range.start.character + 1,
                  lspStore.hover.range.end.line + 1,
                  lspStore.hover.range.end.character + 1
                )
              : undefined,
          };
        }

        return null;
      },
    });

    return () => disposable.dispose();
  }, [editor, lspStore]);

  // Register definition provider
  useEffect(() => {
    if (!editor) return;

    const disposable = monaco.languages.registerDefinitionProvider('*', {
      provideDefinition: async (model, position) => {
        const uri = model.uri.toString();
        const definition = await lspStore.getDefinition(uri, position.lineNumber - 1, position.column - 1);

        if (definition) {
          const defs = Array.isArray(definition) ? definition : [definition];
          return defs.map(d => ({
            uri: monaco.Uri.parse(d.uri),
            range: new monaco.Range(
              d.range.start.line + 1,
              d.range.start.character + 1,
              d.range.end.line + 1,
              d.range.end.character + 1
            ),
          }));
        }

        return [];
      },
    });

    return () => disposable.dispose();
  }, [editor, lspStore]);

  // Register signature help provider
  useEffect(() => {
    if (!editor) return;

    const disposable = monaco.languages.registerSignatureHelpProvider('*', {
      signatureHelpTriggerCharacters: ['(', ','],
      signatureHelpRetriggerCharacters: [')'],
      provideSignatureHelp: async (model, position) => {
        const uri = model.uri.toString();
        const result = await lspStore.getSignatureHelp(uri, position.lineNumber - 1, position.column - 1);

        if (result && result.signatures.length > 0) {
          return {
            value: {
              signatures: result.signatures.map(sig => ({
                label: sig.label,
                documentation: {
                  value: sig.documentation ?? '',
                },
                parameters: sig.parameters?.map(p => ({
                  label: p.label,
                  documentation: {
                    value: p.documentation ?? '',
                  },
                })) ?? [],
              })),
              activeSignature: result.activeSignature ?? 0,
              activeParameter: result.activeParameter ?? 0,
            },
            dispose: () => {},
          };
        }

        return null;
      },
    });

    return () => disposable.dispose();
  }, [editor, lspStore]);

  // Register rename provider
  useEffect(() => {
    if (!editor) return;

    const disposable = monaco.languages.registerRenameProvider('*', {
      provideRenameEdits: async (model, position, newName) => {
        const uri = model.uri.toString();
        const result = await lspStore.rename(uri, position.lineNumber - 1, position.column - 1, newName);

        if (result?.changes) {
          const edits: monaco.languages.WorkspaceEdit = { edits: [] };
          for (const [uri, fileEdits] of Object.entries(result.changes)) {
            for (const edit of fileEdits) {
              edits.edits.push({
                resource: monaco.Uri.parse(uri),
                edit: {
                  range: new monaco.Range(
                    edit.range.start.line + 1,
                    edit.range.start.character + 1,
                    edit.range.end.line + 1,
                    edit.range.end.character + 1
                  ),
                  text: edit.newText,
                },
              });
            }
          }
          return edits;
        }

        return { edits: [] };
      },
    });

    return () => disposable.dispose();
  }, [editor, lspStore]);

  // Register document formatting provider
  useEffect(() => {
    if (!editor) return;

    const disposable = monaco.languages.registerDocumentFormattingEditProvider('*', {
      provideDocumentFormattingEdits: async (model) => {
        const uri = model.uri.toString();
        const result = await lspStore.formatDocument(uri, 2, true);

        if (result) {
          return result.map(edit => ({
            range: new monaco.Range(
              edit.range.start.line + 1,
              edit.range.start.character + 1,
              edit.range.end.line + 1,
              edit.range.end.character + 1
            ),
            text: edit.newText,
          }));
        }

        return [];
      },
    });

    return () => disposable.dispose();
  }, [editor, lspStore]);
}

function mapCompletionKind(kind: number): monaco.languages.CompletionItemKind {
  const kindMap: Record<number, monaco.languages.CompletionItemKind> = {
    1: monaco.languages.CompletionItemKind.Text,
    2: monaco.languages.CompletionItemKind.Method,
    3: monaco.languages.CompletionItemKind.Function,
    4: monaco.languages.CompletionItemKind.Constructor,
    5: monaco.languages.CompletionItemKind.Field,
    6: monaco.languages.CompletionItemKind.Variable,
    7: monaco.languages.CompletionItemKind.Class,
    8: monaco.languages.CompletionItemKind.Interface,
    9: monaco.languages.CompletionItemKind.Module,
    10: monaco.languages.CompletionItemKind.Property,
    11: monaco.languages.CompletionItemKind.Unit,
    12: monaco.languages.CompletionItemKind.Value,
    13: monaco.languages.CompletionItemKind.Enum,
    14: monaco.languages.CompletionItemKind.Keyword,
    15: monaco.languages.CompletionItemKind.Snippet,
    16: monaco.languages.CompletionItemKind.Color,
    17: monaco.languages.CompletionItemKind.File,
    18: monaco.languages.CompletionItemKind.Reference,
    19: monaco.languages.CompletionItemKind.Folder,
    20: monaco.languages.CompletionItemKind.EnumMember,
    21: monaco.languages.CompletionItemKind.Constant,
    22: monaco.languages.CompletionItemKind.Struct,
    23: monaco.languages.CompletionItemKind.Event,
    24: monaco.languages.CompletionItemKind.Operator,
    25: monaco.languages.CompletionItemKind.TypeParameter,
  };
  return kindMap[kind] ?? monaco.languages.CompletionItemKind.Text;
}
