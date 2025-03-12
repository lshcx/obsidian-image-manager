import { Editor, MarkdownView, Notice, TFile } from "obsidian";
import { _T } from "../lang/helpers";
import ImageManagerPlugin from "../main";
import { saveTemporaryFile } from "../utils/file";
import { arrayBufferToBase64, blobToDataURL } from "../utils/converter";

/**
 * Handler for image pasting from clipboard
 */
export class PasteHandler {
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
     * Register paste event handler
     */
    private registerEvent(): void {
        // Register the paste event handler
        this.plugin.registerEvent(
            this.plugin.app.workspace.on("editor-paste", this.handlePaste.bind(this))
        );
    }
    
    /**
     * Handle paste event
     * @param evt Clipboard event
     * @param editor Editor instance
     * @param view Markdown view
     * @returns Promise<boolean> Whether the event was handled
     */
    private async handlePaste(evt: ClipboardEvent, editor: Editor, view: MarkdownView): Promise<boolean> {
        // Ensure we have clipboard data and a valid markdown view
        if (!evt.clipboardData || !view || !view.file) {
            return false;
        }
        
        // Check for image first (highest priority)
        if (await this.handleImagePaste(evt, editor, view.file)) {
            evt.preventDefault();
            return true;
        }
        
        // Check for image URL or local path
        if (await this.handleImagePathPaste(evt, editor, view.file)) {
            evt.preventDefault();
            return true;
        }
        
        // Check for markdown with image
        if (await this.handleMarkdownPaste(evt, editor, view.file)) {
            evt.preventDefault();
            return true;
        }
        
        // Not handled, let Obsidian's default handler process it
        return false;
    }
    
