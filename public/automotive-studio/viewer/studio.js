import * as THREE from 'three';
import {HDRLoader} from './loaders/HDRLoader.js';
import {HorizontalBlurShader} from './shaders/HorizontalBlurShader.js';
import {VerticalBlurShader} from './shaders/VerticalBlurShader.js';

export async function buildStudio(renderer, scene) {
 const hdr = await new HDRLoader().loadAsync('./environments/studio_small_09_2k.hdr');
 hdr.mapping = THREE.EquirectangularReflectionMapping;
 const pmrem = new THREE.PMREMGenerator(renderer);
 const env = pmrem.fromEquirectangular(hdr).texture;
 hdr.dispose(); pmrem.dispose();
 scene.environment=env; scene.environmentIntensity=1.35;
 scene.environmentRotation.y=3.5;
 scene.background=new THREE.Color('#606b73');
 scene.fog=new THREE.Fog('#606b73',16,42);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshStandardMaterial({color:'#545e65',roughness:.58,metalness:.06,envMapIntensity:.8}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.008;scene.add(floor);
 // Height-dependent contact occlusion, baked from the actual stationary geometry.
 // Based on the Three.js contact-shadow example (MIT); only rebuilt on model change.
 const size=7, resolution=1024;
 const rt=new THREE.WebGLRenderTarget(resolution,resolution);
 const temp=new THREE.WebGLRenderTarget(resolution,resolution);
 const planeGeo=new THREE.PlaneGeometry(size,size).rotateX(Math.PI/2);
 const shadow=new THREE.Mesh(planeGeo,new THREE.MeshBasicMaterial({map:rt.texture,transparent:true,opacity:.82,depthWrite:false,toneMapped:false}));
 shadow.scale.y=-1;shadow.position.y=-.004;shadow.renderOrder=2;scene.add(shadow);
 const shadowCamera=new THREE.OrthographicCamera(-size/2,size/2,size/2,-size/2,0,1.55);
 shadowCamera.position.y=-.003;shadowCamera.rotation.x=Math.PI/2;
 const depth=new THREE.MeshDepthMaterial({side:THREE.DoubleSide});
 depth.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );','gl_FragColor = vec4( vec3( 0.0 ), pow( 1.0 - fragCoordZ, 1.8 ) );');};
 const horizontal=new THREE.ShaderMaterial(HorizontalBlurShader);
 const vertical=new THREE.ShaderMaterial(VerticalBlurShader);
 horizontal.depthTest=false;vertical.depthTest=false;
 const blurPlane=new THREE.Mesh(planeGeo,horizontal);
 const bake=()=>{
  const bg=scene.background, fog=scene.fog, alpha=renderer.getClearAlpha();
  shadow.visible=false;floor.visible=false;scene.background=null;scene.fog=null;
  scene.overrideMaterial=depth;renderer.setClearAlpha(0);
  renderer.setRenderTarget(rt);renderer.clear();renderer.render(scene,shadowCamera);
  scene.overrideMaterial=null;
  for(const radius of [2.8,1.1]){
   blurPlane.material=horizontal;horizontal.uniforms.tDiffuse.value=rt.texture;horizontal.uniforms.h.value=radius/resolution;
   renderer.setRenderTarget(temp);renderer.render(blurPlane,shadowCamera);
   blurPlane.material=vertical;vertical.uniforms.tDiffuse.value=temp.texture;vertical.uniforms.v.value=radius/resolution;
   renderer.setRenderTarget(rt);renderer.render(blurPlane,shadowCamera);
  }
  renderer.setRenderTarget(null);renderer.setClearAlpha(alpha);
  scene.background=bg;scene.fog=fog;floor.visible=true;shadow.visible=true;
 };
 return {bake, setLighting(day){
  scene.environmentIntensity=day?1.8:1.35;scene.environmentRotation.y=day?1.15:3.5;
  scene.background.set(day?'#b5bec4':'#606b73');scene.fog.color.copy(scene.background);
  floor.material.color.set(day?'#90999d':'#545e65');renderer.toneMappingExposure=day?1.05:.92;
 }};
}

export function refineMaterials(root,paint,hex) {
 const replacements=new Map();
 root.traverse(o=>{
  if(!o.isMesh)return;
  o.castShadow=false;o.receiveShadow=false;
  const remap=m=>{
   if(replacements.has(m))return replacements.get(m);
   let n=m;
   if(m.name.startsWith('WRAP_')){
    n=new THREE.MeshPhysicalMaterial({name:m.name,color:hex,metalness:0,roughness:.27,clearcoat:1,clearcoatRoughness:.095,ior:1.5,specularIntensity:1});
    paint.push(n);
   }else if(m.name==='GLASS_Smoked'){
    n=new THREE.MeshPhysicalMaterial({name:m.name,color:'#bdcdca',metalness:0,roughness:.045,transmission:.94,thickness:.025,ior:1.46,attenuationColor:'#6c817b',attenuationDistance:.16,envMapIntensity:1.2,side:THREE.DoubleSide});
   }else if(m.name==='Mt_Glass_Translucent'){
    n=new THREE.MeshPhysicalMaterial({name:m.name,color:'#ffffff',metalness:0,roughness:.025,transparent:true,opacity:.15,depthWrite:false,clearcoat:1,clearcoatRoughness:.03,ior:1.48});
   }else if(m.name==='Mt_AlloyWheels'){
    n=m.clone();n.color.set('#555c63');n.metalness=.95;n.roughness=.24;
   }else if(m.name==='Mt_Tyres'){
    n=m.clone();n.color.set('#505050');n.metalness=0;n.roughness=.86;
    if(n.normalScale)n.normalScale.set(.5,.5);
   }else if(m.name==='TRIM_Obsidian'){
    n=new THREE.MeshPhysicalMaterial({name:m.name,color:'#141719',metalness:0,roughness:.28,clearcoat:.35,clearcoatRoughness:.2});
   }else if(m.name==='INTERIOR_Charcoal'){
    n=m.clone();n.color.set('#242628');n.metalness=0;n.roughness=.76;
   }
   for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(n[key])n[key].anisotropy=8;
   replacements.set(m,n);return n;
  };
  o.material=Array.isArray(o.material)?o.material.map(remap):remap(o.material);
 });
}
