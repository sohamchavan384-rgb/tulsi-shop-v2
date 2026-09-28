import { readFileSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { xdgConfig } from 'xdg-basedir';
export default function getToken({ prod = true }) {
    // If SANITY_AUTH_TOKEN is set, use it.
    if (env.SANITY_AUTH_TOKEN) {
        return env.SANITY_AUTH_TOKEN;
    }
    // Otherwise, determine which config file to read token from
    const environmentDir = prod ? 'sanity' : 'sanity-staging';
    const user = (userInfo().username || 'user').replace(/\\/g, '');
    const configDir = xdgConfig || join(tmpdir(), user, '.config');
    const configPath = join(configDir, environmentDir, 'config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    return config.authToken;
}
