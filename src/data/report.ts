import { ReportRecord } from '@/types/reread';

export const reportLibrary: ReportRecord[] = [
  {
    id: 'reread-001',
    title: '生成式蛋白设计公司发布新平台，公众号称“药物研发进入自动驾驶”',
    subtitle: '围绕论文支撑的公司/产品发布，适合在读原文前快速建立判断框架。',
    account: 'AI4S Frontier Review',
    cover: 'https://picsum.photos/id/119/750/500',
    articleType: 'A+C混合',
    mode: '标准解读',
    generatedAt: '2026-06-10 21:18',
    status: '已生成完整报告',
    tags: ['蛋白设计', '生成式模型', '平台公司'],
    meta: {
      credibility: '中',
      hypeLevel: '中',
      toVcRisk: '中',
      innovationType: '技术 + 应用 + 系统工程',
      trl: 'TRL 4/9',
      industrialWindow: '中期（6-24个月）'
    },
    articleSnapshot: {
      sourceName: 'AI4S Frontier Review',
      sourceAuthor: '匿名研究编辑部',
      publishDate: '2026-06-09',
      articleUrl: 'https://mp.weixin.qq.com/s/mock-reread-001',
      originalMaterial: 'arXiv 论文 + 公司技术博客 + 产品发布页 + 最近一轮融资新闻'
    },
    pipeline: [
      { key: 'type', title: '内容价值预判', description: '识别为 A+C 混合文章，进入完整解读路径。' },
      { key: 'source', title: '溯源一手材料', description: '定位论文、公司博客和融资新闻，建立核验链路。' },
      { key: 'quality', title: '公众号质量评估', description: '完成账号背景、利益关系和夸大检测。' },
      { key: 'claim', title: '核心创新提取', description: '抽取 claim、局限性和核心检索词。' },
      { key: 'landscape', title: '时间线与对比', description: '建立海外代表工作和国内研究扫描。' },
      { key: 'investment', title: '投资推导', description: '输出机会窗口与待验证信号。' }
    ],
    timeline: [
      { year: '2021', title: '蛋白基础模型起步', description: '语言模型和结构预测共同推动生成式设计成为可验证方向。' },
      { year: '2023', title: '从单点模型走向工作流', description: '行业开始将结构预测、筛选和实验回环串成平台能力。' },
      { year: '2025', title: '平台化公司扎堆发布', description: '更多公司开始把论文结果包装成产品叙事和融资故事。' },
      { year: '本文位置', title: '从模型能力走向平台验证', description: '该工作重点不是新范式本身，而是把模型、实验和商业叙事绑定。' }
    ],
    sections: [
      {
        key: 'quality',
        title: '公众号质量评估',
        summary: '账号具备一定研究积累，但与文章主体存在较强产业链关联，适合作为线索入口，不适合直接当作原始结论。',
        bullets: [
          '作者署名为研究编辑部，未公开单篇作者背景，信息透明度一般。',
          '文章多次引用公司原始材料，但未明确区分论文结论和 PR 表述。',
          '可信度系数判定为中，建议继续查看原论文与官方发布。'
        ],
        tone: 'info',
        highlight: '可信度：中'
      },
      {
        key: 'hype',
        title: '夸大检测',
        summary: '主要夸大点集中在“药物研发自动驾驶”这一标题级表达，核心实验结果本身未被明显篡改。',
        bullets: [
          '关键数字引用自公司博客截图，缺少原表格上下文，存在样本选择偏差风险。',
          '文章弱化了实验回路仍高度依赖人工设计和湿实验资源这一局限。',
          '标题把平台能力外推到了行业级范式切换，超出了当前 claim。'
        ],
        tone: 'warning',
        highlight: '夸大程度：中；建议直接参考原文：是'
      },
      {
        key: 'team',
        title: '作者/团队背景与商业意图',
        summary: '团队背景强，发布窗口与融资节奏接近，既是技术更新也是资本沟通动作。',
        bullets: [
          '论文通讯作者来自头部研究机构，且与公司顾问网络高度重合。',
          '公司近期完成新一轮融资，发布时间紧邻公开报道窗口。',
          'To VC 风险计数显示：叙事信号 2、时间节点信号 2、技术可行性信号 1，综合为中。'
        ],
        tone: 'warning',
        highlight: 'To VC 风险：中'
      },
      {
        key: 'claim',
        title: '核心 Claim',
        summary: '核心 claim 是通过生成模型缩短候选分子迭代周期，并提升从设计到实验验证的衔接效率。',
        bullets: [
          '声称解决的问题：生成候选质量不稳定、设计与验证脱节、人工筛选成本高。',
          '自述局限性：目前仍需在特定靶点和受控实验条件下验证。',
          '与公众号表述相比，原始材料更强调“工作流效率提升”而非“完全自动化”。'
        ],
        highlight: '真正新增信息是工作流闭环，而不是单一模型指标。'
      },
      {
        key: 'innovation',
        title: '创新点识别',
        summary: '创新点类型属于混合创新，更像“模型+实验+系统工程”的集成式推进。',
        bullets: [
          '一句话描述：把生成式蛋白设计模型嵌入带实验反馈的数据闭环，以缩短 hit discovery 到 lead optimization 的前段验证周期。',
          '核心检索词：generative protein design、active learning loop、wet lab feedback、platform biotech。',
          '与纯学术论文不同，创新价值更多体现在系统整合而非全新理论。'
        ],
        tone: 'success',
        highlight: '创新点类型：混合'
      },
      {
        key: 'bottleneck',
        title: '领域瓶颈与突破程度',
        summary: '该工作触及的是“从生成到可验证”的老瓶颈，但目前更像显著缓解，而不是彻底解决。',
        bullets: [
          '长期瓶颈在于高质量实验反馈稀缺，导致模型在真实成药属性上泛化不足。',
          '过去难以解决的原因主要是实验数据缺、闭环成本高、评价指标与真实商业终点错位。',
          '当前突破程度判定为部分缓解；下一瓶颈仍是高通量实验与多目标优化。'
        ],
        highlight: '突破程度：部分缓解'
      },
      {
        key: 'industrial',
        title: '产业化可行性',
        summary: '从产业化视角看，最大约束不在模型本身，而在数据壁垒、实验吞吐和合作药企验证路径。',
        bullets: [
          '数据壁垒：高，真实可用实验数据仍掌握在少数平台和合作方手中。',
          '算力成本：中，训练与筛选成本可控，但持续闭环会抬高总成本。',
          '工程化 gap：高，需要稳定的数据基础设施和实验执行体系。',
          '监管路径：中，平台能力本身不直接审批，但真正进入药物开发后仍受长周期验证约束。'
        ],
        tone: 'info',
        highlight: 'TRL 4/9；产业化时间窗口：中期'
      },
      {
        key: 'timeline',
        title: '领域发展时间线',
        summary: '方向起源于蛋白结构预测和生成模型结合，当前前沿正在从单点模型竞赛转向端到端平台化。',
        bullets: [
          '奠基性工作是结构预测、序列语言模型和定向进化数据的结合。',
          '当前前沿关注的是把模型输出和实验吞吐连接成稳定迭代系统。',
          '下一步卡点在可扩展实验反馈和跨靶点泛化。',
          '本文位置处于平台化商业验证早期。'
        ]
      },
      {
        key: 'overseas',
        title: '海外代表性工作',
        summary: '海外代表公司和团队多数已经从“做出模型”进入“证明平台价值”的阶段。',
        bullets: [
          'Generate Biomedicines：位于平台验证阶段，强调从生成到候选推进的端到端能力。',
          'EvolutionaryScale：位于基础模型扩展阶段，解决更大规模生物序列建模。',
          'Recursion / Insilico 等公司：更多停留在高通量数据与应用整合，对标位置与本文相邻但路径不同。'
        ],
        highlight: '对比重点不是谁更强，而是谁已经走到时间线的下一段。'
      },
      {
        key: 'domestic',
        title: '国内研究扫描',
        summary: '国内已有模型与平台探索，但在实验闭环、国际合作密度和商业验证深度上仍有差距。',
        bullets: [
          '高校团队：多处于学术验证阶段，与国际前沿差距集中在数据规模和实验条件。',
          '平台型创业公司：部分具备商业合作迹象，但多数对标仍停留在表面能力展示。',
          '转化迹象主要来自 CRO、药企共研和科研服务而非自有管线。'
        ]
      },
      {
        key: 'judgement',
        title: '领域判断',
        summary: '该方向正处于“能力被看见、价值待证明”的阶段，驱动力来自模型进步和药企对研发效率的持续压力。',
        bullets: [
          '当前阶段：从技术可行走向平台可商业化验证。',
          '主要驱动力：更强的基础模型、实验自动化基础设施、药企合作需求。',
          '最大不确定性：实验反馈速度和真实成药终点之间仍存在显著鸿沟。'
        ],
        tone: 'info'
      },
      {
        key: 'opportunity',
        title: '投资机会分析',
        summary: '机会不只在模型公司，更在于能够补齐验证链条的基础设施和行业化服务。',
        bullets: [
          '技术空缺：面向特定靶点的高质量闭环数据平台仍稀缺。',
          '商业化空缺：有模型能力但缺面向药企可交付产品的团队仍较多。',
          '验证空缺：缺少能够把实验吞吐、命中率和时间缩短量系统证明出来的案例。',
          '国内机会窗口更可能出现在科研服务、共研平台和特定治疗领域工具化切入。'
        ],
        tone: 'success',
        highlight: '机会依据来自时间线判断与产业化约束，而不是单篇文章热度。'
      },
      {
        key: 'signals',
        title: '关键待验证信号',
        summary: '后续最需要看的不是新一轮宣传，而是平台是否持续交付真实验证结果。',
        bullets: [
          '近期（<6个月）：是否披露更多跨靶点实验结果和外部合作案例。',
          '中期（6-24个月）：是否出现明确的共研里程碑或候选物推进节点。',
          '长期（>2年）：平台是否能从服务模式走向高价值资产沉淀。'
        ],
        tone: 'warning'
      }
    ],
    references: [
      { id: 'Ref 1', author: '通讯作者团队', title: 'Generative Protein Design with Closed-Loop Experimental Feedback', link: 'https://arxiv.org/abs/2501.01234' },
      { id: 'Ref 2', author: '公司官方', title: 'Platform Launch: Closed-Loop Protein Design', link: 'https://example.com/platform-launch' },
      { id: 'Ref 3', author: '融资新闻', title: 'Biotech Startup Raises Series B to Scale Generative Design', link: 'https://example.com/series-b-news' }
    ]
  },
  {
    id: 'reread-002',
    title: '公众号解读一篇多模态分子基础模型论文，宣称“实验室即将被 AI 接管”',
    subtitle: '典型 A 类论文解读，适合对比公众号叙事与原论文 claim 的边界。',
    account: 'BioTech Signal',
    cover: 'https://picsum.photos/id/201/750/500',
    articleType: 'A类论文解读',
    mode: '标准解读',
    generatedAt: '2026-06-08 18:42',
    status: '已生成完整报告',
    tags: ['分子基础模型', '多模态', '药物发现'],
    meta: {
      credibility: '高',
      hypeLevel: '中',
      innovationType: '技术创新',
      trl: 'TRL 3/9',
      industrialWindow: '长期（>2年）'
    },
    articleSnapshot: {
      sourceName: 'BioTech Signal',
      sourceAuthor: '独立撰稿人',
      publishDate: '2026-06-07',
      articleUrl: 'https://mp.weixin.qq.com/s/mock-reread-002',
      originalMaterial: '论文 PDF + 补充材料 + 作者访谈'
    },
    pipeline: [
      { key: 'type', title: '内容价值预判', description: '识别为 A 类论文解读，进入论文核验路径。' },
      { key: 'source', title: '溯源一手材料', description: '定位 arXiv、作者主页和补充材料。' },
      { key: 'quality', title: '公众号质量评估', description: '重点核查标题与结论边界。' },
      { key: 'claim', title: '核心创新提取', description: '提炼模型结构、训练数据与局限性。' },
      { key: 'landscape', title: '时间线与对比', description: '补充海外多模态基础模型与国内跟进。' },
      { key: 'investment', title: '投资推导', description: '推导基础设施、工具链和数据资产机会。' }
    ],
    timeline: [
      { year: '2022', title: '单模态基础模型扩张', description: '序列和结构建模各自提升，但跨模态对齐仍有限。' },
      { year: '2024', title: '多模态对齐开始形成范式', description: '结构、序列、实验信号开始被放进统一表征空间。' },
      { year: '本文位置', title: '从对齐走向任务泛化', description: '试图证明一个统一模型可覆盖更多下游任务。' }
    ],
    sections: [
      {
        key: 'quality',
        title: '公众号质量评估',
        summary: '作者背景透明且引用充分，但标题显著超出论文原始 claim。',
        bullets: ['作者有长期 Ai4s 写作记录，引用规范较好。', '没有明显利益关系，可信度为高。', '适合作为快速索引，但仍需回到论文原文。'],
        tone: 'info',
        highlight: '可信度：高'
      },
      {
        key: 'hype',
        title: '夸大检测',
        summary: '“实验室被 AI 接管”是明显越界表述，论文实际只证明了统一模型在若干 benchmark 上的泛化能力。',
        bullets: ['论文没有 claim 全流程实验自动化。', '局限性章节明确指出数据质量和实验可迁移性仍受限。', '夸大程度判定为中。'],
        tone: 'warning'
      },
      {
        key: 'claim',
        title: '核心 Claim',
        summary: '论文试图证明多模态分子基础模型可以减少下游任务分别训练的成本。',
        bullets: ['解决的问题：不同数据模态之间无法共享表征。', '局限性：训练数据异质、评估任务偏 benchmark。', '新增信息是统一表征能力，而不是马上带来产业化跃迁。']
      },
      {
        key: 'innovation',
        title: '创新点识别',
        summary: '创新点属于技术创新，核心在跨序列、结构和实验读出的联合建模。',
        bullets: ['一句话描述：通过统一多模态编码器提升分子任务迁移效率。', '核心检索词：multimodal molecular foundation model、joint embedding、cross-task generalization。'],
        tone: 'success'
      },
      {
        key: 'bottleneck',
        title: '领域瓶颈与突破程度',
        summary: '论文命中的是模型泛化瓶颈，但更偏向方法层缓解，离可验证商业价值仍远。',
        bullets: ['此前没解决的原因是数据模态碎片化。', '当前突破为部分缓解，下一瓶颈是高质量多模态训练数据供给。']
      },
      {
        key: 'industrial',
        title: '产业化可行性',
        summary: 'TRL 仍低，短期更适合作为平台能力储备而不是独立商业产品。',
        bullets: ['数据壁垒高，算力成本中高，工程化 gap 高。', '监管路径并非直接问题，真正限制在可复现验证。'],
        tone: 'info',
        highlight: 'TRL 3/9；产业化时间窗口：长期'
      },
      {
        key: 'timeline',
        title: '领域发展时间线',
        summary: '本文处于“统一基础模型”叙事继续深化的阶段，尚未迈入产业验证。',
        bullets: ['当前前沿正在比拼数据规模、模态覆盖和任务泛化。', '下一步卡点是外部实验任务能否稳定受益。']
      },
      {
        key: 'overseas',
        title: '海外代表性工作',
        summary: '海外团队更多从大模型规模化和基础数据资产出发。',
        bullets: ['Isomorphic Labs：时间线更靠后，已更接近实际药物研发协同。', 'Absci / EvolutionaryScale：分别站在模型平台和基础模型扩张位置。']
      },
      {
        key: 'domestic',
        title: '国内研究扫描',
        summary: '国内在论文产出上追得较快，但多数仍停留在学术和开源示范阶段。',
        bullets: ['与国际前沿差距主要在数据组织和持续实验反馈。', '商业转化多为科研服务和工具平台。']
      },
      {
        key: 'judgement',
        title: '领域判断',
        summary: '方向仍早期，驱动力是模型统一化趋势，不确定性在真实 downstream 收益是否成立。',
        bullets: ['当前阶段：技术探索期。', '最大不确定性：泛化收益是否能转化成研发效率收益。']
      },
      {
        key: 'opportunity',
        title: '投资机会分析',
        summary: '更适合关注数据层、工具层和验证层，而非单篇论文驱动的热点公司。',
        bullets: ['技术空缺：高质量多模态数据组织工具。', '验证空缺：从模型性能到实验结果的证据桥梁。'],
        tone: 'success'
      },
      {
        key: 'signals',
        title: '关键待验证信号',
        summary: '关键看是否有公开案例证明该模型带来实际 hit rate 或周期改善。',
        bullets: ['近期：是否有更多外部数据复现。', '中长期：是否进入真实药企协作流程。'],
        tone: 'warning'
      }
    ],
    references: [
      { id: 'Ref 1', author: '论文作者', title: 'A Multimodal Foundation Model for Molecular Reasoning', link: 'https://arxiv.org/abs/2502.04567' },
      { id: 'Ref 2', author: '作者访谈', title: 'On Unifying Molecular Representations Across Tasks', link: 'https://example.com/author-interview' }
    ]
  },
  {
    id: 'reread-003',
    title: '公众号转载某 Ai4s 产品发布会，核心叙事很强，但一手技术材料缺失',
    subtitle: '典型“部分可分析”场景，系统输出已完成模块、缺失说明和等待建议。',
    account: 'Future Alpha Dispatch',
    cover: 'https://picsum.photos/id/160/750/500',
    articleType: '部分可分析',
    mode: '标准解读',
    generatedAt: '2026-06-10 20:11',
    status: '已生成部分分析报告',
    tags: ['纯PR', '产品发布', '缺少一手材料'],
    meta: {
      credibility: '低',
      hypeLevel: '高',
      toVcRisk: '高',
      innovationType: '叙事包装为主',
      trl: 'TRL 待定',
      industrialWindow: '不确定'
    },
    articleSnapshot: {
      sourceName: 'Future Alpha Dispatch',
      sourceAuthor: '营销编辑',
      publishDate: '2026-06-10',
      articleUrl: 'https://mp.weixin.qq.com/s/mock-reread-003',
      originalMaterial: '仅找到发布会新闻稿和官网营销页，未找到技术报告/论文 DOI'
    },
    pipeline: [
      { key: 'type', title: '内容价值预判', description: '识别为部分可分析，优先完成信源、夸大和商业意图判断。' },
      { key: 'source', title: '溯源一手材料', description: '未找到足够的一手技术材料，记录缺失说明。' },
      { key: 'quality', title: '公众号质量评估', description: '重点核查利益关系和标题越界。' },
      { key: 'claim', title: '可完成模块输出', description: '保留核心叙事、局限和等待建议。' }
    ],
    timeline: [
      { year: '当前状态', title: '无法稳定定位时间线', description: '由于缺少论文、技术白皮书或独立评测，当前无法确认它在技术时间线中的精确位置。' }
    ],
    sections: [
      {
        key: 'quality',
        title: '公众号质量评估',
        summary: '账号与发布主体存在明显利益一致性，更像市场传播材料而不是研究型解读。',
        bullets: [
          '账号主体与公司发布节奏同步，文章没有披露独立核查来源。',
          '多处使用“行业首个”“重构研发范式”类表述，但没有给出对应技术证据。',
          '可信度系数判定为低。'
        ],
        tone: 'warning',
        highlight: '可信度：低'
      },
      {
        key: 'hype',
        title: '夸大检测',
        summary: '这是标准的高夸大内容，标题、结论和宣传素材都明显跑在证据之前。',
        bullets: [
          '关键数字无法回溯到实验表格或技术报告。',
          '重要局限性几乎完全缺失，文章没有说明适用条件与失败场景。',
          '建议直接参考原文：否，建议等待技术报告或第三方验证。'
        ],
        tone: 'warning',
        highlight: '夸大程度：高'
      },
      {
        key: 'team',
        title: '作者/团队背景与商业意图',
        summary: '发布时间强绑定市场活动节点，To VC 风险高。',
        bullets: [
          '产品发布时间与融资消息窗口接近，叙事信号和时间节点信号均偏强。',
          '技术可行性信号不足，目前更像市场教育与资本沟通动作。',
          '综合判断：不建议据此形成技术领先结论。'
        ],
        tone: 'warning',
        highlight: 'To VC 风险：高'
      },
      {
        key: 'missing',
        title: '缺失说明与等待建议',
        summary: '这篇内容只能完成信源和商业意图判断，无法继续进入完整的时间线与投资推导。',
        bullets: [
          '缺失项：论文 DOI / arXiv、技术白皮书、第三方评测或独立采访。',
          '等待建议：优先跟踪是否发布技术报告、客户案例和真实 benchmark。',
          '寻找建议：关注官网开发者文档、发布会回放、合作伙伴口径和融资新闻细节。'
        ],
        tone: 'info',
        highlight: '当前仅完成部分分析'
      }
    ],
    references: [
      { id: 'Ref 1', author: '公司官网', title: 'Product Launch Announcement', link: 'https://example.com/product-announcement' }
    ]
  }
];

export const getReportById = (id?: string): ReportRecord | undefined => reportLibrary.find((item) => item.id === id);
