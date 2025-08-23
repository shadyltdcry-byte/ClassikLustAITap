// adminApi.js
module.exports = function registerAdminApi(app, core) {
  // Fetch all plugin stats
  app.get('/api/admin/plugins/stats', async (req, res) => {
    try {
      const stats = await core.runCommand('getAllStats', {});
      res.json(stats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch plugin stats' });
    }
  });

  // Fetch all plugin logs
  app.get('/api/admin/plugins/logs', async (req, res) => {
    try {
      const logs = await core.runCommand('getAllLogs', {});
      res.json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch plugin logs' });
    }
  });

  // Send command to specific plugin
  app.post('/api/admin/plugins/:pluginName/command', async (req, res) => {
    try {
      const { pluginName } = req.params;
      const { command, data } = req.body;
      const result = await core.runCommand('sendCommandToPlugin', { targetPlugin: pluginName, subCommand: command, params: data });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to execute command on plugin ${req.params.pluginName}` });
    }
  });
};
