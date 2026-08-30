import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Sky, Stars, useTexture, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { CarNode } from "./CarNode";

interface Project {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
  status: string;
  canvasX: number;
  canvasY: number;
  tileSize: string;
  plan: string;
  feedbackCount?: number;
}

interface GameBoardProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  focusProject?: Project | null;
}

// Player movement controller
const PlayerControls = ({ disabled }: { disabled: boolean }) => {
  const { camera } = useThree();
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/music/walk.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Stop walking audio and clear movement keys if disabled
  useEffect(() => {
    if (disabled) {
      setMovement({
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false,
      });
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [disabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. If typing in any input field or textarea, do not block or capture keystrokes
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return;
      }

      // 2. If controls are disabled (e.g. phone is open), do not move
      if (disabled) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }

      let isMovingKey = false;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement(m => ({ ...m, forward: true }));
          isMovingKey = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement(m => ({ ...m, left: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement(m => ({ ...m, backward: true }));
          isMovingKey = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement(m => ({ ...m, right: true }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setMovement(m => ({ ...m, sprint: true }));
          break;
      }

      // Firefox requires audio to be played DIRECTLY inside a user interaction event.
      if (isMovingKey && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return;
      }

      if (disabled) return;

      let isReleasingMoveKey = false;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement(m => ({ ...m, forward: false }));
          isReleasingMoveKey = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement(m => ({ ...m, left: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement(m => ({ ...m, backward: false }));
          isReleasingMoveKey = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement(m => ({ ...m, right: false }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setMovement(m => ({ ...m, sprint: false }));
          break;
      }

      if (isReleasingMoveKey && audioRef.current) {
        audioRef.current.pause();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { passive: false });
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled]);

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const targetPitch = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse Y (-1 to 1) for looking up and down
      const normalizedY = -(e.clientY / window.innerHeight) * 2 + 1;
      // Set target pitch (max 30 degrees up or down)
      targetPitch.current = normalizedY * (Math.PI / 6);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    // Clamp delta to prevent physics/camera explosions when frame rates drop or the tab is inactive
    const clampedDelta = Math.min(delta, 0.1);

    // Increase speed if sprinting
    const speed = movement.sprint ? 80.0 : 40.0;
    const rotationSpeed = movement.sprint ? 2.5 : 2.0;

    // Apply rotation (A and D keys) for yaw
    if (movement.left) camera.rotation.y += rotationSpeed * clampedDelta;
    if (movement.right) camera.rotation.y -= rotationSpeed * clampedDelta;

    // Smoothly apply mouse pitch (looking up/down)
    camera.rotation.x += (targetPitch.current - camera.rotation.x) * 10 * clampedDelta;
    camera.rotation.z = 0;
    camera.rotation.order = "YXZ";

    // Apply friction/damping to velocity
    velocity.current.x -= velocity.current.x * 10.0 * clampedDelta;
    velocity.current.z -= velocity.current.z * 10.0 * clampedDelta;

    // Calculate forward/backward direction based on camera rotation
    direction.current.set(0, 0, Number(movement.backward) - Number(movement.forward));

    // Only apply rotation to the Z axis movement to move in the direction we are facing
    if (movement.forward || movement.backward) {
      direction.current.applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
      velocity.current.x -= direction.current.x * speed * clampedDelta;
      velocity.current.z -= direction.current.z * speed * clampedDelta;
    }

    camera.position.x -= velocity.current.x * clampedDelta;
    camera.position.z -= velocity.current.z * clampedDelta;

    // Boundary collision (Garage walls are at -50 and 50)
    const limit = 48;
    if (camera.position.x > limit) camera.position.x = limit;
    if (camera.position.x < -limit) camera.position.x = -limit;
    if (camera.position.z > limit) camera.position.z = limit;
    if (camera.position.z < -limit) camera.position.z = -limit;

    // Head bob effect for walking simulation (faster when sprinting)
    const isMoving = movement.forward || movement.backward;
    const baseHeight = 2.0;
    if (isMoving) {
      const bobSpeed = movement.sprint ? 18 : 12;
      const bobAmount = movement.sprint ? 0.1 : 0.06;
      camera.position.y = baseHeight + Math.sin(state.clock.elapsedTime * bobSpeed) * bobAmount;

      // Update audio playback rate if walking vs sprinting
      if (audioRef.current) {
        audioRef.current.playbackRate = movement.sprint ? 1.5 : 1.0;
      }
    } else {
      camera.position.y += (baseHeight - camera.position.y) * 0.1;
    }
  });

  return null;
};



// Procedural Garage Environment
const GarageEnvironment = () => {
  // Load the diffuse texture from the unzipped folder
  const floorTexture = useTexture('/models/rubber_tiles/textures/rubber_tiles_diff_4k.jpg');

  // Set the texture to repeat instead of stretching across the entire 100x100 floor
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(20, 20); // Repeat the tile 20x20 times

  return (
    <group>
      {/* Textured Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        {/* Changed color from #888888 to #ffffff so the texture displays at maximum brightness */}
        <meshStandardMaterial map={floorTexture} roughness={0.6} metalness={0.2} color="#ffffff" />
      </mesh>



      {/* Lighting - MAX BRIGHTNESS */}
      <ambientLight intensity={3.0} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} castShadow />

      {/* Massive spotlight acting like a stadium lamp pointing directly at the floor */}
      <spotLight
        position={[0, 40, 0]}
        angle={Math.PI / 2}
        penumbra={0.5}
        intensity={8.0}
        distance={150}
        castShadow
      />

      {/* Grid of overhead garage lights to illuminate the floor evenly */}
      {[-30, -10, 10, 30].map(x =>
        [-30, -10, 10, 30].map(z => (
          <pointLight key={`${x}-${z}`} position={[x, 15, z]} intensity={1.5} distance={40} />
        ))
      )}
    </group>
  );
};

export const GameBoard: React.FC<GameBoardProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  focusProject,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Helper to determine car level based on feedback (Quests logic)
  // Level 1 (5), Level 2 (20), Level 3 (40), Level 4 (60)
  const getCarLevel = (feedbackCount: number = 0) => {
    if (feedbackCount >= 60) return 4;
    if (feedbackCount >= 40) return 3;
    if (feedbackCount >= 20) return 2;
    return 1;
  };

  return (
    <div className="relative w-full h-full bg-zinc-950 overflow-hidden">
      <Canvas shadows="percentage" camera={{ position: [0, 2, 10], fov: 60 }}>
        <React.Suspense fallback={null}>
          <Environment files="/models/horn-koppe_spring_4k.exr" background />
        </React.Suspense>

        <GarageEnvironment />
        <PlayerControls disabled={!!selectedProject} />

        {/* Layout projects in a grid in the garage */}
        {projects.map((proj, index) => {
          // Simple grid layout based on index
          const cols = 5;
          const row = Math.floor(index / cols);
          const col = index % cols;

          const spacing = 12;
          const x = (col - Math.floor(cols / 2)) * spacing;
          const z = (row - Math.floor(projects.length / cols / 2)) * spacing - 15;


          return (
            <CarNode
              key={proj.id}
              project={proj}
              position={[x, 0, z]}
              isSelected={selectedProject?.id === proj.id}
              onClick={() => onSelectProject(proj)}
            />
          );
        })}
      </Canvas>
      {selectedProject && (
        <button
          className="absolute top-6 right-6 z-50 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-lg backdrop-blur-md border border-zinc-700 transition-colors"
          onClick={() => {
            onSelectProject(null as unknown as Project);
          }}
        >
          Close Sidebar
        </button>
      )}
    </div>
  );
};
