import * as THREE from "three";
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useLoader, useThree } from "@react-three/fiber";

import mapImage from "./assets/map.png";
import { fetchManifest, addDotToManifest, saveManifest, imageUrlForDot, getAllDots } from "./lib/firebase";

const centerVector = new THREE.Vector3(0, 0, 0);
const tempObject = new THREE.Object3D();

// Helper function to compare arrays
const arraysEqual = (a, b) => {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
};

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

export const Dots = forwardRef(({ count = 1000000, radius = 6.2, dotRadius = 2.2, onImageSelected }, ref) => {
	const pixelef = useRef();
	const internalRef = useRef();
	const { gl, camera, controls, invalidate } = useThree();
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
		
		console.log(`🌍 Generated ${positions.length} valid dot positions`);
		console.log(`📍 First few position IDs:`, positions.slice(0, 5).map(p => p.id));
		console.log(`📍 Last few position IDs:`, positions.slice(-5).map(p => p.id));
		console.log(`📍 All position IDs range: ${positions[0]?.id} to ${positions[positions.length - 1]?.id}`);

		// Load all approved images now that positions are ready
		(async () => {
			try {
				// Get all approved dots directly from the database
				const approvedDots = await getAllDots();
				console.log('📋 Approved dots loaded:', approvedDots.length);
				
				if (approvedDots.length === 0) {
					console.log('⚠️ No approved dots found');
					return;
				}
				
				console.log(`🎯 Found ${approvedDots.length} approved dots:`, approvedDots.map(d => d.dotId));
				
				const loader = new THREE.TextureLoader();
				const next = {};
				
				for (const dot of approvedDots) {
					const dotId = parseInt(dot.dotId);
					const pos = positions.find(p => p.id === dotId);
					if (!pos) {
						console.log(`❌ Position not found for dot ${dotId}`);
						continue;
					}
					
					try {
						const imageUrl = await imageUrlForDot(dotId);
						if (imageUrl) {
							console.log(`✅ Loading image for dot ${dotId}`);
							next[dotId] = { 
								...pos, 
								texture: loader.load(imageUrl, () => invalidate()) 
							};
						} else {
							console.log(`❌ No image URL found for dot ${dotId}`);
						}
					} catch (error) {
						console.warn(`Failed to load image for dot ${dotId}:`, error);
					}
				}
				
				console.log(`🎨 Setting ${Object.keys(next).length} image dots`);
				setImageDots(prev => ({ ...prev, ...next }));
				
				// Also update manifest to keep it in sync
				const manifest = await fetchManifest();
				const manifestDotIds = manifest.dots || [];
				const approvedDotIds = approvedDots.map(d => parseInt(d.dotId));
				
				// Check if manifest needs updating
				const needsUpdate = !arraysEqual(manifestDotIds.sort(), approvedDotIds.sort());
				if (needsUpdate) {
					console.log('🔄 Updating manifest to match approved dots');
					await saveManifest({ dots: approvedDotIds });
				}
				
			} catch (error) {
				console.error('Failed to load approved images:', error);
			}
		})();
	}, [mapElement, count, radius, invalidate]);

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

		fileInput.onchange = async (e) => {
			const file = e.target.files[0];
			if (!file) return;

			// Call parent component to handle image selection
			if (onImageSelected) {
				onImageSelected({
					dotId: dotIndex,
					file: file
				});
			}
		};

		fileInput.click();
	};

	// Search and focus functionality
	const searchAndFocusDot = (dotId) => {
		console.log(`🔍 Searching for dot ${dotId}`);
		console.log(`📊 Current imageDots state:`, Object.keys(imageDots).length, 'images loaded');
		console.log(`📍 Available image dots:`, Object.keys(imageDots));
		
		const positions = pixelef.current?.userData?.positions;
		if (!positions) {
			console.log('❌ No positions available yet');
			return false;
		}

		const dotPosition = positions.find(pos => pos.id === dotId);
		if (!dotPosition) {
			console.log(`❌ Position not found for dot ${dotId}`);
			return false;
		}

		console.log(`✅ Found position for dot ${dotId}:`, dotPosition);

		// Create a target position for the camera to look at
		const targetPosition = new THREE.Vector3(dotPosition.x, dotPosition.y, dotPosition.z);
		
		// Calculate a good camera position (slightly offset from the dot)
		const normal = targetPosition.clone().normalize();
		const cameraDistance = radius * 1.5; // Distance from the globe surface
		const cameraPosition = targetPosition.clone().add(normal.multiplyScalar(cameraDistance));
		
		// Animate camera to focus on the dot
		if (controls) {
			// Set target to the dot position
			controls.target.copy(targetPosition);
			
			// Animate camera position
			const startPosition = camera.position.clone();
			const startTarget = controls.target.clone();
			
			const duration = 1000; // 1 second animation
			const startTime = Date.now();
			
			const animate = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				
				// Smooth easing function
				const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
				const easedProgress = easeInOutCubic(progress);
				
				// Interpolate camera position
				camera.position.lerpVectors(startPosition, cameraPosition, easedProgress);
				controls.target.lerpVectors(startTarget, targetPosition, easedProgress);
				
				controls.update();
				invalidate();
				
				if (progress < 1) {
					requestAnimationFrame(animate);
				}
			};
			
			animate();
		}

		// Check if the dot has an image and enlarge it
		console.log(`🖼️ Checking if dot ${dotId} has an image:`, !!imageDots[dotId]);
		if (imageDots[dotId]) {
			console.log(`✅ Enlarging dot ${dotId} with image`);
			setEnlargedDotIndex(dotId);
			// Auto-shrink after 3 seconds
			setTimeout(() => {
				setEnlargedDotIndex(null);
			}, 30000);
		} else {
			console.log(`ℹ️ Dot ${dotId} found but has no image yet`);
		}

		return true;
	};

	useImperativeHandle(ref, () => ({
		triggerDotClick: () => handleDotClick(),
		searchAndFocusDot: (dotId) => searchAndFocusDot(dotId)
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
}); 