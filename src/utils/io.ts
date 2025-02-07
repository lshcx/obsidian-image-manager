import * as fs from 'fs';

/**
 * delete the file
 * @param path file path
 * @returns true if success, false if failed
 */
export async function deleteFile(path: string): Promise<boolean> {
    try {
        await fs.promises.unlink(path);
        return true;
    } catch (error) {
        console.error(`Failed to delete file: ${path}`, error);
        return false;
    }
}

/**
 * delete the files
 * @param paths file paths
 * @returns true if success, false if failed
 */
export async function deleteFiles(paths: string[]): Promise<boolean> {
    let success = true;
    for (const path of paths) {
        const result = await deleteFile(path);
        if (!result) {
            success = false;
        }
    }
    return success;
}