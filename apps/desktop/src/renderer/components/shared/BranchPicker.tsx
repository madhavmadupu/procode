import { useState } from "react";
import { useGitStore } from "../../stores/git.store";
import { BranchIcon, XIcon, PlusIcon } from "../shared/icons";

interface BranchPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BranchPicker({ isOpen, onClose }: BranchPickerProps) {
  const { branches, currentBranch, checkoutBranch, createBranch, deleteBranch } =
    useGitStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [baseBranch, setBaseBranch] = useState(currentBranch || "");

  if (!isOpen) return null;

  const localBranches = branches.filter((b) => !b.isRemote);
  const remoteBranches = branches.filter((b) => b.isRemote);

  const handleCheckout = async (name: string) => {
    await checkoutBranch(name);
    onClose();
  };

  const handleCreate = async () => {
    if (!newBranchName.trim()) return;
    await createBranch(newBranchName, baseBranch || undefined);
    setNewBranchName("");
    setShowCreateModal(false);
    onClose();
  };

  const handleDelete = async (name: string) => {
    if (name === currentBranch) return;
    await deleteBranch(name, false);
  };

  return (
    <>
      {/* Branch picker dropdown */}
      <div className="absolute bottom-8 left-2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
          <span className="text-sm font-medium">Branches</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded"
          >
            <XIcon className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {/* Local branches */}
          {localBranches.map((branch) => (
            <div
              key={branch.name}
              className="flex items-center justify-between px-3 py-2 hover:bg-zinc-800 cursor-pointer group"
              onClick={() => handleCheckout(branch.name)}
            >
              <div className="flex items-center gap-2">
                <BranchIcon className="w-4 h-4 text-zinc-400" />
                <span className="text-sm">{branch.name}</span>
              </div>
              {branch.isCurrent && (
                <span className="text-xs text-blue-400">current</span>
              )}
              {!branch.isCurrent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(branch.name);
                  }}
                  className="p-1 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XIcon className="w-3 h-3 text-zinc-500" />
                </button>
              )}
            </div>
          ))}

          {/* Remote branches */}
          {remoteBranches.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wide border-t border-zinc-800">
                Remote
              </div>
              {remoteBranches.map((branch) => (
                <div
                  key={branch.name}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 cursor-pointer"
                  onClick={() => handleCheckout(branch.name)}
                >
                  <BranchIcon className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-400">{branch.name}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Create new branch */}
        <div className="border-t border-zinc-800">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-zinc-800 text-sm text-blue-400"
          >
            <PlusIcon className="w-4 h-4" />
            Create new branch
          </button>
        </div>
      </div>

      {/* Create branch modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 w-80">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">
              Create Branch
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Branch name
                </label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="feature/my-branch"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Base branch
                </label>
                <select
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {localBranches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm py-1 px-3 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newBranchName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm py-1 px-3 rounded transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
