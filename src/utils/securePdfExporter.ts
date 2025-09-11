// Secure PDF exporter that prevents XSS attacks
import jsPDF from 'jspdf';

interface SecurePdfOptions {
  title: string;
  subtitle?: string;
  sections: Array<{
    title: string;
    content: Array<{
      label: string;
      value: string | number;
    }>;
  }>;
  tables?: Array<{
    title: string;
    headers: string[];
    rows: (string | number)[][];
  }>;
}

// Sanitize text to prevent XSS
const sanitizeText = (text: string | number): string => {
  if (typeof text === 'number') return text.toString();
  if (typeof text !== 'string') return '';
  
  // Remove HTML tags and potentially dangerous characters
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, match => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;'
      };
      return map[match] || match;
    })
    .trim();
};

export const generateSecurePdf = (options: SecurePdfOptions): jsPDF => {
  const pdf = new jsPDF();
  let yPosition = 20;
  
  // Title (sanitized)
  pdf.setFontSize(20);
  pdf.text(sanitizeText(options.title), 20, yPosition);
  yPosition += 20;
  
  // Subtitle (sanitized)
  if (options.subtitle) {
    pdf.setFontSize(14);
    pdf.text(sanitizeText(options.subtitle), 20, yPosition);
    yPosition += 15;
  }
  
  // Sections
  options.sections.forEach(section => {
    // Section title (sanitized)
    pdf.setFontSize(16);
    pdf.text(sanitizeText(section.title), 20, yPosition);
    yPosition += 10;
    
    // Section content
    pdf.setFontSize(12);
    section.content.forEach(item => {
      const label = sanitizeText(item.label);
      const value = sanitizeText(item.value);
      pdf.text(`${label}: ${value}`, 20, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
  });
  
  // Tables
  if (options.tables) {
    options.tables.forEach(table => {
      // Table title (sanitized)
      pdf.setFontSize(14);
      pdf.text(sanitizeText(table.title), 20, yPosition);
      yPosition += 10;
      
      // Table headers (sanitized)
      const sanitizedHeaders = table.headers.map(sanitizeText);
      let xPosition = 20;
      sanitizedHeaders.forEach(header => {
        pdf.text(header, xPosition, yPosition);
        xPosition += 60; // Column width
      });
      yPosition += 8;
      
      // Table rows (sanitized)
      table.rows.forEach(row => {
        xPosition = 20;
        row.forEach(cell => {
          pdf.text(sanitizeText(cell), xPosition, yPosition);
          xPosition += 60;
        });
        yPosition += 8;
      });
      
      yPosition += 10;
    });
  }
  
  return pdf;
};