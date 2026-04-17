import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  BookOpenText,
  CheckCheck,
  ChevronRight,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { PdfSourceViewer } from './components/PdfSourceViewer';
import { api } from './services/api';
import type { BOM, Entity, Estimate, Job, ProjectMeta, ProjectSummary, SelectionRecord } from './types';

type Scope = 'all_electrical' | 'panel_only' | 'supply_only' | 'custom';

const scopeOptions: Scope[] = ['all_electrical', 'panel_only', 'supply_only', 'custom'];

function fmt(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function percent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function scopeLabel(scope: string): string {
  const labels: Record<string, string> = {
    all_electrical: 'Вся электрика',
    panel_only: 'Только щиты',
    supply_only: 'Только питание',
    custom: 'Своя область',
  };
  return labels[scope] ?? scope.replaceAll('_', ' ');
}

function statusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    done: 'Готово',
    failed: 'Ошибка',
    running: 'В работе',
    pending: 'Ожидает',
    idle: 'Не запускалось',
    priced: 'Смета готова',
    needs_review: 'Нужна проверка',
  };
  return labels[status || 'idle'] ?? (status || 'Не запускалось');
}

function statusTone(status: string | null | undefined): string {
  if (status === 'done' || status === 'priced') return 'tone-success';
  if (status === 'failed') return 'tone-danger';
  if (status === 'needs_review') return 'tone-warn';
  if (status === 'running' || status === 'pending') return 'tone-info';
  return 'tone-muted';
}

function badgeForType(entityType: string): string {
  if (entityType.includes('panel')) return 'badge badge-blue';
  if (entityType.includes('cable')) return 'badge badge-teal';
  if (entityType.includes('relay') || entityType.includes('contactor')) return 'badge badge-violet';
  if (entityType.includes('load')) return 'badge badge-amber';
  return 'badge badge-gray';
}

