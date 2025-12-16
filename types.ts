export interface NiktoResponse {
  IsTask: boolean;
  TaskName: string; // Used for the answer text if IsTask is false
  Deadline?: string;
  Priority?: 'High' | 'Medium' | 'Low';
  Assignee?: string;
  Description?: string;
  Tags?: string[];
  DocumentTitle?: string; // If a document was requested
  DocumentContent?: string; // The full content of the document
  TransactionData?: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description: string;
  };
}

export interface TaskItem extends NiktoResponse {
  id: string;
  createdAt: number;
  notified?: boolean;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface Transaction {
  id: string;
  date: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string; // Display text
  rawJson?: NiktoResponse; // If it was a processed request
  type: 'text' | 'image' | 'audio' | 'task_card' | 'document_card' | 'transaction_card';
  imageUrl?: string;
  groundingUrls?: Array<{uri: string, title: string}>;
}

export enum GeminiModel {
  MANAGER = 'gemini-3-pro-preview', // For logic, reasoning, JSON parsing
  FAST = 'gemini-2.5-flash-lite', // For quick UI interactions
  SEARCH = 'gemini-2.5-flash', // For search grounding
  IMAGE_GEN = 'gemini-3-pro-image-preview', // High quality generation
  IMAGE_EDIT = 'gemini-2.5-flash-image', // Editing
  AUDIO = 'gemini-2.5-flash', // Transcription
}

export interface ImageGenOptions {
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  size: "1K" | "2K" | "4K";
}