# Translator

Next.js dictionary app backed by Supabase Postgres.

## Connect a Supabase project

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard). Choose a database password and region, then wait for the project to finish provisioning.
2. In the project, open **SQL Editor**, create a query, paste and run:

   ```sql
   create table if not exists public.dictionary (
     id text primary key,
     sort_order integer not null,
     tunisian text not null,
     german text not null,
     notes text not null default ''
   );

   alter table public.dictionary enable row level security;
   grant all on table public.dictionary to service_role;
   ```

   The app connects from its Next.js server using a private key, so this table does not need a public read or write policy.
3. In **Project Settings → API Keys**, copy the **Project URL** and the `service_role` key (or the `sb_secret_...` secret key if your project shows the newer key format). These keys bypass RLS and must stay on the server.
4. In the project root, create `.env.local` with:

   ```dotenv
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-private-server-key
   ```

   Do not prefix the key with `NEXT_PUBLIC_` or commit `.env.local`.
5. Import the included dictionary and start the app:

   ```bash
   npm run db:seed
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000). `npm run db:seed` can be run again to update/import the original entries; it upserts by ID.

## Deploying

Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as server-side environment variables in your hosting provider, then redeploy. Never expose the private key in browser code. The dictionary API currently allows anyone who can reach the app to add and edit entries, matching the existing app behavior; add authentication before making editing private.

## Local development

```bash
npm run dev
```
