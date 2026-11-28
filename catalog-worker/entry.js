import support from 'existing-support-worker';
import {handleCatalogAPI} from './api.js';
import {baseCatalog,CatalogError,json} from './common.js';
import {querySeries} from '../support/series-query.mjs';
import {publicEdits,storefront} from './storefront.js';
export default {
  async fetch(request,env,ctx) {
    const path=new URL(request.url).pathname;
    if(path.startsWith('/support/api/')) {
      let catalog;
      const lookup=async (text,history,lang,ids,page) => {
        if (!catalog) {
          const [base,edits]=await Promise.all([baseCatalog(request,env),publicEdits(env.SUPPORT_DB)]);
          const products=new Map(base.bySlug);
          for(const p of edits)products.set(p.slug,{...p,tables:p.tables ?? base.bySlug.get(p.slug)?.tables ?? []});
          catalog={products:[...products.values()],words:base.words,colors:base.colors,colorFamilies:base.colorFamilies};
        }
        return querySeries(text,history,catalog,lang,ids,page);
      };
      return support.fetch(request,env,ctx,lookup);
    }
    try {
      if(path.startsWith('/catalog-api/'))return await handleCatalogAPI(request,env);
      if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
      const result=await storefront(request,env);
      return request.method==='HEAD'?new Response(null,result):result;
    } catch(error) {
      if(error instanceof CatalogError)return json({error:error.message},error.status);
      console.error('Catalogue request failed',error?.message);
      const query=new URL(request.url).searchParams;
      if(!path.startsWith('/catalog-api/') && !query.has('catalog-preview') && !query.has('seo-preview'))return env.ASSETS.fetch(request);
      return json({error:'暂时无法读取资料，请稍后重试。'},503);
    }
  },
};
