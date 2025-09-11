import { supabase } from '@/integrations/supabase/client';
import { createUserSession, getUserSessions, terminateUserSession } from './sessionManager';

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  deviceName: string;
  userAgent: string;
}

export function getDeviceInfo(): DeviceInfo {
  // الحصول على معرف الجهاز من localStorage أو إنشاء واحد جديد
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }

  // تحديد نوع الجهاز
  const getDeviceName = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'هاتف محمول';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'جهاز لوحي';
    }
    return 'جهاز كمبيوتر';
  };

  return {
    deviceId,
    platform: navigator.platform,
    deviceName: getDeviceName(),
    userAgent: navigator.userAgent
  };
}

export async function isDeviceAuthorized(userId: string, deviceId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (error) {
      console.error('خطأ في التحقق من تفعيل الجهاز:', error);
      return false;
    }

    return (data && data.length > 0);
  } catch (error) {
    console.error('خطأ في التحقق من تفعيل الجهاز:', error);
    return false;
  }
}

export async function registerDeviceForUser(userId: string): Promise<boolean> {
  try {
    return await createUserSession(userId);
  } catch (error) {
    console.error('خطأ في تسجيل الجهاز:', error);
    return false;
  }
}

export async function getUserDevices(userId: string): Promise<any[]> {
  try {
    const sessions = await getUserSessions(userId);
    return sessions.filter(session => session.is_active);
  } catch (error) {
    console.error('خطأ في جلب أجهزة المستخدم:', error);
    return [];
  }
}

export async function deactivateDevice(deviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        last_activity: new Date().toISOString()
      })
      .eq('device_id', deviceId);

    if (error) {
      console.error('خطأ في إلغاء تفعيل الجهاز:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('خطأ في إلغاء تفعيل الج��از:', error);
    return false;
  }
}

export interface DeviceRegistrationData {
  deviceId: string;
  platform: string;
  deviceName: string;
  ipAddress?: string;
}

export class DeviceManager {
  static async registerDevice(userId: string) { 
    const success = await registerDeviceForUser(userId);
    const deviceInfo = getDeviceInfo();
    return { id: deviceInfo.deviceId, success }; 
  }
  
  static getDeviceInfo() { 
    return getDeviceInfo(); 
  }
  
  static async validateDevice(userId: string, deviceId: string) { 
    return await isDeviceAuthorized(userId, deviceId); 
  }
}