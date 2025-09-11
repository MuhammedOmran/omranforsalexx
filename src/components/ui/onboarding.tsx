import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  target?: string; // CSS selector للعنصر المستهدف
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip: () => void;
  isOpen: boolean;
}

export function Onboarding({ steps, onComplete, onSkip, isOpen }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (step?.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        
        // إضافة highlight للعنصر
        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
        element.style.borderRadius = '8px';
        element.style.transition = 'all 0.3s ease';

        // التمرير للعنصر
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.style.position = '';
        highlightedElement.style.zIndex = '';
        highlightedElement.style.boxShadow = '';
        highlightedElement.style.borderRadius = '';
        highlightedElement.style.transition = '';
      }
    };
  }, [currentStep, isOpen, highlightedElement, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-1000" />
      
      {/* Onboarding Card */}
      <div className="fixed inset-0 z-1002 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-background border shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-cairo">
                  {currentStep + 1} من {steps.length}
                </Badge>
                <CardTitle className="text-lg font-cairo">{step.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progress} className="h-2 mt-3" />
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-muted-foreground font-tajawal">{step.description}</p>
            
            <div className="bg-muted/50 rounded-lg p-4">
              {step.content}
            </div>

            {step.action && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={step.action.onClick}
                    className="w-full font-cairo"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {step.action.label}
                  </Button>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="font-cairo"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  السابق
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  className="font-cairo"
                >
                  تخطي
                </Button>
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="font-cairo"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle className="h-4 w-4 ml-1" />
                      إنهاء
                    </>
                  ) : (
                    <>
                      التالي
                      <ArrowLeft className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Hook لإدارة الـ Onboarding
export function useOnboarding(key: string) {
  const [isCompleted, setIsCompleted] = useState(() => {
    return localStorage.getItem(`onboarding_${key}`) === 'completed';
  });

  const [isOpen, setIsOpen] = useState(false);

  const start = () => {
    if (!isCompleted) {
      setIsOpen(true);
    }
  };

  const complete = () => {
    setIsOpen(false);
    setIsCompleted(true);
    localStorage.setItem(`onboarding_${key}`, 'completed');
  };

  const skip = () => {
    setIsOpen(false);
    setIsCompleted(true);
    localStorage.setItem(`onboarding_${key}`, 'completed');
  };

  const reset = () => {
    setIsCompleted(false);
    localStorage.removeItem(`onboarding_${key}`);
  };

  return {
    isCompleted,
    isOpen,
    start,
    complete,
    skip,
    reset,
  };
}

// Steps للـ Onboarding الأساسي
export const defaultOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'مرحباً بك في عمران للمبيعات',
    description: 'سنساعدك في التعرف على أهم ميزات النظام',
    content: (
      <div className="text-center space-y-3">
        <div className="text-4xl">🎉</div>
        <p className="font-tajawal">أهلاً وسهلاً! دعنا نبدأ جولة سريعة لتتعرف على النظام</p>
      </div>
    ),
  },
  {
    id: 'navigation',
    title: 'شريط التنقل',
    description: 'يمكنك الوصول لجميع أقسام النظام من هنا',
    target: '[data-sidebar]',
    content: (
      <div className="space-y-2">
        <p className="font-cairo">استخدم شريط التنقل للوصول إلى:</p>
        <ul className="text-sm space-y-1 text-muted-foreground font-tajawal">
          <li>• المبيعات والفواتير</li>
          <li>• إدارة المخزون</li>
          <li>• تقارير مفصلة</li>
          <li>• إعدادات النظام</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'dashboard',
    title: 'لوحة التحكم',
    description: 'مرحباً بك في لوحة التحكم الرئيسية',
    content: (
      <div className="space-y-2">
        <p className="font-cairo">لوحة التحكم تعرض لك:</p>
        <ul className="text-sm space-y-1 text-muted-foreground font-tajawal">
          <li>• ملخص المبيعات اليومية</li>
          <li>• حالة المخزون</li>
          <li>• الإشعارات المهمة</li>
          <li>• الإجراءات السريعة</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'quick-actions',
    title: 'الإجراءات السريعة',
    description: 'ابدأ مهامك اليومية من هنا',
    target: '[data-quick-actions]',
    content: (
      <div className="space-y-2">
        <p className="font-cairo">يمكنك بسرعة:</p>
        <ul className="text-sm space-y-1 text-muted-foreground font-tajawal">
          <li>• إنشاء فاتورة جديدة</li>
          <li>• إضافة منتج</li>
          <li>• إضافة عميل</li>
          <li>• عرض التقارير</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'notifications',
    title: 'الإشعارات',
    description: 'تابع التحديثات المهمة',
    target: '[data-notifications]',
    content: (
      <div className="space-y-2">
        <p className="font-cairo">الإشعارات تخبرك بـ:</p>
        <ul className="text-sm space-y-1 text-muted-foreground font-tajawal">
          <li>• نفاد المخزون</li>
          <li>• فواتير جديدة</li>
          <li>• تحديثات النظام</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'complete',
    title: 'مبروك! انتهيت من الجولة',
    description: 'أنت جاهز الآن لاستخدام النظام',
    content: (
      <div className="text-center space-y-3">
        <div className="text-4xl">✅</div>
        <p className="font-cairo">
          ممتاز! يمكنك الآن البدء في استخدام عمران للمبيعات بكل سهولة
        </p>
        <p className="text-sm text-muted-foreground font-tajawal">
          يمكنك دائماً العودة لهذه الجولة من إعدادات المساعدة
        </p>
      </div>
    ),
  },
];