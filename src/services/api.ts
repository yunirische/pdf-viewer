import { Project, Job, Entity, PreviewCandidate, PriceSource } from '../types';
import { MOCK_PROJECTS, MOCK_JOBS, MOCK_CANDIDATES, MOCK_ENTITIES, MOCK_PRICE_SOURCES } from '../mockData';

// Simulating FastAPI endpoints
export const api = {
  projects: {
    list: async (): Promise<Project[]> => {
      await new Promise(r => setTimeout(r, 500));
      return MOCK_PROJECTS;
    },
    get: async (id: string): Promise<Project | undefined> => {
      await new Promise(r => setTimeout(r, 300));
      return MOCK_PROJECTS.find(p => p.project_id === id);
    },
    create: async (name: string, scope: string): Promise<Project> => {
      await new Promise(r => setTimeout(r, 800));
      const newProject: Project = {
        project_id: `p${Date.now()}`,
        name,
        scope,
        documents_count: 0,
        jobs_count: 0,
        price_sources_count: 0,
        created_at: new Date().toISOString(),
      };
      return newProject;
    }
  },
  jobs: {
    list: async (projectId: string): Promise<Job[]> => {
      await new Promise(r => setTimeout(r, 400));
      return MOCK_JOBS;
    }
  },
  entities: {
    list: async (projectId: string): Promise<Entity[]> => {
      await new Promise(r => setTimeout(r, 600));
      return MOCK_ENTITIES;
    }
  },
  preview: {
    run: async (projectId: string): Promise<PreviewCandidate[]> => {
      await new Promise(r => setTimeout(r, 2000)); // Simulate heavy processing
      return MOCK_CANDIDATES;
    }
  },
  pricing: {
    list: async (projectId: string): Promise<PriceSource[]> => {
      await new Promise(r => setTimeout(r, 300));
      return MOCK_PRICE_SOURCES;
    }
  }
};
