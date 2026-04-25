# 三维模型智能管理平台
基于 Vue3 + Three.js 与 SpringBoot 构建的工业级三维模型全生命周期管理解决方案，实现模型上传、智能预览、部件级交互与爆炸视图分析的一体化工作流。

本项目只包含前端代码，后端代码请

## 核心功能

### 1. 模型管理

- **批量管理**：支持 GLB 格式模型的上传、搜索、批量删除

- **智能预览**：点击即可进入三维查看器，无需本地安装专业软件

- **版本记录**：完整记录上传时间、修改记录，确保数据可追溯

### 2. 三维交互引擎

- **双模式预览系统**

    **整体模式**: 专业级相机控制（旋转/平移/缩放），支持模型动画播放

    **组件模式**: 鼠标悬停高亮，实时显示部件信息，表格联动交互

-  **GPU高性能拾取**

    采用颜色编码与离屏渲染技术，实现复杂模型毫秒级部件定位

- **爆炸视图分析**

    基于球面黄金角度算法，一键分解/组装，清晰展示内部结构

### 3. 技术架构

- **前端**：Vue 3 + TypeScript + Vite + Three.js + Element Plus

- **后端**：Spring Boot 3 + MyBatis + MySQL

- **部署**：

## 功能演示

### 模型管理界面
下面依次展示模型管理的基本功能：

查找，新增，修改，分页，下载，删除，批量删除

https://github.com/Star4396/MyProject/releases/download/video/system.mp4



### 三维预览模式

点击“预览”，首先进入的是整体预览模式，支持播放动画及相机控制

鹦鹉

https://github.com/Star4396/MyProject/releases/download/video/parrot_whole.mp4

地牢

https://github.com/Star4396/MyProject/releases/download/video/dungeon_whole.mp4

卧室

https://github.com/Star4396/MyProject/releases/download/video/bedroom_whole.mp4


### 组件级交互
点击“开启组件预览”按钮进入**组件预览模式**，进入时当前动画会停止。

组件级交互共涉及两种：

1. 鼠标hover在信息表时，对应组件高亮；鼠标hover退出时，组件恢复

2. 鼠标hover在组件上时，组件高亮+弹出提示框（显示组件信息）；鼠标hover退出时，组件恢复+提示框消失

鹦鹉

https://github.com/Star4396/MyProject/releases/download/video/parrot_component.mp4

地牢

https://github.com/Star4396/MyProject/releases/download/video/dungeon_component.mp4

台灯

https://github.com/Star4396/MyProject/releases/download/video/light_component.mp4

### 爆炸视图
开启组件预览模式时会出现“开启爆炸视图”按钮，点击开启

鹦鹉

https://github.com/Star4396/MyProject/releases/download/video/parrot_explode.mp4

地牢

https://github.com/Star4396/MyProject/releases/download/video/dungeon_explode.mp4

台灯

https://github.com/Star4396/MyProject/releases/download/video/light_explode.mp4

## 快速开始

### 环境要求

- Node.js 18+
- JDK 17+
- MySQL 8.0+

### 安装和使用

1. 克隆仓库

```bash
git clone https://github.com/Star4396/MyProject.git
```

2. 安装依赖

```bash
cd MyProject
npm i -g corepack
pnpm install
```

3. 启动平台

```bash
pnpm dev
```

4. Build

```bash
pnpm build
```


## 项目说明

本项目基于 **[Vben Admin](https://github.com/vbenjs/vue-vben-admin)** 二次开发，原框架采用 MIT License 开源。
本项目新增/修改的业务代码，同样遵循 MIT 协议开源。