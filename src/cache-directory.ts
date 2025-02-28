import { homedir, platform } from 'os';
import { join } from 'path';

/**
 * Get the cache directory for Posix systems (Linux, etc.)
 */
function posix(id: string): string {
	const cacheHome = process.env.XDG_CACHE_HOME || join(homedir(), '.cache');
	return join(cacheHome, id);
}

/**
 * Get the cache directory for macOS
 */
function darwin(id: string): string {
	return join(homedir(), 'Library', 'Caches', id);
}

/**
 * Get the cache directory for Windows
 */
function win32(id: string): string {
	const appData = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
	return join(appData, id, 'Cache');
}

/**
 * Select the appropriate implementation based on the platform
 */
const implementation = (function () {
	switch (platform()) {
		case 'darwin':
			return darwin;
		case 'win32':
			return win32;
		case 'aix':
		case 'android':
		case 'freebsd':
		case 'linux':
		case 'netbsd':
		case 'openbsd':
		case 'sunos':
			return posix;
		default:
			console.error(
				`(node:${process.pid}) [cachedir] Warning: the platform "${platform()}" is not currently supported by node-cachedir, falling back to "posix". Please file an issue with your platform here: https://github.com/LinusU/node-cachedir/issues/new`
			);
			return posix;
	}
})();

/**
 * Get the cache directory for the given application ID
 */
export function cachedir(id: string): string {
	if (typeof id !== 'string') {
		throw new TypeError('id is not a string');
	}
	if (id.length === 0) {
		throw new Error('id cannot be empty');
	}
	if (/[^0-9a-zA-Z-]/.test(id)) {
		throw new Error('id cannot contain special characters');
	}

	return implementation(id);
} 