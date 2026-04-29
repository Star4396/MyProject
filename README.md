# 三维模型智能管理平台
欢迎来的我的个人项目！

本项目是一个基于 VBen Admin ( Element Plus ) 开发的工业级三维模型全生命周期管理解决方案，实现模型上传、智能预览、组件级交互与爆炸视图分析的一体化工作流。

当前代码只包含前端部分，后端代码请[点击这里](https://github.com/Star4396/springboot)：

## 技术架构

- **前端**：Vue 3 + TypeScript + Vite + Three.js + Element Plus

- **后端**：Spring Boot 3 + MyBatis + MySQL

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


## 功能演示

### 模型管理界面
下面依次展示模型管理的基本功能：

查找，新增，修改，分页，下载，删除，批量删除

https://github.com/user-attachments/assets/84d3c6f8-3ba9-483f-8509-690c1cd79a35

### 三维预览模式

点击“预览”，首先进入的是整体预览模式，支持播放动画及相机控制

三维模型：**鹦鹉**

https://github.com/user-attachments/assets/52e201d1-19f7-491c-a64d-a8e0734247bb

三维模型：**地牢**

https://github.com/user-attachments/assets/b5a3154c-cff5-4c63-af72-5d85a8565061

### 组件级交互
点击“开启组件预览”按钮进入**组件预览模式**，进入时当前动画会停止。

组件级交互共涉及两种：

1. 鼠标hover在信息表时，对应组件高亮；鼠标hover退出时，组件恢复

2. 鼠标hover在组件上时，组件高亮+弹出提示框（显示组件信息）；鼠标hover退出时，组件恢复+提示框消失

三维模型：**鹦鹉**

https://github.com/user-attachments/assets/570d20b7-6029-4cf8-b6fa-87520a08c655

三维模型：**地牢**

https://github.com/user-attachments/assets/6fb0b5d5-7a08-4268-9f05-1d0b6514b5a0

### 爆炸视图
开启组件预览模式时会出现“开启爆炸视图”按钮，点击开启

三维模型：**地牢**

https://github.com/user-attachments/assets/364ce6df-1c8f-415b-8658-e0d51857fa75

三维模型：**鹦鹉**（由于开启爆炸视图至少需要两个组件，而鹦鹉只有一个，所以禁用该功能）

https://github.com/user-attachments/assets/8dc0709a-0a50-4d4e-a544-bec2ad84a97c

## 快速开始

### 环境要求

- Node.js 18+
- JDK 21
- MySQL 8.0
- Maven 3.9+

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

4. 部署

```bash
pnpm build
```

## 项目结构

可以访问上面的[后端代码](https://github.com/Star4396/springboot)并克隆到MyProject的**同级目录**下

完整项目结构：

```
你的路径/
├── MyProject       # 前端代码
│   ├── apps
│   │   ├── backend-mock/    # vben自带的mock服务，不用管它 
│   │   ├── web-ele/         # 核心项目
│   ├── 其他
├── springboot      # 后端代码

```


## 项目说明

本项目基于 **[Vben Admin](https://github.com/vbenjs/vue-vben-admin)** 二次开发，原框架采用 MIT License 开源。
本项目新增/修改的业务代码，同样遵循 MIT 协议开源。