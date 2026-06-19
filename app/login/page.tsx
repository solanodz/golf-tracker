import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authError = params.error === "auth";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Golf Tracker
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900">Ingresá</h1>
        <p className="mt-2 text-zinc-600">
          Te enviamos un link mágico a tu email. Sin contraseña.
        </p>
      </div>

      {authError ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          No pudimos validar el link. Pedí uno nuevo.
        </p>
      ) : null}

      <LoginForm />
    </main>
  );
}
