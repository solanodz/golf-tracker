import { Alert, AlertDescription } from "@/components/ui/alert";
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
        <h1 className="mt-2 text-3xl font-bold">Ingresá</h1>
        <p className="mt-2 text-muted-foreground">
          Al registrarte recibís un email de confirmación. Después ingresás solo
          con email y contraseña.
        </p>
      </div>

      {authError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            No pudimos validar la sesión. Volvé a ingresar.
          </AlertDescription>
        </Alert>
      ) : null}

      <LoginForm />
    </main>
  );
}
