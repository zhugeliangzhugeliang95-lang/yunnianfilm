import newSeries from './new-series.json';
import sourceDetails from './source-product-details.json';
import ownerProducts from './owner-products-v9.json';
import expandedProducts from './expanded-products.json';
import storeProducts from './store-products.json';
export const company = {
  name: 'Yunnian New Material Technology (Guangzhou) Co., Ltd.',
  email: 'yunnianfilm@gmail.com', phone: '+86 198 8096 8878', whatsapp: '8619880968878',
  address: 'Room 103, No. 1, Jinhu Industrial Zone, No. 28 Hululing Street, Kemulang, Tianhe District, Guangzhou, Guangdong, China',
};
const catalogBase = [
  {slug:'lubrizol-sm301-ppf',name:'Lubrizol® SM301 PPF',category:'Clear PPF',label:'CLEAR PROTECTION',image:'clear-ppf-application.webp',description:'A clear aliphatic TPU film for professional paint protection, with a hydrophobic topcoat and four thickness options.',materials:'Lubrizol® SM301 aliphatic TPU',options:['6.5 mil — Hydrophobic','7.5 mil — Hydrophobic','8.5 mil — Hydrophobic','9.5 mil — Hydrophobic'],specs:[['Substrate','Lubrizol® SM301 aliphatic TPU'],['Thickness','6.5 / 7.5 / 8.5 / 9.5 mil'],['Topcoat','Hydrophobic'],['Application','Vehicle paint protection'],['Packaging','YUNNIAN branded boxes'],['Customization','OEM / ODM on request']],sheet:'/images/spec.webp',source:'https://www.ynfilm.com/products/yunnian-premium-tpu-ppf-lubrizol-sm301-substrate'},
  {slug:'classic-color-ppf',name:'Classic Color PPF',category:'Color PPF',label:'COLOR & PROTECTION',image:'green-ppf.webp',description:'Color and paint protection in one TPU film. Choose an existing product color from the color-card catalog for full wraps and individual panels.',materials:'TPU color film',options:['Metallic Dark Green','Silver Fox Gray','Metallic Glacier Blue','Santorini Black','Royal Indigo','Request full color selection'],specs:[['Film type','TPU color PPF'],['Roll size','1.52 m × 15 m'],['Listed thickness','7.5 mil'],['Finishes','Gloss / satin metallic / paint'],['Application','Full wraps or individual panels'],['Color selection','Request physical swatches']],source:'https://www.ynfilm.com/products/tpu-color-ppf-classic-oem-color-series'},
  {slug:'chameleon-aurora-window-film',name:'Chameleon Aurora',category:'Window film',label:'AUTOMOTIVE WINDOW FILM',image:'window-film.webp',description:'An iridescent window film range with a changing visual finish. Ask our team for the available shades and optical specifications for your market.',materials:'Automotive window film',options:['Request shade selection','Request technical specifications'],specs:[['Category','Automotive window film'],['Series','Chameleon Aurora'],['Appearance','Color-shifting finish'],['VLT / TSER','Request the selected shade’s data sheet'],['Roll size','Confirm with your quotation'],['Application','Subject to local window-tint requirements']],source:'https://www.ynfilm.com/products/chameleon-aurora-series-window-film-dynamic-color-shift-high-heat-rejection'},
  {slug:'basf-elastollan-ppf',name:'BASF Elastollan® PPF',category:'Clear PPF',label:'CLEAR PROTECTION',image:'basf-ppf.webp',description:'Aliphatic TPU paint protection with hydrophilic or hydrophobic options, selected to suit your installation and care preferences.',materials:'BASF Elastollan® aliphatic TPU',options:['6.5 mil — Hydrophilic','7.5 mil — Hydrophilic','8.5 mil — Hydrophilic','7.5 mil — Hydrophobic','8.5 mil — Hydrophobic'],specs:[['Substrate','BASF Elastollan® L787A10 001'],['Thickness','6.5 / 7.5 / 8.5 mil'],['Coating options','Hydrophilic / hydrophobic'],['Application','Vehicle paint protection'],['Packaging','YUNNIAN branded boxes'],['Customization','OEM / ODM on request']],source:'https://www.ynfilm.com/products/yunnian-premium-tpu-ppf-basf-elastollan-substrate-cn'},
  {slug:'covestro-ppf',name:'Covestro™ TPU PPF',category:'Clear PPF',label:'CLEAR PROTECTION',image:'covestro-ppf.webp',description:'A clear TPU paint protection range with a choice of thicknesses for your professional installation portfolio.',materials:'Covestro™ aliphatic TPU',options:['7.5 mil','8.5 mil','9.5 mil'],specs:[['Substrate','Covestro™ aliphatic TPU'],['Thickness','7.5 / 8.5 / 9.5 mil'],['Application','Vehicle paint protection'],['Coating','Confirm selected variant'],['Packaging','Confirm with your quotation'],['Customization','Discuss OEM requirements']],source:'https://www.ynfilm.com/products/yunnian-premium-tpu-ppf-covestro-aliphatic-substrate-7-5mil-8-5mil-9-5mil-paint-protection-film'},
  ...expandedProducts,
  ...storeProducts,
];
// Current product specification guidance supplied by the owner on 2026-11-09.
const ownerCatalog = [...catalogBase,...ownerProducts].map(p=>{
 const item={...p,specs:p.specs.map(row=>[...row]),options:[...p.options]};
 const set=(key:string,value:string)=>{item.specs=item.specs.filter(row=>![key,...(key==='Thickness'?['Listed thickness']:[])].includes(row[0]));item.specs.push([key,value]);};
 if(p.category==='Clear PPF'){
  item.name=p.name.includes('TPU PPF')?p.name:p.name.replace(' PPF',' TPU PPF');
  set('Thickness','6.5 / 7.5 / 8.5 / 9.5 mil');set('Finishes','Clear Gloss / Matte');
  item.options=['6.5','7.5','8.5','9.5'].flatMap(n=>[n+' mil — Clear Gloss',n+' mil — Matte']);
 }
 if(p.category==='Color PPF'){item.name=p.name.replace('Color PPF','TPU Color PPF').replace('Texture PPF','Texture TPU PPF');item.specs=item.specs.map(([key,value])=>[key==='Finish'?'Visual effect':key,value]);set('Thickness','7.5 mil');set('Finishes','As Shown On Selected Color Card');}
 if(p.category==='PET color wraps'){set('Thickness','Approx. 6.3 mil');set('Finishes','As Shown On Selected Color Card');item.image='pet-color-wrap-category.webp';item.categoryArtwork=true;}
 if(p.slug==='windshield-protection-film'){item.name='KPU Glass Shield';set('Thickness','7 mil');}
 return item;
});
// Keep owner-confirmed specifications on established lines. New series have their own model-level data.
export const products = [...ownerCatalog, ...newSeries].map(product => {
 const sheets = sourceDetails[product.slug as keyof typeof sourceDetails] ?? [];
 const variants = [...new Set(sheets.flatMap(sheet => sheet.variants.map(v => v.title)).filter(v=>v !== 'Default Title'))];
 const isOptical = ['Window film', 'Windshield protection', 'Headlight films'].includes(product.category);
 return {
   ...product,
   options: isOptical && variants.length ? variants : product.options,
   searchTerms: ['storeTitle' in product ? product.storeTitle : '', ...sheets.flatMap(s=>[s.title, ...s.variants.flatMap(v=>[v.title,v.sku]), ...s.tables.flat(2)])].filter(Boolean).join(' '),
 };
});
export const faqs = [
  ['How do I choose a film?', 'Start with the application, finish and installation conditions. Send us your market, preferred material and thickness. We can discuss suitable options and arrange samples before a larger order.'],
  ['Can I request samples?', 'Yes. Ask for a sample book or the specific film you want to evaluate. Sample availability, any charges and courier costs are confirmed by our team before dispatch.'],
  ['Do you offer OEM or private-label options?', 'OEM / ODM requests can include branding, packaging and specifications. Share your requirements so we can confirm feasibility, minimum quantities and lead time for your project.'],
  ['How are wholesale prices and shipping calculated?', 'Your quotation depends on the film, selected variant, quantity, packaging and destination. The team confirms product pricing, shipping charges and delivery terms before you place an order.'],
  ['Where can I get technical and warranty information?', 'Request the technical data sheet and written warranty terms for your exact product and batch. Test conditions, installation and aftercare requirements should be reviewed before ordering.'],
];
