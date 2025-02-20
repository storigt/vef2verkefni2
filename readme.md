# Vefforritun 2 Verkefni 2

Þetta verkefni er lausn á verkefni 2 í vefforritun 2 þar sem Express vefþjónn er settur upp með PostgreSQL gagnagrunni. Notendur geta skoðað flokka, svarað spurningum og bætt við nýjum spurningum í gagnagrunninn. Gögn eru sótt úr JSON skrám, staðfest og sett inn í gagnagrunninn. Verkefnið keyrir bæði í þróunarumhverfi og er hýst á Render.

## Uppsetning

1. Klónaðu verkefnið af GitHub.
2. Settu upp PostgreSQL og búðu til gagnagrunn með skipuninni:  
   ```  
   createdb vef2-2025  
   ```  
3. Búðu til `.env` skrá með `DATABASE_URL` breytunni. Sjá `.env.example`.
4. Settu upp verkefnið með:  
   ```  
   npm install  
   npm run setup  
   ```  
   Þetta mun búa til töflur í gagnagrunninum og hlaða inn gögnum úr JSON skrám.  
5. Til að keyra verkefnið í þróunarumhverfi:  
   ```  
   npm run dev  
   ```  
6. Til að keyra próf:  
   ```  
   npm run test  
   ```  

## Tæki og tól

- Node.js 22 og NPM
- PostgreSQL fyrir gagnagrunn
- Express fyrir vefþjón
- EJS fyrir template
- GitHub Actions fyrir CI
- Render fyrir hosting
- ChatGPT var notað við aðstoð í verkefninu (aðallega fyrir gagnagrunnstengingu og útfærslu á villumeðhöndlun)

## Hýsing á Render

Verkefnið er hýst á Render með PostgreSQL gagnagrunni. Uppsetningin fylgir þessum skrefum:

1. PostgreSQL gagnagrunnur var búinn til á Render og `DATABASE_URL` var afritað í umhverfisbreytur.
2. Uppsetning var keyrð á Render með:  
   ```  
   node src/setup.js  
   node src/loadData.js  
   ```  
3. Serverinn var stilltur til að keyra á `0.0.0.0` og `process.env.PORT`.

Lifandi útgáfa er aðgengileg hér:  
[🔗 Sjá hýsta vefinn](https://vef2verkefni2.onrender.com)

## Skjalaskipan

- `src/` – Allur kóði fyrir verkefnið
- `src/lib/` – Gagnagrunnstengingar og hjálparföll
- `src/views/` – EJS templates fyrir útlit vefsins
- `public/` – CSS skrár
- `sql/` – SQL skipanir til að setja upp gagnagrunn
- `tests/` – Próf fyrir gagnagrunn og API routes

## Öryggi
- Parametrized queries eru notaðar til að koma í veg fyrir SQL Injection.

## Hlutir sem mættu betur fara
- XSS vörn fyrir betra öryggi.
- Betri leið til að hreinsa gagnagrunninn án þess að endursetja allt.
