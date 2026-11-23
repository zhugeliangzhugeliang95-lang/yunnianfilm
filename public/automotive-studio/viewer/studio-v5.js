import * as THREE from 'three';
import {curvedPanel} from './curved-panel.js';
import {bodyPanelNormals} from './body-normals.js';
import {attachPhotoAppearance} from './photo-appearance.js';
import {Reflector} from './objects/Reflector.js';
import {outdoorEnvironment} from './outdoor-environment.js';
import {RectAreaLightUniformsLib} from './lights/RectAreaLightUniformsLib.js';
import {HDRLoader} from './loaders/HDRLoader.js';
import {HorizontalBlurShader} from './shaders/HorizontalBlurShader.js';
import {VerticalBlurShader} from './shaders/VerticalBlurShader.js';



export async function buildStudio(renderer, scene) {
 const hdr = await new HDRLoader().setDataType(THREE.FloatType).loadAsync('./environments/studio_small_09_2k.hdr');
 hdr.mapping = THREE.EquirectangularReflectionMapping;
 const pmrem = new THREE.PMREMGenerator(renderer);
 const env = pmrem.fromEquirectangular(hdr).texture;
 const outdoor=await outdoorEnvironment(renderer,scene);
 pmrem.dispose();hdr.dispose();
 scene.environment=env; scene.environmentIntensity=.8;
 scene.environmentRotation.y=0;
 // The HDR sky supplies diffuse fill; no omnidirectional ambient wash.
 scene.background=new THREE.Color('#242424');
 scene.fog=new THREE.Fog('#242424',16,42);
 const profile=[new THREE.Vector2(0,0),new THREE.Vector2(40,0)];for(let i=1;i<=32;i++){const angle=i/32*Math.PI/2;profile.push(new THREE.Vector2(40+10*Math.sin(angle),10*(1-Math.cos(angle))));}profile.push(new THREE.Vector2(50,60));
 const floor=new THREE.Mesh(new THREE.LatheGeometry(profile.reverse(),128),new THREE.MeshStandardMaterial({color:'#303030',roughness:.86,metalness:0,envMapIntensity:.15}));
 floor.position.y=-.008;scene.add(floor);
 // Height-dependent contact occlusion, baked from the actual stationary geometry.
 // Based on the Three.js contact-shadow example (MIT); only rebuilt on model change.
 
 const reflectionShader={...Reflector.ReflectorShader,uniforms:{...Reflector.ReflectorShader.uniforms},
 vertexShader:Reflector.ReflectorShader.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec3 floorPosition;').replace('vUv = textureMatrix','floorPosition=position; vUv = textureMatrix'),
 fragmentShader:`uniform sampler2D tDiffuse;varying vec4 vUv;varying vec3 floorPosition;
 void main(){vec2 uv=vUv.xy/vUv.w;vec3 reflection=vec3(0.0);float weights=0.0;
 for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){float w=exp(-float(x*x+y*y)*.5);reflection+=texture2D(tDiffuse,uv+vec2(float(x),float(y))*.0045).rgb*w;weights+=w;}
 float fade=1.0-smoothstep(3.5,6.5,length(floorPosition.xy));gl_FragColor=vec4(reflection/weights,.065*fade);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`};
 const mirror=new Reflector(new THREE.PlaneGeometry(13,13),{textureWidth:1024,textureHeight:1024,multisample:4,clipBias:.001,shader:reflectionShader});
 mirror.rotation.x=-Math.PI/2;mirror.position.y=-.006;mirror.material.transparent=true;mirror.material.depthWrite=false;mirror.renderOrder=1;
 const captureReflection=mirror.onBeforeRender;mirror.onBeforeRender=function(...args){if(scene.overrideMaterial)return;captureReflection.apply(this,args);};scene.add(mirror);

 RectAreaLightUniformsLib.init();
 const lights=[];const area=(x,y,z,power,w,h)=>{const l=new THREE.RectAreaLight('#ffffff',power,w,h);l.position.set(x,y,z);l.lookAt(0,.6,0);scene.add(l);lights.push(l);};
 area(-3,5,1,4,6,.75);area(4,3,-3,2.4,4,.5);
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
  const hidden=[shadow,floor,mirror,outdoor.dome,outdoor.catcher],visibility=hidden.map(o=>o.visible);hidden.forEach(o=>o.visible=false);
  const shadowAuto=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;
  shadow.visible=false;floor.visible=false;mirror.visible=false;scene.background=null;scene.fog=null;
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
  scene.background=bg;scene.fog=fog;hidden.forEach((o,i)=>o.visible=visibility[i]);renderer.shadowMap.autoUpdate=shadowAuto;
 };
 let lightingBase=.4,lightAngle=0;
 const rotateLighting=angle=>{
  lightAngle=angle;scene.environmentRotation.y=lightingBase+angle;outdoor.rotate(lightingBase+angle);
  const positions=[new THREE.Vector3(-3,5,1),new THREE.Vector3(4,3,-3)];lights.forEach((l,i)=>{l.position.copy(positions[i]).applyAxisAngle(new THREE.Vector3(0,1,0),angle);l.lookAt(0,.6,0);});
 };
 const setLighting=day=>{
  outdoor.setVisible(day);floor.visible=!day;mirror.visible=!day;shadow.material.opacity=day?.55:.82;
  lights.forEach(l=>l.visible=!day);scene.environment=day?outdoor.texture:env;scene.environmentIntensity=day?1:.65;
  lightingBase=day?.4:1.15;rotateLighting(lightAngle);
  scene.background=day?null:new THREE.Color('#242424');scene.fog=day?null:new THREE.Fog('#242424',16,42);
  floor.material.color.set('#303030');renderer.toneMappingExposure=day?.82:1;
 };
 setLighting(true);
 return {bake,floor,shadow,lights,rotateLighting,setLighting,applyProduct(materials){
  // All surfaces share the active world, including chrome; no studio-only maps.
  for(const material of materials)if(material.envMap){material.envMap=null;material.needsUpdate=true;}
 }};
}

