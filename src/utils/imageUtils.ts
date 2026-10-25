export const CATEGORY_IMAGE_PRESETS: Record<string, string> = {
  'Original Paintings & Artworks':
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
  'Fine Art & Prints':
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
  'Paints and Colours':
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  'Brushes and Painting Tools':
    'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=800&q=80',
  'Canvas and Surfaces':
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
  'Sketchbooks and Paper':
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  'Drawing and Sketching Tools':
    'https://images.unsplash.com/photo-1585336261024-64ed7d013cd1?auto=format&fit=crop&w=800&q=80',
  'Craft Supplies':
    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
  'Other Art Materials':
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
};

export const DEFAULT_ART_IMAGE =
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80';

export function getCategoryFallbackImage(category?: string): string {
  if (!category) return DEFAULT_ART_IMAGE;
  return CATEGORY_IMAGE_PRESETS[category] || DEFAULT_ART_IMAGE;
}

export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
): void {
  const target = event.currentTarget;
  const fallback = getCategoryFallbackImage(category);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
