import { ReportRecord } from '@/types/reread';

export const mockTemplateReport: ReportRecord = {
  id: 'mock-template-report',
  title: 'Nature：AI 自己跑完了一轮科学发现闭环',
  subtitle: '判断：这更接近闭环可行性验证，而不是自动科研已经成熟。',
  account: 'AI Crossfields Insights',
  cover: 'https://picsum.photos/id/119/750/500',
  articleType: 'A类',
  mode: '标准解读',
  generatedAt: '2026-06-13T09:17:21.791Z',
  status: '完整报告预览',
  tags: ['lab-in-the-loop', 'multi-agent scientific discovery', 'wet experiment feedback loop'],
  meta: {
    credibility: '中',
    hypeLevel: '中',
    innovationType: '应用创新',
    trl: '',
    industrialWindow: '1-3年内可作为科研平台能力商业化',
    breakthroughDegree: '部分缓解',
    fieldStage: '商业化期'
  },
  articleSnapshot: {
    sourceName: 'AI Crossfields Insights',
    sourceAuthor: 'Samuel Rodriques',
    publishDate: '2026-06-12',
    articleUrl: 'https://mp.weixin.qq.com/s/mock-robin-report',
    originalMaterial: 'Nature 论文 + FutureHouse 官方说明 · Edison Scientific · Nature 2026 Robin / FutureHouse'
  },
  pipeline: [
    {
      key: 'quality',
      title: '解读质量结论',
      description: '信息整体可靠，但标题对结果做了明显外推。'
    },
    {
      key: 'source',
      title: '溯源一手材料',
      description: '可直接定位到 Nature 原文和官方说明。'
    },
    {
      key: 'claim',
      title: '核心价值提取',
      description: '核心价值在于把科研流程首次拼成可验证闭环。'
    },
    {
      key: 'landscape',
      title: '同时间横向对比',
      description: '同期工作里，它更强调真实湿实验回流。'
    },
    {
      key: 'investment',
      title: '投资信号推导',
      description: '更适合先看平台层和实验自动化配套。'
    }
  ],
  timeline: [
    {
      year: '奠基',
      title: 'PaperQA、AI Scientist、Tx-LLM 等单点工具分别解决文献、假设和预测问题',
      description: ''
    },
    {
      year: '当前前沿',
      title: '多智能体闭环加湿实验数据回流正在成为 2026 年前沿验证方向',
      description: ''
    },
    {
      year: '下一难题',
      title: '湿实验全自动化与机器人实验室整合仍是公认下一难题',
      description: ''
    },
    {
      year: '本文位置',
      title: 'Robin 位于闭环可行性已被证明、产业化刚起步的阶段',
      description: ''
    }
  ],
  sections: [
    {
      key: 'quality',
      title: '公众号质量评估',
      summary: '信息源具备论文解读能力，能把核心实验链路说清楚；问题不在事实错漏，而在标题把“闭环验证”包装成“自动科研已到来”。',
      bullets: [
        '结论：这篇公众号适合作为快速导读，但不能直接替代原文判断',
        '作者背景：学术跨界解读号，长期跟踪 AI4S 论文，且有引用原文和拆实验设计的习惯',
        '证据：未发现与 FutureHouse / Edison Scientific 的直接商业绑定，且关键实验链路能与原文对应',
        '边界：涉及“是否代表自动科研成熟”的判断，仍必须回到原文核对'
      ],
      tone: 'info',
      highlight: '可信度：中'
    },
    {
      key: 'hype',
      title: '夸大检测',
      summary: '主要问题在于标题和结论外推，数据本身没有明显失真，但关键信息的边界需要回到原文确认。',
      bullets: [],
      tone: 'warning',
      highlight: '夸大程度：中；建议参考原文：是'
    },
    {
      key: 'team',
      title: '团队背景与商业意图',
      summary: '这是典型的“学术验证 + 平台背书”组合：论文既在证明闭环科学工作流可行，也在为 FutureHouse 的平台叙事建立可信度。',
      bullets: [
        '通讯作者：Samuel Rodriques（FutureHouse）',
        '关联公司：Edison Scientific',
        '融资信息：2025 年完成 7000 万美元种子轮融资',
        '中国关联：无明确中国团队成员或共同作者',
        '商业意图：通过高影响力论文证明其“AI 科研平台”不只是工具集合，而是具备闭环科研能力'
      ],
      tone: 'default'
    },
    {
      key: 'claim',
      title: '核心 Claim',
      summary: '论文最核心的 claim 不是“AI 已经能独立做科研”，而是“多智能体系统首次在真实湿实验中跑通了可验证的科学发现闭环”。',
      bullets: [
        '主张1：系统可以把文献检索、假设生成、实验设计与结果回流串成连续工作流',
        '主张2：系统在特定生物任务上能提出并验证具有新颖性的候选方向',
        '局限：湿实验执行仍依赖人工，闭环没有真正实现无人化',
        '局限：Finch 在复杂生信任务上的正确率仍然有限',
        '局限：当前验证停留在体外和原代细胞层面，未进入 in vivo 与临床'
      ]
    },
    {
      key: 'innovation',
      title: '创新点识别',
      summary: 'Robin 的新意不在单一模型，而在于把文献理解、假设生成、实验设计与结果回流连接成一个可验证的科研闭环。',
      bullets: [
        '创新类型：应用创新，带有明显系统工程特征',
        '一句话概括：它把“会想”和“会验”放进同一个迭代回路，而不是只完成其中一步',
        '相关关键词：lab-in-the-loop / multi-agent scientific discovery / wet experiment feedback loop'
      ],
      highlight: '创新点类型：应用创新',
      tone: 'success'
    },
    {
      key: 'bottleneck',
      title: '领域瓶颈与突破程度',
      summary: 'AI4S 的长期瓶颈不只是“模型不够强”，而是科研流程始终断在实验回流这一步，导致 AI 无法形成真正可迭代的发现机制。',
      bullets: [
        '之前未解决原因：过去虽然有文献问答、结构预测、实验设计等单点工具，但实验结果始终无法低摩擦回流到下一轮假设更新',
        '突破说明：Robin 证明了“多智能体 + 湿实验回流”这条路径可以工作，但解决的是闭环搭建问题，而不是理论瓶颈被彻底消除',
        '下一个瓶颈：湿实验自动化仍是核心短板，机器人实验室和标准化实验接口是下一阶段必须补齐的一环'
      ],
      highlight: '突破判断：验证了闭环可行性'
    },
    {
      key: 'industrial',
      title: '产业化可行性',
      summary: '研究能力已经被证明，但距离稳定的平台化交付仍有明显工程距离，现阶段更接近早期平台窗口。',
      bullets: [
        '数据壁垒：低；主要依赖公开文献和可获取实验流程，对比拥有私有实验数据库的平台护城河较弱',
        '算力成本：低；相较大规模湿实验筛选，推理与假设生成成本显著更低，瓶颈更多在实验而非算力',
        '工程化 gap：中；从论文 demo 到稳定产品仍需要实验室系统集成、流程编排、日志追踪和质控体系',
        '监管路径：中等；科研工具层监管较轻，但一旦向药物开发结论迁移，仍要回到传统药政路径',
        '工具层商业化：1-3 年内更可能先以科研平台、实验助手、自动化工作台形式商业化',
        '应用层商业化：5-10 年才可能走到临床与规模化应用，且前提是闭环外的实验基础设施先成熟'
      ],
      tone: 'info',
      highlight: '当前阶段：早期平台化窗口'
    },
    {
      key: 'timeline',
      title: '领域发展时间线',
      summary: '这一块只回答它在领域时间线上的位置：从哪里来、现在到了哪一步、下一步卡在哪里。',
      bullets: []
    },
    {
      key: 'overseas',
      title: '海外代表性工作',
      summary: '近两年，闭环科研系统开始成为海外的核心对比方向。',
      bullets: []
    },
    {
      key: 'domestic',
      title: '国内研究扫描',
      summary: '国内已有相关平台和框架，但公开工作仍以局部闭环为主。',
      bullets: []
    },
    {
      key: 'opportunity',
      title: '投资机会分析',
      summary: '这个方向当前更像平台层和配套层的窗口，而不是立刻出现大规模终局赢家的阶段。',
      bullets: [
        '[全球·商业化空缺] AI 科研平台工具层（依据：海外代表工作已验证平台化路径，但市场仍缺面向生物科研团队的标准化产品形态）',
        '[全球·验证空缺] 湿实验自动化与机器人实验室协同平台（依据：时间线与瓶颈分析都指向实验回流仍是闭环放大的核心约束）',
        '[国内·商业化空缺] 文献驱动老药新用闭环平台（依据：国内扫描中尚无公开对标团队把文献、假设和湿实验回流覆盖完整）'
      ],
      tone: 'success',
      highlight: '领域阶段：商业化期'
    },
    {
      key: 'signals',
      title: '关键待验证信号',
      summary: '这类方向的关键不在论文热度，而在闭环能否扩展、结果能否外推到更高验证层级。',
      bullets: [
        '[近期(<6个月)] Robin 的候选方向进入 in vivo 动物实验并获得正向结果 → 说明这套闭环不只停留在体外验证，开始跨向更高验证层级',
        '[中期(6-24个月)] 第三方独立复现 Robin 或同类系统核心 benchmark → 可显著降低“自测数据”与单团队工程技巧带来的可信度疑虑',
        '[不确定] 国内出现同时具备湿实验能力、科研智能体编排能力和可产品化接口的团队 → 意味着国内投资窗口真正打开'
      ],
      tone: 'warning'
    }
  ],
  references: [
    {
      id: 'Ref 0',
      author: 'AI Crossfields Insights',
      title: 'Nature：AI 自己跑完了一轮科学发现闭环，Robin 让 AI4S 更像真正的科研合作者',
      link: 'https://mp.weixin.qq.com/s/mock-robin-report'
    },
    {
      id: 'Ref 1',
      author: 'Google DeepMind',
      title: 'Co-Scientist',
      link: 'https://example.com/co-scientist'
    },
    {
      id: 'Ref 2',
      author: 'Stanford',
      title: 'Biomni',
      link: 'https://example.com/biomni'
    },
    {
      id: 'Ref 3',
      author: 'Zou Lab',
      title: 'Virtual Lab',
      link: 'https://example.com/virtual-lab'
    },
    {
      id: 'Ref 4',
      author: '上海 AI 实验室',
      title: 'InternAgent',
      link: 'https://example.com/internagent'
    },
    {
      id: 'Ref 5',
      author: 'BioMap',
      title: 'BioMap',
      link: 'https://example.com/biomap'
    }
  ],
  coreInnovation: {
    type: '应用创新',
    description: '以人做不到的规模把文献线索、假设生成与湿实验回流拼成一条可验证的科学发现链。',
    searchKeywords: ['lab-in-the-loop', 'multi-agent scientific discovery', 'wet experiment feedback loop']
  },
  bottleneck: {
    description: 'AI4S 过去多停留在单点工具，无法把实验结果结构化回流到下一轮假设更新。',
    whyUnsolved: '过去缺少把文献智能体、实验设计智能体和湿实验结果整合成闭环的系统工程能力。',
    nextBottleneck: '湿实验自动化仍是核心短板，机器人实验室是下一阶段必须补齐的一环。'
  },
  productization: {
    dataBarrier: {
      level: '低',
      benchmark: '主要依赖公开文献和可获取实验流程，对比拥有私有实验数据库的平台护城河较弱'
    },
    computeCost: {
      level: '低',
      benchmark: '相较大规模湿实验筛选，推理与假设生成成本显著更低'
    },
    engineeringGap: {
      level: '中',
      note: '从论文 demo 到稳定产品仍需要实验室系统集成、流程编排与质控'
    },
    regulation: {
      level: '中等',
      benchmark: '科研工具层监管较轻，但真正进入药物开发仍要面对传统药政路径'
    }
  },
  overseasWorks: [
    {
      name: 'Co-Scientist',
      institution: 'Google DeepMind',
      date: '2026-05',
      intro: 'Google DeepMind 提出的多智能体科研系统，重点是让不同角色的智能体协同完成研究问题拆解、证据整合与方案生成。',
      timelinePosition: '与 Robin 同期，验证 AI 科研闭环可行性',
      solved: '展示了面向药物重定位的多智能体科研工作流',
      unsolved: '没有形成稳定湿实验自动化能力',
      refUrl: 'https://example.com/co-scientist'
    },
    {
      name: 'Biomni',
      institution: 'Stanford',
      date: '2025-06',
      intro: 'Stanford 推出的科研助手系统，核心是把多种模型和工具调用整合进同一条科研工作流。',
      timelinePosition: '比 Robin 更早验证 lab-in-the-loop 的方向价值',
      solved: '把多工具调用整合进科研助手工作流',
      unsolved: '不包含真实湿实验数据回流闭环',
      refUrl: 'https://example.com/biomni'
    },
    {
      name: 'Virtual Lab',
      institution: 'Zou Lab',
      date: '2025-02',
      intro: 'Zou Lab 的早期探索工作，尝试把 AI 辅助实验设计和体外验证连接成一个连续实验回路。',
      timelinePosition: '更早期的实验回环探索案例',
      solved: '展示 AI 可辅助实验设计和体外验证',
      unsolved: '闭环仍依赖大量人工参与',
      refUrl: 'https://example.com/virtual-lab'
    }
  ],
  chinaTeams: [
    {
      name: '上海 AI 实验室 InternAgent',
      work: '面向科研任务的多智能体闭环框架',
      timelinePosition: '计算科研闭环方向的先行探索',
      attribute: '开源',
      matchDegree: '部分对标',
      gap: '主战场是计算科研，不覆盖真实湿实验数据回流',
      commercialization: null,
      refUrl: 'https://example.com/internagent'
    },
    {
      name: 'BioMap',
      work: '生命科学基础模型与智能体平台，强调计算侧的科研辅助与平台化能力',
      timelinePosition: '更偏计算与模型平台的一侧',
      attribute: '商业产品',
      matchDegree: '部分对标',
      gap: '公开材料中尚未展示稳定的湿实验数据回流闭环，离端到端科研闭环还有距离',
      commercialization: '已有平台化合作与产业落地',
      refUrl: 'https://example.com/biomap'
    }
  ],
  opportunities: [
    {
      direction: 'AI 科研平台工具层',
      basis: '海外代表工作已验证商业化路径，但国内定位仍有空缺',
      gapType: '商业化空缺',
      scope: '全球'
    },
    {
      direction: '湿实验自动化与机器人实验室协同平台',
      basis: '领域时间线明确把湿实验自动化视为下一个核心瓶颈',
      gapType: '验证空缺',
      scope: '全球'
    },
    {
      direction: '文献驱动老药新用闭环平台',
      basis: '国内扫描中尚无公开对标团队覆盖完整闭环',
      gapType: '商业化空缺',
      scope: '国内'
    }
  ],
  investmentSignals: [
    {
      trigger: 'Robin 的候选方向进入 in vivo 动物实验并获得正向结果',
      meaning: '说明 AI 科研闭环不只停留在体外，开始跨向更高验证层级',
      timeWindow: '近期(<6个月)'
    },
    {
      trigger: '第三方独立复现 Robin 或同类系统核心 benchmark',
      meaning: '可显著降低“自测数据”带来的可信度疑虑',
      timeWindow: '中期(6-24个月)'
    },
    {
      trigger: '国内出现同时具备湿实验能力和闭环科研智能体能力的团队',
      meaning: '意味着国内投资窗口真正打开',
      timeWindow: '不确定'
    }
  ],
  hyperDetail: {
    issues: [
      {
        type: 'C结论超范围',
        claim: 'AI 自己跑完了一轮科学发现，自动科研已经到来',
        reality: '当前仍需人工执行湿实验，且验证仅到体外阶段',
        severity: '轻微'
      },
      {
        type: 'B局限性省略',
        claim: '30分钟内发现新治疗策略',
        reality: '该结论依赖特定任务设置，且并未跨越体内与临床验证',
        severity: '中等'
      }
    ]
  },
  teamDetail: {
    leadAuthor: 'Samuel Rodriques',
    institution: 'FutureHouse',
    relatedCompany: 'Edison Scientific',
    fundingInfo: '2025 年完成 7000 万美元种子轮融资',
    chinaConnection: '无',
    commercialIntent: '学术成果与商业化并行，论文既是技术里程碑，也是平台能力与未来融资叙事的外部背书。'
  }
};
