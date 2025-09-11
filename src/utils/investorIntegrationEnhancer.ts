import { storage } from './storage';
import { inventoryManager } from './inventoryUtils';
import { businessIntegration } from './businessIntegration';

/**
 * Enhanced utilities for investor integration system
 * Provides advanced linking, validation and optimization features
 */
export class InvestorIntegrationEnhancer {
  private static instance: InvestorIntegrationEnhancer;

  static getInstance(): InvestorIntegrationEnhancer {
    if (!InvestorIntegrationEnhancer.instance) {
      InvestorIntegrationEnhancer.instance = new InvestorIntegrationEnhancer();
    }
    return InvestorIntegrationEnhancer.instance;
  }

  /**
   * Auto-link existing purchases to investors
   */
  autoLinkPurchasesToInvestors(): { linked: number; errors: string[] } {
    const errors: string[] = [];
    let linked = 0;

    try {
      const investors = storage.getItem('investors', []);
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      const unlinkePurchases = purchaseInvoices.filter((p: any) => !p.investorId);

      for (const purchase of unlinkePurchases) {
        // Try to find matching investor by supplier name or notes
        const matchingInvestor = investors.find((inv: any) => 
          purchase.supplier?.toLowerCase().includes(inv.name.toLowerCase()) ||
          purchase.notes?.toLowerCase().includes(inv.name.toLowerCase())
        );

        if (matchingInvestor) {
          purchase.investorId = matchingInvestor.id;
          purchase.ownerType = 'investor';
          linked++;
        }
      }

      if (linked > 0) {
        storage.setItem('purchase_invoices', purchaseInvoices);
      }

    } catch (error) {
      errors.push(`خطأ في الربط التلقائي: ${error.message}`);
    }

    return { linked, errors };
  }

  /**
   * Auto-link existing sales to investors
   */
  autoLinkSalesToInvestors(): { linked: number; errors: string[] } {
    const errors: string[] = [];
    let linked = 0;

    try {
      const investors = storage.getItem('investors', []);
      const salesInvoices = storage.getItem('invoices', []);
      const unlinkedSales = salesInvoices.filter((s: any) => !s.investorId);

      for (const sale of unlinkedSales) {
        // Check if any sold items belong to an investor
        if (sale.itemsDetails && Array.isArray(sale.itemsDetails)) {
          for (const item of sale.itemsDetails) {
            const products = inventoryManager.getProducts();
            const product = products.find(p => 
              p.name === item.productName && p.ownerType === 'investor'
            );

            if (product && product.ownerId) {
              sale.investorId = product.ownerId;
              sale.ownerType = 'investor';
              linked++;
              break; // Only link to one investor per sale
            }
          }
        }
      }

      if (linked > 0) {
        storage.setItem('invoices', salesInvoices);
      }

    } catch (error) {
      errors.push(`خطأ في ربط المبيعات: ${error.message}`);
    }

    return { linked, errors };
  }

