const mockArticlePayload = {
  articleUrl: 'https://mp.weixin.qq.com/s/mock-robin-report',
  sourceName: 'AI Crossfields Insights',
  resolvedSourceName: 'AI Crossfields Insights',
  resolvedTitle: 'Nature：AI 自己跑完了一轮科学发现闭环，Robin 让 AI4S 更像真正的科研合作者',
  resolvedPublishDate: '2026-06-12',
  content: `FutureHouse 在 Nature 发布了 Robin 系统，文章将其定义为第一个在真实湿实验里完成完整科学发现闭环的多智能体系统。

公众号正文强调三点：第一，Robin 能在 30 分钟内提出新的治疗候选方向；第二，它通过 Finch、Crow、Owl 等多个智能体协作，把文献阅读、假设形成、实验设计和数据回流连成一个闭环；第三，这意味着 AI4S 已经从“辅助科研”进入“自动科研”的新阶段。

文章同时提到，Robin 的实验对象是 AMD 相关的 ROCK 抑制剂重定位问题，验证方式包括类器官和原代细胞实验。作者认为它最大的意义不在于单个模型性能，而在于首次让 AI 自己走完“读文献-提假设-做实验-更新结论”的循环。

不过文中也提到一些局限：湿实验执行仍需人工，Finch 在复杂生信任务上的正确率仍然偏低，目前验证还停留在体外，没有进入动物实验和临床阶段。`,
  originalMaterial: 'Nature 论文 + FutureHouse 官方说明'
};

