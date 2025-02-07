import ImageManagerPlugin from "../main";
import * as path from "path";
import * as fs from "fs";


/**
 * image info
 */
export class ImageInfo {

    // the local path of the image
    localPath: string;

    // the remote path of the image
    remotePath: string;

    // whether the image is uploaded
    isUploaded: boolean;

    constructor(data: Partial<ImageInfo>) {
        this.localPath = data.localPath || "";
        this.remotePath = data.remotePath || "";
        this.isUploaded = data.isUploaded || false;
    }
}

interface Info {
    isValid: boolean;  // whether the info is valid
    vaultPath: string;  // the vault path
    curFile: string;    // full path of the current file
    curFileFolder: string;  // folder of the current file
    curFileName: string;  // name of the current file
    curFileNameWithoutExtension: string;  // name of the current file without extension
    imageInfoFileFolder: string;  // the image info file folder
    imageInfoFilePath: string;  // the image info file path
}


/**
 * manager
 */
export class Manager{

    private info: Info;

    // the image infos
    private imageInfos: ImageInfo[];

    // the plugin
    private plugin: ImageManagerPlugin;

    // constructor
    constructor(plugin: ImageManagerPlugin) {
        this.plugin = plugin;
        this.imageInfos = [];
        this.parsePath();

        this.load();
    }

    // load the image infos from a json file
    async load(): Promise<boolean> {
        if (!this.info.isValid) {
            return Promise.resolve(false);
        }

        if (fs.existsSync(this.info.imageInfoFilePath)) {
            const imageInfos = JSON.parse(fs.readFileSync(this.info.imageInfoFilePath, "utf8"));
            this.imageInfos = imageInfos.map((imageInfo: ImageInfo) => new ImageInfo(imageInfo));
        }

        return Promise.resolve(true);
    }

    // save the image infos to a json file
    async save(): Promise<boolean> {
        if (!this.info.isValid) {
            return Promise.resolve(false);
        }

        if (!fs.existsSync(this.info.imageInfoFileFolder)) {
            fs.mkdirSync(this.info.imageInfoFileFolder, { recursive: true });
        }

        fs.writeFileSync(this.info.imageInfoFilePath, JSON.stringify(this.imageInfos, null, 2));
        return Promise.resolve(true);
    }
    
    // add the image info
    async add(imageInfo: ImageInfo): Promise<void> {
        await this.save();
    }

    // remove the image info
    async remove(imageInfo: ImageInfo): Promise<void> {
        await this.save();
    }

    // move the image folder
    async move(dstPath: string): Promise<void> {
        return Promise.resolve();
    }

    // paste the image info
    async paste(): Promise<void> {
        return Promise.resolve();
    }

    // insert the image info
    async insert(imageInfo: ImageInfo): Promise<void> {
        return Promise.resolve();
    }

    private parsePath(): void {
        this.info.vaultPath = this.plugin.app.vault.getRoot().path;
        this.info.curFile = this.plugin.app.workspace.getActiveFile()?.path || "";
        if (this.info.curFile !== "") {
            this.info.isValid = true;
            this.info.curFileFolder = path.dirname(this.info.curFile);
            this.info.curFileName = path.basename(this.info.curFile);
            this.info.curFileNameWithoutExtension = path.basename(this.info.curFile, path.extname(this.info.curFile));
            // imageInfoFileFolder is like `_assets.{{filename}}`
            this.info.imageInfoFileFolder = path.join(this.info.curFileFolder, this.plugin.settings.tempFolderPath.replace("{{filename}}", this.info.curFileName));
            this.info.imageInfoFilePath = path.join(this.info.imageInfoFileFolder, "index.json");
        } else {
            this.info.isValid = false;
            this.info.curFileFolder = "";
            this.info.curFileName = "";
            this.info.curFileNameWithoutExtension = "";
            this.info.imageInfoFileFolder = "";
            this.info.imageInfoFilePath = "";
        }
    }
}
