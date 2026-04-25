import * as THREE from 'three'

// GPU拾取
export class GPUPickHelper {
    pickingTexture: THREE.WebGLRenderTarget;
    pixelBuffer: Uint8Array;
    pickedObject: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> | null;
    pickedObjectSavedMaterial: THREE.MeshStandardMaterial | null;

    // 创建时的初始化
    constructor() {
        this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);   // 画布设置为1个像素
        this.pixelBuffer = new Uint8Array(4);   // 初始化该像素的rgb+不透明度
        this.pickedObject = null;
        this.pickedObjectSavedMaterial = null;    // 暂存的原始颜色
    }

    // 拾取功能
    pick(cssPosition: {x: number, y: number},   // 鼠标位置
         scene: THREE.Scene,                    // 拾取场景（非实际场景）
         camera: THREE.PerspectiveCamera,       // 相机
         renderer: THREE.WebGLRenderer,         // 像素比
         idMap: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[],
        ): number {
        // 先执行拾取操作
        const pixelRation = renderer.getPixelRatio();
        // 相机裁剪渲染区域
        camera.setViewOffset(
            renderer.getContext().drawingBufferWidth,
            renderer.getContext().drawingBufferHeight,
            Math.floor(cssPosition.x) * pixelRation, // 起始x，将css像素映射为物理像素
            Math.floor(cssPosition.y) * pixelRation, // 起始y，将css像素映射为物理像素
            1,
            1
        );

        // 设置渲染到这个1*1的虚拟画布上
        renderer.setRenderTarget(this.pickingTexture);
        // 渲染
        renderer.render(scene, camera);
        // 还原renderer和camera设置
        renderer.setRenderTarget(null);
        camera.clearViewOffset();

        // 将渲染的像素值pickingTexture存到pixelBuffer里
        renderer.readRenderTargetPixels(
            this.pickingTexture,
            0, // x（pickingTexture）
            0, // y（pickingTexture）
            1, // width
            1, // height
            this.pixelBuffer
        );

        // 解码颜色获取id   
        const id = (this.pixelBuffer[0]! << 16) | (this.pixelBuffer[1]! << 8) | (this.pixelBuffer[2]!);
        // 根据id查找对象
        if (id > 0 && idMap[id]) {
            const intersectedObject = idMap[id];
            // 如果拾取对象和当前选中对象一致
            if (this.pickedObject === intersectedObject) {
                return id;
            }
            // 如果不是，则执行清空操作
            this.clearSelection();
            // 选中对象
            this.pickedObject = intersectedObject;
            // 记录对象emissive原始颜色
            this.pickedObjectSavedMaterial = this.pickedObject.material;
            // 选中对象进行高亮
            this.pickedObject.material = this.pickedObject.material.clone();
            this.pickedObject.material.emissive.setHex(0xffff00);
            return id;
        } else {
            this.clearSelection();
            return 0;
        }
    }
    
    // 恢复功能
    clearSelection() {
        if (this.pickedObject && this.pickedObjectSavedMaterial) {
            // 释放克隆的材质
            this.pickedObject.material.dispose();
            // 恢复原始材质
            this.pickedObject.material = this.pickedObjectSavedMaterial;
            // 选取对象置为空
            this.pickedObject = null;
            this.pickedObjectSavedMaterial = null;
        }
    }
}