import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { useTabsStore } from "../../stores/tabs";
import { useEditorStore } from "../../stores/editor";
import { useWorkspaceStore } from "../../stores/workspace";
import { useLspIntegration } from "../../hooks/useLspIntegration";
import { Skeleton } from "../ui";

export function EditorPanel() {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { activeTabId, tabs, updateDocument, markDirty } = useTabsStore();
  const { config } = useEditorStore();
  const { rootPath } = useWorkspaceStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Integrate LSP with Monaco editor
  useLspIntegration(monacoRef.current);

  useEffect(() => {
    if (!editorRef.current || isInitialized) return;

    const editor = monaco.editor.create(editorRef.current, {
      value: "",
      language: "plaintext",
      theme: "vs-dark",
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      tabSize: config.tabSize,
      insertSpaces: config.insertSpaces,
      wordWrap: config.wordWrap === "on" ? "on" : "off",
      minimap: { enabled: config.minimap.enabled },
      automaticLayout: true,
      scrollBeyondLastLine: true,
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
    });

    monacoRef.current = editor;

    editor.onDidChangeModelContent(() => {
      if (!activeTab) return;

      const value = editor.getValue();
      updateDocument(activeTab.path, {
        content: value,
        version: (monacoRef.current?.getModel()?.getVersionId() || 0),
      });
      markDirty(activeTab.path, value !== getOriginalContent(activeTab.path));
    });

    setIsInitialized(true);
    setIsLoading(false);

    return () => {
      editor.dispose();
      monacoRef.current = null;
    };
  }, [editorRef.current]);

  useEffect(() => {
    if (!monacoRef.current || !activeTab) return;

    const editor = monacoRef.current;
    const model = editor.getModel();
    const doc = useTabsStore.getState().documents.get(activeTab.path);

    if (model && doc) {
      monaco.editor.setModelLanguage(model, doc.languageId || "plaintext");
    }

    if (doc) {
      editor.setValue(doc.content);
    }
  }, [activeTab?.id]);

  useEffect(() => {
    if (!monacoRef.current) return;

    monacoRef.current.updateOptions({
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      tabSize: config.tabSize,
      insertSpaces: config.insertSpaces,
      wordWrap: config.wordWrap === "on" ? "on" : "off",
      minimap: { enabled: config.minimap.enabled },
    });
  }, [config]);

  function getOriginalContent(path: string): string {
    const doc = useTabsStore.getState().documents.get(path);
    return doc?.originalContent || "";
  }

  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center bg-editor">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">No file open</p>
          <p className="text-muted-foreground/60 text-xs mt-2">Select a file from the explorer</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full p-4 space-y-3 bg-editor">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  return <div ref={editorRef} className="h-full w-full bg-editor" />;
}
