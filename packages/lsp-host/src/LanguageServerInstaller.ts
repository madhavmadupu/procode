import { spawn, ChildProcessByStdio } from 'child_process';
import { Writable, Readable } from 'stream';
import { platform } from 'os';

export interface LspServerInfo {
  id: string;
  name: string;
  command: string;
  installed: boolean;
  installCommand: string;
  description: string;
}

export const LSP_SERVERS: LspServerInfo[] = [
  {
    id: 'typescript',
    name: 'TypeScript Language Server',
    command: 'typescript-language-server',
    installed: false,
    installCommand: 'npm install -g typescript-language-server typescript',
    description: 'Language server for TypeScript, JavaScript, TSX, and JSX',
  },
  {
    id: 'rust',
    name: 'rust-analyzer',
    command: 'rust-analyzer',
    installed: false,
    installCommand: 'rustup component add rust-analyzer',
    description: 'Language server for Rust',
  },
  {
    id: 'python',
    name: 'Pyright',
    command: 'pyright-langserver',
    installed: false,
    installCommand: 'npm install -g pyright',
    description: 'Language server for Python',
  },
];

export async function checkServerInstalled(serverId: string): Promise<boolean> {
  const server = LSP_SERVERS.find(s => s.id === serverId);
  if (!server) {
    return false;
  }

  return new Promise((resolve) => {
    const cmd = platform() === 'win32' ? 'where' : 'which';
    const proc = spawn(cmd, [server.command], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    proc.on('exit', (code) => {
      resolve(code === 0);
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
}

export async function checkAllServers(): Promise<LspServerInfo[]> {
  const results = await Promise.all(
    LSP_SERVERS.map(async (server) => {
      const installed = await checkServerInstalled(server.id);
      return { ...server, installed };
    })
  );
  return results;
}

export async function installServer(serverId: string): Promise<{ success: boolean; output: string }> {
  const server = LSP_SERVERS.find(s => s.id === serverId);
  if (!server) {
    return { success: false, output: `Unknown server: ${serverId}` };
  }

  return new Promise((resolve) => {
    const proc = spawn(server.installCommand, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let output = '';

    proc.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.on('exit', (code: number | null) => {
      resolve({
        success: code === 0,
        output: output.trim(),
      });
    });

    proc.on('error', (error: Error) => {
      resolve({
        success: false,
        output: error.message,
      });
    });
  });
}

export async function installAllServers(): Promise<Map<string, { success: boolean; output: string }>> {
  const results = new Map<string, { success: boolean; output: string }>();

  for (const server of LSP_SERVERS) {
    const result = await installServer(server.id);
    results.set(server.id, result);
  }

  return results;
}
