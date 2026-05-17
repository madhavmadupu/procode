import { useEffect, useState } from "react";
import { useGitStore } from "../../stores/git.store";
import { useWorkspaceStore } from "../../stores/workspace";
import type { FileStatusEntry } from "@procode/types";
import {
  FileIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "../shared/icons";

interface SourceControlProps {
  // Props can be added later if needed
}

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
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (rootPath) {
      refreshStatus();
    }
  }, [rootPath]);

  const handleStage = async (path: string) => {
    await stageFiles([path]);
  };

  const handleUnstage = async (path: string) => {
    await unstageFiles([path]);
  };

  const handleDiscard = async (path: string) => {
    await discardChanges([path]);
    setShowDiscardConfirm(null);
  };

  const handleCommit = async () => {
    await commit();
  };

  const stagedFiles = status?.files.filter((f) => f.staged) ?? [];
  const unstagedFiles = status?.files.filter((f) => !f.staged) ?? [];

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "modified":
        return "M";
      case "added":
        return "A";
      case "deleted":
        return "D";
      case "untracked":
        return "U";
      case "renamed":
        return "R";
      case "conflict":
        return "C";
      default:
        return "?";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "modified":
        return "text-yellow-400";
      case "added":
        return "text-green-400";
      case "deleted":
        return "text-red-400";
      case "untracked":
        return "text-blue-400";
      case "renamed":
        return "text-purple-400";
      case "conflict":
        return "text-red-500";
      default:
        return "text-zinc-400";
    }
  };

  const renderFileEntry = (file: FileStatusEntry, isStaged: boolean) => {
    const fileName = file.path.split("/").pop() || file.path;
    const dirPath = file.path.split("/").slice(0, -1).join("/");

    return (
      <div
        key={file.path}
        className="flex items-center py-1 px-2 hover:bg-zinc-800 group"
      >
        <FileIcon className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">{fileName}</div>
          {dirPath && (
            <div className="text-xs text-zinc-500 truncate">{dirPath}</div>
          )}
        </div>
        <span className={`text-xs font-mono mr-2 ${getStatusColor(file.status)}`}>
          {getStatusIndicator(file.status)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isStaged ? (
            <button
              onClick={() => handleUnstage(file.path)}
              className="p-1 hover:bg-zinc-700 rounded"
              title="Unstage"
            >
              <XIcon className="w-3 h-3 text-zinc-400" />
            </button>
          ) : (
            <button
              onClick={() => handleStage(file.path)}
              className="p-1 hover:bg-zinc-700 rounded"
              title="Stage"
            >
              <PlusIcon className="w-3 h-3 text-zinc-400" />
            </button>
          )}
          {!isStaged && file.status !== "untracked" && (
            <button
              onClick={() => setShowDiscardConfirm(file.path)}
              className="p-1 hover:bg-zinc-700 rounded"
              title="Discard"
            >
              <XIcon className="w-3 h-3 text-red-400" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!rootPath) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-zinc-500">No workspace open</div>
      </div>
    );
  }

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Commit message input */}
      <div className="p-2 border-b border-zinc-800">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message"
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500"
          rows={3}
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm py-1 px-3 rounded transition-colors"
          >
            {isLoading ? "Committing..." : "Commit"}
          </button>
        </div>
        {error && (
          <div className="text-xs text-red-400 mt-1">{error}</div>
        )}
      </div>

      {/* File lists */}
      <div className="flex-1 overflow-y-auto">
        {/* Staged changes */}
        {stagedFiles.length > 0 && (
          <div>
            <button
              onClick={() => setShowStaged(!showStaged)}
              className="flex items-center w-full px-2 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wide hover:bg-zinc-800"
            >
              {showStaged ? (
                <ChevronDownIcon className="w-3 h-3 mr-1" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 mr-1" />
              )}
              Staged Changes ({stagedFiles.length})
            </button>
            {showStaged && (
              <div>
                {stagedFiles.map((file) => renderFileEntry(file, true))}
              </div>
            )}
          </div>
        )}

        {/* Unstaged changes */}
        {unstagedFiles.length > 0 && (
          <div>
            <button
              onClick={() => setShowUnstaged(!showUnstaged)}
              className="flex items-center w-full px-2 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wide hover:bg-zinc-800"
            >
              {showUnstaged ? (
                <ChevronDownIcon className="w-3 h-3 mr-1" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 mr-1" />
              )}
              Changes ({unstagedFiles.length})
            </button>
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
            <div className="text-sm text-zinc-500">No changes</div>
          </div>
        )}
      </div>

      {/* Discard confirmation */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 max-w-sm">
            <h3 className="text-sm font-semibold text-zinc-100 mb-2">
              Discard Changes?
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              This will permanently discard changes to{" "}
              <span className="text-zinc-200">{showDiscardConfirm}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDiscardConfirm(null)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm py-1 px-3 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDiscard(showDiscardConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
