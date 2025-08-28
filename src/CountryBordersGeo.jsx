import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { Line } from "@react-three/drei";

// Convert lat/lng to 3D coordinates on sphere
function latLngToVector3(lat, lng, radius) {
	const phi = (90 - lat) * (Math.PI / 180);
	const theta = (lng + 180) * (Math.PI / 180);
	const x = radius * Math.sin(phi) * Math.cos(theta);
	const y = radius * Math.cos(phi);
	const z = radius * Math.sin(phi) * Math.sin(theta);
	return new THREE.Vector3(x, y, z);
}

// Robust iterator for Polygon/MultiPolygon
function forEachRing(geometry, cb) {
	if (!geometry) return;
	if (geometry.type === "Polygon") {
		geometry.coordinates.forEach(ring => cb(ring));
	} else if (geometry.type === "MultiPolygon") {
		geometry.coordinates.forEach(poly => poly.forEach(ring => cb(ring)));
	}
}

export function CountryBordersGeo({
	radius = 6.2,
	visible = true,
	color = "#c8a165", // light brown
	lineWidth = 1.5,
	offset = 0.03, // draw slightly above sphere
	yawDeg = 0,
	pitchDeg = 0,
	rollDeg = 0,
	invertY = true,
	geoJsonUrl = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
}) {
	const [features, setFeatures] = useState([]);
	const [error, setError] = useState(null);

	useEffect(() => {
		let abort = false;
		(async () => {
			try {
				const res = await fetch(geoJsonUrl, { cache: "force-cache" });
				if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
				const data = await res.json();
				if (!abort) setFeatures(Array.isArray(data.features) ? data.features : []);
			} catch (e) {
				if (!abort) setError(String(e));
			}
		})();
		return () => { abort = true; };
	}, [geoJsonUrl]);

	const rings = useMemo(() => {
		if (!visible || features.length === 0) return [];
		const out = [];
		features.forEach((f, idx) => {
			forEachRing(f.geometry, (ring) => {
				const pts = [];
				for (let i = 0; i < ring.length; i++) {
					const [lng, lat] = ring[i];
					const p = latLngToVector3(lat, lng, radius + offset);
					if (invertY) p.y = -p.y; // flip north/south without rotating
					pts.push([p.x, p.y, p.z]);
				}
				if (pts.length > 1) out.push(pts);
			});
		});
		return out;
	}, [features, radius, offset, visible, invertY]);

	if (!visible) return null;

	const yaw = (yawDeg * Math.PI) / 180;
	const pitch = (pitchDeg * Math.PI) / 180;
	const roll = (rollDeg * Math.PI) / 180;

	return (
		<group rotation={[pitch, yaw, roll]}>
			{rings.map((points, i) => (
				<Line
					key={i}
					points={points}
					color={color}
					lineWidth={lineWidth}
					transparent
					opacity={1}
					renderOrder={998}
				/>
			))}
		</group>
	);
}
