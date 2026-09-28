import { spawn } from 'node:child_process';
import { env, platform } from 'node:process';
export class ClipboardUnavailableError extends Error {
    code = 'CLIPBOARD_UNAVAILABLE';
    triedTools;
    constructor(message, triedTools = []) {
        super(message);
        this.name = 'ClipboardUnavailableError';
        this.triedTools = triedTools;
    }
}
/** Candidate copy tools for the current OS, in fallback order. */
export function pickCopyTools() {
    if (platform === 'darwin')
        return [{ cmd: 'pbcopy', args: [] }];
    if (platform === 'win32')
        return [{ cmd: 'clip', args: [] }];
    const tools = [];
    if (env.WAYLAND_DISPLAY)
        tools.push({ cmd: 'wl-copy', args: [] });
    if (env.DISPLAY) {
        tools.push({ cmd: 'xclip', args: ['-selection', 'clipboard'] });
        tools.push({ cmd: 'xsel', args: ['--clipboard', '--input'] });
    }
    if (env.WSL_DISTRO_NAME)
        tools.push({ cmd: 'clip.exe', args: [] });
    return tools;
}
function tryWrite(tool, text) {
    return new Promise((resolve, reject) => {
        let child;
        try {
            child = spawn(tool.cmd, tool.args, { stdio: ['pipe', 'ignore', 'pipe'] });
        }
        catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
            return;
        }
        let stderr = '';
        child.on('error', reject);
        child.stderr?.on('data', (chunk) => {
            stderr += chunk.toString();
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`${tool.cmd} exited with code ${code}: ${stderr.trim()}`));
        });
        child.stdin?.end(text, 'utf8');
    });
}
/** @throws {ClipboardUnavailableError} when no usable clipboard tool is available. */
export async function write(text) {
    const tools = pickCopyTools();
    if (tools.length === 0) {
        throw new ClipboardUnavailableError(`No clipboard tool available for platform "${platform}".`, []);
    }
    const triedTools = tools.map((t) => t.cmd);
    let lastErr;
    for (const tool of tools) {
        try {
            await tryWrite(tool, text);
            return;
        }
        catch (err) {
            lastErr = err;
        }
    }
    const message = lastErr instanceof Error ? lastErr.message : String(lastErr);
    throw new ClipboardUnavailableError(`Clipboard write failed. Tools tried: ${triedTools.join(', ')}. Last error: ${message}`, triedTools);
}
