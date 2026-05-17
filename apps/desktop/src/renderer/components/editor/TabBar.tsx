import { useTabsStore } from "../../stores/tabs";
import { FileIcon, XIcon } from "lucide-react";
import { Button, ScrollArea } from "../ui";
import { cn } from "../../lib/utils";

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabsStore();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex items-center bg-tab-inactive border-b border-tab-border h-9">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center min-w-[120px] max-w-[200px] h-full px-3 border-r border-tab-border cursor-pointer transition-all",
              tab.id === activeTabId
                ? "bg-tab-active text-foreground border-b-2 border-b-blue-500"
                : "bg-tab-inactive text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
            )}
            onClick={() => setActiveTab(tab.id)}
            title={tab.path}
          >
            <FileIcon className="w-3.5 h-3.5 mr-2 flex-shrink-0 opacity-70 group-hover:opacity-100" />
            <span className="text-[11px] font-medium truncate flex-1">{tab.name}</span>
            
            <div className="flex items-center ml-2 gap-1.5">
              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 rounded-sm transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <XIcon className="w-2.5 h-2.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
