export type Project = {
  project_id: string;
  name: string;
  scope: string;
  documents_count: number;
  jobs_count: number;
  price_sources_count: number;
  created_at: string;
};

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type Job = {
  job_id: string;
  document_id: string;
  status: JobStatus;
  source_channel: 'web' | 'telegram' | 'folder';
  scope: string;
  steps: { name: string; status: string; timestamp: string }[];
  created_at: string;
};

export type Source = {
  raw_id: string;
  page: number;
  bbox: [number, number, number, number];
  raw_text: string;
  source_type: string;
  extractor: string;
};

export type Entity = {
  entity_id: string;
  entity_type: string;
  designation: string;
  name: string;
  params: Record<string, string>;
  qty: number;
  confidence: number;
  flags: string[];
  sources: Source[];
};

export type PreviewCandidate = {
  entity_id: string;
  entity_type: string;
  designation: string;
  name: string;
  page: number;
  score: number;
  confidence: number;
  sources_count: number;
  reasons: string[];
};

export type PriceSource = {
  source_id: string;
  name: string;
  source_type: string;
  reference: string;
  priority: number;
  active: boolean;
};

export type Artifact = {
  name: string;
  type: string;
  url: string;
  size: number;
};
