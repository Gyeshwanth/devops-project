// src/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: `http://${process.env.REACT_APP_API}/api`, // full backend URL
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default instance;

