import { useState } from "react";
import { trpc } from "../../lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  Button,
  Input,
  Label,
} from "../ui";

interface OpenFolderDialogProps {
  onOpen: (path: string) => void;
  onClose: () => void;
}

export function OpenFolderDialog({ onOpen, onClose }: OpenFolderDialogProps) {
  const [path, setPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPath = path.trim();
    if (!trimmedPath) {
      setError("Please enter a folder path");
      return;
    }

    setIsLoading(true);
    try {
      const response = await trpc.fileSystem.openFolder(trimmedPath);

      if (response.success) {
        onOpen(trimmedPath);
      } else {
        setError(response.error || "Failed to open folder");
      }
    } catch (err) {
      setError("Failed to connect to file system service");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open Folder</DialogTitle>
          <DialogDescription>
            Enter the path to your workspace folder
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="folder-path">Workspace Path</Label>
            <Input
              id="folder-path"
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="e.g. C:\Users\Documents\Project"
              className="bg-sidebar-accent/50 border-border"
              autoFocus
            />
            {error && (
              <p className="text-xs font-semibold text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Opening..." : "Open Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
