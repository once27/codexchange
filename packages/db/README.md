# Database Package

Database layer for CodeExchange using Drizzle ORM and PostgreSQL (Supabase).

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create `.env.local` in `apps/web/` with your Supabase connection:
```bash
DATABASE_URL=postgresql://postgres:[password]@[host]/postgres
```

3. Generate migrations:
```bash
pnpm db:generate
```

4. Push schema to database:
```bash
pnpm db:push
```

5. Seed test data:
```bash
pnpm db:seed
```

## Scripts

- `pnpm db:generate` - Generate migration files from schema
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm db:seed` - Populate database with test data

## Usage in Other Packages

Add to your `package.json`:
```json
{
  "dependencies": {
    "@codexchange/db": "workspace:*"
  }
}
```

Then import:
```typescript
import { db, assets, profiles } from '@codexchange/db';

// Query example
const allAssets = await db.select().from(assets);
```

## Schema

See `schema.ts` for complete database schema including:
- `profiles` - User profiles (extends Supabase auth)
- `categories` - Asset categories
- `assets` - Listed AI tools
- `licenses` - Purchased licenses
- `transactions` - Payment records
- `surveys` & `survey_responses` - Pricing surveys
- `reviews` - Asset reviews
- `market_data` - Historical data snapshots
- `admin_actions` - Audit log
