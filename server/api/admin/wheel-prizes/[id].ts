import type { Request, Response } from 'express';

// This would normally import from the main wheel-prizes file or database
// For now, using a simple mock that matches the parent file
let mockWheelPrizes = [
  {
    id: '1',
    type: 'coins',
    label: '100 LP',
    min: 100,
    max: 100,
    probability: 0.30
  },
  {
    id: '2',
    type: 'coins',
    label: '50 LP', 
    min: 50,
    max: 50,
    probability: 0.25
  }
];

export default async function handler(req: Request, res: Response) {
  try {
    const prizeId = req.params?.id || req.query?.id;
    
    if (!prizeId) {
      return res.status(400).json({ message: 'Prize ID is required' });
    }

    switch (req.method) {
      case 'DELETE':
        const initialLength = mockWheelPrizes.length;
        mockWheelPrizes = mockWheelPrizes.filter(p => p.id !== prizeId);
        
        if (mockWheelPrizes.length === initialLength) {
          return res.status(404).json({ message: 'Prize not found' });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Prize deleted successfully' 
        });
        
      case 'PUT':
        const prizeIndex = mockWheelPrizes.findIndex(p => p.id === prizeId);
        if (prizeIndex === -1) {
          return res.status(404).json({ message: 'Prize not found' });
        }
        
        // Validate and sanitize input to prevent object injection
        const allowedFields = ['type', 'label', 'min', 'max', 'probability'];
        const updatedFields: any = {};
        for (const field of allowedFields) {
          if (req.body[field] !== undefined) {
            updatedFields[field] = req.body[field];
          }
        }
        
        mockWheelPrizes[prizeIndex] = { ...mockWheelPrizes[prizeIndex], ...updatedFields };
        return res.status(200).json(mockWheelPrizes[prizeIndex]);
        
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Wheel prize management error:', error);
    return res.status(500).json({ 
      message: 'Failed to manage wheel prize',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}