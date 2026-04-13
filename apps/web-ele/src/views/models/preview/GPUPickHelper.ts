import * as THREE from 'three'

// GPU拾取
export class GPUPickHelper {
    pickingTexture: THREE.WebGLRenderTarget;
    pixelBuffer: Uint8Array;
    pickedObject: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> | null;
    pickedObjectSavedColor: number;

    // 创建时的初始化
    constructor() {
        this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);   // 画布设置为1个像素
        this.pixelBuffer = new Uint8Array(4);   // 初始化该像素的rgb+不透明度
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;    // 暂存的原始颜色
    }

    // 拾取功能
    pick(cssPosition: {x: number, y: number},   // 鼠标位置
         scene: THREE.Scene,                    // 拾取场景（非实际场景）
         camera: THREE.PerspectiveCamera,       // 相机
         renderer: THREE.WebGLRenderer,         // 像素比
         idMap: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[],
        ) {
        // 如果已有被选中的对象，恢复原始纹理+取消选中
        if (this.pickedObject) {
            this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);    // 还原颜色
            this.pickedObject = null;  // 设置为当前目标未选中
        }

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


        // 设置渲染画布，渲染到这个1*1的像素上
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
            // 选中对象
            this.pickedObject = intersectedObject;
            // 记录对象emissive原始颜色
            this.pickedObjectSavedColor = intersectedObject.material.emissive.getHex();
            // 选中对象进行高亮
            intersectedObject.material.emissive.setHex(0xffff00);
            return id;
        } else {
            if (this.pickedObject) {
                this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
                this.pickedObject = null;
            }
            return 0;
        }

    }
}