export default function App() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selection, setSelection] = useState<SelectionRecord | null>(null);
  const [bom, setBom] = useState<BOM | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [viewerPage, setViewerPage] = useState<number | null>(null);
  const [scope, setScope] = useState<Scope>('all_electrical');
  const [loading, setLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [runningExtract, setRunningExtract] = useState(false);
  const [buildingBom, setBuildingBom] = useState(false);
  const [pricingEstimate, setPricingEstimate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [quickQuery, setQuickQuery] = useState('');
  const [agentNote, setAgentNote] = useState('');

  const fileRef = useRef<HTMLInputElement | null>(null);

  const activeProject = useMemo(
    () => projects.find((item) => item.project_id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const documents = project?.documents ?? [];
  const selectedDocument = useMemo(
    () => documents.find((item) => item.document_id === selectedDocumentId) ?? documents.at(-1) ?? documents[0] ?? null,
    [documents, selectedDocumentId],
  );
  const selectedEntity = useMemo(
    () => entities.find((item) => item.entity_id === selectedEntityId) ?? entities[0] ?? null,
    [entities, selectedEntityId],
  );
  const latestJob = jobs[0] ?? project?.jobs.at(-1) ?? null;
  const canWork = Boolean(activeProjectId);
  const canExtract = Boolean(activeProjectId && selectedDocument);
  const canExport = Boolean(activeProjectId && (bom?.total_items ?? 0) > 0);

  const viewerUrl = useMemo(() => {
    if (!activeProjectId || !selectedDocument) return '';
    const url = new URL(
      api.documents.fileUrl(activeProjectId, selectedDocument.document_id),
      window.location.origin,
    );
    if (viewerPage) url.hash = `page=${viewerPage}`;
    return url.toString();
  }, [activeProjectId, selectedDocument, viewerPage]);

  async function loadProject(projectId: string) {
    setActiveProjectId(projectId);
    try {
      const [meta, jobList, entityList] = await Promise.all([
        api.projects.get(projectId),
        api.jobs.list(projectId),
        api.entities.list(projectId),
      ]);
      setProject(meta);
      setJobs(jobList);
      setEntities(entityList);
      setScope(meta.scope as Scope);
      setSelectedDocumentId(meta.documents.at(-1)?.document_id ?? meta.documents[0]?.document_id ?? '');
      setSelectedEntityId(entityList[0]?.entity_id ?? '');
      setViewerPage(entityList[0]?.sources[0]?.page ?? null);
      setSelection(meta.selection_records.at(-1) ?? null);
      try {
        setBom(await api.bom.get(projectId));
      } catch {
        setBom(null);
      }
      try {
        setEstimate(await api.estimate.get(projectId));
      } catch {
        setEstimate(null);
      }
    } catch (error) {
      toast.error(`Не удалось загрузить проект: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function loadProjects(initialId?: string) {
    setLoading(true);
    try {
      const list = await api.projects.list();
      setProjects(list);
      const nextId = initialId ?? activeProjectId ?? list[0]?.project_id ?? '';
      if (nextId) await loadProject(nextId);
    } catch (error) {
      toast.error(`Не удалось загрузить проекты: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects().catch(() => undefined);
  }, []);

  async function handleCreateProject() {
    if (!newProjectName.trim()) {
      toast.error('Введите имя проекта');
      return;
    }
    setCreatingProject(true);
    try {
      const created = await api.projects.create(newProjectName.trim(), scope);
      setNewProjectName('');
      toast.success('Проект создан');
      await loadProjects(created.project_id);
    } catch (error) {
      toast.error(`Не удалось создать проект: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleUpload() {
    if (!activeProjectId) {
      toast.error('Сначала выберите или создайте проект');
      return;
    }
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Выберите PDF файл');
      return;
    }
    setUploading(true);
    try {
      await api.projects.upload(activeProjectId, file, 'web');
      toast.success('PDF загружен');
      if (fileRef.current) fileRef.current.value = '';
      await loadProject(activeProjectId);
    } catch (error) {
      toast.error(`Не удалось загрузить PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdateScope(nextScope: Scope) {
    setScope(nextScope);
    if (!activeProjectId) return;
    try {
      await api.projects.updateScope(activeProjectId, nextScope);
      await loadProject(activeProjectId);
    } catch (error) {
      toast.error(`Не удалось обновить область: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleExtract() {
    if (!canExtract) {
      toast.error('Сначала загрузите PDF');
      return;
    }
    setRunningExtract(true);
    try {
      await api.projects.runExtract(activeProjectId);
      toast.success('Разбор PDF завершен');
      await loadProject(activeProjectId);
    } catch (error) {
      toast.error(`Разбор не выполнился: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRunningExtract(false);
    }
  }

  async function handleBuildBom() {
    if (!activeProjectId) return;
    setBuildingBom(true);
    try {
      const result = await api.bom.build(activeProjectId);
      setBom(result);
      toast.success('Спецификация собрана');
    } catch (error) {
      toast.error(`Не удалось собрать спецификацию: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBuildingBom(false);
    }
  }

  async function handleBuildEstimate() {
    if (!activeProjectId) return;
    setPricingEstimate(true);
    try {
      const result = await api.estimate.build(activeProjectId, {
        assembly_multiplier: 2,
        price_overrides: {},
        notes: agentNote,
      });
      setEstimate(result);
      toast.success('Расчет готов');
    } catch (error) {
      toast.error(`Не удалось посчитать: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPricingEstimate(false);
    }
  }

  async function handleExport(format: 'xlsx' | 'csv' | 'json') {
    if (!activeProjectId) return;
    try {
      await api.export.download(activeProjectId, format);
      toast.success(`Файл ${format} скачан`);
    } catch (error) {
      toast.error(`Не удалось скачать файл: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function openEntity(entity: Entity) {
    setSelectedEntityId(entity.entity_id);
    setViewerPage(entity.sources[0]?.page ?? null);
  }

  const visibleEntities = quickQuery.trim()
    ? entities.filter((entity) => {
        const query = quickQuery.trim().toLowerCase();
        return `${entity.entity_type} ${entity.designation} ${entity.name} ${JSON.stringify(entity.params)}`
          .toLowerCase()
          .includes(query);
      })
    : entities.slice(0, 12);

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__copy">
          <div className="eyebrow">PDF Спец</div>
          <h1>Простой разбор PDF в спецификацию</h1>
          <p>
            Один рабочий сценарий: создайте проект, загрузите PDF, запустите разбор, проверьте найденные позиции и
            скачайте результат.
          </p>
        </div>
        <div className="hero__actions">
          <button className="btn btn-secondary" onClick={() => loadProjects(activeProjectId)} disabled={loading}>
            <RefreshCw size={16} />
            Обновить
          </button>
          <button className="btn btn-primary" onClick={() => handleExport('xlsx')} disabled={!canExport}>
            <ArrowDownToLine size={16} />
            Скачать XLSX
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="project-panel">
          <article className="card setup-card">
            <div className="card__header">
              <div>
                <div className="eyebrow subtle">Шаг 1</div>
                <h2>Проект</h2>
              </div>
              <FolderOpen size={18} />
            </div>
            <div className="card__body stack">
              <label className="field">
                <span>Новый проект</span>
                <input
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  placeholder="Например: Школа, корпус А"
                />
              </label>
              <label className="field">
                <span>Что искать</span>
                <select value={scope} onChange={(event) => handleUpdateScope(event.target.value as Scope)}>
                  {scopeOptions.map((item) => (
                    <option key={item} value={item}>
                      {scopeLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary btn-wide" onClick={handleCreateProject} disabled={creatingProject}>
                {creatingProject ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
                Создать проект
              </button>
            </div>
          </article>

          <article className="card project-list-card">
            <div className="card__header">
              <div>
                <div className="eyebrow subtle">Активный проект</div>
                <h2>{project?.name ?? activeProject?.name ?? 'Не выбран'}</h2>
              </div>
            </div>
            <div className="card__body stack">
              {loading ? <p className="hint">Загружаю проекты...</p> : null}
              <div className="project-list compact-list">
                {projects.map((item) => (
                  <button
                    key={item.project_id}
                    className={`project-item ${item.project_id === activeProjectId ? 'active' : ''}`}
                    onClick={() => loadProject(item.project_id)}
                  >
                    <div className="project-item__title">
                      <span>{item.name}</span>
                      <ChevronRight size={14} />
                    </div>
                    <div className="project-item__meta">
                      <span>{item.documents_count} PDF</span>
                      <span>{statusLabel(item.latest_job_status)}</span>
                    </div>
                  </button>
                ))}
              </div>
              {!projects.length && !loading ? <p className="hint">Пока нет проектов. Создайте первый слева.</p> : null}
            </div>
          </article>
        </section>

        <section className="flow-panel">
          <article className="card primary-flow">
            <div className="card__header">
              <div>
                <div className="eyebrow subtle">Шаг 2</div>
                <h2>Загрузить и обработать PDF</h2>
              </div>
              <Upload size={18} />
            </div>
            <div className="card__body">
              <div className="simple-steps">
                <div className="simple-step">
                  <span className="step-number">1</span>
                  <div>
                    <strong>Выберите PDF</strong>
                    <p className="hint">Файл попадет в текущий проект.</p>
                  </div>
                  <input ref={fileRef} type="file" accept="application/pdf" disabled={!canWork} />
                </div>

                <div className="simple-step">
                  <span className="step-number">2</span>
                  <div>
                    <strong>Запустите разбор</strong>
                    <p className="hint">Сейчас работает локальный pipeline. Агент OpenClaw подключим отдельно после auth.</p>
                  </div>
                  <div className="row">
                    <button className="btn btn-primary" onClick={handleUpload} disabled={!canWork || uploading}>
                      {uploading ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
                      Загрузить
                    </button>
                    <button className="btn btn-secondary" onClick={handleExtract} disabled={!canExtract || runningExtract}>
                      {runningExtract ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                      Разобрать
                    </button>
                  </div>
                </div>

                <div className="simple-step">
                  <span className="step-number">3</span>
                  <div>
                    <strong>Получите спецификацию</strong>
                    <p className="hint">После проверки можно собрать BOM, посчитать и скачать файл.</p>
                  </div>
                  <div className="row">
                    <button className="btn btn-secondary" onClick={handleBuildBom} disabled={!activeProjectId || buildingBom}>
                      {buildingBom ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                      Собрать BOM
                    </button>
                    <button className="btn btn-secondary" onClick={handleBuildEstimate} disabled={!activeProjectId || pricingEstimate}>
                      {pricingEstimate ? <Loader2 className="spin" size={16} /> : <CheckCheck size={16} />}
                      Посчитать
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <section className="status-strip">
            <article className="stat">
              <div className="stat__label">PDF</div>
              <div className="stat__value">{documents.length}</div>
              <div className="stat__hint">{selectedDocument?.filename ?? 'Файл не загружен'}</div>
            </article>
            <article className="stat">
              <div className="stat__label">Статус</div>
              <div className="stat__value compact-value">{statusLabel(latestJob?.status)}</div>
              <div className="stat__hint">{latestJob ? formatDate(latestJob.updated_at) : 'Нет запусков'}</div>
            </article>
            <article className="stat">
              <div className="stat__label">Позиции</div>
              <div className="stat__value">{entities.length}</div>
              <div className="stat__hint">Найденные элементы</div>
            </article>
            <article className="stat">
              <div className="stat__label">BOM</div>
              <div className="stat__value">{bom?.total_items ?? 0}</div>
              <div className="stat__hint">Сумма: {estimate?.total_cost ?? bom?.total_cost ?? '—'}</div>
            </article>
          </section>

          <section className="review-grid">
            <article className="card document-card">
              <div className="card__header">
                <div>
                  <div className="eyebrow subtle">Шаг 3</div>
                  <h2>Проверить документ</h2>
                </div>
                {viewerPage ? <span className="badge badge-gray">стр. {viewerPage}</span> : null}
              </div>
              <div className="card__body stack">
                {documents.length > 1 ? (
                  <label className="field">
                    <span>Документ</span>
                    <select value={selectedDocumentId} onChange={(event) => setSelectedDocumentId(event.target.value)}>
                      {documents.map((document) => (
                        <option key={document.document_id} value={document.document_id}>
                          {document.filename}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {selectedDocument ? (
                  <PdfSourceViewer
                    pdfUrl={viewerUrl}
                    page={viewerPage}
                    sources={selectedEntity?.sources ?? []}
                    onPageChange={setViewerPage}
                  />
                ) : (
                  <div className="empty-state">
                    <Upload size={28} />
                    <h3>PDF еще не загружен</h3>
                    <p>Создайте проект и загрузите файл. После разбора здесь появится просмотр документа.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="card result-card">
              <div className="card__header">
                <div>
                  <div className="eyebrow subtle">Результат</div>
                  <h2>Найденные позиции</h2>
                </div>
                <BookOpenText size={18} />
              </div>
              <div className="card__body stack">
                <label className="field search-field">
                  <span>Быстрый поиск</span>
                  <div className="input-with-icon">
                    <Search size={16} />
                    <input
                      value={quickQuery}
                      onChange={(event) => setQuickQuery(event.target.value)}
                      placeholder="QF, кабель, щит, автомат..."
                    />
                  </div>
                </label>

                {!entities.length ? (
                  <div className="empty-state compact">
                    <FileText size={24} />
                    <h3>Позиции пока не найдены</h3>
                    <p>Запустите разбор PDF. Агентский сценарий появится после подключения OpenClaw auth.</p>
                  </div>
                ) : (
                  <div className="entity-list">
                    {visibleEntities.map((entity) => (
                      <button
                        key={entity.entity_id}
                        className={`entity-card ${selectedEntity?.entity_id === entity.entity_id ? 'active' : ''}`}
                        onClick={() => openEntity(entity)}
                      >
                        <div>
                          <span className={badgeForType(entity.entity_type)}>{entity.entity_type}</span>
                          <strong>{entity.designation || entity.name || entity.entity_id}</strong>
                          <p>{entity.name || 'Без названия'}</p>
                        </div>
                        <div className="entity-card__meta">
                          <span>{entity.qty} шт.</span>
                          <span>{percent(entity.confidence)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedEntity ? (
                  <div className="detail-box">
                    <div className="detail-box__head">
                      <strong>{selectedEntity.designation || selectedEntity.name || 'Выбранная позиция'}</strong>
                      <span className="badge badge-gray">{selectedEntity.sources.length} источн.</span>
                    </div>
                    <p className="hint">{selectedEntity.sources[0]?.raw_text || 'Нет исходного текста для выбранной позиции.'}</p>
                    <div className="row">
                      {selectedEntity.sources.slice(0, 4).map((source) => (
                        <button
                          key={source.raw_id}
                          className="btn btn-secondary btn-small"
                          onClick={() => setViewerPage(source.page)}
                        >
                          Стр. {source.page}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="download-row">
                  <button className="btn btn-primary" onClick={() => handleExport('xlsx')} disabled={!canExport}>
                    <ArrowDownToLine size={16} />
                    XLSX
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExport('csv')} disabled={!canExport}>
                    CSV
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExport('json')} disabled={!activeProjectId}>
                    JSON
                  </button>
                </div>
              </div>
            </article>
          </section>

          <details className="advanced-panel">
            <summary>Дополнительно: агент, история и отладочная информация</summary>
            <div className="advanced-grid">
              <article className="card inner-card">
                <div className="card__header">
                  <div>
                    <div className="eyebrow subtle">OpenClaw</div>
                    <h3>Агент пока не подключен</h3>
                  </div>
                </div>
                <div className="card__body stack">
                  <p className="hint">
                    Сейчас интерфейс работает через API проекта. Агентский режим будет включен после успешной авторизации
                    OpenClaw.
                  </p>
                  <textarea
                    value={agentNote}
                    onChange={(event) => setAgentNote(event.target.value)}
                    placeholder="Заметка для будущего агентского запуска"
                  />
                  <div className="mini-stat">
                    <span>Selection</span>
                    <strong>{selection?.selection_id ? selection.selection_id.slice(0, 8) : '—'}</strong>
                  </div>
                </div>
              </article>

              <article className="card inner-card">
                <div className="card__header">
                  <div>
                    <div className="eyebrow subtle">История</div>
                    <h3>Последние запуски</h3>
                  </div>
                </div>
                <div className="card__body stack">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.job_id} className="job-row">
                      <strong>{job.job_id.slice(0, 8)}</strong>
                      <span className={`badge ${statusTone(job.status)}`}>{statusLabel(job.status)}</span>
                      <span className="muted tiny">{formatDate(job.updated_at)}</span>
                    </div>
                  ))}
                  {!jobs.length ? <p className="hint">Истории пока нет.</p> : null}
                </div>
              </article>
            </div>
          </details>
        </section>
      </main>
    </div>
  );
}
