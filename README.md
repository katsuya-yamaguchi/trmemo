## Supabase
プロジェクトの確認方法
```bash
trmemo % npx supabase projects list
Cannot find project ref. Have you run supabase link?

  
   LINKED | ORG ID               | REFERENCE ID         | NAME   | REGION                 | CREATED AT (UTC)    
  --------|----------------------|----------------------|--------|------------------------|---------------------
          | gajxpjusnetiyhmfouqp | xaqcuvlywgajwbntisam | trmemo | Northeast Asia (Tokyo) | 2025-03-12 08:58:17 

trmemo % 
```

## EASを利用したいiOSプラットフォーム向けの開発ビルド
```bash
eas build --profile development --platform ios --clear-cache
```