import * as THREE from 'three';

// Continuous, indexed sheets with a smooth bend. Dimensions are presentation
// units: edge thickness is enlarged for legibility, not a product specification.
export function flexibleSheet({width=1.7,length=2.3,bend=.9,lift=.2,thickness=.0025,segments=100}={}){
 const positions=[],uvs=[],indices=[];const across=24;
 const point=(u,v,side)=>{
  const x=(u-.5)*width;
  const travel=v*length,flat=length*.58,arc=Math.max(0,travel-flat),radius=.46;
  const theta=arc/radius*bend;
  const z=-length/2+Math.min(travel,flat)+(bend?Math.sin(theta)*radius/bend:arc);
  const y=lift+(bend?(1-Math.cos(theta))*radius/bend:0)+.026*Math.sin(u*Math.PI)*Math.sin(v*Math.PI);
  return [x,y+side*thickness*.5*Math.cos(theta),z-side*thickness*.5*Math.sin(theta)];
 };
 for(let face=0;face<2;face++)for(let j=0;j<=segments;j++)for(let i=0;i<=across;i++){
  positions.push(...point(i/across,j/segments,face===0?1:-1));uvs.push(i/across,j/segments);
 }
 const stride=across+1,count=stride*(segments+1);
 for(let face=0;face<2;face++)for(let j=0;j<segments;j++)for(let i=0;i<across;i++){
  const a=face*count+j*stride+i,b=a+stride;
  indices.push(...(face===0?[a,b,a+1,b,b+1,a+1]:[a,a+1,b,b,a+1,b+1]));
 }
 const topCount=across*segments*6;
 // Thin edges have their own vertices: their outward normals must not be
 // averaged into the top/bottom faces of the film.
 const edge=(a,b)=>{
  const start=positions.length/3;
  for(const source of [a,b,a+count,b+count]){positions.push(...positions.slice(source*3,source*3+3));uvs.push(...uvs.slice(source*2,source*2+2));}
  indices.push(start,start+3,start+1,start,start+2,start+3);
 };
 for(let i=0;i<across;i++){edge(i+1,i);edge(segments*stride+i,segments*stride+i+1);}
 for(let j=0;j<segments;j++){edge(j*stride,(j+1)*stride);edge((j+1)*stride+across,j*stride+across);}
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
 geometry.addGroup(0,topCount,0);geometry.addGroup(topCount,topCount,1);geometry.addGroup(topCount*2,indices.length-topCount*2,0);
 geometry.computeVertexNormals();return geometry;
}

export function createFilmSample(){
 const root=new THREE.Group();root.name='Flexible film and peeled liner';
 const material=new THREE.MeshPhysicalMaterial({name:'WRAP_FlexibleFilm',color:'#bc1709',metalness:0,roughness:.28,clearcoat:1,clearcoatRoughness:.16,side:THREE.DoubleSide});
 const underside=material.clone();underside.name='WRAP_FilmUnderside';
 const sheet=new THREE.Mesh(flexibleSheet(),[material,underside]);root.add(sheet);
 const linerMaterial=new THREE.MeshPhysicalMaterial({name:'RELEASE_Liner',color:'#eae8e2',metalness:0,roughness:.48,clearcoat:.12,side:THREE.DoubleSide});
 const liner=new THREE.Mesh(flexibleSheet({width:1.72,length:2.3,bend:.18,lift:.182,thickness:.004}),[linerMaterial,linerMaterial]);root.add(liner);
 root.rotation.y=-.22;
 return root;
}
