import { Editor, MarkdownView, Notice, TFile } from "obsidian";
import { _T } from "../lang/helpers";
import ImageManagerPlugin from "../main";
import { saveTemporaryFile } from "../utils/file";

/**
 * Handler for drag and drop of images
 */
export class DropHandler {
    private plugin: ImageManagerPlugin;
    
    /**
     * Constructor
     * @param plugin Plugin instance
     */
    constructor(plugin: ImageManagerPlugin) {
        this.plugin = plugin;
        this.registerEvent();
    }
    
    /**
     * Register drop event handler
     */
    private registerEvent(): void {
        // Register the drop event handler
        this.plugin.registerEvent(
            this.plugin.app.workspace.on("editor-drop", this.handleDrop.bind(this))
        );
    }
    
    /**
     * Handle drop event
     * @param evt Drop event
     * @param editor Editor instance
     * @param view Markdown view
     * @returns Promise<boolean> Whether the event was handled
     */
    private async handleDrop(evt: DragEvent, editor: Editor, view: MarkdownView): Promise<boolean> {
        // Ensure we have data transfer and a valid markdown view
        if (!evt.dataTransfer || !view || !view.file) {
            return false;
        }
        
        // Check for files first (highest priority)
        if (await this.handleFileDrop(evt, editor, view.file)) {
            evt.preventDefault();
            return true;
        }
        
        // Check for image URLs
        if (await this.handleUrlDrop(evt, editor, view.file)) {
            evt.preventDefault();
            return true;
        }
        
        // Not handled, let Obsidian's default handler process it
        return false;
    }
    
    /**
     * Handle dropping of files
     * @param evt Drop event
     * @param editor Editor instance
     * @param file Current file
     * @returns Promise<boolean> Whether a file was processed
     */
    private async handleFileDrop(evt: DragEvent, editor: Editor, file: TFile): Promise<boolean> {
        // Check if there are any files in the drop
        const files = evt.dataTransfer?.files;
        if (!files || files.length === 0) {
            return false;
        }
        
        // Array to track successfully processed files
        const processedFiles: string[] = [];
        let anyProcessed = false;
        
        // Process each file
        for (let i = 0; i < files.length; i++) {
            const droppedFile = files[i];
            
            // Check if it's an image
            if (droppedFile.type.startsWith('image/')) {
                try {
                    // Process the image
                    const imagePath = await this.processImage(droppedFile, file);
                    if (imagePath) {
                        processedFiles.push(imagePath);
                        anyProcessed = true;
                    }
                } catch (error) {
                    console.error("Failed to process dropped image:", error);
                    new Notice(_T("ERROR_PROCESS_DROP") + droppedFile.name);
                }
            } else if (droppedFile.name.endsWith('.md')) {
                // Handle markdown files (outside scope of this implementation)
                new Notice(_T("NOTICE_MD_NOT_SUPPORTED"));
            } else {
                // Handle other file types (outside scope of this implementation)
                new Notice(_T("NOTICE_FILE_NOT_SUPPORTED") + droppedFile.name);
            }
        }
        
        // Insert markdown for all processed images at cursor position
        if (processedFiles.length > 0) {
            const markdown = processedFiles.map(path => `![](${path})`).join('\n');
            editor.replaceSelection(markdown);
            
            // Show success notification
            if (processedFiles.length === 1) {
                new Notice(_T("NOTICE_IMAGE_DROPPED"));
            } else {
                new Notice(_T("NOTICE_IMAGES_DROPPED").replace("{count}", processedFiles.length.toString()));
            }
        }
        
        return anyProcessed;
    }
    
