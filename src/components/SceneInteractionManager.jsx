import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GUI } from 'dat.gui';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'; // Importa o shader do FXAA

const BLOOM_SCENE = 1;

const SceneInteractionManager = () => {
  const containerRef = useRef(null);
  const [objectList, setObjectList] = useState([]);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    void main() {
      gl_FragColor = (texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv));
    }
  `;

  useEffect(() => {
    // Inicializando o renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: false }); // antialias false para usar FXAA
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Criando a cena
    const scene = new THREE.Scene();

    // Adicionando câmera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    // Controles
    const controls = new TrackballControls(camera, renderer.domElement);
    controls.zoomSpeed = 1;

    // Adicionando iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(0, 2, 10);
    pointLight.castShadow = true;
    scene.add(pointLight);

    // Renderizador com tonemapping
    renderer.toneMapping = THREE.CineonToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const renderScene = new RenderPass(scene, camera);

    // Pass de Bloom
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);

    // Configurando o EffectComposer
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    // Adiciona o pass de FXAA
    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.set(1 / (window.innerWidth * pixelRatio), 1 / (window.innerHeight * pixelRatio));
    bloomComposer.addPass(fxaaPass);

    // Configurando o mix do Bloom
    const mixPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
      }),
      'baseTexture'
    );

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(mixPass);
    finalComposer.addPass(fxaaPass); // Aplica o FXAA no final também

    const outputPass = new OutputPass();
    finalComposer.addPass(outputPass);

    const bloomLayer = new THREE.Layers();
    bloomLayer.set(BLOOM_SCENE);

    const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const materials = {};

    function nonBloomed(obj) {
      if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
        materials[obj.uuid] = obj.material;
        obj.material = darkMaterial;
      }
    }

    function restoreMaterial(obj) {
      if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid];
        delete materials[obj.uuid];
      }
    }

    const rayCaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerDown(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      rayCaster.setFromCamera(mouse, camera);
      const intersects = rayCaster.intersectObjects(scene.children);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        console.log(`Objeto clicado: ${object.name || 'Objeto sem nome'}`);

        object.layers.toggle(BLOOM_SCENE);

        const updatedList = objectList.map(obj => ({
          ...obj,
          hasBloom: obj.object.uuid === object.uuid ? !obj.hasBloom : obj.hasBloom
        }));
        setObjectList(updatedList);
      } else {
        console.log('Nenhum objeto foi clicado');
      }
    }

    window.addEventListener('pointerdown', onPointerDown);

    let mixer;
    const loader = new GLTFLoader();
    loader.load('teste2.glb'/*'/robo-completo-Ajustado-2.glb'*/, function (glb) {
      const model = glb.scene;

      model.scale.set(10, 10, 10);
      model.position.set(0, -1, 0);
      scene.add(model);

      const loadedObjects = [];
      model.traverse((child) => {
        if (child.isMesh) {
          loadedObjects.push({ name: child.name || 'Objeto sem nome', object: child, hasBloom: false });
        }
      });
      setObjectList(loadedObjects);

      const animations = glb.animations;
      if (animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const clip = animations[0];
        const action = mixer.clipAction(clip);
        action.play();
      }
    });

    const gui = new GUI();
    const bloomFolder = gui.addFolder('Bloom');
    bloomFolder.add(bloomPass, 'threshold', 0.0, 1.0);
    bloomFolder.add(bloomPass, 'strength', 0.0, 3);
    bloomFolder.add(bloomPass, 'radius', 0.0, 1.0);

    const toneMappingFolder = gui.addFolder('Tone mapping');
    toneMappingFolder.add(renderer, 'toneMappingExposure', 0.1, 2);

    const clock = new THREE.Clock();
    function animate() {
      controls.update();
      if (mixer) mixer.update(clock.getDelta());

      scene.traverse(nonBloomed);
      bloomComposer.render();
      scene.traverse(restoreMaterial);
      finalComposer.render();

      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      bloomComposer.setSize(window.innerWidth, window.innerHeight);
      finalComposer.setSize(window.innerWidth, window.innerHeight);

      fxaaPass.material.uniforms['resolution'].value.set(1 / (window.innerWidth * pixelRatio), 1 / (window.innerHeight * pixelRatio)); // Atualiza resolução para FXAA no resize
    });

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', () => {});
    };
  }, []);

  const handleCheckboxChange = (uuid) => {
    const updatedList = objectList.map(obj => {
      if (obj.object.uuid === uuid) {
        obj.object.layers.toggle(BLOOM_SCENE);
        return { ...obj, hasBloom: !obj.hasBloom };
      }
      return obj;
    });
    setObjectList(updatedList);
  };

  return (
    <div>
      <div ref={containerRef} className="canvas-container" style={{ width: '100%', height: '100vh' }} />
      <div className="object-checklist-container">
        <h3>Controle de Bloom</h3>
        <ul className="object-checklist">
          {objectList.map((obj) => (
            <li key={obj.object.uuid}>
              <label>
                <input
                  type="checkbox"
                  checked={obj.hasBloom}
                  onChange={() => handleCheckboxChange(obj.object.uuid)}
                />
                {obj.name}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default SceneInteractionManager;
