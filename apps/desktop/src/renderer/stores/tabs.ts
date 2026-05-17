import { create } from "zustand";
import type { Tab, DocumentState } from "@procode/types";

interface TabsStore {
  tabs: Tab[];
  documents: Map<string, DocumentState>;
  activeTabId: string | null;
  openTab: (tab: Tab, document: DocumentState) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateDocument: (path: string, updates: Partial<DocumentState>) => void;
  markDirty: (path: string, isDirty: boolean) => void;
  getActiveDocument: () => DocumentState | null;
  clearAll: () => void;
}

export const useTabsStore = create<TabsStore>((set, get) => ({
  tabs: [],
  documents: new Map(),
  activeTabId: null,
  openTab: (tab, document) => {
    const { tabs, documents } = get();
    const existingTab = tabs.find((t) => t.path === tab.path);

    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    const newTabs = [...tabs.map((t) => ({ ...t, isActive: false })), { ...tab, isActive: true }];
    const newDocuments = new Map(documents);
    newDocuments.set(document.path, document);

    set({ tabs: newTabs, documents: newDocuments, activeTabId: tab.id });
  },
  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];
    const newTabs = tabs.filter((t) => t.id !== tabId);

    if (tabId === activeTabId) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      const newActiveTab = newTabs[newActiveIndex];
      if (newActiveTab) {
        newActiveTab.isActive = true;
        set({ tabs: newTabs, activeTabId: newActiveTab.id });
      } else {
        set({ tabs: newTabs, activeTabId: null });
      }
    } else {
      set({ tabs: newTabs });
    }
  },
  setActiveTab: (tabId) => {
    const { tabs } = get();
    const newTabs = tabs.map((t) => ({
      ...t,
      isActive: t.id === tabId,
    }));
    set({ tabs: newTabs, activeTabId: tabId });
  },
  updateDocument: (path, updates) => {
    const { documents } = get();
    const doc = documents.get(path);
    if (!doc) return;

    const newDocuments = new Map(documents);
    newDocuments.set(path, { ...doc, ...updates });
    set({ documents: newDocuments });
  },
  markDirty: (path, isDirty) => {
    const { documents, tabs } = get();
    const doc = documents.get(path);
    if (!doc) return;

    const newDocuments = new Map(documents);
    newDocuments.set(path, { ...doc, isDirty });

    const newTabs = tabs.map((t) =>
      t.path === path ? { ...t, isDirty } : t,
    );

    set({ documents: newDocuments, tabs: newTabs });
  },
  getActiveDocument: () => {
    const { activeTabId, tabs, documents } = get();
    if (!activeTabId) return null;

    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return null;

    return documents.get(tab.path) || null;
  },
  clearAll: () => set({ tabs: [], documents: new Map(), activeTabId: null }),
}));
