'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plane, Mail, Lock, User, Globe, Target, Loader2, Eye, EyeOff, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'other', name: 'Other' },
];

const ICAO_LEVELS = [
  { level: 4, name: 'Operational', description: 'Required for international flights' },
  { level: 5, name: 'Extended', description: 'Advanced proficiency' },
  { level: 6, name: 'Expert', description: 'Native-like fluency' },
];

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    nativeLanguage: '',
    targetIcaoLevel: 4,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState(1);

  const updateField = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep1 = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain an uppercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain a number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNextStep();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        display_name: formData.displayName.trim(),
        native_language: formData.nativeLanguage || undefined,
        target_icao_level: formData.targetIcaoLevel,
      });
      
      toast({
        title: 'Verification code sent!',
        description: 'Please check your email for the verification code.',
      });
      
      // Redirect to verification page with email
      router.push(`/verify-email?email=${encodeURIComponent(response.email)}`);
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Plane className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          {step === 1 
            ? 'Start your aviation English journey today'
            : 'Tell us about your learning goals'
          }
        </CardDescription>
        
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <>
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Captain John Smith"
                  value={formData.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  variant="aviation"
                  icon={<User className="w-4 h-4" />}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.displayName}
                />
                {errors.displayName && (
                  <p className="text-xs text-destructive">{errors.displayName}</p>
                )}
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="pilot@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  variant="aviation"
                  icon={<Mail className="w-4 h-4" />}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
              
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    variant="aviation"
                    icon={<Lock className="w-4 h-4" />}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.password}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[...Array(6)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i < passwordStrength.score ? passwordStrength.color : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength: <span className={passwordStrength.score > 4 ? 'text-green-500' : passwordStrength.score > 2 ? 'text-amber-500' : 'text-red-500'}>{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>
              
              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  variant="aviation"
                  icon={<Lock className="w-4 h-4" />}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.confirmPassword}
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Native Language */}
              <div className="space-y-2">
                <Label htmlFor="nativeLanguage">Native Language (Optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    id="nativeLanguage"
                    value={formData.nativeLanguage}
                    onChange={(e) => updateField('nativeLanguage', e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    disabled={isSubmitting}
                  >
                    <option value="">Select your native language</option>
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  This helps us personalize your learning experience
                </p>
              </div>
              
              {/* Target ICAO Level */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <Label>Target ICAO Level</Label>
                </div>
                <div className="space-y-2">
                  {ICAO_LEVELS.map((level) => (
                    <button
                      key={level.level}
                      type="button"
                      onClick={() => updateField('targetIcaoLevel', level.level)}
                      disabled={isSubmitting}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        formData.targetIcaoLevel === level.level
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={
                              level.level === 4 ? 'icao-4' : 
                              level.level === 5 ? 'icao-5' : 'icao-6'
                            }
                          >
                            Level {level.level}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">{level.name}</p>
                            <p className="text-xs text-muted-foreground">{level.description}</p>
                          </div>
                        </div>
                        {formData.targetIcaoLevel === level.level && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <div className="flex gap-3 w-full">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              variant="aviation"
              className="flex-1"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : step === 1 ? (
                'Continue'
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

