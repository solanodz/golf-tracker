import { OnboardingForm } from "@/components/auth/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Bienvenido
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900">Tu perfil</h1>
        <p className="mt-2 text-zinc-600">
          Necesitamos estos datos antes de registrar tu primera ronda.
        </p>
      </div>

      <OnboardingForm />
    </main>
  );
}
