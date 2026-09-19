// src/api/notes.js
import client from './client';

export const getNotesByProject = (projectId) =>
  client.get(`/notes/project/${projectId}`);

export const createNote = (data) => client.post('/notes', data);

export const updateNote = (id, data) => client.put(`/notes/${id}`, data);

export const deleteNote = (id) => client.delete(`/notes/${id}`);
