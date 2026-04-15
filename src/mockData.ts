import { Project, Job, Entity, PreviewCandidate, PriceSource } from './types';

export const MOCK_PROJECTS: Project[] = [
  {
    project_id: 'p1',
    name: 'Industrial Plant A-12',
    scope: 'Electrical Distribution',
    documents_count: 5,
    jobs_count: 12,
    price_sources_count: 3,
    created_at: '2024-03-10T10:00:00Z',
  },
  {
    project_id: 'p2',
    name: 'Office Complex Beta',
    scope: 'Lighting & Controls',
    documents_count: 2,
    jobs_count: 4,
    price_sources_count: 2,
    created_at: '2024-03-12T14:30:00Z',
  },
];

export const MOCK_JOBS: Job[] = [
  {
    job_id: 'j1',
    document_id: 'doc_001.pdf',
    status: 'completed',
    source_channel: 'web',
    scope: 'Full Scan',
    steps: [
      { name: 'OCR', status: 'done', timestamp: '2024-03-15T09:00:00Z' },
      { name: 'Entity Extraction', status: 'done', timestamp: '2024-03-15T09:05:00Z' },
    ],
    created_at: '2024-03-15T08:55:00Z',
  },
  {
    job_id: 'j2',
    document_id: 'doc_002.pdf',
    status: 'running',
    source_channel: 'folder',
    scope: 'Partial Scan',
    steps: [
      { name: 'OCR', status: 'done', timestamp: '2024-03-15T10:00:00Z' },
      { name: 'Entity Extraction', status: 'running', timestamp: '2024-03-15T10:05:00Z' },
    ],
    created_at: '2024-03-15T09:55:00Z',
  },
];

export const MOCK_CANDIDATES: PreviewCandidate[] = [
  {
    entity_id: 'c1',
    entity_type: 'Circuit Breaker',
    designation: 'QF1',
    name: 'Schneider Electric iC60N 1P 16A B',
    page: 12,
    score: 0.95,
    confidence: 0.98,
    sources_count: 3,
    reasons: ['Exact match in BOM table', 'Found in single-line diagram'],
  },
  {
    entity_id: 'c2',
    entity_type: 'Cable',
    designation: 'W1',
    name: 'VVGng-LS 3x2.5',
    page: 5,
    score: 0.82,
    confidence: 0.85,
    sources_count: 2,
    reasons: ['Pattern match in cable schedule'],
  },
];

export const MOCK_ENTITIES: Entity[] = [
  {
    entity_id: 'e1',
    entity_type: 'Circuit Breaker',
    designation: 'QF1',
    name: 'Schneider Electric iC60N 1P 16A B',
    params: {
      'Rated Current': '16A',
      'Poles': '1P',
      'Curve': 'B',
    },
    qty: 1,
    confidence: 0.98,
    flags: ['verified'],
    sources: [
      {
        raw_id: 'r1',
        page: 12,
        bbox: [100, 200, 300, 220],
        raw_text: 'QF1 iC60N 1P 16A B',
        source_type: 'Table',
        extractor: 'TableExtractorV2',
      },
    ],
  },
];

export const MOCK_PRICE_SOURCES: PriceSource[] = [
  {
    source_id: 'ps1',
    name: 'Main Supplier Portal',
    source_type: 'API',
    reference: 'https://api.supplier.com',
    priority: 1,
    active: true,
  },
  {
    source_id: 'ps2',
    name: 'Local Warehouse CSV',
    source_type: 'File',
    reference: '/data/prices_march.csv',
    priority: 2,
    active: true,
  },
];
