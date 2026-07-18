import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const compressImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If not an image, just read as standard base64
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Target max size to fit comfortably under Firestore's 1MB limit (e.g. 800px max dimension)
        const MAX_DIM = 800;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress quality to 0.7 to minimize bytes size while preserving sharp visuals
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const uploadFileWithFallback = async (
  file: File,
  storagePath: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; provider: 'firebase' | 'base64' }> => {
  try {
    // First, attempt standard Firebase Storage Upload
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const downloadUrl = await new Promise<string>((resolve, reject) => {
      // Set a strict timeout so we don't hang indefinitely on retry-limit-exceeded
      const timeoutId = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error("Firebase Storage request timed out. Activating local Base64 fallback."));
      }, 7000); // 7 seconds timeout

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn("Firebase Storage Upload Error, falling back to Base64:", error);
          reject(error);
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });

    return { url: downloadUrl, provider: 'firebase' };
  } catch (err: any) {
    console.warn("Firebase Storage failed or timed out. Using secure database-driven Base64 fallback.", err);
    
    // Fallback: compress file and convert to Base64
    if (onProgress) onProgress(30);
    const base64Url = await compressImageToBase64(file);
    if (onProgress) onProgress(100);
    
    return { url: base64Url, provider: 'base64' };
  }
};
