/**
 * Interface for image information storage
 */
export interface IImageInfo {
    /**
     * Local path of the image (relative to Obsidian vault root)
     */
    localPath: string;
    
    /**
     * Remote path of the image (URL after upload)
     * Empty string if not uploaded
     */
    remotePath: string;
    
    /**
     * Whether the image has been uploaded
     */
    isUploaded: boolean;
    
    /**
     * Image width in pixels
     * Optional property for display
     */
    width?: number;
    
    /**
     * Image height in pixels
     * Optional property for display
     */
    height?: number;
    
    /**
     * Image alignment
     * Possible values: "left", "center", "right"
     */
    align?: string;
    
    /**
     * Original filename (without path)
     */
    originalName?: string;
    
    /**
     * Image size in bytes
     */
    size?: number;
    
    /**
     * Image creation timestamp
     */
    createTime?: number;
    
    /**
     * Image last modification timestamp
     */
    modifyTime?: number;
}

/**
 * Create an image info object
 * @param localPath Local path of the image
 * @param remotePath Remote path of the image
 * @param isUploaded Whether the image has been uploaded
 * @returns Image info object
 */
export function createImageInfo(
    localPath: string, 
    remotePath: string = "", 
    isUploaded: boolean = false
): IImageInfo {
    return {
        localPath,
        remotePath,
        isUploaded,
        createTime: Date.now(),
        modifyTime: Date.now(),
    };
}

/**
 * Enum for image operation types
 */
export enum ImageOperationType {
    /**
     * Add image
     */
    Add = "add",
    
    /**
     * Remove image
     */
    Remove = "remove",
    
    /**
     * Upload image
     */
    Upload = "upload",
    
    /**
     * Download image
     */
    Download = "download",
    
    /**
     * Update image information
     */
    Update = "update"
}

/**
 * Interface for image operation events
 */
export interface IImageOperationEvent {
    /**
     * Operation type
     */
    type: ImageOperationType;
    
    /**
     * Image information
     */
    imageInfo: IImageInfo;
    
    /**
     * Event timestamp
     */
    timestamp: number;
} 