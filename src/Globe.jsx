import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Dots } from "./Dots";
import { CountryBordersGeo } from "./CountryBordersGeo";
import "./App.css";
import { Suspense } from "react";

const Sphere = ({ radius = 6 }) => (
  <mesh castShadow>
    <sphereBufferGeometry attach="geometry" args={[radius, 52, 52]} />
    <meshPhongMaterial
      attach="material"
      opacity={0.7}
      shininess={20}
      color="#000000"
      transparent
    />
  </mesh>
);

export default function Globe({ radius = 8, dotsOffset = 0 }) {
  const [minZoom, setMinZoom] = useState(radius + 1.5);
  const [showBorders, setShowBorders] = useState(true);

  const dotsRef = useRef();

  const handleClickFromGlobe = () => {
    dotsRef.current?.triggerDotClick();
  };

  const toggleBorders = () => {
    setShowBorders(!showBorders);
  };

  return (
    <>
      <div style={{position: "absolute", top: 20, zIndex: 1, left: 20}}>
        <button className="upload-button" onClick={handleClickFromGlobe}>Place Image Randomly</button>
        <button 
          className="upload-button" 
          onClick={toggleBorders}
          style={{ marginLeft: "10px", backgroundColor: showBorders ? "#4ca6a8" : "#666" }}
        >
          {showBorders ? "Hide" : "Show"} Country Borders
        </button>
      </div>
      <Canvas camera={{ position: [0, 0, 15], near: 1, far: 50 }} style={{ width: "100vw", height: "95vh" }}>
        <ambientLight />
        <Sphere radius={radius} />
        <Suspense fallback={null}>
          <CountryBordersGeo radius={radius} visible={showBorders} color="#000000" lineWidth={1.5} offset={0.00} 
          yawDeg={181.0} 
          pitchDeg={180} 
          rollDeg={0}
          // invertY={true}
          // invertX={true} 
          // invertZ={true}
          />
          <Dots radius={radius + dotsOffset / 10} ref={dotsRef} />
        </Suspense>
        <OrbitControls
          enableRotate={true}
          enableZoom={true}
          enablePan={false}
          enableDamping={true}
          minDistance={radius + 1.1}
          maxDistance={radius * 5}
        />
      </Canvas>
    </>
  );
} 