// English

export default {
  // plugin title
  PLUGIN_TITLE: "图片管理插件",

  // isAutoUpload
  IS_AUTO_UPLOAD_Name: "是否启用自动上传",
  IS_AUTO_UPLOAD_DESC: "启用后，图片将会自动上传插入的图像（包括直接输入、剪贴板粘贴、拖拽）",

  // isDeleteTemp
  IS_DELETE_TEMP_Name: "是否删除临时文件",
  IS_DELETE_TEMP_DESC: "启用后，图片上传后将会删除临时文件",

  // tempFolderPath
  TEMP_FOLDER_PATH_Name: "临时文件夹路径",
  TEMP_FOLDER_PATH_DESC: "注意：此设置会优先于“文件与链接”中附件存放位置的设置（不影响图像外的其他文件）",

  // tempFileFormat
  TEMP_FILE_FORMAT_Name: "临时文件格式",
  TEMP_FILE_FORMAT_DESC: "临时文件格式，支持魔法变量，如{{filename}}、{{date}}、{{time}}、{{random}}等",

  // imageFileExtension
  IMAGE_FILE_EXTENSION_Name: "图片文件扩展名",
  IMAGE_FILE_EXTENSION_DESC: "图片文件扩展名，支持多个扩展名，用逗号分隔",

  // uploadMode
  UPLOAD_MODE_Name: "上传模式",
  UPLOAD_MODE_DESC: "上传模式，支持自定义上传命令",
  UPLOAD_MODE_CUSTOM: "自定义",

  // customUploadCommand
  CUSTOM_UPLOAD_COMMAND_Name: "输入自定义命令",
  CUSTOM_UPLOAD_COMMAND_DESC: "例：'python uploader.py -f '，需要上传的图像路径会作为参数传递给命令",

  // uploadTestingArea
  UPLOAD_TESTING_AREA_Name: "上传测试",
  UPLOAD_TESTING_AREA_DESC: "输入图像绝对路径（多个文件用逗号分隔），点击测试按钮，查看输出",
  UPLOAD_TESTING_AREA_BUTTON_TEXT: "测试",
  UPLOAD_TESTING_AREA_RESULT: "测试结果会显示在这里！",
  UPLOAD_TESTING_AREA_START: "开始测试：",
  UPLOAD_TESTING_AREA_SUCCESS: "上传成功：",
  UPLOAD_TESTING_AREA_FAILED: "上传失败：",
  TEST_FILES_EMPTY: "未输入测试文件",
  UPLOADER_NOT_FOUND: "未找到上传器",

  // notice
  NOTICE_TESTING_UPLOAD_SUCCESS: "上传成功！",
  NOTICE_TESTING_UPLOAD_FAILED: "上传失败！",

  // error

  // running error when using custom uploader
  ERROR_UPLOAD_COMMAND_RUN: "执行错误: ",
  ERROR_UPLOAD_COMMAND_EMPTY: "命令为空",

  // parse error when using custom uploader
  ERROR_UPLOAD_COMMAND_PARSE: "解析错误: ",
  ERROR_UPLOAD_COMMAND_FORMAT: "输出格式异常, `Successfully uploaded:` 未找到",
  ERROR_UPLOAD_COMMAND_NO_URL: "未找到URL",
  ERROR_UPLOAD_COMMAND_NUMBER: "URL数量与文件数量不一致",
  ERROR_UPLOAD_COMMAND_PARSE_EXCEPTION: "解析异常",

  // delete error when uploading
  ERROR_UPLOAD_DELETE: "删除临时文件失败",
};
