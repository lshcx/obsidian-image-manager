import { ISettings, UploadMode } from "../interface/settings";
import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import ImageManagerPlugin from "../main";
import { _T } from "../lang/helpers";

export class SettingsTab extends PluginSettingTab {
    plugin: ImageManagerPlugin;

    constructor(app: App, plugin: ImageManagerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        // Title of the setting tab
        containerEl.createEl("h1", {
            text: _T("PLUGIN_TITLE"),
        });

        // Setting for isAutoUpload
        this.displayIsAutoUploadSetting(containerEl);

        // Setting for isDeleteTemp
        this.displayIsDeleteTempSetting(containerEl);

        // Setting for tempFolderPath
        this.displayTempFolderPathSetting(containerEl);

        // Setting for tempFileFormat
        this.displayTempFileFormatSetting(containerEl);

        // Setting for imageFileExtension
        this.displayImageFileExtensionSetting(containerEl);

        // Setting for uploadMode
        this.displayUploadModeSetting(containerEl);

        // Setting for uploadTestingArea
        this.displayUploadTestingArea(containerEl);
    }
    
    // Display the setting for isAutoUpload
    private displayIsAutoUploadSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(_T("IS_AUTO_UPLOAD_Name"))
            .setDesc(_T("IS_AUTO_UPLOAD_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.isAutoUpload)
                .onChange(async (value) => {
                    this.plugin.settings.isAutoUpload = value;
                    await this.plugin.saveSettings();
                }));
    }

    // Display the setting for isDeleteTemp
    private displayIsDeleteTempSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(_T("IS_DELETE_TEMP_Name"))
            .setDesc(_T("IS_DELETE_TEMP_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.isDeleteTemp)
                .onChange(async (value) => {
                    this.plugin.settings.isDeleteTemp = value;
                    await this.plugin.saveSettings();
                }));
    }
    
    // Display the setting for tempFolderPath
    private displayTempFolderPathSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(_T("TEMP_FOLDER_PATH_Name"))
            .setDesc(_T("TEMP_FOLDER_PATH_DESC"))
            .addText(text => text.setValue(this.plugin.settings.tempFolderPath)
                .onChange(async (value) => {
                    this.plugin.settings.tempFolderPath = value;
                    await this.plugin.saveSettings();
                }));
    }

    // Display the setting for tempFileFormat
    private displayTempFileFormatSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(_T("TEMP_FILE_FORMAT_Name"))
            .setDesc(_T("TEMP_FILE_FORMAT_DESC"))
            .addText(text => text.setValue(this.plugin.settings.tempFileFormat)
                .onChange(async (value) => {
                    this.plugin.settings.tempFileFormat = value;
                    await this.plugin.saveSettings();
                }));
    }

    // Display the setting for imageFileExtension
    private displayImageFileExtensionSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(_T("IMAGE_FILE_EXTENSION_Name"))
            .setDesc(_T("IMAGE_FILE_EXTENSION_DESC"))
            .addText(text => text.setValue(this.plugin.settings.imageFileExtension)
                .onChange(async (value) => {
                    this.plugin.settings.imageFileExtension = value;
                    await this.plugin.saveSettings();
                }));
    }

    // Display the setting for uploadMode
    private displayUploadModeSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(_T("UPLOAD_MODE_Name"))
            .setDesc(_T("UPLOAD_MODE_DESC"))
            .addDropdown(dropdown => dropdown.addOptions({
                [UploadMode.Custom]: _T("UPLOAD_MODE_CUSTOM"),
            })
            .setValue(this.plugin.settings.uploadMode)
            .onChange(async (value) => {
                this.plugin.settings.uploadMode = value as UploadMode;
                this.display();
                await this.plugin.saveSettings();
                this.plugin.buildUploader();
            }));
        
        // Display the setting for customUploadCommand
        if (this.plugin.settings.uploadMode === UploadMode.Custom) {
            this.displayCustomUploadCommandSetting(containerEl);
        }
    }

    // Display the setting for customUploadCommand
    private displayCustomUploadCommandSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(_T("CUSTOM_UPLOAD_COMMAND_Name"))
            .setDesc(_T("CUSTOM_UPLOAD_COMMAND_DESC"))
            .addText(text => text.setValue(this.plugin.settings.customUploadCommand)
                .onChange(async (value) => {
                    this.plugin.settings.customUploadCommand = value;
                    await this.plugin.saveSettings();
                    this.plugin.buildUploader();
                }));
    }
    
    // Display the area for upload testing
    private displayUploadTestingArea(containerEl: HTMLElement): void {
        let testFiles = "D:\\image1.jpg,D:\\image2.jpg";
        new Setting(containerEl)
            .setName(_T("UPLOAD_TESTING_AREA_Name"))
            .setDesc(_T("UPLOAD_TESTING_AREA_DESC"))
            .addText(text => text.setValue(`eg: ${testFiles}`)
                .onChange(async (value) => {
                    testFiles = value;
                })
                .inputEl.style.width = "100%")
            .addButton(button => button
                .setButtonText(_T("UPLOAD_TESTING_AREA_BUTTON_TEXT"))
                .onClick(async () => {

                    if (testFiles.trim() === "") {
                        new Notice(_T("NOTICE_TESTING_UPLOAD_FAILED") + _T("TEST_FILES_EMPTY"));
                        return;
                    }

                    if (this.plugin.uploader === null) {
                        new Notice(_T("NOTICE_TESTING_UPLOAD_FAILED") + _T("UPLOADER_NOT_FOUND"));
                        return;
                    }

                    // calculate file count
                    const fileCount = testFiles.split(",").length;

                    // upload the files
                    try {   
                        await this.plugin.uploader.upload(testFiles, {
                            onStart: () => {
                            testArea.value = _T("UPLOAD_TESTING_AREA_START") + "\n";
                            },
                            onProgress: (message: string) => {
                                testArea.value += message;
                            },
                            onError: (error: string) => {
                                testArea.value += _T("UPLOAD_TESTING_AREA_FAILED") + error + "\n";
                                // Notice the error message
                                new Notice(_T("NOTICE_TESTING_UPLOAD_FAILED") + error);
                            },
                            onSuccess: (result: string) => {
                                testArea.value += _T("UPLOAD_TESTING_AREA_SUCCESS") + "\n";
                                const urls = result.split(",");
                                for (const url of urls) {
                                    testArea.value += url + "\n";
                                }
                                new Notice(_T("NOTICE_TESTING_UPLOAD_SUCCESS"));
                            },
                        });
                    } catch (error) {
                        new Notice(_T("NOTICE_TESTING_UPLOAD_FAILED") + error.toString());
                    }
                }));
        
        // Display the result of the upload testing
        const testArea = containerEl.createEl("textarea");
        testArea.value = _T("UPLOAD_TESTING_AREA_RESULT");
        testArea.disabled = true;
        testArea.style.width = "100%";
        testArea.style.height = "200px";
        testArea.addEventListener("scroll", () => {
            testArea.scrollTop = testArea.scrollHeight;
        });
    }
}
