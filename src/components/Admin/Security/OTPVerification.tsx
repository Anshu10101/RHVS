"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Shield, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface OTPVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<boolean>;
  phoneNumber: string;
  onResend: () => Promise<void>;
}

export function OTPVerification({
  isOpen,
  onClose,
  onVerify,
  phoneNumber,
  onResend,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setVerificationStatus('idle');
      setTimeLeft(60);
      setCanResend(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setIsVerifying(true);
    setVerificationStatus('idle');

    try {
      const isValid = await onVerify(otp);
      setVerificationStatus(isValid ? 'success' : 'error');
      
      if (isValid) {
        setTimeout(() => {
          onClose();
          setOtp('');
          setVerificationStatus('idle');
        }, 2000);
      }
    } catch (error) {
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      setTimeLeft(60);
      setCanResend(false);
      setOtp('');
      setVerificationStatus('idle');
    } catch (error) {
      // Handle error
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (value: string) => {
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setOtp(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Verify OTP</h2>
          <p className="text-sm text-gray-600 mt-2">
            Enter the 6-digit code sent to <br />
            <span className="font-medium text-gray-900">{phoneNumber}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder="000000"
              className="text-center text-lg tracking-widest"
              maxLength={6}
              disabled={isVerifying}
            />
          </div>

          {verificationStatus === 'success' && (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">OTP verified successfully!</span>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Invalid OTP. Please try again.</span>
            </div>
          )}

          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>
                {canResend ? 'Can resend now' : `Resend in ${timeLeft}s`}
              </span>
            </div>
            <button
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="text-orange-600 hover:text-orange-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {isResending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Resend OTP</span>
            </button>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={otp.length !== 6 || isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