    /**
     * Handle dropping of image URLs
     * @param evt Drop event
     * @param editor Editor instance
     * @param file Current file
     * @returns Promise<boolean> Whether a URL was processed
     */
    private async handleUrlDrop(evt: DragEvent, editor: Editor, file: TFile): Promise<boolean> {
        // Check for URL data
        const url = evt.dataTransfer?.getData('text/uri-list') || 
                    evt.dataTransfer?.getData('text/plain');
                    
        if (!url) {
            return false;
        }
        
        // Check if it's an image URL
        const isImageUrl = /^https?:\/\/.*\.(jpe?g|png|gif|bmp|webp|svg)(\?.*)?$/i.test(url);
        
        if (isImageUrl) {
            try {
                // Show processing notification
                new Notice(_T("NOTICE_PROCESSING_URL"));
                
                // Download the image
                const imagePath = await this.downloadImage(url, file);
                
                // Insert markdown at cursor position
                if (imagePath) {
                    const markdown = `![](${imagePath})`;
                    editor.replaceSelection(markdown);
                    
                    // Show success notification
                    new Notice(_T("NOTICE_URL_PROCESSED"));
                    return true;
                }
            } catch (error) {
                console.error("Failed to process dropped URL:", error);
                new Notice(_T("ERROR_PROCESS_URL"));
                return true; // We handled it, even though it failed
            }
        }
        
        return false;
    }
    
    /**
     * Process a dropped image file
     * @param droppedFile File object
     * @param file Current file
     * @returns Promise<string> Path to use in markdown
     */
    private async processImage(droppedFile: File, file: TFile): Promise<string> {
        try {
            // Show processing notification
            new Notice(_T("NOTICE_PROCESSING_IMAGE"));
            
            // Read file data
            const arrayBuffer = await droppedFile.arrayBuffer();
            
            // Generate a temporary filename
            const extension = droppedFile.type.split('/')[1] || 'png';
            const tempFilename = `dropped-image-${Date.now()}.${extension}`;
            
            // Save the temporary file
            const tempPath = await saveTemporaryFile(
                this.plugin.app, 
                tempFilename, 
                arrayBuffer
            );
            
            // Get the document manager
            const manager = await this.plugin.managerFactory.getManager(file.path);
            
            // Add image to manager
            return await manager.addImage(tempPath);
        } catch (error) {
            console.error("Error processing dropped image:", error);
            throw error;
        }
    }
    
    /**
     * Download an image from URL
     * @param url Image URL
     * @param file Current file
     * @returns Promise<string> Path to use in markdown
     */
    private async downloadImage(url: string, file: TFile): Promise<string> {
        try {
            // Fetch the image
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            
            // Get image data
            const arrayBuffer = await response.arrayBuffer();
            
            // Generate filename from URL
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            
            // Clean up filename and ensure it has an extension
            let cleanName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
            if (!cleanName.match(/\.(jpe?g|png|gif|bmp|webp|svg)$/i)) {
                // Add default extension based on content type
                const contentType = response.headers.get('content-type') || 'image/png';
                const ext = contentType.split('/')[1] || 'png';
                cleanName += `.${ext}`;
            }
            
            // Save temporary file
            const tempPath = await saveTemporaryFile(
                this.plugin.app, 
                cleanName, 
                arrayBuffer
            );
            
            // Get the document manager
            const manager = await this.plugin.managerFactory.getManager(file.path);
            
            // Add image to manager
            return await manager.addImage(tempPath);
        } catch (error) {
            console.error("Error downloading image:", error);
            throw error;
        }
    }
    
    /**
     * Handle folder drop (recursively process images)
     * Not fully implemented in this version since browser security
     * restrictions prevent accessing folder contents directly
     * @param folder Folder object
     * @param file Current file
     * @returns Promise<string[]> Paths to use in markdown
     */
    private async handleFolderDrop(folder: any, file: TFile): Promise<string[]> {
        // Note: This is a placeholder. In a real implementation with filesystem access,
        // we would recursively process all image files in the folder.
        
        // For browser security reasons, we can't directly access folder contents.
        // Only native apps can access folder contents properly.
        
        new Notice(_T("NOTICE_FOLDER_NOT_SUPPORTED"));
        return [];
    }
} 