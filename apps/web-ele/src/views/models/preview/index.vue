<template>
  <div>
    <div style="position: absolute; padding: 50px; font-size: 36px; font-weight: bold;">{{previewTitle}}</div>
    <div style="position: absolute; margin: 120px 50px; font-size: 20px;">
      <span>开启组件预览：</span>
      <el-switch v-model="previewMode" :active-value="true" :inactive-value="false" size="large" @change="previewChange"/>
    </div>
    <div v-show="previewMode" style="position: absolute; margin: 165px 50px; font-size: 20px;">
      <span>开启爆炸视图：</span>
      <el-switch v-model="explodeMode" :active-value="true" :inactive-value="false" size="large" @change="handleExplode"/>
    </div>
    <div v-show="previewMode" style="right: 0; position: absolute; padding: 50px; ">
      <el-table 
        style="width: 240px; "
        max-height="600" 
        :data="partsList" 
        stripe 
        @cell-mouse-enter="handleMouseEnter"
        @cell-mouse-leave="handleMouseLeave"
      >
        <el-table-column prop="id" label="id" width="50" />
        <el-table-column prop="name" label="名称" width="150" />
      </el-table>

    </div>
    <el-tooltip
      v-model:visible="visible"
      content="测试" 
      placement="top" 
      effect="dark"
      virtual-triggering
      :virtual-ref="tooltipRef"
    >
      <template #content>
        <div>
          <p>组件id: {{ partInfo.id }}</p>
          <p>组件名称: {{ partInfo.name }}</p>
        </div>
      </template>
    </el-tooltip>
    <div class="three-container" id="container"></div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, ElSwitch, ElTable, ElTableColumn, ElTooltip } from 'element-plus';
import * as THREE from 'three';
import { DRACOLoader, GLTFLoader, KTX2Loader, OrbitControls, Sky } from 'three/examples/jsm/Addons.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import type { PartData } from '../models_manager/model';
import { GPUPickHelper } from './GPUPickHelper';

// 组件预览模式
const previewMode = ref<boolean>(false);
// 爆炸视图
const explodeMode = ref<boolean>(false);
// 预览标题
const previewTitle = computed(() => {
  return previewMode.value ? "组件预览模式" : "整体预览模式";
})
const visible = ref<boolean>(false);
const tooltipRef = ref({
  getBoundingClientRect: () => toolPosition.value,
});
const partInfo = ref<{ id: number; name: string; }>({});
const targetPoints = ref([]);
const radius = ref<number>(0);

let stopAnimation_raw = null;
let stopAnimation_pick = null;

// 预览状态变化
const previewChange = () => {
  if (!renderer.value) return;
  // 开启组件预览
  if (previewMode.value) {
    renderer.value.domElement.addEventListener("mousemove", setPickPosition);
    renderer.value.domElement.addEventListener("mouseleave", clearPickPosition);
    if (mixer.value && scene.value && idMap.value.length) {
      // 停止动画
      mixer.value.stopAllAction();
      mixer.value.uncacheRoot(mixer.value.getRoot());
      mixer.value = null;
      // 恢复到原始位置
      for (let obj in idMap) {
        obj.position = obj.userData.originalPosition;
      }
    }
  } else {
    // 顺便关闭爆炸预览
    if (explodeMode.value) {
      explodeMode.value = false;
    }
    // // 恢复动画
    // if (gltf.animations.length > 0) {
    //   const firstAnimation = gltf.animations[0];
    //   if (firstAnimation) {
    //     mixer.value = new THREE.AnimationMixer(gltf.scene);
    //     mixer.value.clipAction(firstAnimation).play();
    //   }
    // }
    // 移除监听
    renderer.value.domElement.removeEventListener("mousemove", setPickPosition);
    renderer.value.domElement.removeEventListener("mouseleave", clearPickPosition);
  }
}

// 处理部件表hover
const handleMouseEnter = (row: PartData) => {
  const obj = idMap.value[row.id];
  obj.material.emissive.setHex(0xffff00);
}

const handleMouseLeave = (row: PartData) => {
  const obj = idMap.value[row.id];
  obj.material.emissive.setHex(obj.userData.originalColor);
}

