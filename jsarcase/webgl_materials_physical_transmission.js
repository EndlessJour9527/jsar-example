import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export function createScene(renderer, camera, scene) {
  const params = {
    color: 0x2fcc71,
    transmission: 1,
    opacity: 0.7,
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
  let material;
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
      // scene.background = envMap;
      testinit();
      // init();
    });
  }
  loadCubeMap();


  function init() {
    // renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.shadowMap.enabled = true;

    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = params.exposure;

    // 在XR环境中，直接设置scene.background会导致双目渲染不一致
    // scene.background = envMap;

    // 使用scene.environment替代scene.background来避免XR双目渲染问题

    // // 可选：创建天空盒几何体来提供可见的背景
    // const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    // const skyboxMaterial = new THREE.MeshBasicMaterial({
    //   envMap: envMap,
    //   side: THREE.BackSide
    // });
    // const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    // skybox.name = 'skybox';
    // scene.add(skybox);

    //

    const geometry = new THREE.SphereGeometry(1, 1, 1);

    const texture = new THREE.CanvasTexture(generateTexture());
    texture.magFilter = THREE.NearestFilter;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(1, 3.5);

    // const t_material = new THREE.MeshPhysicalMaterial({
    //   color: params.color,
    //   metalness: params.metalness,
    //   roughness: params.roughness,
    //   ior: params.ior,
    //   alphaMap: texture,
    //   envMap: envMap,
    //   envMapIntensity: params.envMapIntensity,
    //   // transmission: params.transmission, // use material.transmission for glass materials
    //   specularIntensity: params.specularIntensity,
    //   specularColor: params.specularColor,
    //   opacity: params.opacity,
    //   side: THREE.DoubleSide,
    //   transparent: true,
    //   depthWrite: false,
    // });
    material = new THREE.MeshBasicMaterial({
      color: 0x2ecc71,
      transparent: false,
      // metalness: params.metalness,
      // roughness: params.roughness,
      // opacity: params.opacity,
      // envMap: envMap,
      // envMapIntensity: params.envMapIntensity,
      // side: THREE.DoubleSide,
      // depthWrite: false,
      // ior: params.ior,
    })
    const t_material = new THREE.MeshBasicMaterial({
      color: 0x2ecc71,
      transparent: false,
    })
    // const t_material = new THREE.MeshPhysicalMaterial({
    //   color: params.color,
    //   transparent: true,
    //   opacity: params.opacity,
    //   envMap: envMap,
    //   envMapIntensity: params.envMapIntensity,
    //   side: THREE.DoubleSide,
    // })
    const group = new THREE.Group();
    const scale = 0.01;
    mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    const cube = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 1), t_material);
    cube.position.set(0, 0, 0);
    group.add(cube);
    // group.position.set(0, 0, -0.1);
    group.scale.set(scale, scale, scale);
    scene.add(group);

    window.addEventListener('resize', onWindowResize);

    render();
    console.log(renderer.getContext().getContextAttributes());

  }

  function testinit() {
    material = new THREE.MeshBasicMaterial({
      color: 0x2ecc71,
      opacity: 0.1,
      transparent: true,
    })
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    group.position.set(0, 0, 0);
    const scale = 0.1;
    group.scale.set(scale, scale, scale);
    scene.add(group);
    render();
    console.log("testinit");
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
    console.log(material.transparent); // true ?
    console.log(material.opacity);     // < 1 ?
    console.log(material.blending);    // THREE.NormalBlending ?
    console.log(material.depthWrite);  // false ?

  }
}
