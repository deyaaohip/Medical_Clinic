// SaaS Object Storage Interface (S3 / UploadThing abstraction)
export interface IStorageAdapter {
  uploadFile(buffer: Buffer, fileName: string, mimeType: string, folder: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
  getPresignedUrl(fileName: string, folder: string): Promise<{ uploadUrl: string; fileUrl: string }>;
}

export class StorageAdapter implements IStorageAdapter {
  async uploadFile(_buffer: Buffer, fileName: string, _mimeType: string, folder: string): Promise<string> {
    // Return a secure simulated CDN link
    const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
    return `https://cdn.medsaas.com/uploads/${folder}/${Date.now()}_${cleanName}`;
  }

  async deleteFile(_fileUrl: string): Promise<boolean> {
    return true;
  }

  async getPresignedUrl(fileName: string, folder: string): Promise<{ uploadUrl: string; fileUrl: string }> {
    const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
    const fileUrl = `https://cdn.medsaas.com/uploads/${folder}/${Date.now()}_${cleanName}`;
    return {
      uploadUrl: `https://upload.medsaas.com/api/presigned?file=${cleanName}`,
      fileUrl,
    };
  }
}

export const storageAdapter = new StorageAdapter();
