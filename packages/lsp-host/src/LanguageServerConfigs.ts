import type { LSPConfig } from '@procode/types';

export const DEFAULT_LSP_CONFIGS: LSPConfig[] = [
  {
    serverId: 'typescript',
    command: 'typescript-language-server',
    args: ['--stdio'],
    filePatterns: ['*.ts', '*.tsx', '*.js', '*.jsx'],
  },
  {
    serverId: 'rust',
    command: 'rust-analyzer',
    args: [],
    filePatterns: ['*.rs'],
  },
  {
    serverId: 'python',
    command: 'pyright-langserver',
    args: ['--stdio'],
    filePatterns: ['*.py'],
  },
];

export function getDefaultConfigForLanguage(languageId: string): LSPConfig | undefined {
  switch (languageId) {
    case 'typescript':
    case 'typescriptreact':
    case 'javascript':
    case 'javascriptreact':
      return DEFAULT_LSP_CONFIGS.find(c => c.serverId === 'typescript');
    case 'rust':
      return DEFAULT_LSP_CONFIGS.find(c => c.serverId === 'rust');
    case 'python':
      return DEFAULT_LSP_CONFIGS.find(c => c.serverId === 'python');
    default:
      return undefined;
  }
}

export function getSupportedLanguages(): string[] {
  return ['typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'rust', 'python'];
}
