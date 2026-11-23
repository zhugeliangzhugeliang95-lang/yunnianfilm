// Rendering estimates, not manufacturer finish/optical measurements. Keep these
// separate from the product's original name, finish and inquiry reference.
const photoOverrides={
 d17b0eebdaae:{roughness:.38,clearcoat:.28,clearcoatRoughness:.24,metalness:.18,flake:.12},
};
export function materialProfile(product){
 const finish=product.explicitFinish||product.sourceFinish||'Gloss';
 const p=finish==='Matte'
  ?{roughness:.62,clearcoat:0,clearcoatRoughness:.58,metalness:0,grain:.025,coatGrain:.005,flake:0}
  :finish==='Satin'
  ?{roughness:.4,clearcoat:.18,clearcoatRoughness:.28,metalness:0,grain:.012,coatGrain:.004,flake:0}
  :{roughness:.24,clearcoat:1,clearcoatRoughness:.055,metalness:0,grain:.004,coatGrain:.002,flake:0};
 if(product.effect==='metallic'){p.metalness=.32;p.flake=.16;}
 if(product.effect==='pearl'){p.metalness=.03;p.flake=.09;}
 if(product.effect==='chrome'){p.metalness=1;p.roughness=finish==='Matte'?.34:.12;p.clearcoat=.18;p.flake=0;}
 if(product.effect==='carbon'){p.roughness=finish==='Matte'?.58:.25;p.grain=.003;}
 Object.assign(p,photoOverrides[product.id]||{});
 return {...p,iridescence:0};
}

export function applyMaterialProfile(material,profile){
 for(const key of ['roughness','clearcoat','clearcoatRoughness','metalness','iridescence'])material[key]=profile[key];
 material.normalScale?.setScalar(profile.grain);
 material.clearcoatNormalScale?.setScalar(profile.coatGrain);
}
