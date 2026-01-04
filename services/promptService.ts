import { AppMode, DishInput, LayoutType } from '../types';
import { BASE_PROMPT, LAYOUT_DESCRIPTIONS, NEGATIVE_CONSTRAINTS } from '../constants';

export const buildPrompt = (
  mode: AppMode,
  layout: LayoutType,
  stylePrompt: string,
  dishes: DishInput[]
): string => {
  
  // 1. Build Dish Segment
  const dishDescriptions = dishes.map((d, index) => {
    // Use translated prompt if available, otherwise raw name + keywords
    const content = d.translatedPrompt || `${d.name}, ${d.keywords}`;
    const baseDesc = `Dish ${index + 1}: ${content}`;
    // Add visual enhancers
    return `${baseDesc}, appetizing texture, steam, glossy highlights, cinematic lighting, high detail`;
  }).join('; ');

  // 2. Build Text Instructions (New feature: Supplement text)
  let textInstructions = "";
  if (mode === AppMode.NANO_BANANA) {
      // For image generation, we WANT text
      const mainDish = dishes[0];
      textInstructions = `
      IMPORTANT: Render the following text clearly and elegantly on the poster:
      1. Main Title (Top): "${mainDish.name}" in a sophisticated calligraphy or serif font.
      2. Tagline (Bottom/Side): "${mainDish.slogan || 'Fresh & Premium'}" in a smaller modern font.
      3. Price Tag: "¥88" in a small badge.
      Ensure the text is legible, correctly spelled, and integrated into the composition.`;
  }

  // 3. Assemble Parts
  const parts = [
    BASE_PROMPT,
    LAYOUT_DESCRIPTIONS[layout],
    `Style: ${stylePrompt}`,
    `Subjects: ${dishDescriptions}`,
    // Only add negative text constraints if we are NOT in Nano Banana mode (Midjourney needs to be clean)
    // Or if it's Nano Banana, we add instructions to incorporate text instead of avoiding it.
    mode === AppMode.MIDJOURNEY ? NEGATIVE_CONSTRAINTS : textInstructions
  ];

  let finalPrompt = parts.join(', ');

  // 4. Add Suffix based on mode
  if (mode === AppMode.MIDJOURNEY) {
    finalPrompt += ' --ar 11:24';
  } else {
    // For Nano Banana
    finalPrompt += ', aspect ratio 11:24, high resolution, typographic poster'; 
  }

  return finalPrompt;
};