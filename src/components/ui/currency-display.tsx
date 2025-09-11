import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CurrencyDisplayProps {
  amount: number;
  currency?: "SAR" | "EGP";
  showConverter?: boolean;
}

export const CurrencyDisplay = ({ 
  amount, 
  currency = "SAR", 
  showConverter = false 
}: CurrencyDisplayProps) => {
  const [displayCurrency, setDisplayCurrency] = useState<"SAR" | "EGP">(currency);
  const [exchangeRate, setExchangeRate] = useState<number>(8.5); // Default fallback rate
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchExchangeRate = async () => {
    if (!showConverter) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/SAR');
      const data = await response.json();
      
      if (data && data.rates && data.rates.EGP) {
        setExchangeRate(data.rates.EGP);
      }
    } catch (error) {
      // Keep fallback rate
      console.log("Using fallback exchange rate");
    } finally {
      setLoading(false);
    }
  };

  const convertAmount = (amount: number, from: "SAR" | "EGP", to: "SAR" | "EGP") => {
    if (from === to) return amount;
    
    if (from === "SAR" && to === "EGP") {
      return amount * exchangeRate;
    } else if (from === "EGP" && to === "SAR") {
      return amount / exchangeRate;
    }
    
    return amount;
  };

  const getDisplayAmount = () => {
    if (currency === displayCurrency) {
      return amount;
    }
    return convertAmount(amount, currency, displayCurrency);
  };

  const getCurrencySymbol = (curr: "SAR" | "EGP") => {
    return curr === "SAR" ? "ر.س" : "ج.م";
  };

  const toggleCurrency = () => {
    setDisplayCurrency(displayCurrency === "SAR" ? "EGP" : "SAR");
  };

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">
          {(getDisplayAmount() || 0).toLocaleString()} {getCurrencySymbol(displayCurrency)}
        </div>
        {showConverter && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCurrency}
              className="h-8 w-8 p-0"
            >
              <ArrowRightLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchExchangeRate}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>
      {showConverter && displayCurrency !== currency && (
        <div className="text-xs text-muted-foreground">
          {displayCurrency === "EGP" ? 
            `المعادل: ${(amount || 0).toLocaleString()} ر.س × ${exchangeRate.toFixed(2)}` :
            `المعادل: ${(amount || 0).toLocaleString()} ج.م ÷ ${exchangeRate.toFixed(2)}`
          }
        </div>
      )}
    </div>
  );
};
