/**
 * Image Service - Fetches representative food images from Unsplash
 * Uses client-side caching to minimize API calls
 */

// Unsplash API configuration
// For production, this should be moved to a serverless function to protect the API key
const UNSPLASH_ACCESS_KEY = (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY || '';

// In-memory cache for images (persisted to localStorage)
const IMAGE_CACHE_KEY = 'fityo_image_cache';
const CACHE_EXPIRY_DAYS = 7;

interface CachedImage {
  url: string;
  thumb: string;
  photographer: string;
  photographerUrl: string;
  cachedAt: number;
}

interface ImageCache {
  [key: string]: CachedImage;
}

// Load cache from localStorage
const loadCache = (): ImageCache => {
  try {
    const cached = localStorage.getItem(IMAGE_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Failed to load image cache:', e);
  }
  return {};
};

// Save cache to localStorage
const saveCache = (cache: ImageCache): void => {
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save image cache:', e);
  }
};

// Check if cache entry is expired
const isCacheExpired = (cachedAt: number): boolean => {
  const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - cachedAt > expiryMs;
};

// Normalize search query for better cache hits
const normalizeQuery = (query: string): string => {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3) // Take first 3 words
    .join(' ');
};

// Curated fallback images for common food categories (high-quality stock photos)
const FALLBACK_IMAGES: Record<string, CachedImage> = {
  'breakfast': {
    url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=100&q=60',
    photographer: 'Joseph Gonzalez',
    photographerUrl: 'https://unsplash.com/@miracletwentyone',
    cachedAt: Date.now()
  },
  'lunch': {
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=60',
    photographer: 'Lily Banse',
    photographerUrl: 'https://unsplash.com/@lvnatikk',
    cachedAt: Date.now()
  },
  'dinner': {
    url: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=100&q=60',
    photographer: 'Farhad Ibrahimzade',
    photographerUrl: 'https://unsplash.com/@ferhadd',
    cachedAt: Date.now()
  },
  'snack': {
    url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=100&q=60',
    photographer: 'Analia Baggiano',
    photographerUrl: 'https://unsplash.com/@abaggiano',
    cachedAt: Date.now()
  },
  'salad': {
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&q=60',
    photographer: 'Anna Pelzer',
    photographerUrl: 'https://unsplash.com/@annapelzer',
    cachedAt: Date.now()
  },
  'soup': {
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&q=60',
    photographer: 'Cala',
    photographerUrl: 'https://unsplash.com/@cala',
    cachedAt: Date.now()
  },
  'rice': {
    url: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=100&q=60',
    photographer: 'Pille R. Priske',
    photographerUrl: 'https://unsplash.com/@pillepriske',
    cachedAt: Date.now()
  },
  'plov': {
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100&q=60',
    photographer: 'Syed Muhammad',
    photographerUrl: 'https://unsplash.com/@syedmohdali121',
    cachedAt: Date.now()
  },
  'meat': {
    url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1558030006-450675393462?w=100&q=60',
    photographer: 'Emerson Vieira',
    photographerUrl: 'https://unsplash.com/@emersonphoto',
    cachedAt: Date.now()
  },
  'chicken': {
    url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=100&q=60',
    photographer: 'Atharva Tulsi',
    photographerUrl: 'https://unsplash.com/@atharvatulsi',
    cachedAt: Date.now()
  },
  'bread': {
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&q=60',
    photographer: 'Sergio Arze',
    photographerUrl: 'https://unsplash.com/@sergioarze',
    cachedAt: Date.now()
  },
  'non': {
    url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=100&q=60',
    photographer: 'Wesual Click',
    photographerUrl: 'https://unsplash.com/@wesual',
    cachedAt: Date.now()
  },
  'fruit': {
    url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100&q=60',
    photographer: 'Vanesa conunaese',
    photographerUrl: 'https://unsplash.com/@vanesa_conunaese',
    cachedAt: Date.now()
  },
  'egg': {
    url: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=100&q=60',
    photographer: 'Joseph Gonzalez',
    photographerUrl: 'https://unsplash.com/@miracletwentyone',
    cachedAt: Date.now()
  },
  'omelette': {
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=100&q=60',
    photographer: 'Brooke Lark',
    photographerUrl: 'https://unsplash.com/@brookelark',
    cachedAt: Date.now()
  },
  'kebab': {
    url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=100&q=60',
    photographer: 'Rauf Alvi',
    photographerUrl: 'https://unsplash.com/@raufalvi',
    cachedAt: Date.now()
  },
  'shashlik': {
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&q=60',
    photographer: 'Sander Dalhuisen',
    photographerUrl: 'https://unsplash.com/@sanderdalhuisen',
    cachedAt: Date.now()
  },
  'samsa': {
    // Authentic samosa/samsa baked pastry image
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=100&q=60',
    photographer: 'Unsplash',
    photographerUrl: 'https://unsplash.com',
    cachedAt: Date.now()
  },
  'somsa': {
    // Same as samsa (spelling variation)
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=100&q=60',
    photographer: 'Unsplash',
    photographerUrl: 'https://unsplash.com',
    cachedAt: Date.now()
  },
  'lagman': {
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&q=60',
    photographer: 'Cathy Pham',
    photographerUrl: 'https://unsplash.com/@cathypham',
    cachedAt: Date.now()
  },
  'manti': {
    url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=100&q=60',
    photographer: 'Markus Winkler',
    photographerUrl: 'https://unsplash.com/@markuswinkler',
    cachedAt: Date.now()
  },
  'pasta': {
    url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=100&q=60',
    photographer: 'Olayinka Babalola',
    photographerUrl: 'https://unsplash.com/@olayinka',
    cachedAt: Date.now()
  },
  'pizza': {
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&q=60',
    photographer: 'Chad Montano',
    photographerUrl: 'https://unsplash.com/@briewilly',
    cachedAt: Date.now()
  },
  'default': {
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    thumb: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&q=60',
    photographer: 'Lily Banse',
    photographerUrl: 'https://unsplash.com/@lvnatikk',
    cachedAt: Date.now()
  }
};

