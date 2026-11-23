import * as THREE from 'three';
let maps;
export function filmMaps(){
 if(maps)return maps;
 const N=512,heights=new Float32Array(N*N),normal=new Uint8Array(N*N*4),rough=new Uint8Array(N*N*4);
 const hash=(x,y,period)=>{x=(x+period)%period;y=(y+period)%period;let n=Math.imul(x+17,374761393)^Math.imul(y+31,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 const noise=(x,y,p)=>{const ix=Math.floor(x),iy=Math.floor(y);let a=x-ix,b=y-iy;a=a*a*(3-2*a);b=b*b*(3-2*b);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy,p),hash(ix+1,iy,p),a),THREE.MathUtils.lerp(hash(ix,iy+1,p),hash(ix+1,iy+1,p),a),b);};
 for(let y=0;y<N;y++)for(let x=0;x<N;x++)heights[y*N+x]=.6*noise(x/N*32,y/N*32,32)+.28*noise(x/N*96,y/N*96,96)+.12*noise(x/N*192,y/N*192,192);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const i=(y*N+x)*4;let nx=(heights[y*N+(x+N-1)%N]-heights[y*N+(x+1)%N])*3,ny=(heights[((y+N-1)%N)*N+x]-heights[((y+1)%N)*N+x])*3;
  const inv=1/Math.sqrt(nx*nx+ny*ny+1);normal[i]=Math.round(128+127*nx*inv);normal[i+1]=Math.round(128+127*ny*inv);normal[i+2]=Math.round(128+127*inv);normal[i+3]=255;
  const r=Math.round(210+45*heights[y*N+x]);rough[i]=rough[i+1]=rough[i+2]=r;rough[i+3]=255;
 }
 const make=data=>{const t=new THREE.DataTexture(data,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;};
 maps={normal:make(normal),rough:make(rough)};return maps;
}
// Physical-scale UVs for paint triangles only. Atlas UVs on other parts remain intact.
export function paintUV(mesh){
 const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
 if(!mats.some(m=>m.name.startsWith('WRAP_')))return;
 const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
 const pos=g.attributes.position,uv=g.attributes.uv?g.attributes.uv.clone():new THREE.BufferAttribute(new Float32Array(pos.count*2),2);
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3(),edge=new THREE.Vector3();
 const groups=g.groups.length?g.groups:[{start:0,count:pos.count,materialIndex:0}];
 for(const group of groups){if(!mats[group.materialIndex]?.name.startsWith('WRAP_'))continue;
  for(let i=group.start;i<group.start+group.count;i+=3){
   a.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(pos,i+1).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(pos,i+2).applyMatrix4(mesh.matrixWorld);n.subVectors(b,a).cross(edge.subVectors(c,a));
   const axis=Math.abs(n.x)>Math.abs(n.y)&&Math.abs(n.x)>Math.abs(n.z)?0:Math.abs(n.y)>Math.abs(n.z)?1:2;
   for(const [j,p]of [[i,a],[i+1,b],[i+2,c]]){const u=axis===0?p.z:p.x,v=axis===1?p.z:p.y;uv.setXY(j,u/.064,v/.064);}
  }
 }
 g.setAttribute('uv',uv);g.deleteAttribute('tangent');mesh.geometry=g;
}
