import * as THREE from 'three';
// Repair only body-panel shading. Exact coincident positions share face normals;
// deliberate panel creases remain split. Positions/UVs/silhouette are untouched.
export function bodyPanelNormals(geometry){
 const geo=geometry.index?geometry.toNonIndexed():geometry.clone();
 const pos=geo.attributes.position,faces=[],adjacent=new Map();
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3();
 const key=i=>[pos.getX(i),pos.getY(i),pos.getZ(i)].map(v=>Math.round(v*100000)).join(',');
 for(let i=0;i<pos.count;i+=3){
  a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1);c.fromBufferAttribute(pos,i+2);
  const area=ab.subVectors(b,a).cross(ac.subVectors(c,a)).clone(),normal=area.clone().normalize();
  const face={normal,area};faces.push(face);
  for(let j=0;j<3;j++){const k=key(i+j);if(!adjacent.has(k))adjacent.set(k,[]);adjacent.get(k).push(face);}
 }
 const values=new Float32Array(pos.count*3),limit=Math.cos(THREE.MathUtils.degToRad(32));
 for(let i=0;i<pos.count;i++){
  const face=faces[Math.floor(i/3)],n=new THREE.Vector3();
  for(const neighbor of adjacent.get(key(i)))if(face.normal.dot(neighbor.normal)>limit)n.add(neighbor.area);
  n.normalize().toArray(values,i*3);
 }
 geo.setAttribute('normal',new THREE.BufferAttribute(values,3));return geo;
}
