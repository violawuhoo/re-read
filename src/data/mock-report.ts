import { ReportRecord } from '@/types/reread';

export const mockTemplateReport: ReportRecord = {
  id: 'mock-template-report',
  title: 'Nature：AI 自己跑完了一轮科学发现闭环，Robin 让 AI4S 更像真正的科研合作者',
  subtitle: '以人做不到的规模把文献线索、假设生成与湿实验回流拼成一条可验证的科学发现链。',
  account: 'AI Crossfields Insights',
  cover: 'https://picsum.photos/id/119/750/500',
  articleType: 'A类',
  mode: '标准解读',
  generatedAt: '2026-06-13T09:17:21.791Z',
  status: '模板报告预览 · 本地验收模式',
  tags: ['lab-in-the-loop', 'multi-agent scientific discovery', 'wet experiment feedback loop'],
  meta: {
    credibility: '中',
    hypeLevel: '中',
    toVcRisk: '低',
    innovationType: '应用创新',
    trl: 'TRL 5/9',
    industrialWindow: '1-3年内可作为科研平台能力商业化',
    breakthroughDegree: '部分缓解',
    toVcSignals: {
      narrative: 0,
      timing: 1,
      technical: 0
    },
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
      key: 'type',
      title: '内容价值预判',
      description: '文章围绕一篇具体 Nature 论文展开，并给出明确系统名称与实验结果。'
    },
    {
      key: 'source',
      title: '溯源一手材料',
      description: 'Nature 2026 Robin / FutureHouse'
    },
    {
      key: 'quality',
      title: '公众号质量评估',
      description: '账号具备学术背景，无明显利益相关，但标题对“自动科研”的表述略超论文原始 claim。'
    },
    {
      key: 'claim',
      title: '核心创新提取',
      description: '以人做不到的规模把文献线索、假设生成与湿实验回流拼成一条可验证的科学发现链。'
    },
    {
      key: 'landscape',
      title: '时间线与横向对比',
      description: 'Robin 位于闭环可行性已被证明、产业化刚起步的阶段'
    },
    {
      key: 'investment',
      title: '投资信号推导',
      description: '商业化期 · 闭环可行性已验证，平台化和实验自动化需求同步上升'
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
      summary: '账号具备学术背景，无明显利益相关，但标题对“自动科研”的表述略超论文原始 claim。',
      bullets: [
        '作者背景：学术跨界解读号，长期跟踪 AI4S 论文并有引用原文习惯',
        '是否有利益相关：否',
        '建议直接参考公众号：是'
      ],
      tone: 'info',
      highlight: '可信度：中'
    },
    {
      key: 'hype',
      title: '夸大检测',
      summary: '存在轻度夸大',
      bullets: [
        '[C结论超范围·轻微] 公众号：AI 自己跑完了一轮科学发现，自动科研已经到来 → 实际：当前仍需人工执行湿实验，且验证仅到体外阶段',
        '[B局限性省略·中等] 公众号：30分钟内发现新治疗策略 → 实际：该结论依赖特定任务设置，且并未跨越体内与临床验证'
      ],
      tone: 'warning',
      highlight: '夸大程度：中；建议参考原文：是'
    },
    {
      key: 'team',
      title: '团队背景与商业意图',
      summary: '学术成果与商业化并行，论文既是技术里程碑，也是平台能力的外部背书。',
      bullets: [
        '通讯作者：Samuel Rodriques（FutureHouse）',
        '关联公司：Edison Scientific',
        '融资信息：2025 年完成 7000 万美元种子轮融资',
        '中国关联：无',
        'To VC 风险计数：叙事0·时间1·技术0，论文发布时间与融资节点接近，但技术细节披露较充分。'
      ],
      tone: 'default',
      highlight: 'To VC 风险：低'
    },
    {
      key: 'claim',
      title: '核心 Claim',
      summary: 'Robin 首次在真实湿实验里完成文献检索、假设形成、实验设计与结果回流的完整 AI 科研闭环。',
      bullets: [
        '局限：湿实验执行仍依赖人工，闭环没有真正实现无人化',
        '局限：Finch 在复杂生信任务上的正确率仍然有限',
        '局限：当前验证停留在体外和原代细胞层面，未进入 in vivo 与临床'
      ],
      highlight: '创新点类型：应用创新'
    },
    {
      key: 'innovation',
      title: '创新点识别',
      summary: '以人做不到的规模把文献线索、假设生成与湿实验回流拼成一条可验证的科学发现链。',
      bullets: [
        '检索词：lab-in-the-loop',
        '检索词：multi-agent scientific discovery',
        '检索词：wet experiment feedback loop'
      ],
      highlight: '创新点类型：应用创新',
      tone: 'success'
    },
    {
      key: 'bottleneck',
      title: '领域瓶颈与突破程度',
      summary: 'AI4S 过去多停留在单点工具，无法把实验结果结构化回流到下一轮假设更新。',
      bullets: [
        '之前未解决原因：过去缺少把文献智能体、实验设计智能体和湿实验结果整合成闭环的系统工程能力。',
        '突破说明：Robin 的价值在于系统级闭环集成，而不是提出新的基础算法范式。',
        '下一个瓶颈：湿实验自动化仍是核心短板，机器人实验室是下一阶段必须补齐的一环。'
      ],
      highlight: '突破程度：部分缓解'
    },
    {
      key: 'industrial',
      title: '产业化可行性',
      summary: 'TRL 5/9，参照：接近 AlphaFold 论文刚发布时的工具成熟度',
      bullets: [
        '数据壁垒：低（主要依赖公开文献和可获取实验流程，对比拥有私有实验数据库的平台护城河较弱）',
        '算力成本：低（相较大规模湿实验筛选，推理与假设生成成本显著更低）',
        '工程化 gap：中（从论文 demo 到稳定产品仍需要实验室系统集成、流程编排与质控）',
        '监管路径：中等（科研工具层监管较轻，但真正进入药物开发仍要面对传统药政路径）',
        '工具层商业化：1-3年内可作为科研平台能力商业化',
        '应用层商业化：5-10年才可能走到临床与规模化应用'
      ],
      tone: 'info',
      highlight: 'TRL 5/9'
    },
    {
      key: 'timeline',
      title: '领域发展时间线',
      summary: '本文位置：Robin 位于闭环可行性已被证明、产业化刚起步的阶段',
      bullets: [
        '奠基性工作：PaperQA、AI Scientist、Tx-LLM 等单点工具分别解决文献、假设和预测问题',
        '当前前沿：多智能体闭环加湿实验数据回流正在成为 2026 年前沿验证方向',
        '下一难题：湿实验全自动化与机器人实验室整合仍是公认下一难题'
      ]
    },
    {
      key: 'overseas',
      title: '海外代表性工作',
      summary: '找到 3 篇代表性工作，按时间线位置排列',
      bullets: [
        'Co-Scientist（Google DeepMind，2026-05）· 时间线：与 Robin 同期，验证 AI 科研闭环可行性 · 解决：展示了面向药物重定位的多智能体科研工作流 · 未解决：没有形成稳定湿实验自动化能力 · https://example.com/co-scientist',
        'Biomni（Stanford，2025-06）· 时间线：比 Robin 更早验证 lab-in-the-loop 的方向价值 · 解决：把多工具调用整合进科研助手工作流 · 未解决：不包含真实湿实验数据回流闭环 · https://example.com/biomni',
        'Virtual Lab（Zou Lab，2025-02）· 时间线：更早期的实验回环探索案例 · 解决：展示 AI 可辅助实验设计和体外验证 · 未解决：闭环仍依赖大量人工参与 · https://example.com/virtual-lab'
      ]
    },
    {
      key: 'domestic',
      title: '国内研究扫描',
      summary: '找到 2 个相关团队（含 1 个商业产品）',
      bullets: [
        '上海 AI 实验室 InternAgent（开源·部分对标）· 面向科研任务的多智能体闭环框架 · 差距：主战场是计算科研，不覆盖真实湿实验数据回流',
        '晶泰科技（商业产品·表面相关）· AI 与自动化实验结合的药物研发平台 · 差距：偏向自动化实验与药物筛选，不做文献驱动假设闭环 · 转化：已有商业收入与公开资本市场验证'
      ]
    },
    {
      key: 'opportunity',
      title: '投资机会分析',
      summary: '领域处于商业化期，发现 3 个机会方向（含 1 个国内窗口）· 主要驱动力：闭环可行性已验证，平台化和实验自动化需求同步上升',
      bullets: [
        '[全球·商业化空缺] AI 科研平台工具层（依据：海外代表工作已验证商业化路径，但国内定位仍有空缺）',
        '[全球·验证空缺] 湿实验自动化与机器人实验室协同平台（依据：领域时间线明确把湿实验自动化视为下一个核心瓶颈）',
        '[国内·商业化空缺] 文献驱动老药新用闭环平台（依据：国内扫描中尚无公开对标团队覆盖完整闭环）'
      ],
      tone: 'success',
      highlight: '领域阶段：商业化期'
    },
    {
      key: 'signals',
      title: '关键待验证信号',
      summary: '以下 3 个信号出现时，意味着可以进入下一步判断 · 最大不确定性：AI 发现能否真正跨越体外验证并进入体内和临床',
      bullets: [
        '[近期(<6个月)] Robin 的候选方向进入 in vivo 动物实验并获得正向结果 → 说明 AI 科研闭环不只停留在体外，开始跨向更高验证层级',
        '[中期(6-24个月)] 第三方独立复现 Robin 或同类系统核心 benchmark → 可显著降低“自测数据”带来的可信度疑虑',
        '[不确定] 国内出现同时具备湿实验能力和闭环科研智能体能力的团队 → 意味着国内投资窗口真正打开'
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
      timelinePosition: '与 Robin 同期，验证 AI 科研闭环可行性',
      solved: '展示了面向药物重定位的多智能体科研工作流',
      unsolved: '没有形成稳定湿实验自动化能力',
      refUrl: 'https://example.com/co-scientist'
    },
    {
      name: 'Biomni',
      institution: 'Stanford',
      date: '2025-06',
      timelinePosition: '比 Robin 更早验证 lab-in-the-loop 的方向价值',
      solved: '把多工具调用整合进科研助手工作流',
      unsolved: '不包含真实湿实验数据回流闭环',
      refUrl: 'https://example.com/biomni'
    },
    {
      name: 'Virtual Lab',
      institution: 'Zou Lab',
      date: '2025-02',
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
      name: '晶泰科技',
      work: 'AI 与自动化实验结合的药物研发平台',
      timelinePosition: '偏工程化与商业化平台',
      attribute: '商业产品',
      matchDegree: '表面相关',
      gap: '偏向自动化实验与药物筛选，不做文献驱动假设闭环',
      commercialization: '已有商业收入与公开资本市场验证',
      refUrl: 'https://example.com/xtalpi'
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
    commercialIntent: '学术成果与商业化并行，论文既是技术里程碑，也是平台能力的外部背书。'
  }
};
