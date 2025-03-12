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
  TEMP_FOLDER_PATH_DESC: "注意：此设置会优先于文件与链接中附件存放位置的设置（不影响图像外的其他文件）",

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
  
  // magic variable errors
  ERROR_CONTEXT_GENERATION: "生成上下文变量失败: ",
  ERROR_VARIABLE_PROCESSING: "处理魔法变量失败: ",
  
  // document manager errors
  ERROR_LOAD_JSON: "加载图片信息JSON文件失败: ",
  ERROR_SAVE_JSON: "保存图片信息JSON文件失败: ",
  ERROR_ADD_IMAGE: "添加图片失败: ",
  ERROR_REMOVE_IMAGE: "移除图片失败: ",
  ERROR_UPLOAD_IMAGES: "上传图片失败: ",
  ERROR_DOWNLOAD_IMAGES: "下载图片失败: ",
  ERROR_RENAME_FOLDER: "重命名图片文件夹失败: ",
  ERROR_RENAME_FOLDER_NOT_FOUND: "图片文件夹不存在",

  // Editor module related
  ERROR_NO_ACTIVE_EDITOR: "没有活动的编辑器",
  ERROR_UNSUPPORTED_OPERATION: "不支持的操作",
  ERROR_NO_IMAGE_SELECTED: "未选中任何图片",
  NOTICE_IMAGE_FORMATTED: "图片格式已更新",
  
  // Paste handler related
  NOTICE_PROCESSING_IMAGE: "正在处理图片...",
  NOTICE_IMAGE_PASTED: "图片已粘贴",
  ERROR_PROCESS_PASTE: "处理粘贴图片失败",
  NOTICE_PROCESSING_PATH: "正在处理图片路径...",
  ERROR_PROCESS_PATH: "处理图片路径失败",
  NOTICE_URL_PROCESSED: "图片URL已处理",
  NOTICE_DATA_URL_PROCESSED: "图片数据已处理",
  NOTICE_USE_DRAGDROP: "请使用拖放功能插入本地图片",
  
  // Drop handler related
  ERROR_PROCESS_DROP: "处理拖放图片失败: ",
  NOTICE_MD_NOT_SUPPORTED: "不支持拖放Markdown文件",
  NOTICE_FILE_NOT_SUPPORTED: "不支持的文件类型: ",
  NOTICE_IMAGE_DROPPED: "图片已拖放",
  NOTICE_IMAGES_DROPPED: "{count}张图片已拖放",
  NOTICE_PROCESSING_URL: "正在处理图片URL...",
  ERROR_PROCESS_URL: "处理拖放URL失败",
  NOTICE_FOLDER_NOT_SUPPORTED: "不支持拖放文件夹",
  
  // Context menu related
  MENU_INSERT_IMAGE: "插入图片",
  MENU_ALIGN_LEFT: "左对齐",
  MENU_ALIGN_CENTER: "居中对齐",
  MENU_ALIGN_RIGHT: "右对齐", 
  MENU_ZOOM_IN: "放大",
  MENU_ZOOM_OUT: "缩小",
  MENU_ZOOM_RESET: "重置大小",
  MENU_UPLOAD_IMAGE: "上传图片",
  MENU_DOWNLOAD_IMAGE: "下载图片",
  MENU_COPY_URL: "复制URL",
  
  // Upload/download related
  NOTICE_PROCESSING_UPLOAD: "正在上传图片...",
  NOTICE_UPLOAD_SUCCESS: "图片上传成功",
  ERROR_UPLOAD_FAILED: "图片上传失败",
  NOTICE_PROCESSING_DOWNLOAD: "正在下载图片...",
  NOTICE_DOWNLOAD_SUCCESS: "图片下载成功",
  ERROR_DOWNLOAD_FAILED: "图片下载失败",
  
  // Image insertion related
  ERROR_UNSUPPORTED_FILE: "不支持的文件类型",
  NOTICE_IMAGE_INSERTED: "图片已插入",
  ERROR_PROCESS_INSERT: "处理图片插入失败",
};
