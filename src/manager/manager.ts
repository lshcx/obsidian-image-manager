import { App } from "obsidian";
import { DocumentImageManager, IDocumentImageManager } from "./document_manager";
import ImageManagerPlugin from "../main";

/**
 * Manager factory for creating and managing document image managers
 */
export class ImageManagerFactory {
    private plugin: ImageManagerPlugin;
    private managers: Map<string, IDocumentImageManager>;
    
    /**
     * Constructor
     * @param plugin Plugin instance
     */
    constructor(plugin: ImageManagerPlugin) {
        this.plugin = plugin;
        this.managers = new Map();
    }
    
    /**
     * Get or create a document image manager
     * @param mdPath Document path
     * @returns Document image manager
     */
    async getManager(mdPath: string): Promise<IDocumentImageManager> {
        // Check if manager already exists
        if (this.managers.has(mdPath)) {
            return this.managers.get(mdPath)!;
        }
        
        // Create new manager
        const manager = new DocumentImageManager(
            this.plugin.app,
            this.plugin.settings,
            this.plugin.uploader,
            mdPath
        );
        
        // Load existing data if available
        await manager.loadFromJson();
        
        // Store manager
        this.managers.set(mdPath, manager);
        
        return manager;
    }
    
    /**
     * Remove a document image manager
     * @param mdPath Document path
     */
    removeManager(mdPath: string): void {
        this.managers.delete(mdPath);
    }
    
    /**
     * Rename a document image manager
     * @param oldPath Old document path
     * @param newPath New document path
     * @returns Whether renaming was successful
     */
    async renameManager(oldPath: string, newPath: string): Promise<boolean> {
        // Check if manager exists
        if (!this.managers.has(oldPath)) {
            return false;
        }
        
        // Get manager
        const manager = this.managers.get(oldPath)!;
        
        // Rename image folder
        const success = await manager.renameImageFolder(newPath);
        
        if (success) {
            // Store manager with new path
            this.managers.set(newPath, manager);
            
            // Remove old manager
            this.managers.delete(oldPath);
        }
        
        return success;
    }
    
    /**
     * Get all document image managers
     * @returns Array of document image managers
     */
    getAllManagers(): IDocumentImageManager[] {
        return Array.from(this.managers.values());
    }
} 