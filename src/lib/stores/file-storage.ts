import { writable } from "svelte/store";
import { supabase } from "$lib/supabase";

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface FileStorageState {
  uploads: Record<string, UploadProgress>;
  loading: boolean;
  error: string | null;
}

const initialState: FileStorageState = {
  uploads: {},
  loading: false,
  error: null,
};

export const fileStorageStore = writable<FileStorageState>(initialState);

// Storage bucket names
export const STORAGE_BUCKETS = {
  CONTENT_MEDIA: "content-media",
  USER_UPLOADS: "user-uploads",
  PROFILE_IMAGES: "profile-images",
} as const;

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path?: string,
  onProgress?: (progress: number) => void
): Promise<{
  data: { path: string; publicUrl?: string } | null;
  error: Error | null;
}> {
  const fileName = file.name;
  const filePath = path ? `${path}/${fileName}` : fileName;
  const uploadId = `${bucket}-${filePath}-${Date.now()}`;

  // Update store with upload start
  fileStorageStore.update((state) => ({
    ...state,
    uploads: {
      ...state.uploads,
      [uploadId]: {
        fileName,
        progress: 0,
        status: "uploading",
      },
    },
    loading: true,
    error: null,
  }));

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL if the bucket allows it
    let publicUrl: string | undefined;
    try {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      publicUrl = urlData.publicUrl;
    } catch (urlError) {
      // Public URL might not be available for all buckets
    }

    // Update store with success
    fileStorageStore.update((state) => ({
      ...state,
      uploads: {
        ...state.uploads,
        [uploadId]: {
          fileName,
          progress: 100,
          status: "completed",
        },
      },
      loading: Object.values(state.uploads).some(
        (u) => u.status === "uploading"
      ),
      error: null,
    }));

    return {
      data: { path: data.path, publicUrl },
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Upload failed";

    // Update store with error
    fileStorageStore.update((state) => ({
      ...state,
      uploads: {
        ...state.uploads,
        [uploadId]: {
          fileName,
          progress: 0,
          status: "error",
          error: errorMessage,
        },
      },
      loading: Object.values(state.uploads).some(
        (u) => u.status === "uploading"
      ),
      error: errorMessage,
    }));

    return {
      data: null,
      error: error instanceof Error ? error : new Error(errorMessage),
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  bucket: string,
  path?: string
): Promise<
  Array<{
    file: File;
    result: {
      data: { path: string; publicUrl?: string } | null;
      error: Error | null;
    };
  }>
> {
  const results = await Promise.all(
    files.map(async (file) => ({
      file,
      result: await uploadFile(file, bucket, path),
    }))
  );

  return results;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Delete failed";
    return { error: new Error(errorMessage) };
  }
}

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  bucket: string,
  folder?: string
): Promise<{
  data: Array<{
    name: string;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string;
    metadata: any;
  }> | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "List failed";
    return { data: null, error: new Error(errorMessage) };
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn = 3600
): Promise<{
  data: { signedUrl: string } | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Signed URL failed";
    return { data: null, error: new Error(errorMessage) };
  }
}

/**
 * Clear upload history from store
 */
export function clearUploadHistory() {
  fileStorageStore.update((state) => ({
    ...state,
    uploads: {},
    error: null,
  }));
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size too large. Maximum ${(maxSize / 1024 / 1024).toFixed(
        1
      )}MB allowed.`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0) {
    const isValidType = allowedTypes.some((type) => {
      if (type.includes("/*")) {
        return file.type.startsWith(type.split("/")[0]);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(
          ", "
        )}`,
      };
    }
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(
          ", "
        )}`,
      };
    }
  }

  return { valid: true };
}
