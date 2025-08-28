import * as THREE from "three";
import { useRef, useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
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

export function CountryBorders({ radius = 6.2, visible = true }) {
    const bordersRef = useRef();
    const mapElement = useLoader(THREE.ImageLoader, mapImage);

    const borderLines = useMemo(() => {
        if (!visible || !mapElement) return [];

        const imageData = getImageData(mapElement);
        const lines = [];
        console.log("Creating country borders...");

        // Create a grid of points on the sphere
        const gridSize = 200; // Higher resolution for better borders
        const points = [];

        // Generate points on the sphere and check if they're on land
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const phi = Math.acos(-1 + (2 * i) / gridSize);
                const theta = Math.sqrt(gridSize * Math.PI) * phi;
                const { x, y, z } = new THREE.Vector3(0, 0, 0).setFromSphericalCoords(
                    radius,
                    phi,
                    theta
                );

                const alpha = getAlpha(getDistance({ x, y, z }), imageData);
                points.push({ x, y, z, i, j, isLand: alpha > 0 });
            }
        }

        console.log(`Processed ${points.length} points`);

        // Find edges where land meets water
        for (let i = 0; i < gridSize - 1; i++) {
            for (let j = 0; j < gridSize - 1; j++) {
                const currentIndex = i * gridSize + j;
                const current = points[currentIndex];
                
                // Check horizontal edge
                const rightIndex = i * gridSize + (j + 1);
                const right = points[rightIndex];
                
                if (current.isLand !== right.isLand) {
                    // This is a border edge
                    lines.push({
                        start: new THREE.Vector3(current.x, current.y, current.z),
                        end: new THREE.Vector3(right.x, right.y, right.z)
                    });
                }

                // Check vertical edge
                const bottomIndex = (i + 1) * gridSize + j;
                const bottom = points[bottomIndex];
                
                if (current.isLand !== bottom.isLand) {
                    // This is a border edge
                    lines.push({
                        start: new THREE.Vector3(current.x, current.y, current.z),
                        end: new THREE.Vector3(bottom.x, bottom.y, bottom.z)
                    });
                }
            }
        }

        console.log(`Created ${lines.length} border lines`);
        return lines;
    }, [mapElement, radius, visible]);

    useEffect(() => {
        if (!visible || !bordersRef.current || borderLines.length === 0) return;

        let instanceCount = 0;
        borderLines.forEach((line, index) => {
            // Create a line geometry for each border
            const direction = new THREE.Vector3().subVectors(line.end, line.start);
            const length = direction.length();
            const center = new THREE.Vector3().addVectors(line.start, line.end).multiplyScalar(0.5);
            
            // Create a cylinder to represent the line
            const geometry = new THREE.CylinderGeometry(0.005, 0.005, length, 4);
            geometry.rotateZ(Math.PI / 2);
            
            tempObject.position.copy(center);
            tempObject.lookAt(line.end);
            tempObject.updateMatrix();
            
            bordersRef.current.setMatrixAt(instanceCount, tempObject.matrix);
            instanceCount++;
        });

        bordersRef.current.instanceMatrix.needsUpdate = true;
        bordersRef.current.count = instanceCount;
    }, [borderLines, visible]);

    if (!visible || borderLines.length === 0) {
        return null;
    }

    return (
        <instancedMesh ref={bordersRef} args={[null, null, borderLines.length]}>
            <cylinderGeometry args={[0.005, 0.005, 1, 4]} />
            <meshBasicMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.8}
            />
        </instancedMesh>
    );
}
