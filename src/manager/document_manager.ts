import { App, Notice, TFile, normalizePath, Vault } from "obsidian";
import { IImageInfo, createImageInfo } from "./image_info";
import { MagicVariableProcessor } from "./magic_variable";
import { ISettings } from "../interface/settings";
import { IUploader } from "../interface/uploader";
import { _T } from "../lang/helpers";
import { basename, dirname, join } from "path";

/**
 * Interface for document image manager
 */
export interface IDocumentImageManager {
    /**
     * Document path
     */
    mdPath: string;

    /**
     * Image folder path also the folder with json file
     */
    imageFolderPath: string;
    
    /**
     * Image information map
     */
    images: Map<string, IImageInfo>;
    
    /**
     * Load image information from JSON
     * @returns Whether loading was successful
     */
    loadFromJson(): Promise<boolean>;
    
    /**
     * Save image information to JSON
     * @returns Whether saving was successful
     */
    saveToJson(): Promise<boolean>;
    
    /**
     * Add an image
     * @param sourcePath Source image path
     * @returns Path to use in the document
     */
    addImage(sourcePath: string): Promise<string>;
    
    /**
     * Remove an image
     * @param localPath Local path of the image
     * @returns Whether removal was successful
     */
    removeImage(localPath: string): Promise<boolean>;
    
    /**
     * Upload all images
     * @returns Whether all uploads were successful
     */
    uploadAllImages(): Promise<boolean>;
    
    /**
     * Download all images
     * @returns Whether all downloads were successful
     */
    downloadAllImages(): Promise<boolean>;
    
    /**
     * Rename image folder
     * @param newMdPath New document path
     * @returns Whether renaming was successful
     */
    renameImageFolder(newMdPath: string): Promise<boolean>;
    
    /**
     * Get Markdown reference for an image
     * @param localPath Local path of the image
     * @returns Markdown reference
     */
    getMarkdownReference(localPath: string): string;
}

/**
 * Document image manager implementation
 */
export class DocumentImageManager implements IDocumentImageManager {
    private app: App;
    private settings: ISettings;
    private uploader: IUploader;
    private magicProcessor: MagicVariableProcessor;
    
    mdPath: string;
    images: Map<string, IImageInfo>;
    imageFolderPath: string;
    /**
     * Constructor
     * @param app Obsidian app instance
     * @param settings Plugin settings
     * @param uploader Uploader instance
     * @param mdPath Document path
     */
    constructor(app: App, settings: ISettings, uploader: IUploader, mdPath: string) {
        this.app = app;
        this.settings = settings;
        this.uploader = uploader;
        this.mdPath = mdPath;
        this.images = new Map();
        this.magicProcessor = new MagicVariableProcessor(app);
        this.imageFolderPath = this.getImageFolderPath();
    }
    
    /**
     * Get JSON file path
     * @param imageFolderPath Image folder path
     * @returns JSON file path
     */
    private getJsonPath(imageFolderPath: string): string {
        // json file name is the same as md file name at imageFolderPath
        return join(imageFolderPath, basename(this.mdPath, '.md') + '.json');
    }
    
    /**
     * Get image folder path
     * @returns Image folder path
     */
    private getImageFolderPath(): string {
        // Get document directory
        const mdDir = dirname(this.mdPath);
        const mdName = basename(this.mdPath, '.md');
        
        // Get context
        const context = this.magicProcessor.getContext(this.mdPath);
        
        // Process template
        const relativeFolderPath = this.magicProcessor.process(
            this.settings.tempFolderPath,
            context
        );
        
        // Combine into full path
        return normalizePath(join(mdDir, relativeFolderPath));
    }
    
    /**
     * Load image information from JSON
     * @returns Whether loading was successful
     */
    async loadFromJson(): Promise<boolean> {
        const jsonPath = this.getJsonPath(this.imageFolderPath);
        
        try {
            // Check if JSON file exists
            if (await this.app.vault.adapter.exists(jsonPath)) {
                // Read JSON file content
                const content = await this.app.vault.adapter.read(jsonPath);
                const data = JSON.parse(content);
                
                // Clear current image information
                this.images.clear();
                
                // Load image information
                if (data.images) {
                    for (const [key, value] of Object.entries(data.images)) {
                        this.images.set(key, value as IImageInfo);
                    }
                }
                
                return true;
            }
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_LOAD_JSON") + error);
            console.error(_T("ERROR_LOAD_JSON"), error);

        }
        
        return false;
    }
    
