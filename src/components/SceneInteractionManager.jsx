import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function GLBModel({ file, activeAnimations, onLoad }) {
  const { scene, animations } = useGLTF(file); // Carrega o GLB
  const mixer = useRef();
  const actions = useRef({});
  const hasLoaded = useRef(false); // Evita repetição de carregamento

  if (!hasLoaded.current && animations) {
    // Executa o carregamento do modelo apenas uma vez
    mixer.current = new THREE.AnimationMixer(scene);
    onLoad(animations); // Carrega as animações

    animations.forEach((clip) => {
      const action = mixer.current.clipAction(clip);
      actions.current[clip.name] = action;
      action.clampWhenFinished = true;
      action.loop = THREE.LoopRepeat;
      action.stop(); // As animações começam paradas
    });

    hasLoaded.current = true; // Marca como carregado
  }

  // Atualiza o mixer para o frame atual
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  // Executa a animação selecionada
  if (activeAnimations.length > 0) {
    Object.values(actions.current).forEach((action) => action.stop());
    activeAnimations.forEach((name) => {
      const action = actions.current[name];
      if (action) {
        action.play();
      }
    });
  }

  return <primitive object={scene} />;
}

function SceneInteractionManager() {
  const [modelFile, setModelFile] = useState(null);
  const [availableAnimations, setAvailableAnimations] = useState([]);
  const [activeAnimations, setActiveAnimations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event) => {
    setIsLoading(true);
    const file = URL.createObjectURL(event.target.files[0]);
    console.log('Arquivo GLB carregado:', file);
    setModelFile(file);
    setIsLoading(false);
  };

  const handleAnimationToggle = (animationName) => {
    setActiveAnimations((prev) => {
      if (prev.includes(animationName)) {
        return prev.filter((name) => name !== animationName);
      } else {
        return [...prev, animationName];
      }
    });
  };

  const handleGLTFLoad = (animations) => {
    setAvailableAnimations(animations.map((clip) => clip.name));
  };

  return (
    <div className="scene-interaction-manager">
      <input type="file" accept=".glb" onChange={handleFileUpload} />
      {isLoading && <p>Loading model...</p>}
      {modelFile && (
        <>
          <div className="controls">
            <h3>Select Animations</h3>
            {availableAnimations.length > 0 ? (
              availableAnimations.map((animationName) => (
                <div key={animationName}>
                  <label>
                    <input
                      type="checkbox"
                      checked={activeAnimations.includes(animationName)}
                      onChange={() => handleAnimationToggle(animationName)}
                    />
                    {animationName}
                  </label>
                </div>
              ))
            ) : (
              <p>No animations available for this model</p>
            )}
          </div>
          <div className="canvas-container">
            <Canvas camera={{ position: [0, 2, 5], fov: 50 }} shadows>
              <ambientLight intensity={0.4} />
              <directionalLight 
                intensity={1} 
                position={[5, 10, 7.5]} 
                castShadow 
                shadow-mapSize-width={1024} 
                shadow-mapSize-height={1024}
              />
              <directionalLight intensity={0.5} position={[-5, -5, -5]} />
              <GLBModel file={modelFile} onLoad={handleGLTFLoad} activeAnimations={activeAnimations} />
              <OrbitControls />
            </Canvas>
          </div>
        </>
      )}
    </div>
  );
}

export default SceneInteractionManager;
