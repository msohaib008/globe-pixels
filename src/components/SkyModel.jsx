import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// Import the GLTF model from assets
import skyModelUrl from '../assets/sky/scene.gltf';

// Load the sky GLTF model
function SkyModel() {
  const { scene } = useGLTF(skyModelUrl);
  const modelRef = useRef();
  
  useFrame((state) => {
    // Very slow rotation for the sky
    if (modelRef.current) {
      modelRef.current.rotation.y = state.clock.elapsedTime * 0.001;
    }
  });
  
  return (
    <primitive 
      ref={modelRef}
      object={scene.clone()} // Clone to avoid issues with multiple instances
      scale={[50, 50, 50]} // Scale up the model to surround the scene
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// Preload the model for better performance
useGLTF.preload(skyModelUrl);

export { SkyModel };
