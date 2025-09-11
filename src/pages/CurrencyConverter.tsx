import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Popular currencies that users might want to convert from/to EGP
const popularCurrencies = [
  { code: "EGP", name: "الجنيه المصري", flag: "🇪🇬" },
  { code: "SAR", name: "الريال السعودي", flag: "🇸🇦" },
  { code: "USD", name: "الدولار الأمريكي", flag: "🇺🇸" },
  { code: "EUR", name: "اليورو", flag: "🇪🇺" },
  { code: "GBP", name: "الجنيه الإسترليني", flag: "🇬🇧" },
  { code: "AED", name: "الدرهم الإماراتي", flag: "🇦🇪" },
  { code: "KWD", name: "الدينار الكويتي", flag: "🇰🇼" },
  { code: "QAR", name: "الريال القطري", flag: "🇶🇦" },
  { code: "BHD", name: "الدينار البحريني", flag: "🇧🇭" },
  { code: "OMR", name: "الريال العماني", flag: "🇴🇲" },
  { code: "JOD", name: "الدينار الأردني", flag: "🇯🇴" },
  { code: "LBP", name: "الليرة اللبنانية", flag: "🇱🇧" },
  { code: "IQD", name: "الدينار العراقي", flag: "🇮🇶" },
  { code: "SYP", name: "الليرة السورية", flag: "🇸🇾" },
  { code: "LYD", name: "الدينار الليبي", flag: "🇱🇾" },
  { code: "TND", name: "الدينار التونسي", flag: "🇹🇳" },
  { code: "DZD", name: "الدينار الجزائري", flag: "🇩🇿" },
  { code: "MAD", name: "الدرهم المغربي", flag: "🇲🇦" },
  { code: "SDG", name: "الجنيه السوداني", flag: "🇸🇩" },
  { code: "YER", name: "الريال اليمني", flag: "🇾🇪" },
  { code: "SOS", name: "الشلن الصومالي", flag: "🇸🇴" },
  { code: "TRY", name: "الليرة التركية", flag: "🇹🇷" },
  { code: "IRR", name: "الريال الإيراني", flag: "🇮🇷" },
  { code: "AFN", name: "الأفغاني", flag: "🇦🇫" },
  { code: "PKR", name: "الروبية الباكستانية", flag: "🇵🇰" },
  { code: "INR", name: "الروبية الهندية", flag: "🇮🇳" },
  { code: "BDT", name: "التاكا البنجلاديشية", flag: "🇧🇩" },
  { code: "LKR", name: "الروبية السريلانكية", flag: "🇱🇰" },
  { code: "MYR", name: "الرنجت الماليزي", flag: "🇲🇾" },
  { code: "IDR", name: "الروبية الإندونيسية", flag: "🇮🇩" },
  { code: "SGD", name: "الدولار السنغافوري", flag: "🇸🇬" },
  { code: "THB", name: "الباهت التايلندي", flag: "🇹🇭" },
  { code: "PHP", name: "البيزو الفلبيني", flag: "🇵🇭" },
  { code: "KRW", name: "الوون الكوري", flag: "🇰🇷" },
  { code: "JPY", name: "الين الياباني", flag: "🇯🇵" },
  { code: "CNY", name: "اليوان الصيني", flag: "🇨🇳" },
  { code: "AUD", name: "الدولار الأسترالي", flag: "🇦🇺" },
  { code: "NZD", name: "الدولار النيوزيلندي", flag: "🇳🇿" },
  { code: "CAD", name: "الدولار الكندي", flag: "🇨🇦" },
  { code: "CHF", name: "الفرنك السويسري", flag: "🇨🇭" },
  { code: "SEK", name: "الكرونا السويدية", flag: "🇸🇪" },
  { code: "NOK", name: "الكرونا النرويجية", flag: "🇳🇴" },
  { code: "DKK", name: "الكرونا الدنماركية", flag: "🇩🇰" },
  { code: "PLN", name: "الزلوتي البولندي", flag: "🇵🇱" },
  { code: "CZK", name: "الكرونا التشيكية", flag: "🇨🇿" },
  { code: "HUF", name: "الفورنت المجري", flag: "🇭🇺" },
  { code: "RON", name: "الليو الروماني", flag: "🇷🇴" },
  { code: "BGN", name: "الليف البلغاري", flag: "🇧🇬" },
  { code: "HRK", name: "الكونا الكرواتية", flag: "🇭🇷" },
  { code: "RSD", name: "الدينار الصربي", flag: "🇷🇸" },
  { code: "UAH", name: "الهريفنيا الأوكرانية", flag: "🇺🇦" },
  { code: "RUB", name: "الروبل الروسي", flag: "🇷🇺" },
  { code: "BYN", name: "الروبل البيلاروسي", flag: "🇧🇾" },
  { code: "KZT", name: "التنغه الكازاخستانية", flag: "🇰🇿" },
  { code: "UZS", name: "السوم الأوزبكستاني", flag: "🇺🇿" },
  { code: "KGS", name: "السوم القيرغيزستاني", flag: "🇰🇬" },
  { code: "TJS", name: "السوموني الطاجيكستاني", flag: "🇹🇯" },
  { code: "TMT", name: "المانات التركمانستاني", flag: "🇹🇲" },
  { code: "AZN", name: "المانات الأذربيجاني", flag: "🇦🇿" },
  { code: "GEL", name: "اللاري الجورجي", flag: "🇬🇪" },
  { code: "AMD", name: "الدرام الأرميني", flag: "🇦🇲" },
  { code: "ZAR", name: "الراند الجنوب أفريقي", flag: "🇿🇦" },
  { code: "NGN", name: "النايرا النيجيرية", flag: "🇳🇬" },
  { code: "KES", name: "الشلن الكيني", flag: "🇰🇪" },
  { code: "TZS", name: "الشلن التنزاني", flag: "🇹🇿" },
  { code: "UGX", name: "الشلن الأوغندي", flag: "🇺🇬" },
  { code: "ETB", name: "البير الإثيوبي", flag: "🇪🇹" },
  { code: "GHS", name: "السيدي الغاني", flag: "🇬🇭" },
  { code: "XOF", name: "فرنك غرب أفريقيا", flag: "🌍" },
  { code: "XAF", name: "فرنك وسط أفريقيا", flag: "🌍" },
  { code: "MUR", name: "الروبية الموريشيوسية", flag: "🇲🇺" },
  { code: "SCR", name: "الروبية السيشلية", flag: "🇸🇨" },
  { code: "BWP", name: "البولا البوتسوانية", flag: "🇧🇼" },
  { code: "NAD", name: "الدولار الناميبي", flag: "🇳🇦" },
  { code: "SZL", name: "الليلانجيني السوازيلندي", flag: "🇸🇿" },
  { code: "LSL", name: "اللوتي الليسوتوي", flag: "🇱🇸" },
  { code: "MWK", name: "الكواشا المالاوية", flag: "🇲🇼" },
  { code: "ZMW", name: "الكواشا الزامبية", flag: "🇿🇲" },
  { code: "ZWL", name: "الدولار الزيمبابوي", flag: "🇿🇼" },
  { code: "AOA", name: "الكوانزا الأنجولية", flag: "🇦🇴" },
  { code: "MZN", name: "الميتيكال الموزمبيقية", flag: "🇲🇿" },
  { code: "MGA", name: "الأرياري المدغشقرية", flag: "🇲🇬" },
  { code: "KMF", name: "الفرنك القمري", flag: "🇰🇲" },
  { code: "DJF", name: "الفرنك الجيبوتي", flag: "🇩🇯" },
  { code: "ERN", name: "الناكفا الإريترية", flag: "🇪🇷" },
  { code: "ETB", name: "البير الإثيوبي", flag: "🇪🇹" },
  { code: "RWF", name: "الفرنك الرواندي", flag: "🇷🇼" },
  { code: "BIF", name: "الفرنك البوروندي", flag: "🇧🇮" },
  { code: "BRL", name: "الريال البرازيلي", flag: "🇧🇷" },
  { code: "ARS", name: "البيزو الأرجنتيني", flag: "🇦🇷" },
  { code: "CLP", name: "البيزو التشيلي", flag: "🇨🇱" },
  { code: "COP", name: "البيزو الكولومبي", flag: "🇨🇴" },
  { code: "PEN", name: "السول البيروفي", flag: "🇵🇪" },
  { code: "UYU", name: "البيزو الأوروجوياني", flag: "🇺🇾" },
  { code: "PYG", name: "الجواراني الباراجوياني", flag: "🇵🇾" },
  { code: "BOB", name: "البوليفيانو البوليفي", flag: "🇧🇴" },
  { code: "VES", name: "البوليفار الفنزويلي", flag: "🇻🇪" },
  { code: "GYD", name: "الدولار الجياني", flag: "🇬🇾" },
  { code: "SRD", name: "الدولار السورينامي", flag: "🇸🇷" },
  { code: "MXN", name: "البيزو المكسيكي", flag: "🇲🇽" },
  { code: "GTQ", name: "الكويتزال الجواتيمالي", flag: "🇬🇹" },
  { code: "CRC", name: "الكولون الكوستاريكي", flag: "🇨🇷" },
  { code: "NIO", name: "الكوردوبا النيكاراجوية", flag: "🇳🇮" },
  { code: "HNL", name: "الليمبيرا الهندوراسية", flag: "🇭🇳" },
  { code: "PAB", name: "البالبوا البنمية", flag: "🇵🇦" },
  { code: "JMD", name: "الدولار الجامايكي", flag: "🇯🇲" },
  { code: "TTD", name: "الدولار التريني", flag: "🇹🇹" },
  { code: "BBD", name: "الدولار الباربادوسي", flag: "🇧🇧" },
  { code: "BSD", name: "الدولار البهامي", flag: "🇧🇸" },
  { code: "BMD", name: "الدولار البرمودي", flag: "🇧🇲" },
  { code: "KYD", name: "الدولار الكايماني", flag: "🇰🇾" },
  { code: "XCD", name: "دولار شرق الكاريبي", flag: "🏴" }
];

