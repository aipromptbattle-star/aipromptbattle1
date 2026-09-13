import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

export interface UploadResult {
  downloadUrl: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
}

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function uploadCreativeAsset(
  eventId: string,
  teamId: string,
  roundId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return reject(new Error("File exceeds 10MB maximum size limit."));
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return reject(new Error("Invalid file type. Only PNG, JPEG, WEBP, and SVG images are allowed."));
    }

    // Sanitize filename and create deterministic unique path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniquePrefix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const storagePath = `events/${eventId}/teams/${teamId}/rounds/${roundId}/${uniquePrefix}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        eventId,
        teamId,
        roundId,
        originalName: file.name,
      },
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) {
          onProgress(percent);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            fileName: file.name,
            sizeBytes: file.size,
            contentType: file.type,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}
