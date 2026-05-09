/**
 * Notification Preferences Component
 * 
 * Allows users to configure:
 * - Notification channels (Email, SMS, WhatsApp)
 * - Renewal reminders settings
 * - Expiry alerts settings
 * - Countdown reminders
 * - Quiet hours
 * - Document types to track
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import type { NotificationPreference, DocumentType } from '@/server/notification-engine';

interface NotificationPreferencesComponentProps {
  userId: string;
  onSave?: (preferences: NotificationPreference) => void;
  isLoading?: boolean;
}

const DOCUMENT_TYPES: Array<{ value: DocumentType; label: string; icon: React.ReactNode }> = [
  { value: 'passport', label: 'Passport', icon: '📕' },
  { value: 'driving_license', label: 'Driving License', icon: '🚗' },
  { value: 'kyc', label: 'KYC', icon: '🆔' },
  { value: 'aadhaar', label: 'Aadhaar', icon: '🏛️' },
  { value: 'pan', label: 'PAN', icon: '📋' },
];

export const NotificationPreferencesComponent: React.FC<NotificationPreferencesComponentProps> = ({
  userId,
  onSave,
  isLoading = false,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreference>({
    preferenceId: '',
    userId,
    channels: {
      email: true,
      sms: false,
      whatsapp: false,
    },
    renewalReminders: {
      enabled: true,
      daysBeforeExpiry: 30,
      frequency: 'once',
    },
    expiryAlerts: {
      enabled: true,
      days30: true,
      days14: true,
      days7: true,
      days1: false,
    },
    countdownReminders: {
      enabled: false,
      frequency: 'weekly',
    },
    documentTypes: ['passport', 'driving_license', 'kyc'],
    timezone: 'Asia/Kolkata',
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const response = await fetch(`/api/notifications/preferences/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleSave = async () => {
    const validationErrors = validatePreferences();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/notifications/preferences/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaveSuccess(true);
        onSave?.(preferences);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setErrors({ submit: 'Failed to save preferences' });
    } finally {
      setIsSaving(false);
    }
  };

  const validatePreferences = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (Object.values(preferences.channels).every(v => !v)) {
      errors.channels = 'At least one notification channel must be enabled';
    }

    if (preferences.documentTypes.length === 0) {
      errors.documentTypes = 'At least one document type must be selected';
    }

    const renewalDays = preferences.renewalReminders.daysBeforeExpiry;
    if (renewalDays < 1 || renewalDays > 365) {
      errors.renewalDays = 'Renewal reminder days must be between 1 and 365';
    }

    if (preferences.quietHours.enabled) {
      const startTime = parseInt(preferences.quietHours.startTime.split(':')[0]);
      const endTime = parseInt(preferences.quietHours.endTime.split(':')[0]);
      if (startTime === endTime) {
        errors.quietHours = 'Quiet hours start and end times cannot be the same';
      }
    }

    return errors;
  };

  const toggleChannel = (channel: 'email' | 'sms' | 'whatsapp') => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }));
  };

  const toggleDocumentType = (docType: DocumentType) => {
    setPreferences(prev => ({
      ...prev,
      documentTypes: prev.documentTypes.includes(docType)
        ? prev.documentTypes.filter(d => d !== docType)
        : [...prev.documentTypes, docType],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notification Settings
        </h2>
        <p className="text-gray-600 mt-1">
          Manage how and when you receive notifications about your documents
        </p>
      </div>

      {/* Error Messages */}
      {Object.values(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Errors found:</p>
            <ul className="text-red-800 text-sm mt-1">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-900">Preferences saved successfully!</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Choose which channels to receive notifications through
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Channel */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.channels.email}
                    onCheckedChange={() => toggleChannel('email')}
                  />
                </div>
              </div>

              {/* SMS Channel */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold">SMS</p>
                      <p className="text-sm text-gray-600">Receive notifications via text message</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.channels.sms}
                    onCheckedChange={() => toggleChannel('sms')}
                  />
                </div>
              </div>

              {/* WhatsApp Channel */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-semibold">WhatsApp</p>
                      <p className="text-sm text-gray-600">
                        Receive notifications via WhatsApp
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.channels.whatsapp}
                    onCheckedChange={() => toggleChannel('whatsapp')}
                  />
                </div>
              </div>

              {/* Channel Warning */}
              {Object.values(preferences.channels).every(v => !v) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-amber-900 text-sm">
                    Select at least one channel to receive notifications
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>Renewal Reminders</CardTitle>
              <CardDescription>
                Configure automatic renewal reminders for your documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Reminders */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">Enable Renewal Reminders</p>
                  <p className="text-sm text-gray-600">Get notified when documents are due for renewal</p>
                </div>
                <Switch
                  checked={preferences.renewalReminders.enabled}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({
                      ...prev,
                      renewalReminders: { ...prev.renewalReminders, enabled: checked },
                    }))
                  }
                />
              </div>

              {/* Days Before Expiry */}
              <div>
                <Label className="text-base">
                  Remind me this many days before expiry
                </Label>
                <div className="mt-2 flex gap-4 items-center">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={preferences.renewalReminders.daysBeforeExpiry}
                    onChange={(e) =>
                      setPreferences(prev => ({
                        ...prev,
                        renewalReminders: {
                          ...prev.renewalReminders,
                          daysBeforeExpiry: parseInt(e.target.value) || 30,
                        },
                      }))
                    }
                    className="w-24"
                  />
                  <span className="text-gray-600">days before expiry</span>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <Label className="text-base">Reminder Frequency</Label>
                <Select
                  value={preferences.renewalReminders.frequency}
                  onValueChange={(value: any) =>
                    setPreferences(prev => ({
                      ...prev,
                      renewalReminders: {
                        ...prev.renewalReminders,
                        frequency: value,
                      },
                    }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Countdown Reminders */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">Enable Countdown Reminders</p>
                    <p className="text-sm text-gray-600">
                      Regular reminders showing days until expiry
                    </p>
                  </div>
                  <Switch
                    checked={preferences.countdownReminders.enabled}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({
                        ...prev,
                        countdownReminders: { ...prev.countdownReminders, enabled: checked },
                      }))
                    }
                  />
                </div>

                {preferences.countdownReminders.enabled && (
                  <div className="mt-4">
                    <Label className="text-base">Countdown Frequency</Label>
                    <Select
                      value={preferences.countdownReminders.frequency}
                      onValueChange={(value: any) =>
                        setPreferences(prev => ({
                          ...prev,
                          countdownReminders: {
                            ...prev.countdownReminders,
                            frequency: value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Expiry Alerts</CardTitle>
              <CardDescription>
                Choose when to receive alerts as documents approach expiry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Alerts */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">Enable Expiry Alerts</p>
                  <p className="text-sm text-gray-600">Get notified when documents are expiring</p>
                </div>
                <Switch
                  checked={preferences.expiryAlerts.enabled}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({
                      ...prev,
                      expiryAlerts: { ...prev.expiryAlerts, enabled: checked },
                    }))
                  }
                />
              </div>

              {preferences.expiryAlerts.enabled && (
                <>
                  {/* 30 Days Alert */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.expiryAlerts.days30}
                        onChange={(e) =>
                          setPreferences(prev => ({
                            ...prev,
                            expiryAlerts: { ...prev.expiryAlerts, days30: e.target.checked },
                          }))
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Alert when 30 days remaining</span>
                    </label>
                  </div>

                  {/* 14 Days Alert */}
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.expiryAlerts.days14}
                        onChange={(e) =>
                          setPreferences(prev => ({
                            ...prev,
                            expiryAlerts: { ...prev.expiryAlerts, days14: e.target.checked },
                          }))
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Alert when 14 days remaining</span>
                    </label>
                  </div>

                  {/* 7 Days Alert */}
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.expiryAlerts.days7}
                        onChange={(e) =>
                          setPreferences(prev => ({
                            ...prev,
                            expiryAlerts: { ...prev.expiryAlerts, days7: e.target.checked },
                          }))
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Alert when 7 days remaining</span>
                    </label>
                  </div>

                  {/* 1 Day Alert */}
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.expiryAlerts.days1}
                        onChange={(e) =>
                          setPreferences(prev => ({
                            ...prev,
                            expiryAlerts: { ...prev.expiryAlerts, days1: e.target.checked },
                          }))
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold">URGENT: Alert when 1 day remaining</span>
                    </label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {/* Document Types */}
          <Card>
            <CardHeader>
              <CardTitle>Document Types to Track</CardTitle>
              <CardDescription>
                Select which documents you want to receive notifications for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DOCUMENT_TYPES.map(docType => (
                  <label
                    key={docType.value}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={preferences.documentTypes.includes(docType.value)}
                      onChange={() => toggleDocumentType(docType.value)}
                      className="w-4 h-4"
                    />
                    <span>{docType.icon}</span>
                    <span className="font-medium">{docType.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timezone */}
          <Card>
            <CardHeader>
              <CardTitle>Timezone</CardTitle>
              <CardDescription>
                Used to schedule notifications at appropriate times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={preferences.timezone}
                onValueChange={(value) =>
                  setPreferences(prev => ({
                    ...prev,
                    timezone: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="Asia/Bangalore">Asia/Bangalore</SelectItem>
                  <SelectItem value="Asia/Calcutta">Asia/Calcutta</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>
                No notifications during these hours (except urgent alerts)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <p className="font-semibold">Enable Quiet Hours</p>
                </div>
                <Switch
                  checked={preferences.quietHours.enabled}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, enabled: checked },
                    }))
                  }
                />
              </div>

              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) =>
                        setPreferences(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, startTime: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) =>
                        setPreferences(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, endTime: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferencesComponent;
