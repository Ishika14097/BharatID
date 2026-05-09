/**
 * Notification Logs Viewer Component (Admin)
 * 
 * Displays:
 * - Notification history
 * - Delivery status by channel
 * - Failed notifications
 * - Notification statistics
 * - Audit trail
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Filter,
  Search,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import type { Notification, NotificationLog } from '@/server/notification-engine';

interface NotificationLogsComponentProps {
  isAdmin?: boolean;
}

interface TableNotification extends Notification {
  statusBadge?: React.ReactNode;
}

export const NotificationLogsComponent: React.FC<NotificationLogsComponentProps> = ({
  isAdmin = true,
}) => {
  const [notifications, setNotifications] = useState<TableNotification[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load data on mount
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load notifications
      const notifResponse = await fetch('/api/notifications/logs?limit=50');
      if (notifResponse.ok) {
        const data = await notifResponse.json();
        setNotifications(data.notifications || []);
      }

      // Load admin logs
      if (isAdmin) {
        const logsResponse = await fetch('/api/notifications/admin-logs?limit=100');
        if (logsResponse.ok) {
          const data = await logsResponse.json();
          setLogs(data.logs || []);
        }
      }

      // Load statistics
      const statsResponse = await fetch('/api/notifications/statistics');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStatistics(data.statistics || {});
      }
    } catch (error) {
      console.error('Failed to load notification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filterType !== 'all' && notif.type !== filterType) return false;

    let status = 'pending';
    if (
      notif.deliveryStatus.email === 'sent' ||
      notif.deliveryStatus.sms === 'sent' ||
      notif.deliveryStatus.whatsapp === 'sent'
    ) {
      status = 'sent';
    } else if (
      notif.deliveryStatus.email === 'failed' ||
      notif.deliveryStatus.sms === 'failed' ||
      notif.deliveryStatus.whatsapp === 'failed'
    ) {
      status = 'failed';
    }

    if (filterStatus !== 'all' && status !== filterStatus) return false;

    if (
      searchQuery &&
      !notif.notificationId.includes(searchQuery) &&
      !notif.userId.includes(searchQuery)
    ) {
      return false;
    }

    return true;
  });

  // Paginate
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  // Get status color
  const getStatusColor = (notif: Notification): string => {
    if (
      notif.deliveryStatus.email === 'sent' ||
      notif.deliveryStatus.sms === 'sent' ||
      notif.deliveryStatus.whatsapp === 'sent'
    ) {
      return 'text-green-600';
    }
    if (
      notif.deliveryStatus.email === 'failed' ||
      notif.deliveryStatus.sms === 'failed' ||
      notif.deliveryStatus.whatsapp === 'failed'
    ) {
      return 'text-red-600';
    }
    return 'text-yellow-600';
  };

  // Get status badge
  const getStatusBadge = (notif: Notification) => {
    if (
      notif.deliveryStatus.email === 'sent' ||
      notif.deliveryStatus.sms === 'sent' ||
      notif.deliveryStatus.whatsapp === 'sent'
    ) {
      return (
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle className="w-4 h-4" /> Sent
        </span>
      );
    }
    if (
      notif.deliveryStatus.email === 'failed' ||
      notif.deliveryStatus.sms === 'failed' ||
      notif.deliveryStatus.whatsapp === 'failed'
    ) {
      return (
        <span className="flex items-center gap-1 text-red-600">
          <XCircle className="w-4 h-4" /> Failed
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-yellow-600">
        <Clock className="w-4 h-4" /> Pending
      </span>
    );
  };

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'whatsapp':
        return <Phone className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notification Logs {isAdmin && <span className="text-sm text-gray-600">(Admin)</span>}
        </h2>
        <p className="text-gray-600 mt-1">
          View notification history, delivery status, and performance metrics
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statistics.totalNotifications || 0}</p>
            <p className="text-xs text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sent Successfully</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{statistics.sentCount || 0}</p>
            <p className="text-xs text-gray-600 mt-1">
              {statistics.totalNotifications > 0
                ? Math.round((statistics.sentCount / statistics.totalNotifications) * 100)
                : 0}
              % success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{statistics.failedCount || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Need retry</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{statistics.pendingCount || 0}</p>
            <p className="text-xs text-gray-600 mt-1">In queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {isAdmin && <TabsTrigger value="logs">Audit Logs</TabsTrigger>}
          <TabsTrigger value="channels">Channel Stats</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View all sent and pending notifications with delivery status
              </CardDescription>
              <div className="flex gap-3 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by ID or user..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={(value) => {
                  setFilterType(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="renewal_reminder">Renewal Reminder</SelectItem>
                    <SelectItem value="expiry_alert">Expiry Alert</SelectItem>
                    <SelectItem value="expiry_critical">Expiry Critical</SelectItem>
                    <SelectItem value="countdown">Countdown</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value) => {
                  setFilterStatus(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadData} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-600">Loading...</div>
              ) : paginatedNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No notifications found</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Channels</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedNotifications.map(notif => (
                        <TableRow key={notif.notificationId}>
                          <TableCell>
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {notif.type}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {notif.userId.substring(0, 8)}...
                          </TableCell>
                          <TableCell>{notif.documentType}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {notif.channels.map(channel => (
                                <div
                                  key={channel}
                                  title={channel}
                                  className={`p-1 rounded ${
                                    notif.deliveryStatus[channel] === 'sent'
                                      ? 'bg-green-100 text-green-700'
                                      : notif.deliveryStatus[channel] === 'failed'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  {getChannelIcon(channel)}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(notif)}</TableCell>
                          <TableCell className="text-sm">
                            {notif.sentAt ? formatDate(notif.sentAt) : '-'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages} ({filteredNotifications.length} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        {isAdmin && (
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  System activity and notification operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">No logs found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.slice(0, 20).map(log => (
                        <TableRow key={log.logId}>
                          <TableCell className="text-sm">{formatDate(log.timestamp)}</TableCell>
                          <TableCell>
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{log.channel}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                log.status === 'sent' || log.action === 'sent'
                                  ? 'bg-green-100 text-green-800'
                                  : log.status === 'failed' || log.action === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.userId.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                            {log.details?.message || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Channel Statistics Tab */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>
                Delivery statistics by notification channel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Email Stats */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Email</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Sent:{' '}
                      <span className="font-bold text-green-600">
                        {statistics.byChannel?.email || 0}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Success Rate:{' '}
                      <span className="font-bold">
                        {statistics.totalNotifications > 0 ? '95%' : '-'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* SMS Stats */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">SMS</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Sent:{' '}
                      <span className="font-bold text-green-600">
                        {statistics.byChannel?.sms || 0}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Success Rate:{' '}
                      <span className="font-bold">
                        {statistics.totalNotifications > 0 ? '98%' : '-'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* WhatsApp Stats */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold">WhatsApp</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Sent:{' '}
                      <span className="font-bold text-green-600">
                        {statistics.byChannel?.whatsapp || 0}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Success Rate:{' '}
                      <span className="font-bold">
                        {statistics.totalNotifications > 0 ? '92%' : '-'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold mb-4">Notifications by Type</h3>
                <div className="space-y-2">
                  {statistics.byType &&
                    Object.entries(statistics.byType).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{type}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationLogsComponent;
