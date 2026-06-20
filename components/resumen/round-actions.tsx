"use client";

import { LayoutDashboard, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function RoundActions({
  roundId,
  playedOn,
}: {
  roundId: string;
  playedOn: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(playedOn);
  const [pending, setPending] = useState<"date" | "edit" | "delete" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function saveDate() {
    setPending("date");
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("rounds")
      .update({ played_on: date })
      .eq("id", roundId);

    setPending(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  async function editRound() {
    setPending("edit");
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("rounds")
      .update({ status: "in_progress" })
      .eq("id", roundId);

    if (updateError) {
      setError(updateError.message);
      setPending(null);
      return;
    }

    router.push(`/nueva-ronda/editar/${roundId}`);
    router.refresh();
  }

  async function deleteRound() {
    setPending("delete");
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("rounds")
      .delete()
      .eq("id", roundId);

    if (deleteError) {
      setError(deleteError.message);
      setPending(null);
      return;
    }

    router.push("/historial");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fecha de la ronda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="round-date">Fecha</Label>
            <Input
              id="round-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={saveDate}
            disabled={pending === "date" || date === playedOn}
          >
            {pending === "date" ? "Guardando..." : "Guardar fecha"}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        asChild
        className="h-12 bg-emerald-700 font-semibold hover:bg-emerald-800"
      >
        <Link href="/dashboard">
          <LayoutDashboard />
          Ir al dashboard
        </Link>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={editRound}
        disabled={pending !== null}
        className="h-12"
      >
        <Pencil />
        {pending === "edit" ? "Abriendo..." : "Editar hoyos"}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-12 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Trash2 />
            Borrar ronda
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar esta ronda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los scores
              de la ronda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={deleteRound}
              disabled={pending === "delete"}
            >
              {pending === "delete" ? "Borrando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
