'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount,
  type UserProfile,
} from '@/lib/api';
import {
  User,
  Bell,
  Target,
  Shield,
  CreditCard,
  Info,
  Loader2,
  Save,
  AlertTriangle,
  ExternalLink,
  Mail,
  Calendar,
  Globe,
  Clock,
  Gauge,
  Volume2,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Constants
// =============================================================================

const NATIVE_LANGUAGES = [
  { value: 'russian', label: 'Russian' },
  { value: 'uzbek', label: 'Uzbek' },
  { value: 'kazakh', label: 'Kazakh' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'turkish', label: 'Turkish' },
  { value: 'other', label: 'Other' },
];

const ICAO_LEVELS = [
  { value: '1', label: 'Level 1 - Pre-Elementary' },
  { value: '2', label: 'Level 2 - Elementary' },
  { value: '3', label: 'Level 3 - Pre-Operational' },
  { value: '4', label: 'Level 4 - Operational' },
  { value: '5', label: 'Level 5 - Extended' },
  { value: '6', label: 'Level 6 - Expert' },
];

const DIFFICULTY_LEVELS = [
  { value: '1', label: 'Easy' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Hard' },
];

const DAILY_GOALS = [
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
];

const AUDIO_SPEEDS = [
  { value: '0.75', label: '0.75x (Slow)' },
  { value: '1', label: '1x (Normal)' },
  { value: '1.25', label: '1.25x (Fast)' },
];

const REMINDER_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const APP_VERSION = '1.0.0';

// =============================================================================
// Loading Skeleton
// =============================================================================

function SettingsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6 animate-pulse max-w-3xl">
      <div className="h-8 w-32 bg-muted rounded" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-48 bg-card rounded-xl border" />
      ))}
    </div>
  );
}

// =============================================================================
// Switch Component (simple toggle)
// =============================================================================

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// =============================================================================
// Section Header
// =============================================================================

interface SectionProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, description, children }: SectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Form Row
// =============================================================================

interface FormRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

function FormRow({ label, description, children, htmlFor }: FormRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
      <div className="space-y-0.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="sm:w-48">{children}</div>
    </div>
  );
}

