/**
 * AI Tool Store - Manages AI tool modal state and settings.
 */
import { create } from 'zustand';
import { Editor } from '@tiptap/react';

// ============================================================
// Types
// ============================================================

export type AIMode = 'text2image' | 'chat';

export interface AIModalOptions {
  /** Initial mode to display */
  mode?: AIMode;
  /** Editor reference for inserting images */
  editorRef?: Editor | null;
  /** Callback when an image is selected for insertion */
  onImageSelect?: (url: string) => void;
}

interface AIState {
  // Modal state
  isModalOpen: boolean;
  mode: AIMode;
  
  // Editor integration
  editorRef: Editor | null;
  onImageSelect: ((url: string) => void) | null;
  
  // Chat state
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  
  // Actions
  openModal: (options?: AIModalOptions) => void;
  closeModal: () => void;
  setMode: (mode: AIMode) => void;
  setEditorRef: (editor: Editor | null) => void;
  setOnImageSelect: (callback: ((url: string) => void) | null) => void;
  
  // Chat actions
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  updateLastAssistantMessage: (content: string) => void;
  clearChatHistory: () => void;
}

// ============================================================
// Store
// ============================================================

export const useAIStore = create<AIState>()((set, get) => ({
  // Initial state
  isModalOpen: false,
  mode: 'text2image',
  editorRef: null,
  onImageSelect: null,
  chatHistory: [],
  
  // Open modal with optional configuration
  openModal: (options?: AIModalOptions) => {
    set({
      isModalOpen: true,
      mode: options?.mode || get().mode,
      editorRef: options?.editorRef ?? get().editorRef,
      onImageSelect: options?.onImageSelect ?? get().onImageSelect,
    });
  },
  
  // Close modal and reset editor integration
  closeModal: () => {
    set({
      isModalOpen: false,
      editorRef: null,
      onImageSelect: null,
    });
  },
  
  // Switch mode
  setMode: (mode: AIMode) => {
    set({ mode });
  },
  
  // Set editor reference
  setEditorRef: (editor: Editor | null) => {
    set({ editorRef: editor });
  },
  
  // Set image select callback
  setOnImageSelect: (callback: ((url: string) => void) | null) => {
    set({ onImageSelect: callback });
  },
  
  // Add a message to chat history
  addChatMessage: (role: 'user' | 'assistant', content: string) => {
    set(state => ({
      chatHistory: [...state.chatHistory, { role, content }],
    }));
  },
  
  // Update the last assistant message (for streaming)
  updateLastAssistantMessage: (content: string) => {
    set(state => {
      const history = [...state.chatHistory];
      const lastIndex = history.length - 1;
      
      if (lastIndex >= 0 && history[lastIndex].role === 'assistant') {
        history[lastIndex] = { ...history[lastIndex], content };
      } else {
        // If last message is not assistant, add new one
        history.push({ role: 'assistant', content });
      }
      
      return { chatHistory: history };
    });
  },
  
  // Clear chat history
  clearChatHistory: () => {
    set({ chatHistory: [] });
  },
}));

// ============================================================
// Selector Hooks
// ============================================================

export const useAIModalOpen = () => useAIStore(state => state.isModalOpen);
export const useAIMode = () => useAIStore(state => state.mode);
export const useAIChatHistory = () => useAIStore(state => state.chatHistory);

// ============================================================
// Actions (for use outside React components)
// ============================================================

export const openAIModal = (options?: AIModalOptions) => {
  useAIStore.getState().openModal(options);
};

export const closeAIModal = () => {
  useAIStore.getState().closeModal();
};

export const setAIMode = (mode: AIMode) => {
  useAIStore.getState().setMode(mode);
};

