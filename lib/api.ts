/* Centralised REST helper for Recruiter FastAPI endpoints */
export const API = async (
  path: string,
  opts: RequestInit & { headers?: Record<string, string> } = {},
) => {
  // Recruiter FastAPI runs on localhost:4000
  const url = `http://localhost:4000${path}`;

  // Default headers
  const defaults = {
    Accept: "application/json",
  };
  const headers = { ...defaults, ...(opts.headers || {}) };

  return fetch(url, { ...opts, headers });
};
