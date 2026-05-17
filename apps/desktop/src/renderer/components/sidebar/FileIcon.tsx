import { cn } from "../../lib/utils";

interface FileIconProps {
  filename: string;
  isDirectory: boolean;
  isOpen?: boolean;
  className?: string;
}

const EXTENSION_ICONS: Record<string, string> = {
  ".ts": "TS",
  ".tsx": "TSX",
  ".js": "JS",
  ".jsx": "JSX",
  ".json": "{}",
  ".md": "MD",
  ".css": "#",
  ".html": "<>",
  ".rs": "RS",
  ".toml": "⚙",
  ".yaml": "⚙",
  ".yml": "⚙",
  ".env": "🔒",
  ".lock": "🔒",
  ".py": "PY",
  ".go": "GO",
  ".java": "JV",
  ".c": "C",
  ".cpp": "C+",
  ".h": "H",
  ".sql": "DB",
  ".sh": ">$",
  ".gitignore": "🚫",
};

const SPECIAL_FILES: Record<string, { label: string; color: string }> = {
  "package.json": { label: "npm", color: "text-red-400" },
  "tsconfig.json": { label: "TS", color: "text-blue-400" },
  "Cargo.toml": { label: "RS", color: "text-orange-400" },
  "README.md": { label: "MD", color: "text-blue-300" },
  ".env": { label: "🔒", color: "text-yellow-400" },
  ".gitignore": { label: "🚫", color: "text-orange-300" },
  Makefile: { label: "⚙", color: "text-muted-foreground" },
};

const SPECIAL_FOLDERS: Record<string, string> = {
  ".git": "text-muted-foreground",
  node_modules: "text-red-300",
};

export function FileIcon({ filename, isDirectory, isOpen, className }: FileIconProps) {
  if (isDirectory) {
    const folderColor = SPECIAL_FOLDERS[filename] ?? "text-blue-400";
    return (
      <svg
        className={cn("w-4 h-4 flex-shrink-0", folderColor, className)}
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        {isOpen ? (
          <path d="M1 4.5A1.5 1.5 0 012.5 3h3.172a1.5 1.5 0 011.06.44l.828.828a.5.5 0 00.354.146H13.5A1.5 1.5 0 0115 5.914V6.5 11.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 11.5V4.5zM3 5v6.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V6.5a.5.5 0 00-.5-.5h-11A.5.5 0 003 6z" />
        ) : (
          <path d="M1 3.5A1.5 1.5 0 012.5 2h3.172a1.5 1.5 0 011.06.44l.828.828a.5.5 0 00.354.146H13.5A1.5 1.5 0 0115 4.914V5v7.586A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.586V3.5zM3 4.5v8.086a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V4.914a.5.5 0 00-.5-.5h-11A.5.5 0 003 4.5z" />
        )}
      </svg>
    );
  }

  const special = SPECIAL_FILES[filename];
  if (special) {
    return (
      <span className={cn("w-4 h-4 flex items-center justify-center text-[10px] font-bold flex-shrink-0", special.color, className)}>
        {special.label}
      </span>
    );
  }

  const ext = filename.includes(".") ? `.${filename.split(".").pop()}` : "";
  const iconInfo = EXTENSION_ICONS[ext];

  if (iconInfo) {
    const colorMap: Record<string, string> = {
      TS: "text-blue-400",
      TSX: "text-blue-400",
      JS: "text-yellow-400",
      JSX: "text-yellow-400",
      "{}": "text-yellow-300",
      MD: "text-blue-300",
      "#": "text-purple-400",
      "<>": "text-orange-400",
      RS: "text-orange-400",
      PY: "text-green-400",
      GO: "text-cyan-400",
      JV: "text-red-400",
      C: "text-blue-300",
      "C+": "text-blue-300",
      H: "text-blue-300",
      DB: "text-purple-300",
    };
    return (
      <span className={cn("w-4 h-4 flex items-center justify-center text-[9px] font-bold flex-shrink-0", colorMap[iconInfo] ?? "text-muted-foreground", className)}>
        {iconInfo}
      </span>
    );
  }

  return (
    <svg
      className={cn("w-4 h-4 flex-shrink-0 text-muted-foreground", className)}
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M3 1.5A1.5 1.5 0 014.5 0h5.586c.398 0 .78.158 1.06.44l3.414 3.414c.282.28.44.662.44 1.06V13.5A1.5 1.5 0 0113.5 15h-11A1.5 1.5 0 011 13.5v-12zM5.5 1h-1a.5.5 0 00-.5.5v.5h4V1.5a.5.5 0 00-.5-.5h-2zM3 3v10.5a.5.5 0 00.5.5h10a.5.5 0 00.5-.5V6H5.5A1.5 1.5 0 014 4.5V3z" />
    </svg>
  );
}
