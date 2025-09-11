import React from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, keywords, image, url }) => {
  React.useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
    
    // Update meta keywords if provided
    if (keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'keywords';
        meta.content = keywords;
        document.head.appendChild(meta);
      }
    }
    
    // Update Open Graph tags
    const updateMetaProperty = (property: string, content: string) => {
      const existingMeta = document.querySelector(`meta[property="${property}"]`);
      if (existingMeta) {
        existingMeta.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.content = content;
        document.head.appendChild(meta);
      }
    };
    
    updateMetaProperty('og:title', title);
    updateMetaProperty('og:description', description);
    
    if (image) {
      updateMetaProperty('og:image', image);
    }
    
    if (url) {
      updateMetaProperty('og:url', url);
    }
  }, [title, description, keywords, image, url]);
  
  return null;
};