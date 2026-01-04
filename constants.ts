import { LayoutType, StyleOption } from './types';

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'modern_minimal',
    name: 'Modern Minimal Studio (现代极简)',
    promptSegment: 'Modern minimal studio photography, soft neutral background, high-end commercial food styling, clean lighting, elegant atmosphere'
  },
  {
    id: 'jiangnan_garden',
    name: 'Jiangnan Garden Premium (江南园林)',
    promptSegment: 'Jiangnan garden mood, traditional Chinese aesthetics, premium tea house vibe, poetic soft lighting, elegant porcelain textures, subtle mist'
  },
  {
    id: 'retro_travel',
    name: 'Retro Travel Poster (复古海报)',
    promptSegment: 'Retro travel poster style, vintage textured paper effect, bold simplified shapes, nostalgic color palette, lithograph print texture'
  },
  {
    id: 'night_market',
    name: 'Night Market Neon (夜市霓虹)',
    promptSegment: 'Cyberpunk night market vibe, neon signage reflections, dramatic contrast, steam and smoke, vibrant appetizing colors, street food culture'
  },
  {
    id: 'luxury_black_gold',
    name: 'Luxury Black Gold (黑金奢华)',
    promptSegment: 'Luxury black and gold theme, premium fine dining, dark moody background with gold accents, dramatic rim lighting, sophisticated atmosphere'
  },
  {
    id: 'soft_illustration',
    name: 'Soft Illustration Cute (插画可爱)',
    promptSegment: 'Soft warm illustration style, cute and family-friendly, pastel colors, gentle brushstrokes, cozy appetizing feeling'
  }
];

export const LAYOUT_DESCRIPTIONS: Record<LayoutType, string> = {
  [LayoutType.LAYOUT_1]: 'Layout structure: Single large central composition. Top corners reserved for headlines. One large circular dish image placed centrally slightly top. Bottom area clear for secondary text. Bottom-right reserved for CTA block.',
  [LayoutType.LAYOUT_2]: 'Layout structure: Asymmetric split. Left narrow column reserved for vertical text. Right wide area features one large circular dish image fully contained on the right side. Bottom-right reserved for CTA block.',
  [LayoutType.LAYOUT_3]: 'Layout structure: Symmetrical dual composition. Two equal-sized circular dish images aligned horizontally in the middle. Top areas reserved for headlines. Bottom areas reserved for descriptions. Bottom-right reserved for CTA block.',
  [LayoutType.LAYOUT_4]: 'Layout structure: Matrix grid of six. Two vertical columns of three circular dishes each. Uniform spacing. Small blank label areas next to each circle. Bottom-right reserved for CTA block.'
};

export const BASE_PROMPT = 'vertical digital food poster, full-bleed edge-to-edge borderless, premium food advertising, strong hierarchy, clean grid layout';

export const NEGATIVE_CONSTRAINTS = 'borderless, no frame, no margin, no poster border, reserved blank headline areas, reserved blank info block, no readable text, no logos, no watermark, no QR codes';
