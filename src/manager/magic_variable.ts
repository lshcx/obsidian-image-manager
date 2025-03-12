import { App, TFile, Notice } from "obsidian";
import { _T } from "../lang/helpers";

/**
 * Interface for magic variable context
 */
export interface IMagicVariableContext {
    /**
     * Filename without extension
     */
    filename?: string;
    
    /**
     * Document title
     */
    title?: string;
    
    /**
     * Workspace name
     */
    workspace?: string;
    
    /**
     * Date in YYYY-MM-DD format
     */
    date?: string;
    
    /**
     * Time in HHMMSS format (no separators)
     */
    time?: string;
    
    /**
     * Random string
     */
    random?: string;
    
    /**
     * Other custom variables
     */
    [key: string]: string | undefined;
}

/**
 * Magic variable processor
 */
export class MagicVariableProcessor {
    private app: App;
    
    /**
     * Constructor
     * @param app Obsidian app instance
     */
    constructor(app: App) {
        this.app = app;
    }
    
    /**
     * Get current context
     * @param filePath File path
     * @returns Magic variable context
     */
    getContext(filePath: string): IMagicVariableContext {
        const context: IMagicVariableContext = {};
        
        try {
            // Get file object
            const file = this.app.vault.getAbstractFileByPath(filePath);
            
            if (file instanceof TFile) {
                // Extract filename without extension
                const filename = file.basename;
                context.filename = filename;

                // Title defaults to filename
                context.title = filename;

                // Workspace name
                context.workspace = this.app.vault.getName();
            }
            
            // Date and time related variables
            const now = new Date();
            
            // Date format: YYYY-MM-DD
            context.date = now.toISOString().split('T')[0];
            
            // Time format: HHMMSS (no separators)
            context.time = now.toTimeString()
                .split(' ')[0]
                .replace(/:/g, '');
            
            // Random string (8 characters)
            context.random = Math.random().toString(36).substring(2, 10);
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_CONTEXT_GENERATION") + error);
            console.error(_T("ERROR_CONTEXT_GENERATION"), error);
        }
        
        return context;
    }
    
    /**
     * Process magic variables in a template string
     * @param template Template string containing magic variables
     * @param context Magic variable context
     * @returns Processed string
     */
    process(template: string, context: IMagicVariableContext): string {
        if (!template) return "";
        
        try {
            // Replace all magic variables using regex
            // Format: {{variable}}
            return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
                // Check if variable exists in context
                if (variable in context && context[variable] !== undefined) {
                    return context[variable] as string;
                }
                
                // If variable doesn't exist, keep original content
                return match;
            });
        } catch (error) {
            // Notice error
            new Notice(_T("ERROR_VARIABLE_PROCESSING") + error);
            console.error(_T("ERROR_VARIABLE_PROCESSING"), error);
            return template;
        }
    }
} 