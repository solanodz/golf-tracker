"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";
type Status = "idle" | "loading" | "success" | "error";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  function resetFeedback() {
    setStatus("idle");
    setMessage(null);
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus("error");
      if (error.message === "Invalid login credentials") {
        setMessage("Email o contraseña incorrectos.");
      } else if (error.message === "Email not confirmed") {
        setMessage(
          "Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.",
        );
      } else {
        setMessage(error.message);
      }
      return;
    }

    setStatus("success");
    router.refresh();
    router.replace("/nueva-ronda");
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    if (data.session) {
      setStatus("success");
      setMessage("Cuenta creada. Completá tu perfil para empezar.");
      router.refresh();
      router.replace("/onboarding");
      return;
    }

    setStatus("success");
    setMessage(
      "Te enviamos un email para confirmar tu cuenta. Después ingresá con tu email y contraseña.",
    );
    setMode("sign-in");
  }

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => {
        setMode(value as AuthMode);
        resetFeedback();
      }}
      className="w-full"
    >
      <TabsList className="w-full">
        <TabsTrigger value="sign-in" className="flex-1">
          Ingresar
        </TabsTrigger>
        <TabsTrigger value="sign-up" className="flex-1">
          Crear cuenta
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sign-in">
        <form onSubmit={handleSignIn} className="mt-4 flex flex-col gap-4">
          <AuthFields
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            passwordAutoComplete="current-password"
          />

          <Button
            type="submit"
            className="h-12 w-full bg-emerald-700 text-base font-semibold hover:bg-emerald-800"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Ingresando..." : "Ingresar"}
          </Button>

          <AuthMessage status={status} message={message} />
        </form>
      </TabsContent>

      <TabsContent value="sign-up">
        <form onSubmit={handleSignUp} className="mt-4 flex flex-col gap-4">
          <AuthFields
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            passwordAutoComplete="new-password"
            passwordHint="Mínimo 6 caracteres."
          />

          <Button
            type="submit"
            className="h-12 w-full bg-emerald-700 text-base font-semibold hover:bg-emerald-800"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Creando cuenta..." : "Crear cuenta"}
          </Button>

          <AuthMessage status={status} message={message} />
        </form>
      </TabsContent>
    </Tabs>
  );
}

function AuthFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  passwordAutoComplete,
  passwordHint,
}: {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  passwordAutoComplete: "current-password" | "new-password";
  passwordHint?: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="tu@email.com"
          className="h-12"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete={passwordAutoComplete}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="••••••••"
          className="h-12"
        />
        {passwordHint ? (
          <p className="text-xs text-muted-foreground">{passwordHint}</p>
        ) : null}
      </div>
    </>
  );
}

function AuthMessage({
  status,
  message,
}: {
  status: Status;
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`text-sm ${
        status === "error" ? "text-red-600" : "text-emerald-700"
      }`}
    >
      {message}
    </p>
  );
}
