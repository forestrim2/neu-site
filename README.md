# NEU Detail Page Site

공개 상품 상세페이지 사이트 + 관리자 상품 등록 페이지입니다.

## 사용 기술
- React + Vite
- Supabase Auth / Database / Storage
- Vercel 배포

## 상품 입력 항목
- 상품명
- 가격
- 대표이미지
- 상세이미지 여러장
- 상품설명
- 공개/비공개

## 설치
```bash
npm install
cp .env.example .env
npm run dev
```

## Supabase 설정
1. Supabase에서 New Project 생성
2. SQL Editor에 `supabase-setup.sql` 전체 실행
3. Storage에서 `product-images` 버킷 생성
   - Public bucket ON
4. Authentication > Users > Add user에서 관리자 계정 생성
5. Settings > API에서 Project URL / anon public key 복사
6. `.env` 또는 Vercel Environment Variables에 입력

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_INSTAGRAM_URL=https://instagram.com/by_neu
```

## 페이지
- `/` 공개 상품 목록
- `/product?id=상품ID` 공개 상품 상세
- `/admin` 관리자 로그인 / 상품 등록 / 수정 / 삭제
