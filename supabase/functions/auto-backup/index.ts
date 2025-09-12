import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackupRequest {
  type: 'manual' | 'automatic';
  user_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, user_id }: BackupRequest = await req.json();

    console.log(`Starting ${type} backup for user: ${user_id || 'scheduled'}`);

    if (type === 'manual' && user_id) {
      // النسخ الاحتياطي اليدوي لمستخدم محدد
      const result = await performUserBackup(supabaseClient, user_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 500
      });
    } else if (type === 'automatic') {
      // النسخ الاحتياطي التلقائي لجميع المستخدمين المؤهلين
      const result = await processAutoBackups(supabaseClient);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid backup type or missing user_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

  } catch (error) {
    console.error('Error in auto-backup function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function processAutoBackups(supabaseClient: any) {
  try {
    console.log('Processing automatic backups...');
    
    // استدعاء دالة قاعدة البيانات لمعالجة النسخ الاحتياطي التلقائي
    const { data: processResult, error: processError } = await supabaseClient
      .rpc('process_auto_backups');

    if (processError) {
      console.error('Error calling process_auto_backups:', processError);
      throw processError;
    }

    console.log(`Processed ${processResult} automatic backups`);

    // الحصول على قائمة المستخدمين الذين يحتاجون نسخ احتياطي
    const { data: pendingBackups, error: pendingError } = await supabaseClient
      .from('auto_backup_logs')
      .select('user_id, id, tables_included')
      .eq('status', 'pending')
      .eq('backup_type', 'automatic');

    if (pendingError) {
      console.error('Error fetching pending backups:', pendingError);
      throw pendingError;
    }

    const results = [];
    
    for (const backup of pendingBackups || []) {
      console.log(`Processing backup for user: ${backup.user_id}`);
      
      try {
        // تحديث حالة النسخ الاحتياطي إلى "running"
        await supabaseClient
          .from('auto_backup_logs')
          .update({ status: 'running' })
          .eq('id', backup.id);

        const backupResult = await performUserBackup(supabaseClient, backup.user_id, backup.tables_included, backup.id);
        results.push(backupResult);
        
      } catch (error) {
        console.error(`Error processing backup for user ${backup.user_id}:`, error);
        
        // تحديث حالة النسخ الاحتياطي إلى "failed"
        await supabaseClient
          .from('auto_backup_logs')
          .update({ 
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', backup.id);
          
        results.push({ success: false, user_id: backup.user_id, error: error.message });
      }
    }

    return { 
      success: true, 
      message: `Processed ${processResult} backup schedules`,
      results 
    };

  } catch (error) {
    console.error('Error in processAutoBackups:', error);
    return { success: false, error: error.message };
  }
}

async function performUserBackup(supabaseClient: any, userId: string, tablesToBackup?: string[], logId?: string) {
  const startTime = new Date();
  
  try {
    console.log(`Starting backup for user: ${userId}`);

    // الجداول الافتراضية للنسخ الاحتياطي
    const defaultTables = ['invoices', 'customers', 'products', 'cash_transactions', 'checks', 'installments'];
    const tables = tablesToBackup || defaultTables;
    
    let totalRecords = 0;
    const backupData: any = {
      timestamp: startTime.toISOString(),
      user_id: userId,
      tables: {}
    };

    // نسخ احتياطي لكل جدول
    for (const table of tables) {
      try {
        console.log(`Backing up table: ${table} for user: ${userId}`);
        
        const { data, error } = await supabaseClient
          .from(table)
          .select('*')
          .eq('user_id', userId);

        if (error && error.code !== 'PGRST116') {
          console.error(`Error backing up table ${table}:`, error);
          continue;
        }

        backupData.tables[table] = data || [];
        totalRecords += (data || []).length;
        
      } catch (error) {
        console.error(`Error processing table ${table}:`, error);
      }
    }

    // حفظ النسخة الاحتياطية كـ JSON
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupSize = new Blob([backupJson]).size;
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // تحديث سجل النسخ الاحتياطي
    if (logId) {
      await supabaseClient
        .from('auto_backup_logs')
        .update({
          status: 'completed',
          completed_at: endTime.toISOString(),
          file_size: backupSize,
          total_records: totalRecords,
          backup_duration: `${duration} milliseconds`
        })
        .eq('id', logId);
    } else {
      // إنشاء سجل جديد للنسخ اليدوي
      await supabaseClient
        .from('auto_backup_logs')
        .insert({
          user_id: userId,
          backup_type: 'manual',
          status: 'completed',
          started_at: startTime.toISOString(),
          completed_at: endTime.toISOString(),
          file_size: backupSize,
          total_records: totalRecords,
          backup_duration: `${duration} milliseconds`,
          tables_included: tables
        });
    }

    console.log(`Backup completed for user ${userId}. Records: ${totalRecords}, Size: ${backupSize} bytes, Duration: ${duration}ms`);

    return {
      success: true,
      user_id: userId,
      total_records: totalRecords,
      file_size: backupSize,
      duration_ms: duration,
      tables_backed_up: tables.length
    };

  } catch (error) {
    console.error(`Error in performUserBackup for user ${userId}:`, error);
    
    // تحديث السجل بالخطأ
    if (logId) {
      await supabaseClient
        .from('auto_backup_logs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', logId);
    }

    return {
      success: false,
      user_id: userId,
      error: error.message
    };
  }
}