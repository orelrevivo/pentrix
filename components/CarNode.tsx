import React, { useRef, useState } from 'react';
import { useGLTF, Html, Edges } from '@react-three/drei';
import { getVehicleForPlan, getAllVehiclePaths } from '@/lib/vehicles';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

interface CarNodeProps {
  project: any;
  position: [number, number, number];
  onClick: () => void;
  isSelected: boolean;
  level?: number;
}

// Custom error boundary for useGLTF since it suspends and throws if file not found
class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const CarModel = ({ plan }: { plan: string }) => {
  const vehicle = getVehicleForPlan(plan);
  const gltf = useGLTF(vehicle.path, true);
  
  const clone = React.useMemo(() => {
    const c = SkeletonUtils.clone(gltf.scene);
    
    // Fix "explosions" when zooming in (Frustum Culling issues with SkinnedMeshes)
    c.traverse((node: any) => {
      if (node.isMesh) {
        node.frustumCulled = false;
        // explicitly disabling shadows on the internal meshes because 
        // computing shadows for 100MB+ models crashes the WebGL GPU renderer
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
    
    return c;
  }, [gltf.scene]);
  
  // Apply the specific scale and manual yOffset for this vehicle model
  return <primitive object={clone} scale={vehicle.scale} position={[0, vehicle.yOffset, 0]} />;
};

// Preload the expected files so they load faster
getAllVehiclePaths().forEach(path => useGLTF.preload(path, true));

export const CarNode: React.FC<CarNodeProps> = ({ project, position, onClick, isSelected }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <group
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <ErrorBoundary fallback={
        <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
          <boxGeometry args={[1.5, 0.8, 3]} />
          <meshStandardMaterial color={hovered ? '#4ade80' : isSelected ? '#3b82f6' : '#94a3b8'} />
          {hovered && <Edges scale={1.05} color="white" />}
        </mesh>
      }>
        <React.Suspense fallback={
          <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
            <boxGeometry args={[1.5, 0.8, 3]} />
            <meshStandardMaterial color={hovered ? '#4ade80' : isSelected ? '#3b82f6' : '#94a3b8'} wireframe />
          </mesh>
        }>
          <CarModel plan={project.plan} />
        </React.Suspense>
      </ErrorBoundary>

      {/* Title Tag above the car */}
      <Html position={[0, 2, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`px-2 py-1 rounded border backdrop-blur-md text-xs font-bold shadow-xl transition-all duration-300 whitespace-nowrap select-none
          ${isSelected 
            ? 'bg-primary-500 text-white border-primary-600 scale-110' 
            : hovered 
              ? 'bg-background/90 text-foreground border-emerald-500/50 scale-105' 
              : 'bg-background/70 text-zinc-400 border-border-custom'}`}
        >
          {project.name}
        </div>
      </Html>
    </group>
  );
};
