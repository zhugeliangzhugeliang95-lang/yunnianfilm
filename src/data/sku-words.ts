import type {Locale} from '../locales/languages';

type Names = Record<Exclude<Locale, 'en'>, string> & {en?: string};

// Keys are the original option values. The Chinese column follows the printed name
// where available. Keep the English source key for ordering, even when the photo
// and storefront describe the color differently.
const names: Record<string, Names> = {
  // Classic TPU
  "Metallic Dark Green": {zh: "金属墨绿", es: "Verde oscuro metalizado", fr: "Vert foncé métallisé", ar: "أخضر داكن معدني"},
  "Silver Fox Gray": {zh: "银狐灰", es: "Gris zorro plateado", fr: "Gris renard argenté", ar: "رمادي الثعلب الفضي"},
  "Metallic Glacier Blue": {zh: "金属漆冰川蓝", es: "Azul glaciar metalizado", fr: "Bleu glacier métallisé", ar: "أزرق جليدي معدني"},
  "Royal Indigo": {zh: "皇家靛蓝", es: "Índigo real", fr: "Indigo royal", ar: "نيلي ملكي"},
  "Eve Purple": {zh: "夏娃紫", es: "Violeta Eva", fr: "Violet Ève", ar: "بنفسجي حوّاء"},
  "Midsummer Purple": {zh: "仲夏紫", es: "Violeta de verano", fr: "Violet de la mi-été", ar: "بنفسجي منتصف الصيف"},
  "Brooklyn Gray": {zh: "金属布鲁克林灰（宝马）", es: "Gris Brooklyn", fr: "Gris Brooklyn", ar: "رمادي بروكلين"},
  "Metallic Fog Blue": {zh: "金属雾蓝", es: "Azul niebla metalizado", fr: "Bleu brume métallisé", ar: "أزرق ضبابي معدني"},
  "Rouge Pearl Pink": {zh: "胭脂珍珠粉", es: "Rosa rubor perlado", fr: "Rose fard nacré", ar: "وردي مورّد لؤلؤي"},
  "Golden Champagne": {zh: "原厂香槟金", es: "Dorado champán", fr: "Or champagne", ar: "ذهبي شامبانيا"},
  "Soapstone Gray": {zh: "滑石灰", es: "Gris esteatita", fr: "Gris stéatite", ar: "رمادي الحجر الصابوني"},
  "Crimson": {zh: "绯红色", es: "Carmesí", fr: "Rouge cramoisi", ar: "أحمر قرمزي"},
  "Polaris Australis Blue": {zh: "南极星蓝", es: "Azul estrella polar austral", fr: "Bleu de l’Étoile polaire australe", ar: "أزرق نجم القطب الجنوبي"},
  "Tanzanite Blue": {zh: "丹泉石蓝", es: "Azul tanzanita", fr: "Bleu tanzanite", ar: "أزرق التنزانيت"},
  "Graphite Gray": {zh: "亮石墨灰", es: "Gris grafito", fr: "Gris graphite", ar: "رمادي غرافيتي"},
  "Passion Pink": {zh: "激情粉", es: "Rosa pasión", fr: "Rose passion", ar: "وردي الشغف"},
  "Carbon Grey Black": {zh: "碳灰蓝", es: "Negro gris carbón", fr: "Noir gris carbone", ar: "أسود مائل إلى الرمادي الكربوني"},
  "Blue Crystal Black": {zh: "蓝晶黑", es: "Negro cristal azul", fr: "Noir cristal bleu", ar: "أسود الكريستال الأزرق"},
  "Porsche Aventurine Green": {zh: "保时捷砂金石绿", es: "Verde aventurina Porsche", fr: "Vert aventurine Porsche", ar: "أخضر الأفنتورين من بورشه"},
  "Endless Mountain Green": {zh: "千山翠", es: "Verde cordillera infinita", fr: "Vert des montagnes à perte de vue", ar: "أخضر الجبال الممتدة"},
  "Coffee Beige Metallic": {zh: "默咖米", es: "Beige café metalizado", fr: "Beige café métallisé", ar: "بيج قهوي معدني"},
  "Pearl Bloom Pink": {zh: "妃子笑", es: "Rosa flor perlada", fr: "Rose fleur nacrée", ar: "وردي الزهر اللؤلؤي"},
  "GT Silver": {zh: "GT银", es: "Plata GT", fr: "Argent GT", ar: "فضي GT"},
  "Radiant Purple": {zh: "霞光紫", es: "Violeta radiante", fr: "Violet éclatant", ar: "بنفسجي مشرق"},
  "Blast Blue Purple": {zh: "爆炸紫", es: "Violeta azulado intenso", fr: "Violet bleuté intense", ar: "بنفسجي مزرقّ زاهٍ"},
  "Paint Pearl Grape Purple": {zh: "漆面珍珠葡萄紫", es: "Violeta uva perlado efecto pintura", fr: "Violet raisin nacré effet peinture", ar: "بنفسجي عنبي لؤلؤي بتأثير الطلاء"},
  "Hardlin Green": {zh: "哈德林绿", es: "Verde Hardlin", fr: "Vert Hardlin", ar: "أخضر هاردلين"},
  "Akha Gold": {zh: "阿卡金", es: "Dorado Akha", fr: "Or Akha", ar: "ذهبي أكا"},
  "Satin Metallic Glossy Black Rose": {zh: "金属黑玫瑰", es: "Rosa negra metalizada satinada con reflejos brillantes", fr: "Rose noire métallisée satinée aux reflets brillants", ar: "وردي الورد الأسود المعدني الساتاني بلمعة"},
  "Satin Metallic Glossy Orange": {zh: "烈焰橙", es: "Naranja metalizado satinado con reflejos brillantes", fr: "Orange métallisé satiné aux reflets brillants", ar: "برتقالي معدني ساتاني بلمعة"},
  "Satin Metallic Glossy Black": {zh: "金属黑", es: "Negro metalizado satinado con reflejos brillantes", fr: "Noir métallisé satiné aux reflets brillants", ar: "أسود معدني ساتاني بلمعة"},
  "Satin Metallic Glossy BlueBerry": {zh: "金属蓝莓", es: "Arándano metalizado satinado con reflejos brillantes", fr: "Bleu myrtille métallisé satiné aux reflets brillants", ar: "أزرق التوت المعدني الساتاني بلمعة"},
  "Metallic Glossy White": {zh: "雪山白", es: "Blanco metalizado brillante", fr: "Blanc métallisé brillant", ar: "أبيض معدني لامع"},
  "Maple Leaf Yellow": {zh: "枫叶黄", es: "Amarillo hoja de arce", fr: "Jaune feuille d’érable", ar: "أصفر أوراق القيقب"},
  "Satin Metallic Glossy Blackish Green": {zh: "金属祖母石绿", es: "Verde negruzco metalizado satinado con reflejos brillantes", fr: "Vert noir métallisé satiné aux reflets brillants", ar: "أخضر مسوّد معدني ساتاني بلمعة"},
  "Parrot Green": {zh: "鹦鹉绿", es: "Verde loro", fr: "Vert perroquet", ar: "أخضر ببغائي"},
  "Ryan Green": {zh: "莱恩绿", es: "Verde Ryan", fr: "Vert Ryan", ar: "أخضر رايان"},
  "Satin Metallic Glossy Ice Berry": {zh: "保时捷冰莓粉", es: "Rosa baya helada metalizado satinado con reflejos brillantes", fr: "Rose baie givrée métallisé satiné aux reflets brillants", ar: "وردي التوت المثلّج المعدني الساتاني بلمعة"},
  "Satin Metallic Glossy Champagne": {zh: "金属香槟金", es: "Champán metalizado satinado con reflejos brillantes", fr: "Champagne métallisé satiné aux reflets brillants", ar: "شامبانيا معدني ساتاني بلمعة"},
  "Metallic Glossy Chrome Black": {zh: "金属钨钢", es: "Negro cromo metalizado brillante", fr: "Noir chrome métallisé brillant", ar: "أسود كرومي معدني لامع"},
  "Satin Metallic Glossy Coal Grey": {zh: "宾利煤炭灰", es: "Gris carbón metalizado satinado con reflejos brillantes", fr: "Gris charbon métallisé satiné aux reflets brillants", ar: "رمادي فحمي معدني ساتاني بلمعة"},
  "Metallic Glossy Benz Blackish Green": {zh: "奔驰祖母石绿", es: "Verde negruzco Benz metalizado brillante", fr: "Vert noir Benz métallisé brillant", ar: "أخضر مسوّد معدني لامع من بنز"},
  "Paint Metallic Soul Red": {zh: "漆面魂动红", es: "Rojo Soul Red metalizado efecto pintura", fr: "Rouge Soul Red métallisé effet peinture", ar: "أحمر سول رِد معدني بتأثير الطلاء"},
  "Paint Metallic Midnight Purple": {zh: "金属午夜紫", es: "Violeta medianoche metalizado efecto pintura", fr: "Violet de minuit métallisé effet peinture", ar: "بنفسجي منتصف الليل المعدني بتأثير الطلاء"},
  "Starry Grey Wraith": {zh: "星空灰魅影", es: "Gris espectro estrellado", fr: "Gris spectre étoilé", ar: "رمادي الطيف المرصّع بالنجوم"},

  // Chameleon window shades
  "Ocean Blue": {zh: "海洋蓝", es: "Azul océano", fr: "Bleu océan", ar: "أزرق المحيط"},
  "Royal Purple": {zh: "皇家紫", es: "Púrpura real", fr: "Violet royal", ar: "بنفسجي ملكي"},
  "Flame Red": {zh: "火焰红", es: "Rojo llama", fr: "Rouge flamme", ar: "أحمر اللهب"},
  "Flame Rose Red": {zh: "火焰玫红", es: "Rojo rosa llama", fr: "Rouge rose flamme", ar: "أحمر وردي لهبي"},
  "Aurora Green": {zh: "极光绿", es: "Verde aurora", fr: "Vert aurore", ar: "أخضر الشفق القطبي"},
  "Blue Enchantress": {zh: "蓝色妖姬", es: "Azul hechicera", fr: "Bleu enchanteresse", ar: "أزرق الساحرة"},
  "Deep Sea Blue": {zh: "深海蓝", es: "Azul de aguas profundas", fr: "Bleu des profondeurs", ar: "أزرق أعماق البحر"},
  "Sunset Red": {zh: "落日红", es: "Rojo atardecer", fr: "Rouge couchant", ar: "أحمر الغروب"},
  "Violet 6099": {zh: "紫罗兰 6099", es: "Violeta 6099", fr: "Violet 6099", ar: "بنفسجي 6099"},

  // Liquid metal and iridescent TPU
  "Liquid Metal Aluminum Silver": {zh: "液态金属铝水银", es: "Plata aluminio de metal líquido", fr: "Argent aluminium effet métal liquide", ar: "فضي ألمنيومي بتأثير المعدن السائل"},
  "Liquid Metal Dragon Blood Red": {zh: "液态金属龙血红", es: "Rojo sangre de dragón de metal líquido", fr: "Rouge sang de dragon effet métal liquide", ar: "أحمر دم التنين بتأثير المعدن السائل"},
  "Liquid Metal Gunsmoke Grey": {zh: "液态金属枪灰", es: "Gris humo de pólvora de metal líquido", fr: "Gris fumée de poudre effet métal liquide", ar: "رمادي دخان البارود بتأثير المعدن السائل"},
  "Liquid Metal Silver": {zh: "液态金属银", es: "Plata de metal líquido", fr: "Argent effet métal liquide", ar: "فضي بتأثير المعدن السائل"},
  "Liquid Metal Violet": {zh: "维奥拉紫", es: "Violeta de metal líquido", fr: "Violet effet métal liquide", ar: "بنفسجي بتأثير المعدن السائل"},
  "Liquid Metal Coffee": {zh: "液态金属咖", es: "Café de metal líquido", fr: "Brun café effet métal liquide", ar: "بني قهوي بتأثير المعدن السائل"},
  "Liquid Shadow Gold": {zh: "液态暗影金", es: "Dorado sombra líquida", fr: "Or ombre liquide", ar: "ذهبي الظل السائل"},
  "Liquid Metal Interstellar Blue": {zh: "液态金属星际蓝", es: "Azul interestelar de metal líquido", fr: "Bleu interstellaire effet métal liquide", ar: "أزرق بين نجمي بتأثير المعدن السائل"},
  "Liquid Metal Mousse White": {zh: "液态金属慕斯白", es: "Blanco mousse de metal líquido", fr: "Blanc mousse effet métal liquide", ar: "أبيض الموس بتأثير المعدن السائل"},
  "Liquid Metal Cherry Red": {zh: "液态金属樱桃红", es: "Rojo cereza de metal líquido", fr: "Rouge cerise effet métal liquide", ar: "أحمر كرزي بتأثير المعدن السائل"},
  "Glossy Aurora White": {zh: "亮曙光白", es: "Blanco aurora brillante", fr: "Blanc aurore brillant", ar: "أبيض الشفق اللامع"},
  "Lake Blue Pink": {zh: "湖蓝魅粉", es: "Azul lago con reflejos rosas", fr: "Bleu lac aux reflets roses", ar: "أزرق البحيرة بانعكاسات وردية"},
  "Magic Gold Green": {zh: "幻彩金绿", es: "Verde dorado iridiscente", fr: "Vert doré irisé", ar: "أخضر ذهبي متقزّح"},
  "Magic Gold Lemon Yellow": {zh: "幻彩荧光黄", es: "Amarillo limón dorado iridiscente", fr: "Jaune citron doré irisé", ar: "أصفر ليموني ذهبي متقزّح"},
  "Magic Candy Flip Grey Blue": {zh: "梦幻灰魅蓝", es: "Gris azulado con efecto tornasol caramelo", fr: "Gris aux reflets bleus, effet candy irisé", ar: "رمادي بانعكاسات زرقاء متقزّحة بتأثير الحلوى"},
  "Magic Candy Color Flip Volcano Grey": {zh: "梦幻火山灰", es: "Gris volcánico con efecto tornasol caramelo", fr: "Gris volcanique effet candy irisé", ar: "رمادي بركاني متقزّح بتأثير الحلوى"},
  "Magic Candy Flip Grey Purple": {zh: "魔幻灰魅紫", es: "Gris con reflejos violetas y efecto tornasol caramelo", fr: "Gris aux reflets violets, effet candy irisé", ar: "رمادي بانعكاسات بنفسجية متقزّحة بتأثير الحلوى"},
  "Magic Candy Flip Grey Green": {zh: "梦幻灰魅绿", es: "Gris con reflejos verdes y efecto tornasol caramelo", fr: "Gris aux reflets verts, effet candy irisé", ar: "رمادي بانعكاسات خضراء متقزّحة بتأثير الحلوى"},
  "Magic Candy Color Flip Rouge Pink": {zh: "梦幻胭脂粉", es: "Rosa rubor con efecto tornasol caramelo", fr: "Rose fard effet candy irisé", ar: "وردي مورّد متقزّح بتأثير الحلوى"},
  "Magic Candy Flip Silver Purple": {zh: "梦幻银幻紫", es: "Plata con reflejos violetas y efecto tornasol caramelo", fr: "Argent aux reflets violets, effet candy irisé", ar: "فضي بانعكاسات بنفسجية متقزّحة بتأثير الحلوى"},
  "Gold White Pearlescent": {zh: "珠光幻彩金", es: "Blanco perlado con reflejos dorados", fr: "Blanc nacré aux reflets dorés", ar: "أبيض لؤلؤي بانعكاسات ذهبية"},
  "Light Blue Pearl": {zh: "珍珠幻彩蓝", es: "Azul claro perlado", fr: "Bleu clair nacré", ar: "أزرق فاتح لؤلؤي"},
  "Cream Red White Pearlescent": {zh: "珠光幻彩红", es: "Blanco crema perlado con reflejos rojos", fr: "Blanc crème nacré aux reflets rouges", ar: "أبيض كريمي لؤلؤي بانعكاسات حمراء"},
  "Gloss Blue Gold Color Shifting": {zh: "亮面蓝魅金", es: "Azul y dorado tornasol brillante", fr: "Bleu et or irisé brillant", ar: "أزرق وذهبي متغيّر اللون بلمعان"},
  "Diamond Crystal Black": {zh: "钻石黑", es: "Negro cristal diamante", fr: "Noir cristal diamant", ar: "أسود الكريستال الماسي"},
  "Diamond Crystal White": {zh: "钻石白", es: "Blanco cristal diamante", fr: "Blanc cristal diamant", ar: "أبيض الكريستال الماسي"},
  "Diamond Crystal White Gold": {zh: "钻石水晶白魅金", es: "Blanco cristal diamante con reflejos dorados", fr: "Blanc cristal diamant aux reflets dorés", ar: "أبيض كريستالي ماسي بانعكاسات ذهبية"},
  "Diamond Crystal White Blue": {zh: "钻石水晶白魅蓝", es: "Blanco cristal diamante con reflejos azules", fr: "Blanc cristal diamant aux reflets bleus", ar: "أبيض كريستالي ماسي بانعكاسات زرقاء"},

  // Gloss crystal TPU
  "Piano Black": {zh: "钢琴黑", es: "Negro piano", fr: "Noir piano", ar: "أسود البيانو"},
  "Piano White": {zh: "钢琴白", es: "Blanco piano", fr: "Blanc piano", ar: "أبيض البيانو"},
  "OOLONG Milk Tea Pink": {zh: "乌龙奶茶粉", es: "Rosa té oolong con leche", fr: "Rose thé oolong au lait", ar: "وردي شاي الأولونغ بالحليب"},
  "Mist Grey Purple": {zh: "迷雾灰紫", es: "Violeta gris niebla", fr: "Violet gris brume", ar: "بنفسجي رمادي ضبابي"},
  "Mist Purple": {zh: "雾霾紫", es: "Violeta bruma", fr: "Violet brume", ar: "بنفسجي ضبابي"},
  "Bay Blue": {zh: "海湾蓝", es: "Azul bahía", fr: "Bleu baie", ar: "أزرق الخليج"},
  "Racing Green": {zh: "赛车绿", es: "Verde de competición", fr: "Vert course", ar: "أخضر السباقات"},
  "Glossy Crystal Ferrari Red": {zh: "法拉利红", es: "Rojo Ferrari con brillo cristalino", fr: "Rouge Ferrari au brillant cristallin", ar: "أحمر فيراري بلمعان كريستالي"},
  "Glossy Crystal Volcanic Grey": {zh: "水晶火山灰", es: "Gris volcánico con brillo cristalino", fr: "Gris volcanique au brillant cristallin", ar: "رمادي بركاني بلمعان كريستالي"},
  "Glossy Crystal Nardo Grey": {zh: "奥迪 RS 纳多灰", es: "Gris Nardo con brillo cristalino", fr: "Gris Nardo au brillant cristallin", ar: "رمادي ناردو بلمعان كريستالي"},
  "Glossy Crystal Khaki": {zh: "水晶米兰卡其", es: "Caqui con brillo cristalino", fr: "Kaki au brillant cristallin", ar: "كاكي بلمعان كريستالي"},
  "Piano China Blue": {zh: "瓷器蓝", es: "Azul porcelana efecto piano", fr: "Bleu porcelaine effet laque piano", ar: "أزرق الخزف بلمعان البيانو"},
  "Glossy Crystal Glacier Blue": {zh: "宾利冰川蓝", es: "Azul glaciar con brillo cristalino", fr: "Bleu glacier au brillant cristallin", ar: "أزرق جليدي بلمعان كريستالي"},
  "Glossy Crystal Khaki Grey": {zh: "水晶卡其灰", es: "Gris caqui con brillo cristalino", fr: "Gris kaki au brillant cristallin", ar: "رمادي كاكي بلمعان كريستالي"},
  "Porsche Grey": {zh: "保时捷亚灰", es: "Gris Porsche", fr: "Gris Porsche", ar: "رمادي بورشه"},
  "Battle Green": {zh: "战斗绿", es: "Verde combate", fr: "Vert combat", ar: "أخضر قتالي"},
  "Rouge Pink": {zh: "胭脂粉", es: "Rosa rubor", fr: "Rose fard", ar: "وردي مورّد"},
  "Porsche Lava Orange": {zh: "保时捷熔岩橙", es: "Naranja lava Porsche", fr: "Orange lave Porsche", ar: "برتقالي الحمم من بورشه"},
  "Beetroot Red": {zh: "甜菜根紫", es: "Rojo remolacha", fr: "Rouge betterave", ar: "أحمر الشمندر"},
  "Cement Grey": {zh: "水泥灰", es: "Gris cemento", fr: "Gris ciment", ar: "رمادي إسمنتي"},
  "Sky Mirror Pink": {zh: "镜空粉", es: "Rosa espejo del cielo", fr: "Rose miroir du ciel", ar: "وردي مرآة السماء"},
  "Pearl Pink": {zh: "贝壳粉", es: "Rosa perlado", fr: "Rose nacré", ar: "وردي لؤلؤي"},
  "Sapphire Blue": {zh: "宝石蓝", es: "Azul zafiro", fr: "Bleu saphir", ar: "أزرق ياقوتي"},
  "Glossy Black": {zh: "亮黑", es: "Negro brillante", fr: "Noir brillant", ar: "أسود لامع"},
  "Glossy White": {zh: "亮白", es: "Blanco brillante", fr: "Blanc brillant", ar: "أبيض لامع"},

  // Textures, glass and individual optical finishes
  "TPU Transparent Carbon Fiber": {zh: "TPU 透明碳纤纹", es: "TPU con trama de carbono transparente", fr: "TPU à trame carbone transparente", ar: "TPU شفاف بنقشة ألياف الكربون"},
  "TPU Carbon Fiber Black": {zh: "TPU 碳纤黑", es: "TPU negro con trama de carbono", fr: "TPU noir à trame carbone", ar: "TPU أسود بنقشة ألياف الكربون"},
  "TPU Matte Carbon Fiber Black": {zh: "TPU 哑面碳纤黑", es: "TPU negro mate con trama de carbono", fr: "TPU noir mat à trame carbone", ar: "TPU أسود مطفأ بنقشة ألياف الكربون"},
  "TPU Solid Carbon Fiber Black": {zh: "TPU 立体碳纤黑", es: "TPU negro con trama de carbono en relieve", fr: "TPU noir à trame carbone en relief", ar: "TPU أسود بنقشة ألياف الكربون البارزة"},
  "TPU Gloss Ghost Aircraft": {zh: "TPU 亮面飞机纹", es: "TPU brillante con motivo de avión fantasma", fr: "TPU brillant à motif d’avion fantôme", ar: "TPU لامع بنقشة الطائرة الشبح"},
  "TPU Gloss Forged Carbon Universe": {zh: "TPU 亮面锻造碳纹元宇宙", es: "TPU brillante con motivo Universo de carbono forjado", fr: "TPU brillant à motif Univers en carbone forgé", ar: "TPU لامع بنقشة الكون من الكربون المطروق"},
  "TPU Gloss Hexagonal Carbon Fiber": {zh: "TPU 亮面六边形碳纤纹", es: "TPU brillante con trama de carbono hexagonal", fr: "TPU brillant à trame carbone hexagonale", ar: "TPU لامع بنقشة ألياف الكربون السداسية"},
  "TPU Forged Carbon Red": {zh: "TPU 花碳红", es: "TPU rojo efecto carbono forjado", fr: "TPU rouge effet carbone forgé", ar: "TPU أحمر بتأثير الكربون المطروق"},
  "TPU White to Purple": {zh: "TPU 白变紫", es: "TPU de blanco a violeta", fr: "TPU du blanc au violet", ar: "TPU يتحوّل من الأبيض إلى البنفسجي"},
  "TPU White to Black": {zh: "TPU 白变黑", es: "TPU de blanco a negro", fr: "TPU du blanc au noir", ar: "TPU يتحوّل من الأبيض إلى الأسود"},
  "Phantom Rose (Chameleon)": {zh: "幻影玫瑰（变色龙）", es: "Rosa fantasma (camaleón)", fr: "Rose fantôme (caméléon)", ar: "وردي شبحي (حربائي)"},
  "Purple Aurora (Chameleon)": {zh: "极光紫（变色龙）", es: "Violeta aurora (camaleón)", fr: "Violet aurore (caméléon)", ar: "بنفسجي الشفق (حربائي)"},
  "Crystal Clear (High Definition)": {zh: "晶透（高清）", es: "Transparente cristalino (alta definición)", fr: "Transparent cristallin (haute définition)", ar: "شفاف كريستالي (عالي الوضوح)"},
  "Silver color family": {zh: "银色系", es: "Gama de plateados", fr: "Tons argentés", ar: "درجات الفضي"},
  "Purple color family": {zh: "紫色系", es: "Gama de violetas", fr: "Tons violets", ar: "درجات البنفسجي"},
  "Pink color family": {zh: "粉色系", es: "Gama de rosas", fr: "Tons roses", ar: "درجات الوردي"},
  "Gold color family": {zh: "金色系", es: "Gama de dorados", fr: "Tons dorés", ar: "درجات الذهبي"},
  "Red color family": {zh: "红色系", es: "Gama de rojos", fr: "Tons rouges", ar: "درجات الأحمر"},
  "Blue color family": {zh: "蓝色系", es: "Gama de azules", fr: "Tons bleus", ar: "درجات الأزرق"},
  "Green color family": {zh: "绿色系", es: "Gama de verdes", fr: "Tons verts", ar: "درجات الأخضر"},
  "White laser finish": {zh: "镭射白", es: "Blanco efecto láser", fr: "Blanc effet laser", ar: "أبيض بتأثير الليزر"},
  "Black laser finish": {zh: "镭射黑", es: "Negro efecto láser", fr: "Noir effet laser", ar: "أسود بتأثير الليزر"},
  "Gray laser finish": {zh: "镭射灰", es: "Gris efecto láser", fr: "Gris effet laser", ar: "رمادي بتأثير الليزر"},
  "Silver laser finish": {zh: "镭射银", es: "Plata efecto láser", fr: "Argent effet laser", ar: "فضي بتأثير الليزر"},
  "Silver chrome finish": {zh: "电镀银", es: "Plata cromada", fr: "Argent chromé", ar: "فضي كرومي"},
  "Red chrome finish": {zh: "电镀红", es: "Rojo cromado", fr: "Rouge chromé", ar: "أحمر كرومي"},
  "Blue chrome finish": {zh: "电镀蓝", es: "Azul cromado", fr: "Bleu chromé", ar: "أزرق كرومي"},
  "Green chrome finish": {zh: "电镀绿", es: "Verde cromado", fr: "Vert chromé", ar: "أخضر كرومي"},
  "Gold chrome finish": {zh: "电镀金", es: "Dorado cromado", fr: "Or chromé", ar: "ذهبي كرومي"},
  "Grey": {zh: "灰色", es: "Gris", fr: "Gris", ar: "رمادي"},
  "Blue": {zh: "蓝色", es: "Azul", fr: "Bleu", ar: "أزرق"},

  // PET OEM wrap chart
  "Midnight Blue": {zh: "午夜蓝", es: "Azul medianoche", fr: "Bleu de minuit", ar: "أزرق منتصف الليل"},
  "Midnight British Green": {zh: "午夜英伦绿", es: "Verde británico de medianoche", fr: "Vert britannique de minuit", ar: "أخضر بريطاني ليلي"},
  "Dorota Purple": {zh: "多萝塔紫", es: "Violeta Dorota", fr: "Violet Dorota", ar: "بنفسجي دوروتا"},
  "Galaxy Flash Purple": {zh: "星河闪紫", es: "Violeta destello galáctico", fr: "Violet éclat galactique", ar: "بنفسجي وميض المجرّة"},
  "Super Glossy Flame Orange": {zh: "超亮火焰橙", es: "Naranja llama ultrabrillante", fr: "Orange flamme ultra-brillant", ar: "برتقالي لهبي فائق اللمعان"},
  "Havana Black": {zh: "哈瓦那黑", es: "Negro Habana", fr: "Noir La Havane", ar: "أسود هافانا"},
  "Negroni Purple": {zh: "内格罗尼紫", es: "Violeta Negroni", fr: "Violet Negroni", ar: "بنفسجي نيغروني"},
  "Twilight Purple": {zh: "暮光紫", es: "Violeta crepúsculo", fr: "Violet crépuscule", ar: "بنفسجي الشفق"},
  "Vector Silver": {zh: "矢量银", es: "Plata vectorial", fr: "Argent vectoriel", ar: "فضي فيكتور"},
  "X Green": {zh: "X 绿", es: "Verde X", fr: "Vert X", ar: "أخضر X"},
  "Water Gloss Purple (Flowing Purple)": {zh: "水光紫（流光紫）", es: "Violeta brillo de agua (violeta fluido)", fr: "Violet reflet d’eau (violet fluide)", ar: "بنفسجي بلمعة الماء (بنفسجي انسيابي)"},
  "Lucia Purple": {zh: "露西亚紫", es: "Violeta Lucia", fr: "Violet Lucia", ar: "بنفسجي لوسيا"},
  "Velvet Flower Purple": {zh: "丝绒花紫", es: "Violeta flor de terciopelo", fr: "Violet fleur de velours", ar: "بنفسجي الزهرة المخملية"},
  "Lion Green": {zh: "雄狮绿", es: "Verde león", fr: "Vert lion", ar: "أخضر الأسد"},
  "Rubellite Purple": {zh: "碧玺紫", es: "Violeta rubelita", fr: "Violet rubellite", ar: "بنفسجي الروبيليت"},
  "Glazed Tower Red": {zh: "琉璃塔红", es: "Rojo torre esmaltada", fr: "Rouge tour émaillée", ar: "أحمر البرج المزجّج"},
  "Victoria Purple": {zh: "维多利亚紫", es: "Violeta Victoria", fr: "Violet Victoria", ar: "بنفسجي فيكتوريا"},
  "Heavy Metal Graphite Black Gloss": {zh: "重金属亮面石墨黑", es: "Negro grafito brillante efecto metal pesado", fr: "Noir graphite brillant effet métal lourd", ar: "أسود غرافيتي لامع بتأثير المعدن الثقيل"},
  "Heavy Metal Graphite Gray Gloss": {zh: "重金属亮面石墨灰", es: "Gris grafito brillante efecto metal pesado", fr: "Gris graphite brillant effet métal lourd", ar: "رمادي غرافيتي لامع بتأثير المعدن الثقيل"},
  "Francesca Green (Ferrari)": {zh: "弗朗西斯卡绿（法拉利）", es: "Verde Francesca (Ferrari)", fr: "Vert Francesca (Ferrari)", ar: "أخضر فرانشيسكا (فيراري)"},
  "Interstellar Green (XPeng P7)": {zh: "星际绿（小鹏 P7）", es: "Verde interestelar (XPeng P7)", fr: "Vert interstellaire (XPeng P7)", ar: "أخضر بين نجمي (XPeng P7)"},
  "Guanshan Green (Buick)": {zh: "关山绿（别克）", es: "Verde Guanshan (Buick)", fr: "Vert Guanshan (Buick)", ar: "أخضر غوانشان (بويك)"},
  "Soul Red (Mazda)": {zh: "魂动红（马自达）", es: "Rojo Soul Red (Mazda)", fr: "Rouge Soul Red (Mazda)", ar: "أحمر سول رِد (مازدا)"},

  // Named window film models: numeric references are part of each name
  "Three Silver Xuanyuan Purple 7295": {zh: "三银轩辕紫 7295", es: "Violeta Xuanyuan de triple plata 7295", fr: "Violet Xuanyuan triple argent 7295", ar: "بنفسجي شوان يوان بالفضة الثلاثية 7295"},
  "Three Silver Emperor Purple 7094": {zh: "三银帝王紫 7094", es: "Violeta imperial de triple plata 7094", fr: "Violet impérial triple argent 7094", ar: "بنفسجي إمبراطوري بالفضة الثلاثية 7094"},
  "Three Silver Emperor Blue 5890": {zh: "三银帝王蓝 5890", es: "Azul imperial de triple plata 5890", fr: "Bleu impérial triple argent 5890", ar: "أزرق إمبراطوري بالفضة الثلاثية 5890"},
  "Diamond Laser White": {zh: "七彩镭射白", es: "Blanco láser diamante", fr: "Blanc laser diamant", ar: "أبيض بتأثير الليزر الماسي"},
  "Diamond Laser Silver": {zh: "七彩镭射银", es: "Plata láser diamante", fr: "Argent laser diamant", ar: "فضي بتأثير الليزر الماسي"},
  "Diamond Laser Black": {zh: "七彩镭射黑", es: "Negro láser diamante", fr: "Noir laser diamant", ar: "أسود بتأثير الليزر الماسي"},
  "Space Armor U75 - 7.5mil": {zh: "太空装甲 U75 · 7.5 mil", es: "Space Armor U75 · 7,5 mil", fr: "Space Armor U75 · 7,5 mil", ar: "سبيس آرمور U75 · 7.5 mil"},
  "Space Armor U90 - 9.0mil": {zh: "太空装甲 U90 · 9.0 mil", es: "Space Armor U90 · 9,0 mil", fr: "Space Armor U90 · 9,0 mil", ar: "سبيس آرمور U90 · 9.0 mil"},
  "9980恒色风光": {zh: "9980 恒色风光", es: "9980 Paisaje de color permanente", fr: "9980 Paysage aux couleurs durables", ar: "9980 مشهد ثابت الألوان", en: "9980 Colorfast Landscape"},
  "9902蓝色魔力": {zh: "9902 蓝色魔力", es: "9902 Magia azul", fr: "9902 Magie bleue", ar: "9902 سحر الأزرق", en: "9902 Blue Magic"},
  "8035魅力沙龙": {zh: "8035 魅力沙龙", es: "8035 Salón de encanto", fr: "8035 Salon de charme", ar: "8035 صالون الأناقة", en: "8035 Salon of Charm"},
  "9920黑衣骑士": {zh: "9920 黑衣骑士", es: "9920 Caballero de negro", fr: "9920 Chevalier en noir", ar: "9920 الفارس بالأسود", en: "9920 Knight in Black"},
  "9921黑马王子": {zh: "9921 黑马王子", es: "9921 Príncipe del caballo negro", fr: "9921 Prince au cheval noir", ar: "9921 أمير الحصان الأسود", en: "9921 Black Horse Prince"},

  // Archive finish descriptions
  "Dynamic Satin/Gloss Transition": {zh: "缎光与亮光动态切换", es: "Transición dinámica de satinado a brillante", fr: "Transition dynamique du satiné au brillant", ar: "انتقال متغيّر بين الساتاني واللامع"},
  "Liquid Metal Metallic": {zh: "液态金属质感", es: "Acabado de metal líquido", fr: "Finition effet métal liquide", ar: "تشطيب بتأثير المعدن السائل"},
  "Pearlescent / Candy Flip / Color Shifting": {zh: "珠光 / 糖果幻彩 / 变色", es: "Perlado / tornasol caramelo / cambio de color", fr: "Nacré / candy irisé / couleur changeante", ar: "لؤلؤي / متقزّح بتأثير الحلوى / متغيّر اللون"},
  "Diamond Laser Series": {zh: "钻石镭射系列", es: "Serie láser diamante", fr: "Série laser diamant", ar: "سلسلة الليزر الماسي"},
  "Diamond Crystal Series": {zh: "钻石水晶系列", es: "Serie cristal diamante", fr: "Série cristal diamant", ar: "سلسلة الكريستال الماسي"},
  "High Gloss Crystal": {zh: "水晶高亮", es: "Brillo cristalino intenso", fr: "Finition cristal haute brillance", ar: "لمعان كريستالي فائق"},
  "High Gloss / Satin Metallic / Paint (varies by color)": {zh: "高亮 / 缎面金属 / 漆面（依具体颜色而定）", es: "Alto brillo / metalizado satinado / efecto pintura (según el color)", fr: "Haute brillance / métallisé satiné / effet peinture (selon la couleur)", ar: "شديد اللمعان / معدني ساتاني / تأثير الطلاء (بحسب اللون)"},
  "50 µm double-matte PET clear film": {zh: "50 µm 双面哑光透明 PET 膜", es: "Película de PET transparente de 50 µm, mate por ambas caras", fr: "Film PET transparent de 50 µm, mat sur les deux faces", ar: "فيلم PET شفاف بسماكة 50 µm ومطفأ على الوجهين"},
  "50 µm double-matte PET, suitable for fine matte spray coating": {zh: "50 µm 双面哑光 PET，适用于细哑光喷涂", es: "PET de 50 µm, mate por ambas caras, apto para un acabado mate fino aplicado por pulverización", fr: "PET de 50 µm mat sur les deux faces, adapté à la pulvérisation d’une finition mate fine", ar: "PET بسماكة 50 µm مطفأ على الوجهين ومناسب لرش طبقة مطفأة دقيقة"},
  "50 µm clear PET clear film": {zh: "50 µm 透明 PET 膜", es: "Película de PET transparente de 50 µm", fr: "Film PET transparent de 50 µm", ar: "فيلم PET شفاف بسماكة 50 µm"},
  "50 µm double-matte PET release liner": {zh: "50 µm 双面哑光 PET 离型膜", es: "Lámina antiadherente de PET de 50 µm, mate por ambas caras", fr: "Protecteur antiadhérent en PET de 50 µm, mat sur les deux faces", ar: "بطانة فصل من PET بسماكة 50 µm مطفأة على الوجهين"},
  "50 µm clear PET release liner": {zh: "50 µm 透明 PET 离型膜", es: "Lámina antiadherente de PET transparente de 50 µm", fr: "Protecteur antiadhérent en PET transparent de 50 µm", ar: "بطانة فصل من PET شفاف بسماكة 50 µm"},
  "0.15 mm (150 µm) water-clear PVC": {zh: "0.15 mm（150 µm）高透明 PVC", es: "PVC de transparencia cristalina de 0,15 mm (150 µm)", fr: "PVC parfaitement transparent de 0,15 mm (150 µm)", ar: "PVC فائق الشفافية بسماكة 0.15 mm (150 µm)"},
  "0.10 mm (100 µm) clear double-matte film": {zh: "0.10 mm（100 µm）双面哑光透明膜", es: "Película transparente de 0,10 mm (100 µm), mate por ambas caras", fr: "Film transparent de 0,10 mm (100 µm), mat sur les deux faces", ar: "فيلم شفاف بسماكة 0.10 mm (100 µm) مطفأ على الوجهين"},
  "0.10 mm (100 µm) water-clear PVC": {zh: "0.10 mm（100 µm）高透明 PVC", es: "PVC de transparencia cristalina de 0,10 mm (100 µm)", fr: "PVC parfaitement transparent de 0,10 mm (100 µm)", ar: "PVC فائق الشفافية بسماكة 0.10 mm (100 µm)"},

  // Gallery images and shared labels
  "Product overview": {zh: "产品概览", es: "Vista general del producto", fr: "Vue d’ensemble du produit", ar: "نظرة عامة على المنتج"},
  "Category illustration": {zh: "品类示意图", es: "Ilustración de la categoría", fr: "Illustration de la catégorie", ar: "رسم توضيحي لفئة المنتج"},
  "Silver-coated sunroof film illustration": {zh: "天窗镀银膜示意图", es: "Ilustración de la película plateada para el techo solar", fr: "Illustration du film argenté pour toit ouvrant", ar: "رسم توضيحي لفيلم فتحة السقف المطلي بالفضة"},
  "Shared series image": {zh: "系列共用图", es: "Imagen compartida de la serie", fr: "Photo commune à la série", ar: "صورة مشتركة لمنتجات السلسلة"},
};