// 处理爆炸视图
const handleExplode = () => {
  if (explodeMode.value) {
    if (idMap.value.length && targetPoints.value.length && pickIdMap.value.length) {
      // 原始场景动画
      if (stopAnimation_raw) stopAnimation_raw();
      stopAnimation_raw = animateToSpherePoints(idMap.value, targetPoints.value, 1500);
      // 拾取场景动画
      if (stopAnimation_pick) stopAnimation_pick();
      stopAnimation_pick = animateToSpherePoints(pickIdMap.value, targetPoints.value, 1500);
    }
  } else {
    if (stopAnimation_raw) stopAnimation_raw();
    stopAnimation_raw = resetToOriginal(idMap.value, 1500);
    // 拾取场景动画
    if (stopAnimation_pick) stopAnimation_pick();
    stopAnimation_pick = resetToOriginal(pickIdMap.value, 1500);
  }
}

// 生成球面上均匀分布的点
const generateSpherePoints = (n: number, radius: number, center = new THREE.Vector3()) => {
  const targetPoints = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 黄金角度
  
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2; // y从1到-1
    const radiusAtY = Math.sqrt(1 - y * y);
    
    const theta = goldenAngle * i;
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    const point = new THREE.Vector3(x, y, z)
      .multiplyScalar(radius)
      .add(center);
    
    targetPoints.push(point);
  }
  
  return targetPoints;
}

// 缓动函数
const easeInOutCubic = (t: number) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 平滑移动动画
const animateToSpherePoints = (meshes: THREE.Mesh[], targetPoints: [], duration: number = 2000) => {
  const startPosition = meshes.map(mesh => mesh.position.clone());
  // 记录动画开始时间
  const startTime = performance.now();
  let animateId: number | null = null;

  const animateExplode = () => {
    const currentTime = performance.now();
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const easeProgress = easeInOutCubic(progress);

    meshes.forEach((mesh, i) => {
      mesh.position.lerpVectors(startPosition[i], targetPoints[i-1], easeProgress);
    })

    if (progress < 1) {
      animateId = requestAnimationFrame(animateExplode);
    } else {
      meshes.forEach((mesh, i) => {
        mesh.position.copy(targetPoints[i-1]);
      })
      cancelAnimationFrame(animateId);
    }
  }

  // 返回动画id，用于停止动画
  animateId = requestAnimationFrame(animateExplode);

  // 返回停止动画的函数
  return () => {
    if (animateId) cancelAnimationFrame(animateId);
  };
}

const resetToOriginal = (meshes: THREE.Mesh[], duration: number = 2000) => {
  const startTime = performance.now();
  const startPosition = meshes.map(mesh => mesh.position.clone());
  const targetPosition = meshes.map(mesh => mesh.userData.originalPosition);
  let animateId: number | null = null;

  const animateReset = () => {
    const currentTime = performance.now();
    const progress = Math.min(((currentTime - startTime) / duration), 1);
    const easeProgress = easeInOutCubic(progress);

    meshes.forEach((mesh, i) => {
      mesh.position.lerpVectors(startPosition[i], targetPosition[i], easeProgress);
    })

    if (progress < 1) {
      animateId = requestAnimationFrame(animateReset);
    } else {
      meshes.forEach((mesh, i) => {
        mesh.position.copy(targetPosition[i]);
      })
    }
  }

  // 注册动画
  animateId = requestAnimationFrame(animateReset);

  return () => {
    if (animateId) cancelAnimationFrame(animateId);
  }
}


// Three.js容器
const scene = shallowRef<THREE.Scene | null>(null); // 渲染场景
const pickingScene = shallowRef<THREE.Scene | null>(null); // 拾取场景

const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
const mixer = shallowRef<THREE.AnimationMixer | null>(null);
const orbitControl = shallowRef<OrbitControls | null>(null);
const timer = shallowRef<THREE.Timer | null>(null);

// 部件相关
const partsList = ref<PartData[]>([]);
const idMap = ref<THREE.Object3D[]>([]);
const pickIdMap = ref<THREE.Object3D[]>([]);
// 用于提示框展示
const toolPosition = ref({x: 0, y: 0} as DOMRect);
// 用于GPU拾取
const pickPosition = ref({x: 0, y: 0});
  
