// src/api/auth.js
import client from './client';

export const getMe = () => client.get('/auth/me');

export const updateProfile = (data) => client.put('/auth/profile', data);
