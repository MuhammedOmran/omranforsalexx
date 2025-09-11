import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface FontPreviewProps {
  fontFamily: string;
  fontName: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function FontPreview({ fontFamily, fontName, isSelected = false, onClick }: FontPreviewProps) {
  const previewText = {
    ar: "أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ",
    numbers: "0123456789",
    en: "The quick brown fox jumps over the lazy dog"
  };

  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-border hover:border-muted-foreground hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Font Name */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{fontName}</h4>
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-primary"></div>
            )}
          </div>
          
          {/* Font Preview */}
          <div className={`space-y-2 font-${fontFamily}`}>
            {/* Arabic Text */}
            <p className="text-lg text-right leading-relaxed">
              {previewText.ar}
            </p>
            
            {/* Numbers */}
            <p className="text-base text-center font-mono text-muted-foreground">
              {previewText.numbers}
            </p>
            
            {/* English Text */}
            <p className="text-sm text-left text-muted-foreground">
              {previewText.en}
            </p>
          </div>
          
          {/* Font Sizes Demo */}
          <div className={`flex items-center justify-between text-muted-foreground font-${fontFamily}`}>
            <span className="text-xs">صغير</span>
            <span className="text-sm">متوسط</span>
            <span className="text-base">كبير</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}