// 环境光相关
const pmremGenerater = shallowRef<THREE.PMREMGenerator | null>(null);
const ambientLight = shallowRef<THREE.AmbientLight | null>(null);

// 监听窗口变化
const resizeHandler = shallowRef<(() => void) | null>(null);

// 各种加载器
const dracoLoader = shallowRef<DRACOLoader | null>(null);
const ktx2Loader = shallowRef<KTX2Loader | null>(null);
const loader = shallowRef<GLTFLoader | null>(null);

// 获取鼠标CSS像素位置
const setPickPosition = (event: MouseEvent) => {
  // 设置提示框的位置（视口坐标系）
  toolPosition.value = DOMRect.fromRect({
    x: event.clientX,
    y: event.clientY
  })
  // 设置鼠标在canvas中的位置，用于GPU拾取
  pickPosition.value.x = event.offsetX;
  pickPosition.value.y = event.offsetY;
}

// 清空选中
const clearPickPosition = () => {
  toolPosition.value.x = -100000;
  toolPosition.value.y = -100000;
  pickPosition.value.x = -100000;
  pickPosition.value.y = -100000;
  visible.value = false;
}

// 销毁函数
const destoryThreeResource = () => {
  // 1. 停止动画循环
  if (renderer.value) {
    renderer.value.setAnimationLoop(null);
    // 如果还开启
    if (previewMode.value) {
      renderer.value.domElement.removeEventListener("mousemove", setPickPosition);
      renderer.value.domElement.removeEventListener("mouseleave", clearPickPosition);
      previewMode.value = false;
    }
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
    pmremGenerater.value?.dispose();
    pmremGenerater.value = null;
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

  partsList.value = [];
  targetPoints.value = [];
  idMap.value = [];
  pickIdMap.value = [];
  
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
    }
  }
}
  
const adaptCameraToModel = (camera: THREE.PerspectiveCamera, 
                            controls: OrbitControls, 
                            model: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  radius.value = maxSize;
  
  camera.position.copy(new THREE.Vector3(maxSize, 0, maxSize));
  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
  camera.lookAt(center);
}