// Find best matching fallback category
const findFallbackCategory = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  const categories = Object.keys(FALLBACK_IMAGES);
  
  for (const cat of categories) {
    if (lowerQuery.includes(cat)) {
      return cat;
    }
  }
  
  // Check for common food keywords (multi-language support)
  if (lowerQuery.match(/egg|tuxum|яйц|omelet|scrambl/)) return 'egg';
  if (lowerQuery.match(/chicken|tovuq|курица|куриц/)) return 'chicken';
  if (lowerQuery.match(/salad|salat|салат/)) return 'salad';
  if (lowerQuery.match(/soup|sho\'rva|shorva|суп|шурпа/)) return 'soup';
  if (lowerQuery.match(/plov|palov|osh|плов|ош/)) return 'plov';
  if (lowerQuery.match(/rice|guruch|рис/)) return 'rice';
  if (lowerQuery.match(/bread|non|хлеб|лепеш/)) return 'non';
  if (lowerQuery.match(/meat|go\'sht|gusht|мясо/)) return 'meat';
  if (lowerQuery.match(/kebab|kabob|шашлык|кабоб/)) return 'kebab';
  if (lowerQuery.match(/shashlik|шашлик/)) return 'shashlik';
  if (lowerQuery.match(/s[ao]msa|самса|сомса/)) return 'samsa';  // Match both somsa and samsa
  if (lowerQuery.match(/lagman|лагман/)) return 'lagman';
  if (lowerQuery.match(/manti|манти/)) return 'manti';
  if (lowerQuery.match(/fruit|meva|фрукт|apple|olma|яблок|banana|banan|банан/)) return 'fruit';
  if (lowerQuery.match(/pasta|makaron|макарон/)) return 'pasta';
  if (lowerQuery.match(/pizza|пицца/)) return 'pizza';
  if (lowerQuery.match(/omelette|omlet|омлет/)) return 'omelette';
  
  return 'default';
};

// Foods that have poor Unsplash coverage - use curated images directly
const CURATED_FOODS = new Set([
  'samsa', 'somsa', 'plov', 'palov', 'osh', 'lagman', 'manti', 'shashlik', 
  'kebab', 'kabob', 'non', 'shorva', 'shurva', 'dimlama', 'chuchvara',
  'самса', 'сомса', 'плов', 'лагман', 'манти', 'шашлык', 'кабоб', 'шурпа'
]);

// Check if query matches a curated food (should skip Unsplash)
const shouldUseCuratedImage = (query: string): boolean => {
  const lower = query.toLowerCase();
  for (const food of CURATED_FOODS) {
    if (lower.includes(food)) return true;
  }
  return false;
};

/**
 * Search for a representative food image
 * Priority: 1) Cache 2) Curated Central Asian foods 3) Unsplash API 4) Fallback
 * @param query - Food name/label to search for
 * @param mealType - Optional meal type for fallback
 * @returns Image data with URL and attribution
 */
export const searchFoodImage = async (
  query: string,
  mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
): Promise<CachedImage> => {
  const normalizedQuery = normalizeQuery(query);
  const cache = loadCache();
  
  // Check cache first
  if (cache[normalizedQuery] && !isCacheExpired(cache[normalizedQuery].cachedAt)) {
    return cache[normalizedQuery];
  }
  
  // For Central Asian foods, use curated images directly (Unsplash has poor coverage)
  const fallbackCategory = findFallbackCategory(query);
  if (shouldUseCuratedImage(query) && FALLBACK_IMAGES[fallbackCategory]) {
    const curatedImage = { ...FALLBACK_IMAGES[fallbackCategory], cachedAt: Date.now() };
    cache[normalizedQuery] = curatedImage;
    saveCache(cache);
    return curatedImage;
  }
  
  // Try Unsplash API for other foods
  if (UNSPLASH_ACCESS_KEY && UNSPLASH_ACCESS_KEY.length > 10) {
    try {
      const searchQuery = `${query} food dish`;
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=squarish`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const photo = data.results[0];
          const imageData: CachedImage = {
            url: `${photo.urls.small}&w=400&q=80`,
            thumb: `${photo.urls.thumb}&w=100&q=60`,
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            cachedAt: Date.now()
          };
          
          // Save to cache
          cache[normalizedQuery] = imageData;
          saveCache(cache);
          
          return imageData;
        }
      }
    } catch (error) {
      console.warn('Unsplash API error:', error);
    }
  }
  
  // Fallback to curated images
  const finalCategory = mealType?.toLowerCase() || fallbackCategory;
  const fallbackImage = FALLBACK_IMAGES[finalCategory] || FALLBACK_IMAGES['default'];
  
  // Cache the fallback too
  cache[normalizedQuery] = { ...fallbackImage, cachedAt: Date.now() };
  saveCache(cache);
  
  return fallbackImage;
};

/**
 * Get image for a list of food items
 * Tries to find the most representative/main dish from the detected items
 * @param items - Array of food item names
 * @param mealType - Meal type for fallback
 * @returns Image data with professional stock photo
 */
export const getImageForMeal = async (
  items: string[],
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
): Promise<CachedImage> => {
  if (items.length === 0) {
    return searchFoodImage(mealType, mealType);
  }
  
  // Filter out generic/small items to find the main dish
  const skipWords = ['water', 'suv', 'вода', 'tea', 'choy', 'чай', 'coffee', 'kofe', 'кофе', 'salt', 'tuz', 'соль', 'sauce', 'sous'];
  const mainItems = items.filter(item => {
    const lower = item.toLowerCase();
    return !skipWords.some(skip => lower.includes(skip));
  });
  
  // Use the first main item, or fallback to first item if all are generic
  const searchTerm = mainItems.length > 0 ? mainItems[0] : items[0];
  
  // For Central Asian foods, just use the food name directly (no suffix)
  // For other foods, add "dish" for better Unsplash results
  if (shouldUseCuratedImage(searchTerm)) {
    return searchFoodImage(searchTerm, mealType);
  }
  
  // Add "food dish" suffix for better Unsplash results for international foods
  const enhancedSearch = `${searchTerm} food dish`;
  return searchFoodImage(enhancedSearch, mealType);
};

/**
 * Preload images for multiple food items (batch operation)
 */
export const preloadFoodImages = async (queries: string[]): Promise<void> => {
  const cache = loadCache();
  const uncached = queries.filter(q => {
    const normalized = normalizeQuery(q);
    return !cache[normalized] || isCacheExpired(cache[normalized].cachedAt);
  });
  
  // Load uncached images in parallel (limit to 3 concurrent)
  const chunks = [];
  for (let i = 0; i < uncached.length; i += 3) {
    chunks.push(uncached.slice(i, i + 3));
  }
  
  for (const chunk of chunks) {
    await Promise.all(chunk.map(q => searchFoodImage(q)));
  }
};

/**
 * Clear the image cache
 */
export const clearImageCache = (): void => {
  localStorage.removeItem(IMAGE_CACHE_KEY);
};

export type { CachedImage };
