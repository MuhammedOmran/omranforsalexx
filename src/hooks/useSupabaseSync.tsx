import { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseSync = () => {
  const { user } = useSupabaseAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync suppliers - temporarily disabled since suppliers table doesn't exist
  const syncSuppliers = async (suppliers: any[]) => {
    if (!user || !suppliers.length) return;

    try {
      setIsSyncing(true);
      console.log('Suppliers sync temporarily disabled - table does not exist yet');
      return true;
    } catch (error) {
      console.error('Error syncing suppliers:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync invoices with proper required fields
  const syncInvoices = async (invoices: any[]) => {
    if (!user || !invoices.length) return;

    try {
      setIsSyncing(true);
      
      for (const invoice of invoices) {
        const invoiceData = {
          id: invoice.id,
          user_id: user.id,
          customer_id: invoice.customer_id || null,
          invoice_number: invoice.invoice_number || `INV-${Date.now()}`,
          total_amount: invoice.total_amount || 0,
          status: invoice.status || 'draft'
        };

        // Check if invoice exists
        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('id', invoice.id)
          .single();

        if (existingInvoice) {
          await supabase
            .from('invoices')
            .update(invoiceData)
            .eq('id', invoice.id);
        } else {
          await supabase
            .from('invoices')
            .insert([invoiceData]);
        }

        // Sync invoice items if they exist
        if (invoice.itemsDetails && Array.isArray(invoice.itemsDetails)) {
          for (const item of invoice.itemsDetails) {
            const itemData = {
              invoice_id: invoice.id,
              product_id: item.product_id || null,
              product_name: item.product_name || 'Unknown',
              quantity: item.quantity || 0,
              unit_price: item.unit_price || 0,
              total_price: item.total_price || 0
            };

            await supabase
              .from('invoice_items')
              .insert([itemData]);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing invoices:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync products with required fields
  const syncProducts = async (products: any[]) => {
    if (!user || !products.length) return;

    try {
      setIsSyncing(true);
      
      for (const product of products) {
        const productData = {
          id: product.id,
          user_id: user.id,
          name: product.name,
          code: product.code || `P${Date.now()}`,
          price: product.price || 0,
          cost: product.cost || 0,
          stock: product.stock || 0
        };

        // Check if product exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('id', product.id)
          .single();

        if (existingProduct) {
          await supabase
            .from('products')
            .update(productData)
            .eq('id', product.id);
        } else {
          await supabase
            .from('products')
            .insert([productData]);
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing products:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync customers
  const syncCustomers = async (customers: any[]) => {
    if (!user || !customers.length) return;

    try {
      setIsSyncing(true);
      
      for (const customer of customers) {
        const customerData = {
          id: customer.id,
          user_id: user.id,
          name: customer.name,
          email: customer.email || null,
          phone: customer.phone || null,
          address: customer.address || null,
          company: customer.company || null,
          notes: customer.notes || null
        };

        // Check if customer exists
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('id', customer.id)
          .single();

        if (existingCustomer) {
          await supabase
            .from('customers')
            .update(customerData)
            .eq('id', customer.id);
        } else {
          await supabase
            .from('customers')
            .insert([customerData]);
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing customers:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Full sync all data
  const syncAllData = async (data: {
    suppliers?: any[];
    invoices?: any[];
    products?: any[];
    customers?: any[];
  }) => {
    try {
      setIsSyncing(true);

      if (data.suppliers) {
        await syncSuppliers(data.suppliers);
      }

      if (data.customers) {
        await syncCustomers(data.customers);
      }

      if (data.products) {
        await syncProducts(data.products);
      }

      if (data.invoices) {
        await syncInvoices(data.invoices);
      }

      return true;
    } catch (error) {
      console.error('Error in full sync:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncSuppliers,
    syncInvoices,
    syncProducts,
    syncCustomers,
    syncAllData,
    performSync: syncAllData,
    loadInvoicesFromSupabase: async () => {
      if (!user) return [];
      
      try {
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select(`
            *,
            customers(name),
            invoice_items(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return invoices || [];
      } catch (error) {
        console.error('Error loading invoices from Supabase:', error);
        return [];
      }
    },
    loadCustomersFromSupabase: async () => {
      if (!user) return [];
      
      try {
        const { data: customers, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return customers || [];
      } catch (error) {
        console.error('Error loading customers from Supabase:', error);
        return [];
      }
    },
    isSyncing
  };
};