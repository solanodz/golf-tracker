This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1. Importa el repo en [Vercel](https://vercel.com/new).
2. En **Project → Settings → Environment Variables**, agregá estas variables para **Production**, **Preview** y **Development**:
   - `NEXT_PUBLIC_SUPABASE_URL` — API URL del proyecto (ej. `https://xxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key (`sb_publishable_...`) desde Supabase → Settings → API Keys
3. **Redeploy** el proyecto (Deployments → ⋯ → Redeploy) para que tome las variables.
4. En **Supabase → Authentication → URL Configuration**, agregá la URL de callback de producción:
   - `https://tu-dominio.vercel.app/auth/callback`
   - También podés incluir `http://localhost:3000/auth/callback` para desarrollo local.
5. En **Supabase → Authentication → Providers → Email**, dejá activo **Confirm email** para que el correo se envíe solo al registrarse (no en cada login).

Sin esas variables, el proxy de Next.js falla con *"Your project's URL and Key are required to create a Supabase client!"*.