    /**
     * Save image information to JSON
     * @returns Whether saving was successful
     */
    async saveToJson(): Promise<boolean> {
        try {
            // If there are no images, delete the JSON file (if it exists) and the image folder
            if (this.images.size === 0) {
                const jsonPath = this.getJsonPath(this.imageFolderPath);
                if (await this.app.vault.adapter.exists(jsonPath)) {
                    await this.app.vault.adapter.remove(jsonPath);
                }
                if (await this.app.vault.adapter.exists(this.imageFolderPath)) {
                    await this.app.vault.adapter.rmdir(this.imageFolderPath, true);
                }
                return true;
            }
            
            // Build data to save
            const data = {
                mdPath: this.mdPath,
                // Convert Map to plain object
                images: Object.fromEntries(this.images)
            };
            
            // Ensure image folder exists
            if (!await this.app.vault.adapter.exists(this.imageFolderPath)) {
                await this.app.vault.adapter.mkdir(this.imageFolderPath);
            }

            // Write data to JSON file
            const jsonPath = this.getJsonPath(this.imageFolderPath);
            await this.app.vault.adapter.write(
                jsonPath,
                JSON.stringify(data, null, 2)
            );
            
            return true;
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_SAVE_JSON") + error);
            console.error(_T("ERROR_SAVE_JSON"), error);
            return false;
        }
    }
    
    /**
     * Generate image filename
     * @param originalName Original filename
     * @returns Generated filename
     */
    private generateImageFileName(originalName: string): string {
        // Get file extension
        const extName = originalName.split('.').pop() || 'png';
        
        // Get context
        const context = this.magicProcessor.getContext(this.mdPath);
        
        // Process filename template
        const baseName = this.magicProcessor.process(
            this.settings.tempFileFormat,
            context
        );
        
        // Combine into full filename
        return `${baseName}.${extName}`;
    }
    
    /**
     * Copy image to target folder
     * @param sourcePath Source image path
     * @returns Target image path
     */
    private async copyImageToFolder(sourcePath: string): Promise<string> {
        try {
            // Get original filename
            const originalName = basename(sourcePath);
            
            // Generate new filename
            // TODO: We'll use original filename for now
            // In the future, we can add auto-rename functionality
            const newFileName = originalName;
            
            // Ensure image folder exists
            if (!await this.app.vault.adapter.exists(this.imageFolderPath)) {
                await this.app.vault.adapter.mkdir(this.imageFolderPath);
            }
            
            // Combine target path
            const targetPath = normalizePath(join(this.imageFolderPath, newFileName));
            
            // Check if target file already exists
            if (await this.app.vault.adapter.exists(targetPath)) {
                // If file with same name exists, add timestamp to filename
                const timestamp = Date.now();
                const nameWithoutExt = newFileName.substring(0, newFileName.lastIndexOf('.'));
                const ext = newFileName.substring(newFileName.lastIndexOf('.'));
                const newNameWithTimestamp = `${nameWithoutExt}_${timestamp}${ext}`;
                
                // Update target path
                const targetPathWithTimestamp = normalizePath(join(this.imageFolderPath, newNameWithTimestamp));
                
                // Read source file content
                const sourceContent = await this.app.vault.adapter.readBinary(sourcePath);
                
                // Write to target file
                await this.app.vault.adapter.writeBinary(targetPathWithTimestamp, sourceContent);
                
                return targetPathWithTimestamp;
            } else {
                // Read source file content
                const sourceContent = await this.app.vault.adapter.readBinary(sourcePath);
                
                // Write to target file
                await this.app.vault.adapter.writeBinary(targetPath, sourceContent);
                
                return targetPath;
            }
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_ADD_IMAGE") + error);
            console.error(_T("ERROR_ADD_IMAGE"), error);
            throw error;
        }
    }
    
    /**
     * Get path relative to document
     * @param absolutePath Absolute path
     * @returns Relative path
     */
    private getRelativePath(absolutePath: string): string {
        // Get document directory
        const mdDir = dirname(this.mdPath);
        
        // Get relative path
        let relativePath = normalizePath(absolutePath)
            .replace(normalizePath(mdDir), '');
        
        // Ensure path starts with /
        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }
        
