import { Editor, MarkdownView, Notice, TFile } from "obsidian";
import { _T } from "../lang/helpers";
import ImageManagerPlugin from "../main";
import { saveTemporaryFile } from "../utils/file";
import en from "../lang/locale/en";

// 定义语言键类型
type LangKey = keyof typeof en;

/**
 * Handler for automatic image input completion
 */
export class InputCompletionHandler {
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
     * Register input completion events
     */
    private registerEvent(): void {
        // Register for editor change events
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('editor-change', this.handleEditorChange.bind(this))
        );
    }
    
    /**
     * Handle editor change event
     * @param editor Editor instance
     * @param markdownView Markdown view
     */
    private handleEditorChange(editor: Editor, markdownView: MarkdownView): void {
        if (!editor || !markdownView) return;
        
        // Get cursor position
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        // Check if this is potentially an image markdown syntax
        this.checkForImageSyntax(editor, markdownView, line, cursor);
    }
    
    /**
     * Check if the current line contains an incomplete image syntax
     * @param editor Editor instance
     * @param view Markdown view
     * @param line Current line content
     * @param cursor Cursor position
     */
    private checkForImageSyntax(editor: Editor, view: MarkdownView, line: string, cursor: any): void {
        // Only process if we have a file
        if (!view.file) return;
        
        // Check for image pattern - looking for ![, possibly with a description, but without the closing ]( or with incomplete ](
        const imageStartRegex = /!\[(.*?)\](?:\(([^)]*)\))?$/;
        const match = line.substring(0, cursor.ch).match(imageStartRegex);
        
        if (match) {
            // Check if we already have a complete image syntax with closing parenthesis
            const hasClosingParen = match[0].includes(')');
            
            // If we have ![...] but no (, or ![...]( but no ), we should offer completion
            if (!hasClosingParen || (match[2] !== undefined && !match[0].endsWith(')'))) {
                this.offerImageCompletion(editor, view.file, match[0], cursor);
            }
        }
    }
    
    /**
     * Offer image completion UI
     * @param editor Editor instance
     * @param file Current file
     * @param partialSyntax Partial image syntax
     * @param cursor Cursor position
     */
    private offerImageCompletion(editor: Editor, file: TFile, partialSyntax: string, cursor: any): void {
        // This would normally create a custom UI element to help with path selection
        // For this implementation, we'll use a simpler approach
        
        // Check if we already have a marker for this position
        const existingMarker = this.findExistingMarker(editor, cursor);
        if (existingMarker) return; // Don't add multiple markers
        
        // Add a "marker" in the editor to indicate the completion option
        this.addCompletionMarker(editor, cursor);
        
        // Instead of attaching to the CM instance directly, we'll show a dialog
        this.showImageSelectionDialog(editor, file, cursor);
    }
    
    /**
     * Find if there's already a completion marker at this position
     * @param editor Editor instance
     * @param cursor Cursor position
     * @returns Whether a marker exists
     */
    private findExistingMarker(editor: Editor, cursor: any): boolean {
        // In a real implementation, we would track markers by position
        // For demonstration purposes, we'll use a simple check
        
        // Get markers array or initialize it
        const markers = (editor as any)._imageCompletionMarkers || [];
        
        // Check if we have a marker at this position
        return markers.some((m: any) => 
            m.line === cursor.line && 
            m.ch === cursor.ch
        );
    }
    
    /**
     * Add a completion marker at cursor position
     * @param editor Editor instance
     * @param cursor Cursor position
     */
    private addCompletionMarker(editor: Editor, cursor: any): void {
        // In a real implementation, we would add a UI element and store a reference
        // For demonstration purposes, we'll just store the position
        
        // Get markers array or initialize it
        if (!(editor as any)._imageCompletionMarkers) {
            (editor as any)._imageCompletionMarkers = [];
        }
        
        // Add marker position
        (editor as any)._imageCompletionMarkers.push({
            line: cursor.line,
            ch: cursor.ch
        });
        
        // In a real implementation, we would create and position a DOM element
        // We would also add event listeners to handle interactions
    }
    
    /**
     * Show image selection dialog
     * @param editor Editor instance
     * @param file Current file
     * @param cursor Cursor position
     */
    private showImageSelectionDialog(editor: Editor, file: TFile, cursor: any): void {
        // Create input field for file selection
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
                
                // Complete the image markdown
                if (imagePath) {
                    const markdown = `![](${imagePath})`;
                    // Replace the partial syntax at cursor
                    const currentLine = editor.getLine(cursor.line);
                    const beforePartial = currentLine.substring(0, cursor.ch - 2); // -2 to remove the '!['
                    const afterPartial = currentLine.substring(cursor.ch);
                    const newLine = beforePartial + markdown + afterPartial;
                    editor.setLine(cursor.line, newLine);
                    
                    // Set cursor after the inserted markdown
                    editor.setCursor({
                        line: cursor.line,
                        ch: beforePartial.length + markdown.length
                    });
                    
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