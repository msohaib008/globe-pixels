import * as THREE from "three";
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
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

const useClickOutside = (callback) => {
    useEffect(() => {
        const handleClick = (event) => {
            if (event.button === 2) { // Right click
                event.preventDefault();
                callback();
            }
        };
        window.addEventListener("mousedown", handleClick);
        return () => window.removeEventListener("mousedown", handleClick);
    }, [callback]);
};

export const Dots = forwardRef(({ count = 1000000, radius = 6.2, dotRadius = 2.2 }, ref) => {
    const pixelef = useRef();
    const internalRef = useRef();
    const { gl, camera, controls } = useThree();
    const mapElement = useLoader(THREE.ImageLoader, mapImage);
    const [imageDots, setImageDots] = useState({});

    const [enlargedDotIndex, setEnlargedDotIndex] = useState(null);

    useClickOutside(() => setEnlargedDotIndex(null)); // Reset on outside or right click

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
                pixelef.current.setMatrixAt(b, tempObject.matrix);
            }
        }

        pixelef.current.instanceMatrix.needsUpdate = true;
        pixelef.current.userData.positions = positions; // Store positions for reference
    }, [mapElement, count, radius]);

    const handleDotClick = (eventOrIndex) => {
        let dotIndex;

        if (typeof eventOrIndex === "number") {
            dotIndex = eventOrIndex;
        } else if (eventOrIndex?.instanceId !== undefined) {
            eventOrIndex.stopPropagation();
            dotIndex = eventOrIndex.instanceId;
        } else {
            // Randomly pick one from available dots
            const allIds = pixelef.current?.userData?.positions?.map(p => p.id) || [];
            if (allIds.length === 0) return;
            dotIndex = allIds[Math.floor(Math.random() * allIds.length)];
        }

        if (dotIndex === undefined) return;

        // Already has image: just enlarge it
        if (imageDots[dotIndex]) {
            setEnlargedDotIndex(dotIndex);
            return;
        }

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

                const dotPosition = pixelef.current.userData.positions.find(p => p.id === dotIndex);
                if (dotPosition) {
                    setImageDots(prev => ({
                        ...prev,
                        [dotIndex]: { ...dotPosition, texture }
                    }));

                    const target = new THREE.Vector3(dotPosition.x, dotPosition.y, dotPosition.z);
                    const direction = target.clone().normalize();
                    const distance = 0.1; // Distance from dot

                    const newCameraPos = target.clone().add(direction.multiplyScalar(distance));

                    if (controls) {
                        controls.target.copy(target);
                        controls.update();
                    }

                    camera.position.copy(newCameraPos);
                    camera.lookAt(target);

                    setEnlargedDotIndex(dotIndex);

                    setTimeout(()=>{
                        setEnlargedDotIndex(null);
                    }, 2000)
                }
            };
            reader.readAsDataURL(file);
        };

        fileInput.click();
    };


    useImperativeHandle(ref, () => ({
        triggerDotClick: () => handleDotClick()
    }));

    const handleDotEnlargeOnly = (event) => {
        const dotIndex = event?.instanceId;
      
        if (dotIndex === undefined) return;
      
        if (imageDots[dotIndex]) {
          setEnlargedDotIndex(dotIndex);
      
          // Shrink back after 1 second
          setTimeout(() => {
            setEnlargedDotIndex(null);
          }, 4000);
        }
      };

    return (
        <>
            <instancedMesh ref={pixelef} args={[null, null, count]} onClick={handleDotEnlargeOnly}>
                <circleBufferGeometry attach="geometry" args={[dotRadius / 140, 4, 0.8]} />
                <meshPhongMaterial attach="material" side={THREE.DoubleSide} color="#FFF" />
            </instancedMesh>

            {Object.entries(imageDots).map(([index, { x, y, z, texture }]) => {
                texture.center.set(0.5, 0.5);
                texture.flipY = true;

                const normal = new THREE.Vector3(x, y, z).normalize();
                const up = Math.abs(normal.y) > 0.99 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
                const right = new THREE.Vector3().crossVectors(up, normal).normalize();
                const newUp = new THREE.Vector3().crossVectors(normal, right).normalize();
                const quaternion = new THREE.Quaternion().setFromRotationMatrix(
                    new THREE.Matrix4().lookAt(normal, new THREE.Vector3(0, 0, 0), newUp)
                );

                const offset = 0.002;
                const adjustedPosition = new THREE.Vector3(x, y, z).addScaledVector(normal, offset);
                const isEnlarged = enlargedDotIndex === Number(index);

                return (
                    <mesh
                        key={index}
                        position={adjustedPosition.toArray()}
                        quaternion={quaternion}
                        renderOrder={isEnlarged ? 999 : 1}
                    >
                        <planeGeometry
                            attach="geometry"
                            args={
                                isEnlarged
                                    ? [dotRadius / 10, dotRadius / 10] // Enlarged size
                                    : [dotRadius / 100, dotRadius / 100] // Default size
                            }
                        />
                        <meshBasicMaterial attach="material" map={texture} side={THREE.DoubleSide} transparent />
                    </mesh>
                );
            })}
        </>
    );
}) 