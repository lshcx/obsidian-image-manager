import { IUploader, IUploadOptions } from "../../interface/uploader";
import { exec } from "child_process";
import { _T } from "../../lang/helpers";


/**
 * custom uploader
 */
export class CustomUploader implements IUploader {

    private command: string;

    constructor(command: string) {

        this.command = command;
    }

    async upload(files: string, options: IUploadOptions): Promise<string> {

        try {
            // check if the command is valid
            if (!this.command) {
                throw new Error(_T("ERROR_UPLOAD_COMMAND_RUN") + _T("ERROR_UPLOAD_COMMAND_EMPTY"));
            }

            options.onStart?.();

            // file count
            const fileCount = files.split(",").length;
            // cat command
            const command = this.command + " " + files; 

            const execPromise = new Promise<string>((resolve, reject) => {
                const process = exec(command, (error, stdout, stderr) => {
                    if (error) {
                        options.onError?.(`${_T("ERROR_UPLOAD_COMMAND_RUN")}: ${error.message}`);
                        reject(error);
                        return;
                    }

                    if (stderr) {
                        options.onError?.(`${_T("ERROR_UPLOAD_COMMAND_RUN")}: ${stderr}`);
                        reject(stderr);
                        return;
                    }
                    resolve(stdout);
                });

                // 2. 这里可以实时获取上传进度
                process.stdout?.on("data", (data) => {
                    options.onProgress?.(data.toString());
                });
            });

            // parse the stdout
            const stdout = await execPromise;
            let result = "";

            // parse the url
            try {
                const urls = this.parseURL(stdout, fileCount);
                result = urls.join(",");
            } catch (error) {
                options.onError?.(`${_T("ERROR_UPLOAD_COMMAND_PARSE")}: ${error}`);
                throw error;
            }

            options.onSuccess?.(result);
            return result;

        } catch (error) {
            options.onError?.(error.toString());
            throw error;
        }
    }

    // parse url from stdout
    // return whether the stdout is valid and the url list
    private parseURL(result: string, fileCount: number): string[] {
        try {
            // check if the stdout contains the success message
            if (!result.includes('Successfully uploaded:')) {
                throw new Error(_T("ERROR_UPLOAD_COMMAND_FORMAT"));
            }

            result = result.split('Successfully uploaded:')[1];

            // split and extract the url part
            const lines = result.split('\n');
            const urlMap = new Map<number, string>();

            lines.forEach(line => {
                // match the index and url eg. [1] https://example.com/1.jpg
                const match = line.match(/^\[(\d+)\]\s*(https?:\/\/.+?)(?:\s|$)/);
                if (match) {
                    const [, index, url] = match;
                    urlMap.set(parseInt(index), url.trim());
                }
            });

            // sort and return the url list
            const urls = Array.from(urlMap.entries())
                .sort(([a], [b]) => a - b)
                .map(([, url]) => url);
            
            if (urls.length === 0) {
                throw new Error(_T("ERROR_UPLOAD_COMMAND_NO_URL"));
            }

            if (urls.length !== fileCount) {
                throw new Error(_T("ERROR_UPLOAD_COMMAND_NUMBER"));
            }

            return urls;
        } catch (error) {
            throw new Error(_T("ERROR_UPLOAD_COMMAND_PARSE_EXCEPTION"));
        }
    }
}