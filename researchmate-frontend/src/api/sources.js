// src/api/sources.js
import client from './client';

export const getSourcesByProject = (projectId) =>
  client.get(`/sources/project/${projectId}`);

export const getSourceById = (id) => client.get(`/sources/${id}`);

export const createSource = (data) => client.post('/sources', data);

export const deleteSource = (id) => client.delete(`/sources/${id}`);

export const searchSources = (keyword) =>
  client.get('/sources/search', { params: { keyword } });

// AI summarization — sends raw text content, receives { sourceId, summary }
export const summarizeSource = (sourceId, content) =>
  client.post(`/sources/${sourceId}/summarize`, { content });

// AI explanation — sends raw text + comprehension level, receives { sourceId, level, explanation }
export const explainSource = (sourceId, content, level) =>
  client.post(`/sources/${sourceId}/explain`, { content, level });

// AI image explanation — multipart/form-data; let axios set the boundary automatically
export const explainImage = (sourceId, imageFile, prompt) => {
  const form = new FormData();
  form.append('image', imageFile);
  if (prompt && prompt.trim()) form.append('prompt', prompt.trim());
  // Set Content-Type to undefined so axios REMOVES the instance-level
  // 'application/json' default and sets multipart/form-data + boundary itself
  return client.post(`/sources/${sourceId}/explain-image`, form, {
    headers: { 'Content-Type': undefined },
  });
};

export const getSourceImages = (sourceId) =>
  client.get(`/sources/${sourceId}/images`);

export const deleteSourceImage = (imageId) =>
  client.delete(`/sources/images/${imageId}`);

