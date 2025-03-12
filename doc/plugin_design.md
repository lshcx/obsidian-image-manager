# Obsidian 图像管理插件设计方案

## 1. 插件需求概述

本插件旨在为Obsidian提供类似Typora的图像管理功能，主要包括以下几个方面：

### 1.1 上传功能
- 可设置是否自动上传图片
- 可设置上传后是否删除本地图片
- 自动上传后使用图片的URL
- 上传时图片做模糊渲染或用上传动画覆盖
- 实现利用常见工具的上传功能以及自定义上传命令
- 设置菜单设置上传命令后可进行测试
- 删除功能对应实现

### 1.2 编辑功能
- 支持粘贴、拖拽、右键菜单插入、手动输入图片
- 右键菜单插入图片时，自动将图标和路径输入框插入到光标位置
- 可以在输入图片路径中输入图片路径，也可以点击文件夹图标，选择图片路径
- 右键图片可进行居中、居左、居右、缩放等常用调节功能
- 网络图片自动下载到本地，成功则使用本地图片，之后按照上传规则处理，失败则使用源网络地址

### 1.3 图片管理
- 插入图片后自动复制到指定位置，如./{{filename}}.assets
- 文档中优先使用相对路径
- 位置设置支持魔法变量，如{{filename}}，{{title}}，{{workspace}}，{{date}}，{{time}}，{{random}}等
- 可设置是否自动重命名以及重命名规则，支持魔法变量
- 为每个文档创建JSON文件记录图片信息
- 切换文件时自动读取对应JSON，增删图片时自动更新
- 所有图片都删除后，删除JSON文件以及图片文件夹
- 新建文件时默认不新建JSON文件，仅当第一次插入图片时新建
- 处理文件重命名、删除、移动时的图片管理

## 2. 系统架构设计

### 2.1 核心组件

```
src/
├── main.ts                  # 插件主入口
├── const/                   # 常量定义
│   └── settings.ts          # 默认设置
├── interface/               # 接口定义
│   ├── settings.ts          # 设置接口
│   └── uploader.ts          # 上传器接口
├── lang/                    # 国际化
│   └── helpers.ts           # 翻译辅助方法
├── manager/                 # 图片管理
│   ├── image_info.ts        # 图片信息结构
│   ├── document_manager.ts  # 文档图片管理
│   └── magic_variable.ts    # 魔法变量处理
├── editor/                  # 编辑器功能
│   ├── paste_handler.ts     # 粘贴处理
│   ├── drop_handler.ts      # 拖拽处理
│   ├── context_menu.ts      # 右键菜单
│   └── image_formatter.ts   # 图片格式化
├── setting/                 # 设置页面
│   └── settings.ts          # 设置界面实现
└── uploader/                # 上传功能
    ├── factory.ts           # 上传器工厂
    └── custom/              # 自定义上传器
        └── custom_uploader.ts # 自定义上传实现
```

### 2.2 数据结构设计

#### 2.2.1 图片信息结构

```typescript
interface IImageInfo {
    localPath: string;    // 图片本地路径
    remotePath: string;   // 图片远程路径（上传后的URL）
    isUploaded: boolean;  // 是否已上传
    width?: number;       // 图片宽度
    height?: number;      // 图片高度
    align?: string;       // 图片对齐方式
}
```

#### 2.2.2 文档图片管理

```typescript
interface IDocumentImageManager {
    mdPath: string;                // 文档路径
    images: Map<string, IImageInfo>; // 图片信息映射
    
    // 核心方法
    loadFromJson(): Promise<boolean>;             // 从JSON文件加载
    saveToJson(): Promise<boolean>;               // 保存到JSON文件
    addImage(localPath: string): Promise<string>; // 添加图片
    removeImage(localPath: string): Promise<boolean>; // 移除图片
    uploadAllImages(): Promise<boolean>;          // 上传所有图片
    downloadAllImages(): Promise<boolean>;        // 下载所有图片
    renameImageFolder(newPath: string): Promise<boolean>; // 重命名图片文件夹
}
```

#### 2.2.3 完整设置接口

```typescript
export interface ISettings {
    // 上传相关设置
    isAutoUpload: boolean;        // 是否自动上传图片
    isDeleteTemp: boolean;        // 上传后是否删除本地图片
    uploadMode: UploadMode;       // 上传模式
    customUploadCommand: string;  // 自定义上传命令
    
    // 图片存储相关设置
    tempFolderPath: string;       // 图片保存路径模板
    tempFileFormat: string;       // 图片文件名模板
    imageFileExtension: string;   // 支持的图片扩展名
    
    // 新增设置
    enableAutoRename: boolean;    // 是否自动重命名图片
    renameFormat: string;         // 重命名格式
    networkImageAutoDownload: boolean; // 是否自动下载网络图片
    defaultImageAlign: string;    // 默认图片对齐方式
}
```

### 2.3 主要功能流程

#### 2.3.1 图片插入流程

1. 用户通过粘贴/拖拽/右键菜单插入图片
2. 捕获图片数据/路径
3. 复制图片到目标文件夹（应用路径模板和文件名模板）
4. 更新文档图片管理器数据
5. 如启用自动上传，则上传图片
6. 在编辑器中插入图片引用（本地或远程URL）
7. 保存图片管理JSON文件

#### 2.3.2 文件重命名处理流程

1. 监听文件重命名事件
2. 检查是否是markdown文件
3. 读取对应的图片管理JSON文件
4. 如果图片文件夹使用了{{filename}}变量，则需要重命名文件夹
5. 更新JSON文件中所有图片的路径
6. 更新文档中的图片引用路径
7. 保存更新后的JSON文件

#### 2.3.3 上传流程

