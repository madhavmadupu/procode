import { useTabsStore } from "../../stores/tabs";
import { useWorkspaceStore } from "../../stores/workspace";
import { ChevronRightIcon } from "./icons";

export function Breadcrumbs() {
  const { activeTabId, tabs } = useTabsStore();
  const { rootPath } = useWorkspaceStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab || !rootPath) {
    return (
      <div className="h-6 flex items-center px-4 border-b border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500">
        No file open
      </div>
    );
  }

  const relativePath = activeTab.path.replace(rootPath, "").replace(/^\//, "");
  const parts = relativePath.split("/");

  return (
    <div className="h-6 flex items-center px-4 border-b border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 overflow-x-auto">
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        const pathSoFar = rootPath + "/" + parts.slice(0, index + 1).join("/");

        return (
          <div key={pathSoFar} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="w-3 h-3 mx-1 text-zinc-600" />
            )}
            <span
              className={`hover:text-zinc-200 cursor-pointer transition-colors ${
                isLast ? "text-zinc-200 font-medium" : ""
              }`}
              title={pathSoFar}
            >
              {part}
            </span>
          </div>
        );
      })}
    </div>
  );
}
