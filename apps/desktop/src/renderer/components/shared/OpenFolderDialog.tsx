import { useState } from "react";
import { trpc } from "../../lib/trpc";

interface OpenFolderDialogProps {
  onOpen: (path: string) => void;
  onClose: () => void;
}

export function OpenFolderDialog({ onOpen, onClose }: OpenFolderDialogProps) {
  const [path, setPath] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!path.trim()) {
      setError("Please enter a folder path");
      return;
    }

    try {
      const response = await trpc.fileSystem.openFolder(path.trim());

      if (response.success) {
        onOpen(path.trim());
      } else {
        setError(response.error || "Failed to open folder");
      }
    } catch (err) {
      setError("Failed to connect to file system service");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-zinc-800">
        <h2 className="text-lg font-semibold mb-4">Open Folder</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="folder-path" className="block text-sm text-zinc-400 mb-2">
              Folder Path
            </label>
            <input
              id="folder-path"
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/your/project"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
            >
              Open
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
