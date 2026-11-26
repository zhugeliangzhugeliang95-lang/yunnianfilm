export const buyerGuide = {
  en: {
    series: 'Series', thickness: 'Listed thickness', details: 'Finish, coating or roll size',
    caption: 'Clear PPF series with published thicknesses',
    thicknessHeading: 'How thick is 7.5 mil PPF?',
    thicknessText: 'One mil is 25.4 microns (µm), so 7.5 mil is about 191 µm, or 0.19 mm. When comparing quotes, ask which layers the figure covers. A base film measurement and a measurement including the adhesive describe different assemblies.',
    materialGuide: 'Read about TPU and the layers that stay on the paint',
    rollHeading: 'How much film is in a roll?',
    rollText: 'A roll measuring 1.52 m × 15 m contains 22.8 m² before cutting. Start with your widest panel and check that the pattern fits across the roll. Use the cutting layout and allow for edges and offcuts when estimating how many panels one roll will cover.',
    reportsHeading: 'Test reports for a clear PPF sample',
    reportsText: 'SGS identifies the submitted material in these reports as TPU Paint Protection Film. Quote the report number when requesting the signed original, and confirm which sample or batch corresponds to your order.',
    reach: 'REACH SVHC screening', rohs: 'RoHS testing',
    checklist: 'Download the sample evaluation worksheet',
  },
  zh: {
    series: '车衣系列', thickness: '目录标示厚度', details: '质感、涂层或卷材尺寸',
    caption: '已公布膜厚的透明车衣系列',
    thicknessHeading: '7.5 mil 的车衣有多厚？',
    thicknessText: '1 mil 等于 25.4 微米，7.5 mil 约为 191 微米，即 0.19 毫米。对比两张报价单时，要看厚度包含哪些层。只测 TPU 基膜和连同胶层一起测，数值代表的结构不同。',
    materialGuide: '了解 TPU 基材，以及贴好车衣后哪些层留在漆面上',
    rollHeading: '一卷车衣有多少平方米？',
    rollText: '以 1.52 米宽、15 米长的卷材为例，开料前面积为 22.8 平方米。先用最宽的车身面板核对卷宽，再对照裁膜排版，预留包边和边角余料，就能估算一卷可贴哪些部位。',
    reportsHeading: '透明车衣样品检测报告',
    reportsText: '这两份 SGS 报告的送检样品名称均为 TPU Paint Protection Film。索取签署原件时可引用下列编号，并向业务人员核对报告样品与所采购型号、批次的对应关系。',
    reach: 'REACH 高度关注物质筛查', rohs: 'RoHS 检测',
    checklist: '下载车衣样品评估记录表',
  },
} as const;

export const clearFilmReports = [
  {kind: 'reach', number: 'CANAUTO26022882701', href: '/downloads/legacy/YUNNIAN-SGS-TPU-PPF-REACH-CANAUTO26022882701-display-copy.pdf'},
  {kind: 'rohs', number: 'TSNAUTO26003988001', href: '/downloads/legacy/YUNNIAN-SGS-TPU-PPF-RoHS-TSNAUTO26003988001-display-copy.pdf'},
] as const;
