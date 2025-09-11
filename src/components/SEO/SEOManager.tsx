import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  locale?: string;
  siteName?: string;
}

interface PageSEOConfig {
  [key: string]: SEOProps;
}

// إعدادات SEO لكل صفحة
const pageSEOConfig: PageSEOConfig = {
  '/': {
    title: 'عُمران - نظام إدارة شامل للأعمال',
    description: 'نظام إدارة متكامل للمبيعات والمخزون والمشتريات. حلول ذكية لإدارة أعمالك بكفاءة عالية.',
    keywords: 'إدارة, مبيعات, مخزون, محاسبة, فواتير, عُمران, نظام إدارة',
    type: 'website'
  },
  '/sales': {
    title: 'إدارة المبيعات - عُمران',
    description: 'نظام إدارة المبيعات الشامل مع الفواتير والعملاء والتقارير التفصيلية.',
    keywords: 'مبيعات, فواتير, عملاء, تقارير مبيعات'
  },
  '/inventory': {
    title: 'إدارة المخزون - عُمران',
    description: 'نظام إدارة المخزون المتطور مع تتبع المنتجات والباركود والتنبيهات.',
    keywords: 'مخزون, منتجات, باركود, جرد, تنبيهات'
  },
  '/purchases': {
    title: 'إدارة المشتريات - عُمران',
    description: 'نظام إدارة المشتريات والموردين مع فواتير الشراء والتقارير.',
    keywords: 'مشتريات, موردين, فواتير شراء, إدارة التكاليف'
  },
  '/reports': {
    title: 'التقارير والتحليلات - عُمران',
    description: 'تقارير تفصيلية وتحليلات متقدمة لجميع جوانب العمل.',
    keywords: 'تقارير, تحليلات, إحصائيات, أرباح, مبيعات'
  }
};

const defaultSEO: SEOProps = {
  title: 'عُمران - نظام إدارة شامل',
  description: 'نظام إدارة متكامل للأعمال مع أدوات متطورة للمبيعات والمخزون والمشتريات.',
  keywords: 'إدارة أعمال, نظام إدارة, مبيعات, مخزون, محاسبة',
  image: '/omran-latest-logo.png',
  type: 'website',
  locale: 'ar_SA',
  siteName: 'عُمران',
  author: 'عُمران للحلول التقنية'
};

/**
 * مكون إدارة SEO
 */
export function SEOManager({ 
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  locale = 'ar_SA',
  siteName = 'عُمران'
}: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    // الحصول على إعدادات الصفحة أو الافتراضية
    const pageSEO = pageSEOConfig[location.pathname] || {};
    const seoData = {
      ...defaultSEO,
      ...pageSEO,
      ...(title && { title }),
      ...(description && { description }),
      ...(keywords && { keywords }),
      ...(image && { image }),
      ...(url && { url }),
      ...(author && { author }),
      type,
      locale,
      siteName
    };

    // تحديث عنوان الصفحة
    document.title = seoData.title || defaultSEO.title!;

    // إزالة meta tags القديمة
    removeExistingMetaTags();

    // إضافة meta tags جديدة
    addMetaTag('description', seoData.description);
    addMetaTag('keywords', seoData.keywords);
    addMetaTag('author', seoData.author);
    addMetaTag('language', seoData.locale);

    // Open Graph tags
    addMetaProperty('og:title', seoData.title);
    addMetaProperty('og:description', seoData.description);
    addMetaProperty('og:type', seoData.type);
    addMetaProperty('og:image', getAbsoluteUrl(seoData.image));
    addMetaProperty('og:url', seoData.url || window.location.href);
    addMetaProperty('og:site_name', seoData.siteName);
    addMetaProperty('og:locale', seoData.locale);

    // Twitter Card tags
    addMetaTag('twitter:card', 'summary_large_image');
    addMetaTag('twitter:title', seoData.title);
    addMetaTag('twitter:description', seoData.description);
    addMetaTag('twitter:image', getAbsoluteUrl(seoData.image));

    // Additional SEO tags
    addMetaTag('robots', 'index, follow');
    addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    addMetaTag('theme-color', '#2563eb');
    addMetaTag('msapplication-TileColor', '#2563eb');

    // Canonical URL
    addLinkTag('canonical', seoData.url || window.location.href);

    // Language alternatives
    addLinkTag('alternate', window.location.href, 'hreflang', 'ar');
    addLinkTag('alternate', window.location.href, 'hreflang', 'x-default');

  }, [title, description, keywords, image, url, type, author, locale, siteName, location.pathname]);

  return null; // هذا المكون لا يعرض شيئاً
}

/**
 * إزالة meta tags الموجودة
 */
function removeExistingMetaTags(): void {
  const existingTags = document.querySelectorAll(
    'meta[name], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]'
  );
  existingTags.forEach(tag => tag.remove());
}

/**
 * إضافة meta tag
 */
function addMetaTag(name: string, content?: string, attribute: string = 'name'): void {
  if (!content) return;

  const meta = document.createElement('meta');
  meta.setAttribute(attribute, name);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

/**
 * إضافة meta property
 */
function addMetaProperty(property: string, content?: string): void {
  addMetaTag(property, content, 'property');
}

/**
 * إضافة link tag
 */
function addLinkTag(rel: string, href: string, attribute?: string, value?: string): void {
  const link = document.createElement('link');
  link.setAttribute('rel', rel);
  link.setAttribute('href', href);
  
  if (attribute && value) {
    link.setAttribute(attribute, value);
  }
  
  document.head.appendChild(link);
}

/**
 * تحويل URL نسبي إلى مطلق
 */
function getAbsoluteUrl(url?: string): string {
  if (!url) return window.location.origin + '/omran-latest-logo.png';
  if (url.startsWith('http')) return url;
  return window.location.origin + url;
}

/**
 * Hook لإدارة SEO للصفحة الحالية
 */
export function useSEO(seoProps?: SEOProps) {
  const location = useLocation();
  
  useEffect(() => {
    if (seoProps) {
      // تطبيق إعدادات SEO المخصصة
      const event = new CustomEvent('seo-update', { detail: seoProps });
      window.dispatchEvent(event);
    }
  }, [seoProps, location.pathname]);
}

/**
 * مولد Schema.org markup
 */
export function generateJSONLD(data: any): string {
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "عُمران",
    "description": "نظام إدارة شامل للأعمال",
    "url": window.location.origin,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "inLanguage": "ar"
  };

  return JSON.stringify({ ...defaultSchema, ...data });
}

/**
 * إضافة structured data
 */
export function addStructuredData(schema: any): void {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = generateJSONLD(schema);
  document.head.appendChild(script);
}