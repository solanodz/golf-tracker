"use client";

import { Trophy } from "lucide-react";
import { useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PersonalBestAlertProps = {
  courseName: string;
  gross: number;
  previousBest: number | null;
};

export function PersonalBestAlert({
  courseName,
  gross,
  previousBest,
}: PersonalBestAlertProps) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("record")) {
      url.searchParams.delete("record");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  return (
    <Alert className="mb-6 border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-50">
      <Trophy className="text-amber-500 dark:text-amber-400" />
      <AlertTitle>¡Nuevo récord personal!</AlertTitle>
      <AlertDescription className="text-amber-900/80 dark:text-amber-100/80">
        {previousBest === null ? (
          <>
            Tu primera ronda en <strong>{courseName}</strong> quedó registrada
            como tu mejor marca: <strong>{gross}</strong> golpes.
          </>
        ) : (
          <>
            Superaste tu mejor ronda en <strong>{courseName}</strong>:{" "}
            <strong>{gross}</strong> golpes (antes: {previousBest}).
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
