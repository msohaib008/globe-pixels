import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { useLoader, useThree } from "@react-three/fiber";

import mapImage from "./assets/map.png";

const centerVector = new THREE.Vector3(0, 0, 0);
const tempObject = new THREE.Object3D();

const getDistance = (circlePosition) => {
    const distance = new THREE.Vector3();
    distance.subVectors(centerVector, circlePosition).normalize();
    const { x, y, z } = distance;
    const cordX = 1 - (0.5 + Math.atan2(z, x) / (2 * Math.PI));
    const cordY = 0.5 + Math.asin(y) / Math.PI;
    return new THREE.Vector2(cordX, cordY);
};

const getAlpha = (distanceVector, imgData) => {
    const { width, height } = imgData;
    const { x, y } = distanceVector;
    const index =
        4 * Math.floor(x * width) + Math.floor(y * height) * (4 * width);
    return imgData.data[index + 3];
};

const getImageData = (imageEl) => {
    const canvas = document.createElement("canvas");
    canvas.width = imageEl.width;
    canvas.height = imageEl.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageEl, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

export function Dots({ count = 1000000, radius = 6.2, dotRadius = 2.2 }) {
    const ref = useRef();
    const { gl } = useThree();
    const mapElement = useLoader(THREE.ImageLoader, mapImage);
    const [imageDots, setImageDots] = useState({});

    useEffect(() => {
        const imageData = getImageData(mapElement);
        const positions = [];

        for (let b = 0; b < count; b++) {
            const phi = Math.acos(-1 + (2 * b) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;
            const { x, y, z } = new THREE.Vector3(0, 0, 0).setFromSphericalCoords(
                radius,
                phi,
                theta
            );

            tempObject.lookAt(centerVector);
            tempObject.position.set(x, y, z);
            const alpha = getAlpha(getDistance({ x, y, z }), imageData);

            if (alpha > 0) {
                positions.push({ x, y, z, id: b });
                tempObject.updateMatrix();
                ref.current.setMatrixAt(b, tempObject.matrix);
            }
        }

        ref.current.instanceMatrix.needsUpdate = true;
        ref.current.userData.positions = positions; // Store positions for reference
    }, [mapElement, count, radius]);

    const handleDotClick = (event) => {
        event.stopPropagation();
        const dotIndex = event.instanceId;
        if (dotIndex === undefined) return;

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const texture = new THREE.TextureLoader().load(loadEvent.target.result, () => {
                    texture.needsUpdate = true;
                    gl.render();
                });

                const dotPosition = ref.current.userData.positions.find(p => p.id === dotIndex);
                if (dotPosition) {
                    setImageDots((prev) => ({
                        ...prev,
                        [dotIndex]: { ...dotPosition, texture }
                    }));
                }
            };
            reader.readAsDataURL(file);
        };

        fileInput.click();
    };

    return (
        <>
            <instancedMesh ref={ref} args={[null, null, count]} onClick={handleDotClick}>
                <circleBufferGeometry attach="geometry" args={[dotRadius / 140, 4, 0.8]} />
                <meshPhongMaterial attach="material" side={THREE.DoubleSide} color="#FFF" />
            </instancedMesh>

            {Object.entries(imageDots).map(([index, { x, y, z, texture }]) => {
                texture.center.set(0.5, 0.5);
                texture.flipY = false;

                // Calculate the normal vector (outward from sphere center)
                const normal = new THREE.Vector3(x, y, z).normalize();

                // Compute an appropriate "right" vector for alignment
                const right = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 0, 0)).normalize();

                // Compute an appropriate "up" vector to maintain flat orientation
                const up = new THREE.Vector3().crossVectors(right, normal).normalize();

                // Align the image to be **flat on the sphere** using quaternion rotation
                const quaternion = new THREE.Quaternion().setFromRotationMatrix(
                    new THREE.Matrix4().lookAt(normal, new THREE.Vector3(0, 0, 0), up)
                );

                return (
                    <mesh key={index} position={[x, y, z]} quaternion={quaternion}>
                        <planeGeometry attach="geometry" args={[dotRadius / 30, dotRadius / 30]} />
                        <meshBasicMaterial attach="material" map={texture} side={THREE.DoubleSide} transparent />
                    </mesh>
                );
            })}

        </>
    );
}