const mockAgentResult = {
  adapter: 'mock-template',
  articleType: 'A类',
  credibility: '中',
  hypeLevel: '中',
  toVcRisk: '低',
  innovationType: '应用创新',
  reportStatus: '已完成 SOP 六模块分析 · A类',
  p0: {
    type: 'A类',
    subtype: null,
    confidence: 0.94,
    reason: '文章围绕一篇具体 Nature 论文展开，并给出明确系统名称与实验结果。',
    source_hint: 'Nature 2026 Robin / FutureHouse',
    can_proceed: true,
    partial_note: null
  },
  m1: {
    credibility: '中',
    author_background: '学术跨界解读号，长期跟踪 AI4S 论文并有引用原文习惯',
    interest_conflict: false,
    interest_conflict_note: null,
    exaggeration_level: '中',
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
    ],
    recommend_original: true,
    summary: '账号具备学术背景，无明显利益相关，但标题对“自动科研”的表述略超论文原始 claim。'
  },
  m2: {
    team: {
      lead_author: 'Samuel Rodriques',
      institution: 'FutureHouse',
      related_company: 'Edison Scientific',
      funding_info: '2025 年完成 7000 万美元种子轮融资',
      china_connection: '无'
    },
    commercial_intent: '学术成果与商业化并行，论文既是技术里程碑，也是平台能力的外部背书。',
    to_vc_risk: {
      level: '低',
      narrative_signals: 0,
      timing_signals: 1,
      technical_signals: 0,
      note: '论文发布时间与融资节点接近，但技术细节披露较充分。'
    },
    core_claim: 'Robin 首次在真实湿实验里完成文献检索、假设形成、实验设计与结果回流的完整 AI 科研闭环。',
    limitations: [
      '湿实验执行仍依赖人工，闭环没有真正实现无人化',
      'Finch 在复杂生信任务上的正确率仍然有限',
      '当前验证停留在体外和原代细胞层面，未进入 in vivo 与临床'
    ],
    innovation: {
      type: '应用创新',
      description: '以人做不到的规模把文献线索、假设生成与湿实验回流拼成一条可验证的科学发现链。',
      search_keywords: [
        'lab-in-the-loop',
        'multi-agent scientific discovery',
        'wet experiment feedback loop'
      ]
    }
  },
  m3: {
    bottleneck: {
      description: 'AI4S 过去多停留在单点工具，无法把实验结果结构化回流到下一轮假设更新。',
      why_unsolved: '过去缺少把文献智能体、实验设计智能体和湿实验结果整合成闭环的系统工程能力。'
    },
    breakthrough: {
      degree: '部分缓解',
      explanation: 'Robin 的价值在于系统级闭环集成，而不是提出新的基础算法范式。',
      next_bottleneck: '湿实验自动化仍是核心短板，机器人实验室是下一阶段必须补齐的一环。'
    },
    productization: {
      data_barrier: {
        level: '低',
        benchmark: '主要依赖公开文献和可获取实验流程，对比拥有私有实验数据库的平台护城河较弱'
      },
      compute_cost: {
        level: '低',
        benchmark: '相较大规模湿实验筛选，推理与假设生成成本显著更低'
      },
      engineering_gap: {
        level: '中',
        note: '从论文 demo 到稳定产品仍需要实验室系统集成、流程编排与质控'
      },
      regulation: {
        level: '中等',
        benchmark: '科研工具层监管较轻，但真正进入药物开发仍要面对传统药政路径'
      }
    },
    trl: {
      score: 5,
      reference_case: '接近 AlphaFold 论文刚发布时的工具成熟度',
      time_window: {
        tool_layer: '1-3年内可作为科研平台能力商业化',
        application_layer: '5-10年才可能走到临床与规模化应用'
      }
    }
  },
  m4: {
    timeline: {
      origin: 'PaperQA、AI Scientist、Tx-LLM 等单点工具分别解决文献、假设和预测问题',
      current_frontier: '多智能体闭环加湿实验数据回流正在成为 2026 年前沿验证方向',
      next_challenge: '湿实验全自动化与机器人实验室整合仍是公认下一难题',
      this_work_position: 'Robin 位于闭环可行性已被证明、产业化刚起步的阶段'
    },
    overseas_works: [
      {
        name: 'Co-Scientist',
        institution: 'Google DeepMind',
        date: '2026-05',
        timeline_position: '与 Robin 同期，验证 AI 科研闭环可行性',
        solved: '展示了面向药物重定位的多智能体科研工作流',
        unsolved: '没有形成稳定湿实验自动化能力',
        ref_url: 'https://example.com/co-scientist'
      },
      {
        name: 'Biomni',
        institution: 'Stanford',
        date: '2025-06',
        timeline_position: '比 Robin 更早验证 lab-in-the-loop 的方向价值',
        solved: '把多工具调用整合进科研助手工作流',
        unsolved: '不包含真实湿实验数据回流闭环',
        ref_url: 'https://example.com/biomni'
      },
      {
        name: 'Virtual Lab',
        institution: 'Zou Lab',
        date: '2025-02',
        timeline_position: '更早期的实验回环探索案例',
        solved: '展示 AI 可辅助实验设计和体外验证',
        unsolved: '闭环仍依赖大量人工参与',
        ref_url: 'https://example.com/virtual-lab'
      }
    ],
    china_teams: [
      {
        name: '上海 AI 实验室 InternAgent',
        work: '面向科研任务的多智能体闭环框架',
        timeline_position: '计算科研闭环方向的先行探索',
        attribute: '开源',
        match_degree: '部分对标',
        gap: '主战场是计算科研，不覆盖真实湿实验数据回流',
        commercialization: null,
        ref_url: 'https://example.com/internagent'
      },
      {
        name: '晶泰科技',
        work: 'AI 与自动化实验结合的药物研发平台',
        timeline_position: '偏工程化与商业化平台',
        attribute: '商业产品',
        match_degree: '表面相关',
        gap: '偏向自动化实验与药物筛选，不做文献驱动假设闭环',
        commercialization: '已有商业收入与公开资本市场验证',
        ref_url: 'https://example.com/xtalpi'
      }
    ]
  },
  m5: {
    field_stage: {
      phase: '商业化期',
      main_driver: '闭环可行性已验证，平台化和实验自动化需求同步上升',
      key_uncertainty: 'AI 发现能否真正跨越体外验证并进入体内和临床'
    },
    opportunities: [
      {
        direction: 'AI 科研平台工具层',
        basis: '海外代表工作已验证商业化路径，但国内定位仍有空缺',
        gap_type: '商业化空缺',
        scope: '全球'
      },
      {
        direction: '湿实验自动化与机器人实验室协同平台',
        basis: '领域时间线明确把湿实验自动化视为下一个核心瓶颈',
        gap_type: '验证空缺',
        scope: '全球'
      },
      {
        direction: '文献驱动老药新用闭环平台',
        basis: '国内扫描中尚无公开对标团队覆盖完整闭环',
        gap_type: '商业化空缺',
        scope: '国内'
      }
    ],
    signals: [
      {
        trigger: 'Robin 的候选方向进入 in vivo 动物实验并获得正向结果',
        meaning: '说明 AI 科研闭环不只停留在体外，开始跨向更高验证层级',
        time_window: '近期(<6个月)'
      },
      {
        trigger: '第三方独立复现 Robin 或同类系统核心 benchmark',
        meaning: '可显著降低“自测数据”带来的可信度疑虑',
        time_window: '中期(6-24个月)'
      },
      {
        trigger: '国内出现同时具备湿实验能力和闭环科研智能体能力的团队',
        meaning: '意味着国内投资窗口真正打开',
        time_window: '不确定'
      }
    ]
  }
};

module.exports = {
  mockArticlePayload,
  mockAgentResult
};
