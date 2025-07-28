import { writable, get } from "svelte/store";
import { supabase } from "$lib/supabase";
import {
  setLoadingState,
  setDataError,
  setDataLoaded,
  shouldRefreshData,
  canLoadData,
} from "./data-manager";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  path: string;
  folder: string;
  uploaded_by: string;
  uploaded_at: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    description?: string;
    tags?: string[];
  };
}

interface FilesState {
  files: FileItem[];
  folders: string[];
  currentFolder: string;
  loading: boolean;
  uploading: boolean;
  error: string | null;
  selectedFiles: string[];
  searchQuery: string;
  viewMode: "grid" | "list";
}

const initialState: FilesState = {
  files: [],
  folders: ["/", "/modules", "/shared", "/user-uploads"],
  currentFolder: "/",
  loading: false,
  uploading: false,
  error: null,
  selectedFiles: [],
  searchQuery: "",
  viewMode: "grid",
};

export const filesStore = writable<FilesState>(initialState);

/**
 * Load files from the current folder
 */
export async function loadFiles(folder: string = "/", forceRefresh = false) {
  // Check if we should load data
  const loadCheck = get(canLoadData);
  if (!loadCheck.shouldLoad) {
    console.log(
      "⏸️ Skipping files load - auth not ready or user cannot manage"
    );
    return { files: [], error: "Not authorized or auth not ready" };
  }

  // Check if data is already loading
  const currentState = get(filesStore);
  if (currentState.loading) {
    console.log("⏸️ Files already loading, skipping...");
    return { files: currentState.files, error: null };
  }

  // Check if we need to refresh data
  if (
    !forceRefresh &&
    !shouldRefreshData("files") &&
    currentState.files.length > 0
  ) {
    console.log("⏸️ Files data is fresh, skipping load...");
    return { files: currentState.files, error: null };
  }

  console.log("🔄 Loading files from folder:", folder);
  setLoadingState("files", true);
  filesStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    // List files from Supabase Storage
    const { data: files, error: listError } = await supabase.storage
      .from("public")
      .list(folder === "/" ? "" : folder, {
        limit: 100,
        offset: 0,
      });

    if (listError) throw listError;

    // Get file URLs
    const fileItems: FileItem[] = [];

    for (const file of files || []) {
      if (!file.name.startsWith(".")) {
        const { data: urlData } = supabase.storage
          .from("public")
          .getPublicUrl(folder === "/" ? file.name : `${folder}/${file.name}`);

        fileItems.push({
          id: file.id || file.name,
          name: file.name,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || getFileType(file.name),
          url: urlData.publicUrl,
          path: folder === "/" ? file.name : `${folder}/${file.name}`,
          folder,
          uploaded_by: "system",
          uploaded_at:
            file.created_at || file.updated_at || new Date().toISOString(),
          metadata: file.metadata,
        });
      }
    }

    filesStore.update((state) => ({
      ...state,
      files: fileItems,
      currentFolder: folder,
      loading: false,
    }));

    setDataLoaded("files");
    console.log("✅ Files loaded successfully:", fileItems.length, "files");
    return { files: fileItems, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load files";
    console.error("❌ Error loading files:", errorMessage);
    filesStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    setDataError("files", errorMessage);
    return { files: [], error: errorMessage };
  }
}

/**
 * Upload files to a specific folder
 */
