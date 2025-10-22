// ... (imports retained)

export function registerAdminRoutes(app: Express) {
  // ... (other routes unchanged)

  // Admin Upgrades - for editing/managing upgrade definitions
  app.get('/api/admin/upgrades', async (req: Request, res: Response) => {
    try {
      const dbUpgrades = await storage.getUpgrades();
      res.json(dbUpgrades);
    } catch (error) {
      console.error('Error fetching admin upgrades:', error);
      res.json([]);
    }
  });

  app.post('/api/admin/upgrades', async (req: Request, res: Response) => {
    try {
      const upgradeData = req.body;
      const newUpgrade = await storage.createUpgrade(upgradeData);
      res.json(createSuccessResponse(newUpgrade));
    } catch (error) {
      console.error('Error creating upgrade:', error);
      res.status(500).json(createErrorResponse('Failed to create upgrade'));
    }
  });

  app.put('/api/admin/upgrades/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedUpgrade = await storage.updateUpgrade(id, updates);
      res.json(createSuccessResponse(updatedUpgrade));
    } catch (error) {
      console.error('Error updating upgrade:', error);
      res.status(500).json(createErrorResponse('Failed to update upgrade'));
    }
  });

  app.delete('/api/admin/upgrades/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteUpgrade(id);
      res.json(createSuccessResponse({ message: 'Upgrade deleted successfully' }));
    } catch (error) {
      console.error('Error deleting upgrade:', error);
      res.status(500).json(createErrorResponse('Failed to delete upgrade'));
    }
  });

  // ... (all other admin routes unchanged)
}
