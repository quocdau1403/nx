"use client";

import { useRef, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { upload as uploadToBlob } from "@vercel/blob/client";
import { deletePhoto, reorderPhotos, setCover } from "@/app/actions/admin";
import { PhotoImg } from "@/components/gallery/photo-img";
import type { PhotoView } from "@/lib/photo-urls";

type Props = { albumId: string; initialPhotos: PhotoView[]; initialCoverId: string | null };

export function AlbumManager({ albumId, initialPhotos, initialCoverId }: Props) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [coverId, setCoverId] = useState(initialCoverId);
  const [status, setStatus] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Nhấn giữ để kéo trên màn hình cảm ứng, vuốt bình thường vẫn cuộn trang.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function run(task: () => Promise<void>, success: string) {
    startTransition(async () => {
      try {
        await task();
        setStatus(success);
      } catch {
        setStatus("Thao tác thất bại – vui lòng tải lại trang.");
      }
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = photos.findIndex((p) => p.id === active.id);
    const to = photos.findIndex((p) => p.id === over.id);
    const next = arrayMove(photos, from, to);
    setPhotos(next);
    run(() => reorderPhotos(albumId, next.map((p) => p.id)), "Đã lưu thứ tự.");
  }

  function remove(id: string) {
    if (!confirm("Xoá ảnh này?")) return;
    setPhotos((ps) => ps.filter((p) => p.id !== id));
    if (coverId === id) setCoverId(null);
    run(() => deletePhoto(id), "Đã xoá ảnh.");
  }

  function makeCover(id: string) {
    setCoverId(id);
    run(() => setCover(albumId, id), "Đã đặt ảnh cover.");
  }

  return (
    <section className="mt-12">
      <Uploader albumId={albumId} onUploaded={(p) => setPhotos((ps) => [...ps, p])} />

      <div className="mt-12 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
        <h2 className="label text-muted">{photos.length} ảnh · kéo thả để sắp xếp</h2>
        {status && (
          <p role="status" className="text-xs text-gold">
            {status}
          </p>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo, i) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                index={i}
                isCover={photo.id === coverId}
                onRemove={() => remove(photo.id)}
                onCover={() => makeCover(photo.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

type SortablePhotoProps = {
  photo: PhotoView;
  index: number;
  isCover: boolean;
  onRemove: () => void;
  onCover: () => void;
};

function SortablePhoto({ photo, index, isCover, onRemove, onCover }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative aspect-square overflow-hidden bg-surface ${isDragging ? "z-10 opacity-80 ring-1 ring-gold" : ""}`}
    >
      <div {...attributes} {...listeners} aria-label={`Ảnh ${index + 1}, kéo để sắp xếp`} className="h-full w-full cursor-grab active:cursor-grabbing">
        <PhotoImg photo={photo} sizes="(min-width: 1024px) 20vw, 50vw" draggable={false} className="pointer-events-none h-full w-full object-cover" />
      </div>
      <span className="label pointer-events-none absolute top-2 left-2 bg-paper/85 px-2 py-1">{index + 1}</span>
      {isCover && <span className="label pointer-events-none absolute top-2 right-2 bg-gold px-2 py-1 text-paper">Cover</span>}
      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-linear-to-t from-paper/95 p-2 transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100">
        <button type="button" onClick={onCover} className="label cursor-pointer p-1 hover:text-gold">
          Đặt cover
        </button>
        <button type="button" onClick={onRemove} className="label cursor-pointer p-1 text-red-700 hover:text-red-800">
          Xoá
        </button>
      </div>
    </li>
  );
}

type Progress = { done: number; total: number; errors: string[] };

function Uploader({ albumId, onUploaded }: { albumId: string; onUploaded: (photo: PhotoView) => void }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = progress !== null && progress.done < progress.total;

  // Tải tuần tự từng ảnh để hiển thị tiến độ. Ảnh gốc đi thẳng từ trình duyệt lên Vercel Blob
  // (không bị giới hạn 4.5 MB/request của Vercel), sau đó server tải về để tối ưu.
  async function upload(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length || uploading) return;

    const errors: string[] = [];
    setProgress({ done: 0, total: images.length, errors });

    for (const [i, file] of images.entries()) {
      try {
        if (file.size > 40 * 1024 * 1024) throw new Error("vượt quá 40MB");
        const blob = await uploadToBlob(`uploads/${albumId}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/uploads",
          contentType: file.type,
          multipart: file.size > 8 * 1024 * 1024,
        });
        const res = await fetch(`/api/admin/albums/${albumId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: blob.url, name: file.name }),
        });
        const json: { photos?: PhotoView[]; errors?: string[]; error?: string } = await res.json();
        json.photos?.forEach(onUploaded);
        if (json.errors?.length) errors.push(...json.errors);
        else if (!res.ok) errors.push(`${file.name}: ${json.error ?? "lỗi máy chủ"}`);
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error && error.message ? error.message : "mất kết nối"}`);
      }
      setProgress({ done: i + 1, total: images.length, errors: [...errors] });
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        upload([...e.dataTransfer.files]);
      }}
      className={`border border-dashed px-6 py-12 text-center transition-colors ${dragOver ? "border-gold bg-gold/5" : "border-line"}`}
    >
      <p className="font-display text-2xl md:text-3xl">Kéo thả ảnh vào đây</p>
      <p className="mt-3 text-sm text-muted">JPG, PNG, WebP, AVIF, TIFF · tối đa 40MB/ảnh · tự động tối ưu nhiều kích cỡ</p>
      <label className="label mt-8 inline-block cursor-pointer border border-line px-6 py-3 transition-colors hover:border-gold hover:text-gold has-disabled:cursor-wait has-disabled:opacity-50">
        Chọn ảnh từ máy
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
          multiple
          disabled={uploading}
          className="sr-only"
          onChange={(e) => upload([...(e.target.files ?? [])])}
        />
      </label>

      {progress && (
        <div className="mx-auto mt-8 max-w-sm" aria-live="polite">
          <p className="label text-muted">
            Đã tải {progress.done}/{progress.total}
          </p>
          <div className="mt-3 h-px bg-line">
            <div className="h-px bg-gold transition-[width] duration-500" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          {progress.errors.map((err) => (
            <p key={err} className="mt-2 text-xs text-red-700">
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
