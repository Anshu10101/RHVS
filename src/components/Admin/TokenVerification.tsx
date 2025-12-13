"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  AlertCircle,
  Download,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';

interface RegistrationToken {
  id: number;
  token: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  state?: string;
  district?: string;
  aadhar_card_number?: string;
  father_husband_name: string;
  mother_wife_name: string;
  registration_date: string;
  existing_member_reg_number: string;
  memberRegNumber?: string | null;
  profilePhotoPath?: string | null;
  signaturePath?: string | null;
  profile_photo_path?: string | null;
  signature_path?: string | null;
  department?: string;
  status: 'pending' | 'verified' | 'expired' | 'rejected';
  expires_at: string;
  created_at: string;
  verified_by_admin_id?: number;
  verified_at?: string;
  initiated_by_name?: string | null;
  initiated_by_email?: string | null;
  initiated_by_phone?: string | null;
}

export function TokenVerification() {
  const { t } = useLanguage();
  const [tokens, setTokens] = useState<RegistrationToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [tokenToReject, setTokenToReject] = useState<string | null>(null);
  const [showQuickVerifyDialog, setShowQuickVerifyDialog] = useState(false);
  const [tokenToQuickVerify, setTokenToQuickVerify] = useState<RegistrationToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedToken, setSelectedToken] = useState<RegistrationToken | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Token verification states
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Helper function to validate and normalize image URL (ensures HTTPS)
  const getValidImageUrl = (url: string | undefined | null): string | null => {
    if (!url || url.trim() === '') return null;
    
    const trimmedUrl = url.trim();
    
    // Convert HTTP to HTTPS to prevent mixed content warnings
    if (trimmedUrl.startsWith('http://')) {
      return trimmedUrl.replace('http://', 'https://');
    }
    
    // HTTPS URLs are fine
    if (trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    
    // If it starts with /, it's already a valid path
    if (trimmedUrl.startsWith('/')) {
      return trimmedUrl;
    }
    
    // If it's a relative path with file extension, add leading slash
    if (trimmedUrl.includes('.') && (trimmedUrl.includes('/') || trimmedUrl.includes('\\'))) {
      return `/${trimmedUrl}`;
    }
    
    return null;
  };

  // Helper function to check if image URL is valid
  const isValidImageUrl = (url: string | undefined | null): boolean => {
    return getValidImageUrl(url) !== null;
  };

  // Fetch tokens
  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: selectedStatus === 'all' ? '' : selectedStatus,
      });

      // Add cache-busting timestamp
      params.append('_t', Date.now().toString());
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/verify-token?${params}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();

      if (data.success) {
        // Debug: Log first token to check date format
        if (data.data.tokens.length > 0) {
          console.log('Sample token data:', {
            expires_at: data.data.tokens[0].expires_at,
            created_at: data.data.tokens[0].created_at,
            expiresAt: data.data.tokens[0].expiresAt
          });
        }
        setTokens(data.data.tokens);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        setError(data.error || 'Failed to fetch tokens');
      }
    } catch (err) {
      setError('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus]);

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);


  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchTokens();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, fetchTokens]);

  const handleQuickVerify = async (dbToken: string) => {
    try {
      setVerifying(true);
      setTokenError(null);

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/verify-token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          token: dbToken, 
          action: 'verify', 
          adminId: 1 // TODO: Get from auth context
        }),
      });

      const data = await response.json();
      if (data.success) {
        setError(null);
        fetchTokens();
      } else {
        setError(data.message || 'Failed to verify token');
      }
    } catch (err) {
      setError('Failed to verify token');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyToken = async (dbToken: string, action: 'verify' | 'reject') => {
    try {
      setVerifying(true);
      setTokenError(null);

      // For verification, check if entered token matches database token
      if (action === 'verify') {
        if (!tokenInput.trim()) {
          setTokenError('Please enter the member\'s token');
          return;
        }
        
        if (tokenInput.trim() !== dbToken) {
          setTokenError('Token does not match. Please verify the token with the member.');
          return;
        }
      }

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/verify-token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          token: dbToken, 
          action, 
          adminId: 1 // TODO: Get from auth context
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowDetails(false);
        setSelectedToken(null);
        setTokenInput('');
        setTokenError(null);
        setError(null);
        fetchTokens();
      } else {
        setTokenError(data.message || 'Failed to verify token');
      }
    } catch (err) {
      setTokenError('Failed to verify token');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />{t('admin.members.tokens.verified')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />{t('admin.members.tokens.pending')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />{t('admin.members.tokens.rejected')}</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><AlertCircle className="w-3 h-3 mr-1" />{t('admin.members.tokens.expired')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isTokenExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return true;
    try {
      // Handle MySQL datetime format (YYYY-MM-DD HH:MM:SS) by converting to ISO format
      let dateStr = expiresAt;
      if (typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')) {
        // MySQL datetime format: convert to ISO
        dateStr = dateStr.replace(' ', 'T');
      }
      const expiryDate = new Date(dateStr);
      if (isNaN(expiryDate.getTime())) {
        console.warn('Invalid expiry date:', expiresAt);
        return true;
      }
      return expiryDate < new Date();
    } catch (error) {
      console.error('Error checking token expiry:', expiresAt, error);
      return true;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      console.warn('formatDate received null/undefined:', dateString);
      return 'N/A';
    }
    try {
      // Handle MySQL datetime format (YYYY-MM-DD HH:MM:SS) by converting to ISO format
      let dateStr = dateString;
      if (typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')) {
        // MySQL datetime format: convert to ISO
        dateStr = dateStr.replace(' ', 'T');
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date parsed:', dateString, '->', dateStr);
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  // Download certificate for verified tokens
  const handleDownloadCertificate = async (token: RegistrationToken) => {
    try {
      setDownloading(true);
      setError(null);
      
      console.log('🔍 Downloading certificate for token:', token.email);
      
      // Get member details from the verified token
      const authToken = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/members?search=${token.email}&status=verified`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await response.json();
      
      console.log('📊 Member search result:', data);
      
      if (data.success && data.data.members.length > 0) {
        const member = data.data.members[0];
        console.log('👤 Found member:', member.member_reg_number);
        
        // Get certificate details
        const authToken2 = localStorage.getItem('admin_token');
        const certResponse = await fetch(`/api/admin/certificates/${member.id}`, {
          headers: authToken2 ? { 'Authorization': `Bearer ${authToken2}` } : {}
        });
        const certData = await certResponse.json();
        
        console.log('📜 Certificate data:', certData);
        
        if (certData.success && certData.data.certificatePath) {
          // Download the certificate
          const downloadUrl = `${window.location.origin}${certData.data.certificatePath}`;
          console.log('⬇️ Downloading from:', downloadUrl);
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `RHVS_Certificate_${member.member_reg_number}.pdf`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ Certificate download initiated');
        } else {
          console.log('❌ Certificate not found');
          setError('Certificate not found for this member');
        }
      } else {
        console.log('❌ Member not found');
        setError('Member not found');
      }
    } catch (err) {
      console.error('❌ Download error:', err);
      setError('Failed to download certificate');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && tokens.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">{t('admin.members.tokens.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-orange-900">{t('admin.members.tokens.title')}</h1>
          <p className="text-sm sm:text-base text-orange-700/80 mt-1">{t('admin.members.tokens.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchTokens}
            disabled={loading}
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.members.tokens.refresh')}
          </Button>
        </div>
      </div>


      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="search" className="text-xs sm:text-sm">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('admin.members.tokens.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status" className="w-full mt-1 h-9 sm:h-10 text-sm">
                  <SelectValue placeholder={t('admin.members.tokens.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.members.tokens.allStatus')}</SelectItem>
                  <SelectItem value="pending">{t('admin.members.tokens.pending')}</SelectItem>
                  <SelectItem value="verified">{t('admin.members.tokens.verified')}</SelectItem>
                  <SelectItem value="rejected">{t('admin.members.tokens.rejected')}</SelectItem>
                  <SelectItem value="expired">{t('admin.members.tokens.expired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-sm" onClick={fetchTokens}>
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tokens Table */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">{t('admin.members.tokens.tokensList')}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t('admin.members.tokens.showing')} {tokens.length} {t('admin.members.tokens.tokens')} ({t('admin.members.page')} {currentPage} {t('admin.members.tokens.pageOf')} {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.tokens.applicant')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.contact')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.tokens.token')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.status')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.tokens.expires')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50">
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {isValidImageUrl(token.profile_photo_path) ? (
                            <Image
                              src={getValidImageUrl(token.profile_photo_path)!}
                              alt={token.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span 
                            className="text-orange-600 font-semibold text-sm"
                            style={{ display: !isValidImageUrl(token.profile_photo_path) ? 'block' : 'none' }}
                          >
                            {token.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3 xl:ml-4 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {token.name}
                          </div>
                          {(token.status === 'verified' && token.memberRegNumber) ? (
                            <div className="text-xs sm:text-sm text-green-600 truncate">
                              {token.memberRegNumber}
                          </div>
                          ) : (
                            <div className="text-xs sm:text-sm text-gray-400 truncate">
                              {t('admin.members.tokens.pendingRegistration')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 xl:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[150px] sm:max-w-none">{token.email}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">{token.phone}</div>
                    </td>
                    <td className="px-3 sm:px-4 xl:px-6 py-3 sm:py-4">
                      <div className="text-[10px] sm:text-xs font-mono text-gray-900 max-w-[120px] sm:max-w-xs truncate">
                        {token.token}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 xl:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusBadge(token.status)}
                    </td>
                    <td className="px-3 sm:px-4 xl:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-900">
                        <div className="font-medium">{t('admin.members.tokens.expiresAt')} {formatDate(token.expires_at)}</div>
                        {token.created_at && (
                          <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                            {t('admin.members.tokens.issued')} {formatDate(token.created_at)}
                          </div>
                        )}
                      </div>
                      <div className={`text-[10px] sm:text-xs mt-1 font-medium ${isTokenExpired(token.expires_at) ? 'text-red-500' : 'text-green-600'}`}>
                        {isTokenExpired(token.expires_at) ? t('admin.members.tokens.expired') : t('admin.members.tokens.valid')}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 xl:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-1 xl:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedToken(token);
                            setShowDetails(true);
                          }}
                          className="cursor-pointer h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                          title={t('admin.members.tokens.viewDetails')}
                        >
                          <User className="h-3.5 w-3.5" />
                        </Button>
                        {token.status === 'pending' && !isTokenExpired(token.expires_at) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTokenToQuickVerify(token);
                                setShowQuickVerifyDialog(true);
                              }}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 hover:border-green-400 cursor-pointer disabled:cursor-not-allowed h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                              disabled={verifying}
                              title={t('admin.members.tokens.quickVerify') || 'Quick Verify'}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTokenToReject(token.token);
                                setShowRejectConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 cursor-pointer disabled:cursor-not-allowed h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                              disabled={verifying}
                              title={t('admin.members.tokens.reject')}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {token.status === 'verified' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadCertificate(token)}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                            disabled={downloading}
                            title={t('admin.members.tokens.downloadCertificate')}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-3">
            {tokens.map((token) => (
              <Card key={token.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Applicant Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {isValidImageUrl(token.profile_photo_path) ? (
                            <Image
                              src={getValidImageUrl(token.profile_photo_path)!}
                              alt={token.name}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span 
                            className="text-orange-600 font-semibold text-base"
                            style={{ display: !isValidImageUrl(token.profile_photo_path) ? 'block' : 'none' }}
                          >
                            {token.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{token.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{token.existing_member_reg_number}</p>
                          <div className="mt-1">{getStatusBadge(token.status)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 pt-2 border-t border-gray-100">
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500 mb-0.5">{t('admin.members.tokens.email')}</p>
                          <p className="text-xs sm:text-sm text-gray-900 break-words">{token.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500 mb-0.5">{t('admin.members.tokens.phone')}</p>
                          <p className="text-xs sm:text-sm text-gray-900 break-words">{token.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Token & Expiry */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 pt-2 border-t border-gray-100">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-1">{t('admin.members.tokens.token')}</p>
                        <p className="text-[10px] sm:text-xs font-mono text-gray-900 break-all">{token.token}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-1">{t('admin.members.tokens.expires')}</p>
                        <p className="text-xs sm:text-sm text-gray-900">
                          {formatDate(token.expires_at)}
                        </p>
                        <p className={`text-[10px] sm:text-xs ${isTokenExpired(token.expires_at) ? 'text-red-500' : 'text-gray-500'}`}>
                          {isTokenExpired(token.expires_at) ? t('admin.members.tokens.expired') : t('admin.members.tokens.valid')}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 flex-1 sm:flex-none">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedToken(token);
                            setShowDetails(true);
                          }}
                          className="flex-1 sm:flex-none cursor-pointer text-xs min-w-[80px]"
                        >
                          <User className="h-3.5 w-3.5 mr-1.5" />
                          {t('admin.members.tokens.viewDetails')}
                        </Button>
                        {token.status === 'pending' && !isTokenExpired(token.expires_at) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTokenToQuickVerify(token);
                              setShowQuickVerifyDialog(true);
                            }}
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 hover:border-green-400 cursor-pointer h-8 w-8 p-0 flex-shrink-0"
                            disabled={verifying}
                            title={t('admin.members.tokens.quickVerify') || 'Quick Verify'}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                        {token.status === 'pending' && !isTokenExpired(token.expires_at) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTokenToQuickVerify(token);
                              setShowQuickVerifyDialog(true);
                            }}
                            className="flex-1 sm:flex-none bg-green-50 hover:bg-green-100 text-green-700 border-green-300 hover:border-green-400 cursor-pointer text-xs"
                            disabled={verifying}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            {t('admin.members.tokens.quickVerify')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedToken(token);
                              setShowDetails(true);
                              setTokenInput(token.token);
                            }}
                            className="flex-1 sm:flex-none text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 cursor-pointer text-xs"
                            disabled={verifying}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            {t('admin.members.tokens.verify')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTokenToReject(token.token);
                              setShowRejectConfirm(true);
                            }}
                            className="flex-1 sm:flex-none text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 cursor-pointer text-xs"
                            disabled={verifying}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            {t('admin.members.tokens.reject')}
                          </Button>
                        </>
                      )}
                      {token.status === 'verified' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCertificate(token)}
                          className="flex-1 sm:flex-none text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 text-xs"
                          disabled={downloading}
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          {t('admin.members.tokens.downloadCertificate')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="flex-1 sm:flex-none cursor-pointer disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  {t('admin.members.tokens.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="flex-1 sm:flex-none cursor-pointer disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  {t('admin.members.tokens.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-6xl max-h-[95vh] p-3 sm:p-4 md:p-6 flex flex-col">
          <DialogHeader className="px-0 sm:px-0 pb-2 sm:pb-3 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl">
              <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-orange-600" />
              </div>
              <span className="break-words">{t('admin.members.tokens.registrationTokenDetails')}</span>
            </DialogTitle>
            <DialogDescription className="text-[10px] sm:text-xs md:text-sm mt-1">
              {t('admin.members.tokens.reviewMemberInfo')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1">
          {selectedToken && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6 mt-2 sm:mt-3 md:mt-4">
              {/* Member Profile Header */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 sm:p-4 md:p-5 rounded-lg border border-orange-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0 mx-auto sm:mx-0">
                    {isValidImageUrl(selectedToken.profile_photo_path) ? (
                      <Image
                        src={getValidImageUrl(selectedToken.profile_photo_path)!}
                        alt={selectedToken.name}
                        width={80}
                        height={80}
                        className="rounded-full object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <span 
                      className="text-orange-600 font-bold text-lg sm:text-xl md:text-2xl"
                      style={{ display: !isValidImageUrl(selectedToken.profile_photo_path) ? 'block' : 'none' }}
                    >
                      {selectedToken.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">{selectedToken.name}</h3>
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-3 mt-1.5">
                      {getStatusBadge(selectedToken.status)}
                      <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 flex items-center justify-center sm:justify-start">
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-1" />
                        {t('admin.members.tokens.registered')} {new Date(selectedToken.registration_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                {/* Contact Information */}
                <Card className="h-full">
                  <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
                      <span className="break-words">{t('admin.members.tokens.contactInformation')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-2.5 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-900 break-words min-w-0 flex-1">{selectedToken.email}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-900 break-words min-w-0 flex-1">{selectedToken.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-900 break-words min-w-0 flex-1">{selectedToken.address}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="h-full">
                  <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
                      <span className="break-words">{t('admin.members.tokens.personalInformation')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-2.5 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.fatherHusband')}</span>
                      <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedToken.father_husband_name}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.motherWife')}</span>
                      <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedToken.mother_wife_name}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.aadharNumber')}</span>
                      <p className="text-xs sm:text-sm text-gray-900 font-mono break-words">{selectedToken.aadhar_card_number || t('admin.members.tokens.notAvailable')}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Information */}
                <Card className="h-full">
                  <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
                      <span className="break-words">{t('admin.members.tokens.location')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-2.5 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.state')}</span>
                      <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedToken.state || t('admin.members.tokens.notAvailable')}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.district')}</span>
                      <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedToken.district || t('admin.members.tokens.notAvailable')}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.department')}</span>
                      <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedToken.department || t('admin.members.tokens.notAvailable')}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Token Information */}
                <Card className="h-full">
                  <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                      <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
                      <span className="break-words">{t('admin.members.tokens.tokenInformation')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-2.5 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.tokenId')}</span>
                      <p className="text-[10px] sm:text-xs text-gray-500 font-mono break-all bg-gray-50 p-2 rounded border">{selectedToken.token}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.expires')}</span>
                      <p className={`text-xs sm:text-sm ${isTokenExpired(selectedToken.expires_at) ? 'text-red-500 font-semibold' : 'text-gray-900'}`}>
                        {formatDate(selectedToken.expires_at)}
                        {isTokenExpired(selectedToken.expires_at) && t('admin.members.tokens.expiredLabel')}
                      </p>
                      {selectedToken.created_at && (
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                          {t('admin.members.tokens.issued')} {formatDate(selectedToken.created_at)}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.existingMemberId')}</span>
                      <p className="text-xs sm:text-sm text-gray-900 font-mono break-words">{selectedToken.existing_member_reg_number}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Initiated By */}
                <Card className="h-full">
                  <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                      <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
                      <span className="break-words">{t('admin.members.tokens.initiatedBy')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-2.5 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.memberName')}</span>
                      <p className="text-xs sm:text-sm text-gray-900 break-words">
                        {selectedToken.initiated_by_name || t('admin.members.tokens.notProvided')}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.memberRegNo')}</span>
                      <p className="text-xs sm:text-sm text-gray-900 font-mono break-words">
                        {selectedToken.existing_member_reg_number || t('admin.members.tokens.notAvailable')}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.email')}</span>
                        <p className="text-xs sm:text-sm text-gray-900 break-words">
                          {selectedToken.initiated_by_email || t('admin.members.tokens.notAvailable')}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">{t('admin.members.tokens.phone')}</span>
                        <p className="text-xs sm:text-sm text-gray-900 break-words">
                          {selectedToken.initiated_by_phone || t('admin.members.tokens.notAvailable')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Section */}
              {selectedToken.status === 'pending' && !isTokenExpired(selectedToken.expires_at) && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-2">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2 text-orange-900">
                      <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                      <span className="break-words">{t('admin.members.tokens.tokenVerificationRequired')}</span>
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm text-orange-700 mt-1">
                      {t('admin.members.tokens.askMemberForToken')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    <div className="space-y-2">
                      <Label htmlFor="popup-token-input" className="text-xs sm:text-sm font-medium text-gray-700">
                        {t('admin.members.tokens.enterMemberToken')}
                      </Label>
                      <Input
                        id="popup-token-input"
                        placeholder={t('admin.members.tokens.enterTokenPlaceholder')}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="font-mono text-xs sm:text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleVerifyToken(selectedToken.token, 'verify');
                          }
                        }}
                      />
                      {tokenError && (
                        <p className="text-red-600 text-xs sm:text-sm">{tokenError}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-0">
                      <Button
                        onClick={() => handleVerifyToken(selectedToken.token, 'verify')}
                        className="bg-green-600 hover:bg-green-700 w-full sm:flex-1 min-w-0 h-auto sm:h-11 py-2.5 sm:py-0"
                        disabled={verifying || !tokenInput.trim()}
                        size="default"
                      >
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-center leading-tight">{verifying ? t('admin.members.tokens.verifying') : t('admin.members.tokens.verifyAndRegister')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTokenToReject(selectedToken.token);
                          setShowRejectConfirm(true);
                        }}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 w-full sm:flex-1 min-w-0 h-auto sm:h-11 py-2.5 sm:py-0"
                        disabled={verifying}
                        size="default"
                      >
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-center leading-tight">{t('admin.members.tokens.rejectRegistration')}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedToken.status === 'verified' && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      <h4 className="font-semibold text-sm sm:text-base text-green-900">{t('admin.members.tokens.tokenVerified')}</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-green-700 mt-2">
                      {t('admin.members.tokens.tokenVerifiedDesc')}
                    </p>
                    {selectedToken.verified_at && (
                      <p className="text-[10px] sm:text-xs text-green-600 mt-2">
                        {t('admin.members.tokens.verifiedOn')} {new Date(selectedToken.verified_at).toLocaleDateString()}
                      </p>
                    )}
                    <div className="mt-4">
                      <Button
                        onClick={() => handleDownloadCertificate(selectedToken)}
                        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-10 sm:h-11"
                        disabled={downloading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        <span className="text-xs sm:text-sm">{downloading ? t('admin.members.tokens.downloading') : t('admin.members.tokens.downloadCertificate')}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              {t('admin.members.tokens.confirmRejectTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {t('admin.members.tokens.confirmRejectDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              {t('admin.members.tokens.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (tokenToReject) {
                  handleVerifyToken(tokenToReject, 'reject');
                  setShowRejectConfirm(false);
                  setTokenToReject(null);
                }
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              disabled={verifying}
            >
              {t('admin.members.tokens.confirmReject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Verify Confirmation Dialog */}
      <AlertDialog open={showQuickVerifyDialog} onOpenChange={setShowQuickVerifyDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('admin.members.tokens.confirmQuickVerifyTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {t('admin.members.tokens.confirmQuickVerifyDescription')}
            </AlertDialogDescription>
            {tokenToQuickVerify && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mt-3">
                <p className="text-xs font-medium text-gray-600 mb-1">{t('admin.members.tokens.tokenId')}</p>
                <p className="text-sm font-mono text-gray-900 break-all">{tokenToQuickVerify.token}</p>
                <p className="text-xs text-gray-500 mt-2">{t('admin.members.tokens.memberName')} {tokenToQuickVerify.name}</p>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              {t('admin.members.tokens.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (tokenToQuickVerify) {
                  handleQuickVerify(tokenToQuickVerify.token);
                  setShowQuickVerifyDialog(false);
                  setTokenToQuickVerify(null);
                }
              }}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              disabled={verifying}
            >
              {t('admin.members.tokens.proceedToConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
