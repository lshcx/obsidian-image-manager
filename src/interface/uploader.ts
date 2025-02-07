import { UploadMode } from "./settings";

/**
 * interface for upload options
 */
export interface IUploadOptions {
    isDeleteTemp: boolean;
    onStart?: () => void;
    onProgress?: (message: string) => void;
    onError?: (error: string) => void;
    onSuccess?: (result: string) => void;
}

/**
 * interface for uploader
 */
export interface IUploader {
    upload(files: string, options: IUploadOptions): Promise<string>;
    // parseURL(stdout: string): [boolean, string[]];
}

/**
 * interface for uploader factory
 */
export interface IUploaderFactory {
    createUploader(mode: UploadMode): IUploader;
}
