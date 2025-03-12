import { Editor, MarkdownView, Notice } from "obsidian";
import { _T } from "../lang/helpers";
import ImageManagerPlugin from "../main";
import en from "../lang/locale/en";

// 定义语言键类型
type LangKey = keyof typeof en;

/**
 * Helper class for image formatting operations
 */
export class ImageFormatter {
    private plugin: ImageManagerPlugin;
    
    /**
     * Constructor
     * @param plugin Plugin instance
     */
    constructor(plugin: ImageManagerPlugin) {
        this.plugin = plugin;
    }
    
    /**
     * Align image in editor
     * @param editor Editor instance
     * @param alignment Alignment type (left, center, right)
     * @returns Success status
     */
    public alignImage(editor: Editor, alignment: string): boolean {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        // Check if cursor is on an image
        if (!this.isImageLine(line)) {
            return false;
        }
        
        // Remove existing alignment style
        let newLine = line.replace(/style="text-align: (left|center|right);"/, "");
        
        // Add new alignment style
        if (!newLine.includes("<div")) {
            newLine = `<div style="text-align: ${alignment};">${newLine}</div>`;
        } else {
            newLine = newLine.replace(/<div(.*?)>/, `<div style="text-align: ${alignment};">`);
        }
        
        // Replace the line
        editor.setLine(cursor.line, newLine);
        return true;
    }
    
    /**
     * Resize image in editor
     * @param editor Editor instance
     * @param factor Resize factor
     * @returns Success status
     */
    public resizeImage(editor: Editor, factor: number): boolean {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        // Check if cursor is on an image
        if (!this.isImageLine(line)) {
            return false;
        }
        
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
        editor.setLine(cursor.line, newLine);
        return true;
    }
    
    /**
     * Reset image size
     * @param editor Editor instance
     * @returns Success status
     */
    public resetImageSize(editor: Editor): boolean {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        // Check if cursor is on an image
        if (!this.isImageLine(line)) {
            return false;
        }
        
        // Remove width and height attributes
        let newLine = line.replace(/\{.*?\}/, "");
        newLine = newLine.replace(/width="\d+"/, "");
        newLine = newLine.replace(/height="\d+"/, "");
        
        // Replace the line
        editor.setLine(cursor.line, newLine);
        return true;
    }
    
    /**
     * Add caption to image
     * @param editor Editor instance
     * @param caption Caption text
     * @returns Success status
     */
    public captionImage(editor: Editor, caption: string): boolean {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        // Check if cursor is on an image
        if (!this.isImageLine(line)) {
            return false;
        }
        
        // Create figure with caption
        let newLine = line;
        if (newLine.includes("<figure>")) {
            // Update existing figure
            newLine = newLine.replace(/<figcaption>.*?<\/figcaption>/, 
                `<figcaption>${caption}</figcaption>`);
        } else {
            // Create new figure
            newLine = `<figure>\n${newLine}\n<figcaption>${caption}</figcaption>\n</figure>`;
        }
        
        // Replace the current line with the new content
        editor.replaceRange(newLine, 
            { line: cursor.line, ch: 0 }, 
            { line: cursor.line, ch: line.length });
        return true;
    }
    
    /**
     * Apply CSS filter to image
     * @param editor Editor instance
     * @param filterType Filter type (grayscale, sepia, blur, etc.)
     * @param value Filter value
     * @returns Success status
     */
    public applyFilter(editor: Editor, filterType: string, value: number): boolean {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        // Check if cursor is on an image
        if (!this.isImageLine(line)) {
            return false;
        }
        
        // Format filter value based on type
        let filterValue = `${value}`;
        if (filterType === "blur") {
            filterValue = `${value}px`;
        } else if (filterType !== "opacity") {
            filterValue = `${value}%`;
        }
        
        // Create filter style
        const filterStyle = `filter: ${filterType}(${filterValue});`;
        
        // Update or add style attribute
        let newLine = line;
        if (newLine.match(/style="[^"]*filter:/)) {
            // Replace existing filter
            newLine = newLine.replace(/filter:[^;]*;/, filterStyle);
        } else if (newLine.match(/style="[^"]*"/)) {
            // Add filter to existing style
            newLine = newLine.replace(/style="([^"]*)"/, `style="$1 ${filterStyle}"`);
        } else if (newLine.includes("<img")) {
            // Add style to img tag
            newLine = newLine.replace(/<img/, `<img style="${filterStyle}"`);
        } else {
            // Convert markdown to html with style
            const imgMatch = newLine.match(/!\[(.*?)\]\((.*?)\)/);
            if (imgMatch) {
                const alt = imgMatch[1] || "";
                const src = imgMatch[2] || "";
                newLine = newLine.replace(/!\[(.*?)\]\((.*?)\)/, 
                    `<img src="${src}" alt="${alt}" style="${filterStyle}">`);
            }
        }
        
        // Replace the line
        editor.setLine(cursor.line, newLine);
        return true;
    }
    
    /**
     * Make image responsive
     * @param editor Editor instance
     * @returns Success status
     */
    public makeResponsive(editor: Editor): boolean {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        // Check if cursor is on an image
        if (!this.isImageLine(line)) {
            return false;
        }
        
        // Add responsive class
        let newLine = line;
        if (newLine.includes("<img") && !newLine.includes("class=")) {
            // Add class to img tag
            newLine = newLine.replace(/<img/, `<img class="responsive-image"`);
        } else if (newLine.includes("<img") && newLine.includes("class=")) {
            // Add to existing class
            newLine = newLine.replace(/class="([^"]*)"/, `class="$1 responsive-image"`);
        } else {
            // Convert markdown to html with class
            const imgMatch = newLine.match(/!\[(.*?)\]\((.*?)\)/);
            if (imgMatch) {
                const alt = imgMatch[1] || "";
                const src = imgMatch[2] || "";
                newLine = newLine.replace(/!\[(.*?)\]\((.*?)\)/, 
                    `<img src="${src}" alt="${alt}" class="responsive-image">`);
            }
        }
        
        // Replace the line
        editor.setLine(cursor.line, newLine);
        return true;
    }
    
    /**
     * Check if a line contains an image in markdown or html
     * @param line Line content
     * @returns Whether line contains an image
     */
    public isImageLine(line: string): boolean {
        // Check for markdown image syntax
        const markdownMatch = line.match(/!\[.*?\]\(.*?\)/);
        if (markdownMatch) return true;
        
        // Check for HTML image tag
        const htmlMatch = line.match(/<img.*?>/);
        if (htmlMatch) return true;
        
        return false;
    }
    
    /**
     * Extract image path from markdown or html
     * @param line Line content
     * @returns Image path or null if not found
     */
    public extractImagePath(line: string): string | null {
        // Check for markdown image syntax
        const markdownMatch = line.match(/!\[.*?\]\((.*?)\)/);
        if (markdownMatch) return markdownMatch[1];
        
        // Check for HTML image tag
        const htmlMatch = line.match(/<img.*?src="(.*?)".*?>/);
        if (htmlMatch) return htmlMatch[1];
        
        return null;
    }
} 