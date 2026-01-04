export enum AppMode {
  MIDJOURNEY = 'midjourney',
  NANO_BANANA = 'nano_banana'
}

export enum LayoutType {
  LAYOUT_1 = 'layout_1', // Center 1 dish
  LAYOUT_2 = 'layout_2', // Right side 1 dish
  LAYOUT_3 = 'layout_3', // 2 dishes symmetric
  LAYOUT_4 = 'layout_4'  // 6 dishes matrix
}

export interface DishInput {
  id: string;
  name: string; // Chinese or English
  keywords: string; // spicy, crispy, etc.
  tag?: string; // cuisine type
  slogan?: string; // Short marketing text for the poster
  translatedPrompt?: string; // To store the AI processed english description
}

export interface StyleOption {
  id: string;
  name: string;
  promptSegment: string;
}

export interface GeneratedItem {
  id: string;
  timestamp: number;
  mode: AppMode;
  layout: LayoutType;
  styleName: string;
  fullPrompt: string;
  imageUrl?: string; // Base64 data URI for Nano Banana results
  dishes: DishInput[];
  status: 'pending' | 'success' | 'failed';
}

export interface GenerationConfig {
  resolution: 'standard' | 'hd';
  variations: 1 | 2 | 4;
  negativeSafety: boolean;
}