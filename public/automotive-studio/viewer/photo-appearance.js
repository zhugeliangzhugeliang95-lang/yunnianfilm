import * as THREE from 'three';
import {photoProfiles} from './catalog/photo-profiles.js';
import {materialTextures} from './catalog/material-textures.js';
import {materialProfile} from './film-material.js';
// Original-photo pigment/texture feeds the material BEFORE physical lighting.
// Do not replace outgoingLight: that removed the clearcoat and environment response.
const state={product:null};
const uniforms={ynPattern:{value:0},ynPatternScale:{value:1},ynTexture:{value:null},ynFlake:{value:0},ynWeave:{value:0}};
const textures=new Map(),loader=new THREE.TextureLoader();
export function attachPhotoAppearance(material){
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 ynPosition; varying vec3 ynNormal;')
   .replace('#include <defaultnormal_vertex>','#include <defaultnormal_vertex>\nynNormal = inverseTransformDirection(transformedNormal, viewMatrix);')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nynPosition = (modelMatrix * vec4(position, 1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   uniform float ynPattern; uniform float ynPatternScale; uniform sampler2D ynTexture; uniform float ynFlake; uniform float ynWeave;
   varying vec3 ynPosition; varying vec3 ynNormal;
   vec3 ynWeights(){vec3 w=pow(abs(normalize(ynNormal)),vec3(8.0));return w/max(w.x+w.y+w.z,0.0001);}
   vec3 ynSample(vec2 p){
    vec3 color=texture2D(ynTexture,p).rgb;
    if(ynWeave>0.5){
     // Keep the photographed weave, remove the much broader camera lighting.
     vec3 illumination=textureLod(ynTexture,p,4.0).rgb;
     return clamp(color/max(illumination,vec3(.002)),vec3(.55),vec3(1.5));
    }
    return color;
   }
   float ynHash(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(ynPattern>0.5){
    vec3 w=ynWeights();vec3 p=ynPosition*(ynPatternScale/0.064);
    vec3 pattern=ynSample(p.yz)*w.x+ynSample(p.xz)*w.y+ynSample(p.xy)*w.z;
    diffuseColor.rgb=ynWeave>0.5?diffuseColor.rgb*pattern:pattern;
   }`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   if(ynFlake>0.0){
    // Filter sub-pixel flakes. Only the pigmented layer is perturbed; the
    // independently evaluated clearcoat keeps a continuous reflection.
    vec3 cell=ynPosition*700.0;
    float footprint=max(length(dFdx(cell)),length(dFdy(cell)));
    float visible=1.0-smoothstep(.65,1.8,footprint);
    vec3 grain=vec3(ynHash(floor(cell)),ynHash(floor(cell)+19.1),ynHash(floor(cell)+47.7))-.5;
    normal=normalize(normal+mat3(viewMatrix)*grain*ynFlake*.16*visible);
   }`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   if(ynFlake>0.0){
    vec3 p=ynPosition*1600.0;
    float footprint=max(length(dFdx(p)),length(dFdy(p)));
    float visibility=1.0-smoothstep(0.7,2.0,footprint);
    float grain=ynHash(floor(p));
    roughnessFactor=clamp(roughnessFactor+(grain-.5)*ynFlake*visibility,0.08,1.0);
   }`);
 };
 material.customProgramCacheKey=()=> 'yunnian-film-v15-layered';
}
export function usePhotoProduct(product,onReady=()=>{}){
 state.product=product;const profile=photoProfiles[product.id];
 uniforms.ynPattern.value=0;uniforms.ynWeave.value=0;uniforms.ynFlake.value=materialProfile(product).flake;
 if(profile?.textureRegion&&materialTextures[product.id]){
  const asset=materialTextures[product.id];uniforms.ynPatternScale.value=asset.scale;uniforms.ynWeave.value=asset.scale===.65?1:0;
  let texture=textures.get(product.id);
  const activate=()=>{if(state.product?.id!==product.id)return;uniforms.ynTexture.value=texture;uniforms.ynPattern.value=1;onReady();};
  if(!texture){texture=loader.load(asset.url,activate,undefined,()=>{if(state.product?.id===product.id){uniforms.ynPattern.value=0;onReady();}});texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;texture.anisotropy=8;textures.set(product.id,texture);}
  if(texture.image?.complete)activate();
 }
 onReady();
}
export function appearanceNote(product,lang='zh'){
 const z=lang==='zh';
 if(product.effect==='carbon')return z?'纹理取自原图；重复尺度与铺贴方向为示意。':'Texture From The Original Card; Pattern Scale And Placement Are Illustrative.';
 if(product.effect==='reflective')return z?'展示原图颜色；不模拟反光强度或安全性能。':'Photo Color Only; Retroreflection And Safety Performance Are Not Simulated.';
 if(product.effect==='shift')return z?'保留原图记录的本色；随角变色需对照实物，单张照片无法还原。':'Uses The Color Recorded In The Photo. A Single Photo Cannot Reconstruct Angular Color Shift; Check A Physical Sample.';
 return z?'颜色取自原图，车漆反射随灯光变化；请以实物色卡确认。':'Photo-Sourced Color With Simulated Material Reflections. Confirm With A Physical Swatch.';
}
