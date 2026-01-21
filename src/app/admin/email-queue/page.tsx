'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  RefreshCw, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Play, 
  X,
  ExternalLink 
} from 'lucide-react';

interface EmailQueueStats {
  total: number;
  byStatus: Record<string, { count: number; avgRetries: number }>;
}

interface QueueItem {
  id: number;
  recipient_email: string;
  recipient_name: string | null;
  email_type: string;
  email_subject: string | null;
  status: string;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  last_error_code: string | null;
  created_at: string;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  sent_at: string | null;
}

export default function EmailQueuePage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<EmailQueueStats | null>(null);
  const [failedEmails, setFailedEmails] = useState<QueueItem[]>([]);
  const [pendingEmails, setPendingEmails] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'failed' | 'pending'>('stats');

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get token from secure storage
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch stats
      const statsRes = await fetch('/api/email-queue/status?view=stats', {
        headers,
        credentials: 'omit'
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch failed emails
      const failedRes = await fetch('/api/email-queue/status?view=failed&limit=50', {
        headers,
        credentials: 'omit'
      });
      const failedData = await failedRes.json();
      if (failedData.success) {
        setFailedEmails(failedData.failedEmails);
      }

      // Fetch pending emails
      const pendingRes = await fetch('/api/email-queue/status?view=pending&limit=50', {
        headers,
        credentials: 'omit'
      });
      const pendingData = await pendingRes.json();
      if (pendingData.success) {
        setPendingEmails(pendingData.pendingEmails);
      }
    } catch (error) {
      console.error('Error fetching queue data:', error);
      toast.error('Failed to load email queue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const processQueue = async () => {
    try {
      setProcessing(true);
      
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      
      const res = await fetch('/api/email-queue/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ maxEmails: 10 }),
        credentials: 'omit'
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Processed ${data.results.processed} emails. Sent: ${data.results.sent}, Failed: ${data.results.failed}`);
        await fetchData(); // Refresh data
      } else {
        toast.error('Failed to process queue');
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      toast.error('Failed to process queue');
    } finally {
      setProcessing(false);
    }
  };

  const retryEmail = async (queueId: number) => {
    try {
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      
      const res = await fetch(`/api/email-queue/${queueId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'omit'
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Email queued for retry');
        await fetchData();
      } else {
        toast.error('Failed to retry email');
      }
    } catch (error) {
      console.error('Error retrying email:', error);
      toast.error('Failed to retry email');
    }
  };

  const cancelEmail = async (queueId: number) => {
    try {
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      
      const res = await fetch(`/api/email-queue/${queueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'omit'
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Email cancelled');
        await fetchData();
      } else {
        toast.error('Failed to cancel email');
      }
    } catch (error) {
      console.error('Error cancelling email:', error);
      toast.error('Failed to cancel email');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      sent: { variant: 'default', icon: CheckCircle },
      pending: { variant: 'secondary', icon: Clock },
      processing: { variant: 'secondary', icon: RefreshCw },
      failed: { variant: 'destructive', icon: AlertCircle },
      cancelled: { variant: 'outline', icon: X }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getMinutesUntilRetry = (nextRetryAt: string | null) => {
    if (!nextRetryAt) return null;
    const now = new Date().getTime();
    const retry = new Date(nextRetryAt).getTime();
    const diffMinutes = Math.round((retry - now) / (1000 * 60));
    return diffMinutes;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.emailQueue.title')}</h1>
          <p className="text-muted-foreground">{t('admin.emailQueue.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.emailQueue.refresh')}
          </Button>
          <Button onClick={processQueue} disabled={processing}>
            <Play className={`h-4 w-4 mr-2 ${processing ? 'animate-pulse' : ''}`} />
            {t('admin.emailQueue.processNow')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'stats'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          {t('admin.emailQueue.statistics')}
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'failed'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('failed')}
        >
          {t('admin.emailQueue.failedEmails')} ({failedEmails.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'pending'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          {t('admin.emailQueue.pendingRetries')} ({pendingEmails.length})
        </button>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'stats' && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.emailQueue.totalEmails')}</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          {Object.entries(stats.byStatus).map(([status, data]) => (
            <Card key={status}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">{t(`admin.emailQueue.status.${status}`) || status}</CardTitle>
                {getStatusBadge(status)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.count}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.emailQueue.avgRetries')}: {data.avgRetries}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Failed Emails Tab */}
      {activeTab === 'failed' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.emailQueue.failedAttention')}</CardTitle>
          </CardHeader>
          <CardContent>
            {failedEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>{t('admin.emailQueue.noFailedEmails')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {failedEmails.map((email) => (
                  <div key={email.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{email.recipient_name || email.recipient_email}</div>
                        <div className="text-sm text-muted-foreground">{email.recipient_email}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('admin.emailQueue.type')}: {email.email_type} • {t('admin.emailQueue.retries')}: {email.retry_count}/{email.max_retries}
                        </div>
                      </div>
                      {getStatusBadge(email.status)}
                    </div>
                    
                    {email.last_error && (
                      <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                        <strong>{t('admin.emailQueue.error')}:</strong> {email.last_error}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {t('admin.emailQueue.created')}: {formatDate(email.created_at)} • 
                      {t('admin.emailQueue.lastAttempt')}: {formatDate(email.last_attempt_at)}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => retryEmail(email.id)}>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {t('admin.emailQueue.retryNow')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => cancelEmail(email.id)}>
                        <X className="h-3 w-3 mr-1" />
                        {t('admin.emailQueue.cancel')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Retries Tab */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.emailQueue.pendingRetries')}</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2" />
                <p>{t('admin.emailQueue.noPendingRetries')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEmails.map((email) => {
                  const minutesUntilRetry = getMinutesUntilRetry(email.next_retry_at);
                  return (
                    <div key={email.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{email.recipient_name || email.recipient_email}</div>
                          <div className="text-sm text-muted-foreground">{email.recipient_email}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {t('admin.emailQueue.type')}: {email.email_type} • {t('admin.emailQueue.attempt')}: {email.retry_count + 1}/{email.max_retries}
                          </div>
                        </div>
                        {getStatusBadge(email.status)}
                      </div>
                      
                      <div className="text-sm">
                        {minutesUntilRetry !== null && (
                          <div className="text-muted-foreground">
                            {minutesUntilRetry > 0 
                              ? `${t('admin.emailQueue.nextRetryIn')} ${minutesUntilRetry} ${t('admin.emailQueue.minutes')}` 
                              : t('admin.emailQueue.readyForRetry')}
                          </div>
                        )}
                      </div>
                      
                      {email.last_error && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm p-2 rounded">
                          <strong>{t('admin.emailQueue.previousError')}:</strong> {email.last_error}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => retryEmail(email.id)}>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {t('admin.emailQueue.retryNow')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => cancelEmail(email.id)}>
                          <X className="h-3 w-3 mr-1" />
                          {t('admin.emailQueue.cancel')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
