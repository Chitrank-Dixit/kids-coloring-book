export interface GeneratedImage {
  id: string;
  data: string; // base64
  type: 'cover' | 'page';
  prompt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum ImageSize {
  Size1K = '1K',
  Size2K = '2K',
  Size4K = '4K',
}

export enum AppState {
  API_KEY_SELECTION,
  INPUT,
  GENERATING,
  PREVIEW,
}
