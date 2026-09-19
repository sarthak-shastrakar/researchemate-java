// src/api/projects.js
import client from './client';

export const getProjects = () => client.get('/projects');

export const getProjectById = (id) => client.get(`/projects/${id}`);

export const createProject = (data) => client.post('/projects', data);

export const updateProject = (id, data) => client.put(`/projects/${id}`, data);

export const deleteProject = (id) => client.delete(`/projects/${id}`);

// ── Reports ───────────────────────────────────────────────────────────────────
export const generateReport = (projectId, title) =>
  client.post(`/projects/${projectId}/reports`, { title: title || '' });

export const getReports = (projectId) =>
  client.get(`/projects/${projectId}/reports`);

export const downloadReportPdf = (projectId, reportId) =>
  client.get(`/projects/${projectId}/reports/${reportId}/download/pdf`, {
    responseType: 'blob',
  });

export const downloadReportDocx = (projectId, reportId) =>
  client.get(`/projects/${projectId}/reports/${reportId}/download/docx`, {
    responseType: 'blob',
  });

export const deleteReport = (projectId, reportId) =>
  client.delete(`/projects/${projectId}/reports/${reportId}`);

// ── Knowledge Graph ───────────────────────────────────────────────────────────
export const buildKnowledgeGraph = (projectId) =>
  client.post(`/projects/${projectId}/knowledge-graph/build`);

export const getKnowledgeGraph = (projectId) =>
  client.get(`/projects/${projectId}/knowledge-graph`);

