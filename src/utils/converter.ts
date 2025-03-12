/**
 * Convert array buffer to base64 string
 * @param buffer Array buffer
 * @returns Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
}

/**
 * Convert base64 string to array buffer
 * @param base64 Base64 string
 * @returns Array buffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
}

/**
 * Convert data URL to blob
 * @param dataUrl Data URL
 * @returns Blob
 */
export function dataURLToBlob(dataUrl: string): Blob {
    // Extract content type and base64 data
    const arr = dataUrl.split(',');
    const mime = arr[0]?.match(/:(.*?);/)?.[1] || '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
}

/**
 * Convert blob to data URL
 * @param blob Blob
 * @returns Promise resolving to data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Convert blob to array buffer
 * @param blob Blob
 * @returns Promise resolving to array buffer
 */
export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

/**
 * Convert array buffer to blob
 * @param buffer Array buffer
 * @param type MIME type
 * @returns Blob
 */
export function arrayBufferToBlob(buffer: ArrayBuffer, type: string): Blob {
    return new Blob([buffer], { type });
}

/**
 * Convert image URL to blob
 * @param url Image URL
 * @returns Promise resolving to blob
 */
export async function imageUrlToBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    return await response.blob();
}

/**
 * Extract extension from MIME type
 * @param mimeType MIME type
 * @returns File extension
 */
export function mimeTypeToExtension(mimeType: string): string {
    const map: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/bmp': 'bmp',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'image/tiff': 'tiff'
    };
    
    return map[mimeType] || 'png'; // Default to png
}

/**
 * Extract MIME type from filename
 * @param filename Filename with extension
 * @returns MIME type
 */
export function filenameToMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    const map: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'tiff': 'image/tiff'
    };
    
    return map[ext] || 'image/png'; // Default to png
} 