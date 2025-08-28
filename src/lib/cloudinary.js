const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'globe/dots';
const MANIFEST_ID = import.meta.env.VITE_CLOUDINARY_MANIFEST_ID || 'dots-manifest/manifest';

function requireEnv() {
	if (!CLOUD_NAME || !PRESET) {
		throw new Error('Missing Cloudinary env: VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_PRESET');
	}
}

export function dotPublicId(dotId) {
	return `${FOLDER}/${dotId}`;
}

export function imageUrlForDot(dotId, transform = 'f_auto,q_auto') {
	requireEnv();
	const publicId = dotPublicId(dotId);
	return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${publicId}`;
}

export function manifestUrl(cacheBust = true) {
	requireEnv();
	const base = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${MANIFEST_ID}.json`;
	return cacheBust ? `${base}?v=${Date.now()}` : base;
}

export async function uploadDotImage(dotId, file) {
	requireEnv();
	const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
	const fd = new FormData();
	fd.append('file', file);
	fd.append('upload_preset', PRESET);
	
	// Try to set public_id if preset allows it, but don't fail if it doesn't
	try {
		fd.append('public_id', dotPublicId(dotId));
	} catch (e) {
		console.warn('Could not set public_id, using auto-generated name');
	}
	
	const res = await fetch(url, { method: 'POST', body: fd });
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Cloudinary upload failed: ${res.status} ${errorText}`);
	}
	const json = await res.json();
	
	// If we couldn't set public_id, we need to use the returned public_id
	if (json.public_id) {
		return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/${json.public_id}`;
	}
	
	return json.secure_url || imageUrlForDot(dotId);
}

export async function fetchManifest() {
	try {
		const res = await fetch(manifestUrl(true));
		if (!res.ok) return { dots: [] };
		const json = await res.json();
		// expected shape { dots: number[] }
		if (Array.isArray(json)) return { dots: json };
		if (json && Array.isArray(json.dots)) return json;
		return { dots: [] };
	} catch (_) {
		return { dots: [] };
	}
}

export async function saveManifest(manifest) {
	requireEnv();
	const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
	const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
	const fd = new FormData();
	fd.append('file', blob);
	fd.append('upload_preset', PRESET);
	fd.append('public_id', MANIFEST_ID);
	fd.append('resource_type', 'raw');
	
	const res = await fetch(url, { method: 'POST', body: fd });
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Cloudinary manifest upload failed: ${res.status} ${errorText}`);
	}
	return true;
}

export function addDotToManifest(manifest, dotId) {
	const m = manifest && Array.isArray(manifest.dots) ? manifest : { dots: [] };
	if (!m.dots.includes(dotId)) m.dots.push(dotId);
	return m;
}
