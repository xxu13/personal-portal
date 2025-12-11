/**
 * AI Service for text-to-image generation and chat completion.
 */
import api, { getToken } from './api';

// ============================================================
// Types
// ============================================================

export type ImageSize = '1024*1024' | '720*1280' | '1280*720';

export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface Text2ImageRequest {
  prompt: string;
  negative_prompt?: string;
  size?: ImageSize;
  n?: number; // 1-4
}

export interface Text2ImageTaskResponse {
  task_id: string;
  status: TaskStatus;
}

export interface Text2ImageResult {
  url: string;
}

export interface Text2ImageStatusResponse {
  task_id: string;
  status: TaskStatus;
  results?: Text2ImageResult[];
  message?: string;
}

export interface SaveImageRequest {
  url: string;
}

export interface SaveImageResponse {
  url: string;
  filename: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  content: string;
  usage?: Record<string, unknown>;
}

// ============================================================
// Image Size Options (for UI)
// ============================================================

export const IMAGE_SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: '1024*1024', label: '1024×1024 (正方形)' },
  { value: '720*1280', label: '720×1280 (竖版)' },
  { value: '1280*720', label: '1280×720 (横版)' },
];

export const IMAGE_COUNT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1 张' },
  { value: 2, label: '2 张' },
  { value: 3, label: '3 张' },
];

// ============================================================
// AI Service
// ============================================================

export const aiService = {
  /**
   * Submit a text-to-image generation task.
   * Returns task_id for polling.
   */
  async submitText2Image(data: Text2ImageRequest): Promise<Text2ImageTaskResponse> {
    const response = await api.post<Text2ImageTaskResponse>('/ai/text2image', data);
    return response.data;
  },

  /**
   * Query the status of a text-to-image task.
   */
  async getTaskStatus(taskId: string): Promise<Text2ImageStatusResponse> {
    const response = await api.get<Text2ImageStatusResponse>(`/ai/text2image/${taskId}`);
    return response.data;
  },

  /**
   * Poll task status until completion or failure.
   * @param taskId - The task ID to poll
   * @param onProgress - Optional callback for status updates
   * @param interval - Polling interval in ms (default: 2000)
   * @param maxAttempts - Maximum polling attempts (default: 60)
   */
  async pollTaskUntilComplete(
    taskId: string,
    onProgress?: (status: TaskStatus) => void,
    interval = 2000,
    maxAttempts = 60
  ): Promise<Text2ImageStatusResponse> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getTaskStatus(taskId);
      
      if (onProgress) {
        onProgress(status.status);
      }
      
      if (status.status === 'SUCCEEDED' || status.status === 'FAILED') {
        return status;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    
    throw new Error('Task polling timeout');
  },

  /**
   * Save a generated image to the server.
   * Downloads the image from URL and stores it locally.
   */
  async saveImage(url: string): Promise<SaveImageResponse> {
    const response = await api.post<SaveImageResponse>('/ai/text2image/save', { url });
    return response.data;
  },

  /**
   * Start a streaming chat session.
   * Returns an EventSource for receiving SSE messages.
   * 
   * @param data - Chat request data
   * @param onMessage - Callback for each message chunk
   * @param onError - Callback for errors
   * @param onComplete - Callback when stream completes
   */
  chatStream(
    data: ChatRequest,
    onMessage: (content: string) => void,
    onError?: (error: string) => void,
    onComplete?: () => void
  ): AbortController {
    const controller = new AbortController();
    const token = getToken();
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    
    // Build headers - only include Authorization if token exists
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use fetch with streaming for SSE
    fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }
        
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            if (onComplete) onComplete();
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const content = line.slice(6);
              
              if (content === '[DONE]') {
                if (onComplete) onComplete();
                return;
              }
              
              if (content.startsWith('[ERROR]')) {
                if (onError) onError(content.slice(8));
                return;
              }
              
              onMessage(content);
            }
          }
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          if (onError) onError(error.message);
        }
      });
    
    return controller;
  },

  /**
   * Non-streaming chat completion.
   */
  async chat(data: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/ai/chat/sync', data);
    return response.data;
  },
};

export default aiService;

