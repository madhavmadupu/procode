import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { useTabsStore } from "../../stores/tabs";
import { useEditorStore } from "../../stores/editor";
import { useWorkspaceStore } from "../../stores/workspace";

export function EditorPanel() {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { activeTabId, tabs, updateDocument, markDirty } = useTabsStore();
  const { config } = useEditorStore();
  const { rootPath } = useWorkspaceStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);

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

    return () => {
      editor.dispose();
      monacoRef.current = null;
    };
  }, [editorRef.current]);

  useEffect(() => {
    if (!monacoRef.current || !activeTab) return;

    const editor = monacoRef.current;
    const model = editor.getModel();

    if (model) {
      monaco.editor.setModelLanguage(model, activeTab.languageId || "plaintext");
    }

    const doc = useTabsStore.getState().documents.get(activeTab.path);
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
      <div className="h-full flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-500 text-sm">No file open</p>
          <p className="text-zinc-600 text-xs mt-2">Select a file from the explorer</p>
        </div>
      </div>
    );
  }

  return <div ref={editorRef} className="h-full w-full" />;
}
