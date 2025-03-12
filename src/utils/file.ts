import { App, normalizePath, Notice, TFile } from "obsidian";
import { join } from "path";

/**
 * Save a temporary file
 * @param app Obsidian app instance
 * @param filename Filename
 * @param data File data as array buffer
 * @returns Path to the saved file
 */
export async function saveTemporaryFile(app: App, filename: string, data: ArrayBuffer): Promise<string> {
    try {
        // Ensure temp folder exists
        const tempFolderPath = "temp";
        if (!await app.vault.adapter.exists(tempFolderPath)) {
            await app.vault.adapter.mkdir(tempFolderPath);
        }
        
        // Full path to temporary file
        const tempPath = join(tempFolderPath, filename);
        const normalizedPath = normalizePath(tempPath);
        
        // Write file data
        await app.vault.adapter.writeBinary(normalizedPath, data);
        
        return normalizedPath;
    } catch (error) {
        console.error("Failed to save temporary file:", error);
        throw error;
    }
}

/**
 * Delete a file from vault
 * @param app Obsidian app instance
 * @param path File path
 * @returns Whether deletion was successful
 */
export async function deleteFile(app: App, path: string): Promise<boolean> {
    try {
        const normalizedPath = normalizePath(path);
        
        // Check if file exists
        if (await app.vault.adapter.exists(normalizedPath)) {
            await app.vault.adapter.remove(normalizedPath);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error("Failed to delete file:", error);
        return false;
    }
}

/**
 * Ensure directory exists
 * @param app Obsidian app instance
 * @param path Directory path
 * @returns Whether directory exists or was created
 */
export async function ensureDirectory(app: App, path: string): Promise<boolean> {
    try {
        const normalizedPath = normalizePath(path);
        
        // Check if directory exists
        if (await app.vault.adapter.exists(normalizedPath)) {
            // Ensure it's a directory
            const stat = await app.vault.adapter.stat(normalizedPath);
            if (stat && stat.type === "folder") {
                return true;
            } else {
                return false; // Path exists but is not a directory
            }
        }
        
        // Create directory
        await app.vault.adapter.mkdir(normalizedPath);
        return true;
    } catch (error) {
        console.error("Failed to ensure directory:", error);
        return false;
    }
}

/**
 * Move file from one location to another
 * @param app Obsidian app instance
 * @param sourcePath Source file path
 * @param targetPath Target file path
 * @returns Whether move was successful
 */
export async function moveFile(app: App, sourcePath: string, targetPath: string): Promise<boolean> {
    try {
        const normalizedSourcePath = normalizePath(sourcePath);
        const normalizedTargetPath = normalizePath(targetPath);
        
        // Check if source file exists
        if (!await app.vault.adapter.exists(normalizedSourcePath)) {
            return false;
        }
        
        // Ensure target directory exists
        const targetDir = normalizedTargetPath.substring(0, normalizedTargetPath.lastIndexOf('/'));
        if (targetDir && !await ensureDirectory(app, targetDir)) {
            return false;
        }
        
        // Read source file
        const data = await app.vault.adapter.readBinary(normalizedSourcePath);
        
        // Write to target location
        await app.vault.adapter.writeBinary(normalizedTargetPath, data);
        
        // Delete source file
        await app.vault.adapter.remove(normalizedSourcePath);
        
        return true;
    } catch (error) {
        console.error("Failed to move file:", error);
        return false;
    }
} 