export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
  url: string; // data URL for display
  thumbnail?: string; // base64 encoded thumbnail for images
}

export interface AttachmentPreview {
  id: string;
  name: string;
  type: string;
  size: number;
  thumbnail?: string;
}

// Supported file types
export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
export const SUPPORTED_CODE_TYPES = ['text/javascript', 'text/typescript', 'text/python', 'text/html', 'text/css', 'text/json', 'text/xml'];
export const SUPPORTED_FILE_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOCUMENT_TYPES, ...SUPPORTED_CODE_TYPES];

// File size limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB for images

export function validateFileType(file: File): boolean {
  return SUPPORTED_FILE_TYPES.includes(file.type);
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export function isImageFile(file: File): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(file.type);
}

export function getFileIcon(type: string): string {
  if (SUPPORTED_IMAGE_TYPES.includes(type)) return '🖼️';
  if (SUPPORTED_DOCUMENT_TYPES.includes(type)) return '📄';
  if (SUPPORTED_CODE_TYPES.includes(type)) return '💻';
  return '📎';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function compressImage(file: File, maxSizeKB: number = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const maxDimension = 1920; // Max width or height

      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      let quality = 0.8;
      const compress = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = (dataUrl.length * 0.75) / 1024; // Approximate size
        
        if (sizeKB <= maxSizeKB || quality <= 0.1) {
          resolve(dataUrl);
        } else {
          quality -= 0.1;
          compress();
        }
      };
      
      compress();
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function generateThumbnail(file: File, size: number = 150): Promise<string> {
  if (!isImageFile(file)) {
    return '';
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate thumbnail dimensions maintaining aspect ratio
      let { width, height } = img;
      const maxSize = size;

      if (width > height) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw thumbnail
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.onerror = () => reject(new Error('Failed to generate thumbnail'));
    img.src = URL.createObjectURL(file);
  });
}

export async function processFile(file: File): Promise<FileAttachment> {
  if (!validateFileType(file)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  if (!validateFileSize(file)) {
    throw new Error(`File too large: ${formatFileSize(file.size)}. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
  }

  const id = Math.random().toString(36).substr(2, 9);
  let data: string;
  let thumbnail: string | undefined;

  if (isImageFile(file)) {
    // Compress images
    data = await compressImage(file);
    thumbnail = await generateThumbnail(file);
  } else {
    // Convert other files to base64
    data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    data,
    url: data, // Use the same data for URL
    thumbnail
  };
}

export async function processFiles(files: FileList): Promise<FileAttachment[]> {
  const processedFiles: FileAttachment[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const processedFile = await processFile(files[i]);
      processedFiles.push(processedFile);
    } catch (error) {
      console.error(`Failed to process file ${files[i].name}:`, error);
      // Continue processing other files
    }
  }
  
  return processedFiles;
}

export function createAttachmentPreview(attachment: FileAttachment): AttachmentPreview {
  return {
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    thumbnail: attachment.thumbnail
  };
}

export function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      resolve(text);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