        return relativePath;
    }
    
    /**
     * Add an image
     * @param sourcePath Source image path
     * @returns Path to use in the document
     */
    async addImage(sourcePath: string): Promise<string> {
        try {
            // Copy image to target folder
            const targetPath = await this.copyImageToFolder(sourcePath);
            
            // Create image info
            const imageInfo = createImageInfo(targetPath);
            
            // Get original filename
            imageInfo.originalName = basename(sourcePath);
            
            // Try to get image size
            try {
                const stat = await this.app.vault.adapter.stat(targetPath);
                if (stat) {
                    imageInfo.size = stat.size;
                }
            } catch (e) {
                // Ignore error
            }
            
            // Add to image info map
            this.images.set(targetPath, imageInfo);
            
            // Save JSON
            await this.saveToJson();
            
            // If auto upload is enabled, upload image
            if (this.settings.isAutoUpload) {
                try {
                    const uploadResult = await this.uploadImage(targetPath);
                    if (uploadResult) {
                        // Use remote URL
                        return imageInfo.remotePath;
                    }
                } catch (error) {
                    // Notice error
                    new Notice(_T("ERROR_UPLOAD_IMAGES") + error);
                    console.error(_T("ERROR_UPLOAD_IMAGES"), error);
                    // Upload failed, use local path
                }
            }
            
            // Return relative path for document insertion
            return this.getRelativePath(targetPath);
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_ADD_IMAGE") + error);
            console.error(_T("ERROR_ADD_IMAGE"), error);
            throw error;
        }
    }
    
    /**
     * Remove an image
     * @param localPath Local path of the image
     * @returns Whether removal was successful
     */
    async removeImage(localPath: string): Promise<boolean> {
        try {
            // Check if image exists
            if (!this.images.has(localPath)) {
                return false;
            }
            
            // Get image info
            const imageInfo = this.images.get(localPath);
            
            // If image info not found, return false
            if (!imageInfo) {
                return false;
            }
            
            // Delete local file
            if (await this.app.vault.adapter.exists(localPath)) {
                await this.app.vault.adapter.remove(localPath);
            }
            
            // Remove from map
            this.images.delete(localPath);
            
            // Save JSON and delete image folder if no images left (processed in saveToJson)
            await this.saveToJson();

            return true;
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_REMOVE_IMAGE") + error);
            console.error(_T("ERROR_REMOVE_IMAGE"), error);
            return false;
        }
    }
    
    /**
     * Upload a single image
     * @param localPath Local path of the image
     * @returns Whether upload was successful
     */
    private async uploadImage(localPath: string): Promise<boolean> {
        // Check if image exists
        if (!this.images.has(localPath)) {
            return false;
        }
        
        // Get image info
        const imageInfo = this.images.get(localPath);
        
        // If image info not found, return false
        if (!imageInfo) {
            return false;
        }
        
        // If already uploaded, skip
        if (imageInfo.isUploaded) {
            return true;
        }
        
        try {
            // Upload image
            const result = await this.uploader.upload(localPath, {
                onStart: () => {
                    new Notice("Starting upload: " + basename(localPath));
                },
                onProgress: (message) => {
                    console.log("Upload progress: ", message);
                },
                onError: (error) => {
                    console.error("Upload error: ", error);
                    new Notice("Upload failed: " + error);
                },
                onSuccess: (result) => {
                    console.log("Upload success: ", result);
                    new Notice("Upload successful!");
                }
            });
            
            // Parse returned URL
            const urls = result.split(",");
            if (urls.length > 0) {
                // Update image info
                imageInfo.remotePath = urls[0];
                imageInfo.isUploaded = true;
                imageInfo.modifyTime = Date.now();
                
                // Save JSON
                await this.saveToJson();
                
                // If set to delete local file after upload
                if (this.settings.isDeleteTemp && await this.app.vault.adapter.exists(localPath)) {
                    await this.app.vault.adapter.remove(localPath);
                    
                    // Update image info, mark local path as empty
                    // imageInfo.localPath = "";
                    // await this.saveToJson();
                }
                
                return true;
            }
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_UPLOAD_IMAGES") + error);
            console.error(_T("ERROR_UPLOAD_IMAGES"), error);
        }
        
        return false;
    }
    
    /**
     * Upload all images
     * @returns Whether all uploads were successful
     */
    async uploadAllImages(): Promise<boolean> {
        let allSuccess = true;
        
        // Get all unuploaded images
        for (const [path, info] of this.images.entries()) {
            if (!info.isUploaded) {
                const success = await this.uploadImage(path);
                allSuccess = allSuccess && success;
            }
        }
        
        return allSuccess;
    }
    
    /**
     * Download an image
     * @param url Image URL
     * @returns Local path
     */
    private async downloadImage(url: string): Promise<string> {
        // TODO: Implement it later like uploadImage
        try {
            // Generate filename
            const fileName = basename(url.split("?")[0]); // Remove URL parameters
            
            // Get image folder path
            const imageFolderPath = this.getImageFolderPath();
            
            // Ensure image folder exists
            if (!await this.app.vault.adapter.exists(imageFolderPath)) {
                await this.app.vault.adapter.mkdir(imageFolderPath);
            }
            
            // Combine target path
            const targetPath = normalizePath(join(imageFolderPath, fileName));
            
            // Download image
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            
            // Write file
            await this.app.vault.adapter.writeBinary(targetPath, arrayBuffer);
            
            return targetPath;
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_DOWNLOAD_IMAGES") + error);
            console.error(_T("ERROR_DOWNLOAD_IMAGES"), error);
            throw error;
        }
    }
    
    /**
     * Download all images
     * @returns Whether all downloads were successful
     */
    async downloadAllImages(): Promise<boolean> {
        // TODO: Implement it later like uploadAllImages

        let allSuccess = true;
        
        // Get all uploaded images with no local file
        for (const [path, info] of this.images.entries()) {
            if (info.isUploaded && (!info.localPath || !(await this.app.vault.adapter.exists(info.localPath)))) {
                try {
                    // Download image
                    const localPath = await this.downloadImage(info.remotePath);
                    
                    // Update image info
                    info.localPath = localPath;
                    info.modifyTime = Date.now();
                } catch (error) {
                    // Notice error
                    new Notice(_T("ERROR_DOWNLOAD_IMAGES") + error);
                    console.error(_T("ERROR_DOWNLOAD_IMAGES"), error);
                    allSuccess = false;
                }
            }
        }
        
        // Save JSON
        await this.saveToJson();
        
        return allSuccess;
    }
    
    /**
     * Rename image folder
     * @param newMdPath New document path
     * @returns Whether renaming was successful
     */
    async renameImageFolder(newMdPath: string): Promise<boolean> {

        // Nothing to do if no images
        if (this.images.size === 0) {
            return true;
        }

        // Save old paths
        const oldMdPath = this.mdPath;
        const oldImageFolder = this.imageFolderPath;
        const oldJsonPath = this.getJsonPath(oldImageFolder);
        
        // Update document path
        this.mdPath = newMdPath;
        this.imageFolderPath = this.getImageFolderPath();
        const newJsonPath = this.getJsonPath(this.imageFolderPath);

        // Check if old folder exists
        if (!await this.app.vault.adapter.exists(oldImageFolder)) {
            // Old folder doesn't exist, just notice and return
            new Notice(_T("ERROR_RENAME_FOLDER_NOT_FOUND"));
            return true;
        }

        // // Ensure new folder exists
        if (!await this.app.vault.adapter.exists(this.imageFolderPath)) {
            await this.app.vault.adapter.mkdir(this.imageFolderPath);
        }

        // If old folder and new folder are the same, just update JSON file location
        if (oldImageFolder === this.imageFolderPath) {
            // If JSON file exists, move it
            if (await this.app.vault.adapter.exists(oldJsonPath)) {
                const content = await this.app.vault.adapter.read(oldJsonPath);
                await this.app.vault.adapter.write(newJsonPath, content);
                await this.app.vault.adapter.remove(oldJsonPath);
            }
            return true;
        }
        
        try {
            // Get all files in old folder
            const files = await this.app.vault.adapter.list(oldImageFolder);
            
            // Move all files
            for (const file of files.files) {
                // Read file content
                const content = await this.app.vault.adapter.readBinary(file);
                
                // Calculate target path
                const relativePath = file.substring(oldImageFolder.length);
                const targetPath = normalizePath(join(this.imageFolderPath, relativePath));
                
                // Write to new location
                await this.app.vault.adapter.writeBinary(targetPath, content);
                
                // Delete old file
                await this.app.vault.adapter.remove(file);
                
                // Update image info
                for (const [oldPath, info] of this.images.entries()) {
                    if (oldPath === file) {
                        // Create new image info
                        const newInfo = { ...info, localPath: targetPath };
                        
                        // Delete old record
                        this.images.delete(oldPath);
                        
                        // Add new record
                        this.images.set(targetPath, newInfo);
                    }
                }
            }

            // Save JSON to new location
            await this.saveToJson();
            
            // Delete old folder
            await this.app.vault.adapter.rmdir(oldImageFolder, true);
            
            return true;
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_RENAME_FOLDER") + error);
            console.error(_T("ERROR_RENAME_FOLDER"), error);
            
            // Restore document path
            this.mdPath = oldMdPath;
            this.imageFolderPath = oldImageFolder;
            return false;
        }
    }
    
    /**
     * Get Markdown reference for an image
     * @param localPath Local path of the image
     * @returns Markdown reference
     */
    getMarkdownReference(localPath: string): string {
        // Check if image exists
        if (!this.images.has(localPath)) {
            return "";
        }
        
        // Get image info
        const imageInfo = this.images.get(localPath);
        
        // If image info not found, return empty string
        if (!imageInfo) {
            return "";
        }
        
        const imageName = basename(localPath);
        const imageNameWithoutExt = imageName.substring(0, imageName.lastIndexOf('.'));

        // If uploaded and should use remote URL
        if (imageInfo.isUploaded && imageInfo.remotePath) {
            return `![${imageNameWithoutExt}](${imageInfo.remotePath})`;
        }
        
        // Otherwise use relative path
        return `![${imageNameWithoutExt}](${this.getRelativePath(localPath)})`;
    }
} 