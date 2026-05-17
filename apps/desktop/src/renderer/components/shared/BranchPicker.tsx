import { useState } from "react";
import { useGitStore } from "../../stores/git.store";
import { BranchIcon, XIcon, PlusIcon } from "../shared/icons";
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Popover, PopoverContent, PopoverTrigger } from "../ui";
import { cn } from "../../lib/utils";

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
      {/* Branch picker popover */}
      <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <PopoverTrigger asChild>
          <div className="fixed inset-0 z-modal" />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" side="top" align="start" sideOffset={8}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-sm font-medium">Branches</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <XIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {/* Local branches */}
            {localBranches.map((branch) => (
              <div
                key={branch.name}
                className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer group"
                onClick={() => handleCheckout(branch.name)}
              >
                <div className="flex items-center gap-2">
                  <BranchIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{branch.name}</span>
                </div>
                {branch.isCurrent && (
                  <span className="text-xs text-blue-400">current</span>
                )}
                {!branch.isCurrent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(branch.name);
                    }}
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XIcon className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}

            {/* Remote branches */}
            {remoteBranches.length > 0 && (
              <>
                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t border-border">
                  Remote
                </div>
                {remoteBranches.map((branch) => (
                  <div
                    key={branch.name}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => handleCheckout(branch.name)}
                  >
                    <BranchIcon className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-sm text-muted-foreground">{branch.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Create new branch */}
          <div className="border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(true)}
              className="w-full justify-start text-blue-400"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create new branch
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Create branch dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Branch</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="branch-name">Branch name</Label>
              <Input
                id="branch-name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="feature/my-branch"
                className="mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="base-branch">Base branch</Label>
              <select
                id="base-branch"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
              >
                {localBranches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newBranchName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
