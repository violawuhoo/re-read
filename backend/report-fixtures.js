const reportLibrary = [
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
        key: 'opportunity',
        title: '投资机会分析',
        summary: '机会不只在模型公司，更在于能够补齐验证链条的基础设施和行业化服务。',
        bullets: [
          '技术空缺：面向特定靶点的高质量闭环数据平台仍稀缺。',
          '商业化空缺：有模型能力但缺面向药企可交付产品的团队仍较多。',
          '验证空缺：缺少能够把实验吞吐、命中率和时间缩短量系统证明出来的案例。'
        ],
        tone: 'success',
        highlight: '机会依据来自时间线判断与产业化约束'
      }
    ],
    references: [
      { id: 'Ref 1', author: '通讯作者团队', title: 'Generative Protein Design with Closed-Loop Experimental Feedback', link: 'https://arxiv.org/abs/2501.01234' },
      { id: 'Ref 2', author: '公司官方', title: 'Platform Launch: Closed-Loop Protein Design', link: 'https://example.com/platform-launch' }
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
      { key: 'claim', title: '核心创新提取', description: '提炼模型结构、训练数据与局限性。' }
    ],
    timeline: [
      { year: '2022', title: '单模态基础模型扩张', description: '序列和结构建模各自提升，但跨模态对齐仍有限。' },
      { year: '2024', title: '多模态对齐开始形成范式', description: '结构、序列、实验信号开始被放进统一表征空间。' }
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
        key: 'industrial',
        title: '产业化可行性',
        summary: 'TRL 仍低，短期更适合作为平台能力储备而不是独立商业产品。',
        bullets: ['数据壁垒高，算力成本中高，工程化 gap 高。', '监管路径并非直接问题，真正限制在可复现验证。'],
        tone: 'info',
        highlight: 'TRL 3/9；产业化时间窗口：长期'
      }
    ],
    references: [
      { id: 'Ref 1', author: '论文作者', title: 'A Multimodal Foundation Model for Molecular Reasoning', link: 'https://arxiv.org/abs/2502.04567' }
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
      { key: 'quality', title: '公众号质量评估', description: '重点核查利益关系和标题越界。' }
    ],
    timeline: [
      { year: '当前状态', title: '无法稳定定位时间线', description: '由于缺少论文、技术白皮书或独立评测，当前无法确认它在技术时间线中的精确位置。' }
    ],
    sections: [
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

const getReportById = (id) => reportLibrary.find((item) => item.id === id);

module.exports = {
  reportLibrary,
  getReportById
};
