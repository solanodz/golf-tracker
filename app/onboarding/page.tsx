import { OnboardingForm } from "@/components/auth/onboarding-form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <Card className="mb-8 border-0 bg-transparent text-center shadow-none ring-0">
        <CardHeader className="px-0">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Bienvenido
          </p>
          <CardTitle className="text-3xl">Tu perfil</CardTitle>
          <CardDescription>
            Necesitamos estos datos antes de registrar tu primera ronda.
          </CardDescription>
        </CardHeader>
      </Card>

      <OnboardingForm />
    </main>
  );
}
