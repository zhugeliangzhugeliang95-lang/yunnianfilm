import details from './source-product-details.json';

export function sourceTables(slug: string) {
  const records = details[slug as keyof typeof details] || [];
  const unique = new Map<string, {title: string, rows: string[][]}>();
  for (const record of records) {
    for (const rows of record.tables) unique.set(JSON.stringify(rows), {title: record.title, rows});
  }
  const headers = new Set(['Model', 'Specification', 'Technical Data', 'Color code', 'Color Name', 'Feature']);
  return Array.from(unique.values(), ({title, rows}) => {
    const hasHeader = headers.has(rows[0]?.[0]);
    return {title: unique.size > 1 ? title : '', columns: hasHeader ? rows[0] : ['Field', 'Published detail'], rows: hasHeader ? rows.slice(1) : rows};
  });
}

export const modelTermsZh:Record<string,string>={'Model':'型号','Color code':'原厂色号','Color name':'颜色名称','Color Name':'颜色名称','Specification':'规格','Thickness':'厚度','Roll size':'卷材尺寸','Technical Data':'技术项目','Performance':'资料值','Feature':'项目','Data':'资料值','Haze':'雾度','Key Application':'用途'};
Object.assign(modelTermsZh,{"Technical Data": "技术项目", "Product designation": "产品名称", "Release liner": "离型膜", "Installed film layer": "安装后保留的膜层", "Removable protective cover": "可移除保护层", "Adhesive grade": "胶黏剂牌号", "Adhesive coating thickness": "涂胶厚度", "Dry adhesive weight": "干胶重量", "Weight per roll": "每卷重量", "Base Material": "基材", "Adhesive": "胶黏剂", "Country of Origin": "产地", "Elongation": "伸长率", "Finish": "表面质感", "HS Code": "海关编码", "Heat Rejection (IRR)": "红外阻隔率（IRR）", "Infrared Rejection (IRR)": "红外阻隔率（IRR）", "Material": "材料", "Operating Temp": "工作温度", "Roll Size": "卷材尺寸", "Size": "尺寸", "Tensile Strength": "拉伸强度", "UV Block (UVR)": "紫外线阻隔率（UVR）", "UV Rejection (UVR)": "紫外线阻隔率（UVR）", "Visible Light Transmission": "可见光透过率", "Warranty": "原资料质保说明", "Weight": "重量", "Film Type": "膜材类型", "Technology": "工艺", "Integrated Co-Extruded Embedded Coating": "一体共挤内嵌涂层", "Premium Aliphatic TPU": "脂肪族 TPU", "TPU (Thermoplastic Polyurethane)": "TPU（热塑性聚氨酯）", "50 µm double-matte PET clear film": "50 µm 双哑透明 PET 膜", "50 µm double-matte PET, suitable for fine matte spray coating": "50 µm 双哑 PET，适用于细哑光喷涂", "50 µm clear PET clear film": "50 µm 透明 PET 膜", "50 µm double-matte PET release liner": "50 µm 双哑 PET 离型膜", "50 µm clear PET release liner": "50 µm 透明 PET 离型膜", "0.15 mm (150 µm) water-clear PVC": "0.15 mm（150 µm）高透明 PVC", "0.10 mm (100 µm) water-clear PVC": "0.10 mm（100 µm）高透明 PVC", "0.10 mm (100 µm) clear double-matte film": "0.10 mm（100 µm）双哑透明膜", "60 µm low-tack PVC protective cover": "60 µm 低黏 PVC 保护层", "23 µm low-tack PE protective cover": "23 µm 低黏 PE 保护层", "None": "无", "2.8 tiao": "2.8 条（原表单位）", "2.5 tiao": "2.5 条（原表单位）", "Field": "项目", "Published detail": "原资料值"});