  /**
   * Validate investor data integrity
   */
  validateInvestorIntegrity(): { isValid: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      const investors = storage.getItem('investors', []);
      const purchases = storage.getItem('investor_purchases', []);
      const sales = storage.getItem('investor_sales', []);
      const products = inventoryManager.getProducts();

      // Check for orphaned purchases
      const orphanedPurchases = purchases.filter((p: any) => 
        !investors.find((inv: any) => inv.id === p.investorId)
      );
      if (orphanedPurchases.length > 0) {
        issues.push(`${orphanedPurchases.length} مشتريات غير مرتبطة بمستثمرين`);
        suggestions.push('قم بمراجعة وحذف أو ربط المشتريات غير المرتبطة');
      }

      // Check for orphaned sales
      const orphanedSales = sales.filter((s: any) => 
        !investors.find((inv: any) => inv.id === s.investorId)
      );
      if (orphanedSales.length > 0) {
        issues.push(`${orphanedSales.length} مبيعات غير مرتبطة بمستثمرين`);
        suggestions.push('قم بمراجعة وحذف أو ربط المبيعات غير المرتبطة');
      }

      // Check for products without proper ownership
      const unownedProducts = products.filter(p => 
        p.ownerType === 'investor' && (!p.ownerId || !investors.find((inv: any) => inv.id === p.ownerId))
      );
      if (unownedProducts.length > 0) {
        issues.push(`${unownedProducts.length} منتجات بدون مالك صحيح`);
        suggestions.push('قم بتحديد ملكية المنتجات غير المحددة');
      }

      // Check for balance inconsistencies
      for (const investor of investors) {
        const investorPurchases = purchases.filter((p: any) => p.investorId === investor.id);
        const investorSales = sales.filter((s: any) => s.investorId === investor.id);
        
        const totalSpent = investorPurchases.reduce((sum: number, p: any) => sum + p.totalCost, 0);
        const totalEarned = investorSales.reduce((sum: number, s: any) => sum + (s.quantitySold * s.sellingPrice), 0);
        
        const expectedRemaining = investor.investedAmount - totalSpent + totalEarned;
        const actualRemaining = investor.remainingAmount;
        
        if (Math.abs(expectedRemaining - actualRemaining) > 1) {
          issues.push(`عدم تطابق في رصيد المستثمر ${investor.name}`);
          suggestions.push(`قم بمراجعة حسابات المستثمر ${investor.name} وإعادة ضبط الرصيد`);
        }
      }

    } catch (error) {
      issues.push(`خطأ في التحقق من سلامة البيانات: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Fix investor balance inconsistencies
   */
  fixInvestorBalances(): { fixed: number; errors: string[] } {
    const errors: string[] = [];
    let fixed = 0;

    try {
      const investors = storage.getItem('investors', []);
      const purchases = storage.getItem('investor_purchases', []);
      const sales = storage.getItem('investor_sales', []);

      for (const investor of investors) {
        const investorPurchases = purchases.filter((p: any) => p.investorId === investor.id);
        const investorSales = sales.filter((s: any) => s.investorId === investor.id);
        
        const totalSpent = investorPurchases.reduce((sum: number, p: any) => sum + p.totalCost, 0);
        const totalEarned = investorSales.reduce((sum: number, s: any) => sum + (s.quantitySold * s.sellingPrice), 0);
        
        const correctRemaining = investor.investedAmount - totalSpent + totalEarned;
        
        if (Math.abs(correctRemaining - investor.remainingAmount) > 1) {
          investor.remainingAmount = correctRemaining;
          fixed++;
        }
      }

      if (fixed > 0) {
        storage.setItem('investors', investors);
      }

    } catch (error) {
      errors.push(`خطأ في إصلاح الأرصدة: ${error.message}`);
    }

    return { fixed, errors };
  }

  /**
   * Generate investor performance summary
   */
  generateInvestorPerformanceSummary() {
    try {
      const investors = storage.getItem('investors', []);
      const purchases = storage.getItem('investor_purchases', []);
      const sales = storage.getItem('investor_sales', []);

      const summary = investors.map((investor: any) => {
        const investorPurchases = purchases.filter((p: any) => p.investorId === investor.id);
        const investorSales = sales.filter((s: any) => s.investorId === investor.id);
        
        const totalSpent = investorPurchases.reduce((sum: number, p: any) => sum + p.totalCost, 0);
        const totalEarned = investorSales.reduce((sum: number, s: any) => sum + (s.quantitySold * s.sellingPrice), 0);
        const netProfit = totalEarned - totalSpent;
        const roi = investor.investedAmount > 0 ? (netProfit / investor.investedAmount) * 100 : 0;
        const utilizationRate = investor.investedAmount > 0 ? (totalSpent / investor.investedAmount) * 100 : 0;

        return {
          id: investor.id,
          name: investor.name,
          investedAmount: investor.investedAmount,
          remainingAmount: investor.remainingAmount,
          totalSpent,
          totalEarned,
          netProfit,
          roi,
          utilizationRate,
          purchaseCount: investorPurchases.length,
          saleCount: investorSales.length,
          currentStockValue: inventoryManager.calculateInvestorStockValue(investor.id)
        };
      });

      return {
        investors: summary,
        totals: {
          totalInvestors: investors.length,
          totalInvested: summary.reduce((sum, inv) => sum + inv.investedAmount, 0),
          totalSpent: summary.reduce((sum, inv) => sum + inv.totalSpent, 0),
          totalEarned: summary.reduce((sum, inv) => sum + inv.totalEarned, 0),
          totalProfit: summary.reduce((sum, inv) => sum + inv.netProfit, 0),
          averageROI: summary.length > 0 ? summary.reduce((sum, inv) => sum + inv.roi, 0) / summary.length : 0,
          totalStockValue: summary.reduce((sum, inv) => sum + inv.currentStockValue, 0)
        }
      };

    } catch (error) {
      console.error('خطأ في إنشاء ملخص الأداء:', error);
      return null;
    }
  }

  /**
   * Optimize investor-product relationships
   */
  optimizeInvestorProductRelationships(): { optimized: number; suggestions: string[] } {
    const suggestions: string[] = [];
    let optimized = 0;

    try {
      const products = inventoryManager.getProducts();
      const movements = inventoryManager.getMovements();
      const investors = storage.getItem('investors', []);

      // Find products that should be linked to investors based on movements
      for (const product of products) {
        if (!product.ownerId || product.ownerType !== 'investor') {
          const productMovements = movements.filter(m => m.productId === product.id);
          
          // Check if majority of movements are from investor operations
          const investorMovements = productMovements.filter(m => 
            m.referenceType === 'investor_purchase' || m.referenceType === 'investor_sale'
          );
          
          if (investorMovements.length > productMovements.length / 2) {
            // Find most common investor for this product
            const investorCounts: { [key: string]: number } = {};
            investorMovements.forEach(m => {
              if (m.ownerId) {
                investorCounts[m.ownerId] = (investorCounts[m.ownerId] || 0) + 1;
              }
            });

            const mostCommonInvestor = Object.entries(investorCounts)
              .sort(([,a], [,b]) => b - a)[0];

            if (mostCommonInvestor) {
              suggestions.push(
                `يُنصح بربط المنتج "${product.name}" بالمستثمر "${mostCommonInvestor[0]}"`
              );
            }
          }
        }
      }

      // Check for unused investors
      const activeInvestors = new Set(movements
        .filter(m => m.ownerType === 'investor')
        .map(m => m.ownerId)
      );

      const unusedInvestors = investors.filter((inv: any) => 
        !activeInvestors.has(inv.id)
      );

      if (unusedInvestors.length > 0) {
        suggestions.push(
          `${unusedInvestors.length} مستثمرين بدون نشاط - قم بمراجعتهم`
        );
      }

    } catch (error) {
      suggestions.push(`خطأ في التحسين: ${error.message}`);
    }

    return { optimized, suggestions };
  }
}

// Export singleton instance
export const investorIntegrationEnhancer = InvestorIntegrationEnhancer.getInstance();