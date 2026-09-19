// src/api/highlights.js
import client from './client';

export const getHighlightsBySource = (sourceId) =>
  client.get(`/highlights/source/${sourceId}`);

export const createHighlight = (data) => client.post('/highlights', data);

export const deleteHighlight = (id) => client.delete(`/highlights/${id}`);
