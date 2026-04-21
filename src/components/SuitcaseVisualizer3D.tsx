import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  type: 'handle' | 'wheel';
  handleParams: { L: number; b: number; h: number };
  wheelParams: { L: number; D: number };
  deflection: number; // mm
  stressRatio: number;
}

const SuitcaseModel: React.FC<Props> = ({ type, handleParams, wheelParams, deflection, stressRatio }) => {
  const scale = 0.005;
  
  // Handle visual values
  const vHL = handleParams.L * scale;
  const vHB = handleParams.b * scale;
  
  // Wheel visual values
  const vWL = wheelParams.L * scale;
  const vWD = wheelParams.D * scale;

  const visualDeflection = deflection * scale * 15;

  const isWobbly = deflection > 15;
  const stressColor = new THREE.Color();
  if (stressRatio > 1.0 || isWobbly) {
    stressColor.set('#ef4444'); // 紅色: 超過負荷或不穩定 (Overload or Wobbly)
  } else {
    stressColor.set('#22c55e'); // 綠色: 安全且穩定 (Safe & Stable)
  }

  const bodyColor = "#a7f3d0"; // Mint green
  const handleColor = "#1a1a1a";

  return (
    <group position={[0, -0.5, 0]}>
      {/* Suitcase Body */}
      <group position={[0, 1, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 2.5, 0.8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.7} />
        </mesh>
        {[-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.41]}>
            <boxGeometry args={[0.05, 2.3, 0.02]} />
            <meshStandardMaterial color={bodyColor} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Telescopic Handle Assembly */}
      <group position={[0, 2.25, -0.2]}>
        {/* Left Tube */}
        <mesh position={[-0.4, vHL / 2, 0]}>
          <boxGeometry args={[vHB, vHL, vHB]} />
          <meshStandardMaterial 
            color={type === 'handle' ? stressColor : handleColor} 
            emissive={type === 'handle' ? stressColor : "#000"}
            emissiveIntensity={type === 'handle' ? 0.2 : 0}
          />
        </mesh>
        {/* Right Tube */}
        <mesh position={[0.4, vHL / 2, 0]}>
          <boxGeometry args={[vHB, vHL, vHB]} />
          <meshStandardMaterial 
            color={type === 'handle' ? stressColor : handleColor} 
            emissive={type === 'handle' ? stressColor : "#000"}
            emissiveIntensity={type === 'handle' ? 0.2 : 0}
          />
        </mesh>
        
        {/* The Handle Grip */}
        <mesh position={[0, vHL - (type === 'handle' ? visualDeflection : 0), 0]}>
          <boxGeometry args={[1, 0.15, 0.15]} />
          <meshStandardMaterial color={handleColor} />
        </mesh>
      </group>

      {/* Wheels & Axles */}
      <group position={[0, -0.2, 0]}>
        {[
          [-0.8, 0.4], [0.8, 0.4], [-0.8, -0.4], [0.8, -0.4]
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            {/* Wheel Support */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            {/* The Axle (Circular) */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.1, 0]}>
              <cylinderGeometry args={[vWD / 2, vWD / 2, vWL, 32]} />
              <meshStandardMaterial 
                color={type === 'wheel' ? stressColor : "#333"} 
                emissive={type === 'wheel' ? stressColor : "#000"}
                emissiveIntensity={type === 'wheel' ? 0.4 : 0}
              />
            </mesh>
            {/* The Wheel */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.1 - (type === 'wheel' ? visualDeflection : 0), 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
              <meshStandardMaterial color="#000" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

export const SuitcaseVisualizer3D: React.FC<Props> = (props) => {
  return (
    <div className="w-full h-full min-h-[500px] bg-[#1a1a1a]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

        <SuitcaseModel {...props} />

        <Grid
          infiniteGrid
          fadeDistance={30}
          fadeStrength={5}
          cellSize={1}
          sectionSize={5}
          sectionColor="#333"
          cellColor="#222"
        />
        
        <Environment preset="city" />
      </Canvas>
      
      <div className="absolute bottom-4 right-4 text-[10px] text-zinc-500 font-mono text-right pointer-events-none">
        滑鼠左鍵: 旋轉角度 | 右鍵: 平移 | 滾輪: 縮放
      </div>
    </div>
  );
};