const CurrencyConverter = () => {
  const [fromCurrency, setFromCurrency] = useState<string>("SAR");
  const [toCurrency, setToCurrency] = useState<string>("EGP");
  const [fromAmount, setFromAmount] = useState<string>("1");
  const [toAmount, setToAmount] = useState<string>("0");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const { toast } = useToast();

  // Default fallback rates (approximate)
  const fallbackRates: Record<string, number> = {
    EGP: 13.18,
    SAR: 1,
    USD: 0.267,
    EUR: 0.229,
    GBP: 0.199,
    AED: 0.979,
    KWD: 0.0815,
    QAR: 0.971,
    BHD: 0.1,
    OMR: 0.103,
    JOD: 0.189
  };

  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      // Using exchangerate-api.com (free tier) - Getting SAR rates
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/SAR');
      const data = await response.json();
      
      if (data && data.rates) {
        setExchangeRates(data.rates);
        setLastUpdated(new Date().toLocaleString('ar-EG'));
        toast({
          title: "تم تحديث أسعار الصرف",
          description: "تم جلب أحدث أسعار الصرف بنجاح",
        });
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      // Use fallback rates if API fails
      setExchangeRates(fallbackRates);
      setLastUpdated(new Date().toLocaleString('ar-EG'));
      toast({
        title: "تم استخدام الأسعار الافتراضية",
        description: "لم يتم الاتصال بخدمة أسعار الصرف، تم استخدام الأسعار التقريبية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = (amount: string, fromCurr: string, toCurr: string): string => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || Object.keys(exchangeRates).length === 0) return "0";
    
    // All rates are relative to SAR, so we need to convert through SAR
    let result = 0;
    
    if (fromCurr === "SAR") {
      // From SAR to target currency
      result = numAmount * (exchangeRates[toCurr] || 1);
    } else if (toCurr === "SAR") {
      // From source currency to SAR
      result = numAmount / (exchangeRates[fromCurr] || 1);
    } else {
      // From source currency to target currency (via SAR)
      const sarAmount = numAmount / (exchangeRates[fromCurr] || 1);
      result = sarAmount * (exchangeRates[toCurr] || 1);
    }
    
    return result.toFixed(2);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (Object.keys(exchangeRates).length > 0) {
      setToAmount(convertCurrency(value, fromCurrency, toCurrency));
    }
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    if (Object.keys(exchangeRates).length > 0) {
      setFromAmount(convertCurrency(value, toCurrency, fromCurrency));
    }
  };

  const swapCurrencies = () => {
    const tempFromCurrency = fromCurrency;
    const tempFromAmount = fromAmount;
    
    setFromCurrency(toCurrency);
    setToCurrency(tempFromCurrency);
    setFromAmount(toAmount);
    setToAmount(tempFromAmount);
  };

  const handleFromCurrencyChange = (newCurrency: string) => {
    setFromCurrency(newCurrency);
    if (Object.keys(exchangeRates).length > 0) {
      setToAmount(convertCurrency(fromAmount, newCurrency, toCurrency));
    }
  };

  const handleToCurrencyChange = (newCurrency: string) => {
    setToCurrency(newCurrency);
    if (Object.keys(exchangeRates).length > 0) {
      setToAmount(convertCurrency(fromAmount, fromCurrency, newCurrency));
    }
  };

  const getCurrentExchangeRate = () => {
    if (Object.keys(exchangeRates).length === 0) return 0;
    
    if (fromCurrency === "SAR") {
      return exchangeRates[toCurrency] || 1;
    } else if (toCurrency === "SAR") {
      return 1 / (exchangeRates[fromCurrency] || 1);
    } else {
      const sarToTarget = exchangeRates[toCurrency] || 1;
      const sarFromSource = exchangeRates[fromCurrency] || 1;
      return sarToTarget / sarFromSource;
    }
  };

  const getSelectedCurrency = (code: string) => {
    return popularCurrencies.find(curr => curr.code === code) || 
           { code, name: code, flag: "🏳️" };
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (Object.keys(exchangeRates).length > 0) {
      setToAmount(convertCurrency(fromAmount, fromCurrency, toCurrency));
    }
  }, [exchangeRates, fromCurrency, toCurrency]);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-mada-heading">محول العملة الشامل</CardTitle>
          <CardDescription>
            تحويل بين جميع العملات العالمية والجنيه المصري
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exchange Rate Display */}
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">سعر الصرف الحالي</p>
            <p className="text-lg font-semibold">
              1 {getSelectedCurrency(fromCurrency).name} = {getCurrentExchangeRate().toFixed(4)} {getSelectedCurrency(toCurrency).name}
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                آخر تحديث: {lastUpdated}
              </p>
            )}
          </div>

          {/* From Currency */}
          <div className="space-y-2">
            <Label htmlFor="from-currency" className="flex items-center gap-2">
              من العملة
            </Label>
            <Select value={fromCurrency} onValueChange={handleFromCurrencyChange}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>{getSelectedCurrency(fromCurrency).flag}</span>
                    <span>{getSelectedCurrency(fromCurrency).name} ({fromCurrency})</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {popularCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.name} ({currency.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="from-amount"
              type="number"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              placeholder="أدخل المبلغ"
              min="0"
              step="0.01"
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapCurrencies}
              className="rounded-full"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <Label htmlFor="to-currency" className="flex items-center gap-2">
              إلى العملة
            </Label>
            <Select value={toCurrency} onValueChange={handleToCurrencyChange}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>{getSelectedCurrency(toCurrency).flag}</span>
                    <span>{getSelectedCurrency(toCurrency).name} ({toCurrency})</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {popularCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.name} ({currency.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="to-amount"
              type="number"
              value={toAmount}
              onChange={(e) => handleToAmountChange(e.target.value)}
              placeholder="المبلغ المحول"
              min="0"
              step="0.01"
            />
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={fetchExchangeRates}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث أسعار الصرف
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground text-center p-3 bg-muted/50 rounded">
            <p>
              * أسعار الصرف تقريبية وقد تختلف عن الأسعار الفعلية في البنوك ومكاتب الصرافة
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencyConverter;