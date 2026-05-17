import { useEffect, useState } from "react";
import { useExtensionStore } from "../../stores/extension.store";
import {
  ScrollArea,
  Input,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Separator,
} from "../ui";
import { SearchIcon, FolderIcon, ArrowLeftIcon, TrashIcon, DownloadIcon, StarIcon } from "../shared/icons";

interface MarketplaceExtension {
  name: string;
  displayName: string;
  version: string;
  description: string;
  publisher: string;
  downloads: number;
  rating: number;
  icon?: string;
  installed: boolean;
  enabled: boolean;
}

const MOCK_MARKETPLACE: Omit<MarketplaceExtension, "installed" | "enabled">[] = [
  {
    name: "procode-python",
    displayName: "Python",
    version: "2024.1.0",
    description: "Python language support with IntelliSense, linting, and debugging",
    publisher: "ProCode",
    downloads: 1250000,
    rating: 4.8,
  },
  {
    name: "procode-rust",
    displayName: "Rust",
    version: "0.12.0",
    description: "Rich language support for Rust with rust-analyzer integration",
    publisher: "ProCode",
    downloads: 890000,
    rating: 4.9,
  },
  {
    name: "procode-prettier",
    displayName: "Prettier",
    version: "1.0.0",
    description: "Code formatter using Prettier",
    publisher: "ProCode",
    downloads: 2100000,
    rating: 4.7,
  },
];

export function ExtensionPanel() {
  const { extensions, loadExtensions, activateExtension, deactivateExtension } = useExtensionStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"marketplace" | "installed">("installed");
  const [selectedExt, setSelectedExt] = useState<MarketplaceExtension | null>(null);

  useEffect(() => {
    loadExtensions();
  }, [loadExtensions]);

  const installedNames = new Set(extensions.map((e) => e.name));
  const installedData = extensions.map(e => ({
    name: e.name,
    displayName: e.displayName || e.name,
    version: e.version,
    description: e.description || "",
    publisher: "procode",
    downloads: 0,
    rating: 0,
    installed: true,
    enabled: e.isActive ?? true,
  }));

  const marketplace = MOCK_MARKETPLACE.map((ext) => ({
    ...ext,
    installed: installedNames.has(ext.name),
    enabled: true,
  }));

  const filteredMarket = marketplace.filter(
    (ext) =>
      ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInstalled = installedData.filter(
    (ext) =>
      ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleEnabled = (name: string, enabled: boolean) => {
    if (enabled) {
      activateExtension(name);
    } else {
      deactivateExtension(name);
    }
  };

  if (selectedExt) {
    return (
      <ExtensionDetail
        ext={selectedExt}
        onBack={() => setSelectedExt(null)}
        onToggleEnabled={handleToggleEnabled}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-foreground mb-2">Extensions</h2>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-sidebar-accent/50 border-border"
          />
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "marketplace" | "installed")}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-3 py-1 border-b border-sidebar-border bg-sidebar">
          <TabsList className="grid w-full grid-cols-2 h-8 bg-sidebar-accent/50">
            <TabsTrigger value="installed" className="text-[10px] h-6">
              Installed ({installedData.length})
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="text-[10px] h-6">
              Marketplace
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="installed" className="m-0 p-0">
            {filteredInstalled.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No extensions installed
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredInstalled.map((ext) => (
                  <ExtensionItem
                    key={ext.name}
                    ext={ext}
                    onClick={() => setSelectedExt(ext)}
                    onToggleEnabled={(enabled) => handleToggleEnabled(ext.name, enabled)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="marketplace" className="m-0 p-0">
            {filteredMarket.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs italic">
                No extensions found
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredMarket.map((ext) => (
                  <ExtensionItem
                    key={ext.name}
                    ext={ext}
                    onClick={() => setSelectedExt(ext)}
                    onToggleEnabled={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function ExtensionDetail({
  ext,
  onBack,
  onToggleEnabled,
}: {
  ext: MarketplaceExtension;
  onBack: () => void;
  onToggleEnabled: (name: string, enabled: boolean) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-sidebar-border">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onBack}>
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">{ext.displayName}</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-12 w-12 rounded-md border border-border bg-muted">
              <AvatarFallback className="rounded-md text-muted-foreground font-bold text-lg">
                {ext.displayName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground">{ext.displayName}</h3>
              <p className="text-xs text-muted-foreground">
                v{ext.version} · {ext.publisher}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{ext.description}</p>

          <div className="flex items-center gap-2 mb-4">
            <Button
              size="compact"
              variant={ext.enabled ? "outline" : "default"}
              onClick={() => onToggleEnabled(ext.name, !ext.enabled)}
            >
              {ext.enabled ? "Disable" : "Enable"}
            </Button>
            {ext.installed && (
              <Button size="compact" variant="destructive">
                <TrashIcon className="w-3 h-3 mr-1" />
                Uninstall
              </Button>
            )}
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Publisher</span>
              <span className="text-foreground">{ext.publisher}</span>
              <span className="text-muted-foreground">Version</span>
              <span className="text-foreground">{ext.version}</span>
              {ext.downloads > 0 && (
                <>
                  <span className="text-muted-foreground">Downloads</span>
                  <span className="text-foreground">{ext.downloads.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function ExtensionItem({
  ext,
  onClick,
  onToggleEnabled,
}: {
  ext: MarketplaceExtension;
  onClick: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}) {
  const formatDownloads = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <div
      className="group flex items-start gap-3 p-3 border-b border-sidebar-border hover:bg-sidebar-accent/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <Avatar className="h-10 w-10 rounded-md border border-border bg-muted flex-shrink-0">
        <AvatarFallback className="rounded-md text-muted-foreground font-bold">
          {ext.displayName[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-blue-400 transition-colors">
            {ext.displayName}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {ext.installed && (
              <Switch
                checked={ext.enabled}
                onCheckedChange={onToggleEnabled}
                className="scale-75"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {!ext.installed && (
              <Button
                size="sm"
                variant="default"
                className="h-7 px-3 text-[10px] font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Install
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {ext.description}
        </p>

        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/70">
          <span className="font-medium text-muted-foreground">{ext.publisher}</span>
          {ext.rating > 0 && (
            <div className="flex items-center gap-1">
              <StarIcon className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
              <span>{ext.rating}</span>
            </div>
          )}
          {ext.downloads > 0 && (
            <div className="flex items-center gap-1">
              <DownloadIcon className="h-2.5 w-2.5" />
              <span>{formatDownloads(ext.downloads)}</span>
            </div>
          )}
          <span className="text-muted-foreground">v{ext.version}</span>
        </div>
      </div>
    </div>
  );
}

export default ExtensionPanel;
