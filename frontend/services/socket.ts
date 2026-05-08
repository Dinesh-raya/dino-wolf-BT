import { io } from 'socket.io-client';

// Use environment variable or relative path (Vite proxy handles it in dev)
const SERVER_URL = import.meta.env.VITE_API_URL || '';

export const socket = io(SERVER_URL, {
  autoConnect: false,
});
