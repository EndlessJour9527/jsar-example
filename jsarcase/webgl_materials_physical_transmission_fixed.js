import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export function createScene(renderer, camera, scene) {
  const params = {
    color: 0xffffff,
    transmission: 1,
    opacity: 1,
    metalness: 0,
    roughness: 0,
    ior: 1.5,
    thickness: 0.01,
    specularIntensity: 1,
    specularColor: 0xffffff,
    envMapIntensity: 1,
    lightIntensity: 1,
    exposure: 1,
    transmissionResolutionScale: 1
  };

  let mesh;
  const host = window.location.origin;
  // const envMap = new RGBELoader()
  //   .setPath('http://127.0.0.1:5566/assets/textures/equirectangular/')
  //   .load('royal_esplanade_1k.hdr', function () {

  //     envMap.mapping = THREE.EquirectangularReflectionMapping;

  //     init();
  //     render();

  //   });

  let envMap;
  function loadCubeMap() {
    const path = host + '/assets/textures/equirectangular/park/';
    const format = '.jpg';
    const urls = [
      path + 'posx' + format,
      path + 'negx' + format,
      path + 'posy' + format,
      path + 'negy' + format,
      path + 'posz' + format,
      path + 'negz' + format,
    ];
    const textureLoader = new THREE.CubeTextureLoader();
    textureLoader.load(urls, (data) => {
      envMap = data;
      envMap.mapping = THREE.CubeReflectionMapping;
      // init();
    });
  }
  loadCubeMap();

  // 创建天空盒几何体来替代scene.background
  function createSkybox(envMap) {
    const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyboxMaterial = new THREE.MeshBasicMaterial({
      envMap: envMap,
      side: THREE.BackSide
    });
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    skybox.name = 'skybox';
    return skybox;
  }

  function init() {
    // renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = params.exposure;

    // 在XR环境中，不直接设置scene.background，而是使用天空盒几何体
    // scene.background = envMap; // 这行会导致XR双目渲染不一致
    
    // 方案1: 使用scene.environment替代scene.background
    scene.environment = envMap;
    
    // 方案2: 创建天空盒几何体（可选，如果需要可见的背景）
    const skybox = createSkybox(envMap);
    scene.add(skybox);

    //

    const geometry = new THREE.SphereGeometry(20, 64, 32);

    const texture = new THREE.CanvasTexture(generateTexture());
    texture.magFilter = THREE.NearestFilter;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(1, 3.5);

    const material = new THREE.MeshPhysicalMaterial({
      color: params.color,
      metalness: params.metalness,
      roughness: params.roughness,
      ior: params.ior,
      alphaMap: texture,
      envMap: envMap,
      envMapIntensity: params.envMapIntensity,
      transmission: params.transmission, // use material.transmission for glass materials
      specularIntensity: params.specularIntensity,
      specularColor: params.specularColor,
      opacity: params.opacity,
      side: THREE.DoubleSide,
      transparent: true
    });
    const scale = 0.02;
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, -1);
    mesh.scale.set(scale, scale, scale);
    scene.add(mesh);


    window.addEventListener('resize', onWindowResize);

    //
    function gui() {

      const gui = new GUI();

      gui.addColor(params, 'color')
        .onChange(function () {

          material.color.set(params.color);
          render();

        });

      gui.add(params, 'transmission', 0, 1, 0.01)
        .onChange(function () {

          material.transmission = params.transmission;
          render();

        });

      gui.add(params, 'opacity', 0, 1, 0.01)
        .onChange(function () {

          material.opacity = params.opacity;
          render();

        });

      gui.add(params, 'metalness', 0, 1, 0.01)
        .onChange(function () {

          material.metalness = params.metalness;
          render();

        });

      gui.add(params, 'roughness', 0, 1, 0.01)
        .onChange(function () {

          material.roughness = params.roughness;
          render();

        });

      gui.add(params, 'ior', 1, 2, 0.01)
        .onChange(function () {

          material.ior = params.ior;
          render();

        });

      gui.add(params, 'thickness', 0, 5, 0.01)
        .onChange(function () {

          material.thickness = params.thickness;
          render();

        });

      gui.add(params, 'specularIntensity', 0, 1, 0.01)
        .onChange(function () {

          material.specularIntensity = params.specularIntensity;
          render();

        });

      gui.addColor(params, 'specularColor')
        .onChange(function () {

          material.specularColor.set(params.specularColor);
          render();

        });

      gui.add(params, 'envMapIntensity', 0, 1, 0.01)
        .name('envMap intensity')
        .onChange(function () {

          material.envMapIntensity = params.envMapIntensity;
          render();

        });

      gui.add(params, 'exposure', 0, 1, 0.01)
        .onChange(function () {

          renderer.toneMappingExposure = params.exposure;
          render();

        });

      gui.add(params, 'transmissionResolutionScale', 0.01, 1, 0.01)
        .name('transmission resolution')
        .onChange(function () {

          renderer.transmissionResolutionScale = params.transmissionResolutionScale;
          render();

        });

      gui.open();
    }

  }

  function onWindowResize() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    render();

  }

  //

  function generateTexture() {

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;

    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 1, 2, 1);

    return canvas;

  }

  function render() {

    renderer.render(scene, camera);

  }
}