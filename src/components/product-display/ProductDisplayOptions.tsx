import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette } from "lucide-react";
import { useProductDisplay, DisplayOption } from "@/contexts/ProductDisplayContext";

const ProductDisplayOptions = memo(() => {
  const { displayOption, setDisplayOption } = useProductDisplay();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-cairo">
          <Palette className="w-5 h-5" />
          خيارات العرض
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={displayOption} onValueChange={(value) => setDisplayOption(value as DisplayOption)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="selling">أسعار البيع</TabsTrigger>
            <TabsTrigger value="purchase">أسعار الشراء</TabsTrigger>
            <TabsTrigger value="stock">الكميات المتاحة</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
});

ProductDisplayOptions.displayName = "ProductDisplayOptions";

export { ProductDisplayOptions };