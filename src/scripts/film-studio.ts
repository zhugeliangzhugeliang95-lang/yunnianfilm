import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {flexibleSheet} from '../../public/automotive-studio/viewer/film-geometry.js';

type State={mode:string;color:string;finish:string;explode:number;layer:number;uv:number;vlt:number;tser:number;rotate:boolean};
export function createFilmStudio(host:HTMLElement,initial:State,onLayer:(index:number)=>void){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e7e9e1');const camera=new THREE.PerspectiveCamera(35,1,.1,100);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=4;controls.maxDistance=12;controls.minPolarAngle=.18;controls.maxPolarAngle=Math.PI*.48;controls.enableZoom=false;controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
 // Wheel scrolling remains page scrolling; two-finger scaling is handled explicitly below.
 renderer.domElement.style.touchAction='pan-y';let pinch=0;
 renderer.domElement.addEventListener('touchstart',e=>{if(e.touches.length===2)pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);},{passive:true});
 renderer.domElement.addEventListener('touchmove',e=>{if(e.touches.length!==2||!pinch)return;e.preventDefault();const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);const direction=camera.position.clone().sub(controls.target);direction.setLength(THREE.MathUtils.clamp(direction.length()*pinch/d,4,12));camera.position.copy(controls.target).add(direction);pinch=d;dirty=true;},{passive:false});
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
 const ambient=new THREE.HemisphereLight(0xffffff,0x78816a,2);scene.add(ambient);const key=new THREE.DirectionalLight(0xffffff,3.3);key.position.set(3,6,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;scene.add(key);
 const fill=new THREE.DirectionalLight(0xd9e4f1,1.5);fill.position.set(-3,2,-4);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(8,80),new THREE.MeshStandardMaterial({color:'#e4e7df',roughness:.85}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=-.025;scene.add(floor);
 const stage=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,.08,96),new THREE.MeshStandardMaterial({color:'#dde2d6',roughness:.6,metalness:.08}));stage.position.y=-.06;stage.receiveShadow=true;scene.add(stage);
 const objects=new THREE.Group();scene.add(objects);
 const paint=new THREE.MeshPhysicalMaterial({color:initial.color,metalness:.4,roughness:.2,clearcoat:1,clearcoatRoughness:.1,envMapIntensity:1.3});
 const rubber=new THREE.MeshStandardMaterial({color:'#171c1d',roughness:.92});const trim=new THREE.MeshStandardMaterial({color:'#222b2d',roughness:.35,metalness:.6});const alloy=new THREE.MeshStandardMaterial({color:'#b8c4c4',roughness:.22,metalness:.92});const glass=new THREE.MeshPhysicalMaterial({color:'#253c42',metalness:.25,roughness:.12,clearcoat:1});
 const car=new THREE.Group();objects.add(car);
 function box(w:number,h:number,d:number,r:number,mat:THREE.Material,x:number,y:number,z:number,parent=car){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function panel(points:number[][],mat:THREE.Material,parent=car){const g=new THREE.BufferGeometry();const arr=[];for(let i=1;i<points.length-1;i++)arr.push(...points[0],...points[i],...points[i+1]);g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.castShadow=true;parent.add(m);return m;}
 // A generic, original coupe, built from continuous section surfaces and separate glazing.
 const rings=[[-2.32,.69,.69,.24],[-2.13,.88,.76,.30],[-1.55,1,.76,.35],[-.85,.93,.76,.36],[0,.93,.73,.33],[.8,.95,.71,.32],[1.48,1,.70,.31],[2.13,.83,.63,.25],[2.34,.66,.59,.17]];
 const pos:number[]=[];const ind:number[]=[];const steps=32;
 rings.forEach(([x,w,y,h])=>{for(let j=0;j<=steps;j++){const a=j/steps*Math.PI*2;pos.push(x,y+Math.cos(a)*h,Math.sin(a)*w);}});
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<steps;j++){const a=i*(steps+1)+j,b=a+steps+1;ind.push(a,a+1,b,b,a+1,b+1);}
 for(const end of [0,rings.length-1]){const [x,w,y,h]=rings[end];const center=pos.length/3;pos.push(x,y,0);for(let j=0;j<steps;j++){const a=end*(steps+1)+j;ind.push(center,...(end===0?[a+1,a]:[a,a+1]));}}
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geom.setIndex(ind);geom.computeVertexNormals();const body=new THREE.Mesh(geom,paint);body.castShadow=true;body.receiveShadow=true;car.add(body);
 box(4.25,.13,1.85,.06,trim,0,.39,0);
 // Cabin: sloping windscreen, rear glass, body-colored roof and window pillars.
 const dblGlass=glass.clone();dblGlass.side=THREE.DoubleSide;
 panel([[.82,1.0,-.8],[.82,1.0,.8],[.16,1.45,.65],[.16,1.45,-.65]],dblGlass);
 panel([[-.86,1.45,-.63],[-.86,1.45,.63],[-1.42,1.08,.77],[-1.42,1.08,-.77]],dblGlass);
 box(1.13,.095,1.36,.045,paint,-.35,1.48,0);
 for(const side of [-1,1]){
  const ss=(z:number)=>z*side;
  panel([[.70,1.025,ss(.80)],[.105,1.42,ss(.665)],[-.78,1.42,ss(.66)],[-1.43,1.085,ss(.80)]],dblGlass);
  const line=(pts:number[][],mat=trim,radius=.018)=>{const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,24,radius,6,false),mat);car.add(m);return m;};
  line([[.78,1.0,ss(.82)],[.16,1.45,ss(.68)],[-.86,1.45,ss(.67)],[-1.55,1.08,ss(.83)]],paint,.037);
  line([[-.44,1.055,ss(.84)],[-.45,1.44,ss(.68)]],trim,.028);
  line([[-1.42,1.07,ss(.82)],[.7,1.01,ss(.82)]],alloy,.012);
  line([[-.73,.48,ss(.94)],[-.8,.95,ss(.91)]],trim,.008);
  box(.24,.025,.035,.008,alloy,-.52,.94,ss(.94));
  box(.29,.14,.17,.055,paint,.53,1.10,ss(.99));
  box(.44,.055,.055,.022,new THREE.MeshStandardMaterial({color:'#e6f3ed',emissive:'#d9eadc',emissiveIntensity:.55}),2.22,.76,ss(.52));
  box(.48,.04,.045,.015,new THREE.MeshStandardMaterial({color:'#991e1e',emissive:'#601010',emissiveIntensity:.3}),-2.19,.86,ss(.49));
  for(const x of [-1.48,1.45]){
   const wheel=new THREE.Group();wheel.position.set(x,.43,ss(.92));car.add(wheel);
   const tire=new THREE.Mesh(new THREE.TorusGeometry(.32,.115,12,40),rubber);wheel.add(tire);tire.castShadow=true;
   const rim=new THREE.Mesh(new THREE.CylinderGeometry(.265,.265,.23,40),alloy);rim.rotation.x=Math.PI/2;wheel.add(rim);
   const disk=new THREE.Mesh(new THREE.CylinderGeometry(.215,.215,.245,36),trim);disk.rotation.x=Math.PI/2;wheel.add(disk);
   for(let i=0;i<7;i++){const angle=i/7*Math.PI*2;const spoke=new THREE.Mesh(new THREE.BoxGeometry(.038,.40,.03),alloy);spoke.rotation.z=angle;spoke.position.z=ss(.137);wheel.add(spoke);}
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.28,24),alloy);hub.rotation.x=Math.PI/2;wheel.add(hub);
  }
 }
 box(.07,.15,1.1,.025,trim,2.31,.56,0);box(.08,.045,1.6,.015,trim,2.26,.40,0);box(.13,.045,1.48,.02,paint,-2.14,1.08,0);
 const layerGroup=new THREE.Group();objects.add(layerGroup);const layerMeshes:THREE.Mesh[]=[];
 const layerColors=['#f4f6f6','#f3f7f8','#e5f1f4','#f1eee4','#eeeae1'];
 const thicknesses=[.003,.002,.013,.004,.008];
 for(let i=0;i<5;i++){
  const mat=new THREE.MeshPhysicalMaterial({color:layerColors[i],metalness:0,roughness:i===4?.44:.16,transmission:0,thickness:thicknesses[i],ior:1.47,clearcoat:i===4?.05:.7,clearcoatRoughness:.12,side:THREE.DoubleSide,transparent:i!==4,opacity:i===4?1:.3,depthWrite:i===4});
  const geometry=flexibleSheet({width:3.15,length:2.05,bend:i===0?1.15:i===4?.1:.18,lift:0,thickness:thicknesses[i],segments:64});
  const m=new THREE.Mesh(geometry,[mat,mat]);m.castShadow=true;m.receiveShadow=true;layerGroup.add(m);m.userData.layer=i;m.renderOrder=5-i;layerMeshes.push(m);
 }
 const paintBase=box(3.42,.12,2.22,.04,new THREE.MeshPhysicalMaterial({color:'#41484c',metalness:.15,roughness:.28,clearcoat:.8}),0,.09,0,layerGroup);
 const windowGroup=new THREE.Group();objects.add(windowGroup);
 const paneMat=new THREE.MeshPhysicalMaterial({color:'#a9c5cc',roughness:.12,metalness:.08,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false,clearcoat:1});
 const pane=box(.09,2.65,2.28,.04,paneMat,0,1.56,0,windowGroup);pane.rotation.z=-.09;
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(pane.geometry),new THREE.LineBasicMaterial({color:'#536f70'}));pane.add(outline);
 const beams:{input:THREE.Group;output:THREE.Group;dots:THREE.Mesh[];blocked:THREE.Mesh;key:'uv'|'vlt'|'tser'}[]=[];
 const rayData=[['uv',0x8073ad,2.35],['vlt',0xb4954c,1.42],['tser',0xbd7654,.78]] as const;
 function beam(a:THREE.Vector3,b:THREE.Vector3,color:number,opacity=1){const group=new THREE.Group();const d=b.clone().sub(a);const material=new THREE.MeshStandardMaterial({color,transparent:true,opacity,roughness:.55});const tube=new THREE.Mesh(new THREE.CylinderGeometry(.023,.023,d.length()-.12,8),material);tube.position.copy(a).addScaledVector(d,.5);tube.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());group.add(tube);const head=new THREE.Mesh(new THREE.ConeGeometry(.072,.18,12),material);head.position.copy(b);head.quaternion.copy(tube.quaternion);group.add(head);windowGroup.add(group);return group;}
 for(const [k,color,y] of rayData){
  const input=beam(new THREE.Vector3(-2.7,y,0),new THREE.Vector3(-.18,y,0),color);const output=beam(new THREE.Vector3(.18,y,0),new THREE.Vector3(2.55,y,0),color);
  const dot=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),new THREE.MeshBasicMaterial({color}));dot.position.set(-2.4,y,0);windowGroup.add(dot);
  const block=new THREE.Mesh(new THREE.TorusGeometry(.11,.018,7,28),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7}));block.rotation.y=Math.PI/2;block.position.set(-.14,y,0);windowGroup.add(block);
  beams.push({input,output,dots:[dot],blocked:block,key:k});
 }
 const raycaster=new THREE.Raycaster();let down={x:0,y:0};renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointerup',e=>{if(current.mode!=='ppf'||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=raycaster.intersectObjects(layerMeshes,false)[0];if(hit)onLayer(hit.object.userData.layer);});
 let current={...initial};let dirty=true;let shown=true;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let previous=initial.mode;
 function view(which='reset'){
  controls.target.set(0,current.mode==='ppf'?.55+current.explode/100*1.08:current.mode==='window'?1.45:.78);
  if(which==='front')camera.position.set(current.mode==='window'?-5.4:6.5,2.8,0.2);
  else if(which==='side')camera.position.set(0,2.2,7.8);
  else camera.position.set(current.mode==='window'?4.4:5.6,current.mode==='ppf'?4.5:3.1,current.mode==='window'?6.3:6.6);
  controls.update();dirty=true;
 }
 function update(s:State){const oldExplode=current.explode;current={...s};if(s.mode==='ppf'&&oldExplode!==s.explode){const dy=.55+s.explode/100*1.08-controls.target.y;controls.target.y+=dy;camera.position.y+=dy;}const ppf=s.mode==='ppf';scene.background.set(ppf?'#252a2d':'#e7e9e1');floor.material.color.set(ppf?'#41484c':'#e4e7df');stage.material.color.set(ppf?'#41484c':'#dde2d6');ambient.intensity=ppf?.6:2;ambient.groundColor.set(ppf?'#686868':'#78816a');key.intensity=ppf?1.8:3.3;fill.intensity=ppf?.4:1.5;renderer.toneMapping=ppf?THREE.NeutralToneMapping:THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=ppf?1:1.05;car.visible=s.mode.endsWith('color');layerGroup.visible=s.mode==='ppf';windowGroup.visible=s.mode==='window';stage.visible=s.mode!=='window';paint.color.set(s.color);paint.metalness=s.finish==='metallic'?.85:.35;paint.roughness=s.finish==='satin'?.55:s.finish==='metallic'?.26:.15;paint.clearcoat=s.finish==='satin'?.15:1;
  layerMeshes.forEach((m,i)=>{m.position.y=.19+(4-i)*(.018+s.explode/100*.48);const mat=(m.material as THREE.MeshPhysicalMaterial[])[0];mat.emissive.set(i===s.layer?'#9aa7ab':'#000000');mat.emissiveIntensity=i===s.layer?.055:0;mat.roughness=i===4?.44:i===s.layer?.12:.19;mat.opacity=i===4?1:i===s.layer?.4:.24;});
  paneMat.opacity=.18+(1-s.vlt/100)*.55;
  beams.forEach(b=>{const transmission=b.key==='vlt'?s.vlt/100:1-s[b.key]/100;b.output.traverse(o=>{if(o instanceof THREE.Mesh){o.material.opacity=transmission;o.visible=transmission>.005;}});b.blocked.visible=b.key==='vlt'?false:transmission<.99;b.blocked.scale.setScalar(.7+(1-transmission)*.7);});
  controls.autoRotate=s.rotate;controls.autoRotateSpeed=.8;if(previous!==s.mode){view();previous=s.mode;}dirty=true;
 }
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<500?43:35;camera.updateProjectionMatrix();dirty=true;}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);controls.addEventListener('change',()=>dirty=true);update(initial);view();resize();
 let last=0;renderer.setAnimationLoop(time=>{if(!shown||document.hidden)return;const delta=Math.min((time-last)/1000,.05);last=time;controls.update(delta);const moving=controls.autoRotate||(current.mode==='window'&&!reduced);if(current.mode==='window'&&!reduced)beams.forEach((b,i)=>{b.dots[0].position.x=-2.6+((time/1900+i*.22)%1)*2.38;});if(dirty||moving){renderer.render(scene,camera);dirty=false;}});
 return {update,view,visible(v:boolean){shown=v;dirty=true;},nudge(key:string){const v=camera.position.clone().sub(controls.target);const s=new THREE.Spherical().setFromVector3(v);if(key==='ArrowLeft')s.theta-=.12;if(key==='ArrowRight')s.theta+=.12;if(key==='ArrowUp')s.phi=Math.max(.2,s.phi-.08);if(key==='ArrowDown')s.phi=Math.min(Math.PI*.47,s.phi+.08);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();dirty=true;}};
}
