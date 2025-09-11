import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Plus, 
  Building2, 
  ChevronDown,
  Trash2,
  Edit3,
  CheckCircle2
} from "lucide-react";
import { useLocalAccounts } from "@/contexts/LocalAccountsContext";
import { toast } from "sonner";

export function LocalAccountSwitcher() {
  const { 
    accounts, 
    activeAccount, 
    createAccount, 
    renameAccount, 
    deleteAccount, 
    switchAccount 
  } = useLocalAccounts();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [selectedAccountForRename, setSelectedAccountForRename] = useState<string>("");
  const [renameValue, setRenameValue] = useState("");

  // تنظيف البيانات عند التحميل للتأكد من صحة الأسماء
  useEffect(() => {
    const cleanAccounts = accounts.filter(acc => acc.name && acc.id && !acc.name.includes('@'));
    if (cleanAccounts.length !== accounts.length) {
      console.log("تم تنظيف الحسابات غير الصحيحة");
    }
  }, [accounts]);

  const handleCreateAccount = () => {
    const cleanName = newAccountName.trim();
    if (!cleanName) {
      toast.error("يرجى إدخال اسم الشركة");
      return;
    }
    
    // التأكد من عدم وجود حساب بنفس الاسم
    const existingAccount = accounts.find(acc => acc.name === cleanName);
    if (existingAccount) {
      toast.error("يوجد حساب بهذا الاسم مسبقاً");
      return;
    }
    
    createAccount(cleanName);
    setNewAccountName("");
    setShowCreateDialog(false);
    
    // تأكيد إنشاء الحساب
    setTimeout(() => {
      console.log(`تم إنشاء حساب جديد: ${cleanName}`);
    }, 100);
  };

  const handleRenameAccount = () => {
    if (!renameValue.trim()) {
      toast.error("يرجى إدخال اسم الشركة الجديد");
      return;
    }
    
    renameAccount(selectedAccountForRename, renameValue);
    setRenameValue("");
    setSelectedAccountForRename("");
    setShowRenameDialog(false);
  };

  const openRenameDialog = (accountId: string, currentName: string) => {
    setSelectedAccountForRename(accountId);
    setRenameValue(currentName);
    setShowRenameDialog(true);
  };

  return (
    <div className="w-full">
      {/* Account Switcher Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-10 justify-between bg-card/50 border-border/50 hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate">
                {activeAccount?.name || "إنشاء أو اختيار الشركة"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80" align="center">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            الشركات المحفوظة ({accounts.length})
          </DropdownMenuLabel>
          
          {accounts.length === 0 ? (
            <>
              <div className="py-4 text-center text-muted-foreground">
                <Building2 className="mx-auto h-8 w-8 mb-2 text-muted-foreground/50" />
                <p className="text-xs mb-3">لا توجد شركات محفوظة</p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  size="sm"
                  className="text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  إنشاء الشركة الأولى
                </Button>
              </div>
            </>
          ) : (
            accounts.map((account) => (
              <DropdownMenuItem
                key={account.id}
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => switchAccount(account.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={account.name} />
                    <AvatarFallback className="text-xs">
                      {account.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{account.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(account.lastActiveAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {activeAccount?.id === account.id && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameDialog(account.id, account.name);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    
                    {accounts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAccount(account.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowCreateDialog(true)}
            className="text-primary cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>إضافة شركة جديدة</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة شركة جديدة</DialogTitle>
            <DialogDescription className="text-right">
              أدخل اسم الشركة الجديدة لإنشاء حساب منفصل
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name" className="text-right">اسم الشركة</Label>
              <Input
                id="company-name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="أدخل اسم الشركة"
                className="text-right"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleCreateAccount}>
              إنشاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Account Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل اسم الشركة</DialogTitle>
            <DialogDescription className="text-right">
              أدخل الاسم الجديد للشركة
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-company" className="text-right">اسم الشركة</Label>
              <Input
                id="rename-company"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="أدخل اسم الشركة الجديد"
                className="text-right"
                onKeyDown={(e) => e.key === 'Enter' && handleRenameAccount()}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowRenameDialog(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleRenameAccount}>
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}