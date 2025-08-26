import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/queryClient';

interface Upgrade {
  id?: string;
  name: string;
  description?: string;
  category: string;
  baseCost: number;
  baseEffect: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel?: number;
  levelRequirement: number;
}

const upgradeCategories = [
  { value: 'lp_per_hour', label: 'LP Per Hour' },
  { value: 'energy', label: 'Energy Increase' },
  { value: 'lp_per_tap', label: 'LP Per Tap' }
];

export default function UpgradeManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingUpgrade, setEditingUpgrade] = useState<Upgrade | null>(null);
  const [formData, setFormData] = useState<Upgrade>({
    name: '',
    description: '',
    category: 'lp_per_hour',
    baseCost: 100,
    baseEffect: 1,
    costMultiplier: 1.3,
    effectMultiplier: 1.15,
    maxLevel: 10,
    levelRequirement: 1
  });

  const queryClient = useQueryClient();

  const { data: upgrades = [], isLoading } = useQuery({
    queryKey: ['/api/admin/upgrades'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Upgrade) => {
      return await apiRequest('/api/admin/upgrades', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] });
      toast.success('Upgrade created!');
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create upgrade')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Upgrade) => {
      return await apiRequest(`/api/admin/upgrades/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] });
      toast.success('Upgrade updated!');
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('Failed to update upgrade')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/upgrades/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] });
      toast.success('Upgrade deleted!');
    },
    onError: () => toast.error('Failed to delete upgrade')
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'lp_per_hour',
      baseCost: 100,
      baseEffect: 1,
      costMultiplier: 1.3,
      effectMultiplier: 1.15,
      maxLevel: 10,
      levelRequirement: 1
    });
    setEditingUpgrade(null);
  };

  const handleEdit = (upgrade: Upgrade) => {
    setEditingUpgrade(upgrade);
    setFormData(upgrade);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingUpgrade) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryLabel = (category: string) => {
    return upgradeCategories.find(cat => cat.value === category)?.label || category;
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Upgrade Management
          </CardTitle>
          <Button 
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-pink-600 hover:bg-pink-700"
            data-testid="button-create-upgrade"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Upgrade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-gray-400">Loading...</div>
            ) : upgrades.length === 0 ? (
              <div className="text-center text-gray-400">No upgrades found</div>
            ) : (
              upgrades.map((upgrade: Upgrade) => (
                <div key={upgrade.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{upgrade.name}</h4>
                      <p className="text-gray-300">Category: {getCategoryLabel(upgrade.category)}</p>
                      <p className="text-gray-300">Base Cost: {upgrade.baseCost} LP | Effect: +{upgrade.baseEffect}</p>
                      <p className="text-gray-300">Level Required: {upgrade.levelRequirement}</p>
                      {upgrade.description && (
                        <p className="text-gray-400 text-sm mt-1">{upgrade.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(upgrade)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        data-testid={`button-edit-upgrade-${upgrade.id}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(upgrade.id!)}
                        data-testid={`button-delete-upgrade-${upgrade.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUpgrade ? 'Edit Upgrade' : 'Create Upgrade'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-upgrade-name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {upgradeCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="baseCost">Base Cost</Label>
                  <Input
                    id="baseCost"
                    type="number"
                    value={formData.baseCost}
                    onChange={(e) => setFormData({...formData, baseCost: parseFloat(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-base-cost"
                  />
                </div>
                <div>
                  <Label htmlFor="baseEffect">Base Effect</Label>
                  <Input
                    id="baseEffect"
                    type="number"
                    step="0.1"
                    value={formData.baseEffect}
                    onChange={(e) => setFormData({...formData, baseEffect: parseFloat(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-base-effect"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="costMultiplier">Cost Multiplier</Label>
                  <Input
                    id="costMultiplier"
                    type="number"
                    step="0.1"
                    value={formData.costMultiplier}
                    onChange={(e) => setFormData({...formData, costMultiplier: parseFloat(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-cost-multiplier"
                  />
                </div>
                <div>
                  <Label htmlFor="effectMultiplier">Effect Multiplier</Label>
                  <Input
                    id="effectMultiplier"
                    type="number"
                    step="0.1"
                    value={formData.effectMultiplier}
                    onChange={(e) => setFormData({...formData, effectMultiplier: parseFloat(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-effect-multiplier"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="levelRequirement">Level Required</Label>
                  <Input
                    id="levelRequirement"
                    type="number"
                    value={formData.levelRequirement}
                    onChange={(e) => setFormData({...formData, levelRequirement: parseInt(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-level-requirement"
                  />
                </div>
                <div>
                  <Label htmlFor="maxLevel">Max Level</Label>
                  <Input
                    id="maxLevel"
                    type="number"
                    value={formData.maxLevel || ''}
                    onChange={(e) => setFormData({...formData, maxLevel: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-max-level"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="textarea-upgrade-description"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  className="bg-pink-600 hover:bg-pink-700"
                  data-testid="button-save-upgrade"
                >
                  {editingUpgrade ? 'Update' : 'Create'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-600"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}