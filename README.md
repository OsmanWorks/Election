# AJK Election Live Dashboard — GitHub Pages

یہ مکمل static dashboard ہے۔ کسی command، npm یا server کی ضرورت نہیں۔

## Upload کرنے کا آسان طریقہ

1. ZIP extract کریں۔
2. GitHub repository میں موجود پرانی files حذف کریں۔
3. **ZIP کے اندر موجود تمام files/folders** repository کے root میں upload کریں:
   - `index.html`
   - `assets`
   - `data`
   - `.github`
   - `README.md`
   - `404.html`
4. Commit changes دبائیں۔
5. GitHub repository میں Settings → Pages:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /(root)
6. Save کریں۔

## نتائج کیسے تبدیل کریں

`data/results.json` edit کریں۔

ہر row:
- constituency: حلقہ
- area: علاقہ
- candidate: امیدوار
- party: پارٹی
- votes: ووٹ
- turnout: فیصد
- status: declared / leading / pending
- color: پارٹی کا رنگ

## اہم technical limitation

GitHub Pages صرف static website host کرتا ہے۔ مختلف news websites اپنے RSS/API پر CORS یا bot restrictions لگا سکتی ہیں۔
Dashboard live feed حاصل کرنے کی کوشش کرتا ہے اور ناکامی پر `data/news-fallback.json` دکھاتا ہے۔

اصل، قابل اعتماد، خودکار election result feed کے لیے official JSON API یا backend/proxy درکار ہوگا۔
Demo results حقیقی سرکاری نتائج نہیں ہیں؛ انہیں verified data سے replace کریں۔
