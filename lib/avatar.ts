export const AVATAR_BUCKET = "avatars" as const;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MAX_DIMENSION = 512;
export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const AVATAR_ACCEPT = AVATAR_ALLOWED_MIME_TYPES.join(",");

export function avatarStoragePath(userId: string) {
  return `${userId}/avatar.webp`;
}

export function validateAvatarFile(file: File): string | null {
  if (
    !AVATAR_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return "Formato no válido. Usá JPG, PNG o WebP.";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return "La imagen no puede superar 2 MB.";
  }

  return null;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo procesar la imagen."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

export async function prepareAvatarBlob(file: File): Promise<Blob> {
  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    AVATAR_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("No se pudo procesar la imagen.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > AVATAR_MAX_BYTES && quality > 0.5) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > AVATAR_MAX_BYTES) {
    throw new Error("La imagen es demasiado grande. Probá con otra más chica.");
  }

  return blob;
}
