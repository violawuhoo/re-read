export type RiskLevel = '高' | '中' | '低';
export type ArticleType = 'A类论文解读' | 'C类公司/产品发布' | 'A+C混合' | '部分可分析';
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
