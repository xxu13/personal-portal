import api from './api';

export interface UploadResponse {
  url: string;
  filename: string;
}

export const uploadService = {
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteImage(url: string): Promise<void> {
    // Extract path from URL: /uploads/images/2024/01/filename.jpg
    const match = url.match(/\/uploads\/images\/(\d+)\/(\d+)\/(.+)$/);
    if (!match) {
      throw new Error('Invalid image URL');
    }
    const [, year, month, filename] = match;
    await api.delete(`/uploads/image/${year}/${month}/${filename}`);
  },
};

export default uploadService;


