import * as THREE from 'three';
import {bodyPanelNormals} from './body-normals.js';
// Cubic PN patches on the hood: interpolate the existing surface and normals.
// Open edges and hard creases stay linear so panel gaps and sharp lines remain.
export function curvedPanel(geometry,steps=4){
 const g=geometry.index?geometry.toNonIndexed():geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 const pos=[],normal=[],tex=[],edges=new Map(),triangles=[];
 const key=v=>[v.x,v.y,v.z].map(x=>Math.round(x*1e5)).join(',');
 const edgeKey=(a,b)=>[key(a),key(b)].sort().join('|');
 for(let i=0;i<p.count;i+=3){
  const pp=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,i+j)),nn=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(n,i+j));
  const face=new THREE.Vector3().subVectors(pp[1],pp[0]).cross(new THREE.Vector3().subVectors(pp[2],pp[0])).normalize();
  triangles.push({pp,nn,i});
  for(const [a,b] of [[0,1],[1,2],[2,0]]){const k=edgeKey(pp[a],pp[b]);if(!edges.has(k))edges.set(k,[]);edges.get(k).push(face);}
 }
 for(const {pp,nn,i} of triangles){
  const edge=(a,b)=>{const fs=edges.get(edgeKey(pp[a],pp[b])),smooth=fs.length===2&&fs[0].dot(fs[1])>Math.cos(Math.PI/6);const v=pp[a].clone().multiplyScalar(2).add(pp[b]);if(smooth)v.addScaledVector(nn[a],-new THREE.Vector3().subVectors(pp[b],pp[a]).dot(nn[a]));return v.multiplyScalar(1/3);};
  const e01=edge(0,1),e10=edge(1,0),e12=edge(1,2),e21=edge(2,1),e20=edge(2,0),e02=edge(0,2);
  const mean=e01.clone().add(e10).add(e12).add(e21).add(e20).add(e02).multiplyScalar(1/6),centroid=pp[0].clone().add(pp[1]).add(pp[2]).multiplyScalar(1/3),center=mean.clone().addScaledVector(mean.clone().sub(centroid),.5);
  const emit=(a,b)=>{
   const u=1-a/steps-b/steps,v=a/steps,w=b/steps;
   const q=pp[0].clone().multiplyScalar(u*u*u).addScaledVector(pp[1],v*v*v).addScaledVector(pp[2],w*w*w).addScaledVector(e01,3*u*u*v).addScaledVector(e10,3*u*v*v).addScaledVector(e12,3*v*v*w).addScaledVector(e21,3*v*w*w).addScaledVector(e20,3*w*w*u).addScaledVector(e02,3*w*u*u).addScaledVector(center,6*u*v*w);
   pos.push(q.x,q.y,q.z);
   const norm=nn[0].clone().multiplyScalar(u).addScaledVector(nn[1],v).addScaledVector(nn[2],w).normalize();normal.push(norm.x,norm.y,norm.z);
   if(uv)tex.push(uv.getX(i)*u+uv.getX(i+1)*v+uv.getX(i+2)*w,uv.getY(i)*u+uv.getY(i+1)*v+uv.getY(i+2)*w);
  };
  for(let a=0;a<steps;a++)for(let b=0;b<steps-a;b++){
   emit(a,b);emit(a+1,b);emit(a,b+1);
   if(a+b<steps-1){emit(a+1,b);emit(a+1,b+1);emit(a,b+1);}
  }
 }
 const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));result.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));if(uv)result.setAttribute('uv',new THREE.Float32BufferAttribute(tex,2));result.computeBoundingSphere();return bodyPanelNormals(result);
}
