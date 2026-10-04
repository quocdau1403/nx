"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { db } from "@/lib/db";
import { syncFacebookCategory, type SyncResult } from "@/lib/facebook";
import type { FormState } from "@/lib/form-state";
import { removePhotoFiles } from "@/lib/photos";
import { uniqueAlbumSlug } from "@/lib/slug";

function readAlbumForm(form: FormData) {
  const title = String(form.get("title") ?? "").trim();
  const category = String(form.get("category") ?? "");
  const description = String(form.get("description") ?? "").trim() || null;
  if (!title || title.length > 120) return { error: "Tên album cần 1–120 ký tự." };
  if (!getCategory(category)) return { error: "Hạng mục không hợp lệ." };
  return { title, category, description };
}

export async function createAlbum(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const data = readAlbumForm(form);
  if ("error" in data) return data;

  const album = await db.album.create({
    data: { ...data, slug: await uniqueAlbumSlug(data.category, data.title) },
  });
  redirect(`/admin/albums/${album.id}`);
}

export async function updateAlbum(albumId: string, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const data = readAlbumForm(form);
  if ("error" in data) return data;

  await db.album.update({
    where: { id: albumId },
    data: { ...data, slug: await uniqueAlbumSlug(data.category, data.title, albumId) },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteAlbum(albumId: string) {
  await requireAdmin();
  const photos = await db.photo.findMany({ where: { albumId }, select: { id: true } });
  await db.album.delete({ where: { id: albumId } });
  await removePhotoFiles(photos.map((p) => p.id));
  redirect("/admin");
}

export async function reorderPhotos(albumId: string, ids: string[]) {
  await requireAdmin();
  const photos = await db.photo.findMany({ where: { albumId }, select: { id: true } });
  const existing = new Set(photos.map((p) => p.id));
  if (!Array.isArray(ids) || ids.length !== existing.size || !ids.every((id) => existing.has(id))) {
    throw new Error("Danh sách ảnh không khớp với album.");
  }
  await db.$transaction(ids.map((id, position) => db.photo.update({ where: { id }, data: { position } })));
}

export async function deletePhoto(photoId: string) {
  await requireAdmin();
  const photo = await db.photo.findUnique({ where: { id: photoId }, select: { albumId: true } });
  if (!photo) return;
  await db.$transaction([
    db.photo.delete({ where: { id: photoId } }),
    db.album.updateMany({ where: { id: photo.albumId, coverPhotoId: photoId }, data: { coverPhotoId: null } }),
  ]);
  await removePhotoFiles([photoId]);
}

export async function setCover(albumId: string, photoId: string) {
  await requireAdmin();
  const photo = await db.photo.findFirst({ where: { id: photoId, albumId }, select: { id: true } });
  if (!photo) throw new Error("Ảnh không thuộc album.");
  await db.album.update({ where: { id: albumId }, data: { coverPhotoId: photoId } });
}

export async function syncFacebook(
  slug: string,
): Promise<{ ok: true; result: SyncResult } | { ok: false; error: string }> {
  await requireAdmin();
  const category = getCategory(slug);
  if (!category) return { ok: false, error: "Hạng mục không hợp lệ." };
  try {
    const result = await syncFacebookCategory(category);
    revalidatePath("/admin");
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Đồng bộ thất bại." };
  }
}
