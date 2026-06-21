/**
 * Food Emoji Service - Maps food names to relevant emojis
 * Used for displaying food icons in meal logs
 */

// Food category to emoji mapping
const FOOD_EMOJIS: Record<string, string> = {
  // Bread & Bakery
  'bread': '🍞',
  'non': '🫓',
  'lepyoshka': '🫓',
  'toast': '🍞',
  'bun': '🍞',
  'roll': '🍞',
  'croissant': '🥐',
  'bagel': '🥯',
  'pretzel': '🥨',
  'flatbread': '🫓',
  'pita': '🫓',
  'naan': '🫓',
  
  // Pastries
  'samsa': '🥟',
  'somsa': '🥟',
  'samosa': '🥟',
  'pie': '🥧',
  'cake': '🍰',
  'cookie': '🍪',
  'donut': '🍩',
  'muffin': '🧁',
  'pastry': '🥐',
  
  // Rice & Grains
  'rice': '🍚',
  'plov': '🍛',
  'palov': '🍛',
  'osh': '🍛',
  'pilaf': '🍛',
  'biryani': '🍛',
  'risotto': '🍚',
  'oatmeal': '🥣',
  'porridge': '🥣',
  'cereal': '🥣',
  
  // Noodles & Pasta
  'pasta': '🍝',
  'spaghetti': '🍝',
  'noodle': '🍜',
  'lagman': '🍜',
  'ramen': '🍜',
  'udon': '🍜',
  'macaroni': '🍝',
  
  // Soups
  'soup': '🍲',
  'shorva': '🍲',
  'shurva': '🍲',
  'borscht': '🍲',
  'stew': '🍲',
  'broth': '🍲',
  
  // Meat
  'meat': '🥩',
  'beef': '🥩',
  'steak': '🥩',
  'lamb': '🍖',
  'pork': '🥓',
  'bacon': '🥓',
  'sausage': '🌭',
  'hotdog': '🌭',
  'ham': '🍖',
  
  // Poultry
  'chicken': '🍗',
  'tovuq': '🍗',
  'turkey': '🍗',
  'duck': '🍗',
  'wing': '🍗',
  'drumstick': '🍗',
  
  // Kebabs & Grilled
  'kebab': '🍢',
  'kabob': '🍢',
  'shashlik': '🍢',
  'skewer': '🍢',
  'grill': '🍖',
  'bbq': '🍖',
  
  // Dumplings
  'manti': '🥟',
  'dumpling': '🥟',
  'chuchvara': '🥟',
  'pelmeni': '🥟',
  'gyoza': '🥟',
  'wonton': '🥟',
  
  // Eggs
  'egg': '🍳',
  'tuxum': '🍳',
  'omelette': '🍳',
  'omlet': '🍳',
  'scrambled': '🍳',
  'fried egg': '🍳',
  'boiled egg': '🥚',
  
  // Fruits
  'fruit': '🍎',
  'apple': '🍎',
  'olma': '🍎',
  'banana': '🍌',
  'banan': '🍌',
  'orange': '🍊',
  'apelsin': '🍊',
  'grape': '🍇',
  'uzum': '🍇',
  'strawberry': '🍓',
  'watermelon': '🍉',
  'tarvuz': '🍉',
  'melon': '🍈',
  'qovun': '🍈',
  'peach': '🍑',
  'shaftoli': '🍑',
  'pear': '🍐',
  'nok': '🍐',
  'cherry': '🍒',
  'lemon': '🍋',
  'limon': '🍋',
  'mango': '🥭',
  'pineapple': '🍍',
  'coconut': '🥥',
  'kiwi': '🥝',
  'avocado': '🥑',
  
  // Vegetables
  'vegetable': '🥬',
  'salad': '🥗',
  'tomato': '🍅',
  'pomidor': '🍅',
  'carrot': '🥕',
  'sabzi': '🥕',
  'potato': '🥔',
  'kartoshka': '🥔',
  'corn': '🌽',
  'cucumber': '🥒',
  'bodring': '🥒',
  'pepper': '🫑',
  'broccoli': '🥦',
  'lettuce': '🥬',
  'cabbage': '🥬',
  'karam': '🥬',
  'onion': '🧅',
  'piyoz': '🧅',
  'garlic': '🧄',
  'sarimsoq': '🧄',
  'eggplant': '🍆',
  'baqlajon': '🍆',
  'mushroom': '🍄',
  
  // Dairy
  'milk': '🥛',
  'sut': '🥛',
  'cheese': '🧀',
  'pishloq': '🧀',
  'yogurt': '🥛',
  'qatiq': '🥛',
  'butter': '🧈',
  'cream': '🥛',
  'ice cream': '🍦',
  'muzqaymoq': '🍦',
  
  // Drinks
  'water': '💧',
  'suv': '💧',
  'tea': '🍵',
  'choy': '🍵',
  'coffee': '☕',
  'kofe': '☕',
  'juice': '🧃',
  'sharbat': '🧃',
  'soda': '🥤',
  'cola': '🥤',
  'smoothie': '🥤',
  'milkshake': '🥤',
  
  // Fast Food
  'pizza': '🍕',
  'burger': '🍔',
  'hamburger': '🍔',
  'sandwich': '🥪',
  'taco': '🌮',
  'burrito': '🌯',
  'fries': '🍟',
  'chips': '🍟',
  
  // Seafood
  'fish': '🐟',
  'baliq': '🐟',
  'salmon': '🍣',
  'sushi': '🍣',
  'shrimp': '🦐',
  'crab': '🦀',
  'lobster': '🦞',
  'oyster': '🦪',
  
  // Desserts & Sweets
  'candy': '🍬',
  'chocolate': '🍫',
  'shokolad': '🍫',
  'honey': '🍯',
  'asal': '🍯',
  'sugar': '🍬',
  'dessert': '🍮',
  'pudding': '🍮',
  'ice': '🧊',
  
  // Nuts & Snacks
  'nut': '🥜',
  'peanut': '🥜',
  'almond': '🌰',
  'walnut': '🌰',
  'cashew': '🌰',
  'pistachio': '🌰',
  'sunflower': '🌻',
  'popcorn': '🍿',
  
  // Meal Types (fallbacks)
  'breakfast': '🍳',
  'lunch': '🍱',
  'dinner': '🍽️',
  'snack': '🍪',
};

