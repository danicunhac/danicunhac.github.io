import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const RAYCASTER = new THREE.Raycaster();
const TMP = new THREE.Object3D();
const HIT = new THREE.Vector3();
const SMOOTH_HIT = new THREE.Vector3(0, 0, 0);

type GridData = {
	count: number;
	px: Float32Array;
	py: Float32Array;
	pz: Float32Array;
	bx: Float32Array;
	by: Float32Array;
	bz: Float32Array;
};

function buildStaggeredGrid(rows: number, cols: number, spacing: number): GridData {
	const count = rows * cols;
	const px = new Float32Array(count);
	const py = new Float32Array(count);
	const pz = new Float32Array(count);
	const bx = new Float32Array(count);
	const by = new Float32Array(count);
	const bz = new Float32Array(count);

	const rowStep = spacing * 0.8660254;
	let i = 0;

	for (let row = 0; row < rows; row++) {
		const rowOffset = (row % 2) * 0.5 * spacing;
		for (let col = 0; col < cols; col++) {
			const x = col * spacing + rowOffset - (cols * spacing) * 0.48;
			const y = row * rowStep - (rows * rowStep) * 0.5;

			px[i] = x;
			py[i] = y;
			pz[i] = (Math.random() - 0.5) * 0.14;
			bx[i] = (Math.random() - 0.5) * 0.9;
			by[i] = (Math.random() - 0.5) * 0.9;
			bz[i] = (Math.random() - 0.5) * 0.28;
			i++;
		}
	}

	return { count, px, py, pz, bx, by, bz };
}

function DiscField({ reducedMotion }: { reducedMotion: boolean }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);
	const pointerNdc = useRef(new THREE.Vector2(0, 0));

	const grid = useMemo(() => buildStaggeredGrid(16, 22, 0.76), []);

	const geometry = useMemo(
		() => new THREE.CylinderGeometry(0.36, 0.36, 0.095, 56),
		[]
	);

	const material = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: new THREE.Color("#101012"),
				roughness: 0.92,
				metalness: 0.05,
				envMapIntensity: 0.12,
			}),
		[]
	);

	const { camera } = useThree();

	useEffect(() => {
		const onPointerMove = (e: PointerEvent) => {
			const x = (e.clientX / window.innerWidth) * 2 - 1;
			const y = -(e.clientY / window.innerHeight) * 2 + 1;
			pointerNdc.current.set(x, y);
		};

		window.addEventListener("pointermove", onPointerMove, { passive: true });
		return () => window.removeEventListener("pointermove", onPointerMove);
	}, []);

	useFrame((state, dt) => {
		const mesh = meshRef.current;
		if (!mesh) return;

		RAYCASTER.setFromCamera(pointerNdc.current, camera);
		const ok = RAYCASTER.ray.intersectPlane(PLANE, HIT);
		if (ok) {
			SMOOTH_HIT.lerp(HIT, 1 - Math.exp(-12 * dt));
		}

		const t = state.clock.elapsedTime;
		const mx = SMOOTH_HIT.x;
		const my = SMOOTH_HIT.y;
		const motionScale = reducedMotion ? 0 : 1;

		for (let i = 0; i < grid.count; i++) {
			const px = grid.px[i];
			const py = grid.py[i];
			const pz = grid.pz[i];

			const dx = px - mx;
			const dy = py - my;
			const distSq = dx * dx + dy * dy + 0.28;
			const falloff = Math.min(2.4 / distSq, 1.15);

			const tipX = falloff * (my - py) * 0.11;
			const tipY = falloff * (mx - px) * 0.11;

			const wobbleX =
				motionScale * Math.sin(t * 0.55 + i * 0.17) * 0.028;
			const wobbleY =
				motionScale * Math.cos(t * 0.42 + i * 0.13) * 0.026;

			TMP.position.set(px, py, pz);
			TMP.rotation.set(
				grid.bx[i] + tipX + wobbleX,
				grid.by[i] + tipY + wobbleY,
				grid.bz[i] + wobbleX * 0.45
			);
			TMP.updateMatrix();
			mesh.setMatrixAt(i, TMP.matrix);
		}

		mesh.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh
			ref={meshRef}
			args={[geometry, material, grid.count]}
			frustumCulled={false}
		/>
	);
}

function SceneContent({ reducedMotion }: { reducedMotion: boolean }) {
	return (
		<>
			<color attach="background" args={["#000000"]} />
			<ambientLight intensity={0.018} color="#6a7080" />
			<directionalLight
				position={[-11, 15, 7]}
				intensity={1.45}
				color="#f2f4f8"
			/>
			<directionalLight
				position={[6, -4, 2]}
				intensity={0.06}
				color="#8890a0"
			/>
			<group position={[0, -0.15, 0]} rotation={[-0.38, 0.22, 0.06]}>
				<DiscField reducedMotion={reducedMotion} />
			</group>
		</>
	);
}

export function HeroScene() {
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => setReducedMotion(mq.matches);
		sync();
		mq.addEventListener("change", sync);
		return () => mq.removeEventListener("change", sync);
	}, []);

	return (
		<Canvas
			camera={{ position: [3.1, 2.05, 8.4], fov: 36, near: 0.1, far: 80 }}
			gl={{
				alpha: false,
				antialias: true,
				powerPreference: "high-performance",
			}}
			dpr={[1, 2]}
			style={{ width: "100%", height: "100%" }}
			onCreated={({ camera }) => {
				camera.lookAt(0, -0.2, 0);
			}}
		>
			<SceneContent reducedMotion={reducedMotion} />
		</Canvas>
	);
}
