import { useEffect, useState } from "react";
import { useExtensionStore } from "../../stores/extension.store";
import {
  ScrollArea,
  Input,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../ui";
import { SearchIcon, DownloadIcon, StarIcon } from "lucide-react";

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
}

const MOCK_MARKETPLACE: MarketplaceExtension[] = [
  {
    name: "procode-python",
    displayName: "Python",
    version: "2024.1.0",
    description: "Python language support with IntelliSense, linting, and debugging",
    publisher: "ProCode",
    downloads: 1250000,
    rating: 4.8,
    installed: false,
  },
  {
    name: "procode-rust",
    displayName: "Rust",
    version: "0.12.0",
    description: "Rich language support for Rust with rust-analyzer integration",
    publisher: "ProCode",
    downloads: 890000,
    rating: 4.9,
    installed: false,
  },
  {
    name: "procode-prettier",
    displayName: "Prettier",
    version: "1.0.0",
    description: "Code formatter using Prettier",
    publisher: "ProCode",
    downloads: 2100000,
    rating: 4.7,
    installed: false,
  },
  {
    name: "procode-eslint",
    displayName: "ESLint",
    version: "2.4.0",
    description: "Integrates ESLint into ProCode",
    publisher: "ProCode",
    downloads: 1800000,
    rating: 4.6,
    installed: false,
  },
  {
    name: "procode-gitlens",
    displayName: "GitLens",
    version: "14.0.0",
    description: "Supercharge Git within ProCode with blame annotations and code lens",
    publisher: "ProCode",
    downloads: 3200000,
    rating: 4.9,
    installed: false,
  },
  {
    name: "procode-docker",
    displayName: "Docker",
    version: "1.29.0",
    description: "Build, manage, and deploy containerized applications",
    publisher: "ProCode",
    downloads: 1500000,
    rating: 4.5,
    installed: false,
  },
];

export function ExtensionPanel() {
  const { extensions, loadExtensions, activateExtension, deactivateExtension } = useExtensionStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"marketplace" | "installed">("marketplace");

  useEffect(() => {
    loadExtensions();
  }, [loadExtensions]);

  const installedNames = new Set(extensions.map((e) => e.name));
  const marketplace = MOCK_MARKETPLACE.map((ext) => ({
    ...ext,
    installed: installedNames.has(ext.name),
  }));

  const filteredMarket = marketplace.filter(
    (ext) =>
      ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const installedExtensions = marketplace.filter((ext) => ext.installed);

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-foreground mb-2">Extensions</h2>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search Marketplace..."
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
            <TabsTrigger value="marketplace" className="text-[10px] h-6">
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="installed" className="text-[10px] h-6">
              Installed ({extensions.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
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
                    isInstalled={installedNames.has(ext.name)}
                    onAction={() =>
                      ext.installed
                        ? deactivateExtension(ext.name)
                        : activateExtension(ext.name)
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="installed" className="m-0 p-0">
            {installedExtensions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs italic">
                No extensions installed
              </div>
            ) : (
              <div className="flex flex-col">
                {installedExtensions.map((ext) => (
                  <ExtensionItem
                    key={ext.name}
                    ext={ext}
                    isInstalled={true}
                    onAction={() => deactivateExtension(ext.name)}
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

function ExtensionItem({
  ext,
  isInstalled,
  onAction,
}: {
  ext: MarketplaceExtension;
  isInstalled: boolean;
  onAction: () => void;
}) {
  const formatDownloads = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <div className="group flex items-start gap-3 p-3 border-b border-sidebar-border hover:bg-sidebar-accent/30 transition-all cursor-default">
      <Avatar className="h-10 w-10 rounded-md border border-border bg-muted">
        <AvatarImage src={ext.icon} />
        <AvatarFallback className="rounded-md text-muted-foreground font-bold">
          {ext.displayName[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-blue-400 transition-colors">
            {ext.displayName}
          </h3>
          <Button
            size="sm"
            variant={isInstalled ? "secondary" : "default"}
            className="h-7 px-3 text-[10px] font-bold"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
          >
            {isInstalled ? "Uninstall" : "Install"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {ext.description}
        </p>

        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/70">
          <span className="font-medium text-muted-foreground">
            {ext.publisher}
          </span>
          <div className="flex items-center gap-1">
            <StarIcon className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
            <span>{ext.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <DownloadIcon className="h-2.5 w-2.5" />
            <span>{formatDownloads(ext.downloads)}</span>
          </div>
          {isInstalled && (
            <Badge
              variant="outline"
              className="h-4 px-1.5 py-0 text-[8px] border-green-500/50 text-green-500 bg-green-500/5 uppercase font-black"
            >
              Installed
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExtensionPanel;
