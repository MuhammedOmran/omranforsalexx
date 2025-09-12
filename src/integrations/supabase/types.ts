export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          is_encrypted: boolean
          setting_key: string
          setting_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_encrypted?: boolean
          setting_key: string
          setting_value?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_encrypted?: boolean
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          company_id: string | null
          created_at: string
          event_description: string
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          risk_score: number | null
          session_id: string | null
          severity: Database["public"]["Enums"]["security_level"]
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          event_description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          risk_score?: number | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["security_level"]
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          event_description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          risk_score?: number | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["security_level"]
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_backup_logs: {
        Row: {
          backup_duration: unknown | null
          backup_type: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_path: string | null
          file_size: number | null
          id: string
          started_at: string
          status: string
          tables_included: string[] | null
          total_records: number | null
          user_id: string
        }
        Insert: {
          backup_duration?: unknown | null
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          started_at?: string
          status?: string
          tables_included?: string[] | null
          total_records?: number | null
          user_id: string
        }
        Update: {
          backup_duration?: unknown | null
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          started_at?: string
          status?: string
          tables_included?: string[] | null
          total_records?: number | null
          user_id?: string
        }
        Relationships: []
      }
      auto_backup_settings: {
        Row: {
          backup_interval: string
          backup_location: string | null
          backup_time: string
          created_at: string
          enabled: boolean
          id: string
          include_tables: string[] | null
          last_backup_date: string | null
          next_backup_date: string | null
          retention_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_interval?: string
          backup_location?: string | null
          backup_time?: string
          created_at?: string
          enabled?: boolean
          id?: string
          include_tables?: string[] | null
          last_backup_date?: string | null
          next_backup_date?: string | null
          retention_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_interval?: string
          backup_location?: string | null
          backup_time?: string
          created_at?: string
          enabled?: boolean
          id?: string
          include_tables?: string[] | null
          last_backup_date?: string | null
          next_backup_date?: string | null
          retention_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      barcode_settings: {
        Row: {
          auto_generate: boolean
          barcode_length: number
          barcode_prefix: string
          created_at: string
          id: string
          include_name: boolean
          include_price: boolean
          print_format: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_generate?: boolean
          barcode_length?: number
          barcode_prefix?: string
          created_at?: string
          id?: string
          include_name?: boolean
          include_price?: boolean
          print_format?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_generate?: boolean
          barcode_length?: number
          barcode_prefix?: string
          created_at?: string
          id?: string
          include_name?: boolean
          include_price?: boolean
          print_format?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cash_balances: {
        Row: {
          balance_date: string
          created_at: string
          current_balance: number
          id: string
          last_transaction_id: string | null
          opening_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_date?: string
          created_at?: string
          current_balance?: number
          id?: string
          last_transaction_id?: string | null
          opening_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_date?: string
          created_at?: string
          current_balance?: number
          id?: string
          last_transaction_id?: string | null
          opening_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          metadata: Json | null
          notes: string | null
          payment_method: string
          reference_id: string | null
          reference_type: string | null
          subcategory: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_method?: string
          reference_id?: string | null
          reference_type?: string | null
          subcategory?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_method?: string
          reference_id?: string | null
          reference_type?: string | null
          subcategory?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checks: {
        Row: {
          amount: number
          bank_name: string
          bounced_date: string | null
          cashed_date: string | null
          check_number: string
          check_type: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          date_received: string
          deleted_at: string | null
          description: string | null
          due_date: string
          entity_type: string | null
          id: string
          notes: string | null
          related_invoice_id: string | null
          status: string
          supplier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          bank_name: string
          bounced_date?: string | null
          cashed_date?: string | null
          check_number: string
          check_type?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          date_received?: string
          deleted_at?: string | null
          description?: string | null
          due_date: string
          entity_type?: string | null
          id?: string
          notes?: string | null
          related_invoice_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_name?: string
          bounced_date?: string | null
          cashed_date?: string | null
          check_number?: string
          check_type?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          date_received?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string
          entity_type?: string | null
          id?: string
          notes?: string | null
          related_invoice_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          commercial_register: string | null
          company_code: string | null
          country: string
          created_at: string
          currency: string
          description: string | null
          email: string | null
          id: string
          industry: string | null
          is_active: boolean
          license_number: string | null
          logo: string | null
          name: string
          name_en: string | null
          phone: string | null
          settings: Json
          subscription: Json
          tax_number: string | null
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          commercial_register?: string | null
          company_code?: string | null
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          license_number?: string | null
          logo?: string | null
          name: string
          name_en?: string | null
          phone?: string | null
          settings?: Json
          subscription?: Json
          tax_number?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          commercial_register?: string | null
          company_code?: string | null
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          license_number?: string | null
          logo?: string | null
          name?: string
          name_en?: string | null
          phone?: string | null
          settings?: Json
          subscription?: Json
          tax_number?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_logos: {
        Row: {
          company_name: string
          created_at: string
          file_size: number | null
          id: string
          is_active: boolean
          logo_filename: string
          logo_url: string
          mime_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          logo_filename: string
          logo_url: string
          mime_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          logo_filename?: string
          logo_url?: string
          mime_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          customer_number: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          customer_number?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          customer_number?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_activities: {
        Row: {
          action: string
          created_at: string
          details: string
          employee_id: string
          id: string
          new_value: Json | null
          performed_by: string
          previous_value: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details: string
          employee_id: string
          id?: string
          new_value?: Json | null
          performed_by: string
          previous_value?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string
          employee_id?: string
          id?: string
          new_value?: Json | null
          performed_by?: string
          previous_value?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      employee_attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          employee_id: string
          employee_name: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          employee_id: string
          employee_name: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          employee_name?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          name: string
          size_mb: number | null
          type: string
          updated_at: string
          upload_date: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          name: string
          size_mb?: number | null
          type: string
          updated_at?: string
          upload_date?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          name?: string
          size_mb?: number | null
          type?: string
          updated_at?: string
          upload_date?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      employee_leave_balances: {
        Row: {
          annual_leave: number
          created_at: string
          emergency_leave: number
          employee_id: string
          id: string
          sick_leave: number
          updated_at: string
          used_annual: number
          used_emergency: number
          used_sick: number
          user_id: string
        }
        Insert: {
          annual_leave?: number
          created_at?: string
          emergency_leave?: number
          employee_id: string
          id?: string
          sick_leave?: number
          updated_at?: string
          used_annual?: number
          used_emergency?: number
          used_sick?: number
          user_id: string
        }
        Update: {
          annual_leave?: number
          created_at?: string
          emergency_leave?: number
          employee_id?: string
          id?: string
          sick_leave?: number
          updated_at?: string
          used_annual?: number
          used_emergency?: number
          used_sick?: number
          user_id?: string
        }
        Relationships: []
      }
      employee_leave_requests: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          created_at: string
          days: number
          employee_id: string
          employee_name: string
          employee_position: string
          end_date: string
          id: string
          leave_type: string
          reason: string
          rejection_reason: string | null
          request_date: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          days: number
          employee_id: string
          employee_name: string
          employee_position: string
          end_date: string
          id?: string
          leave_type: string
          reason: string
          rejection_reason?: string | null
          request_date?: string
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          days?: number
          employee_id?: string
          employee_name?: string
          employee_position?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          rejection_reason?: string | null
          request_date?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_performance: {
        Row: {
          achieved: number
          created_at: string
          employee_id: string
          feedback: string | null
          goals: number
          id: string
          improvements: Json | null
          period: string
          rating: number
          strengths: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved?: number
          created_at?: string
          employee_id: string
          feedback?: string | null
          goals?: number
          id?: string
          improvements?: Json | null
          period: string
          rating?: number
          strengths?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved?: number
          created_at?: string
          employee_id?: string
          feedback?: string | null
          goals?: number
          id?: string
          improvements?: Json | null
          period?: string
          rating?: number
          strengths?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          created_at: string
          department: string
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          id: string
          name: string
          national_id: string | null
          phone_number: string | null
          position: string
          salary: number
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          department: string
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          name: string
          national_id?: string | null
          phone_number?: string | null
          position: string
          salary?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          department?: string
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          name?: string
          national_id?: string | null
          phone_number?: string | null
          position?: string
          salary?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      installment_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          installment_id: string
          notes: string | null
          payment_date: string
          payment_method: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          installment_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          installment_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_payments_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          deleted_at: string | null
          due_date: string
          id: string
          installment_amount: number
          installment_period: number
          notes: string | null
          paid_amount: number
          remaining_amount: number
          start_date: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          deleted_at?: string | null
          due_date?: string
          id?: string
          installment_amount?: number
          installment_period?: number
          notes?: string | null
          paid_amount?: number
          remaining_amount?: number
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          deleted_at?: string | null
          due_date?: string
          id?: string
          installment_amount?: number
          installment_period?: number
          notes?: string | null
          paid_amount?: number
          remaining_amount?: number
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_id: string | null
          deleted_at: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      license_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          max_devices: number | null
          max_users: number | null
          price: number | null
          tier_name: Database["public"]["Enums"]["license_tier"]
          tier_name_ar: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_days: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_devices?: number | null
          max_users?: number | null
          price?: number | null
          tier_name: Database["public"]["Enums"]["license_tier"]
          tier_name_ar: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_devices?: number | null
          max_users?: number | null
          price?: number | null
          tier_name?: Database["public"]["Enums"]["license_tier"]
          tier_name_ar?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      licensed_devices: {
        Row: {
          browser_info: string | null
          created_at: string | null
          device_id: string
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          license_id: string
          os_info: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          browser_info?: string | null
          created_at?: string | null
          device_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          license_id: string
          os_info?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          browser_info?: string | null
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          license_id?: string
          os_info?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "licensed_devices_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licensed_users: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          license_id: string
          license_owner_id: string
          licensed_user_id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          license_id: string
          license_owner_id: string
          licensed_user_id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          license_id?: string
          license_owner_id?: string
          licensed_user_id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licensed_users_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_log: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_id: string | null
          opened_at: string | null
          provider_response: Json | null
          scheduled_notification_id: string | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          opened_at?: string | null
          provider_response?: Json | null
          scheduled_notification_id?: string | null
          sent_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          opened_at?: string | null
          provider_response?: Json | null
          scheduled_notification_id?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_log_scheduled_notification_id_fkey"
            columns: ["scheduled_notification_id"]
            isOneToOne: false
            referencedRelation: "scheduled_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          actions: Json
          conditions: Json
          cooldown_minutes: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          priority: Database["public"]["Enums"]["notification_priority"] | null
          rule_type: string
          template_id: string | null
          trigger_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions: Json
          conditions: Json
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          rule_type: string
          template_id?: string | null
          trigger_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          rule_type?: string
          template_id?: string | null
          trigger_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          channel_preferences: Json | null
          created_at: string | null
          email_address: string | null
          email_enabled: boolean | null
          id: string
          notification_preferences: Json | null
          phone_number: string | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_preferences?: Json | null
          created_at?: string | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          notification_preferences?: Json | null
          phone_number?: string | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_preferences?: Json | null
          created_at?: string | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          notification_preferences?: Json | null
          phone_number?: string | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          created_at: string | null
          default_channels:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          email_template: string | null
          id: string
          is_active: boolean | null
          name: string
          sms_template: string | null
          subject_template: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_template: string
          created_at?: string | null
          default_channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          email_template?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sms_template?: string | null
          subject_template: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_template?: string
          created_at?: string | null
          default_channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          email_template?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sms_template?: string | null
          subject_template?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_required: boolean
          action_text: string | null
          action_url: string | null
          archived_at: string | null
          auto_resolve: boolean
          category: string
          channels: Database["public"]["Enums"]["notification_channel"][] | null
          company_id: string | null
          created_at: string
          expires_at: string | null
          group_id: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type:
            | Database["public"]["Enums"]["notification_type"]
            | null
          parent_id: string | null
          priority: string
          read_at: string | null
          recurring_pattern: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          resolved_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          tags: string[] | null
          template_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_required?: boolean
          action_text?: string | null
          action_url?: string | null
          archived_at?: string | null
          auto_resolve?: boolean
          category?: string
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          company_id?: string | null
          created_at?: string
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type?:
            | Database["public"]["Enums"]["notification_type"]
            | null
          parent_id?: string | null
          priority?: string
          read_at?: string | null
          recurring_pattern?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          tags?: string[] | null
          template_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          action_required?: boolean
          action_text?: string | null
          action_url?: string | null
          archived_at?: string | null
          auto_resolve?: boolean
          category?: string
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          company_id?: string | null
          created_at?: string
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?:
            | Database["public"]["Enums"]["notification_type"]
            | null
          parent_id?: string | null
          priority?: string
          read_at?: string | null
          recurring_pattern?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          tags?: string[] | null
          template_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_data: {
        Row: {
          created_at: string
          data_content: Json
          data_id: string
          data_type: string
          id: string
          last_sync_at: string | null
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_content: Json
          data_id: string
          data_type: string
          id?: string
          last_sync_at?: string | null
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_content?: Json
          data_id?: string
          data_type?: string
          id?: string
          last_sync_at?: string | null
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string
          deductions: number | null
          deleted_at: string | null
          employee_id: string
          employee_name: string
          id: string
          is_paid: boolean | null
          month: number
          net_salary: number
          notes: string | null
          overtime_amount: number | null
          paid_date: string | null
          payment_method: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          deleted_at?: string | null
          employee_id: string
          employee_name: string
          id?: string
          is_paid?: boolean | null
          month: number
          net_salary?: number
          notes?: string | null
          overtime_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          deleted_at?: string | null
          employee_id?: string
          employee_name?: string
          id?: string
          is_paid?: boolean | null
          month?: number
          net_salary?: number
          notes?: string | null
          overtime_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          code: string
          cost: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          max_stock: number | null
          min_stock: number | null
          name: string
          price: number
          stock: number
          supplier: string | null
          total_stock: number | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          code: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name: string
          price?: number
          stock?: number
          supplier?: string | null
          total_stock?: number | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          code?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          price?: number
          stock?: number
          supplier?: string | null
          total_stock?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          department: string | null
          emergency_contact: Json | null
          full_name: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          location: string | null
          phone: string | null
          phone_number: string | null
          role: string | null
          salary: number | null
          updated_at: string
          user_id: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          department?: string | null
          emergency_contact?: Json | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          phone?: string | null
          phone_number?: string | null
          role?: string | null
          salary?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          department?: string | null
          emergency_contact?: Json | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          phone?: string | null
          phone_number?: string | null
          role?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      purchase_invoice_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          product_id: string | null
          product_name: string
          quantity: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchase_invoice_items_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_purchase_invoice_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          created_at: string
          deleted_at: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number
          payment_method: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          supplier_name: string
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number
          payment_method?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name: string
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number
          payment_method?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchase_invoices_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          original_unit_price: number | null
          product_id: string | null
          product_name: string
          quantity: number
          reason: string
          return_condition: string | null
          return_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          original_unit_price?: number | null
          product_id?: string | null
          product_name: string
          quantity?: number
          reason: string
          return_condition?: string | null
          return_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          original_unit_price?: number | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          reason?: string
          return_condition?: string | null
          return_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: []
      }
      returns: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string
          deleted_at: string | null
          id: string
          notes: string | null
          original_invoice_id: string | null
          original_invoice_number: string
          original_purchase_invoice_id: string | null
          original_purchase_invoice_number: string | null
          processed_by: string | null
          processed_date: string | null
          reason: string
          refund_amount: number | null
          refund_method: string | null
          return_date: string
          return_number: string
          return_type: string | null
          status: string
          supplier_id: string | null
          supplier_name: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          original_invoice_id?: string | null
          original_invoice_number: string
          original_purchase_invoice_id?: string | null
          original_purchase_invoice_number?: string | null
          processed_by?: string | null
          processed_date?: string | null
          reason: string
          refund_amount?: number | null
          refund_method?: string | null
          return_date?: string
          return_number: string
          return_type?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          original_invoice_id?: string | null
          original_invoice_number?: string
          original_purchase_invoice_id?: string | null
          original_purchase_invoice_number?: string | null
          processed_by?: string | null
          processed_date?: string | null
          reason?: string
          refund_amount?: number | null
          refund_method?: string | null
          return_date?: string
          return_number?: string
          return_type?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          level: number
          name: string
          name_ar: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          level?: number
          name: string
          name_ar: string
          permissions?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          level?: number
          name?: string
          name_ar?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          channels: Database["public"]["Enums"]["notification_channel"][] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          max_sends: number | null
          message: string
          metadata: Json | null
          next_send_at: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority: Database["public"]["Enums"]["notification_priority"] | null
          recurring_end_date: string | null
          recurring_pattern: string | null
          scheduled_for: string
          send_count: number | null
          template_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          max_sends?: number | null
          message: string
          metadata?: Json | null
          next_send_at?: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          scheduled_for: string
          send_count?: number | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          max_sends?: number | null
          message?: string
          metadata?: Json | null
          next_send_at?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          scheduled_for?: string
          send_count?: number | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_products: {
        Row: {
          created_at: string
          creator_user_id: string | null
          display_option: string
          expires_at: string
          id: string
          max_views: number | null
          name: string
          products: Json
          share_id: string
          updated_at: string
          views: number
        }
        Insert: {
          created_at?: string
          creator_user_id?: string | null
          display_option: string
          expires_at: string
          id?: string
          max_views?: number | null
          name: string
          products: Json
          share_id: string
          updated_at?: string
          views?: number
        }
        Update: {
          created_at?: string
          creator_user_id?: string | null
          display_option?: string
          expires_at?: string
          id?: string
          max_views?: number | null
          name?: string
          products?: Json
          share_id?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          id: string
          movement_type: string
          new_stock: number
          notes: string | null
          previous_stock: number
          product_id: string
          product_name: string
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          total_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          movement_type: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_id: string
          product_name: string
          quantity: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_id?: string
          product_name?: string
          quantity?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          company: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          tax_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          joined_at: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_creation_requests: {
        Row: {
          company_id: string | null
          created_at: string
          created_user_id: string | null
          email: string
          error_message: string | null
          full_name: string
          id: string
          requested_by: string
          role_id: string
          status: string
          updated_at: string
          username: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_user_id?: string | null
          email: string
          error_message?: string | null
          full_name: string
          id?: string
          requested_by: string
          role_id: string
          status?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_user_id?: string | null
          email?: string
          error_message?: string | null
          full_name?: string
          id?: string
          requested_by?: string
          role_id?: string
          status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_creation_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_creation_requests_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string
          device_id: string
          device_name: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_login: string
          platform: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_name: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_login?: string
          platform?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_name?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_login?: string
          platform?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_licenses: {
        Row: {
          created_at: string
          current_devices: number | null
          current_users: number | null
          end_date: string
          features: Json | null
          id: string
          is_active: boolean
          license_duration: number
          license_type: string
          max_devices: number | null
          max_users: number | null
          metadata: Json | null
          start_date: string
          tier: Database["public"]["Enums"]["license_tier"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_devices?: number | null
          current_users?: number | null
          end_date: string
          features?: Json | null
          id?: string
          is_active?: boolean
          license_duration: number
          license_type?: string
          max_devices?: number | null
          max_users?: number | null
          metadata?: Json | null
          start_date?: string
          tier?: Database["public"]["Enums"]["license_tier"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_devices?: number | null
          current_users?: number | null
          end_date?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          license_duration?: number
          license_type?: string
          max_devices?: number | null
          max_users?: number | null
          metadata?: Json | null
          start_date?: string
          tier?: Database["public"]["Enums"]["license_tier"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          company_id: string
          id: string
          is_active: boolean
          permissions: Json
          role: Database["public"]["Enums"]["app_role"]
          role_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          company_id: string
          id?: string
          is_active?: boolean
          permissions?: Json
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          company_id?: string
          id?: string
          is_active?: boolean
          permissions?: Json
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          device_id: string
          device_info: Json
          device_name: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          location: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_info?: Json
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          location?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_info?: Json
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          location?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_device_to_license: {
        Args: {
          p_browser_info?: string
          p_device_id: string
          p_device_name?: string
          p_device_type?: string
          p_ip_address?: unknown
          p_license_id: string
          p_os_info?: string
          p_user_id: string
        }
        Returns: boolean
      }
      add_licensed_device: {
        Args: {
          p_browser_info?: string
          p_device_id: string
          p_device_name?: string
          p_device_type?: string
          p_ip_address?: unknown
          p_os_info?: string
          p_user_id: string
        }
        Returns: {
          device_uuid: string
          message: string
          success: boolean
        }[]
      }
      add_licensed_user: {
        Args: {
          p_license_owner_id: string
          p_licensed_user_id: string
          p_role?: string
        }
        Returns: {
          license_id: string
          message: string
          success: boolean
        }[]
      }
      add_user_license: {
        Args:
          | {
              p_duration_days: number
              p_license_type: string
              p_max_devices: number
              p_max_users: number
              p_user_id: string
            }
          | {
              p_duration_days: number
              p_license_type: string
              p_user_id: string
            }
        Returns: string
      }
      add_user_to_license: {
        Args: { p_granted_by: string; p_license_id: string; p_user_id: string }
        Returns: boolean
      }
      calculate_cash_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_expected_selling_price: {
        Args: { p_profit_percentage: number; p_unit_cost: number }
        Returns: number
      }
      calculate_next_backup_time: {
        Args: {
          backup_interval: string
          backup_time: string
          last_backup?: string
        }
        Returns: string
      }
      calculate_next_notification_time: {
        Args: { input_time: string; pattern: string }
        Returns: string
      }
      calculate_product_inventory_value: {
        Args: { p_product_id: string }
        Returns: number
      }
      calculate_product_total_purchases: {
        Args: { p_product_id: string }
        Returns: number
      }
      calculate_purchase_invoice_total_quantity: {
        Args: { p_invoice_id: string }
        Returns: number
      }
      calculate_total_business_costs: {
        Args: { p_date_from?: string; p_date_to?: string; p_user_id?: string }
        Returns: {
          cost_breakdown: Json
          inventory_costs: number
          operating_costs: number
          purchase_costs: number
          total_costs: number
        }[]
      }
      calculate_user_inventory_costs: {
        Args: { p_user_id?: string }
        Returns: {
          breakdown: Json
          total_inventory_value: number
          total_products_count: number
        }[]
      }
      check_device_license_limits: {
        Args: { p_device_id: string; p_license_id: string }
        Returns: boolean
      }
      check_duplicate_supplier: {
        Args: {
          p_email?: string
          p_exclude_id?: string
          p_name: string
          p_phone?: string
          p_user_id: string
        }
        Returns: {
          duplicate_type: string
          existing_supplier_id: string
          existing_supplier_name: string
        }[]
      }
      check_license_limits: {
        Args: {
          p_device_count?: number
          p_license_id: string
          p_user_count?: number
        }
        Returns: {
          can_add_device: boolean
          can_add_user: boolean
          max_devices_reached: boolean
          max_users_reached: boolean
        }[]
      }
      check_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      check_user_license: {
        Args: { p_user_id: string }
        Returns: {
          current_devices: number
          current_users: number
          days_remaining: number
          end_date: string
          has_active_license: boolean
          license_type: string
          max_devices: number
          max_users: number
        }[]
      }
      check_user_license_limits: {
        Args: { p_license_id: string; p_new_user_id: string }
        Returns: boolean
      }
      cleanup_expired_licenses: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_orphaned_invoice_transactions: {
        Args: { p_user_id: string }
        Returns: {
          cleaned_count: number
          message: string
        }[]
      }
      create_company_and_setup: {
        Args: { p_company_data: Json; p_user_id?: string }
        Returns: string
      }
      create_company_with_owner: {
        Args: { p_company_name: string; p_user_id?: string }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_category: string
          p_message: string
          p_priority: string
          p_related_entity_id?: string
          p_related_entity_type?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_purchase_cash_transaction: {
        Args: {
          p_invoice_id: string
          p_invoice_number: string
          p_payment_method?: string
          p_supplier_name: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: string
      }
      create_sales_cash_transaction: {
        Args: {
          p_customer_name?: string
          p_invoice_id: string
          p_invoice_number: string
          p_payment_method?: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: string
      }
      create_sample_data: {
        Args: { p_company_id: string; p_industry?: string; p_user_id?: string }
        Returns: undefined
      }
      delete_all_deleted_checks_permanently: {
        Args: { p_user_id: string }
        Returns: {
          deleted_count: number
          message: string
          total_amount: number
        }[]
      }
      extend_user_license: {
        Args: { p_additional_days: number; p_user_id: string }
        Returns: boolean
      }
      fix_current_inventory: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_duplicate_stock: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_user_inventory_stock: {
        Args: { p_user_id: string }
        Returns: {
          new_stock: number
          old_stock: number
          product_id: string
          product_name: string
        }[]
      }
      get_deleted_checks: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          amount: number
          bank_name: string
          check_number: string
          created_at: string
          customer_name: string
          date_received: string
          deleted_at: string
          description: string
          due_date: string
          id: string
          status: string
        }[]
      }
      get_deleted_customers: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          address: string
          created_at: string
          deleted_at: string
          email: string
          id: string
          name: string
          phone: string
        }[]
      }
      get_deleted_installments: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          created_at: string
          customer_name: string
          customer_phone: string
          deleted_at: string
          id: string
          installment_amount: number
          start_date: string
          total_amount: number
          user_id: string
        }[]
      }
      get_deleted_invoices: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          created_at: string
          customers: Json
          deleted_at: string
          id: string
          invoice_number: string
          status: string
          total_amount: number
        }[]
      }
      get_deleted_payroll_records: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          allowances: number
          basic_salary: number
          created_at: string
          deductions: number
          deleted_at: string
          employee_name: string
          id: string
          is_paid: boolean
          month: number
          net_salary: number
          payment_method: string
          year: number
        }[]
      }
      get_deleted_purchase_invoices: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          created_at: string
          deleted_at: string
          id: string
          invoice_number: string
          status: string
          supplier_name: string
          suppliers: Record<string, unknown>
          total_amount: number
        }[]
      }
      get_deleted_transactions: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          amount: number
          category: string
          created_at: string
          deleted_at: string
          description: string
          id: string
          transaction_type: string
        }[]
      }
      get_license_statistics: {
        Args: { p_user_id: string }
        Returns: {
          days_remaining: number
          devices_limit: number
          devices_used: number
          end_date: string
          is_unlimited_devices: boolean
          is_unlimited_users: boolean
          license_type: string
          license_type_ar: string
          users_limit: number
          users_used: number
        }[]
      }
      get_products_with_total_quantities: {
        Args: { p_user_id: string }
        Returns: {
          barcode: string
          category: string
          code: string
          cost: number
          created_at: string
          description: string
          id: string
          image_url: string
          is_active: boolean
          location: string
          max_stock: number
          min_stock: number
          name: string
          price: number
          stock: number
          supplier: string
          total_quantity: number
          unit: string
          updated_at: string
          user_id: string
        }[]
      }
      get_purchase_statistics: {
        Args: { p_period_days?: number; p_user_id: string }
        Returns: {
          paid_amount: number
          pending_amount: number
          total_amount: number
          total_invoices: number
        }[]
      }
      get_supplier_statistics: {
        Args: { p_supplier_id: string; p_user_id: string }
        Returns: {
          average_order_value: number
          last_purchase_date: string
          paid_amount: number
          pending_amount: number
          total_amount: number
          total_invoices: number
        }[]
      }
      get_top_suppliers: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          invoice_count: number
          last_purchase: string
          supplier_id: string
          supplier_name: string
          total_purchases: number
        }[]
      }
      get_total_inventory_value: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_active_company: {
        Args: { p_user_id?: string }
        Returns: string
      }
      get_user_company: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          level: number
          permissions: Json
          role_name: string
          role_name_ar: string
        }[]
      }
      handle_product_stock_update_manual: {
        Args: {
          p_cost: number
          p_product_id: string
          p_product_name: string
          p_stock: number
          p_user_id: string
        }
        Returns: undefined
      }
      has_permission: {
        Args: { _company_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _company_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      permanently_delete_all_invoices: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          deleted_count: number
          message: string
        }[]
      }
      permanently_delete_customer: {
        Args: { p_customer_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      permanently_delete_installment: {
        Args: { p_installment_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      permanently_delete_invoice: {
        Args: { p_invoice_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      permanently_delete_payroll_record: {
        Args: { p_record_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      permanently_delete_purchase_invoice: {
        Args: { p_invoice_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      permanently_delete_transaction: {
        Args: { p_transaction_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      process_auto_backups: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_scheduled_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      recalculate_all_product_stock: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_product_stock: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      restore_all_deleted_checks: {
        Args: { p_user_id: string }
        Returns: {
          message: string
          restored_count: number
          total_amount: number
        }[]
      }
      restore_deleted_customers: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          customers: Json
          restored_count: number
        }[]
      }
      restore_deleted_installments: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          installments: Json
          restored_count: number
        }[]
      }
      restore_deleted_invoices: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          restored_count: number
        }[]
      }
      restore_deleted_payroll_records: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          message: string
          restored_count: number
        }[]
      }
      restore_deleted_purchase_invoices: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          invoices: Json
          restored_count: number
        }[]
      }
      restore_deleted_transactions: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          restored_count: number
          transactions: Json
        }[]
      }
      restore_single_customer: {
        Args: { p_customer_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      restore_single_installment: {
        Args: { p_installment_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      restore_single_invoice: {
        Args: { p_invoice_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      restore_single_payroll_record: {
        Args: { p_record_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      restore_single_purchase_invoice: {
        Args: { p_invoice_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      soft_delete_payroll_record: {
        Args: { p_record_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      switch_active_company: {
        Args: { p_company_id: string; p_user_id?: string }
        Returns: boolean
      }
      sync_existing_checks_with_cash: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_existing_inventory_with_cash: {
        Args: { p_user_id: string }
        Returns: number
      }
      sync_existing_product_stock: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_existing_products_pricing: {
        Args: Record<PropertyKey, never>
        Returns: {
          message: string
          updated_products_count: number
        }[]
      }
      sync_existing_purchase_items_stock: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_product_stock_batch: {
        Args: { p_product_ids?: string[] }
        Returns: {
          new_stock: number
          old_stock: number
          product_id: string
          updated: boolean
        }[]
      }
      sync_product_stock_correct: {
        Args: { p_product_id?: string }
        Returns: undefined
      }
      sync_product_stock_from_transactions: {
        Args: { p_product_id: string }
        Returns: number
      }
      user_has_company_access: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: boolean
      }
      validate_license_limits: {
        Args: { p_user_id: string }
        Returns: {
          days_remaining: number
          devices_count: number
          error_message: string
          is_valid: boolean
          license_type: string
          max_devices: number
          max_users: number
          users_count: number
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "employee" | "viewer"
      license_tier:
        | "trial"
        | "basic"
        | "standard"
        | "premium"
        | "enterprise"
        | "lifetime"
        | "monthly"
        | "quarterly"
        | "yearly"
      notification_channel: "in_app" | "email" | "sms" | "push"
      notification_priority: "low" | "medium" | "high" | "critical"
      notification_status: "active" | "read" | "archived" | "resolved"
      notification_type:
        | "invoice_due"
        | "invoice_overdue"
        | "low_stock"
        | "out_of_stock"
        | "check_due"
        | "low_cash"
        | "customer_overdue"
        | "supplier_payment"
        | "security_alert"
        | "monthly_report"
        | "system_notification"
        | "scheduled_reminder"
        | "task_reminder"
        | "payment_reminder"
      security_level: "low" | "medium" | "high" | "critical"
      session_status: "active" | "inactive" | "expired" | "terminated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "manager", "employee", "viewer"],
      license_tier: [
        "trial",
        "basic",
        "standard",
        "premium",
        "enterprise",
        "lifetime",
        "monthly",
        "quarterly",
        "yearly",
      ],
      notification_channel: ["in_app", "email", "sms", "push"],
      notification_priority: ["low", "medium", "high", "critical"],
      notification_status: ["active", "read", "archived", "resolved"],
      notification_type: [
        "invoice_due",
        "invoice_overdue",
        "low_stock",
        "out_of_stock",
        "check_due",
        "low_cash",
        "customer_overdue",
        "supplier_payment",
        "security_alert",
        "monthly_report",
        "system_notification",
        "scheduled_reminder",
        "task_reminder",
        "payment_reminder",
      ],
      security_level: ["low", "medium", "high", "critical"],
      session_status: ["active", "inactive", "expired", "terminated"],
    },
  },
} as const
