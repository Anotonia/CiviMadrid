import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { WorldState } from '../../../packages/world-schema/src/index';

export type Terrain = 'urban' | 'forest' | 'water' | 'park' | 'other';
export interface PrototypeCell {
  id: string;
  q: number;
  r: number;
  x: number;
  z: number;
  y: number;
  terrain: Terrain;
  /** Synthetic grid: coordinates have not been joined to official Madrid data. */
  kind: 'synthetic';
}
const TERRAINS: Terrain[] = ['urban', 'forest', 'water', 'park', 'other'];
const colors: Record<Terrain, string> = {
  urban: '#b3ada0',
  forest: '#547566',
  park: '#7fa38a',
  water: '#3e8098',
  other: '#a69c7b',
};

function cellTerrain(q: number, r: number): Terrain {
  const x = q - 8; const z = r - 7;
  const noise = ((q * 19 + r * 37 + q * r * 7) % 101) / 101;
  if (Math.abs(x + z * 0.65 + 1) < 0.65 && r > 3 && r < 13) return 'water';
  if (x * x + z * z < 22 || noise > 0.82) return 'urban';
  if (noise < 0.18) return 'forest';
  if (noise < 0.38) return 'park';
  return 'other';
}

export function syntheticCells(): PrototypeCell[] {
  const cells: PrototypeCell[] = [];
  for (let q = 0; q < 17; q++) {
    for (let r = 0; r < 15; r++) {
      const terrain = cellTerrain(q,r);
      cells.push({
        id: `syn-${q}-${r}`, q, r,
        x: (q - 8) * 1.78 + (r - 7) * 0.89,
        z: (r - 7) * 1.53,
        y: terrain === 'water' ? -0.3 : ((q * 5 + r * 3) % 5) * 0.055,
        terrain,
        kind: 'synthetic'
      });
    }
  }
  return cells;
}

interface LayerProps {
  cells: PrototypeCell[];
  terrain: Terrain;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function HexLayer({cells, terrain, onSelect, onHover}: LayerProps) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => cells.filter(c => c.terrain === terrain), [cells,terrain]);
  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    const dummy = new THREE.Object3D();
    for(let i=0;i<items.length;i++){
      const c=items[i];
      dummy.position.set(c.x,c.y,c.z);
      dummy.scale.set(1, terrain === 'water' ? 0.55 : 1, 1);
      dummy.updateMatrix();
      instanced.setMatrixAt(i,dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
  },[items,terrain]);
  function selectedCell(e: ThreeEvent<MouseEvent>): PrototypeCell | null {
    if (e.instanceId === undefined) return null;
    return items[e.instanceId] ?? null;
  }
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined,undefined,items.length]}
      castShadow={terrain!=='water'}
      receiveShadow
      onPointerOver={e=>{e.stopPropagation();onHover(selectedCell(e)?.id ?? null);}}
      onPointerOut={()=>onHover(null)}
      onClick={e=>{e.stopPropagation();const cell=selectedCell(e);if(cell)onSelect(cell.id);}}
    >
      <cylinderGeometry args={[1.0,1.0,0.32,6,1,false]}/>
      <meshStandardMaterial color={colors[terrain]} roughness={0.85} metalness={0.02} flatShading/>
    </instancedMesh>
  );
}

function Selection({cell}: {cell?: PrototypeCell}) {
  if(!cell) return null;
  return (
    <mesh position={[cell.x,cell.y+0.20,cell.z]} rotation={[0,0,0]}>
      <cylinderGeometry args={[1.034,1.034,0.035,6]}/>
      <meshStandardMaterial color="#f0c77c" emissive="#e8aa45" emissiveIntensity={0.8} transparent opacity={0.84}/>
    </mesh>
  );
}

function BuiltAssets({cells, world}: {cells:PrototypeCell[];world?:WorldState}) {
  if(!world)return null;
  return <group>
    {cells.filter(c=>world.cells[c.id]?.improvement!=='none' && world.cells[c.id]?.improvement).map(cell=>{
      const state=world.cells[cell.id];
      const construction=state.constructionTurnsRemaining>0;
      const color=construction?'#d8ae6d':
        state.improvement==='solar'?'#215475':state.improvement==='housing'?'#d9b69a':'#5bb1b4';
      return <group key={cell.id} position={[cell.x,cell.y+0.38,cell.z]}>
       <mesh castShadow position={[0,0.12,0]}>
        {state.improvement==='housing'
          ? <boxGeometry args={[0.62,construction?0.25:0.80,0.54]}/>
          : state.improvement==='solar'
            ? <boxGeometry args={[0.72,0.13,0.50]}/>
            : <cylinderGeometry args={[0.34,0.42,construction?0.17:0.48,8]}/>}
        <meshStandardMaterial color={color} metalness={0.20} roughness={0.66}/>
       </mesh>
       {construction && <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}>
        <ringGeometry args={[0.65,0.73,6]}/>
        <meshBasicMaterial color="#f0c77c" side={THREE.DoubleSide}/>
       </mesh>}
      </group>;
    })}
  </group>;
}

export function WorldScene({
  selectedId, onSelect, onHover, world
}: {
  selectedId: string | null;
  onSelect:(id:string)=>void;
  onHover:(id:string|null)=>void;
  world?: WorldState;
}) {
  const cells = useMemo(syntheticCells, []);
  const selected = cells.find(c=>c.id === selectedId);
  return (
    <Canvas
      shadows
      camera={{position:[18,24,27], fov:40, near:0.1, far:160}}
      dpr={[1,1.75]}
      gl={{antialias:true, alpha:false}}
      onPointerMissed={()=>onSelect('')}
    >
      <color attach="background" args={['#9cb6bf']}/>
      <fog attach="fog" args={['#9cb6bf',30,95]}/>
      <ambientLight intensity={0.85}/>
      <hemisphereLight args={['#e3eff4','#84715b',1.25]}/>
      <directionalLight position={[16,32,14]} intensity={3.0} castShadow shadow-mapSize={[1024,1024]}/>
      <group rotation={[0,Math.PI/6,0]}>
        {TERRAINS.map(terrain => <HexLayer key={terrain} terrain={terrain} cells={cells} onSelect={onSelect} onHover={onHover}/>)}
        <BuiltAssets cells={cells} world={world}/>
        <Selection cell={selected}/>
      </group>
      <OrbitControls
        makeDefault
        target={[0,0,0]}
        enableDamping
        minDistance={12}
        maxDistance={65}
        minPolarAngle={Math.PI/6}
        maxPolarAngle={Math.PI/2.5}
        maxAzimuthAngle={Infinity}
      />
    </Canvas>
  );
}
