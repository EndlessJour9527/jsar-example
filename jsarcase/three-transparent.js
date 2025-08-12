import * as THREE from 'three';
import { createScene } from './webgl_materials_physical_transmission.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * 主初始化函数
 */
async function init() {

  /**
   * 初始化Three.js场景
   * @returns {Object} 包含scene和camera的对象
   */
  function initScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1.0, 0.1, 1000);
    const light = new THREE.DirectionalLight(0xffffff, 6);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 1, 1);
    light.position.set(0, 1, 1);
    scene.add(light);
    scene.add(pointLight);
    return { scene, camera };
  }

  // ==================== 加载动画相关 ====================

  /**
   * 创建加载动画小球
   * @returns {THREE.Group} 加载动画组
   */
  function createLoadingBalls() {
    const loadingGroup = new THREE.Group();
    loadingGroup.name = 'loadingBalls';

    // 预估模型的缩放因子
    const estimatedScaleFactor = 0.01;
    const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
    const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x2ecc71 });

    // 创建3个小球
    for (let i = 0; i < 3; i++) {
      const ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.set((i - 1) * 3, 0, 0);
      loadingGroup.add(ball);
    }

    // 设置加载动画组的位置和缩放
    loadingGroup.scale.setScalar(estimatedScaleFactor);
    loadingGroup.position.set(0, 0, 0);

    return loadingGroup;
  }

  /**
   * 实现小球的缩放动画
   * @param {THREE.Group} loadingGroup 加载动画组
   * @param {number} duration 动画持续时间(ms)
   * @param {number} targetScale 目标缩放因子
   * @param {Function} onComplete 完成回调
   */
  function animateLoadingBallsScale(loadingGroup, duration, targetScale, onComplete) {
    if (!loadingGroup) {
      if (onComplete) onComplete();
      return;
    }

    const startTime = Date.now();
    const initialScale = loadingGroup.scale.x;
    const scaleRange = targetScale - initialScale;

    console.log('开始缩放动画 - 初始缩放:', initialScale, '目标缩放:', targetScale);

    function updateScale() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用easeInOutQuad缓动函数
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentScale = initialScale + scaleRange * easeProgress;
      loadingGroup.scale.setScalar(currentScale);

      if (progress < 1) {
        requestAnimationFrame(updateScale);
      } else {
        // 动画完成，确保最终缩放值准确
        loadingGroup.scale.setScalar(targetScale);
        console.log('缩放动画完成 - 最终缩放:', targetScale);
        if (onComplete) onComplete();
      }
    }

    requestAnimationFrame(updateScale);
  }

  /**
   * 小球跳动动画
   * @param {THREE.Group} loadingGroup 加载动画组
   */
  function animateLoadingBalls(loadingGroup) {
    if (!loadingGroup || !loadingGroup.visible) return;

    const time = Date.now() * 0.005;
    const amplitude = 1; // 跳动幅度

    loadingGroup.children.forEach((ball, i) => {
      ball.position.y = Math.sin(time + i * 0.8) * amplitude;
    });
  }

  /**
   * 移除加载动画
   * @param {THREE.Scene} scene 场景对象
   * @param {Function} callback 完成回调
   */
  function removeLoadingBalls(scene, callback) {
    const loadingGroup = scene.getObjectByName('loadingBalls');
    if (!loadingGroup) {
      if (callback) callback();
      return;
    }

    // 先执行缩放到0的动画，然后移除
    animateLoadingBallsScale(loadingGroup, 500, 0, () => {
      loadingGroup.visible = false;
      scene.remove(loadingGroup);

      // 清理资源
      loadingGroup.children.forEach(ball => {
        if (ball.geometry) ball.geometry.dispose();
        if (ball.material) ball.material.dispose();
      });

      console.log('加载动画已移除');
      if (callback) callback();
    });
  }

  // ==================== 模型加载 ====================

  /**
   * 加载GLTF模型
   * @param {string} url 模型URL
   * @param {Function} onLoaded 加载完成回调
   */
  function loadModel(url, onLoaded) {
    if (!url) {
      console.error('模型URL为空');
      if (onLoaded) onLoaded(new Error('模型URL为空'));
      return;
    }

    console.log('开始加载模型:', url);
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        console.log('模型加载成功');

        // 移除加载动画
        removeLoadingBalls(scene, () => {
          setTimeout(() => {
            processLoadedModel(gltf);
            if (onLoaded) onLoaded();
          }, 100);
        });
      },
      (progress) => {
        console.log('加载进度:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('模型加载失败:', error);
        removeLoadingBalls(scene, () => {
          if (onLoaded) onLoaded(error);
        });
      }
    );
  }

  /**
   * 处理已加载的模型
   * @param {Object} gltf GLTF对象
   */
  function processLoadedModel(gltf) {
    const parentGroup = new THREE.Group();
    const model = gltf.scene;

    // 禁用模型网格的射线投射
    model.traverse((node) => {
      if (node.isMesh) {
        node.raycast = () => { };
      }
    });

    parentGroup.add(model);
    parentGroup.name = rotateRootName;

    // 处理动画
    setupModelAnimations(gltf, model);

    // 处理模型尺寸和位置
    setupModelTransform(model, parentGroup);

    // 添加到场景
    group.add(parentGroup);
  }

  /**
   * 设置模型动画
   * @param {Object} gltf GLTF对象
   * @param {THREE.Object3D} model 模型对象
   */
  function setupModelAnimations(gltf, model) {
    if (gltf.animations && gltf.animations.length > 0) {
      animationControl.mixer = new THREE.AnimationMixer(model);
      animationControl.animations = gltf.animations.map(anim => ({
        name: anim.name,
        action: animationControl.mixer.clipAction(anim),
        duration: anim.duration
      }));

      if (animationControl.animations.length > 0 && isPlayAnimation) {
        playAnimation(animationControl, 0);
      }

      console.log('模型动画设置完成，动画数量:', animationControl.animations.length);
    }
  }

  /**
   * 设置模型变换（位置、缩放等）
   * @param {THREE.Object3D} model 模型对象
   * @param {THREE.Group} parentGroup 父组
   */
  function setupModelTransform(model, parentGroup) {
    // 计算包围盒
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 模型居中
    model.position.sub(center);

    // 创建不可见的碰撞盒用于交互
    const collisionBox = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshBasicMaterial({ color: 0xffff00, visible: false })
    );
    parentGroup.add(collisionBox);

    // 计算缩放因子
    const scaleFactor = 1.0 / (Math.max(size.x, size.y, size.z) * 5);
    parentGroup.scale.setScalar(scaleFactor);
    parentGroup.position.set(0, 0, 0);

    console.log('模型尺寸设置完成，缩放因子:', scaleFactor);
  }

  // ==================== 动画控制 ====================

  /**
   * 播放动画
   * @param {Object} animationControl 动画控制器
   * @param {number} index 动画索引
   */
  function playAnimation(animationControl, index) {
    if (!animationControl.mixer || animationControl.animations.length === 0) {
      console.warn('没有可播放的动画');
      return;
    }

    // 停止当前动画
    if (animationControl.currentAnimation) {
      animationControl.currentAnimation.action.stop();
    }

    // 播放新动画
    const anim = animationControl.animations[index];
    anim.action.reset();
    anim.action.clampWhenFinished = false;
    anim.action.setLoop(THREE.LoopRepeat);
    anim.action.play();

    animationControl.currentAnimation = anim;
    animationControl.isPlaying = true;

    console.log('开始播放动画:', anim.name);
  }

  // ==================== XR控制器 ====================

  /**
   * 获取XR控制器
   * @param {THREE.WebGLRenderer} renderer 渲染器
   * @param {number} index 控制器索引
   * @param {THREE.Scene} scene 场景
   * @param {boolean} isShowLine 是否显示射线
   * @returns {THREE.XRTargetRaySpace} 控制器对象
   */
  function getXRController(renderer, index, scene, isShowLine) {
    const controller = renderer.xr.getController(index);
    scene.add(controller);

    if (isShowLine) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
      ]);
      const line = new THREE.Line(geometry);
      line.scale.z = 5;
      controller.add(line.clone());
    }

    return controller;
  }

  /**
   * 启动XR会话
   */
  async function startXRSession() {
    if (!navigator.xr) {
      console.error('WebXR不支持');
      return;
    }
    const session = await navigator.xr.requestSession('immersive-ar', {})
    return setupXRSession(session);
  }

  /**
   * 设置XR会话
   * @param {XRSession} session XR会话
   */
  function setupXRSession(session) {
    const renderer = gl
      ? new THREE.WebGLRenderer({ context: gl })
      : new THREE.WebGLRenderer({ antialias: true });

    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');

    if (gl) {
      const baseLayer = new XRWebGLLayer(session, gl);
      session.updateRenderState({ baseLayer });
    }

    // 设置控制器
    const controller = xrControl.selectingController = getXRController(
      renderer, controllerIndex, scene, isShowLine
    );

    // 事件监听
    session.addEventListener('selectstart', onSelectStart(controller, xrControl, group));
    session.addEventListener('selectend', () => {
      xrControl.isDragging = false;
      xrControl.selectedObject = null;
    });
    session.addEventListener('end', () => cleanup(renderer, scene));

    renderer.xr.setSession(session);

    // 渲染循环
    renderer.setAnimationLoop(() => {
      // 更新模型动画
      if (animationControl.mixer && animationControl.isPlaying) {
        const delta = animationControl.clock.getDelta();
        animationControl.mixer.update(delta);
      }

      // 处理控制器交互
      handleControllerSelect(controller, xrControl);

      // 更新加载动画
      const loadingGroup = scene.getObjectByName('loadingBalls');
      if (loadingGroup && loadingGroup.visible) {
        animateLoadingBalls(loadingGroup);
      }

      renderer.render(scene, camera);
    });

    return renderer;
  }

  // ==================== XR交互处理 ====================

  /**
   * 选择开始事件处理
   * @param {THREE.XRTargetRaySpace} controller 控制器
   * @param {Object} xrControl XR控制对象
   * @param {THREE.Group} group 模型组
   * @returns {Function} 事件处理函数
   */
  function onSelectStart(controller, xrControl, group) {
    return (evt) => {
      const { raycaster } = xrControl;
      const intersects = getIntersections(controller, raycaster, group);

      if (intersects.length > 0) {
        const position = getControllerPosition(controller);
        xrControl.selectedModel = intersects[0].object.parent ?? intersects[0].object;
        xrControl.isDragging = true;
        xrControl.controllerPrev.copy(position);

        console.log('选中模型:', xrControl.selectedModel.name);
      }
    };
  }

  /**
   * 处理控制器选择
   * @param {THREE.XRTargetRaySpace} controller 控制器
   * @param {Object} xrControl XR控制对象
   */
  function handleControllerSelect(controller, xrControl) {
    const { selectedModel, isDragging, controllerPrev } = xrControl;

    if (isDragging && selectedModel) {
      const currentPosition = getControllerPosition(controller);
      const delta = currentPosition.clone().sub(controllerPrev);

      delta.multiplyScalar(xrControl.rotationSpeed);
      delta.set(delta.x, -delta.y, 0); // 只使用x和y分量

      applyCameraRelativeRotation(selectedModel, delta);
      xrControl.controllerPrev.copy(currentPosition);
    }
  }

  /**
   * 获取交集
   * @param {THREE.XRTargetRaySpace} controller 控制器
   * @param {THREE.Raycaster} raycaster 射线投射器
   * @param {THREE.Group} group 模型组
   * @returns {Array} 交集数组
   */
  function getIntersections(controller, raycaster, group) {
    if (!controller) return [];

    controller.updateMatrixWorld();
    raycaster.setFromXRController(controller);
    return raycaster.intersectObjects(group.children, true);
  }

  /**
   * 获取控制器位置
   * @param {THREE.XRTargetRaySpace} controller 控制器
   * @returns {THREE.Vector3} 位置向量
   */
  function getControllerPosition(controller) {
    if (!controller) {
      console.warn('控制器为空');
      return new THREE.Vector3();
    }

    controller.updateMatrixWorld();
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(controller.matrixWorld);
    return position;
  }

  /**
   * 应用相机相对旋转
   * @param {THREE.Object3D} model 模型对象
   * @param {THREE.Vector3} deltaMove 移动增量
   * @param {number} rotationSpeed 旋转速度
   */
  function applyCameraRelativeRotation(model, deltaMove, rotationSpeed = 0.01) {
    if (!model || !deltaMove) {
      console.warn('模型或移动增量为空');
      return;
    }

    if (!deltaMove.x && !deltaMove.y) {
      return; // 没有移动
    }

    // 创建旋转四元数
    const quaternionY = new THREE.Quaternion();
    const quaternionX = new THREE.Quaternion();

    // Y轴旋转（水平）
    quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaMove.x * rotationSpeed);

    // X轴旋转（垂直）- 限制范围
    const currentEuler = new THREE.Euler();
    currentEuler.setFromQuaternion(model.quaternion, 'YXZ');

    const newXRotation = currentEuler.x + deltaMove.y * rotationSpeed;
    const clampedXRotation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newXRotation));

    quaternionX.setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      clampedXRotation - currentEuler.x
    );

    // 应用旋转
    model.quaternion.multiplyQuaternions(quaternionY, model.quaternion);
    model.quaternion.multiplyQuaternions(model.quaternion, quaternionX);
  }

  function createTransparentObj() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const glassMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x2ecc71),
      // envMap: envMap,
      // combine: THREE.MixOperation,
      // reflectivity: 0.6, // 越高越镜面
      opacity: 0.1,
      transparent: true,
      // side: THREE.DoubleSide,
      // depthWrite: false, // 防止透明物体遮挡后面的物体
    });
    const mesh = new THREE.Mesh(geometry, glassMaterial);
    mesh.scale.set(0.1, 0.1, 0.1);
    return mesh;
  }

  /**
   * 清理资源
   * @param {THREE.WebGLRenderer} renderer 渲染器
   * @param {THREE.Scene} scene 场景
   */
  function cleanup(renderer, scene) {
    console.log('开始清理资源');

    renderer.setAnimationLoop(null);

    scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    console.log('资源清理完成');
  }

  // ==================== 主流程初始化 ====================

  // 常量定义
  const rotateRootName = 'rotate-component-container';
  const isShowLine = false;
  const controllerIndex = 1;
  const gl = navigator.gl;

  // 初始化场景
  const { scene, camera } = initScene();
  const group = new THREE.Group();
  scene.add(group);

  // 动画控制器
  const animationControl = {
    mixer: null,
    animations: [],
    clock: new THREE.Clock(),
    currentAnimation: null,
    isPlaying: false
  };

  // XR控制器
  const xrControl = {
    selectedObject: null,
    selectingController: null,
    isSelecting: false,
    selectedModel: null,
    isDragging: false,
    isMouseDown: false,
    controllerPrev: new THREE.Vector3(),
    raycaster: new THREE.Raycaster(),
    rotationSpeed: 3000.0,
  };

  // const obj = createTransparentObj();
  // group.add(obj);
  // group.position.set(0, 0, -0.2);
  const renderer = await startXRSession();
  createScene(renderer, camera, scene);
  // // 加载模型
  const modelUrl = 'http://192.168.2.2:5501/viewer/银色Glasses_CMF_BasicMaterial.glb';
  // loadModel(modelUrl, () => {
  //   // 创建并显示加载动画
  //   // const loadingGroup = createLoadingBalls();
  //   // group.add(loadingGroup);
  //   // loadingGroup.visible = true;
  //   console.log('加载动画创建完成');
  // }
  // );
}


// ==================== 程序入口 ====================
try {
  console.log('开始初始化应用');
  init();
} catch (error) {
  console.error('应用初始化失败:', error);
}