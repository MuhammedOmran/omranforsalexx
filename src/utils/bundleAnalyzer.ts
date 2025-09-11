/**
 * محلل حزم التطبيق وتحسين الأداء
 */

export class BundleAnalyzer {
  generatePerformanceReport() {
    const loadMetrics = this.getLoadMetrics();
    const memoryMetrics = this.getMemoryMetrics();
    const networkMetrics = this.getNetworkMetrics();
    const score = this.calculatePerformanceScore(loadMetrics, memoryMetrics, networkMetrics);
    
    return {
      score,
      details: {
        load: loadMetrics,
        memory: memoryMetrics,
        network: networkMetrics
      },
      recommendations: [
        ...loadMetrics.recommendations,
        ...memoryMetrics.recommendations,
        ...networkMetrics.recommendations
      ]
    };
  }

  private getLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const averageLoadTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
    
    const recommendations = [];
    if (averageLoadTime > 3000) {
      recommendations.push('وقت التحميل مرتفع - فكر في تحسين الصور والخطوط');
    }
    if (navigation && (navigation.domContentLoadedEventEnd - navigation.fetchStart) > 2000) {
      recommendations.push('تحميل DOM بطيء - قم بتحسين JavaScript');
    }
    
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcp && fcp.startTime > 2000) {
      recommendations.push('First Contentful Paint بطيء - حسن CSS الأساسي');
    }

    return {
      averageLoadTime,
      slowestPages: [],
      recommendations
    };
  }

  private getMemoryMetrics() {
    const recommendations = [];
    let current = 0;
    let peak = 0;

    const performanceMemory = (performance as any).memory;
    if (performanceMemory) {
      current = performanceMemory.usedJSHeapSize / (1024 * 1024);
      peak = performanceMemory.totalJSHeapSize / (1024 * 1024);
      
      if (current > 50) {
        recommendations.push('استخدام ذاكرة مرتفع - قم بتحسين إدارة البيانات');
      }
    }

    return { current, peak, recommendations };
  }

  private getNetworkMetrics() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const slowResources = resources.filter(r => (r.responseEnd - r.startTime) > 500);
    
    const recommendations = [];
    if (resources.length > 100) {
      recommendations.push('عدد الموارد كبير - ادمج الملفات الصغيرة');
    }
    if (slowResources.length > 5) {
      recommendations.push(`${slowResources.length} مورد بطيء - حسن الصور والخطوط`);
    }

    return {
      totalResources: resources.length,
      slowResources,
      recommendations
    };
  }

  private calculatePerformanceScore(load: any, memory: any, network: any): number {
    let score = 100;
    
    if (load.averageLoadTime > 3000) score -= 20;
    if (load.averageLoadTime > 5000) score -= 20;
    if (memory.current > 50) score -= 15;
    if (memory.current > 100) score -= 15;
    if (network.slowResources.length > 10) score -= 20;
    if (network.totalResources > 100) score -= 10;

    return Math.max(0, score);
  }
}

const bundleAnalyzer = new BundleAnalyzer();

export const initializePerformanceAnalysis = async (): Promise<void> => {
  setTimeout(() => {
    const report = bundleAnalyzer.generatePerformanceReport();
    console.log('تقرير الأداء:', report);
  }, 2000);
};

export { bundleAnalyzer };