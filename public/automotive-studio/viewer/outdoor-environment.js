import * as THREE from 'three';
import {HDRLoader} from './loaders/HDRLoader.js';
import {GroundedSkybox} from './objects/GroundedSkybox.js';

// One captured world for the backdrop, body, glass and wheels. Split the sun
// out of the IBL so a shadow-casting directional light does not count it twice.
export async function outdoorEnvironment(renderer,scene){
 const resolution=matchMedia('(max-width:800px)').matches?'2k':'4k';
 const hdr=await new HDRLoader().setDataType(THREE.FloatType).loadAsync('./environments/rooftop_day_'+resolution+'.hdr');
 // Camera white-balance estimate from incident hemispheric light. Apply it to
 // the captured world before splitting lighting, so neutral films do not gain
 // an artificial yellow-green cast. This does not calibrate product photos.
 const source=hdr.image,incident=[0,0,0];
 for(let y=0;y<source.height/2;y++){
  const theta=(y+.5)/source.height*Math.PI,weight=Math.sin(theta)*Math.cos(theta);
  for(let x=0;x<source.width;x++){const i=(y*source.width+x)*4;for(let c=0;c<3;c++)incident[c]+=source.data[i+c]*weight;}
 }
 const luminance=.2126*incident[0]+.7152*incident[1]+.0722*incident[2],gain=incident.map(v=>luminance/v);
 for(let i=0;i<source.data.length;i+=4)for(let c=0;c<3;c++)source.data[i+c]*=gain[c];
 hdr.needsUpdate=true;hdr.mapping=THREE.EquirectangularReflectionMapping;
 const sky=hdr.clone();sky.image={...hdr.image,data:new Float32Array(hdr.image.data)};sky.needsUpdate=true;
 const {width,height,data}=sky.image,sunRGB=new THREE.Vector3(),sunVector=new THREE.Vector3();let total=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2],l=.2126*r+.7152*g+.0722*b;
  if(l<=10)continue;
  const theta=(y+.5)/height*Math.PI,phi=((x+.5)/width-.5)*Math.PI*2;
  const solid=Math.sin(theta)*2*Math.PI*Math.PI/(width*height),excess=1-10/l,w=l*excess*solid;
  sunVector.addScaledVector(new THREE.Vector3(Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)),w);
  sunRGB.addScaledVector(new THREE.Vector3(r,g,b),excess*solid);total+=w;
  data[i]*=1-excess;data[i+1]*=1-excess;data[i+2]*=1-excess;
 }
 const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(sky);pmrem.dispose();sky.dispose();
 const dome=new GroundedSkybox(hdr,3,100,128);dome.position.y=3-.014;dome.name='Outdoor captured environment';dome.renderOrder=-10;scene.add(dome);
 const sun=new THREE.DirectionalLight(0xffffff,1);
 sun.color.setRGB(sunRGB.x,sunRGB.y,sunRGB.z,THREE.LinearSRGBColorSpace);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:1,far:35});sun.shadow.bias=-.00015;sun.shadow.normalBias=.014;sun.shadow.radius=2;scene.add(sun,sun.target);
 const catcher=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.ShadowMaterial({opacity:.35,depthWrite:false}));catcher.rotation.x=-Math.PI/2;catcher.position.y=-.009;catcher.receiveShadow=true;catcher.renderOrder=0;scene.add(catcher);
 const direction=total>0?sunVector.normalize():new THREE.Vector3(-.5,.7,.5).normalize();
 return {texture:target.texture,dome,sun,catcher,rotate(angle){dome.rotation.y=angle;sun.position.copy(direction).applyAxisAngle(new THREE.Vector3(0,1,0),angle).multiplyScalar(15);sun.target.position.set(0,0,0);},setVisible(visible){dome.visible=visible;sun.visible=visible;catcher.visible=visible;}};
}