export function refineMaterials(root,paint,hex) {
 const replacements=new Map();root.updateWorldMatrix(true,true);
 root.traverse(o=>{
  if(!o.isMesh)return;
  o.castShadow=true;o.receiveShadow=true;
  if(!Array.isArray(o.material)&&o.material.name.startsWith('WRAP_')&&!o.name.includes('Film')){o.geometry=bodyPanelNormals(o.geometry);if(/Hood/.test(o.name))o.geometry=curvedPanel(o.geometry);}
  const remap=m=>{
   if(replacements.has(m))return replacements.get(m);
   let n=m;
   if(m.name.startsWith('WRAP_')){
    n=new THREE.MeshPhysicalMaterial({name:m.name,color:hex,metalness:0,roughness:.24,clearcoat:1,clearcoatRoughness:.055,ior:1.48,specularIntensity:1,side:m.side});
    attachPhotoAppearance(n);paint.push(n);
   }else if(m.name==='GLASS_Smoked'){
    n=new THREE.MeshPhysicalMaterial({name:m.name,color:'#bdcdca',metalness:0,roughness:.045,transmission:.94,thickness:.025,ior:1.46,attenuationColor:'#6c817b',attenuationDistance:.16,envMapIntensity:1.2,side:THREE.DoubleSide});
   }else if(m.name==='Mt_Glass_Translucent'){
    n=new THREE.MeshPhysicalMaterial({name:m.name,color:'#ffffff',metalness:0,roughness:.025,transparent:true,opacity:.15,depthWrite:false,clearcoat:1,clearcoatRoughness:.03,ior:1.48});
   }else if(m.name==='Mt_AlloyWheels'){
    n=m.clone();n.color.set('#6c7279');n.metalness=.96;n.roughness=.3;
   }else if(m.name==='Mt_Tyres'){
    n=m.clone();n.color.set('#252729');n.metalness=0;n.roughness=.86;
    if(n.normalScale)n.normalScale.set(.5,.5);
   }else if(m.name==='TRIM_Obsidian'){
    n=new THREE.MeshPhysicalMaterial({name:m.name,color:'#141719',metalness:0,roughness:.28,clearcoat:.35,clearcoatRoughness:.2});
   }else if(m.name==='INTERIOR_Charcoal'){
    n=m.clone();n.color.set('#242628');n.metalness=0;n.roughness=.76;
   }
   if(n.isMeshStandardMaterial){n.envMap=null;n.envMapIntensity=1;}
   if(/glass/i.test(m.name)){o.castShadow=false;}
   for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(n[key])n[key].anisotropy=8;
   replacements.set(m,n);return n;
  };
  o.material=Array.isArray(o.material)?o.material.map(remap):remap(o.material);
 });
}
