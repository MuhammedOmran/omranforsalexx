import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Slider } from './slider';
import { Label } from './label';
import { useToast } from './use-toast';
import { 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Upload,
  Scissors,
  Palette,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageEditorProps {
  onImageProcessed?: (processedImage: Blob) => void;
  className?: string;
}

interface ImageFilter {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  scale: number;
}

export function ImageEditor({ onImageProcessed, className }: ImageEditorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState<ImageFilter>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    scale: 1
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setOriginalImage(img);
        drawImage(img, filters);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const drawImage = useCallback((img: HTMLImageElement, currentFilters: ImageFilter) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    // تطبيق الفلاتر
    ctx.filter = `
      brightness(${currentFilters.brightness}%) 
      contrast(${currentFilters.contrast}%) 
      saturate(${currentFilters.saturation}%)
    `;

    // مسح الكانفاس
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // حفظ الحالة للتدوير والتكبير
    ctx.save();

    // تطبيق التحويلات
    if (currentFilters.rotation !== 0 || currentFilters.scale !== 1) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((currentFilters.rotation * Math.PI) / 180);
      ctx.scale(currentFilters.scale, currentFilters.scale);
      ctx.translate(-centerX, -centerY);
    }

    // رسم الصورة
    ctx.drawImage(img, 0, 0);
    
    // استعادة الحالة
    ctx.restore();
  }, []);

  const updateFilter = useCallback((filterName: keyof ImageFilter, value: number) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    if (image) {
      drawImage(image, newFilters);
    }
  }, [filters, image, drawImage]);

  const resetFilters = () => {
    const defaultFilters: ImageFilter = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      scale: 1
    };
    setFilters(defaultFilters);
    
    if (originalImage) {
      drawImage(originalImage, defaultFilters);
    }
  };

  const removeBackground = async () => {
    if (!image) return;

    setIsProcessing(true);
    try {
      // تحديث: استخدام مكتبة إزالة الخلفية
      const { removeBackground, loadImage } = await import('@/utils/backgroundRemoval');
      
      // تحويل الكانفاس إلى blob
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });

      // تحميل الصورة وإزالة الخلفية
      const imageElement = await loadImage(blob);
      const processedBlob = await removeBackground(imageElement);
      
      // تحديث الصورة المعروضة
      const processedImage = new Image();
      processedImage.onload = () => {
        setImage(processedImage);
        drawImage(processedImage, filters);
      };
      processedImage.src = URL.createObjectURL(processedBlob);

      toast({
        title: "تم إزالة الخلفية بنجاح",
        description: "تم معالجة الصورة وإزالة الخلفية",
      });
    } catch (error) {
      toast({
        title: "خطأ في معالجة الصورة",
        description: "لا يمكن إزالة الخلفية من هذه الصورة",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited-image-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        onImageProcessed?.(blob);
        
        toast({
          title: "تم تحميل الصورة",
          description: "تم حفظ الصورة المعدلة بنجاح",
        });
      }
    }, 'image/png');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            محرر الصور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* رفع الصورة */}
          {!image && (
            <div className="text-center">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">اختر صورة للتعديل</h3>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, GIF حتى 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* عرض الصورة */}
          {image && (
            <>
              <div className="flex justify-center border rounded-lg p-4 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto max-h-96 border rounded"
                  style={{ objectFit: 'contain' }}
                />
              </div>

              {/* أدوات التعديل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* فلاتر الألوان */}
                <div className="space-y-4">
                  <h4 className="font-medium">فلاتر الألوان</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>السطوع: {filters.brightness}%</Label>
                      <Slider
                        value={[filters.brightness]}
                        onValueChange={([value]) => updateFilter('brightness', value)}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>التباين: {filters.contrast}%</Label>
                      <Slider
                        value={[filters.contrast]}
                        onValueChange={([value]) => updateFilter('contrast', value)}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>التشبع: {filters.saturation}%</Label>
                      <Slider
                        value={[filters.saturation]}
                        onValueChange={([value]) => updateFilter('saturation', value)}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* تحويلات هندسية */}
                <div className="space-y-4">
                  <h4 className="font-medium">التحويلات</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>التدوير: {filters.rotation}°</Label>
                      <Slider
                        value={[filters.rotation]}
                        onValueChange={([value]) => updateFilter('rotation', value)}
                        min={-180}
                        max={180}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>التكبير: {filters.scale}x</Label>
                      <Slider
                        value={[filters.scale]}
                        onValueChange={([value]) => updateFilter('scale', value)}
                        min={0.1}
                        max={3}
                        step={0.1}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFilter('rotation', filters.rotation - 90)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFilter('rotation', filters.rotation + 90)}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFilter('scale', Math.max(0.1, filters.scale - 0.1))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFilter('scale', Math.min(3, filters.scale + 0.1))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* أدوات متقدمة */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={removeBackground}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 ml-2" />
                  {isProcessing ? 'جاري المعالجة...' : 'إزالة الخلفية'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={resetFilters}
                >
                  إعادة تعيين
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 ml-2" />
                  صورة جديدة
                </Button>
                
                <Button onClick={downloadImage} className="mr-auto">
                  <Download className="h-4 w-4 ml-2" />
                  تحميل الصورة
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}