    /**
     * Handle pasting of images from clipboard
     * @param evt Clipboard event
     * @param editor Editor instance
     * @param file Current file
     * @returns Promise<boolean> Whether an image was processed
     */
    private async handleImagePaste(evt: ClipboardEvent, editor: Editor, file: TFile): Promise<boolean> {
        // Check if there are any image items in the clipboard
        const items = Array.from(evt.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        
        if (!imageItem) {
            return false;
        }
        
        try {
            // Show processing notification
            new Notice(_T("NOTICE_PROCESSING_IMAGE"));
            
            // Get image as blob
            const blob = imageItem.getAsFile();
            if (!blob) {
                return false;
            }
            
            // Process the image
            await this.processImage(blob, editor, file);
            
            // Show success notification
            new Notice(_T("NOTICE_IMAGE_PASTED"));
            return true;
        } catch (error) {
            // Log and show error
            console.error("Failed to process pasted image:", error);
            new Notice(_T("ERROR_PROCESS_PASTE"));
            return true; // We handled it, even though it failed
        }
    }
    
    /**
     * Handle pasting of image paths or URLs
     * @param evt Clipboard event
     * @param editor Editor instance
     * @param file Current file
     * @returns Promise<boolean> Whether an image path was processed
     */
    private async handleImagePathPaste(evt: ClipboardEvent, editor: Editor, file: TFile): Promise<boolean> {
        // Check if there's text content
        const text = evt.clipboardData?.getData('text/plain') || '';
        if (!text) {
            return false;
        }
        
        // Check if it's an image URL (http/https) with image extension
        const isWebUrl = /^https?:\/\/.*\.(jpe?g|png|gif|bmp|webp|svg)(\?.*)?$/i.test(text);
        
        // Check if it's a local file path with image extension
        const isLocalPath = /^(\/|\\|[A-Za-z]:\\).*\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(text);
        
        // Check if it's a data URL for an image
        const isDataUrl = /^data:image\/(jpeg|png|gif|bmp|webp|svg\+xml);base64,/.test(text);
        
        if (isWebUrl || isLocalPath || isDataUrl) {
            try {
                // Show processing notification
                new Notice(_T("NOTICE_PROCESSING_PATH"));
                
                // Handle web URLs
                if (isWebUrl) {
                    await this.handleImageUrl(text, editor, file);
                    return true;
                }
                
                // Handle local paths
                if (isLocalPath) {
                    await this.handleLocalImagePath(text, editor, file);
                    return true;
                }
                
                // Handle data URLs
                if (isDataUrl) {
                    await this.handleDataUrl(text, editor, file);
                    return true;
                }
                
                return true;
            } catch (error) {
                // Log and show error
                console.error("Failed to process image path:", error);
                new Notice(_T("ERROR_PROCESS_PATH"));
                return true; // We handled it, even though it failed
            }
        }
        
        return false;
    }
    
    /**
     * Handle pasting of markdown text that may contain images
     * @param evt Clipboard event
     * @param editor Editor instance
     * @param file Current file
     * @returns Promise<boolean> Whether markdown with images was processed
     */
    private async handleMarkdownPaste(evt: ClipboardEvent, editor: Editor, file: TFile): Promise<boolean> {
        // Check if there's text content
        const text = evt.clipboardData?.getData('text/plain') || '';
        if (!text) {
            return false;
        }
        
        // Check if it contains markdown image syntax
        const imageRegex = /!\[.*?\]\((.*?)\)/g;
        let match;
        let hasImages = false;
        let modifiedText = text;
        
        // Look for image markdown syntax
        while ((match = imageRegex.exec(text)) !== null) {
            hasImages = true;
            const imagePath = match[1];
            
            // Handle image path based on type
            if (imagePath.startsWith('http')) {
                // Download web image and get local path
                try {
                    const localPath = await this.downloadImage(imagePath, file);
                    if (localPath) {
                        // Replace URL with local path in markdown
                        modifiedText = modifiedText.replace(
                            new RegExp(`!\\[.*?\\]\\(${this.escapeRegExp(imagePath)}\\)`, 'g'),
                            `![](${localPath})`
                        );
                    }
                } catch (error) {
                    console.error("Failed to download image:", error);
                    // Keep original path if download fails
                }
            }
        }
        
        if (hasImages) {
            // Insert the possibly modified markdown
            editor.replaceSelection(modifiedText);
            return true;
        }
        
        return false;
    }
    
    /**
     * Download an image from URL
     * @param url Image URL
     * @param file Current file
     * @returns Promise<string> Local path to the downloaded image
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
     * Handle an image URL paste
     * @param url Image URL
     * @param editor Editor instance
     * @param file Current file
     */
    private async handleImageUrl(url: string, editor: Editor, file: TFile): Promise<void> {
        // Download the image
        const localPath = await this.downloadImage(url, file);
        
        // Insert markdown at cursor position
        if (localPath) {
            const markdown = `![](${localPath})`;
            editor.replaceSelection(markdown);
            
            // Show success notification
            new Notice(_T("NOTICE_URL_PROCESSED"));
        }
    }
    
    /**
     * Handle a local image path paste
     * @param path Local image path
     * @param editor Editor instance
     * @param file Current file
     */
    private async handleLocalImagePath(path: string, editor: Editor, file: TFile): Promise<void> {
        try {
            // For security reasons, we can't directly access local file system in web context
            // We'll show a notice to instruct user to drag and drop instead
            new Notice(_T("NOTICE_USE_DRAGDROP"));
            
            // In a real implementation, if running as a desktop app with file access,
            // we would read the file and process it similarly to handleImageUrl
            
            // For this implementation, we'll just insert the path as plain text
            editor.replaceSelection(`![](${path})`);
        } catch (error) {
            console.error("Error handling local path:", error);
            throw error;
        }
    }
    
    /**
     * Handle a data URL paste
     * @param dataUrl Image data URL
     * @param editor Editor instance
     * @param file Current file
     */
    private async handleDataUrl(dataUrl: string, editor: Editor, file: TFile): Promise<void> {
        try {
            // Extract base64 data
            const matches = dataUrl.match(/^data:image\/(.*?);base64,(.*)$/);
            if (!matches || matches.length < 3) {
                throw new Error("Invalid data URL format");
            }
            
            const imageType = matches[1];
            const base64Data = matches[2];
            
            // Convert to array buffer
            const arrayBuffer = this.base64ToArrayBuffer(base64Data);
            
            // Generate filename
            const filename = `pasted-image-${Date.now()}.${imageType.replace('jpeg', 'jpg')}`;
            
            // Save temporary file
            const tempPath = await saveTemporaryFile(
                this.plugin.app, 
                filename, 
                arrayBuffer
            );
            
            // Get the document manager
            const manager = await this.plugin.managerFactory.getManager(file.path);
            
            // Add image to manager
            const imagePath = await manager.addImage(tempPath);
            
            // Insert markdown at cursor position
            if (imagePath) {
                const markdown = `![](${imagePath})`;
                editor.replaceSelection(markdown);
                
                // Show success notification
                new Notice(_T("NOTICE_DATA_URL_PROCESSED"));
            }
        } catch (error) {
            console.error("Error handling data URL:", error);
            throw error;
        }
    }
    
    /**
     * Convert base64 string to array buffer
     * @param base64 Base64 string
     * @returns ArrayBuffer
     */
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    /**
     * Process an image blob
     * @param blob Image blob
     * @param editor Editor instance
     * @param file Current file
     */
    private async processImage(blob: Blob, editor: Editor, file: TFile): Promise<void> {
        // Convert blob to array buffer
        const arrayBuffer = await blob.arrayBuffer();
        
        // Generate a temporary filename
        const extension = blob.type.split('/')[1] || 'png';
        const tempFilename = `pasted-image-${Date.now()}.${extension}`;
        
        // Save the temporary file
        const tempPath = await saveTemporaryFile(
            this.plugin.app, 
            tempFilename, 
            arrayBuffer
        );
        
        // Get the document manager
        const manager = await this.plugin.managerFactory.getManager(file.path);
        
        // Add image to manager
        const imagePath = await manager.addImage(tempPath);
        
        // Insert markdown at cursor position
        if (imagePath) {
            const markdown = `![](${imagePath})`;
            editor.replaceSelection(markdown);
        }
    }
    
    /**
     * Escape regex special characters in a string
     * @param string String to escape
     * @returns Escaped string
     */
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
} 