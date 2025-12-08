"use client";

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Edit, Trash2, Plus, X, Palette, CheckCircle, Circle } from 'lucide-react';

interface Marquee {
  id: number;
  text: string;
  text_color: string;
  background_color: string;
  speed: number;
  is_active: boolean;
  is_global: boolean;
  district: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

export function MarqueeManagement() {
  const { currentUser, hasPermission } = useAdmin();
  const { t } = useLanguage();
  const [marquees, setMarquees] = useState<Marquee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [states, setStates] = useState<Array<{ id: number; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [formData, setFormData] = useState({
    text: '',
    text_color: '#92400e',
    background_color: '#fef3c7',
    speed: 40,
    is_active: true,
    is_global: true,
    district: '',
    state: '',
  });

  const canSelectStateDistrict = currentUser && (
    currentUser.type === 'superadmin' || 
    currentUser.role === 'superadmin' ||
    currentUser.type === 'news_editor' ||
    currentUser.role === 'news_editor'
  );

  useEffect(() => {
    fetchMarquees();
    if (canSelectStateDistrict) {
      fetchStates();
    }
  }, []);

  useEffect(() => {
    if (canSelectStateDistrict && formData.state && formData.state !== 'All States' && !isNaN(Number(formData.state))) {
      fetchDistricts(formData.state);
    } else {
      setDistricts([]);
    }
  }, [formData.state, canSelectStateDistrict]);

  const fetchMarquees = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/marquee?admin=true&list=true', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      const data = await response.json();
      if (data.success) {
        setMarquees(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching marquees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await fetch('/api/states');
      const data = await response.json();
      if (data.success) {
        setStates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateId: string) => {
    if (!stateId || stateId === 'All States' || isNaN(Number(stateId))) {
      setDistricts([]);
      return;
    }
    setLoadingDistricts(true);
    try {
      const response = await fetch(`/api/districts?stateId=${encodeURIComponent(stateId)}`);
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingId ? '/api/marquee' : '/api/marquee';
      const method = editingId ? 'PUT' : 'POST';

      const payload: any = {
        ...formData,
        speed: parseInt(String(formData.speed)) || 40,
        is_active: formData.is_active,
        is_global: canSelectStateDistrict ? formData.is_global : false,
      };

      if (editingId) {
        payload.id = editingId;
      }

      if (canSelectStateDistrict) {
        if (!formData.is_global) {
          if (formData.district && formData.state) {
            // Find district and state names
            const stateObj = states.find(s => s.id === Number(formData.state));
            const districtObj = districts.find(d => d.id === formData.district);
            if (stateObj && districtObj) {
              payload.state = stateObj.name;
              payload.district = districtObj.name;
            }
          }
        } else {
          payload.district = null;
          payload.state = null;
        }
      } else {
        // District admin - use their district/state
        payload.district = null;
        payload.state = null;
        payload.is_global = false;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        resetForm();
        fetchMarquees();
      } else {
        alert(data.error || t('admin.marquee.failedToSave'));
      }
    } catch (error) {
      console.error('Error saving marquee:', error);
      alert(t('admin.marquee.failedToSave'));
    }
  };

  const handleEdit = (marquee: Marquee) => {
    setFormData({
      text: marquee.text,
      text_color: marquee.text_color,
      background_color: marquee.background_color,
      speed: marquee.speed,
      is_active: marquee.is_active,
      is_global: marquee.is_global,
      district: marquee.district || '',
      state: marquee.state || '',
    });
    setEditingId(marquee.id);
    setIsCreating(false);
  };

  const handleSetActive = async (marquee: Marquee) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/marquee', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: marquee.id,
          is_active: !marquee.is_active,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchMarquees();
      } else {
        alert(data.error || t('admin.marquee.failedToUpdate'));
      }
    } catch (error) {
      console.error('Error updating marquee status:', error);
      alert(t('admin.marquee.failedToUpdate'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.marquee.deleteConfirm'))) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/marquee?id=${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchMarquees();
      } else {
        alert(data.error || t('admin.marquee.failedToDelete'));
      }
    } catch (error) {
      console.error('Error deleting marquee:', error);
      alert(t('admin.marquee.failedToDelete'));
    }
  };

  const resetForm = () => {
    setFormData({
      text: '',
      text_color: '#92400e',
      background_color: '#fef3c7',
      speed: 40,
      is_active: true,
      is_global: canSelectStateDistrict ? true : false,
      district: '',
      state: '',
    });
    setEditingId(null);
    setIsCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('admin.marquee.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.marquee.title')}</h1>
          <p className="text-gray-600">{t('admin.marquee.description')}</p>
        </div>
        <Button onClick={startCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('admin.marquee.addMarquee')}
        </Button>
      </div>

      {/* Form */}
      {(isCreating || editingId) && (
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-orange-800">
                {isCreating ? t('admin.marquee.createMarquee') : t('admin.marquee.editMarquee')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="text">{t('admin.marquee.marqueeText')}</Label>
              <Input
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder={t('admin.marquee.textPlaceholder')}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('admin.marquee.characters').replace('{count}', String(formData.text.length))}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="text_color">{t('admin.marquee.textColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    placeholder="#92400e"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="background_color">{t('admin.marquee.backgroundColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    placeholder="#fef3c7"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="speed">{t('admin.marquee.speed')}</Label>
              <Input
                id="speed"
                type="number"
                value={formData.speed}
                onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) || 40 })}
                min={10}
                max={100}
              />
              <p className="text-xs text-gray-500 mt-1">{t('admin.marquee.speedRecommended')}</p>
            </div>

            {canSelectStateDistrict && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="is_global"
                    checked={formData.is_global}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, is_global: checked, district: '', state: '' });
                    }}
                  />
                  <Label htmlFor="is_global">{t('admin.marquee.globalMarquee')}</Label>
                </div>

                {!formData.is_global && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">{t('admin.marquee.state')}</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => {
                          setFormData({ ...formData, state: value, district: '' });
                        }}
                        disabled={loadingStates}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.marquee.selectState')} />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state.id} value={String(state.id)}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="district">{t('admin.marquee.district')}</Label>
                      <Select
                        value={formData.district}
                        onValueChange={(value) => setFormData({ ...formData, district: value })}
                        disabled={!formData.state || loadingDistricts}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.marquee.selectDistrict')} />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((district) => (
                            <SelectItem key={district.id} value={district.id}>
                              {district.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">{t('admin.marquee.isActive')}</Label>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="mb-2 block">{t('admin.marquee.preview')}</Label>
              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: formData.background_color,
                  color: formData.text_color,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    animation: `marquee ${60 / formData.speed}s linear infinite`,
                  }}
                  className="inline-block"
                >
                  {formData.text || t('admin.marquee.previewText')}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>
                {t('admin.marquee.cancel')}
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                {isCreating ? t('admin.marquee.create') : t('admin.marquee.update')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-4">
        {marquees.map((marquee) => (
          <Card key={marquee.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div
                    className="p-3 rounded mb-3"
                    style={{
                      backgroundColor: marquee.background_color,
                      color: marquee.text_color,
                    }}
                  >
                    {marquee.text}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{t('admin.marquee.speedLabel').replace('{speed}', String(marquee.speed))}</p>
                    <p>{t('admin.marquee.statusLabel').replace('{status}', marquee.is_active ? t('admin.marquee.active') : t('admin.marquee.inactive'))}</p>
                    <p>{t('admin.marquee.scopeLabel').replace('{scope}', marquee.is_global ? t('admin.marquee.global') : `${marquee.district || 'N/A'}, ${marquee.state || 'N/A'}`)}</p>
                    <p>{t('admin.marquee.updatedLabel').replace('{date}', new Date(marquee.updated_at).toLocaleString())}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={marquee.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSetActive(marquee)}
                    className={marquee.is_active ? "bg-green-600 hover:bg-green-700" : ""}
                    title={marquee.is_active ? "Click to deactivate" : "Click to activate"}
                  >
                    {marquee.is_active ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(marquee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(marquee.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {marquees.length === 0 && !isCreating && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">{t('admin.marquee.noMarqueesFound')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

