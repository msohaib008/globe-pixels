import * as THREE from "three";
import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import borderMap from "./assets/world-map-globe.png";

export function BorderOverlay({ radius = 6.2, visible = true, opacity = 1 }) {
	const texture = useLoader(THREE.TextureLoader, borderMap);

	const materialProps = useMemo(() => ({
		map: texture,
		transparent: true,
		opacity,
		depthWrite: false,
		depthTest: true,
		side: THREE.FrontSide
	}), [texture, opacity]);

	if (!visible) return null;

	return (
		<mesh renderOrder={999}>
			<sphereBufferGeometry attach="geometry" args={[radius, 64, 64]} />
			<meshBasicMaterial attach="material" {...materialProps} />
		</mesh>
	);
}
