import type { Language } from './i18n';
import {categoryUrl} from './categories';

export function editorial(lang: Language) {
  const L = (en: string, zh: string) => lang === 'zh' ? zh : en;
  const families = [
    {
      id: 'clear', category: 'Clear PPF', number: '01',
      name: L('Keep the original.', '守护原有之美。'),
      title: L('Clear paint protection', '透明隐形车衣'),
      short: L('For the finish you love.', '为值得保留的漆面。'),
      description: L('A clear layer for the original finish. Explore TPU substrates, thicknesses and coating options for your installation needs.', '为原车漆面增加透明保护层。从 TPU 基材、厚度到涂层，寻找适合施工需求的组合。'),
      image: 'film-craft-v3.webp',
      alt: L('Illustrative scene of clear film being positioned over a car panel', '透明保护膜覆于汽车面板的施工场景示意图'),
      note: L('Application concept · illustrative scene', '应用概念 · 场景示意'),
      tags: [L('Aliphatic TPU', '脂肪族 TPU'), '6.5–9.5 mil', L('Multiple substrates', '多种基材')],
      destination: categoryUrl('Clear PPF'),
      action: L('Explore clear PPF', '探索透明车衣'),
    },
    {
      id: 'color', category: 'Color PPF', number: '02',
      name: L('Make it your own.', '让色彩表达个性。'),
      title: L('Color paint protection', 'TPU 彩色车衣'),
      short: L('A new expression. Your signature.', '焕新表达，自成风格。'),
      description: L('Color and paint protection in one film. Build your palette with physical swatches, then confirm the finish and specification.', '将色彩与漆面保护融于一体。通过实物色卡建立您的色彩组合，再确认质感与具体规格。'),
      image: 'color-library.webp',
      alt: L('YUNNIAN color film sample display from the official product collection', '云辇官方产品资料中的彩色车衣样板展示墙'),
      note: L('Color library · YUNNIAN product imagery', '色彩样板 · 云辇产品资料'),
      tags: ['TPU', L('Gloss & satin', '亮光与缎面'), L('Physical swatches', '实物色卡')],
      destination: '/products/?category=Color%20PPF',
      action: L('Explore color PPF', '探索彩色车衣'),
    },
    {
      id: 'glass', category: 'Window film', number: '03',
      name: L('A different perspective.', '焕新每一程视野。'),
      title: L('Automotive window film', '汽车窗膜'),
      short: L('Consider every layer of the view.', '从玻璃开始，探索更多可能。'),
      description: L('Explore Aurora, light-cured and core-color series. Request optical data for the selected shade and intended window.', '了解极光、光固化与芯层恒色窗膜。按所选颜色和施工部位索取光学资料，评估是否适合您的市场。'),
      image: 'window-film.webp',
      alt: L('YUNNIAN Chameleon Aurora windshield film product presentation', '云辇极光变色前挡窗膜产品展示'),
      note: L('Product imagery · confirm local tint requirements', '产品展示 · 请确认当地贴膜要求'),
      tags: [L('Color-shifting', '随视角变色'), L('Shade-specific data', '分色技术参数'), L('Automotive glass', '汽车玻璃')],
      destination: '/products/?category=Window%20film',
      action: L('Explore window film', '探索汽车窗膜'),
    },
  ];
  const colors = [
    { value: 'Metallic Dark Green', name: L('Metallic Dark Green', '金属墨绿'), hex: '#1d4038' },
    { value: 'Silver Fox Gray', name: L('Silver Fox Gray', '银狐灰'), hex: '#9da4a6' },
    { value: 'Metallic Glacier Blue', name: L('Metallic Glacier Blue', '金属冰川蓝'), hex: '#759ba7' },
    { value: 'Santorini Black', name: L('Santorini Black', '圣托里尼黑'), hex: '#25282a' },
    { value: 'Royal Indigo', name: L('Royal Indigo', '皇家靛蓝'), hex: '#373d69' },
  ];
  return { L, families, colors };
}
