'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const { verifyEmail, resendCode, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);
  
  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    if (value && index === 5 && newCode.every(d => d !== '')) {
      handleSubmit(newCode.join(''));
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newCode = [...code];
        digits.forEach((digit, i) => {
          if (i < 6) newCode[i] = digit;
        });
        setCode(newCode);
        
        // Focus last filled input or submit
        const lastIndex = Math.min(digits.length - 1, 5);
        inputRefs.current[lastIndex]?.focus();
        
        if (newCode.every(d => d !== '')) {
          handleSubmit(newCode.join(''));
        }
      });
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    const newCode = [...code];
    digits.forEach((digit, i) => {
      if (i < 6) newCode[i] = digit;
    });
    setCode(newCode);
    
    // Focus last filled input or submit
    const lastIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
    
    if (newCode.every(d => d !== '')) {
      handleSubmit(newCode.join(''));
    }
  };
  
  const handleSubmit = async (codeString?: string) => {
    const verificationCode = codeString || code.join('');
    
    if (verificationCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the complete 6-digit code',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await verifyEmail({ email, code: verificationCode });
      toast({
        title: 'Email verified!',
        description: 'Welcome to AviLingo. Your account is ready.',
      });
      // Auth context will redirect to dashboard
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'Invalid or expired code',
        variant: 'destructive',
      });
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    
    try {
      await resendCode(email);
      toast({
        title: 'Code sent!',
        description: 'A new verification code has been sent to your email.',
      });
      setResendCooldown(60); // 60 second cooldown
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast({
        title: 'Failed to resend',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };
  
  if (!email) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invalid Link</CardTitle>
          <CardDescription>
            No email address provided. Please register again.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/register" className="w-full">
            <Button variant="aviation" className="w-full">
              Go to Registration
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Verify your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to<br />
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Code Input */}
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isSubmitting || isLoading}
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Submit Button */}
        <Button
          onClick={() => handleSubmit()}
          variant="aviation"
          className="w-full"
          size="lg"
          disabled={isSubmitting || isLoading || code.some(d => d === '')}
        >
          {isSubmitting || isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>
        
        {/* Resend Code */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Didn't receive the code?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="text-primary hover:text-primary/80"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend in {resendCooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend code
              </>
            )}
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4">
        <div className="w-full border-t pt-4">
          <Link href="/register" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to registration
          </Link>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          The code expires in 3 minutes. Check your spam folder if you don't see the email.
        </p>
      </CardFooter>
    </Card>
  );
}

