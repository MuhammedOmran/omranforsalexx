/**
 * لوحة إدارة المستخدمين والشركات المتعددة
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Building2, 
  Shield, 
  UserPlus, 
  Settings, 
  Activity,
  Database,
  Download,
  Upload,
  Trash2,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive
} from 'lucide-react';

import { multiUserManager, User, Company, UserSession } from '@/utils/multiUserManager';
import { advancedBackupManager } from '@/utils/advancedBackupManager';

export function MultiUserDashboard() {
  const { toast } = useToast();
  
  // الحالة
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [backupStatus, setBackupStatus] = useState<any>(null);
  
  // الحوارات
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  
  // نماذج البيانات
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'employee' as const,
    phoneNumber: '',
    department: '',
    password: ''
  });

  const [companySettings, setCompanySettings] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'EGP',
    maxUsers: 10
  });

  useEffect(() => {
    loadDashboardData();
    
    // تحديث البيانات كل دقيقة
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = () => {
    // جلب البيانات الحالية
    const user = multiUserManager.getCurrentUser();
    const company = multiUserManager.getCurrentCompany();
    
    setCurrentUser(user);
    setCurrentCompany(company);

    if (company) {
      // جلب حالة النسخ الاحتياطي
      const status = advancedBackupManager.getBackupStatus(company.id);
      setBackupStatus(status);

      // تحديث إعدادات الشركة
      setCompanySettings({
        name: company.name,
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        currency: company.currency,
        maxUsers: company.subscription.maxUsers
      });
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.fullName || !newUser.password) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const result = await multiUserManager.createUser(newUser, newUser.password, currentUser?.id || '');
    
    if (result.success) {
      toast({
        title: "تم بنجاح",
        description: `تم إنشاء المستخدم ${newUser.fullName} بنجاح`
      });
      
      setShowCreateUser(false);
      setNewUser({
        username: '',
        email: '',
        fullName: '',
        role: 'employee',
        phoneNumber: '',
        department: '',
        password: ''
      });
      loadDashboardData();
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل في إنشاء المستخدم",
        variant: "destructive"
      });
    }
  };

  const handleCreateBackup = async () => {
    if (!currentCompany) return;

    const result = await advancedBackupManager.createFullBackup(
      currentCompany.id,
      undefined,
      'نسخة احتياطية يدوية من لوحة التحكم'
    );

    if (result.success) {
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء النسخة الاحتياطية بنجاح"
      });
      loadDashboardData();
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل في إنشاء النسخة الاحتياطية",
        variant: "destructive"
      });
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roles = {
      owner: 'مالك',
      admin: 'مدير عام',
      manager: 'مدير قسم',
      employee: 'موظف',
      viewer: 'عارض'
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      owner: 'default',
      admin: 'secondary',
      manager: 'outline',
      employee: 'secondary',
      viewer: 'outline'
    };
    return variants[role as keyof typeof variants] || 'outline';
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 بايت';
    const sizes = ['بايت', 'كيلو بايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (!currentUser || !currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">غير مسموح</h3>
            <p className="text-muted-foreground">
              يجب تسجيل الدخول للوصول لهذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة إدارة المستخدمين</h1>
          <p className="text-muted-foreground">
            إدارة شاملة للمستخدمين والشركات والنسخ الاحتياطية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Building2 className="h-4 w-4" />
            {currentCompany.name}
          </Badge>
          <Badge variant="secondary" className="gap-2">
            <Shield className="h-4 w-4" />
            {getRoleDisplayName(currentUser.role)}
          </Badge>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المستخدمين النشطين</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Progress value={(users.filter(u => u.isActive).length / currentCompany.subscription.maxUsers) * 100} />
              <p className="text-xs text-muted-foreground mt-1">
                من {currentCompany.subscription.maxUsers} مستخدم مسموح
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الجلسات النشطة</p>
                <p className="text-2xl font-bold">{sessions.filter(s => s.isActive).length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">النسخ الاحتياطية</p>
                <p className="text-2xl font-bold">{backupStatus?.totalBackups || 0}</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                آخر نسخة: {backupStatus?.lastBackupDate ? 
                  new Date(backupStatus.lastBackupDate).toLocaleDateString('ar') : 
                  'لا يوجد'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مساحة التخزين</p>
                <p className="text-2xl font-bold">{formatFileSize(backupStatus?.storageUsed || 0)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تبويبات الإدارة */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            الشركة
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Database className="h-4 w-4" />
            النسخ الاحتياطية
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            الأمان
          </TabsTrigger>
        </TabsList>

        {/* تبويب المستخدمين */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">إدارة المستخدمين</h3>
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  إضافة مستخدم جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات المستخدم الجديد
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">اسم المستخدم</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        placeholder="admin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="user@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                      placeholder="محمد أحمد علي"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">الدور</Label>
                      <select
                        id="role"
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                        className="w-full p-2 border rounded"
                      >
                        <option value="employee">موظف</option>
                        <option value="manager">مدير قسم</option>
                        <option value="admin">مدير عام</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="department">القسم</Label>
                      <Input
                        id="department"
                        value={newUser.department}
                        onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                        placeholder="المبيعات"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={newUser.phoneNumber}
                        onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})}
                        placeholder="+20123456789"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="كلمة مرور قوية"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleCreateUser}>
                    إنشاء المستخدم
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* قائمة المستخدمين */}
          <div className="grid gap-4">
            {users.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا يوجد مستخدمين</h3>
                  <p className="text-muted-foreground">ابدأ بإضافة أول مستخدم</p>
                </CardContent>
              </Card>
            ) : (
              users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {user.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{user.fullName}</h4>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role) as any}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                        
                        {user.department && (
                          <Badge variant="outline">{user.department}</Badge>
                        )}
                        
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                        
                        {user.lastLogin && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(user.lastLogin).toLocaleDateString('ar')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* تبويب النسخ الاحتياطية */}
        <TabsContent value="backup" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">إدارة النسخ الاحتياطية</h3>
            <Button onClick={handleCreateBackup} disabled={backupStatus?.isInProgress} className="gap-2">
              <Database className="h-4 w-4" />
              إنشاء نسخة احتياطية الآن
            </Button>
          </div>

          {/* حالة النسخ الاحتياطي */}
          {backupStatus?.isInProgress && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>جاري إنشاء النسخة الاحتياطية</AlertTitle>
              <AlertDescription>
                <Progress value={backupStatus.progress} className="mt-2" />
                <p className="text-sm mt-2">
                  التقدم: {backupStatus.progress}%
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* إحصائيات النسخ الاحتياطي */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Database className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{backupStatus?.totalBackups || 0}</p>
                  <p className="text-sm text-muted-foreground">نسخة احتياطية</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <HardDrive className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-lg font-bold">{formatFileSize(backupStatus?.storageUsed || 0)}</p>
                  <p className="text-sm text-muted-foreground">مساحة مستخدمة</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-lg font-bold">
                    {backupStatus?.lastBackupDate ? 
                      new Date(backupStatus.lastBackupDate).toLocaleDateString('ar') : 
                      'لا يوجد'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">آخر نسخة احتياطية</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب إعدادات الشركة */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الشركة</CardTitle>
              <CardDescription>
                إدارة المعلومات الأساسية للشركة والاشتراك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم الشركة</Label>
                  <Input 
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({...companySettings, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input 
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>رقم الهاتف</Label>
                  <Input 
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>العملة</Label>
                  <select 
                    value={companySettings.currency}
                    onChange={(e) => setCompanySettings({...companySettings, currency: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="EGP">جنيه مصري</option>
                    <option value="SAR">ريال سعودي</option>
                    <option value="USD">دولار أمريكي</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>العنوان</Label>
                <Input 
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                />
              </div>

              {/* معلومات الاشتراك */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">معلومات الاشتراك</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-lg font-bold">{currentCompany?.subscription.plan}</p>
                      <p className="text-sm text-muted-foreground">نوع الاشتراك</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-lg font-bold">{currentCompany?.subscription.maxUsers}</p>
                      <p className="text-sm text-muted-foreground">عدد المستخدمين</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-lg font-bold">{formatFileSize((currentCompany?.subscription.maxStorage || 0) * 1024 * 1024)}</p>
                      <p className="text-sm text-muted-foreground">مساحة التخزين</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}