const seriesImage: Record<Locale, string> = {
  zh: '系列图片', es: 'Imagen de la serie', fr: 'Photo de la série',
  ar: 'صورة السلسلة', en: 'Series image',
};
const clearFinishes: Record<string, Names> = {
  'Clear Gloss': {zh: '透明亮面', es: 'Transparente brillante', fr: 'Transparent brillant', ar: 'شفاف لامع'},
  'Matte': {zh: '哑光', es: 'Mate', fr: 'Mat', ar: 'مطفأ'},
};

// These Classic TPU photographs have a different printed Chinese name than the
// independent 404-card collection's entry with the same English title.
const printedChinese: Record<string, string> = {
  'Grey Violet': '迷迭香紫',
  'Amethyst': '紫水晶（劳斯莱斯）',
};

export function skuWord(value: string, locale: Locale): string | undefined {
  const key = value.trim();
  if (locale === 'zh' && Object.hasOwn(printedChinese, key)) return printedChinese[key];
  if (Object.hasOwn(names, key)) return names[key][locale] ?? key;

  const photo = /^Series image (\d+)$/.exec(key);
  if (photo) return seriesImage[locale] + ' ' + photo[1];

  const film = /^(\d+(?:\.\d+)?) mil — (Clear Gloss|Matte)$/.exec(key);
  if (film && locale !== 'en') {
    const thickness = locale === 'fr' || locale === 'es' ? film[1].replace('.', ',') : film[1];
    return thickness + ' mil — ' + clearFinishes[film[2]][locale];
  }
  if (/^(?=.*\d)[A-Z\d]+(?:-[A-Z\d]+)*$/.test(key) || /^\d+(?:\.\d+)? ?mil$/i.test(key)) return key;
  return undefined;
}