1. 获取需要上传的图片列表
2. 调用上传器进行上传
3. 显示上传进度/动画
4. 上传完成后更新图片信息和文档引用
5. 如设置删除本地图片，则删除本地图片文件

## 3. 核心组件实现细节

### 3.1 图片管理器实现

```typescript
class DocumentImageManager implements IDocumentImageManager {
    private plugin: ImageManagerPlugin;
    mdPath: string;
    images: Map<string, IImageInfo>;
    
    constructor(plugin: ImageManagerPlugin, mdPath: string) {
        this.plugin = plugin;
        this.mdPath = mdPath;
        this.images = new Map();
    }
    
    // 从JSON加载图片信息
    async loadFromJson(): Promise<boolean> {
        const jsonPath = this.getJsonPath();
        try {
            if (await this.plugin.app.vault.adapter.exists(jsonPath)) {
                const content = await this.plugin.app.vault.adapter.read(jsonPath);
                const data = JSON.parse(content);
                this.images.clear();
                for (const [key, value] of Object.entries(data.images)) {
                    this.images.set(key, value as IImageInfo);
                }
                return true;
            }
        } catch (error) {
            console.error("加载图片信息失败", error);
        }
        return false;
    }
    
    // 保存图片信息到JSON
    async saveToJson(): Promise<boolean> {
        const jsonPath = this.getJsonPath();
        try {
            const data = {
                mdPath: this.mdPath,
                images: Object.fromEntries(this.images)
            };
            await this.plugin.app.vault.adapter.write(jsonPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error("保存图片信息失败", error);
            return false;
        }
    }
    
    // 其他核心方法实现...
}
```

### 3.2 魔法变量处理器

```typescript
class MagicVariableProcessor {
    // 获取当前上下文
    getContext(filePath: string, app: App): Record<string, string> {
        const file = app.vault.getAbstractFileByPath(filePath);
        const filename = file ? file.name.replace(/\.[^/.]+$/, "") : "";
        const title = filename; // 可以从文件内容中提取，或直接使用文件名
        const workspace = app.vault.getName();
        
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
        
        return {
            filename,
            title,
            workspace,
            date,
            time,
            random: Math.random().toString(36).substring(2, 10)
        };
    }
    
    // 处理路径中的魔法变量
    processPath(path: string, context: Record<string, string>): string {
        // 替换所有支持的魔法变量
        return path.replace(/{{(\w+)}}/g, (match, key) => {
            return context[key] || match;
        });
    }
}
```

### 3.3 编辑器增强功能

#### 3.3.1 粘贴处理

```typescript
class PasteHandler {
    private plugin: ImageManagerPlugin;
    
    constructor(plugin: ImageManagerPlugin) {
        this.plugin = plugin;
        this.register();
    }
    
    register() {
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('editor-paste', this.handlePaste.bind(this))
        );
    }
    
    async handlePaste(evt: ClipboardEvent, editor: Editor, view: MarkdownView) {
        // 判断是否包含图片
        if (!evt.clipboardData.items) return;
        
        for (const item of Array.from(evt.clipboardData.items)) {
            if (item.type.startsWith('image/')) {
                evt.preventDefault();
                
                // 获取图片Blob
                const blob = item.getAsFile();
                if (!blob) continue;
                
                // 处理图片
                await this.processImageBlob(blob, editor, view);
                break;
            }
        }
    }
    
    async processImageBlob(blob: File, editor: Editor, view: MarkdownView) {
        // 实现图片保存和插入...
    }
}
```

#### 3.3.2 右键菜单

```typescript
class ContextMenuHandler {
    private plugin: ImageManagerPlugin;
    
    constructor(plugin: ImageManagerPlugin) {
        this.plugin = plugin;
        this.register();
    }
    
    register() {
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('editor-menu', this.handleEditorMenu.bind(this))
        );
    }
    
    handleEditorMenu(menu: Menu, editor: Editor, view: MarkdownView) {
        // 判断是否在图片上
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        const imgRegex = /!\[.*?\]\((.*?)\)/;
        
        if (imgRegex.test(line)) {
            // 添加图片操作菜单
            this.addImageOperationMenus(menu, editor, line);
        } else {
            // 添加插入图片菜单
            menu.addItem(item => {
                item.setTitle('插入图片')
                    .setIcon('image')
                    .onClick(() => this.openInsertImageDialog(editor));
            });
        }
    }
    
    // 其他方法实现...
}
```

## 4. 实施计划

### 4.1 阶段一：核心功能实现

- 完成图片管理核心功能
  - 图片信息结构
  - 文档图片管理
  - 魔法变量处理
- 实现基本的编辑器功能
  - 粘贴处理
  - 拖拽处理
- 完善设置界面

预计时间：2周

### 4.2 阶段二：完整功能实现

- 实现右键菜单功能
- 实现图片格式化（对齐、缩放等）
- 完善文件监听（重命名、删除、移动）
- 完善上传功能
- 实现网络图片自动下载

预计时间：2周

### 4.3 阶段三：优化与完善

- UI优化（上传动画、模糊渲染等）
- 性能优化
- 全面测试
- 用户文档编写

预计时间：1周

## 5. 注意事项与潜在问题

1. **文件系统操作**：需要考虑跨平台兼容性（Windows/Mac/Linux路径差异）
2. **并发处理**：多图片同时上传时的状态管理
3. **错误处理**：网络问题、文件读写异常等错误的优雅处理
4. **性能考虑**：大量图片或大文件处理时的性能优化
5. **用户体验**：上传过程中的视觉反馈，操作的简便性

## 6. 未来扩展

1. 支持更多上传服务（GitHub、S3、七牛云等）
2. 图片编辑功能（裁剪、滤镜等）
3. 批量操作功能（批量上传、替换等）
4. CDN加速支持
5. 图片压缩功能 