const initScene = async (glbUrl: string): Promise<void> => {
  // 开始前先销毁现有的
  destoryThreeResource();

  const container: HTMLElement | null = document.getElementById("container");
  if (!container) return;

  timer.value = new THREE.Timer();
  timer.value.connect(document);

  // 真实场景
  scene.value = new THREE.Scene();
  // 拾取场景
  pickingScene.value = new THREE.Scene();
  pickingScene.value.background = new THREE.Color(0); // 背景设置为黑
  
  const {clientWidth: width, clientHeight: height} = container;
  camera.value = new THREE.PerspectiveCamera(75, width/height, 0.1, 2000);
  
  renderer.value = new THREE.WebGLRenderer({antialias: true});
  renderer.value.setSize(width, height);
  // 适配设备像素比
  renderer.value.setPixelRatio(window.devicePixelRatio);
  renderer.value.toneMapping = THREE.ACESFilmicToneMapping;
  // 添加canvas画布
  container.appendChild(renderer.value.domElement);

  // 创建环境贴图
  const sky = new Sky();
  const uniforms = sky.material.uniforms;
  uniforms['turbidity']!.value = 0;  // 浑浊度，0清澈
  uniforms['rayleigh']!.value = 3; // 散射强度
  uniforms['mieDirectionalG']!.value = 0.7;  // 前向散射
  uniforms['sunPosition']!.value.set( - 0.8, 0.19, 0.56 );  // 太阳位置
  pmremGenerater.value = new THREE.PMREMGenerator(renderer.value);
  const environmnet = pmremGenerater.value.fromScene(sky).texture;
  scene.value.background = environmnet; // 天空背景
  scene.value.environment = environmnet;  // 光照条件
  
  // 创建轨道控制器
  orbitControl.value = new OrbitControls(camera.value, renderer.value.domElement);
  orbitControl.value.enableDamping = true;  // 需要在渲染函数中调用orbitControl.update
  orbitControl.value.update();
  
  // 加载器
  dracoLoader.value = new DRACOLoader();
  dracoLoader.value.setDecoderPath('/libs/draco/gltf/');
  
  ktx2Loader.value = new KTX2Loader();
  ktx2Loader.value.setTranscoderPath("/libs/basis/");
  ktx2Loader.value.detectSupport(renderer.value);
  
  loader.value = new GLTFLoader();
  loader.value.setDRACOLoader(dracoLoader.value);
  loader.value.setKTX2Loader(ktx2Loader.value);
  loader.value.setMeshoptDecoder(MeshoptDecoder);
  
  // 读取模型
  try {
    const gltf = await loader.value.loadAsync(glbUrl);
    if (!scene.value) return;
    scene.value.add(gltf.scene);
    // 添加半球光
    ambientLight.value = new THREE.AmbientLight(0xffffff, 1)
    scene.value.add(ambientLight.value);

    // 设置视角
    adaptCameraToModel(camera.value, orbitControl.value, gltf.scene);
  
    // 收集组件列表
    gltf.scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const id = partsList.value.length + 1;  // 记录id

        obj.userData["id"] = id;
        obj.userData["originalPosition"] = obj.position.clone();  // 原始位置，用于爆炸视图
        obj.userData["originalColor"] = obj.material.emissive.getHex(); // 原始颜色，用于还原高亮

        // 加入组件列表，用于信息展示
        partsList.value.push({
          id: id,
          name: obj.userData.name,
        });
        // 用于拾取
        idMap.value[id] = obj;

        // 基于id构建材质
        const pickingMaterial = new THREE.MeshPhongMaterial({
          emissive: new THREE.Color().setHex(id, THREE.NoColorSpace),
          color: new THREE.Color(0, 0, 0),
          specular: new THREE.Color(0, 0, 0),
          map: null,
          transparent: true,  // 支持透明纹理
          side: THREE.DoubleSide, // 正反两面都可以拾取
          alphaTest: 0.5,   // 透明裁剪
          blending: THREE.NoBlending  // 确保颜色一致
        })
        // 基于新材质构建一模一样的对象
        const pickingObj = new THREE.Mesh(obj.geometry, pickingMaterial);
        pickingScene.value?.add(pickingObj);
        pickingObj.userData = obj.userData;
        pickingObj.position.copy(obj.position);
        pickingObj.rotation.copy(obj.rotation);
        pickingObj.scale.copy(obj.scale);

        pickIdMap.value[id] = pickingObj;
      }
    })

    targetPoints.value = generateSpherePoints(partsList.value.length, radius.value)

    // 播放动画
    if (gltf.animations.length > 0) {
      const firstAnimation = gltf.animations[0];
      if (firstAnimation) {
        mixer.value = new THREE.AnimationMixer(gltf.scene);
        mixer.value.clipAction(firstAnimation).play();
      }
    }

    if (previewMode.value) {
      renderer.value.domElement.addEventListener("mousemove", setPickPosition);
      renderer.value.domElement.addEventListener("mouseleave", clearPickPosition);
      if (mixer.value && scene.value && idMap.value.length) {
        // 停止动画
        mixer.value.stopAllAction();
        mixer.value.uncacheRoot(mixer.value.getRoot());
        mixer.value = null;
        // 恢复到原始位置
        for (let obj in idMap) {
          obj.position = obj.userData.originalPosition;
        }
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

  const pickHelper = new GPUPickHelper();

  const animate = (): void => {
    if (!scene.value || !camera.value || !renderer.value || !orbitControl.value || !timer.value || !pickingScene.value) return;
    if (mixer.value) {
      // 获取当前时间，计算差值
      timer.value.update();
      // 获取时间增量
      const delta = timer.value.getDelta();
      // 用时间增量更新mixer
      mixer.value.update(delta);
    }

    orbitControl.value.update();
    if (previewMode.value && scene.value) {
      const pickId = pickHelper.pick(pickPosition.value, pickingScene.value, camera.value, renderer.value, idMap.value);
      if (pickId > 0) {
        partInfo.value = partsList.value.find(item => item.id === pickId)!;
        visible.value = true;
      } else {
        visible.value = false
      }
    }
    renderer.value.render(scene.value, camera.value);

  }

  renderer.value.setAnimationLoop(animate);

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