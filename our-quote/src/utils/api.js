let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token");
  
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch("http://scientific-conference-backend.tutik/api/auth/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken
      })
    });

    if (!response.ok) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/";
      return null;
    }

    const data = await response.json();
    localStorage.setItem("access_token", data.access);
    return data.access;
  } catch (error) {
    console.error("Token refresh failed:", error);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/";
    return null;
  }
}

export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("access_token");
  
  // First attempt
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": options.headers?.["Content-Type"] || "application/json",
    }
  });

  // If 401, try to refresh token
  if (response.status === 401) {
    if (isRefreshing) {
      // Wait for the refresh to complete
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              "Authorization": `Bearer ${token}`,
              "Content-Type": options.headers?.["Content-Type"] || "application/json",
            }
          });
        });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        processQueue(null, newToken);
        
        // Retry original request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            "Authorization": `Bearer ${newToken}`,
            "Content-Type": options.headers?.["Content-Type"] || "application/json",
          }
        });
      } else {
        processQueue(new Error("Token refresh failed"), null);
        window.location.href = "/";
        return response;
      }
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}