import * as THREE from "three";
import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import mapImage from "./assets/map.png";

function getImageDataFromImage(imageEl) {
  const canvas = document.createElement("canvas");
  canvas.width = imageEl.width;
  canvas.height = imageEl.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageEl, 0, 0);
  return { canvas, ctx, imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) };
}

function generateBorderCanvas(imageEl, borderColor = [255, 255, 255, 255], thickness = 1) {
  const { canvas, ctx, imageData } = getImageDataFromImage(imageEl);

  const { width, height, data } = imageData;
  const outCanvas = document.createElement("canvas");
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext("2d");
  const outImage = outCtx.createImageData(width, height);
  const out = outImage.data;

  const idx = (x, y) => 4 * (y * width + x);

  const isLand = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return data[idx(x, y) + 3] > 0; // alpha
  };

  // For each pixel, if land and any neighbor is water => border pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isLand(x, y)) continue;

      let border = false;
      for (let dy = -thickness; dy <= thickness && !border; dy++) {
        for (let dx = -thickness; dx <= thickness && !border; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (!isLand(x + dx, y + dy)) border = true;
        }
      }

      if (border) {
        const o = idx(x, y);
        out[o] = borderColor[0];
        out[o + 1] = borderColor[1];
        out[o + 2] = borderColor[2];
        out[o + 3] = borderColor[3];
      }
    }
  }

  outCtx.putImageData(outImage, 0, 0);
  return outCanvas;
}

export function GeneratedBorderOverlay({
  radius = 6.2,
  visible = true,
  color = "#c8a165", // light brown
  thickness = 1,
  opacity = 1,
  yawDeg = 0,
  pitchDeg = 0,
  rollDeg = 0
}) {
  const image = useLoader(THREE.ImageLoader, mapImage);

  const texture = useMemo(() => {
    if (!image) return null;

    const c = new THREE.Color(color);
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);

    const borderCanvas = generateBorderCanvas(image, [r, g, b, Math.floor(opacity * 255)], thickness);
    const t = new THREE.CanvasTexture(borderCanvas);
    t.needsUpdate = true;
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }, [image, color, thickness, opacity]);

  if (!visible || !texture) return null;

  // Convert degrees to radians for mesh rotation
  const yaw = (yawDeg * Math.PI) / 180;   // around Y
  const pitch = (pitchDeg * Math.PI) / 180; // around X
  const roll = (rollDeg * Math.PI) / 180;  // around Z

  return (
    <mesh renderOrder={999} rotation={[pitch, yaw, roll]}>
      <sphereBufferGeometry attach="geometry" args={[radius, 64, 64]} />
      <meshBasicMaterial attach="material" map={texture} transparent opacity={opacity} depthWrite={false} depthTest side={THREE.FrontSide} />
    </mesh>
  );
}
