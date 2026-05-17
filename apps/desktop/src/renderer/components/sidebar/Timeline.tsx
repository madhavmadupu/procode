import { useEffect, useState } from "react";
import { useGitStore } from "../../stores/git.store";
import { useWorkspaceStore } from "../../stores/workspace";
import type { CommitInfo } from "@procode/types";
import { ClockIcon } from "../shared/icons";
import { ScrollArea, Separator } from "../ui";
import { cn } from "../../lib/utils";

interface TimelineProps {}

export function Timeline({}: TimelineProps) {
  const { rootPath } = useWorkspaceStore();
  const { getLog } = useGitStore();
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rootPath) {
      loadCommits();
    }
  }, [rootPath]);

  const loadCommits = async () => {
    setLoading(true);
    try {
      const log = await getLog(50);
      setCommits(log);
    } catch (error) {
      console.error("Failed to load commits:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Timeline</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {commits.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">No commits yet</div>
          </div>
        ) : (
          <div className="py-2">
            {commits.map((commit, index) => (
              <div key={commit.hash}>
                <div
                  className="flex gap-3 px-3 py-2 hover:bg-sidebar-accent/50 cursor-pointer transition-colors"
                >
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    {index < commits.length - 1 && (
                      <div className="w-px h-full bg-border mt-1" />
                    )}
                  </div>

                  {/* Commit info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">
                      {commit.message}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {commit.author}
                      </span>
                      <span className="text-xs text-muted-foreground/60">•</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {commit.shortHash}
                      </span>
                      <span className="text-xs text-muted-foreground/60">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(commit.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                {index < commits.length - 1 && <Separator className="mx-3" />}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
