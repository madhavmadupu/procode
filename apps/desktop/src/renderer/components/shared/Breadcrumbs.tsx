import { useTabsStore } from "../../stores/tabs";
import { useWorkspaceStore } from "../../stores/workspace";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui";

export function Breadcrumbs() {
  const { activeTabId, tabs } = useTabsStore();
  const { rootPath } = useWorkspaceStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab || !rootPath) {
    return (
      <div className="h-6 flex items-center px-4 border-b border-border bg-muted/30 text-xs text-muted-foreground">
        No file open
      </div>
    );
  }

  const relativePath = activeTab.path.replace(rootPath, "").replace(/^\//, "");
  const parts = relativePath.split("/");

  return (
    <div className="h-6 flex items-center px-4 border-b border-border bg-muted/30 overflow-x-auto">
      <Breadcrumb>
        <BreadcrumbList>
          {parts.map((part, index) => {
            const isLast = index === parts.length - 1;
            const pathSoFar = rootPath + "/" + parts.slice(0, index + 1).join("/");

            return (
              <span key={pathSoFar} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator />}
                {isLast ? (
                  <BreadcrumbPage className="text-xs">{part}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href="#"
                    className="text-xs hover:text-foreground transition-colors"
                    title={pathSoFar}
                  >
                    {part}
                  </BreadcrumbLink>
                )}
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
