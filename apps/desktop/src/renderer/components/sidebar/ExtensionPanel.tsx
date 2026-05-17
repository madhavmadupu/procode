import { useEffect, useState } from "react";
import { useExtensionStore } from "../../stores/extension.store";

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

  const formatDownloads = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-100 mb-2">Extensions</h2>
        <input
          type="text"
          placeholder="Search Extensions in Marketplace..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === "marketplace"
              ? "text-zinc-100 border-b-2 border-blue-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab("installed")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === "installed"
              ? "text-zinc-100 border-b-2 border-blue-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Installed ({extensions.length})
        </button>
      </div>

      {/* Extension List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "marketplace" ? (
          filteredMarket.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-xs">
              No extensions found matching "{searchQuery}"
            </div>
          ) : (
            filteredMarket.map((ext) => (
              <div
                key={ext.name}
                className="flex items-start gap-3 p-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-300">
                  {ext.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-100 truncate">
                      {ext.displayName}
                    </h3>
                    <button
                      onClick={() =>
                        ext.installed
                          ? deactivateExtension(ext.name)
                          : activateExtension(ext.name)
                      }
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        ext.installed
                          ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {ext.installed ? "Uninstall" : "Install"}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                    {ext.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600">
                    <span>{ext.publisher}</span>
                    <span>⭐ {ext.rating}</span>
                    <span>{formatDownloads(ext.downloads)} downloads</span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : installedExtensions.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 text-xs">
            No extensions installed
          </div>
        ) : (
          installedExtensions.map((ext) => (
            <div
              key={ext.name}
              className="flex items-start gap-3 p-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-300">
                {ext.displayName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-100 truncate">
                    {ext.displayName}
                  </h3>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-600/20 text-green-400">
                    Installed
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">v{ext.version}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
