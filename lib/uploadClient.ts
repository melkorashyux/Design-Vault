import type { VaultItem } from "@/lib/types";

const CONCURRENCY = 3;

export interface UploadTask {
  file: File;
  sourceUrl?: string;
}

export interface UploadCallbacks {
  onStart?: (task: UploadTask, index: number) => void;
  onDone?: (task: UploadTask, index: number, item: VaultItem) => void;
  onError?: (task: UploadTask, index: number, error: string) => void;
}

async function uploadOne(task: UploadTask): Promise<VaultItem> {
  const form = new FormData();
  form.append("file", task.file);
  if (task.sourceUrl) form.append("source_url", task.sourceUrl);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }
  const { item } = await res.json();
  return item as VaultItem;
}

/** Uploads + analyzes files with a small concurrency limit, reporting progress per item. */
export async function uploadFiles(tasks: UploadTask[], callbacks: UploadCallbacks = {}) {
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++;
      const task = tasks[index];
      callbacks.onStart?.(task, index);
      try {
        const item = await uploadOne(task);
        callbacks.onDone?.(task, index, item);
      } catch (err) {
        callbacks.onError?.(task, index, err instanceof Error ? err.message : "Upload failed");
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, () => worker());
  await Promise.all(workers);
}
