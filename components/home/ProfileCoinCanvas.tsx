import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";

type CoinSceneProps = {
	spinCount: number;
};

const SPIN_DURATION_SECONDS = 1.2;

function CoinMesh({ spinCount }: CoinSceneProps) {
	const groupRef = useRef<THREE.Group>(null);
	const previousSpinCountRef = useRef(spinCount);
	const startRotationRef = useRef(0);
	const targetRotationRef = useRef(0);
	const spinElapsedRef = useRef(SPIN_DURATION_SECONDS);
	const invalidate = useThree((state) => state.invalidate);
	const texture = useTexture("/hero.png");
	const colorMap = useLoader(TextureLoader, "/textures/coin-texture.png");

	useEffect(() => {
		if (spinCount === previousSpinCountRef.current) return;
		previousSpinCountRef.current = spinCount;

		const currentRotation =
			groupRef.current?.rotation.y ?? targetRotationRef.current;
		startRotationRef.current = currentRotation;
		targetRotationRef.current = currentRotation + Math.PI * 2;
		spinElapsedRef.current = 0;
		invalidate();
	}, [invalidate, spinCount]);

	useFrame((state, delta) => {
		const group = groupRef.current;
		if (!group) return;

		if (spinElapsedRef.current >= SPIN_DURATION_SECONDS) {
			group.rotation.y = targetRotationRef.current;
			return;
		}

		spinElapsedRef.current = Math.min(
			spinElapsedRef.current + delta,
			SPIN_DURATION_SECONDS,
		);

		const progress = spinElapsedRef.current / SPIN_DURATION_SECONDS;
		const easedProgress = 1 - Math.pow(1 - progress, 3);

		group.rotation.y =
			startRotationRef.current +
			(targetRotationRef.current - startRotationRef.current) * easedProgress;

		if (progress >= 1) {
			group.rotation.y = targetRotationRef.current;
			return;
		}

		state.invalidate();
	});

	return (
		<group ref={groupRef}>
			<mesh rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[1, 1, 0.2, 96, 1, true]} />
				<meshBasicMaterial map={colorMap} toneMapped={false} />
			</mesh>

			<mesh position={[0, 0, 0.105]}>
				<circleGeometry args={[1, 96]} />
				<meshBasicMaterial map={texture} toneMapped={false} />
			</mesh>

			<mesh position={[0, 0, -0.105]} rotation={[0, Math.PI, 0]}>
				<circleGeometry args={[1, 96]} />
				<meshBasicMaterial map={colorMap} toneMapped={false} />
			</mesh>
		</group>
	);
}

type ProfileCoinCanvasProps = {
	spinCount: number;
};

export default function ProfileCoinCanvas({
	spinCount,
}: ProfileCoinCanvasProps) {
	return (
		<Canvas
			aria-hidden
			camera={{ position: [0, 0, 3.4], fov: 38, near: 0.1, far: 100 }}
			dpr={[1, 2]}
			frameloop="demand"
			gl={{
				alpha: true,
				antialias: true,
				powerPreference: "high-performance",
			}}
			onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
			style={{ width: "100%", height: "100%" }}
		>
			<ambientLight intensity={1.8} />
			<directionalLight position={[2, 2, 4]} intensity={1.25} />
			<Suspense fallback={null}>
				<CoinMesh spinCount={spinCount} />
			</Suspense>
		</Canvas>
	);
}
