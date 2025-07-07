import { firebaseStorage } from "@renderer/firebase";
import HTTP from "./http_service";
import { generateDownloadBytes } from "../../utils/file_utils";
import { AxiosResponse } from "axios";

export default class FirebaseStorageService {
  // File Upload API
  static async upload({
    name,
    data,
    type,
    onProgress
  }: {
    name: string;
    data: ArrayBuffer | Blob | Uint8Array;
    type?: string;
    onProgress?: (progress: number) => void;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadTask = firebaseStorage.ref(name).put(data, { contentType: type });
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        (error) => {
          console.error(error);
          reject(error);
        },
        async () => {
          const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
          resolve(downloadUrl);
        }
      );
    });
  }
  static async uploadString({
    name,
    data,
    type,
    onProgress
  }: {
    name: string;
    data: string;
    type?: string;
    onProgress?: (progress: number) => void;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadTask = firebaseStorage.ref(name).putString(data);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        (error) => {
          console.error(error);
          reject(error);
        },
        async () => {
          const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
          resolve(downloadUrl);
        }
      );
    });
  }

  static async download({
    refPath,
    onProgress
  }: {
    refPath: string;
    onProgress?: (progress: number) => void;
  }): Promise<AxiosResponse> {
    const downloadUrl = await firebaseStorage.ref(refPath).getDownloadURL();

    const downloadFile = await HTTP.download({
      downloadUrl: downloadUrl,
      onProgress: (progress) => onProgress?.(progress)
    });
    return downloadFile;
  }
}
