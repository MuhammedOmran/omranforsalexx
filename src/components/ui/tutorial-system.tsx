import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Progress } from './progress';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, BookOpen, Lightbulb, HelpCircle } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector للعنصر المستهدف
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  image?: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
  estimatedTime: string;
  steps: TutorialStep[];
}

const tutorials: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'البدء مع النظام',
    description: 'تعلم أساسيات استخدام نظام إدارة المبيعات',
    category: 'أساسيات',
    difficulty: 'مبتدئ',
    estimatedTime: '5 دقائق',
    steps: [
      {
        id: 'step1',
        title: 'مرحباً بك في نظام إدارة المبيعات',
        description: 'هذا النظام يساعدك في إدارة مبيعاتك ومخزونك بكفاءة عالية',
        action: 'ابدأ الجولة'
      },
      {
        id: 'step2',
        title: 'القائمة الجانبية',
        description: 'من هنا يمكنك الوصول لجميع أقسام النظام',
        target: '.sidebar',
        position: 'right'
      },
      {
        id: 'step3',
        title: 'لوحة المعلومات',
        description: 'عرض سريع لأهم المؤشرات والإحصائيات',
        target: '.dashboard',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'sales-process',
    title: 'عملية البيع',
    description: 'تعلم كيفية إنشاء فاتورة مبيعات جديدة',
    category: 'المبيعات',
    difficulty: 'متوسط',
    estimatedTime: '8 دقائق',
    steps: [
      {
        id: 'step1',
        title: 'الانتقال لقسم المبيعات',
        description: 'اضغط على المبيعات من القائمة الجانبية',
        target: 'a[href="/sales"]',
        position: 'right'
      },
      {
        id: 'step2',
        title: 'إنشاء فاتورة جديدة',
        description: 'اضغط على زر "فاتورة جديدة" لبدء عملية البيع',
        target: 'button[data-testid="new-invoice"]',
        position: 'top'
      }
    ]
  }
];

interface TutorialSystemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TutorialSystem({ open, onOpenChange }: TutorialSystemProps) {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

  useEffect(() => {
    const completed = localStorage.getItem('completed-tutorials');
    if (completed) {
      setCompletedTutorials(JSON.parse(completed));
    }
  }, []);

  const startTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const nextStep = () => {
    if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    if (selectedTutorial) {
      const newCompleted = [...completedTutorials, selectedTutorial.id];
      setCompletedTutorials(newCompleted);
      localStorage.setItem('completed-tutorials', JSON.stringify(newCompleted));
    }
    setSelectedTutorial(null);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const resetTutorial = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'مبتدئ':
        return 'bg-green-500';
      case 'متوسط':
        return 'bg-yellow-500';
      case 'متقدم':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (selectedTutorial) {
    const currentStepData = selectedTutorial.steps[currentStep];
    const progress = ((currentStep + 1) / selectedTutorial.steps.length) * 100;

    return (
      <Dialog open={!!selectedTutorial} onOpenChange={() => setSelectedTutorial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedTutorial.title}
              </DialogTitle>
              <Badge variant="outline">
                {currentStep + 1} من {selectedTutorial.steps.length}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <Progress value={progress} className="w-full" />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {currentStepData.description}
                </p>
                
                {currentStepData.action && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        إجراء مطلوب: {currentStepData.action}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  السابق
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTutorial}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  إعادة
                </Button>
              </div>

              <Button onClick={nextStep}>
                {currentStep === selectedTutorial.steps.length - 1 ? 'إنهاء' : 'التالي'}
                {currentStep < selectedTutorial.steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            المساعدة والتوجيهات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tutorials.map((tutorial) => {
              const isCompleted = completedTutorials.includes(tutorial.id);
              
              return (
                <Card 
                  key={tutorial.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isCompleted ? 'border-green-200 bg-green-50' : ''
                  }`}
                  onClick={() => startTutorial(tutorial)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{tutorial.title}</CardTitle>
                      {isCompleted && (
                        <Badge variant="default" className="bg-green-500">
                          مكتمل
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {tutorial.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getDifficultyColor(tutorial.difficulty)}`}
                      >
                        {tutorial.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {tutorial.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {tutorial.estimatedTime}
                      </span>
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        ابدأ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">نصائح سريعة</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">اختصارات المفاتيح</h4>
                <p className="text-sm text-blue-700">اضغط Ctrl+K لفتح البحث السريع</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">حفظ تلقائي</h4>
                <p className="text-sm text-green-700">جميع بياناتك محفوظة تلقائياً</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}