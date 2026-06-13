export type RiskLevel = '高' | '中' | '低';
export type ArticleType = 'A类论文解读' | 'C类公司/产品发布' | 'A+C混合' | '部分可分析' | 'A类' | 'C类' | '不支持';
export type SectionTone = 'default' | 'info' | 'warning' | 'success';

export interface AnalysisStep {
  key: string;
  title: string;
  description: string;
}

export interface AnalysisSection {
  key: string;
  title: string;
  summary: string;
  bullets: string[];
  highlight?: string;
  tone?: SectionTone;
}

export interface ReferenceItem {
  id: string;
  author: string;
  title: string;
  link: string;
}

export interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

export interface ReportMeta {
  credibility: RiskLevel;
  hypeLevel: RiskLevel;
  toVcRisk?: RiskLevel;
  innovationType: string;
  trl: string;
  industrialWindow: string;
  toVcSignals?: { narrative: number; timing: number; technical: number };
  breakthroughDegree?: '完全解决' | '部分缓解' | '绕过问题';
  fieldStage?: '概念期' | '产品期' | '商业化期' | '成熟期';
}

export interface OverseasWork {
  name: string;
  institution: string;
  date: string;
  timelinePosition: string;
  solved: string;
  unsolved: string;
  refUrl: string;
}

export interface ChinaTeam {
  name: string;
  work: string;
  timelinePosition: string;
  attribute: '学术' | '开源' | '商业产品';
  matchDegree: '完全对标' | '部分对标' | '表面相关';
  gap: string;
  commercialization: string | null;
  refUrl: string;
}

export interface InvestmentSignal {
  trigger: string;
  meaning: string;
  timeWindow: '近期(<6个月)' | '中期(6-24个月)' | '长期(>2年)' | '不确定';
}

export interface InvestmentOpportunity {
  direction: string;
  basis: string;
  gapType: '技术空缺' | '商业化空缺' | '验证空缺';
  scope: '全球' | '国内';
}

export interface ArticleSnapshot {
  sourceName: string;
  sourceAuthor: string;
  publishDate: string;
  articleUrl: string;
  originalMaterial: string;
}

export interface ReportRecord {
  id: string;
  title: string;
  subtitle: string;
  account: string;
  cover: string;
  articleType: ArticleType;
  mode: string;
  generatedAt: string;
  status: string;
  tags: string[];
  meta: ReportMeta;
  articleSnapshot: ArticleSnapshot;
  pipeline: AnalysisStep[];
  timeline: TimelineItem[];
  sections: AnalysisSection[];
  references: ReferenceItem[];
  coreInnovation?: {
    type: string;
    description: string;
    searchKeywords: string[];
  };
  bottleneck?: {
    description: string;
    whyUnsolved: string;
    nextBottleneck: string;
  };
  productization?: {
    dataBarrier: { level: string; benchmark: string };
    computeCost: { level: string; benchmark: string };
    engineeringGap: { level: string; note: string };
    regulation: { level: string; benchmark: string };
  };
  overseasWorks?: OverseasWork[];
  chinaTeams?: ChinaTeam[];
  opportunities?: InvestmentOpportunity[];
  investmentSignals?: InvestmentSignal[];
  hyperDetail?: {
    issues: Array<{ type: string; claim: string; reality: string; severity: string }>;
  };
  teamDetail?: {
    leadAuthor: string;
    institution: string;
    relatedCompany: string | null;
    fundingInfo: string | null;
    chinaConnection: string | null;
    commercialIntent: string;
  };
}

export type AnalysisTaskStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface AnalysisTaskRecord {
  taskId: string;
  status: AnalysisTaskStatus;
  progress: number;
  stage: string;
  message: string;
  reportId?: string;
}
