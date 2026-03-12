# 🚀 تعليمات إعداد مشروع وِجهة

## 📋 خطوات الإعداد السريع

### 1. إعداد قاعدة البيانات في مشروع queer:
1. اذهب إلى Supabase Dashboard
2. افتح مشروع `queer`  
3. اذهب إلى SQL Editor
4. انسخ والصق محتوى ملف `database-setup.sql`
5. اضغط Run لتنفيذ السكريبت

### 2. تحديث ملف `.env.local`:
1. افتح مشروع `queer` في Supabase
2. اذهب إلى Settings → API
3. انسخ المعلومات التالية:
   - Project URL
   - Anon Key  
   - Service Role Key (من Service Role tab)
4. احدث الملف `.env.local` بالقيم الصحيحة

### 3. تشغيل المشروع:
```bash
npm install
npm run dev
```

### 4. اختبار النظام:
- التطبيق: http://localhost:3000
- الإدارة: http://localhost:3000/admin/login
- التجار: http://localhost:3000/merchant/login

## 🔑 بيانات الاختبار:
- العملاء: أي رقم + OTP: 123456
- الإدارة: admin@wejha.qa / 123456  
- التجار: merchant@wejha.qa / 123456

## ✅ النظام جاهز للاستخدام!
