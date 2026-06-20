"use client";

import { Loader2, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AVATAR_ACCEPT,
  AVATAR_BUCKET,
  avatarStoragePath,
  prepareAvatarBlob,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function AvatarUpload({
  userId,
  avatarUrl,
  fallbackLabel,
  className,
}: {
  userId: string;
  avatarUrl: string | null;
  fallbackLabel: string;
  className?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setPending(true);
    setError(null);
    setSuccess(false);

    try {
      const blob = await prepareAvatarBlob(file);
      const supabase = createClient();
      const path = avatarStoragePath(userId);

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, blob, {
          upsert: true,
          contentType: "image/webp",
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

      const nextAvatarUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: nextAvatarUrl })
        .eq("id", userId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setPreviewUrl(nextAvatarUrl);
      setSuccess(true);
      router.refresh();
    } catch (uploadFailure) {
      setError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "No se pudo subir la imagen.",
      );
    } finally {
      setPending(false);
    }
  }

  const hasPhoto = Boolean(previewUrl);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="hidden"
        disabled={pending}
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={pending}
        aria-label={hasPhoto ? "Cambiar foto de perfil" : "Subir foto de perfil"}
        className={cn(
          "group relative size-20 shrink-0 rounded-full outline-none",
          "focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
          pending && "cursor-wait",
        )}
        onClick={() => inputRef.current?.click()}
      >
        <Avatar className="size-20 after:rounded-full">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Avatar" className="rounded-full" />
          ) : null}
          <AvatarFallback className="rounded-full bg-emerald-100 text-2xl font-bold text-emerald-800">
            {fallbackLabel}
          </AvatarFallback>
        </Avatar>

        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white",
            "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            pending && "opacity-100",
          )}
        >
          {pending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : hasPhoto ? (
            <Pencil className="size-4" aria-hidden />
          ) : (
            <Plus className="size-5" aria-hidden />
          )}
        </span>
      </button>

      {error ? (
        <Alert variant="destructive" className="w-full py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="w-full py-2">
          <AlertDescription className="text-emerald-700">
            Avatar actualizado.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
