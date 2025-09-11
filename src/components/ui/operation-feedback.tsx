import React, { useState, useEffect } from 'react';
import { Progress } from './progress';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Download,
  Upload,
  Database,
  FileText,
  X
} from 'lucide-react';

export interface OperationProgress {
  id: string;
  type: 'upload' | 'download' | 'export' | 'import' | 'sync' | 'backup' | 'process';
  title: string;
  description?: string;
  progress: number; // 0-100
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  error?: string;
  result?: any;
  cancellable?: boolean;
}

interface OperationFeedbackProps {
  operations: OperationProgress[];
  onCancel?: (operationId: string) => void;
  onRetry?: (operationId: string) => void;
  onDismiss?: (operationId: string) => void;
  className?: string;
}

export function OperationFeedback({ 
  operations, 
  onCancel, 
  onRetry, 
  onDismiss,
  className 
}: OperationFeedbackProps) {
  const [expandedOperations, setExpandedOperations] = useState<string[]>([]);
  const [dismissedOperations, setDismissedOperations] = useState<string[]>([]);

  const toggleExpanded = (operationId: string) => {
    setExpandedOperations(prev => 
      prev.includes(operationId) 
        ? prev.filter(id => id !== operationId)
        : [...prev, operationId]
    );
  };

  const handleDismiss = (operationId: string) => {
    setDismissedOperations(prev => [...prev, operationId]);
    onDismiss?.(operationId);
  };

  const getOperationIcon = (type: OperationProgress['type'], status: OperationProgress['status']) => {
    if (status === 'running') {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    switch (type) {
      case 'upload':
        return <Upload className="h-4 w-4" />;
      case 'download':
        return <Download className="h-4 w-4" />;
      case 'export':
        return <FileText className="h-4 w-4" />;
      case 'import':
        return <Database className="h-4 w-4" />;
      case 'sync':
        return <Database className="h-4 w-4" />;
      case 'backup':
        return <Database className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: OperationProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: OperationProgress['status']) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'running':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'error':
        return 'خطأ';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration} ثانية`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)} دقيقة`;
    } else {
      return `${Math.floor(duration / 3600)} ساعة`;
    }
  };

  const visibleOperations = operations.filter(op => !dismissedOperations.includes(op.id));

  if (visibleOperations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {visibleOperations.map((operation) => {
        const isExpanded = expandedOperations.includes(operation.id);
        
        return (
          <Card key={operation.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getOperationIcon(operation.type, operation.status)}
                  <CardTitle className="text-sm">{operation.title}</CardTitle>
                  {getStatusIcon(operation.status)}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(operation.status)}
                  </Badge>
                  
                  {(operation.status === 'completed' || operation.status === 'error') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(operation.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* شريط التقدم */}
              {operation.status === 'running' && (
                <div className="space-y-2 mb-3">
                  <Progress value={operation.progress} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{operation.progress}%</span>
                    <span>{formatDuration(operation.startTime)}</span>
                  </div>
                </div>
              )}

              {/* الوصف */}
              {operation.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {operation.description}
                </p>
              )}

              {/* رسالة الخطأ */}
              {operation.status === 'error' && operation.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 mb-1">
                        حدث خطأ أثناء العملية
                      </p>
                      <p className="text-xs text-red-600">
                        {operation.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* معلومات إضافية عند التوسيع */}
              {isExpanded && (
                <div className="space-y-2 border-t pt-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">بدأت في:</span>
                      <p>{operation.startTime.toLocaleString('ar-SA')}</p>
                    </div>
                    {operation.endTime && (
                      <div>
                        <span className="text-muted-foreground">انتهت في:</span>
                        <p>{operation.endTime.toLocaleString('ar-SA')}</p>
                      </div>
                    )}
                  </div>
                  
                  {operation.result && (
                    <div>
                      <span className="text-muted-foreground text-xs">النتيجة:</span>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(operation.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* الأزرار */}
              <div className="flex gap-2 mt-3">
                {operation.status === 'running' && operation.cancellable && onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(operation.id)}
                  >
                    إلغاء
                  </Button>
                )}
                
                {operation.status === 'error' && onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(operation.id)}
                  >
                    إعادة المحاولة
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(operation.id)}
                  className="text-xs"
                >
                  {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// هوك لإدارة العمليات
export function useOperationProgress() {
  const [operations, setOperations] = useState<OperationProgress[]>([]);

  const startOperation = (operation: Omit<OperationProgress, 'id' | 'startTime'>) => {
    const newOperation: OperationProgress = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date()
    };
    
    setOperations(prev => [...prev, newOperation]);
    return newOperation.id;
  };

  const updateOperation = (id: string, updates: Partial<OperationProgress>) => {
    setOperations(prev => 
      prev.map(op => 
        op.id === id 
          ? { 
              ...op, 
              ...updates,
              endTime: updates.status === 'completed' || updates.status === 'error' 
                ? new Date() 
                : op.endTime
            }
          : op
      )
    );
  };

  const removeOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const clearCompleted = () => {
    setOperations(prev => 
      prev.filter(op => op.status !== 'completed' && op.status !== 'error')
    );
  };

  return {
    operations,
    startOperation,
    updateOperation,
    removeOperation,
    clearCompleted
  };
}