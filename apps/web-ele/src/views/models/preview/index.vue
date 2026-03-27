<template>
  <div class="three-container" id="container"></div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import * as THREE from 'three';
import { DRACOLoader, GLTFLoader, KTX2Loader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { onMounted, onUnmounted, shallowRef } from 'vue';

// Three.js容器
const scene = shallowRef<THREE.Scene | null>(null);
const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
const mixer = shallowRef<THREE.AnimationMixer | null>(null);
const orbitControl = shallowRef<OrbitControls | null>(null);
const timer = shallowRef<THREE.Timer | null>(null);

const ambientLight = shallowRef<THREE.HemisphereLight | null>(null);
const resizeHandler = shallowRef<(() => void) | null>(null);

const dracoLoader = shallowRef<DRACOLoader | null>(null);
const ktx2Loader = shallowRef<KTX2Loader | null>(null);
const loader = shallowRef<GLTFLoader | null>(null);

const destoryThreeResource = () => {
  // 1. 停止动画循环
  if (renderer.value) {
    renderer.value.setAnimationLoop(null);
  }

  // 2. 停止动画
  if (mixer.value) {
    mixer.value.stopAllAction();
    mixer.value.uncacheRoot(mixer.value.getRoot());
    mixer.value = null;
  }

  // 2. 释放灯光资源
  if (ambientLight.value) {
    ambientLight.value = null;
  }

  // 2. 销毁轨道控制器
  if (orbitControl.value) {
    orbitControl.value.dispose();
    orbitControl.value = null;
  }

  // 3. 释放GPU资源
  if (scene.value) {
    scene.value.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        // 如果材质为数组
        Array.isArray(obj.material)
          ? obj.material.forEach(mat => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          })
          : obj.material.dispose()
      }
    })
    scene.value = null;
  }

  // 5. 清除相机
  camera.value = null;

  if (timer.value) {
    timer.value.disconnect();
    timer.value = null;
  }
  if (resizeHandler.value) {
    window.removeEventListener("resize", resizeHandler.value);
    resizeHandler.value = null;
  }
  
  // 清除加载器
  if (dracoLoader.value) {
    dracoLoader.value.dispose();
    dracoLoader.value = null;
  }
  if (ktx2Loader.value) {
    ktx2Loader.value.dispose();
    ktx2Loader.value = null;
  }
  loader.value = null;

  if (renderer.value) {
    const canvas = renderer.value.domElement;
    canvas?.parentElement?.removeChild(canvas);
    const gl = renderer.value.getContext();
    if (gl) {
    const loseContextExt = gl.getExtension('WEBGL_lose_context');
    if (loseContextExt) {
      loseContextExt.loseContext();
    }
    renderer.value.dispose();
    renderer.value = null;
  }}
}

const adaptCameraToModel = (camera: THREE.PerspectiveCamera, 
                            controls: OrbitControls, 
                            model: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  const cameraDistance = maxSize * 1;
  camera.position.copy(new THREE.Vector3(cameraDistance, cameraDistance, cameraDistance));

  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
  camera.lookAt(center)
}

const initScene = async (glbUrl: string): Promise<void> => {
  // 开始前先销毁现有的
  destoryThreeResource();

  const container: HTMLElement | null = document.getElementById("container");
  if (!container) return;

  timer.value = new THREE.Timer();
  timer.value.connect(document);

  scene.value = new THREE.Scene()
  scene.value.background = new THREE.Color(0xf5f5f5);

  const {clientWidth: width, clientHeight: height} = container;

  camera.value = new THREE.PerspectiveCamera(75, width/height, 0.1, 2000);
  
  renderer.value = new THREE.WebGLRenderer({antialias: true});
  renderer.value.setSize(width, height);
  // 适配设备像素比
  renderer.value.setPixelRatio(window.devicePixelRatio);
  renderer.value.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.value.toneMappingExposure = 2.4;
  // 添加canvas画布
  container.appendChild(renderer.value.domElement);
  
  orbitControl.value = new OrbitControls(camera.value, renderer.value.domElement);
  orbitControl.value.enableDamping = true;
  orbitControl.value.update();
  
  dracoLoader.value = new DRACOLoader();
  dracoLoader.value.setDecoderPath('/libs/draco/gltf/');
  
  ktx2Loader.value = new KTX2Loader();
  ktx2Loader.value.setTranscoderPath("/libs/basis/");
  ktx2Loader.value.detectSupport(renderer.value);
  
  loader.value = new GLTFLoader();
  loader.value.setDRACOLoader(dracoLoader.value);
  loader.value.setKTX2Loader(ktx2Loader.value);
  loader.value.setMeshoptDecoder(MeshoptDecoder);
  
  try {
    const gltf = await loader.value.loadAsync(glbUrl);
    if (!scene.value) return;
    scene.value.add(gltf.scene);
    // 添加半球光
    ambientLight.value = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2)
    scene.value.add(ambientLight.value);

    adaptCameraToModel(camera.value, orbitControl.value, gltf.scene);

    if (gltf.animations.length > 0) {
      const firstAnimation = gltf.animations[0];
      if (firstAnimation) {
        mixer.value = new THREE.AnimationMixer(gltf.scene);
        mixer.value.clipAction(firstAnimation).play();
      }
    }
    ElMessage.success("模型加载成功！");
  } catch (err) {
    ElMessage.error("模型加载失败");
    console.error("模型加载失败：", err);
  }

  // 窗口自适应
  resizeHandler.value = () => {
    if (!camera.value || !renderer.value || !container) return;
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;

    camera.value.aspect = newWidth / newHeight;
    camera.value.updateProjectionMatrix();

    renderer.value.setSize(newWidth, newHeight);
  }
  window.addEventListener("resize", resizeHandler.value);

  if (renderer.value) {
    const animate = (): void => {
      if (!scene.value || !camera.value || !renderer.value || !orbitControl.value || !timer.value) return;
      if (mixer.value) {
        // 获取当前时间，计算差值
        timer.value.update();
        // 获取时间增量
        const delta = timer.value.getDelta();
        // 用时间增量更新mixer
        mixer.value.update(delta);
      }
      

      orbitControl.value.update();
      renderer.value.render(scene.value, camera.value);
  
    }

    renderer.value.setAnimationLoop(animate);
  }

}

onMounted(() => {
  // 获取参数
  const params = new URLSearchParams(window.location.search);
  const encodeGlbUrl = params.get("glbUrl");

  if (!encodeGlbUrl) {
    ElMessage.error("未获取到预览数据！");
    return;
  }
  const glbUrl = decodeURIComponent(encodeGlbUrl)

  initScene(glbUrl);
})

onUnmounted(() => {
  destoryThreeResource();
})

</script>

<style scoped>
.three-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>