export async function uploadFiles(
  files: FileList,
  folder: string = "/",
  onProgress?: (progress: number) => void
) {
  filesStore.update((state) => ({ ...state, uploading: true, error: null }));

  try {
    const uploadedFiles: FileItem[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const fileName = generateUniqueFileName(file.name);
      const filePath =
        folder === "/" ? fileName : `${folder.replace(/^\//, "")}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("public")
        .upload(filePath, file, {
          upsert: false,
          cacheControl: "3600",
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("public")
        .getPublicUrl(filePath);

      const fileItem: FileItem = {
        id: data.path,
        name: fileName,
        size: file.size,
        type: file.type || getFileType(fileName),
        url: urlData.publicUrl,
        path: filePath,
        folder,
        uploaded_by: "current_user",
        uploaded_at: new Date().toISOString(),
        metadata: {
          description: "",
          tags: [],
        },
      };

      uploadedFiles.push(fileItem);

      // Report progress
      const progress = Math.round(((i + 1) / totalFiles) * 100);
      onProgress?.(progress);
    }

    // Update store with new files
    filesStore.update((state) => ({
      ...state,
      files: [...state.files, ...uploadedFiles],
      uploading: false,
    }));

    return { files: uploadedFiles, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload files";
    filesStore.update((state) => ({
      ...state,
      uploading: false,
      error: errorMessage,
    }));
    return { files: [], error: errorMessage };
  }
}

/**
 * Delete files
 */
export async function deleteFiles(filePaths: string[]) {
  try {
    const { error } = await supabase.storage.from("public").remove(filePaths);

    if (error) throw error;

    // Update store
    filesStore.update((state) => ({
      ...state,
      files: state.files.filter((f) => !filePaths.includes(f.path)),
      selectedFiles: [],
    }));

    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete files";
    filesStore.update((state) => ({ ...state, error: errorMessage }));
    return { error: errorMessage };
  }
}

/**
 * Create a new folder
 */
export async function createFolder(
  folderName: string,
  parentFolder: string = "/"
) {
  try {
    const folderPath =
      parentFolder === "/"
        ? folderName
        : `${parentFolder.replace(/^\//, "")}/${folderName}`;

    // Create folder by uploading a placeholder file
    const placeholderPath = `${folderPath}/.keep`;
    const { error } = await supabase.storage
      .from("public")
      .upload(placeholderPath, new Blob([""], { type: "text/plain" }), {
        upsert: false,
      });

    if (error) throw error;

    // Update folders list
    filesStore.update((state) => ({
      ...state,
      folders: [...state.folders, `/${folderPath}`].sort(),
    }));

    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create folder";
    filesStore.update((state) => ({ ...state, error: errorMessage }));
    return { error: errorMessage };
  }
}

/**
 * Rename a file
 */
export async function renameFile(oldPath: string, newName: string) {
  try {
    const pathParts = oldPath.split("/");
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join("/");

    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("public")
      .download(oldPath);

    if (downloadError) throw downloadError;

    // Upload with new name
    const { error: uploadError } = await supabase.storage
      .from("public")
      .upload(newPath, fileData, { upsert: false });

    if (uploadError) throw uploadError;

    // Delete old file
    const { error: deleteError } = await supabase.storage
      .from("public")
      .remove([oldPath]);

    if (deleteError) throw deleteError;

    // Update store
    filesStore.update((state) => ({
      ...state,
      files: state.files.map((f) =>
        f.path === oldPath ? { ...f, name: newName, path: newPath } : f
      ),
    }));

    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to rename file";
    filesStore.update((state) => ({ ...state, error: errorMessage }));
    return { error: errorMessage };
  }
}

/**
 * Move files to a different folder
 */
export async function moveFiles(filePaths: string[], targetFolder: string) {
  try {
    const movedFiles: FileItem[] = [];

    for (const filePath of filePaths) {
      // Download file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("public")
        .download(filePath);

      if (downloadError) throw downloadError;

      // Get file name
      const fileName = filePath.split("/").pop() || "";
      const newPath =
        targetFolder === "/"
          ? fileName
          : `${targetFolder.replace(/^\//, "")}/${fileName}`;

      // Upload to new location
      const { error: uploadError } = await supabase.storage
        .from("public")
        .upload(newPath, fileData, { upsert: false });

      if (uploadError) throw uploadError;

      // Delete from old location
      const { error: deleteError } = await supabase.storage
        .from("public")
        .remove([filePath]);

      if (deleteError) throw deleteError;
    }

    // Reload files
    await loadFiles();

    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to move files";
    filesStore.update((state) => ({ ...state, error: errorMessage }));
    return { error: errorMessage };
  }
}

/**
 * Search files
 */
export function searchFiles(query: string) {
  filesStore.update((state) => ({ ...state, searchQuery: query }));
}

/**
 * Select/deselect files
 */
export function toggleFileSelection(fileId: string) {
  filesStore.update((state) => ({
    ...state,
    selectedFiles: state.selectedFiles.includes(fileId)
      ? state.selectedFiles.filter((id) => id !== fileId)
      : [...state.selectedFiles, fileId],
  }));
}

export function selectAllFiles() {
  filesStore.update((state) => ({
    ...state,
    selectedFiles: state.files.map((f) => f.id),
  }));
}

export function clearSelection() {
  filesStore.update((state) => ({
    ...state,
    selectedFiles: [],
  }));
}

/**
 * Change view mode
 */
export function setViewMode(mode: "grid" | "list") {
  filesStore.update((state) => ({ ...state, viewMode: mode }));
}

/**
 * Clear errors
 */
export function clearFilesError() {
  filesStore.update((state) => ({ ...state, error: null }));
}

/**
 * Helper functions
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");

  return `${nameWithoutExt}-${timestamp}-${random}.${extension}`;
}

function getFileType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const imageTypes = ["jpg", "jpeg", "png", "gif", "svg", "webp"];
  const videoTypes = ["mp4", "avi", "mov", "wmv", "flv", "webm"];
  const audioTypes = ["mp3", "wav", "flac", "aac", "ogg"];
  const documentTypes = ["pdf", "doc", "docx", "txt", "rtf", "odt"];
  const spreadsheetTypes = ["xls", "xlsx", "csv", "ods"];
  const presentationTypes = ["ppt", "pptx", "odp"];
  const archiveTypes = ["zip", "rar", "7z", "tar", "gz"];

  if (imageTypes.includes(extension)) return "image";
  if (videoTypes.includes(extension)) return "video";
  if (audioTypes.includes(extension)) return "audio";
  if (documentTypes.includes(extension)) return "document";
  if (spreadsheetTypes.includes(extension)) return "spreadsheet";
  if (presentationTypes.includes(extension)) return "presentation";
  if (archiveTypes.includes(extension)) return "archive";

  return "file";
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get file icon based on type
 */
export function getFileIcon(type: string) {
  const icons = {
    image: "🖼️",
    video: "🎥",
    audio: "🎵",
    document: "📄",
    spreadsheet: "📊",
    presentation: "📽️",
    archive: "📦",
    folder: "📁",
    file: "📄",
  };

  return icons[type as keyof typeof icons] || icons.file;
}
