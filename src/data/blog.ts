import sourceIndex from './journal-index.json';
export type BlogText = { en: string; zh: string };
export type BlogPost = {
  slug: string;
  category: BlogText;
  title: BlogText;
  excerpt: BlogText;
  image: string;
  readMinutes: number;
  sections: { heading: BlogText; body: BlogText }[];
  sources: { title: string; url: string }[];
};

// Reference articles explain general concepts, not tested performance of YUNNIAN products.
export const blogPosts: BlogPost[] = [
  {
    "slug": "tpu-color-ppf-and-pet-wraps",
    "category": {
      "en": "MATERIAL GUIDE",
      "zh": "材料选型"
    },
    "title": {
      "en": "TPU color PPF or a PET-series wrap?",
      "zh": "TPU 彩色车衣与 PET 改色膜，如何选？"
    },
    "excerpt": {
      "en": "Start with the application, read the film construction, then compare a physical sample.",
      "zh": "从用途开始，读懂膜材结构，再用实物样品确认颜色与施工适配。"
    },
    "image": "color-library.webp",
    "readMinutes": 3,
    "sections": [
      {
        "heading": {
          "en": "Start with what the project needs",
          "zh": "先明确项目需要什么"
        },
        "body": {
          "en": "A color change and paint protection are related goals, but they are not identical. The YUNNIAN catalog separates TPU color PPF from PET-series color wraps so that buyers can start with the intended application. A full-body project, an accent panel and a replacement section each deserve a clear brief before a material is shortlisted.",
          "zh": "改变车身颜色与保护漆面是相关但不同的需求。云辇将 TPU 彩色车衣和 PET 系列改色膜分开，帮助买家先按用途选型。全车改色、局部点缀与旧膜补片，关注的颜色一致性、覆盖范围和采购数量并不相同。先把项目目标说明白，再筛选材料。"
        }
      },
      {
        "heading": {
          "en": "A collection name is not a complete specification",
          "zh": "系列名称不等于完整结构"
        },
        "body": {
          "en": "The PET Tech listing in our store identifies its body-wrap material as PVC. The word PET in that collection name should therefore not be read as proof that the installed face film is entirely PET, or that it is TPU paint-protection film. Ask which polymer forms the face film, which layers are removable, and what the stated thickness includes.",
          "zh": "店铺中的 PET 科技改色系列，商品名称同时标示了 PVC 车身改色膜。因此，不能只凭“PET”名称，就认定最终留在车身上的基膜全部由 PET 构成，更不能把它直接当作 TPU 漆面保护膜。应确认基膜、胶层、可移除膜层，以及标示厚度包含哪些部分。"
        }
      },
      {
        "heading": {
          "en": "Compare samples under the same conditions",
          "zh": "用相同条件比较实物"
        },
        "body": {
          "en": "Use the online color model to develop a visual direction, then request a physical swatch for the exact series. View shortlisted colors side by side in daylight and workshop lighting, from more than one angle. Record the color code and finish. A screen rendering helps communicate an idea; it cannot establish an exact color match or the behavior of a particular roll.",
          "zh": "线上调色模型适合沟通视觉方向，正式选色仍应索取对应系列的实物色卡。在自然光与施工环境下并排观察，并从不同角度比较亮度、纹理和颜色变化。记录色号及表面质感，避免把屏幕效果当成准确色样，或据此推断某一卷产品的性能。"
        }
      },
      {
        "heading": {
          "en": "Turn the shortlist into a useful inquiry",
          "zh": "把意向变成可报价的需求"
        },
        "body": {
          "en": "Send the chosen series, color code, installation area and expected quantity together. Ask for roll dimensions, the thickness definition, installation guidance and written terms for that variant. Confirm sample availability before committing to a larger order. This makes the quotation easier to compare and gives the installer a consistent starting point.",
          "zh": "询价时同时提供系列、色号、施工部位和预计数量，并确认卷材尺寸、厚度口径、施工说明与书面条款。先确认样品供应及试贴安排，再讨论批量采购。这样既方便比较报价，也能让采购、施工与客户对同一款材料形成一致理解。"
        }
      }
    ],
    "sources": [
      {
        "title": "YUNNIAN 1688 store · product naming",
        "url": "https://yunnianfilms.1688.com/"
      },
      {
        "title": "Avery Dennison · vehicle wrapping and paint protection categories",
        "url": "https://graphics.averydennison.com/en/home/graphics-products/vehicle-wrapping-films.html"
      },
      {
        "title": "Avery Dennison · PVC wrapping-film construction example",
        "url": "https://graphics.averydennison.com/content/dam/averydennison/graphics/ap/en/Product-Data-Sheets/Vehicle_Wrapping_Materials/swf/pds-swf-diamond-ea-rs-ap-en.pdf"
      }
    ]
  },
  {
    "slug": "understanding-uv-vlt-tser",
    "category": {
      "en": "WINDOW FILM",
      "zh": "窗膜知识"
    },
    "title": {
      "en": "UV, VLT and TSER: three numbers, three questions.",
      "zh": "UV、VLT、TSER：三个参数，回答三个问题。"
    },
    "excerpt": {
      "en": "Separate ultraviolet rejection, visible light and solar heat before comparing window films.",
      "zh": "先区分紫外线阻隔、可见光透过与太阳能隔热，再比较窗膜。"
    },
    "image": "window-film.webp",
    "readMinutes": 3,
    "sections": [
      {
        "heading": {
          "en": "UV rejection describes ultraviolet transmission",
          "zh": "UV 阻隔率看紫外线"
        },
        "body": {
          "en": "UV rejection describes the share of incident ultraviolet radiation prevented from passing through the tested glass-and-film system. It does not describe how much visible light passes through, or how much total solar heat is rejected. For a product comparison, ask for the measured wavelength range and the test method alongside the percentage, rather than treating a large headline number as a complete specification.",
          "zh": "UV 阻隔率描述被测试的玻璃与膜组合阻挡了多少入射紫外线。它不等于可见光透过率，也不等于全部太阳能的隔热表现。比较产品时，除了百分比，还应索取测试波段、方法及对应型号，避免只凭一个醒目的数字判断整体性能。"
        }
      },
      {
        "heading": {
          "en": "VLT describes the visible-light side",
          "zh": "VLT 看可见光透过"
        },
        "body": {
          "en": "Visible light transmittance, or VLT, describes the proportion of visible light transmitted by the glazing system. A higher VLT generally means a lighter appearance under comparable conditions. Confirm whether the figure is for film alone or film applied to a stated glass type. The intended window, visibility needs and applicable local requirements all matter when choosing a shade.",
          "zh": "VLT 即可见光透射比，反映可见光通过玻璃系统的比例。在可比条件下，数值越高，外观通常越通透。请分清数据对应的是单独膜材，还是贴在指定玻璃上的组合；选色还应结合前挡、侧窗等具体部位、视野需求与当地要求。"
        }
      },
      {
        "heading": {
          "en": "TSER describes solar-energy rejection",
          "zh": "TSER 看总太阳能阻隔"
        },
        "body": {
          "en": "Total solar energy rejected, or TSER, addresses a broader energy question. It includes reflected solar energy and the portion of absorbed energy that is released outward. UV rejection alone cannot establish this value, and a single-wavelength infrared reading is not a substitute. Compare TSER only when the glazing and test conditions are sufficiently aligned; it is not a direct prediction of cabin temperature.",
          "zh": "TSER 即总太阳能阻隔率，涉及更完整的能量表现，包括反射的太阳能，以及被吸收后向外释放的部分。不能用 UV 阻隔率代替它，也不能把某个单一波长的红外读数直接当作 TSER。比较时须对齐玻璃与测试条件，数值也不能直接换算成车内降温度数。"
        }
      },
      {
        "heading": {
          "en": "Use the demonstration to ask better questions",
          "zh": "用互动展示理解参数"
        },
        "body": {
          "en": "The interactive model on this site uses clearly labeled demonstration inputs to explain these different quantities. Moving a slider changes the illustration, not a laboratory result for a YUNNIAN product. For a purchase decision, request the exact film code, shade, glass specification and current data sheet, then review them together with a physical sample.",
          "zh": "本站互动模型通过明确标注的演示输入帮助理解各项参数。拖动滑杆会改变示意效果，不会生成云辇某个型号的实验结果。采购前请索取完整型号、颜色、测试玻璃规格与最新技术资料，并结合实物样品一起评估。"
        }
      }
    ],
    "sources": [
      {
        "title": "3M · automotive window-film terminology",
        "url": "https://multimedia.3m.com/mws/media/2538245O/personal-auto-awf-product-comparison-guide.pdf"
      },
      {
        "title": "LLumar · glazing performance definitions",
        "url": "https://mobileapps.llumar.com/en/definitions.html"
      }
    ]
  },
  {
    "slug": "understanding-ppf-layers",
    "category": {
      "en": "MATERIAL STRUCTURE",
      "zh": "膜层结构"
    },
    "title": {
      "en": "What stays on the paint? A guide to PPF layers.",
      "zh": "车衣贴好后，哪些膜层留在漆面上？"
    },
    "excerpt": {
      "en": "Separate the protective system from temporary handling layers—and read thickness correctly.",
      "zh": "区分最终保留的保护结构与临时保护层，同时读懂厚度口径。"
    },
    "image": "clear-ppf.webp",
    "readMinutes": 3,
    "sections": [
      {
        "heading": {
          "en": "Read a layer diagram from surface to adhesive",
          "zh": "从表面读到胶层"
        },
        "body": {
          "en": "A coated TPU paint-protection film commonly combines a functional surface coating, a TPU body film and an adhesive layer. These components have different roles: the coating forms the exposed surface, the body film provides the main material layer, and the adhesive joins it to the intended substrate. The exact chemistry and construction must come from the selected product’s technical sheet.",
          "zh": "带涂层的 TPU 漆面保护膜，常见结构包括功能表面涂层、TPU 基膜和胶粘层。涂层形成外露表面，基膜构成主体材料，胶层使其与目标表面贴合。各层承担的作用不同，具体材料、配方与组成应以所选产品的技术资料为准。"
        }
      },
      {
        "heading": {
          "en": "Distinguish temporary layers from the installed film",
          "zh": "分清临时膜层与最终结构"
        },
        "body": {
          "en": "A release liner protects the adhesive before application and is removed during installation. Some products also include a removable cap sheet on the outer surface; others do not. Follow the specified removal sequence for that exact product. A cap sheet is not the same thing as a permanent functional topcoat, even though both appear near the top of a diagram.",
          "zh": "离型膜在施工前覆盖胶面，贴合时需要按说明移除。部分产品外侧还带有可移除的表面保护膜，也有产品不带。移除顺序应遵循具体型号的施工说明。表面保护膜与永久功能涂层不是同一层，不能因为它们都画在上方就混淆用途。"
        }
      },
      {
        "heading": {
          "en": "Ask what the thickness includes",
          "zh": "确认厚度到底包括什么"
        },
        "body": {
          "en": "Before comparing two thickness figures, check their definitions. A supplier may state the film body, film plus adhesive, or separate values for the liner and cap. Record the unit and the included layers on the same sample sheet. Comparing numbers without that boundary can make two different constructions look equivalent when the quoted measurements describe different things.",
          "zh": "比较厚度之前，先确认数值指的是基膜本身、膜材加胶层，还是另列了离型膜及表面保护膜。建议在样品记录表上同时写明单位和计入的膜层。缺少这一口径时，两组数字即使接近，也未必代表同一种结构或相同的实际使用厚度。"
        }
      },
      {
        "heading": {
          "en": "Treat the 3D view as a learning aid",
          "zh": "把三维拆层当作理解工具"
        },
        "body": {
          "en": "The exploded model makes layers easier to identify by exaggerating their spacing and thickness. It is a general construction illustration, not a manufacturing drawing or a promise that every listed film has the same stack. Use it to prepare questions about coating, substrate, adhesive and removable layers, then confirm those answers against the variant you intend to order.",
          "zh": "三维拆层模型为了便于观察，会放大层间距离与厚度。它用于解释通用结构，不是生产图纸，也不代表所有在售膜材都采用相同组合。可以借助模型梳理涂层、基材、胶层与可移除膜层的问题，再逐项核对计划采购的具体规格。"
        }
      }
    ],
    "sources": [
      {
        "title": "3M · PPF Series 150 Gloss construction and thickness definitions",
        "url": "https://multimedia.3m.com/mws/media/2553808O/3m-paint-protection-film-series-150-gloss.pdf?fn=3m-paint-protection-film-series-150-en.pdf"
      },
      {
        "title": "3M · Pro Series 200 Gloss, optional cap-sheet construction",
        "url": "https://multimedia.3m.com/mws/media/2356503O/scotchgard-paint-protection-film-pro-series-200-gloss-product-bulletin.pdf?fn=scotchgard-paint-protection-film-pro-series-200-gloss-product-bulletin.pdf"
      }
    ]
  },
  {
    "slug": "sample-to-installation-care",
    "category": {
      "en": "BUYING & CARE",
      "zh": "采购与养护"
    },
    "title": {
      "en": "From sample to installation: make the handover count.",
      "zh": "从样品到交付，把选膜与养护细节确认好。"
    },
    "excerpt": {
      "en": "A practical record for sample evaluation, installation questions and the first care instructions.",
      "zh": "一份实用流程，串起样品评估、施工确认与首次养护说明。"
    },
    "image": "clear-ppf-application.webp",
    "readMinutes": 3,
    "sections": [
      {
        "heading": {
          "en": "Create a sample record you can reuse",
          "zh": "建立可追溯的样品记录"
        },
        "body": {
          "en": "Label each sample with the series, color or shade code, thickness definition and date received. Keep the supplier reference and the sample together. Photograph the appearance under consistent lighting and note the intended application. A clear record helps your purchasing and installation teams discuss the same material when requesting a quotation, a repeat order or a replacement section.",
          "zh": "每份样品都记录系列、色号或颜色代码、厚度口径及收样日期，并保留对应供应资料。使用一致的光线拍摄外观，注明计划施工部位。这样采购、施工与客户能够围绕同一款材料沟通，也方便后续询价、复购或局部补片时查找原始记录。"
        }
      },
      {
        "heading": {
          "en": "Agree on the trial before placing a larger order",
          "zh": "先确认试贴方法，再讨论批量"
        },
        "body": {
          "en": "Ask the installer to review surface compatibility, preparation, application method and removal guidance for the exact film. Define what you want to observe in the trial: appearance, edge finishing, handling or optical clarity. Record the conditions and follow-up observations. A successful small trial is useful evidence for that application; it does not establish a universal lifetime or warranty outcome.",
          "zh": "请施工人员核对具体膜材的表面适配、清洁准备、施工方法和移除说明。提前明确试贴要观察什么，例如外观、收边、操作感受或光学清晰度，并记录条件及后续变化。一次小面积试贴可以帮助判断该场景，不能直接证明所有环境下的寿命或质保结果。"
        }
      },
      {
        "heading": {
          "en": "Make care instructions part of delivery",
          "zh": "把养护说明一并交付"
        },
        "body": {
          "en": "Get written instructions for the first wash, suitable cleaning products and any limits on pressure washing. Published manufacturer guidance differs between film ranges, so do not transfer a waiting period or solvent recommendation from another product. Use clean, appropriate washing materials, address contamination promptly with an approved method, and avoid directing high-pressure water at film edges.",
          "zh": "交付时应附上首次清洗时间、适用清洁用品和高压清洗限制等书面说明。不同膜材的要求可能不同，不要照搬其他品牌或系列的等待时间、溶剂用法。使用合适且洁净的清洗工具，按认可的方法及时处理污物，并避免高压水流直接冲击膜边。"
        }
      },
      {
        "heading": {
          "en": "Know when to ask the installer",
          "zh": "发现异常时及时回到施工端"
        },
        "body": {
          "en": "If you notice lifting, peeling or damage, document the location and contact the installer before attempting a repair. Keep the product code, invoice and installation record available. The agreed care instructions and written terms should explain what to do next. YUNNIAN can discuss product documentation during the inquiry, while the specific installation and service arrangements should be confirmed before the order.",
          "zh": "发现翘边、起皮或损伤时，先记录位置和现象，联系施工人员确认处理方式，避免自行扩大修补范围。保留产品代码、采购凭据和施工记录，并按照已确认的养护说明与书面条款安排后续。询价时可向云辇索取对应资料，施工及服务安排则应在订购前确认。"
        }
      }
    ],
    "sources": [
      {
        "title": "XPEL · product-specific care instructions",
        "url": "https://www.xpel.com/product-care"
      },
      {
        "title": "3M · paint-protection-film installation and maintenance guidance",
        "url": "https://multimedia.3m.com/mws/media/2159838O/3m-paint-protection-film-installation-guidelines-en-we.pdf?fn=3M-Paint-Protection-Film-Installation-Guidelines-EN-WE-Feb-2022.pdf"
      }
    ]
  },
  ...sourceIndex
];
