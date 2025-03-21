# WebtoonTrackerReader

Chrome extension available on: [WebtoonTrackerReader on Chrome Web Store](https://chromewebstore.google.com/detail/tracker-reader-manga-webt/phpcbnalhbfngbciblccmpmmjlgdehjk)

Keep track of where you stop to read your manhwa, webtoon, or manga.

- Automatically loads all webtoon, manga & manhwa you read once (from your Chrome history)  
- Constantly records where you stopped reading!

---

## Techno  
- Angular & TypeScript  

## Technical Architecture  
**Hexagonal architecture**  

### Inside  
- **Domain module in TypeScript** (`src/core/src/domain`)  
  → Contains the logic shared between Angular and `background.ts` / `content-script.ts`  

### Outside  

#### Left-side  
- Angular (`src/app` directory)  
- `background.ts`  
- `content-script.ts`  

#### Right-side  
- Gateway for TypeScript module (`src/core/src/gateway`)  
- Gateway for Angular (`src/app/gateway`)  
  → Separation between in-memory development and real Chrome context  
