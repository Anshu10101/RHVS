"use client";

import { useState, useEffect } from 'react';
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
  father_husband_name: string;
  mother_wife_name: string;
  registration_date: string;
  existing_member_reg_number: string;
  profile_photo_path?: string;
  district?: string;
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

  // Fetch tokens
  const fetchTokens = async () => {
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
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchTokens();
  }, [currentPage, searchTerm, selectedStatus]);


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
  }, [searchTerm]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orange-900">Token Verification</h1>
          <p className="text-orange-700/80">Verify registration tokens from potential members</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={fetchTokens}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>


      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={fetchTokens}>
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tokens Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Tokens</CardTitle>
          <CardDescription>
            Showing {tokens.length} tokens (Page {currentPage} of {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                          {token.profile_photo_path ? (
                            <Image
                              src={token.profile_photo_path}
                              alt={token.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-orange-600 font-semibold text-sm">
                              {token.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {token.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {token.existing_member_reg_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{token.email}</div>
                      <div className="text-sm text-gray-500">{token.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 max-w-xs truncate">
                        {token.token}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(token.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(token.expires_at).toLocaleDateString()}
                      </div>
                      <div className={`text-sm ${isTokenExpired(token.expires_at) ? 'text-red-500' : 'text-gray-500'}`}>
                        {isTokenExpired(token.expires_at) ? 'Expired' : 'Valid'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedToken(token);
                            setShowDetails(true);
                          }}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        {token.status === 'pending' && !isTokenExpired(token.expires_at) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyToken(token.token, 'verify')}
                              className="text-green-600 hover:text-green-700"
                              disabled={verifying}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyToken(token.token, 'reject')}
                              className="text-red-600 hover:text-red-700"
                              disabled={verifying}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {token.status === 'verified' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadCertificate(token)}
                            className="text-blue-600 hover:text-blue-700"
                            disabled={downloading}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Token Details</DialogTitle>
            <DialogDescription>
              Complete information about the registration token
            </DialogDescription>
          </DialogHeader>
          {selectedToken && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                  {selectedToken.profile_photo_path ? (
                    <Image
                      src={selectedToken.profile_photo_path}
                      alt={selectedToken.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-orange-600 font-semibold text-xl">
                      {selectedToken.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedToken.name}</h3>
                  <p className="text-gray-600">Token: {selectedToken.token}</p>
                  {getStatusBadge(selectedToken.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedToken.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedToken.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedToken.district || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedToken.department || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Father/Husband:</span>
                    <p className="text-sm text-gray-900">{selectedToken.father_husband_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Mother/Wife:</span>
                    <p className="text-sm text-gray-900">{selectedToken.mother_wife_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Registration Date:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedToken.registration_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Expires:</span>
                    <p className={`text-sm ${isTokenExpired(selectedToken.expires_at) ? 'text-red-500' : 'text-gray-900'}`}>
                      {new Date(selectedToken.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Address:</span>
                <p className="text-sm text-gray-900 mt-1">{selectedToken.address}</p>
              </div>

              {selectedToken.status === 'pending' && !isTokenExpired(selectedToken.expires_at) && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Token Verification Section */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Token Verification Required
                    </h4>
                    <p className="text-sm text-orange-700 mb-3">
                      Ask the member to provide their registration token to complete verification.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="popup-token-input">Enter Member's Token</Label>
                      <Input
                        id="popup-token-input"
                        placeholder="Enter token from member..."
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="font-mono"
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
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleVerifyToken(selectedToken.token, 'verify')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={verifying || !tokenInput.trim()}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {verifying ? 'Verifying...' : 'Verify & Register'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleVerifyToken(selectedToken.token, 'reject')}
                      className="text-red-600 hover:text-red-700"
                      disabled={verifying}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {selectedToken.status === 'verified' && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Certificate Download Section */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Member Verified Successfully
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                      This member has been verified and registered. You can download their membership certificate.
                    </p>
                  </div>
                  
                  {/* Download Button */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleDownloadCertificate(selectedToken)}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={downloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloading ? 'Downloading...' : 'Download Certificate'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
