import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Types
export interface LocalAccount {
  id: string;
  name: string;
  createdAt: string;
  lastActiveAt: string;
}

interface LocalAccountsContextValue {
  accounts: LocalAccount[];
  activeAccountId: string;
  activeAccount: LocalAccount | null;
  createAccount: (name: string) => void;
  renameAccount: (id: string, name: string) => void;
  deleteAccount: (id: string) => void;
  switchAccount: (id: string) => void;
}

const LocalAccountsContext = createContext<LocalAccountsContextValue | undefined>(undefined);

// Global/Shared keys that should NOT be scoped
const GLOBAL_KEYS = new Set([
  "active_account_id",
  "local_accounts",
  "supabase_session",
  "current_user",
  "admin_authenticated",
  "remember_login",
  "session_token",
  "device_id",
  "app_logo",
  "program_name",
  "dark_mode",
  "__auto_backup__",
  "saved_accounts",
]);

// A ref accessible by our localStorage interceptor
const __initialActive = (() => {
  try {
    return localStorage.getItem("active_account_id") || "default";
  } catch {
    return "default";
  }
})();
let __activeAccountIdRef = __initialActive;
let __localStoragePatched = false as boolean;

// Patch localStorage at module load to ensure early namespacing
function patchLocalStorage() {
  if (__localStoragePatched) return;
  __localStoragePatched = true;

  const originalGet = localStorage.getItem.bind(localStorage);
  const originalSet = localStorage.setItem.bind(localStorage);
  const originalRemove = localStorage.removeItem.bind(localStorage);

  const needsScope = (key: string) => {
    return !GLOBAL_KEYS.has(key) && !key.startsWith("acc:") && !key.startsWith("__");
  };

  const withScope = (key: string) => `acc:${__activeAccountIdRef || "default"}:${key}`;

  (localStorage as any).getItem = (key: string) => {
    if (!key) return originalGet(key);
    if (needsScope(key)) {
      const scoped = originalGet(withScope(key));
      if (scoped !== null) return scoped;
      return originalGet(key);
    }
    return originalGet(key);
  };

  (localStorage as any).setItem = (key: string, value: string) => {
    if (!key) return originalSet(key, value);
    if (needsScope(key)) return originalSet(withScope(key), value);
    return originalSet(key, value);
  };

  (localStorage as any).removeItem = (key: string) => {
    if (!key) return originalRemove(key);
    if (needsScope(key)) {
      originalRemove(withScope(key));
      return originalRemove(key);
    }
    return originalRemove(key);
  };
}

// Apply immediately on module import
try { patchLocalStorage(); } catch { /* ignore */ }

export const LocalAccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<LocalAccount[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("local_accounts") || "[]");
    } catch {
      return [];
    }
  });

  const [activeAccountId, setActiveAccountId] = useState<string>(() => {
    return localStorage.getItem("active_account_id") || (accounts[0]?.id ?? "default");
  });

  // Keep ref in sync for the interceptor
  useEffect(() => {
    __activeAccountIdRef = activeAccountId || "default";
  }, [activeAccountId]);

  const activeAccount = useMemo(() => accounts.find(a => a.id === activeAccountId) || null, [accounts, activeAccountId]);

  // Persist to storage
  useEffect(() => {
    localStorage.setItem("local_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (activeAccountId) localStorage.setItem("active_account_id", activeAccountId);
  }, [activeAccountId]);

  const createAccount = useCallback((name: string) => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("يرجى إدخال اسم الشركة");
      return;
    }
    
    const id = `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const newAcc: LocalAccount = { 
      id, 
      name: cleanName, 
      createdAt: now, 
      lastActiveAt: now 
    };
    
    setAccounts(prev => [newAcc, ...prev]);
    setActiveAccountId(id);
    
    // تأكد من حفظ البيانات فوراً
    localStorage.setItem("local_accounts", JSON.stringify([newAcc, ...JSON.parse(localStorage.getItem("local_accounts") || "[]")]));
    localStorage.setItem("active_account_id", id);
    
    toast.success(`تم إنشاء شركة "${cleanName}" وتفعيلها`);
  }, []);

  const renameAccount = useCallback((id: string, name: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, name: name.trim() || a.name } : a));
    toast.success("تم تحديث اسم الشركة");
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (activeAccountId === id) {
      const next = accounts.find(a => a.id !== id) || null;
      setActiveAccountId(next?.id || "default");
    }
    toast.success("تم حذف الشركة");
  }, [activeAccountId, accounts]);

  const switchAccount = useCallback((id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) {
      toast.error("الشركة غير موجودة");
      return;
    }
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, lastActiveAt: new Date().toISOString() } : a));
    setActiveAccountId(id);
    // Notify listeners if needed
    window.dispatchEvent(new CustomEvent("account-changed", { detail: { accountId: id } }));
    toast.success(`تم التبديل إلى: ${acc.name}`);
  }, [accounts]);

  // Patch localStorage once to enforce per-account namespacing for non-global keys
  useEffect(() => {
    if (__localStoragePatched) return;
    __localStoragePatched = true;

    const originalGet = localStorage.getItem.bind(localStorage);
    const originalSet = localStorage.setItem.bind(localStorage);
    const originalRemove = localStorage.removeItem.bind(localStorage);

    const needsScope = (key: string) => {
      return !GLOBAL_KEYS.has(key) && !key.startsWith("acc:") && !key.startsWith("__");
    };

    const withScope = (key: string) => `acc:${__activeAccountIdRef}:${key}`;

    // Override methods
    (localStorage as any).getItem = (key: string) => {
      if (!key) return originalGet(key);
      if (needsScope(key)) {
        const scoped = originalGet(withScope(key));
        if (scoped !== null) return scoped;
        // backward-compat: fallback to global
        return originalGet(key);
      }
      return originalGet(key);
    };

    (localStorage as any).setItem = (key: string, value: string) => {
      if (!key) return originalSet(key, value);
      if (needsScope(key)) return originalSet(withScope(key), value);
      return originalSet(key, value);
    };

    (localStorage as any).removeItem = (key: string) => {
      if (!key) return originalRemove(key);
      if (needsScope(key)) {
        originalRemove(withScope(key));
        // also remove any legacy global value
        return originalRemove(key);
      }
      return originalRemove(key);
    };

    // No cleanup to keep scoping for the lifetime of app
  }, []);

  const value: LocalAccountsContextValue = {
    accounts,
    activeAccountId,
    activeAccount,
    createAccount,
    renameAccount,
    deleteAccount,
    switchAccount,
  };

  return (
    <LocalAccountsContext.Provider value={value}>
      {children}
    </LocalAccountsContext.Provider>
  );
};

export const useLocalAccounts = () => {
  const ctx = useContext(LocalAccountsContext);
  if (!ctx) throw new Error("useLocalAccounts must be used within LocalAccountsProvider");
  return ctx;
};
