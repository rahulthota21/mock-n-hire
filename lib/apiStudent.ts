/* Centralised REST helper for Student FastAPI endpoints */
export const APIStudent = async (
    path: string,
    opts: RequestInit & { headers?: Record<string, string> } = {},
  ) => {
    // Student FastAPI runs on localhost:8001
    const url = `http://localhost:8001${path}`;
  
    // Default headers
    const defaults = {
      Accept: "application/json",
    };
    const headers = { ...defaults, ...(opts.headers || {}) };
  
    return fetch(url, { ...opts, headers });
  };
  