import React from 'react';
import { InvoiceShareDialog } from './InvoiceShareDialog';
import { useCompanyLogoSupabase } from '@/hooks/useCompanyLogoSupabase';

interface InvoiceShareWithLogoProps {
  invoiceData: any;
}

export function InvoiceShareWithLogo({ 
  invoiceData
}: InvoiceShareWithLogoProps) {
  const { currentLogo } = useCompanyLogoSupabase();

  // إضافة الشعار إلى بيانات الفاتورة قبل المشاركة
  const enhancedInvoiceData = {
    ...invoiceData,
    companyInfo: {
      ...invoiceData.companyInfo,
      logo: currentLogo || invoiceData.companyInfo?.logo
    }
  };

  return (
    <InvoiceShareDialog
      invoiceData={enhancedInvoiceData}
    />
  );
}