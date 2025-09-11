import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, AlertTriangle, GitBranch } from "lucide-react";
import { useInvestor } from "@/contexts/InvestorContext";

export default function InvestorReports() {
  const { investors, getInvestorReport, getInvestorPurchases, getInvestorSales } = useInvestor();
  const [selectedInvestor, setSelectedInvestor] = useState("all");

  const generatePDFReport = async (investorId?: string) => {
    const reportData = (investorId && investorId !== "all")
      ? [getDetailedInvestorReport(investorId)]
      : investors.map(inv => getDetailedInvestorReport(inv.id));

    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Configure font for Arabic text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      
      // Add title
      doc.text("Investor Reports", 105, 20, { align: 'center' });
      doc.text("تقرير المستثمرين", 105, 30, { align: 'center' });
      
      let yPosition = 50;
      
      reportData.forEach((data, index) => {
        if (data) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.text(`Investor: ${data.investor.name}`, 20, yPosition);
          yPosition += 10;
          doc.text(`Total Invested: ${data.report.totalInvested.toLocaleString()} EGP`, 20, yPosition);
          yPosition += 10;
          doc.text(`Total Spent: ${data.report.totalSpent.toLocaleString()} EGP`, 20, yPosition);
          yPosition += 10;
          doc.text(`Remaining Amount: ${data.report.remainingAmount.toLocaleString()} EGP`, 20, yPosition);
          yPosition += 10;
          doc.text(`Total Sales: ${data.report.totalSales.toLocaleString()} EGP`, 20, yPosition);
          yPosition += 10;
          doc.text(`Total Profit: ${data.report.totalProfit.toLocaleString()} EGP`, 20, yPosition);
          yPosition += 20;
        }
      });
      
      // Save the PDF
      doc.save(`investor-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback to text export
      let reportContent = "تقرير المستثمرين\n";
      reportContent += "================\n\n";

      reportData.forEach(data => {
        if (data) {
          reportContent += `المستثمر: ${data.investor.name}\n`;
          reportContent += `المبلغ المستثمر: ${data.report.totalInvested.toLocaleString()} ج.م\n`;
          reportContent += `المبلغ المصروف: ${data.report.totalSpent.toLocaleString()} ج.م\n`;
          reportContent += `المبلغ المتبقي: ${data.report.remainingAmount.toLocaleString()} ج.م\n`;
          reportContent += `إجمالي المبيعات: ${data.report.totalSales.toLocaleString()} ج.م\n`;
          reportContent += `إجمالي الأرباح: ${data.report.totalProfit.toLocaleString()} ج.م\n`;
          reportContent += "------------------------\n\n";
        }
      });

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `تقرير_المستثمرين_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const getDetailedInvestorReport = (investorId: string) => {
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return null;

    const report = getInvestorReport(investorId);
    const purchases = getInvestorPurchases(investorId);
    const sales = getInvestorSales(investorId);
    
    const utilizationRate = ((report.totalInvested - report.remainingAmount) / report.totalInvested) * 100;
    const profitMargin = report.totalSales > 0 ? (report.totalProfit / report.totalSales) * 100 : 0;

    return {
      investor,
      report,
      purchases,
      sales,
      utilizationRate,
      profitMargin
    };
  };

  const allReports = investors.map(inv => getDetailedInvestorReport(inv.id)).filter(Boolean);
  const displayReports = selectedInvestor && selectedInvestor !== "all"
    ? allReports.filter(report => report?.investor.id === selectedInvestor)
    : allReports;

  const totalInvested = allReports.reduce((sum, report) => sum + (report?.report.totalInvested || 0), 0);
  const totalProfit = allReports.reduce((sum, report) => sum + (report?.report.totalProfit || 0), 0);
  const totalRemaining = allReports.reduce((sum, report) => sum + (report?.report.remainingAmount || 0), 0);

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-6 h-full overflow-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تقارير المستثمرين</h1>
          <p className="text-muted-foreground">تقارير شاملة عن أداء وأرباح المستثمرين</p>
        </div>
        
        <div className="flex gap-2">
          <Link to="/investors/integrated-dashboard">
            <Button variant="outline" className="gap-2">
              <GitBranch className="h-4 w-4" />
              اللوحة المتكاملة
            </Button>
          </Link>
          <Button variant="outline" onClick={() => generatePDFReport(selectedInvestor)}>
            <Download className="ml-2 h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>فلترة التقارير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستثمرين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستثمرين</SelectItem>
                  {investors.map((investor) => (
                    <SelectItem key={investor.id} value={investor.id}>
                      {investor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setSelectedInvestor("all")}>
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاستثمارات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvested.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">
              {selectedInvestor && selectedInvestor !== "all" ? "للمستثمر المحدد" : "جميع المستثمرين"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{totalProfit.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">
              إجمالي الأرباح المحققة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبالغ المتبقية</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{totalRemaining.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">
              متاح للاستثمار
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>التقرير الشامل</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto max-h-96 overflow-y-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستثمر</TableHead>
                  <TableHead>المبلغ المستثمر</TableHead>
                  <TableHead>المصروف</TableHead>
                  <TableHead>المتبقي</TableHead>
                  <TableHead>نسبة الاستخدام</TableHead>
                  <TableHead>المبيعات</TableHead>
                  <TableHead>الأرباح</TableHead>
                  <TableHead>هامش الربح</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {displayReports.length > 0 ? (
                displayReports.map((reportData) => {
                  if (!reportData) return null;
                  
                  const { investor, report, utilizationRate, profitMargin } = reportData;
                  const isLowFunds = report.remainingAmount < report.totalInvested * 0.2;
                  const isHighProfit = profitMargin > 20;

                  return (
                    <TableRow key={investor.id}>
                      <TableCell className="font-medium">{investor.name}</TableCell>
                      <TableCell>{report.totalInvested.toLocaleString()} ج.م</TableCell>
                      <TableCell>{report.totalSpent.toLocaleString()} ج.م</TableCell>
                      <TableCell className={isLowFunds ? "text-red-600 font-medium" : "text-green-600"}>
                        {report.remainingAmount.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Progress value={utilizationRate} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {utilizationRate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{report.totalSales.toLocaleString()} ج.م</TableCell>
                      <TableCell className={report.totalProfit > 0 ? "text-green-600 font-medium" : ""}>
                        {report.totalProfit.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className={isHighProfit ? "text-green-600 font-medium" : ""}>
                        {profitMargin.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isLowFunds && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          <Badge variant={isLowFunds ? "destructive" : isHighProfit ? "default" : "secondary"}>
                            {isLowFunds ? "يحتاج تمويل" : isHighProfit ? "أداء ممتاز" : "نشط"}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    لا توجد تقارير متاحة
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>تحليل الأداء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayReports.length > 0 ? (
              displayReports.map((reportData) => {
                if (!reportData) return null;
                
                const { investor, report, purchases, sales } = reportData;

                return (
                  <div key={investor.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{investor.name}</h3>
                      <Badge variant="outline">{investor.id}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">عدد المشتريات:</span>
                        <div className="font-medium">{purchases.length} فاتورة</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">عدد المبيعات:</span>
                        <div className="font-medium">{sales.length} عملية</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">معدل العائد:</span>
                        <div className="font-medium">
                          {report.totalInvested > 0 ? ((report.totalProfit / report.totalInvested) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">فترة الاستثمار:</span>
                        <div className="font-medium">
                          {Math.floor((new Date().getTime() - new Date(investor.depositDate).getTime()) / (1000 * 60 * 60 * 24))} يوم
                        </div>
                      </div>
                    </div>

                    {report.remainingAmount < report.totalInvested * 0.2 && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 text-red-800 rounded text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        تحذير: المبلغ المتبقي قليل ويحتاج إلى إعادة تمويل أو سحب الأرباح
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات لعرض التحليل
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}