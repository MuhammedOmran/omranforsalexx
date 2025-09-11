import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface AuthRequiredProps {
  children: React.ReactNode;
  feature: string;
}

export function AuthRequired({ children, feature }: AuthRequiredProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        logger.error('خطأ في التحقق من المصادقة', error, 'AuthRequired');
      }
      
      setUser(user);
    } catch (error) {
      logger.error('خطأ في التحقق من المصادقة', error, 'AuthRequired');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="mr-3">جاري التحقق من المصادقة...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>يجب تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              للوصول إلى {feature}، يرجى تسجيل الدخول أولاً
            </p>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/login')}
                className="w-full flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                تسجيل الدخول
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/register')}
                className="w-full flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                إنشاء حساب جديد
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              بعد تسجيل الدخول ستتمكن من الوصول إلى جميع ميزات المبيعات
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}