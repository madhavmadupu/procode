export interface EditorConfig {
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: "on" | "off" | "wordWrapColumn" | "bounded";
  minimap: { enabled: boolean };
  fontSize: number;
  fontFamily: string;
  theme: string;
}
