import { Editor, MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { PasteHandler } from "./paste_handler";
import { DropHandler } from "./drop_handler";
import { ContextMenuHandler } from "./context_menu";
import { ImageFormatter } from "./image_formatter";
import { InputCompletionHandler } from "./input_completion_handler";
import { _T } from "../lang/helpers";
import ImageManagerPlugin from "../main";

/**
 * Main editor module that integrates all handlers
 */
export class EditorModule {
    private plugin: ImageManagerPlugin;
    private pasteHandler: PasteHandler;
    private dropHandler: DropHandler;
    private contextMenuHandler: ContextMenuHandler;
    private imageFormatter: ImageFormatter;
    private inputCompletionHandler: InputCompletionHandler;
    
    /**
     * Constructor
     * @param plugin Plugin instance
     */
    constructor(plugin: ImageManagerPlugin) {
        this.plugin = plugin;
        
        // Initialize handlers
        this.pasteHandler = new PasteHandler(plugin);
        this.dropHandler = new DropHandler(plugin);
        this.contextMenuHandler = new ContextMenuHandler(plugin);
        this.imageFormatter = new ImageFormatter(plugin);
        this.inputCompletionHandler = new InputCompletionHandler(plugin);
        
        // Register command palette commands
        this.registerCommands();
    }
    
    /**
     * Register commands in command palette
     */
    private registerCommands(): void {
        // Format image commands
        this.plugin.addCommand({
            id: 'align-image-left',
            name: '将图像左对齐',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.formatImage("align-left", editor, view);
            }
        });
        
        this.plugin.addCommand({
            id: 'align-image-center',
            name: '将图像居中对齐',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.formatImage("align-center", editor, view);
            }
        });
        
        this.plugin.addCommand({
            id: 'align-image-right',
            name: '将图像右对齐',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.formatImage("align-right", editor, view);
            }
        });
        
        this.plugin.addCommand({
            id: 'zoom-image-in',
            name: '放大图像',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.formatImage("zoom-in", editor, view);
            }
        });
        
        this.plugin.addCommand({
            id: 'zoom-image-out',
            name: '缩小图像',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.formatImage("zoom-out", editor, view);
            }
        });
        
        this.plugin.addCommand({
            id: 'reset-image-size',
            name: '重置图像大小',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.formatImage("reset-size", editor, view);
            }
        });
        
        this.plugin.addCommand({
            id: 'add-image-caption',
            name: '添加图像标题',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.formatImage("add-caption", editor, view);
            }
        });
        
        // Add insert image command
        this.plugin.addCommand({
            id: 'insert-image',
            name: '插入图像',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                if (!view.file) return;
                this.contextMenuHandler.openInsertImageDialog(editor, view.file);
            }
        });
        
        // Add upload all images command
        this.plugin.addCommand({
            id: 'upload-all-images',
            name: '上传所有图像',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                if (!view.file) return;
                await this.uploadAllImages(view.file);
            }
        });
        
        // Add download all images command
        this.plugin.addCommand({
            id: 'download-all-images',
            name: '下载所有图像',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                if (!view.file) return;
                await this.downloadAllImages(view.file);
            }
        });
    }
    
    /**
     * Format an image by applying the specified operation
     * @param operation Operation to apply (align-left, align-center, align-right, zoom-in, zoom-out, reset-size, etc.)
     * @param editor Editor instance
     * @param view Markdown view
     * @returns Success status
     */
    public formatImage(operation: string, editor: Editor, view: MarkdownView): boolean {
        if (!editor || !view) {
            new Notice(_T("ERROR_NO_ACTIVE_EDITOR"));
            return false;
        }
        
        let success = false;
        
        // Apply the specified operation
        switch (operation) {
            case "align-left":
                success = this.imageFormatter.alignImage(editor, "left");
                break;
            case "align-center":
                success = this.imageFormatter.alignImage(editor, "center");
                break;
            case "align-right":
                success = this.imageFormatter.alignImage(editor, "right");
                break;
            case "zoom-in":
                success = this.imageFormatter.resizeImage(editor, 1.25);
                break;
            case "zoom-out":
                success = this.imageFormatter.resizeImage(editor, 0.8);
                break;
            case "reset-size":
                success = this.imageFormatter.resetImageSize(editor);
                break;
            case "add-caption":
                success = this.promptAndAddCaption(editor);
                break;
            case "make-responsive":
                success = this.imageFormatter.makeResponsive(editor);
                break;
            case "filter-grayscale":
                success = this.imageFormatter.applyFilter(editor, "grayscale", 100);
                break;
            case "filter-sepia":
                success = this.imageFormatter.applyFilter(editor, "sepia", 70);
                break;
            case "filter-blur":
                success = this.imageFormatter.applyFilter(editor, "blur", 3);
                break;
            case "filter-brightness":
                success = this.imageFormatter.applyFilter(editor, "brightness", 120);
                break;
            case "filter-contrast":
                success = this.imageFormatter.applyFilter(editor, "contrast", 120);
                break;
            default:
                new Notice(_T("ERROR_UNSUPPORTED_OPERATION"));
                return false;
        }
        
        if (success) {
            new Notice(_T("NOTICE_IMAGE_FORMATTED"));
        } else {
            new Notice(_T("ERROR_NO_IMAGE_SELECTED"));
        }
        
        return success;
    }
    
    /**
     * Prompt user for a caption and add it to the image
     * @param editor Editor instance
     * @returns Success status
     */
    private promptAndAddCaption(editor: Editor): boolean {
        // In a real implementation, we would show a modal dialog to get the caption
        // For simplicity, we'll just use a fixed caption here
        const caption = "图像标题";
        return this.imageFormatter.captionImage(editor, caption);
    }
    
    /**
     * Upload all images in a document
     * @param file Current file
     */
    public async uploadAllImages(file: TFile): Promise<void> {
        try {
            // Show processing notification
            new Notice(_T("NOTICE_PROCESSING_UPLOAD"));
            
            // Get the document manager
            const manager = await this.plugin.managerFactory.getManager(file.path);
            
            // Upload all images
            const success = await manager.uploadAllImages();
            
            // Show result notification
            if (success) {
                new Notice(_T("NOTICE_UPLOAD_SUCCESS"));
            } else {
                new Notice(_T("ERROR_UPLOAD_FAILED"));
            }
        } catch (error) {
            console.error("Failed to upload images:", error);
            new Notice(_T("ERROR_UPLOAD_FAILED"));
        }
    }
    
    /**
     * Download all images in a document
     * @param file Current file
     */
    public async downloadAllImages(file: TFile): Promise<void> {
        try {
            // Show processing notification
            new Notice(_T("NOTICE_PROCESSING_DOWNLOAD"));
            
            // Get the document manager
            const manager = await this.plugin.managerFactory.getManager(file.path);
            
            // Download all images
            const success = await manager.downloadAllImages();
            
            // Show result notification
            if (success) {
                new Notice(_T("NOTICE_DOWNLOAD_SUCCESS"));
            } else {
                new Notice(_T("ERROR_DOWNLOAD_FAILED"));
            }
        } catch (error) {
            console.error("Failed to download images:", error);
            new Notice(_T("ERROR_DOWNLOAD_FAILED"));
        }
    }
    
    /**
     * Get the image formatter instance
     * @returns Image formatter instance
     */
    public getImageFormatter(): ImageFormatter {
        return this.imageFormatter;
    }
    
    /**
     * Check if the cursor is on an image
     * @param editor Editor instance
     * @returns Whether cursor is on an image
     */
    public isCursorOnImage(editor: Editor): boolean {
        if (!editor) return false;
        
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        return this.imageFormatter.isImageLine(line);
    }
    
    /**
     * Extract image path from current line
     * @param editor Editor instance
     * @returns Image path or null if not found
     */
    public getImagePathAtCursor(editor: Editor): string | null {
        if (!editor) return null;
        
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        return this.imageFormatter.extractImagePath(line);
    }
} 