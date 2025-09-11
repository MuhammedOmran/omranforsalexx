import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Building2, MapPin, Phone, Mail, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CompanyHeaderProps {
  variant?: 'full' | 'minimal' | 'invoice';
  showLogo?: boolean;
  showContact?: boolean;
  className?: string;
}

export function CompanyHeader({ 
  variant = 'full', 
  showLogo = true, 
  showContact = true,
  className = "" 
}: CompanyHeaderProps) {
  const { companyInfo, isLoading } = useCompanySettings();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showLogo && companyInfo.logo && (
          <img 
            src={companyInfo.logo} 
            alt="شعار الشركة" 
            className="h-10 w-10 object-contain"
          />
        )}
        <div>
          <h2 className="text-xl font-bold">{companyInfo.name}</h2>
          {companyInfo.description && (
            <p className="text-sm text-muted-foreground">{companyInfo.description}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'invoice') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {showLogo && companyInfo.logo && (
              <img 
                src={companyInfo.logo} 
                alt="شعار الشركة" 
                className="h-16 w-16 object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
              {companyInfo.description && (
                <p className="text-muted-foreground">{companyInfo.description}</p>
              )}
            </div>
          </div>
          
          {companyInfo.taxNumber && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">الرقم الضريبي</p>
              <p className="font-mono">{companyInfo.taxNumber}</p>
            </div>
          )}
        </div>

        {showContact && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {(companyInfo.address || companyInfo.city) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  {companyInfo.address && <p>{companyInfo.address}</p>}
                  {companyInfo.city && companyInfo.country && (
                    <p>{companyInfo.city}، {companyInfo.country}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              {companyInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span dir="ltr">{companyInfo.phone}</span>
                </div>
              )}
              {companyInfo.mobile && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span dir="ltr">{companyInfo.mobile}</span>
                </div>
              )}
              {companyInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span dir="ltr">{companyInfo.email}</span>
                </div>
              )}
              {companyInfo.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span dir="ltr">{companyInfo.website}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header with logo and name */}
          <div className="flex items-start gap-4">
            {showLogo && companyInfo.logo && (
              <img 
                src={companyInfo.logo} 
                alt="شعار الشركة" 
                className="h-20 w-20 object-contain border rounded-lg p-2"
              />
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Building2 className="h-6 w-6" />
                    {companyInfo.name}
                  </h1>
                  {companyInfo.description && (
                    <p className="text-muted-foreground mt-1">{companyInfo.description}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {companyInfo.currency}
                  </Badge>
                  {companyInfo.taxType !== 'none' && (
                    <Badge variant="outline">
                      ضريبة {companyInfo.taxRate}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact information */}
          {showContact && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(companyInfo.address || companyInfo.city) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    العنوان
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {companyInfo.address && <p>{companyInfo.address}</p>}
                    {companyInfo.city && companyInfo.country && (
                      <p>{companyInfo.city}، {companyInfo.country}</p>
                    )}
                  </div>
                </div>
              )}

              {(companyInfo.phone || companyInfo.mobile) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4" />
                    الهاتف
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {companyInfo.phone && (
                      <p dir="ltr">الثابت: {companyInfo.phone}</p>
                    )}
                    {companyInfo.mobile && (
                      <p dir="ltr">الجوال: {companyInfo.mobile}</p>
                    )}
                  </div>
                </div>
              )}

              {(companyInfo.email || companyInfo.website) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4" />
                    الإنترنت
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {companyInfo.email && (
                      <p dir="ltr">{companyInfo.email}</p>
                    )}
                    {companyInfo.website && (
                      <p dir="ltr">{companyInfo.website}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tax and license information */}
          {(companyInfo.taxNumber || companyInfo.licenseNumber) && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companyInfo.taxNumber && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">الرقم الضريبي</p>
                    <p className="text-sm font-mono text-muted-foreground">{companyInfo.taxNumber}</p>
                  </div>
                )}
                {companyInfo.licenseNumber && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">رقم الترخيص</p>
                    <p className="text-sm font-mono text-muted-foreground">{companyInfo.licenseNumber}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}