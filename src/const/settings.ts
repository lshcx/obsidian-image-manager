import { ISettings, UploadMode } from "../interface/settings";

export const DEFAULT_SETTINGS: ISettings = {
    isAutoUpload: true,
    isDeleteTemp: false,
    tempFolderPath: "_assets.{{filename}}",
    tempFileFormat: "Image{{date}}_{{time}}",
    imageFileExtension: "jpg, jpeg, png, gif, webp, bmp, svg",
    uploadMode: UploadMode.Custom,
    customUploadCommand: "",
}