import { IUploader, IUploaderFactory } from "../interface/uploader";
import { UploadMode } from "../interface/settings";
import { CustomUploader } from "./custom/custom_uploader";
import ImageManagerPlugin from "../main";


/**
 * factory for uploader
 */
export class UploaderFactory implements IUploaderFactory {
    private plugin: ImageManagerPlugin;

    constructor(plugin: ImageManagerPlugin) {
        this.plugin = plugin;
    }

    createUploader(mode: UploadMode): IUploader {
        switch (mode) {
            case UploadMode.Custom:
                return new CustomUploader(this.plugin.settings.customUploadCommand);
            default:
                throw new Error(`Unsupported upload mode: ${mode}`);
        }
    }
}