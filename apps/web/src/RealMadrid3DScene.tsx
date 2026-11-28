import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * District topology is sourced from Madrid's audited administrative geometry.
 * Extrusion is a CONSTANT, ART-DIRECTION height used to make the polygon
 * boundaries legible in 3D. It is not building mass, roof elevation, DEM,
 * a legal parcel, or source-observed height.
 */
export type DistrictModel = {
  code:string;
  name:string;
  screenRings:[number,number][][];
};

const ART_HEIGHT=0.16;
const MAP_PX_PER_WORLD_UNIT=34;
function DistrictExtrusion({
  district, selected, onSelect
}:{
  district:DistrictModel;
  selected:boolean;
  onSelect:(code:string)=>void;
}){
  const [hovered,setHovered]=useState(false);
  const geometry=useMemo(()=>{
    const shapes=district.screenRings.map(ring=>{
      const shape=new THREE.Shape();
      for(let i=0;i<ring.length;i++){
        const [px,py]=ring[i];
        const x=(px-500)/MAP_PX_PER_WORLD_UNIT;
        const y=-(py-370)/MAP_PX_PER_WORLD_UNIT;
        if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
      }
      shape.closePath();
      return shape;
    });
    return new THREE.ExtrudeGeometry(shapes,{
      depth:ART_HEIGHT,
      bevelEnabled:true,
      bevelThickness:0.025,
      bevelSize:0.035,
      bevelSegments:1,
      steps:1,
      curveSegments:2
    });
  },[district.screenRings]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const palette=['#a8c9c4','#9bbdc4','#bfceb3','#a9c5b6'];
  const color=selected?'#f0c386':hovered?'#d9e8d9':palette[Number(district.code)%palette.length];
  return <mesh
    name={'Madrid district '+district.code+' '+district.name}
    geometry={geometry}
    rotation={[-Math.PI/2,0,0]}
    position={[0,selected?0.10:0.015,0]}
    castShadow
    receiveShadow
    onClick={e=>{e.stopPropagation();onSelect(district.code);}}
    onPointerOver={e=>{e.stopPropagation();setHovered(true);document.body.style.cursor='pointer';}}
    onPointerOut={()=>{setHovered(false);document.body.style.cursor='';}}
  >
    <meshStandardMaterial
      color={color}
      roughness={0.78}
      metalness={0.06}
      emissive={selected?'#ad7a3d':'#000000'}
      emissiveIntensity={selected?0.15:0}
      side={THREE.DoubleSide}
    />
  </mesh>;
}
export default function RealMadrid3DScene({
  districts,selected,onSelect
}:{
  districts:DistrictModel[];
  selected:string;
  onSelect:(code:string)=>void;
}){
  return <div className="real-model-wrap" data-testid="real-madrid-3d">
    <Canvas
      aria-label="Interactive 3D administrative district model of Madrid"
      shadows
      camera={{position:[25,30,32],fov:43,near:0.1,far:180}}
      dpr={[1,1.7]}
      gl={{antialias:true,alpha:false}}
      onPointerMissed={()=>{}}
    >
      <color attach="background" args={['#bbd3dc']}/>
      <fog attach="fog" args={['#d7e5e8',48,120]}/>
      <ambientLight intensity={1.12}/>
      <hemisphereLight args={['#fff9ee','#92a9a0',1.6]}/>
      <directionalLight
        position={[16,28,12]} intensity={3.25} castShadow
        shadow-mapSize={[1024,1024]}
      />
      <mesh position={[0,-0.17,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[53,44]}/>
        <meshStandardMaterial color="#dce6e2" roughness={1}/>
      </mesh>
      <gridHelper args={[48,48,'#b4c6c6','#cbdad6']} position={[0,-0.14,0]}/>
      {districts.map(d=><DistrictExtrusion
        key={d.code} district={d} selected={selected===d.code} onSelect={onSelect}
      />)}
      <OrbitControls makeDefault enableDamping dampingFactor={0.09}
        target={[0,0,0]} minDistance={15} maxDistance={88}
        minPolarAngle={Math.PI/8} maxPolarAngle={Math.PI/2.1}/>
    </Canvas>
    <div className="real-model-truth" role="note">
      <b>3D DISTRICT RELIEF</b>
      <span>REAL PLAN GEOMETRY · SCHEMATIC EXTRUSION</span>
      <small>NO BUILDING MODELS OR OBSERVED HEIGHTS CONNECTED YET</small>
    </div>
    <div className="real-model-help">DRAG · ORBIT / SCROLL · ZOOM / CLICK · SELECT DISTRICT</div>
  </div>;
}
