import type {GeoCell} from '../../../packages/world-schema/src/index';
import type {PrototypeCell} from './world';

/**
 * Temporary M0 adapter. Its coordinates/land classes are SYNTHETIC.
 * NEVER export these as verified Madrid observations or merge into the
 * production GIS source snapshot.
 */
export function syntheticGeography(cells:readonly PrototypeCell[]):ReadonlyMap<string,GeoCell>{
 const result=new Map<string,GeoCell>();
 for(const c of cells){
  result.set(c.id,{
   id:c.id,
   centerLat:40.42+(c.r-7)*0.004,
   centerLon:-3.70+(c.q-8)*0.005,
   buildable:c.terrain!=='water',
   terrain:c.terrain,
   elevationM:c.y,
   provenance:{
    terrain:{kind:'synthetic',caveat:'Procedural tile class; not actual Madrid land use.'},
    centerLat:{kind:'synthetic',caveat:'Procedural reference coordinate, not surveyed.'},
    centerLon:{kind:'synthetic',caveat:'Procedural reference coordinate, not surveyed.'},
    elevationM:{kind:'synthetic',caveat:'Procedural height; not terrain elevation.'},
    buildable:{kind:'synthetic',caveat:'Fictional gameplay zoning; not official land-use permission.'}
   }
  });
 }
 return result;
}
