import React, { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * نظام Undo/Redo للعمليات
 */
export interface UndoableAction {
  id: string;
  name: string;
  timestamp: number;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
  data?: any;
}

class UndoRedoSystem {
  private undoStack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];
  private maxStackSize = 50;
  private subscribers: ((canUndo: boolean, canRedo: boolean) => void)[] = [];

  subscribe(callback: (canUndo: boolean, canRedo: boolean) => void) {
    this.subscribers.push(callback);
    callback(this.canUndo(), this.canRedo());
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  addAction(action: Omit<UndoableAction, 'id' | 'timestamp'>) {
    const undoableAction: UndoableAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.undoStack.push(undoableAction);
    
    // تنظيف الحد الأقصى
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    // مسح redo stack عند إضافة عملية جديدة
    this.redoStack = [];
    
    this.notifySubscribers();
  }

  async undo(): Promise<boolean> {
    const action = this.undoStack.pop();
    if (!action) return false;

    try {
      await action.undo();
      this.redoStack.push(action);
      this.notifySubscribers();
      return true;
    } catch (error) {
      // إعادة العملية للمكدس في حالة الفشل
      this.undoStack.push(action);
      console.error('Undo failed:', error);
      return false;
    }
  }

  async redo(): Promise<boolean> {
    const action = this.redoStack.pop();
    if (!action) return false;

    try {
      await action.redo();
      this.undoStack.push(action);
      this.notifySubscribers();
      return true;
    } catch (error) {
      // إعادة العملية للمكدس في حالة الفشل
      this.redoStack.push(action);
      console.error('Redo failed:', error);
      return false;
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getLastAction(): UndoableAction | null {
    return this.undoStack[this.undoStack.length - 1] || null;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.canUndo(), this.canRedo());
      } catch (error) {
        console.error('Error in undo/redo callback:', error);
      }
    });
  }
}

export const undoRedoSystem = new UndoRedoSystem();

/**
 * Hook لاستخدام نظام Undo/Redo
 */
export function useUndoRedo() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    const unsubscribe = undoRedoSystem.subscribe((undo, redo) => {
      setCanUndo(undo);
      setCanRedo(redo);
    });
    
    return unsubscribe;
  }, []);

  const addAction = useCallback((action: Omit<UndoableAction, 'id' | 'timestamp'>) => {
    undoRedoSystem.addAction(action);
  }, []);

  const undo = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const success = await undoRedoSystem.undo();
    
    if (success) {
      const lastAction = undoRedoSystem.getLastAction();
      toast({
        title: "تم التراجع",
        description: `تم التراجع عن: ${lastAction?.name || 'العملية السابقة'}`,
      });
    } else {
      toast({
        title: "فشل التراجع",
        description: "لا يمكن التراجع عن هذه العملية",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  }, [isProcessing, toast]);

  const redo = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const success = await undoRedoSystem.redo();
    
    if (success) {
      toast({
        title: "تم الإعادة",
        description: "تم إعادة تنفيذ العملية",
      });
    } else {
      toast({
        title: "فشل الإعادة",
        description: "لا يمكن إعادة تنفيذ هذه العملية",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  }, [isProcessing, toast]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    addAction,
    isProcessing,
    clear: undoRedoSystem.clear.bind(undoRedoSystem)
  };
}

/**
 * مساعدات لإنشاء عمليات undo/redo
 */
export class UndoHelpers {
  static createStorageAction(
    name: string,
    key: string,
    newValue: any,
    oldValue?: any
  ): Omit<UndoableAction, 'id' | 'timestamp'> {
    const previousValue = oldValue ?? localStorage.getItem(key);
    
    return {
      name,
      undo: () => {
        if (previousValue === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, typeof previousValue === 'string' ? previousValue : JSON.stringify(previousValue));
        }
      },
      redo: () => {
        localStorage.setItem(key, typeof newValue === 'string' ? newValue : JSON.stringify(newValue));
      },
      data: { key, newValue, oldValue: previousValue }
    };
  }

  static createArrayAction<T>(
    name: string,
    array: T[],
    operation: 'add' | 'remove' | 'update',
    item: T,
    index?: number
  ): Omit<UndoableAction, 'id' | 'timestamp'> {
    const originalArray = [...array];
    
    return {
      name,
      undo: () => {
        array.length = 0;
        array.push(...originalArray);
      },
      redo: () => {
        switch (operation) {
          case 'add':
            if (index !== undefined) {
              array.splice(index, 0, item);
            } else {
              array.push(item);
            }
            break;
          case 'remove':
            const removeIndex = index ?? array.indexOf(item);
            if (removeIndex > -1) {
              array.splice(removeIndex, 1);
            }
            break;
          case 'update':
            if (index !== undefined && index < array.length) {
              array[index] = item;
            }
            break;
        }
      },
      data: { operation, item, index }
    };
  }
}