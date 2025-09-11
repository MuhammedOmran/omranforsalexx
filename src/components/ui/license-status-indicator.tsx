import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useLicense } from '@/hooks/useLicense';

export function LicenseStatusIndicator() {
  const { licenseInfo, loading } = useLicense();

  if (loading) {
    return (
      <Badge variant="outline" className="text-xs">
        <Shield className="h-3 w-3 mr-1" />
        جاري التحميل...
      </Badge>
    );
  }

  const getStatusVariant = () => {
    if (!licenseInfo.has_active_license) return 'destructive';
    if (licenseInfo.days_remaining <= 7) return 'secondary';
    return 'default';
  };

  const getStatusIcon = () => {
    if (!licenseInfo.has_active_license) return <AlertTriangle className="h-3 w-3 mr-1" />;
    if (licenseInfo.days_remaining <= 7) return <Clock className="h-3 w-3 mr-1" />;
    return <CheckCircle className="h-3 w-3 mr-1" />;
  };

  const getStatusText = () => {
    if (!licenseInfo.has_active_license) return 'غير نشط';
    return `${licenseInfo.days_remaining.toLocaleString('ar-EG')} يوم`;
  };

  return (
    <Badge variant={getStatusVariant()} className="text-xs">
      {getStatusIcon()}
      {getStatusText()}
    </Badge>
  );
}