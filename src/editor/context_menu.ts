import { Editor, MarkdownView, Menu, MenuItem, Notice, TFile } from "obsidian";
import { _T } from "../lang/helpers";
import ImageManagerPlugin from "../main";
import { saveTemporaryFile } from "../utils/file";
import en from "../lang/locale/en";

// 定义语言键类型
type LangKey = keyof typeof en;

/**
 * Handler for editor context menu
 */
export class ContextMenuHandler {
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
     * Register context menu event handler
     */
    private registerEvent(): void {
        // Register for editor menu events
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('editor-menu', this.handleEditorMenu.bind(this))
        );
    }
    
    /**
     * Handle editor menu event
     * @param menu Menu instance
     * @param editor Editor instance
     * @param view Markdown view
     */
    private async handleEditorMenu(menu: Menu, editor: Editor, view: MarkdownView): Promise<void> {
        // Get the active file
        const file = view.file;
        if (!file) return;
        
        // Skip if not a markdown file
        if (file.extension !== 'md') return;
        
        // Get cursor position and line content
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        // Check if cursor is on an image markdown
        const isImageLine = this.isImageLine(line, cursor.ch);
        
        if (isImageLine) {
            // Add image operations menu items
            this.addImageOperationMenuItems(menu, editor, line, file);
        } else {
            // Add insert image menu item
            menu.addItem((item) => {
                item.setTitle(_T("MENU_INSERT_IMAGE" as LangKey))
                    .setIcon("image")
                    .onClick(() => {
                        this.openInsertImageDialog(editor, file);
                    });
            });
        }
    }
    
    /**
     * Check if the line is an image markdown and cursor is within the image markdown
     * @param line Line content
     * @param cursorCh Cursor position in the line
     * @returns Whether cursor is on an image markdown
     */
    private isImageLine(line: string, cursorCh: number): boolean {
        // Regular expression to match image markdown
        const imageRegex = /!\[.*?\]\((.*?)\)/g;
        let match;
        
        // Check each match
        while ((match = imageRegex.exec(line)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            
            // Check if cursor is within the image markdown
            if (cursorCh >= start && cursorCh <= end) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Add image operation menu items
     * @param menu Menu instance
     * @param editor Editor instance
     * @param line Line content
     * @param file Current file
     */
    private addImageOperationMenuItems(menu: Menu, editor: Editor, line: string, file: TFile): void {
        // Extract image path from markdown
        const imagePath = this.extractImagePath(line);
        if (!imagePath) return;
        
        // Add simple alignment items directly to menu
        const alignmentMenu = menu.addItem((item) => {
            item.setTitle(_T("MENU_ALIGN_LEFT" as LangKey))
                .setIcon("align-left")
                .onClick(() => {
                    this.setImageAlignment(editor, line, "left");
                });
        });
        
        menu.addItem((item) => {
            item.setTitle(_T("MENU_ALIGN_CENTER" as LangKey))
                .setIcon("align-center")
                .onClick(() => {
                    this.setImageAlignment(editor, line, "center");
                });
        });
        
        menu.addItem((item) => {
            item.setTitle(_T("MENU_ALIGN_RIGHT" as LangKey))
                .setIcon("align-right")
                .onClick(() => {
                    this.setImageAlignment(editor, line, "right");
                });
        });
        
        // Add size items
        menu.addItem((item) => {
            item.setTitle(_T("MENU_ZOOM_IN" as LangKey))
                .setIcon("zoom-in")
                .onClick(() => {
                    this.resizeImage(editor, line, 1.25);
                });
        });
        
        menu.addItem((item) => {
            item.setTitle(_T("MENU_ZOOM_OUT" as LangKey))
                .setIcon("zoom-out")
                .onClick(() => {
                    this.resizeImage(editor, line, 0.8);
                });
        });
        
        menu.addItem((item) => {
            item.setTitle(_T("MENU_ZOOM_RESET" as LangKey))
                .setIcon("reset")
                .onClick(() => {
                    this.resetImageSize(editor, line);
                });
        });
        
        // Add add caption item
        menu.addItem((item) => {
            item.setTitle(_T("MENU_ADD_CAPTION" as LangKey))
                .setIcon("text")
                .onClick(() => {
                    this.addCaption(editor, line);
                });
        });
        
        menu.addSeparator();
        
        // Upload/download menu items
        menu.addItem((item) => {
            item.setTitle(_T("MENU_UPLOAD_IMAGE" as LangKey))
                .setIcon("upload")
                .onClick(async () => {
                    await this.uploadImage(editor, line, file);
                });
        });
        
        menu.addItem((item) => {
            item.setTitle(_T("MENU_DOWNLOAD_IMAGE" as LangKey))
                .setIcon("download")
                .onClick(async () => {
                    await this.downloadImage(editor, line, file);
                });
        });
        
        // URL copy menu item (if image is uploaded)
        if (imagePath.startsWith("http")) {
            menu.addItem((item) => {
                item.setTitle(_T("MENU_COPY_URL" as LangKey))
                    .setIcon("link")
                    .onClick(() => {
                        navigator.clipboard.writeText(imagePath);
                        new Notice(_T("NOTICE_URL_COPIED" as LangKey));
                    });
            });
        }
    }
    
    /**
     * Extract image path from markdown
     * @param line Line content
     * @returns Image path or null if not found
     */
    private extractImagePath(line: string): string | null {
        const match = line.match(/!\[.*?\]\((.*?)\)/);
        return match ? match[1] : null;
    }
    
    /**
     * Set image alignment
     * @param editor Editor instance
     * @param line Line content
     * @param alignment Alignment ("left", "center", "right")
     */
    private setImageAlignment(editor: Editor, line: string, alignment: string): void {
        const cursor = editor.getCursor();
        const lineNumber = cursor.line;
        
        // Remove existing alignment style
        let newLine = line.replace(/style="text-align: (left|center|right);"/, "");
        
        // Add new alignment style
        if (!newLine.includes("<div")) {
            newLine = `<div style="text-align: ${alignment};">${newLine}</div>`;
        } else {
            newLine = newLine.replace(/<div(.*?)>/, `<div style="text-align: ${alignment};">`);
        }
        
        // Replace the line
        editor.setLine(lineNumber, newLine);
    }
    
    /**
     * Resize image
     * @param editor Editor instance
     * @param line Line content
     * @param factor Resize factor
     */
    private resizeImage(editor: Editor, line: string, factor: number): void {
        const cursor = editor.getCursor();
        const lineNumber = cursor.line;
        
        // Extract current width if exists
        const widthMatch = line.match(/width="(\d+)"/);
        const currentWidth = widthMatch ? parseInt(widthMatch[1]) : 300; // Default width
        
        // Calculate new width
        const newWidth = Math.round(currentWidth * factor);
        
        // Update or add width attribute
        let newLine = line;
        if (widthMatch) {
            newLine = newLine.replace(/width="\d+"/, `width="${newWidth}"`);
        } else {
            newLine = newLine.replace(/!\[(.*?)\]\((.*?)\)/, `![$1]($2){width=${newWidth}}`);
        }
        
        // Replace the line
        editor.setLine(lineNumber, newLine);
    }
    
    /**
     * Reset image size
     * @param editor Editor instance
     * @param line Line content
     */
    private resetImageSize(editor: Editor, line: string): void {
        const cursor = editor.getCursor();
        const lineNumber = cursor.line;
        
        // Remove width and height attributes
        let newLine = line.replace(/\{.*?\}/, "");
        newLine = newLine.replace(/width="\d+"/, "");
        newLine = newLine.replace(/height="\d+"/, "");
        
        // Replace the line
        editor.setLine(lineNumber, newLine);
    }
    
    /**
     * Add caption to image
     * @param editor Editor instance
     * @param line Line content
     */
    private addCaption(editor: Editor, line: string): void {
        const cursor = editor.getCursor();
        
        // Extract alt text if exists
        const altMatch = line.match(/!\[(.*?)\]/);
        const captionText = altMatch && altMatch[1] ? altMatch[1] : "Image Caption";
        
        // Create figure with caption
        let newLine = line;
        if (newLine.includes("<figure>")) {
            // Update existing figure
            newLine = newLine.replace(/<figcaption>.*?<\/figcaption>/, 
                `<figcaption>${captionText}</figcaption>`);
        } else {
            // Create new figure
            newLine = `<figure>\n${newLine}\n<figcaption>${captionText}</figcaption>\n</figure>`;
        }
        
        // Replace the current line with the new content
        editor.replaceRange(newLine, 
            { line: cursor.line, ch: 0 }, 
            { line: cursor.line, ch: line.length });
    }
    
    /**
     * Upload image
     * @param editor Editor instance
     * @param line Line content
     * @param file Current file
     */
    private async uploadImage(editor: Editor, line: string, file: TFile): Promise<void> {
        // Extract image path
        const imagePath = this.extractImagePath(line);
        if (!imagePath) return;
        
        // Skip if already a URL
        if (imagePath.startsWith("http")) {
            new Notice(_T("NOTICE_ALREADY_URL" as LangKey));
            return;
        }
        
        try {
            // Show processing notification
            new Notice(_T("NOTICE_PROCESSING_UPLOAD" as LangKey));
            
            // Get the document manager
            const manager = await this.plugin.managerFactory.getManager(file.path);
            
            // Get absolute path
            const vault = this.plugin.app.vault;
            const adapter = vault.adapter;
            const basePath = file.parent ? file.parent.path : "";
            const absolutePath = this.plugin.app.vault.getAbstractFileByPath(
                imagePath.startsWith("/") ? imagePath.substring(1) : imagePath
            )?.path || "";
            
            if (!absolutePath || !await adapter.exists(absolutePath)) {
                new Notice(_T("ERROR_FILE_NOT_FOUND" as LangKey));
                return;
            }
            
            // Upload image
            await manager.uploadAllImages();
            
            // Get new markdown
            const newMarkdown = manager.getMarkdownReference(absolutePath);
            
            // Replace in editor
            if (newMarkdown) {
                const cursor = editor.getCursor();
                const lineNumber = cursor.line;
                const newLine = line.replace(/!\[.*?\]\(.*?\)/, newMarkdown);
                editor.setLine(lineNumber, newLine);
            }
            
            new Notice(_T("NOTICE_UPLOAD_SUCCESS" as LangKey));
        } catch (error) {
            console.error("Failed to upload image:", error);
            new Notice(_T("ERROR_UPLOAD_FAILED" as LangKey));
        }
    }
    
    /**
     * Download image
     * @param editor Editor instance
     * @param line Line content
     * @param file Current file
     */
    private async downloadImage(editor: Editor, line: string, file: TFile): Promise<void> {
        // Extract image path
        const imagePath = this.extractImagePath(line);
        if (!imagePath) return;
        
        // Skip if not a URL
        if (!imagePath.startsWith("http")) {
            new Notice(_T("NOTICE_ALREADY_LOCAL" as LangKey));
            return;
        }
        
        try {
            // Show processing notification
            new Notice(_T("NOTICE_PROCESSING_DOWNLOAD" as LangKey));
            
            // Get the document manager
            const manager = await this.plugin.managerFactory.getManager(file.path);
            
            // Download all images (since we can't directly identify which image this is)
            await manager.downloadAllImages();
            
            // Show success notification
            new Notice(_T("NOTICE_DOWNLOAD_SUCCESS" as LangKey));
        } catch (error) {
            console.error("Failed to download image:", error);
            new Notice(_T("ERROR_DOWNLOAD_FAILED" as LangKey));
        }
    }
    
    /**
     * Open insert image dialog
     * @param editor Editor instance
     * @param file Current file
     */
    public openInsertImageDialog(editor: Editor, file: TFile): void {
        // Create and render the modal
        const inputField = document.createElement('input');
        inputField.type = 'file';
        inputField.accept = 'image/*';
        inputField.style.display = 'none';
        document.body.appendChild(inputField);
        
        // Set up file selection handler
        inputField.addEventListener('change', async () => {
            try {
                if (!inputField.files || inputField.files.length === 0) return;
                
                const selectedFile = inputField.files[0];
                
                // Check if it's an image
                if (!selectedFile.type.startsWith('image/')) {
                    new Notice(_T("ERROR_UNSUPPORTED_FILE" as LangKey));
                    return;
                }
                
                // Show processing notification
                new Notice(_T("NOTICE_PROCESSING_IMAGE" as LangKey));
                
                // Read file content
                const arrayBuffer = await selectedFile.arrayBuffer();
                
                // Generate a temporary filename
                const extension = selectedFile.type.split('/')[1] || 'png';
                const tempFilename = `inserted-image-${Date.now()}.${extension}`;
                
                // Save the temporary file
                const tempPath = await saveTemporaryFile(
                    this.plugin.app,
                    tempFilename,
                    arrayBuffer
                );
                
                // Get the document manager for this file
                const manager = await this.plugin.managerFactory.getManager(file.path);
                
                // Add image to manager
                const imagePath = await manager.addImage(tempPath);
                
                // Insert markdown at cursor position
                if (imagePath) {
                    const markdown = `![](${imagePath})`;
                    editor.replaceSelection(markdown);
                    
                    // Show success notification
                    new Notice(_T("NOTICE_IMAGE_INSERTED" as LangKey));
                }
            } catch (error) {
                console.error("Failed to insert image:", error);
                new Notice(_T("ERROR_PROCESS_INSERT" as LangKey));
            } finally {
                // Clean up
                document.body.removeChild(inputField);
            }
        });
        
        // Open file dialog
        inputField.click();
    }
} 