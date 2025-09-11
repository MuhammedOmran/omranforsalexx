@echo off
echo بناء تطبيق عمران للمبيعات - نسخة أوف لاين
echo ================================================

echo.
echo 1. تنظيف المجلدات السابقة...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron

echo.
echo 2. تثبيت التبعيات...
call npm install

echo.
echo 3. بناء واجهة التطبيق...
call npm run build

echo.
echo 4. بناء تطبيق Electron...
call npx electron-builder --win

echo.
echo 5. تم الانتهاء بنجاح!
echo يمكنك العثور على ملفات التطبيق في مجلد dist-electron
echo.
echo الملفات المتاحة:
echo - omran-sales-offline-setup-*.exe (ملف التثبيت)
echo - omran-sales-offline-portable-*.exe (نسخة محمولة)
echo.
pause