import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';

interface PasswordStrengthTesterProps {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export function PasswordStrengthTester({ passwordPolicy }: PasswordStrengthTesterProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pwd: string) => {
    const checks = {
      length: pwd.length >= passwordPolicy.minLength,
      uppercase: !passwordPolicy.requireUppercase || /[A-Z]/.test(pwd),
      lowercase: !passwordPolicy.requireLowercase || /[a-z]/.test(pwd),
      numbers: !passwordPolicy.requireNumbers || /\d/.test(pwd),
      specialChars: !passwordPolicy.requireSpecialChars || /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.values(checks).length;
    const strength = (passedChecks / totalChecks) * 100;

    return { checks, strength, passedChecks, totalChecks };
  };

  const { checks, strength, passedChecks, totalChecks } = validatePassword(password);

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600';
    if (strength >= 60) return 'text-yellow-600';
    if (strength >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return 'قوية جداً';
    if (strength >= 60) return 'قوية';
    if (strength >= 40) return 'متوسطة';
    return 'ضعيفة';
  };

  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*(),.?":{}|<>';

    let chars = '';
    let generatedPassword = '';

    // إضافة حرف واحد من كل فئة مطلوبة
    if (passwordPolicy.requireLowercase) {
      chars += lowercase;
      generatedPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    }
    if (passwordPolicy.requireUppercase) {
      chars += uppercase;
      generatedPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    }
    if (passwordPolicy.requireNumbers) {
      chars += numbers;
      generatedPassword += numbers[Math.floor(Math.random() * numbers.length)];
    }
    if (passwordPolicy.requireSpecialChars) {
      chars += specialChars;
      generatedPassword += specialChars[Math.floor(Math.random() * specialChars.length)];
    }

    // إضافة باقي الأحرف للوصول للطول المطلوب
    for (let i = generatedPassword.length; i < Math.max(passwordPolicy.minLength, 12); i++) {
      generatedPassword += chars[Math.floor(Math.random() * chars.length)];
    }

    // خلط الأحرف
    const shuffled = generatedPassword.split('').sort(() => Math.random() - 0.5).join('');
    setPassword(shuffled);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          اختبار قوة كلمة المرور
        </CardTitle>
        <CardDescription>
          تحقق من مدى قوة كلمة المرور وفقاً لسياسات الأمان المحددة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* إدخال كلمة المرور */}
        <div className="space-y-2">
          <Label htmlFor="testPassword">كلمة المرور المراد اختبارها</Label>
          <div className="relative">
            <Input
              id="testPassword"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور للاختبار"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* مؤشر القوة */}
        {password && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>قوة كلمة المرور</Label>
              <span className={`text-sm font-medium ${getStrengthColor(strength)}`}>
                {getStrengthLabel(strength)} ({passedChecks}/{totalChecks})
              </span>
            </div>
            <Progress value={strength} className="h-2" />
          </div>
        )}

        {/* تفاصيل المتطلبات */}
        {password && (
          <div className="space-y-3">
            <Label>متطلبات كلمة المرور</Label>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                {checks.length ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <span className={checks.length ? 'text-green-600' : 'text-red-600'}>
                  الحد الأدنى {passwordPolicy.minLength} أحرف
                </span>
              </div>

              {passwordPolicy.requireUppercase && (
                <div className="flex items-center gap-2">
                  {checks.uppercase ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className={checks.uppercase ? 'text-green-600' : 'text-red-600'}>
                    حرف كبير واحد على الأقل (A-Z)
                  </span>
                </div>
              )}

              {passwordPolicy.requireLowercase && (
                <div className="flex items-center gap-2">
                  {checks.lowercase ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className={checks.lowercase ? 'text-green-600' : 'text-red-600'}>
                    حرف صغير واحد على الأقل (a-z)
                  </span>
                </div>
              )}

              {passwordPolicy.requireNumbers && (
                <div className="flex items-center gap-2">
                  {checks.numbers ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className={checks.numbers ? 'text-green-600' : 'text-red-600'}>
                    رقم واحد على الأقل (0-9)
                  </span>
                </div>
              )}

              {passwordPolicy.requireSpecialChars && (
                <div className="flex items-center gap-2">
                  {checks.specialChars ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className={checks.specialChars ? 'text-green-600' : 'text-red-600'}>
                    رمز خاص واحد على الأقل (!@#$%^&*)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* زر إنشاء كلمة مرور قوية */}
        <div className="flex gap-2">
          <Button onClick={generateStrongPassword} variant="outline" className="flex-1">
            إنشاء كلمة مرور قوية
          </Button>
          {password && strength >= 80 && (
            <Button 
              onClick={() => navigator.clipboard.writeText(password)}
              variant="outline"
            >
              نسخ
            </Button>
          )}
        </div>

        {/* تحذيرات */}
        {password && strength < 60 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              كلمة المرور ضعيفة. يُنصح بتقويتها لضمان أمان أفضل لحسابك.
            </AlertDescription>
          </Alert>
        )}

        {password && strength >= 80 && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              ممتاز! كلمة المرور قوية وتلبي جميع متطلبات الأمان.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}