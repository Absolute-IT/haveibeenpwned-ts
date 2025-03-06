import { homedir, platform } from 'os';
import { join } from 'path';

/**
 * Get the cache directory for Posix systems (Linux, etc.).
 * 
 * @param id - Application identifier
 * @returns Path to the cache directory
 */
function posix(id: string): string {
	const cacheHome = process.env.XDG_CACHE_HOME || join(homedir(), '.cache');
	return join(cacheHome, id);
}

/**
 * Get the cache directory for macOS.
 * 
 * @param id - Application identifier
 * @returns Path to the cache directory
 */
function darwin(id: string): string {
	return join(homedir(), 'Library', 'Caches', id);
}

/**
 * Get the cache directory for Windows.
 * 
 * @param id - Application identifier
 * @returns Path to the cache directory
 */
function win32(id: string): string {
	const appData = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
	return join(appData, id, 'Cache');
}

/**
 * Select the appropriate implementation based on the platform.
 * 
 * @returns The appropriate platform-specific cache directory function
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
		case 'cygwin':
			return posix;
		default:
			// Default to posix for unknown platforms
			return posix;
	}
})();

/**
 * Get the platform-specific cache directory for an application.
 * 
 * @param id - Application identifier
 * @returns Path to the cache directory
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