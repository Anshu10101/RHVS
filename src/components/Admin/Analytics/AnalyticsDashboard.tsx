"use client";

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  ShoppingBag,
  MapPin,
  Activity,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend as RechartsLegend,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalMembers: number;
    verifiedMembers: number;
    pendingMembers: number;
    rejectedMembers: number;
    recentMembers: number;
    monthlyMembers: number;
    growthPercentage: number;
    activeDistricts: number;
    totalActivities: number;
  };
  monthlyGrowth: Array<{
    month: string;
    members: number;
    events: number;
    products: number;
  }>;
  stateDistribution: Array<{ state: string; count: number }>;
  districtDistribution: Array<{ district: string; count: number }>;
  departmentDistribution: Array<{ department: string; count: number }>;
  statusDistribution: Record<string, number>;
  isDistrictView?: boolean;
  districtName?: string | null;
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899'];

// Chart config will be created dynamically with translations

export function AnalyticsDashboard() {
  const { hasPermission } = useAdmin();
  const { t } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic chart config with translations
  const chartConfig = {
    members: {
      label: t('admin.analytics.chartMembers'),
      color: '#3b82f6',
    },
    events: {
      label: t('admin.analytics.chartEvents'),
      color: '#10b981',
    },
    products: {
      label: t('admin.analytics.chartProducts'),
      color: '#f97316',
    },
    verified: {
      label: t('admin.analytics.chartVerified'),
      color: '#10b981',
    },
    pending: {
      label: t('admin.analytics.chartPending'),
      color: '#f59e0b',
    },
    rejected: {
      label: t('admin.analytics.chartRejected'),
      color: '#ef4444',
    },
  } satisfies Record<string, { label: string; color: string }>;

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/analytics?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || t('admin.analytics.failedToLoad'));
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(t('admin.analytics.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('view_analytics')) {
      fetchAnalytics();
    }
  }, [hasPermission]);

  if (!hasPermission('view_analytics')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don&apos;t have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.analytics.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.analytics.error')}</h3>
          <p className="text-gray-600 mb-4">{error || t('admin.analytics.failedToLoad')}</p>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('admin.analytics.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const statusChartData = [
    { name: t('admin.analytics.chartVerified'), value: data.overview.verifiedMembers, color: '#10b981' },
    { name: t('admin.analytics.chartPending'), value: data.overview.pendingMembers, color: '#f59e0b' },
    { name: t('admin.analytics.chartRejected'), value: data.overview.rejectedMembers, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-3 md:space-y-6 px-2 md:px-0 pb-4 md:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">
            {data.isDistrictView && data.districtName 
              ? `${t('admin.analytics.districtAnalytics')}: ${data.districtName}`
              : t('admin.analytics.title')}
          </h1>
          <p className="text-xs md:text-base text-gray-600">
            {data.isDistrictView 
              ? t('admin.analytics.districtSubtitle')
              : t('admin.analytics.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading} className="h-8 md:h-9">
            <RefreshCw className={`h-3.5 w-3.5 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-xs md:text-sm">{t('admin.analytics.refresh')}</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 mb-1">{t('admin.analytics.totalMembers')}</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{data.overview.totalMembers.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {data.overview.growthPercentage >= 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-600 whitespace-nowrap">+{data.overview.growthPercentage}% {t('admin.analytics.thisMonth')}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                      <span className="text-xs text-red-600 whitespace-nowrap">{data.overview.growthPercentage}% {t('admin.analytics.thisMonth')}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-full flex-shrink-0">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 mb-1">{t('admin.analytics.verifiedMembers')}</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{data.overview.verifiedMembers.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overview.totalMembers > 0 
                    ? Math.round((data.overview.verifiedMembers / data.overview.totalMembers) * 100)
                    : 0}% {t('admin.analytics.ofTotal')}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-full flex-shrink-0">
                <CheckCircle className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 mb-1">{t('admin.analytics.activeDistricts')}</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{data.overview.activeDistricts}</p>
                <p className="text-xs text-gray-500 mt-1">{t('admin.analytics.withRegisteredMembers')}</p>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 rounded-full flex-shrink-0">
                <MapPin className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 mb-1">{t('admin.analytics.recentActivities')}</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{data.overview.totalActivities.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{data.overview.recentMembers} {t('admin.analytics.newMembers30Days')}</p>
              </div>
              <div className="p-2 md:p-3 bg-orange-100 rounded-full flex-shrink-0">
                <Activity className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* Monthly Growth Chart */}
        <Card>
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-sm md:text-lg">{t('admin.analytics.monthlyGrowthTrend')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px] w-full">
              <LineChart data={data.monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  tickFormatter={(value) => value.slice(0, 3)}
                  fontSize={10}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  fontSize={10}
                  width={40}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <RechartsLegend 
                  content={<ChartLegendContent className="flex-wrap text-xs" />} 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="members" 
                  stroke="var(--color-members)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  stroke="var(--color-events)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="products" 
                  stroke="var(--color-products)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Member Status Distribution */}
        <Card>
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-sm md:text-lg">{t('admin.analytics.memberStatusDistribution')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            {statusChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    className="[&_text]:text-[10px] md:[&_text]:text-xs"
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] md:h-[300px] flex items-center justify-center text-gray-500 text-sm">
                {t('admin.analytics.noStatusData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* Top States */}
        <Card>
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-sm md:text-lg">{t('admin.analytics.topStatesByMembers')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            {data.stateDistribution.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px] w-full">
                <BarChart data={data.stateDistribution.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="state" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={9}
                    interval={0}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    fontSize={10}
                    width={35}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-products)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] md:h-[300px] flex items-center justify-center text-gray-500 text-sm">
                {t('admin.analytics.noStateData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Districts */}
        <Card>
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-sm md:text-lg">{t('admin.analytics.topDistrictsByMembers')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            {data.districtDistribution.length > 0 ? (
              <div className="space-y-2.5 md:space-y-3">
                {data.districtDistribution.slice(0, 8).map((item, index) => {
                  const maxCount = Math.max(...data.districtDistribution.map(d => d.count));
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={item.district} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                          <div className="h-5 w-5 md:h-6 md:w-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-600 font-semibold text-xs">{index + 1}</span>
                          </div>
                          <span className="font-medium text-gray-900 truncate text-xs md:text-sm">{item.district}</span>
                        </div>
                        <span className="text-gray-600 font-semibold text-xs md:text-sm flex-shrink-0">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                        <div 
                          className="bg-orange-500 h-1.5 md:h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[250px] md:h-[300px] flex items-center justify-center text-gray-500 text-sm">
                {t('admin.analytics.noDistrictData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      {data.departmentDistribution.length > 0 && (
        <Card>
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-sm md:text-lg">{t('admin.analytics.departmentDistribution')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {data.departmentDistribution.map((item, index) => {
                const maxCount = Math.max(...data.departmentDistribution.map(d => d.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={item.department} className="p-3 md:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-xs md:text-sm font-medium text-gray-900 truncate">{item.department}</span>
                      <span className="text-xs md:text-sm font-semibold text-orange-600 flex-shrink-0">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                      <div 
                        className="bg-orange-500 h-1.5 md:h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-700 mb-1">{t('admin.analytics.pendingVerification')}</p>
                <p className="text-xl md:text-3xl font-bold text-blue-900">{data.overview.pendingMembers}</p>
              </div>
              <Clock className="h-6 w-6 md:h-10 md:w-10 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-green-700 mb-1">{t('admin.analytics.thisMonthLabel')}</p>
                <p className="text-xl md:text-3xl font-bold text-green-900">{data.overview.monthlyMembers}</p>
              </div>
              <Calendar className="h-6 w-6 md:h-10 md:w-10 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-red-700 mb-1">{t('admin.analytics.rejected')}</p>
                <p className="text-xl md:text-3xl font-bold text-red-900">{data.overview.rejectedMembers}</p>
              </div>
              <XCircle className="h-6 w-6 md:h-10 md:w-10 text-red-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
