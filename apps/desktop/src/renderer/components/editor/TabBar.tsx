import { useTabsStore } from "../../stores/tabs";
import { FileIcon } from "../shared/icons";

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabsStore();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center min-w-0 max-w-48 px-3 py-2 border-r border-zinc-800 cursor-pointer ${
            tab.id === activeTabId
              ? "bg-zinc-950 text-zinc-100"
              : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <FileIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm truncate">{tab.name}</span>
          {tab.isDirty && <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" />}
          <button
            className="ml-2 p-0.5 rounded hover:bg-zinc-700 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
