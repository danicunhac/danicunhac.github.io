import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function AccentMesh() {
	const meshRef = useRef<THREE.Mesh>(null);
	useFrame(({ clock }) => {
		const m = meshRef.current;
		if (!m) return;
		m.rotation.z = clock.elapsedTime * 0.12;
		m.rotation.y = clock.elapsedTime * 0.08;
	});
	return (
		<mesh ref={meshRef} position={[0, 0, -3]} scale={2.2}>
			<torusGeometry args={[1, 0.08, 12, 48]} />
			<meshBasicMaterial
				color="#7c7c8a"
				transparent
				opacity={0.2}
				depthWrite={false}
			/>
		</mesh>
	);
}

export default function LinkBackdropCanvas() {
	return (
		<Canvas
			camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 100 }}
			dpr={[1, 2]}
			gl={{
				alpha: true,
				antialias: true,
				powerPreference: "high-performance",
			}}
			onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
			style={{ width: "100%", height: "100%" }}
		>
			<AccentMesh />
		</Canvas>
	);
}
