// src/api/tags.js
import client from './client';

export const getTagsBySource = (sourceId) =>
  client.get(`/tags/source/${sourceId}`);

export const addTag = (data) => client.post('/tags', data);

export const removeTag = (sourceId, tagId) =>
  client.delete(`/tags/source/${sourceId}/tag/${tagId}`);