// =============================================================================
// Settings Page
// =============================================================================

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLevel, setTargetLevel] = useState('4');
  const [testDate, setTestDate] = useState('');
  
  // Notifications
  const [pushEnabled, setPushEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderDays, setReminderDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  
  // Practice
  const [dailyGoal, setDailyGoal] = useState('15');
  const [difficulty, setDifficulty] = useState('2');
  const [audioSpeed, setAudioSpeed] = useState('1');
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Delete account
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch profile
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfile();
      setProfile(data);
      
      // Populate form
      setDisplayName(data.display_name || '');
      setNativeLanguage(data.native_language || '');
      setTargetLevel(data.target_icao_level?.toString() || '4');
      setTestDate(data.test_date || '');
      setPushEnabled(data.reminder_enabled ?? true);
      setReminderTime(data.reminder_time || '09:00');
      setDailyGoal(data.daily_goal_minutes?.toString() || '15');
      setDifficulty(data.preferred_difficulty?.toString() || '2');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  // Save profile settings
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        display_name: displayName,
        native_language: nativeLanguage || undefined,
        target_icao_level: parseInt(targetLevel),
        test_date: testDate || null,
        daily_goal_minutes: parseInt(dailyGoal),
        reminder_enabled: pushEnabled,
        reminder_time: reminderTime,
        preferred_difficulty: parseInt(difficulty),
      });
      
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password. Please check your current password.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast({
        title: 'Account deactivated',
        description: 'Your account has been deactivated.',
      });
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };
  
  // Toggle reminder day
  const toggleReminderDay = (day: string) => {
    setReminderDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };
  
  if (isLoading) {
    return <SettingsSkeleton />;
  }
  
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSaveProfile} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
      
      {/* Section 1: Profile */}
      <Section icon={User} title="Profile" description="Your personal information">
        <FormRow label="Display Name" htmlFor="displayName">
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </FormRow>
        
        <FormRow label="Email" description="Cannot be changed">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {profile?.email}
            </span>
          </div>
        </FormRow>
        
        <FormRow label="Native Language" htmlFor="nativeLanguage">
          <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
            <SelectTrigger id="nativeLanguage">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {NATIVE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        
        <FormRow label="Target ICAO Level" description="Your goal proficiency level">
          <Select value={targetLevel} onValueChange={setTargetLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICAO_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        
        <FormRow label="Test Date" description="When is your ICAO test?">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full"
            />
          </div>
        </FormRow>
      </Section>
      
      {/* Section 2: Notifications */}
      <Section icon={Bell} title="Notifications" description="Manage your reminders">
        <FormRow label="Push Notifications" description="Get reminded to practice">
          <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
        </FormRow>
        
        {pushEnabled && (
          <>
            <FormRow label="Reminder Time" htmlFor="reminderTime">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="reminderTime"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>
            </FormRow>
            
            <FormRow label="Reminder Days">
              <div className="flex flex-wrap gap-1">
                {REMINDER_DAYS.map((day) => (
                  <Button
                    key={day}
                    size="sm"
                    variant={reminderDays.includes(day) ? 'aviation' : 'outline'}
                    className="w-9 h-8 px-0"
                    onClick={() => toggleReminderDay(day)}
                  >
                    {day[0]}
                  </Button>
                ))}
              </div>
            </FormRow>
          </>
        )}
      </Section>
      
      {/* Section 3: Practice */}
      <Section icon={Target} title="Practice" description="Customize your learning experience">
        <FormRow label="Daily Goal" description="Minutes of practice per day">
          <Select value={dailyGoal} onValueChange={setDailyGoal}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAILY_GOALS.map((goal) => (
                <SelectItem key={goal.value} value={goal.value}>
                  {goal.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        
        <FormRow label="Difficulty Preference" description="Default exercise difficulty">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        
        <FormRow label="Default Audio Speed" description="Playback speed for listening exercises">
          <Select value={audioSpeed} onValueChange={setAudioSpeed}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIO_SPEEDS.map((speed) => (
                <SelectItem key={speed.value} value={speed.value}>
                  {speed.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
      </Section>
      
      {/* Section 4: Account */}
      <Section icon={Shield} title="Account" description="Security and account management">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Change Password</Label>
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={handleChangePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Change Password
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Delete Account
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete your account? This action cannot be undone.
                      All your progress, achievements, and data will be permanently removed.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </Section>
      
      {/* Section 5: Subscription */}
      <Section icon={CreditCard} title="Subscription" description="Manage your plan">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium capitalize">{profile?.subscription_tier || 'Free'} Plan</p>
              {profile?.subscription_expires_at && (
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(profile.subscription_expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Badge variant="secondary">
            {profile?.subscription_tier === 'free' ? 'Basic' : 'Active'}
          </Badge>
        </div>
        
        <Button className="w-full" variant="aviation">
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Premium
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Get unlimited access to all features, exercises, and AI feedback.
        </p>
      </Section>
      
      {/* Section 6: About */}
      <Section icon={Info} title="About" description="App information and legal">
        <FormRow label="Version">
          <Badge variant="outline">{APP_VERSION}</Badge>
        </FormRow>
        
        <div className="space-y-2 pt-2">
          <a 
            href="/terms" 
            target="_blank"
            className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"
          >
            <span>Terms of Service</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <a 
            href="/privacy" 
            target="_blank"
            className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"
          >
            <span>Privacy Policy</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <a 
            href="mailto:support@avilingo.com"
            className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"
          >
            <span>Contact Support</span>
            <Mail className="w-4 h-4" />
          </a>
        </div>
        
        <p className="text-xs text-muted-foreground text-center pt-4">
          © 2024 AviLingo. All rights reserved.
        </p>
      </Section>
    </div>
  );
}

