import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

function FloatingParticles({ count = 200 }) {
  const mesh = useRef();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      speeds[i] = 0.2 + Math.random() * 0.5;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += particles.speeds[i] * 0.01;
      if (pos[i * 3 + 1] > 15) {
        pos[i * 3 + 1] = -15;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function WireframeGrid() {
  const gridRef = useRef();

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 0.3) % 2;
    }
  });

  return (
    <group ref={gridRef}>
      <gridHelper
        args={[40, 40, '#333333', '#222222']}
        position={[0, -5, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

function FloatingText({ position, speed = 1, scale = 1 }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x = state.clock.elapsedTime * speed * 0.2;
    groupRef.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <Text
        color="#ffffff"
        fontSize={0.7}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Kinesthesia-SemiBold.otf"
        outlineWidth={0.02}
        outlineColor="#ffffff98"
      >
        EXE
      </Text>
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 10, 30]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />
      
      <FloatingParticles count={300} />
      <WireframeGrid />
      
      <FloatingText position={[-6, 2, -4]} scale={1.2} speed={0.5} />
      <FloatingText position={[7, -1, -6]} scale={0.8} speed={0.7} />
      <FloatingText position={[-3, -3, -3]} scale={1.5} speed={0.4} />
      <FloatingText position={[5, 3, -5]} scale={0.6} speed={0.9} />
      
      <Stars radius={50} depth={50} count={1000} factor={3} saturation={0} fade speed={1} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

export default function Scene3D() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
      }}
    >
      <Canvas
        camera={{ position: [0, 2, 10], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000000' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