// Russian translations
const RUSSIAN_FOODS: Record<string, string> = {
  'хлеб': '🍞',
  'булка': '🍞',
  'батон': '🍞',
  'лепешка': '🫓',
  'плов': '🍛',
  'рис': '🍚',
  'каша': '🥣',
  'суп': '🍲',
  'борщ': '🍲',
  'щи': '🍲',
  'шурпа': '🍲',
  'мясо': '🥩',
  'говядина': '🥩',
  'баранина': '🍖',
  'свинина': '🥓',
  'курица': '🍗',
  'шашлык': '🍢',
  'кебаб': '🍢',
  'манты': '🥟',
  'пельмени': '🥟',
  'самса': '🥟',
  'яйцо': '🍳',
  'яичница': '🍳',
  'омлет': '🍳',
  'яблоко': '🍎',
  'банан': '🍌',
  'апельсин': '🍊',
  'виноград': '🍇',
  'арбуз': '🍉',
  'дыня': '🍈',
  'салат': '🥗',
  'помидор': '🍅',
  'огурец': '🥒',
  'картошка': '🥔',
  'морковь': '🥕',
  'капуста': '🥬',
  'лук': '🧅',
  'чеснок': '🧄',
  'молоко': '🥛',
  'сыр': '🧀',
  'йогурт': '🥛',
  'масло': '🧈',
  'вода': '💧',
  'чай': '🍵',
  'кофе': '☕',
  'сок': '🧃',
  'пицца': '🍕',
  'бургер': '🍔',
  'рыба': '🐟',
  'конфета': '🍬',
  'шоколад': '🍫',
  'мед': '🍯',
  'орех': '🥜',
  'лагман': '🍜',
  'макароны': '🍝',
};

/**
 * Get an emoji for a food item based on its name
 * @param foodName - Name of the food item
 * @returns Emoji string
 */
export const getFoodEmoji = (foodName: string): string => {
  const lower = foodName.toLowerCase().trim();
  
  // Check direct match first
  if (FOOD_EMOJIS[lower]) {
    return FOOD_EMOJIS[lower];
  }
  
  // Check Russian foods
  if (RUSSIAN_FOODS[lower]) {
    return RUSSIAN_FOODS[lower];
  }
  
  // Check if any key is contained in the food name
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (lower.includes(key)) {
      return emoji;
    }
  }
  
  // Check Russian foods as substrings
  for (const [key, emoji] of Object.entries(RUSSIAN_FOODS)) {
    if (lower.includes(key)) {
      return emoji;
    }
  }
  
  // Default food emoji
  return '🍽️';
};

/**
 * Get emoji for a meal based on its items
 * Uses the first/main item to determine the emoji
 * @param items - Array of food item names
 * @param mealType - Fallback meal type
 * @returns Emoji string
 */
export const getMealEmoji = (items: string[], mealType?: string): string => {
  if (items.length === 0) {
    return mealType ? (FOOD_EMOJIS[mealType.toLowerCase()] || '🍽️') : '🍽️';
  }
  
  // Try first item
  const firstEmoji = getFoodEmoji(items[0]);
  if (firstEmoji !== '🍽️') {
    return firstEmoji;
  }
  
  // Try other items
  for (const item of items.slice(1)) {
    const emoji = getFoodEmoji(item);
    if (emoji !== '🍽️') {
      return emoji;
    }
  }
  
  // Fallback to meal type or default
  return mealType ? (FOOD_EMOJIS[mealType.toLowerCase()] || '🍽️') : '🍽️';
};
