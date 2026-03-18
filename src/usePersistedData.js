import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "conges-tracker-data";
const GITHUB_CONFIG_KEY = "conges-tracker-github";

// ── GitHub API helpers ──

function getGitHubConfig() {
  try {
    return JSON.parse(localStorage.getItem(GITHUB_CONFIG_KEY)) || null;
  } catch {
    return null;
  }
}

function saveGitHubConfig(config) {
  localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
}

function clearGitHubConfig() {
  localStorage.removeItem(GITHUB_CONFIG_KEY);
}

async function githubFetch(config, method = "GET", body = null) {
  const { owner, repo, token } = config;
  const path = "public/data/seed.json";
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API ${res.status}`);
  }
  return res.json();
}

async function pullFromGitHub(config) {
  const result = await githubFetch(config);
  const content = atob(result.content);
  const data = JSON.parse(content);
  return { data, sha: result.sha };
}

async function pushToGitHub(config, data, sha) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  const result = await githubFetch(config, "PUT", {
    message: `Update conges data (${new Date().toISOString().slice(0, 10)})`,
    content,
    sha,
  });
  return result.content.sha;
}

// ── Hook ──

export default function usePersistedData() {
  const [data, setDataState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [syncError, setSyncError] = useState(null);
  const [githubConfig, setGithubConfigState] = useState(() => getGitHubConfig());
  const shaRef = useRef(null);

  // ── Initial load ──
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const config = getGitHubConfig();

      // Try GitHub first if configured
      if (config) {
        try {
          setSyncStatus("syncing");
          const { data: ghData, sha } = await pullFromGitHub(config);
          if (cancelled) return;
          shaRef.current = sha;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(ghData));
          setDataState(ghData);
          setSyncStatus("synced");
          setLoading(false);
          return;
        } catch (err) {
          if (cancelled) return;
          setSyncError(err.message);
          setSyncStatus("error");
          // Fall through to localStorage/seed
        }
      }

      // Try localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setDataState(JSON.parse(stored));
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Fall back to seed.json
      try {
        const res = await fetch(import.meta.env.BASE_URL + "data/seed.json");
        const seed = await res.json();
        if (cancelled) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        setDataState(seed);
      } catch {
        // Last resort
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Push to GitHub (background) ──
  const syncToGitHub = useCallback(async (newData) => {
    const config = getGitHubConfig();
    if (!config) return;

    setSyncStatus("syncing");
    setSyncError(null);
    try {
      // Get latest sha if we don't have one
      if (!shaRef.current) {
        const { sha } = await pullFromGitHub(config);
        shaRef.current = sha;
      }
      const newSha = await pushToGitHub(config, newData, shaRef.current);
      shaRef.current = newSha;
      setSyncStatus("synced");
    } catch (err) {
      setSyncError(err.message);
      setSyncStatus("error");
      // If sha mismatch (409 conflict), refetch sha and retry once
      if (err.message.includes("409") || err.message.toLowerCase().includes("sha")) {
        try {
          const { sha } = await pullFromGitHub(config);
          shaRef.current = sha;
          const newSha = await pushToGitHub(config, newData, sha);
          shaRef.current = newSha;
          setSyncStatus("synced");
          setSyncError(null);
        } catch (retryErr) {
          setSyncError(retryErr.message);
          setSyncStatus("error");
        }
      }
    }
  }, []);

  // ── Set data (localStorage + GitHub) ──
  const setData = useCallback((updater) => {
    setDataState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      syncToGitHub(next);
      return next;
    });
  }, [syncToGitHub]);

  // ── Configure GitHub ──
  const configureGitHub = useCallback(async (config) => {
    // Test connection
    const { data: ghData, sha } = await pullFromGitHub(config);
    shaRef.current = sha;
    saveGitHubConfig(config);
    setGithubConfigState(config);
    // Sync: push current local data to GitHub
    if (data) {
      const newSha = await pushToGitHub(config, data, sha);
      shaRef.current = newSha;
    }
    setSyncStatus("synced");
    setSyncError(null);
  }, [data]);

  const disconnectGitHub = useCallback(() => {
    clearGitHubConfig();
    setGithubConfigState(null);
    shaRef.current = null;
    setSyncStatus("idle");
    setSyncError(null);
  }, []);

  // ── Force pull from GitHub ──
  const forcePull = useCallback(async () => {
    const config = getGitHubConfig();
    if (!config) return;
    setSyncStatus("syncing");
    try {
      const { data: ghData, sha } = await pullFromGitHub(config);
      shaRef.current = sha;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ghData));
      setDataState(ghData);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (err) {
      setSyncError(err.message);
      setSyncStatus("error");
    }
  }, []);

  // ── Reset to seed ──
  const resetToSeed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLoading(true);
    fetch(import.meta.env.BASE_URL + "data/seed.json")
      .then((r) => r.json())
      .then((seed) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        setDataState(seed);
        setLoading(false);
        syncToGitHub(seed);
      });
  }, [syncToGitHub]);

  // ── Export ──
  const exportData = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conges-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  // ── Import ──
  const importData = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (!imported.employee || !imported.periods || !imported.leavesTaken) {
            reject(new Error("Format JSON invalide"));
            return;
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
          setDataState(imported);
          syncToGitHub(imported);
          resolve();
        } catch {
          reject(new Error("Fichier JSON invalide"));
        }
      };
      reader.readAsText(file);
    });
  }, [syncToGitHub]);

  return {
    data, setData, loading,
    resetToSeed, exportData, importData,
    // GitHub sync
    syncStatus, syncError, githubConfig,
    configureGitHub, disconnectGitHub, forcePull,
  };
}
