/**
 * Centralized frontend configuration.
 *
 * Reads VITE_API_URL from environment variables (e.g. configured in Vercel for production),
 * falling back to local backend server at http://localhost:8000.
 */
export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');
