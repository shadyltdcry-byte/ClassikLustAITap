export async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchAdminStats() {
  return apiRequest('/api/admin/plugins/stats');
}

export async function fetchPluginLogs() {
  return apiRequest('/api/admin/plugins/logs');
}

export async function runPluginCommand(plugin: string, command: string, data: any) {
  const response = await fetch(`/api/admin/plugins/${plugin}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, data }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to run command on plugin ${plugin}`);
  }
  return response.json();
}
