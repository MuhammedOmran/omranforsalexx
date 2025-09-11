import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Progress } from './progress';
import { useToast } from './use-toast';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUpload?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // في ميجابايت
  className?: string;
  disabled?: boolean;
}

interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  preview?: string;
}

export function FileUpload({ 
  onFileUpload, 
  accept = "*", 
  multiple = true, 
  maxSize = 10,
  className,
  disabled = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
    return File;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: `الحد الأقصى المسموح: ${maxSize} ميجابايت`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleFiles = async (files: FileList) => {
    const validFiles: File[] = [];
    const newUploadFiles: UploadFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (validateFile(file)) {
        validFiles.push(file);
        const preview = await createFilePreview(file);
        newUploadFiles.push({
          ...file,
          id: `${Date.now()}-${i}`,
          progress: 0,
          status: 'pending',
          preview
        });
      }
    }

    if (validFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...newUploadFiles]);
      simulateUpload(newUploadFiles);
      onFileUpload?.(validFiles);
    }
  };

  const simulateUpload = async (files: UploadFile[]) => {
    for (const file of files) {
      setUploadFiles(prev => 
        prev.map(f => f.id === file.id ? { ...f, status: 'uploading' } : f)
      );

      // محاكاة التحميل
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadFiles(prev => 
          prev.map(f => f.id === file.id ? { ...f, progress } : f)
        );
      }

      setUploadFiles(prev => 
        prev.map(f => f.id === file.id ? { ...f, status: 'success' } : f)
      );
    }
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* منطقة السحب والإفلات */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
        
        <Upload className={cn(
          "h-12 w-12 mx-auto mb-4 transition-colors",
          dragActive ? "text-primary" : "text-gray-400"
        )} />
        
        <h3 className="text-lg font-medium mb-2">
          {dragActive ? "أفلت الملفات هنا" : "اسحب الملفات هنا أو انقر للاختيار"}
        </h3>
        
        <p className="text-sm text-muted-foreground">
          الحد الأقصى: {maxSize} ميجابايت لكل ملف
          {accept !== "*" && ` • أنواع مدعومة: ${accept}`}
        </p>
        
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <Upload className="h-4 w-4 ml-2" />
          اختيار الملفات
        </Button>
      </div>

      {/* قائمة الملفات المرفوعة */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">الملفات المرفوعة:</h4>
          {uploadFiles.map((file) => {
            const FileIcon = getFileIcon(file);
            
            return (
              <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {file.preview ? (
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </div>
                  
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="w-full mt-1" />
                  )}
                  
                  {file.status === 'success' && (
                    <div className="text-xs text-green-600 mt-1">✓ تم الرفع بنجاح</div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="text-xs text-red-600 mt-1">✗ فشل في الرفع</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}