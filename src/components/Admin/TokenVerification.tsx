"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  profile_photo_path?: string;
  department?: string;
  status: 'pending' | 'verified' | 'expired' | 'rejected';
  expires_at: string;
  created_at: string;
  verified_by_admin_id?: number;
  verified_at?: string;
}

export function TokenVerification() {
  const [tokens, setTokens] = useState<RegistrationToken[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Helper function to validate and normalize image URL
  const getValidImageUrl = (url: string | undefined | null): string | null => {
    if (!url || url.trim() === '') return null;
    
    const trimmedUrl = url.trim();
    
    // If it's already a valid absolute URL, return as is
    if (trimmedUrl.startsWith('http')) {
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

      const response = await fetch(`/api/admin/verify-token?${params}`);
      const data = await response.json();

      if (data.success) {
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

      const response = await fetch('/api/admin/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Download certificate for verified tokens
  const handleDownloadCertificate = async (token: RegistrationToken) => {
    try {
      setDownloading(true);
      setError(null);
      
      console.log('🔍 Downloading certificate for token:', token.email);
      
      // Get member details from the verified token
      const response = await fetch(`/api/admin/members?search=${token.email}&status=verified`);
      const data = await response.json();
      
      console.log('📊 Member search result:', data);
      
      if (data.success && data.data.members.length > 0) {
        const member = data.data.members[0];
        console.log('👤 Found member:', member.member_reg_number);
        
        // Get certificate details
        const certResponse = await fetch(`/api/admin/certificates/${member.id}`);
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
          <p className="text-gray-600">Loading registration tokens...</p>
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
          <h1 className="text-xl sm:text-2xl font-bold text-orange-900">Token Verification</h1>
          <p className="text-sm sm:text-base text-orange-700/80 mt-1">Verify registration tokens from potential members</p>
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
            Refresh
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
                  placeholder="Search by name, email, or token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full mt-1 px-3 py-2 h-9 sm:h-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
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
          <CardTitle className="text-base sm:text-lg">Registration Tokens</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Showing {tokens.length} tokens (Page {currentPage} of {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {token.existing_member_reg_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate">{token.email}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{token.phone}</div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-mono text-gray-900 max-w-xs truncate">
                        {token.token}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(token.status)}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(token.expires_at).toLocaleDateString()}
                      </div>
                      <div className={`text-xs sm:text-sm ${isTokenExpired(token.expires_at) ? 'text-red-500' : 'text-gray-500'}`}>
                        {isTokenExpired(token.expires_at) ? 'Expired' : 'Valid'}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1 xl:space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedToken(token);
                            setShowDetails(true);
                          }}
                          className="cursor-pointer h-8 w-8 p-0"
                        >
                          <User className="h-3.5 w-3.5" />
                        </Button>
                        {token.status === 'pending' && !isTokenExpired(token.expires_at) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyToken(token.token, 'verify')}
                              className="text-green-600 hover:text-green-700 cursor-pointer disabled:cursor-not-allowed h-8 w-8 p-0"
                              disabled={verifying}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyToken(token.token, 'reject')}
                              className="text-red-600 hover:text-red-700 cursor-pointer disabled:cursor-not-allowed h-8 w-8 p-0"
                              disabled={verifying}
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
                            className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                            disabled={downloading}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                      <div className="flex items-start space-x-2">
                        <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm text-gray-900 truncate">{token.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm text-gray-900">{token.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Token & Expiry */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Token</p>
                        <p className="text-xs font-mono text-gray-900 break-all">{token.token}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expires</p>
                        <p className="text-sm text-gray-900">
                          {new Date(token.expires_at).toLocaleDateString()}
                        </p>
                        <p className={`text-xs ${isTokenExpired(token.expires_at) ? 'text-red-500' : 'text-gray-500'}`}>
                          {isTokenExpired(token.expires_at) ? 'Expired' : 'Valid'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedToken(token);
                          setShowDetails(true);
                        }}
                        className="flex-1 sm:flex-none cursor-pointer text-xs"
                      >
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        View
                      </Button>
                      {token.status === 'pending' && !isTokenExpired(token.expires_at) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyToken(token.token, 'verify')}
                            className="flex-1 sm:flex-none text-green-600 hover:text-green-700 cursor-pointer text-xs"
                            disabled={verifying}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyToken(token.token, 'reject')}
                            className="flex-1 sm:flex-none text-red-600 hover:text-red-700 cursor-pointer text-xs"
                            disabled={verifying}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      {token.status === 'verified' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCertificate(token)}
                          className="flex-1 sm:flex-none text-blue-600 hover:text-blue-700 text-xs"
                          disabled={downloading}
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Download
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
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="flex-1 sm:flex-none cursor-pointer disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              Registration Token Details
            </DialogTitle>
            <DialogDescription>
              Review member information and complete verification
            </DialogDescription>
          </DialogHeader>
          {selectedToken && (
            <div className="space-y-6">
              {/* Member Profile Header */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {isValidImageUrl(selectedToken.profile_photo_path) ? (
                      <Image
                        src={getValidImageUrl(selectedToken.profile_photo_path)!}
                        alt={selectedToken.name}
                        width={80}
                        height={80}
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
                      className="text-orange-600 font-bold text-2xl"
                      style={{ display: !isValidImageUrl(selectedToken.profile_photo_path) ? 'block' : 'none' }}
                    >
                      {selectedToken.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-gray-900 break-words">{selectedToken.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      {getStatusBadge(selectedToken.status)}
                      <div className="text-sm text-gray-600">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Registered: {new Date(selectedToken.registration_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5 text-orange-600" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-900 break-words min-w-0">{selectedToken.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-900 break-words min-w-0">{selectedToken.phone}</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-900 break-words min-w-0">{selectedToken.address}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-orange-600" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Father/Husband:</span>
                      <p className="text-sm text-gray-900 break-words">{selectedToken.father_husband_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Mother/Wife:</span>
                      <p className="text-sm text-gray-900 break-words">{selectedToken.mother_wife_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Aadhar Number:</span>
                      <p className="text-sm text-gray-900 font-mono break-words">{selectedToken.aadhar_card_number || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">State:</span>
                      <p className="text-sm text-gray-900 break-words">{selectedToken.state || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">District:</span>
                      <p className="text-sm text-gray-900 break-words">{selectedToken.district || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Department:</span>
                      <p className="text-sm text-gray-900 break-words">{selectedToken.department || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Token Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-orange-600" />
                      Token Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Token ID:</span>
                      <p className="text-xs text-gray-500 font-mono break-all bg-gray-50 p-2 rounded border">{selectedToken.token}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Expires:</span>
                      <p className={`text-sm ${isTokenExpired(selectedToken.expires_at) ? 'text-red-500 font-semibold' : 'text-gray-900'}`}>
                        {new Date(selectedToken.expires_at).toLocaleDateString()}
                        {isTokenExpired(selectedToken.expires_at) && ' (Expired)'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Existing Member ID:</span>
                      <p className="text-sm text-gray-900 font-mono break-words">{selectedToken.existing_member_reg_number}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Section */}
              {selectedToken.status === 'pending' && !isTokenExpired(selectedToken.expires_at) && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                      <Shield className="h-5 w-5" />
                      Token Verification Required
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Ask the member to provide their registration token to complete verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="popup-token-input" className="text-sm font-medium text-gray-700">
                        Enter Member&apos;s Token
                      </Label>
                      <Input
                        id="popup-token-input"
                        placeholder="Enter token from member (e.g., 523B334515310FD22364FDBA0C89527EF9CD968C998193F1C0CD20C1EFE98552)..."
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="font-mono text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleVerifyToken(selectedToken.token, 'verify');
                          }
                        }}
                      />
                      {tokenError && (
                        <p className="text-red-600 text-sm">{tokenError}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => handleVerifyToken(selectedToken.token, 'verify')}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        disabled={verifying || !tokenInput.trim()}
                        size="lg"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {verifying ? 'Verifying...' : 'Verify & Register Member'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleVerifyToken(selectedToken.token, 'reject')}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 flex-1"
                        disabled={verifying}
                        size="lg"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Reject Registration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedToken.status === 'verified' && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Token Verified</h4>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      This token has been verified and the member has been registered.
                    </p>
                    {selectedToken.verified_at && (
                      <p className="text-xs text-green-600 mt-2">
                        Verified on: {new Date(selectedToken.verified_at).toLocaleDateString()}
                      </p>
                    )}
                    <div className="mt-4">
                      <Button
                        onClick={() => handleDownloadCertificate(selectedToken)}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={downloading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading ? 'Downloading...' : 'Download Certificate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
