import * as THREE from 'three';

// A neutral light tent. All incident light is achromatic; no photographed
// windows, colored walls or duplicate area lights are baked onto the product.
export function neutralStudioEnvironment(renderer) {
 const room = new THREE.Scene();
 room.background = new THREE.Color().setRGB(.045,.045,.045);
 const panel=(position,size,radiance)=>{
  const material=new THREE.MeshBasicMaterial({color:new THREE.Color().setRGB(radiance,radiance,radiance),side:THREE.DoubleSide,toneMapped:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(...size),material);
  mesh.position.fromArray(position);mesh.lookAt(0,.5,0);room.add(mesh);
 };
 panel([-4,5,1],[.38,7],9);
 panel([4,3,-3],[.3,6],6);
 panel([0,6,-4],[5,.3],4);
 panel([0,-4,0],[20,20],.018);
 const pmrem=new THREE.PMREMGenerator(renderer);
 const target=pmrem.fromScene(room,.025,.1,100);
 pmrem.dispose();
 room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 return target;
}
