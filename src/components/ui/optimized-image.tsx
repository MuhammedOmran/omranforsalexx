import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: 'high' | 'low';
  fallback?: string;
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * مكون صورة محسن مع lazy loading وأداء محسن
 */
export function OptimizedImage({
  src,
  alt,
  priority = 'low',
  fallback = '/placeholder.svg',
  className,
  containerClassName,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(priority === 'high' ? src : '');

  useEffect(() => {
    // إذا كانت الأولوية منخفضة، استخدم Intersection Observer
    if (priority === 'low') {
      const img = new Image();
      img.loading = 'lazy';
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );

      const element = document.querySelector(`[data-src="${src}"]`);
      if (element) {
        observer.observe(element);
      }

      return () => observer.disconnect();
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    setImageSrc(fallback);
    onError?.();
  };

  return (
    <div 
      className={cn("relative overflow-hidden", containerClassName)}
      data-src={src}
    >
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* الصورة الفعلية */}
      {imageSrc && (
        <img
          {...props}
          src={imageSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          loading={priority === 'high' ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* رسالة خطأ */}
      {hasError && imageSrc === fallback && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground text-sm">
          فشل تحميل الصورة
        </div>
      )}
    </div>
  );
}