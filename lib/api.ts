/* Centralised REST helper for FastAPI endpoints */
export const API = async (
  path: string,
  opts: RequestInit & { headers?: Record<string, string> } = {},
) => {
  /* FastAPI lives on localhost:4000  */
  const url = `http://localhost:4000${path}`;

  /* allow callers to add / override headers cleanly */
  const defaults = {
    Accept: "application/json",
  };
  const headers = { ...defaults, ...(opts.headers || {}) };

  return fetch(url, { ...opts, headers });
};
