import { useEffect, useState } from "react";
import { useGitStore } from "../../stores/git.store";
import { useWorkspaceStore } from "../../stores/workspace";
import type { FileStatusEntry } from "@procode/types";
import { FileIcon, PlusIcon, XIcon, ChevronRightIcon, ChevronDownIcon, SourceControlIcon } from "../shared/icons";
import { Button, Textarea, Badge, Separator, ScrollArea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Skeleton } from "../ui";
import { trpc } from "../../lib/trpc";
import { cn } from "../../lib/utils";

interface SourceControlProps {}

export function SourceControl({}: SourceControlProps) {
  const { rootPath } = useWorkspaceStore();
  const {
    status,
    commitMessage,
    isLoading,
    error,
    refreshStatus,
    stageFiles,
    unstageFiles,
    discardChanges,
    setCommitMessage,
    commit,
  } = useGitStore();

  const [showStaged, setShowStaged] = useState(true);
  const [showUnstaged, setShowUnstaged] = useState(true);
  const [discardTarget, setDiscardTarget] = useState<string | null>(null);
  const [hasGitRepo, setHasGitRepo] = useState<boolean | null>(null);
  const [isIniting, setIsIniting] = useState(false);

  useEffect(() => {
    if (rootPath) {
      checkGitRepo();
    }
  }, [rootPath]);

  const checkGitRepo = async () => {
    try {
      const isRepo = await trpc.git.isGitRepo();
      setHasGitRepo(isRepo);
      if (isRepo) {
        refreshStatus();
      }
    } catch {
      setHasGitRepo(false);
    }
  };

  const handleInit = async () => {
    setIsIniting(true);
    try {
      await trpc.git.init();
      setHasGitRepo(true);
      refreshStatus();
    } catch (err) {
      console.error("Failed to init git:", err);
    } finally {
      setIsIniting(false);
    }
  };

  const handleStage = async (path: string) => {
    await stageFiles([path]);
  };

  const handleUnstage = async (path: string) => {
    await unstageFiles([path]);
  };

  const handleDiscard = async (path: string) => {
    await discardChanges([path]);
    setDiscardTarget(null);
  };

  const handleCommit = async () => {
    await commit();
  };

  const stagedFiles = status?.files.filter((f) => f.staged) ?? [];
  const unstagedFiles = status?.files.filter((f) => !f.staged) ?? [];

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "modified": return "M";
      case "added": return "A";
      case "deleted": return "D";
      case "untracked": return "U";
      case "renamed": return "R";
      case "conflict": return "C";
      default: return "?";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "modified": return "text-yellow-400";
      case "added": return "text-green-400";
      case "deleted": return "text-red-400";
      case "untracked": return "text-blue-400";
      case "renamed": return "text-purple-400";
      case "conflict": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const renderFileEntry = (file: FileStatusEntry, isStaged: boolean) => {
    const fileName = file.path.split("/").pop() || file.path;
    const dirPath = file.path.split("/").slice(0, -1).join("/");

    return (
      <div
        key={file.path}
        className="flex items-center py-1 px-2 hover:bg-sidebar-accent/50 group"
      >
        <FileIcon className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">{fileName}</div>
          {dirPath && (
            <div className="text-xs text-muted-foreground truncate">{dirPath}</div>
          )}
        </div>
        <span className={cn("text-xs font-mono mr-2", getStatusColor(file.status))}>
          {getStatusIndicator(file.status)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isStaged ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={() => handleUnstage(file.path)}
              title="Unstage"
            >
              <XIcon className="w-3 h-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={() => handleStage(file.path)}
              title="Stage"
            >
              <PlusIcon className="w-3 h-3" />
            </Button>
          )}
          {!isStaged && file.status !== "untracked" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
              onClick={() => setDiscardTarget(file.path)}
              title="Discard"
            >
              <XIcon className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (!rootPath) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">No workspace open</div>
      </div>
    );
  }

  if (!rootPath) {
    return (
      <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
        <SourceControlIcon className="w-8 h-8 text-muted-foreground mb-3" />
        <div className="text-xs text-muted-foreground">Open a folder to use source control</div>
      </div>
    );
  }

  if (hasGitRepo === false) {
    return (
      <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
        <SourceControlIcon className="w-8 h-8 text-muted-foreground mb-3" />
        <div className="text-xs text-muted-foreground mb-4">No git repository found</div>
        <Button onClick={handleInit} disabled={isIniting} size="compact" variant="outline">
          {isIniting ? "Initializing..." : "Initialize Repository"}
        </Button>
      </div>
    );
  }

  if (isLoading && !status) {
    return (
      <div className="p-3 space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Commit message input */}
      <div className="p-2 border-b border-sidebar-border">
        <Textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message"
          className="w-full bg-sidebar-accent/50 border-border resize-none text-sm"
          rows={3}
        />
        <div className="flex items-center gap-2 mt-2">
          <Button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || isLoading}
            className="flex-1"
            size="compact"
          >
            {isLoading ? "Committing..." : "Commit"}
          </Button>
        </div>
        {error && (
          <div className="text-xs text-red-400 mt-1">{error}</div>
        )}
      </div>

      {/* File lists */}
      <ScrollArea className="flex-1">
        {/* Staged changes */}
        {stagedFiles.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="compact"
              onClick={() => setShowStaged(!showStaged)}
              className="w-full justify-start px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {showStaged ? (
                <ChevronDownIcon className="w-3 h-3 mr-1" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 mr-1" />
              )}
              Staged Changes ({stagedFiles.length})
            </Button>
            {showStaged && (
              <div>
                {stagedFiles.map((file) => renderFileEntry(file, true))}
              </div>
            )}
            <Separator className="my-1" />
          </div>
        )}

        {/* Unstaged changes */}
        {unstagedFiles.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="compact"
              onClick={() => setShowUnstaged(!showUnstaged)}
              className="w-full justify-start px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {showUnstaged ? (
                <ChevronDownIcon className="w-3 h-3 mr-1" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 mr-1" />
              )}
              Changes ({unstagedFiles.length})
            </Button>
            {showUnstaged && (
              <div>
                {unstagedFiles.map((file) => renderFileEntry(file, false))}
              </div>
            )}
          </div>
        )}

        {/* No changes */}
        {stagedFiles.length === 0 && unstagedFiles.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">No changes</div>
          </div>
        )}
      </ScrollArea>

      {/* Discard confirmation dialog */}
      <Dialog open={!!discardTarget} onOpenChange={() => setDiscardTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Changes?</DialogTitle>
            <DialogDescription>
              This will permanently discard changes to{" "}
              <span className="text-foreground">{discardTarget}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscardTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => discardTarget && handleDiscard(discardTarget)}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
