import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Scan, Camera, StopCircle, Package, DollarSign, BarChart3 } from 'lucide-react';
import { useBarcodeManagement } from '@/hooks/useBarcodeManagement';
import { toast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onProductFound?: (product: any) => void;
  autoFocus?: boolean;
}

export function BarcodeScanner({ onProductFound, autoFocus = true }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  
  const { findProductByBarcode } = useBarcodeManagement();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // التحقق من توفر الكاميرا
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        setHasCamera(hasVideoInput);
      })
      .catch(() => setHasCamera(false));
  }, []);

  // تركيز تلقائي على حقل الإدخال
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // بدء مسح الباركود بالكاميرا
  const startCameraScanning = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // الكاميرا الخلفية للهواتف
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      setError('لا يمكن الوصول إلى الكاميرا. تأكد من منح الإذن للوصول إلى الكاميرا.');
      toast({
        title: "خطأ في الكاميرا",
        description: "تعذر الوصول إلى الكاميرا",
        variant: "destructive"
      });
    }
  };

  // إيقاف مسح الكاميرا
  const stopCameraScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // التنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      stopCameraScanning();
    };
  }, []);

  // معالجة الباركود المدخل يدوياً
  const handleManualScan = () => {
    if (!scannedCode.trim()) return;
    
    searchProduct(scannedCode.trim());
  };

  // البحث عن المنتج بالباركود
  const searchProduct = (barcode: string) => {
    const product = findProductByBarcode(barcode);
    
    if (product) {
      setLastScannedProduct(product);
      onProductFound?.(product);
      toast({
        title: "تم العثور على المنتج",
        description: `${product.name} - ${product.price} ج.م`
      });
    } else {
      setLastScannedProduct(null);
      toast({
        title: "لم يتم العثور على المنتج",
        description: "الباركود غير مسجل في النظام",
        variant: "destructive"
      });
    }
  };

  // معالجة مفاتيح الإدخال
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualScan();
    }
  };

  return (
    <div className="space-y-4">
      {/* مسح يدوي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse font-cairo">
            <Scan className="h-5 w-5" />
            <span>مسح الباركود</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2 space-x-reverse">
            <Input
              ref={inputRef}
              placeholder="ادخل أو امسح الباركود..."
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="font-mono"
            />
            <Button onClick={handleManualScan} disabled={!scannedCode.trim()}>
              <Scan className="h-4 w-4 me-2" />
              بحث
            </Button>
          </div>

          {/* أزرار الكاميرا */}
          {hasCamera && (
            <div className="flex space-x-2 space-x-reverse">
              {!isScanning ? (
                <Button
                  variant="outline"
                  onClick={startCameraScanning}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 me-2" />
                  بدء مسح بالكاميرا
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={stopCameraScanning}
                  className="flex-1"
                >
                  <StopCircle className="h-4 w-4 me-2" />
                  إيقاف المسح
                </Button>
              )}
            </div>
          )}

          {/* عرض أخطاء الكاميرا */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* عرض الكاميرا */}
      {isScanning && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary border-dashed w-48 h-16 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-medium bg-background/80 px-2 py-1 rounded">
                    ضع الباركود هنا
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              وجه الكاميرا نحو الباركود المراد مسحه
            </p>
          </CardContent>
        </Card>
      )}

      {/* عرض نتيجة المسح */}
      {lastScannedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo text-success">تم العثور على المنتج!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium font-tajawal">{lastScannedProduct.name}</span>
                <Badge variant="secondary">{lastScannedProduct.code}</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-tajawal">السعر:</span>
                  <span className="font-bold">{lastScannedProduct.price} ج.م</span>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="font-tajawal">المخزون:</span>
                  <span className="font-bold">{lastScannedProduct.stock}</span>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="font-tajawal">التكلفة:</span>
                  <span className="font-bold">{lastScannedProduct.cost} ج.م</span>
                </div>
              </div>
              
              {lastScannedProduct.category && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-muted-foreground font-tajawal">الفئة:</span>
                  <Badge variant="outline">{lastScannedProduct.category}</Badge>
                </div>
              )}
              
              <div className="bg-muted/50 p-2 rounded font-mono text-sm text-center">
                الباركود: {lastScannedProduct.barcode}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* تعليمات الاستخدام */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo text-sm">تعليمات الاستخدام</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1 font-tajawal">
            <li>• يمكنك إدخال الباركود يدوياً في حقل النص</li>
            <li>• اضغط Enter أو زر البحث للبحث عن المنتج</li>
            {hasCamera && <li>• استخدم الكاميرا لمسح الباركود تلقائياً</li>}
            <li>• سيظهر تفاصيل المنتج عند العثور عليه</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}