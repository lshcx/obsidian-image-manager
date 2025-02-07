
/**
 * enum for upload mode
 */
export enum UploadMode {
    Custom = "UPLOAD_MODE_CUSTOM",
}

/**
 * interface for global settings
 */
export interface ISettings {

    isAutoUpload: boolean;  // whether to auto upload images
    isDeleteTemp: boolean;  // whether to delete the temp file after upload
    tempFolderPath: string;  // the path of the temp folder
    tempFileFormat: string;  // the format of the temp file
    imageFileExtension: string;  // the extension of the image file
    uploadMode: UploadMode;  // the mode of the upload
    customUploadCommand: string;  // the custom upload command
}