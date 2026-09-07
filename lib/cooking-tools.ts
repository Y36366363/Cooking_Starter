export type CookingPlanInput = {
  dish?: string;
  minutes?: number;
  servings?: number;
  preference?: string;
};

type CatalogRecipe = {
  id: string;
  zh: string;
  en: string;
  minutes: number;
  essential: string[];
  requiredSeasonings: string[];
  heat: string;
  safety: string;
};

const names: Record<string, { zh: string; en: string }> = {
  tomato: { zh: '西红柿', en: 'Tomato' },
  egg: { zh: '鸡蛋', en: 'Egg' },
  'green-pepper': { zh: '青椒', en: 'Green pepper' },
  'pork-mince': { zh: '猪肉末', en: 'Minced pork' },
  'pork-slice': { zh: '猪肉片', en: 'Sliced pork' },
  cucumber: { zh: '黄瓜', en: 'Cucumber' },
  'bok-choy': { zh: '小白菜', en: 'Bok choy' },
  rice: { zh: '米饭', en: 'Cooked rice' },
  broccoli: { zh: '西兰花', en: 'Broccoli' },
  potato: { zh: '土豆', en: 'Potato' },
  tofu: { zh: '豆腐', en: 'Tofu' },
  'chicken-wing': { zh: '鸡翅', en: 'Chicken wings' },
  oil: { zh: '食用油', en: 'Cooking oil' },
  salt: { zh: '盐', en: 'Salt' },
  'light-soy': { zh: '生抽', en: 'Light soy sauce' },
  vinegar: { zh: '米醋', en: 'Rice vinegar' },
  'chili-bean-paste': { zh: '豆瓣酱', en: 'Chili bean paste' },
  cola: { zh: '可乐', en: 'Cola' },
};

const catalog: CatalogRecipe[] = [
  { id: 'tomato-egg', zh: '西红柿炒鸡蛋', en: 'Tomato & Egg Stir-fry', minutes: 18, essential: ['tomato', 'egg'], requiredSeasonings: ['oil'], heat: '5 → 7 → 5', safety: '鸡蛋应炒至无流动蛋液。' },
  { id: 'pepper-mince', zh: '辣椒炒肉末', en: 'Pepper with Minced Pork', minutes: 18, essential: ['green-pepper', 'pork-mince'], requiredSeasonings: ['oil', 'light-soy'], heat: '6 → 8 → 5', safety: '猪肉末必须完全变色、无粉红。' },
  { id: 'pepper-pork', zh: '辣椒炒肉片', en: 'Pepper Pork Stir-fry', minutes: 25, essential: ['green-pepper', 'pork-slice'], requiredSeasonings: ['oil', 'light-soy'], heat: '6 → 8 → 5', safety: '猪肉片必须全熟、无粉红。' },
  { id: 'cucumber-mince', zh: '黄瓜炒肉末', en: 'Cucumber with Minced Pork', minutes: 16, essential: ['cucumber', 'pork-mince'], requiredSeasonings: ['oil', 'light-soy'], heat: '6 → 8 → 5', safety: '猪肉末必须完全变色、无粉红。' },
  { id: 'bok-choy', zh: '清炒小白菜', en: 'Garlic Bok Choy', minutes: 10, essential: ['bok-choy'], requiredSeasonings: ['oil', 'salt'], heat: '6 → 8 → 4', safety: '菜叶洗净后充分沥干，避免热油飞溅。' },
  { id: 'bok-choy-mince', zh: '小白菜炒肉末', en: 'Bok Choy with Minced Pork', minutes: 16, essential: ['bok-choy', 'pork-mince'], requiredSeasonings: ['oil', 'light-soy'], heat: '6 → 8 → 5', safety: '猪肉末必须完全变色、无粉红。' },
  { id: 'fried-egg', zh: '煎荷包蛋', en: 'Induction Fried Egg', minutes: 6, essential: ['egg'], requiredSeasonings: ['oil'], heat: '5 → 3', safety: '蛋白须完全凝固；想全熟时不要食用流心蛋黄。' },
  { id: 'egg-rice', zh: '鸡蛋炒饭', en: 'Egg Fried Rice', minutes: 12, essential: ['rice', 'egg'], requiredSeasonings: ['oil', 'salt'], heat: '6 → 8 → 6', safety: '米饭应彻底加热至冒热气。' },
  { id: 'broccoli', zh: '蒜蓉西兰花', en: 'Garlic Broccoli', minutes: 14, essential: ['broccoli'], requiredSeasonings: ['oil', 'salt'], heat: '5 → 7 → 5', safety: '西兰花洗净并加热至菜梗刚熟。' },
  { id: 'potato', zh: '酸辣土豆丝', en: 'Hot & Sour Potato Slivers', minutes: 20, essential: ['potato'], requiredSeasonings: ['oil', 'salt', 'vinegar'], heat: '6 → 8 → 6', safety: '切丝时注意刀具，入锅前沥干以防溅油。' },
  { id: 'mapo', zh: '家常麻婆豆腐', en: 'Easy Mapo Tofu', minutes: 22, essential: ['tofu', 'pork-mince'], requiredSeasonings: ['oil', 'chili-bean-paste'], heat: '5 → 7 → 4', safety: '猪肉末全熟；豆腐轻推，避免碎裂。' },
  { id: 'wings', zh: '可乐鸡翅', en: 'Cola Chicken Wings', minutes: 35, essential: ['chicken-wing'], requiredSeasonings: ['oil', 'cola', 'light-soy'], heat: '6 → 7 → 3 → 6', safety: '鸡翅必须完全解冻，最厚处达到 74°C。' },
];

function label(id: string, locale: 'zh' | 'en') {
  return names[id]?.[locale] || id;
}

function targetScore(recipe: CatalogRecipe, target: string) {
  const normalized = target.trim().toLowerCase();
  if (!normalized) return 0;
  const zh = recipe.zh.toLowerCase();
  const en = recipe.en.toLowerCase();
  if (normalized === zh || normalized === en) return 100;
  if (zh.includes(normalized) || en.includes(normalized)) return 80;
  return normalized
    .split(/[\s,，、/]+/)
    .filter(Boolean)
    .reduce((score, token) => score + Number(zh.includes(token) || en.includes(token)), 0);
}

export function retrieveCookingPlan(
  selectedIds: string[],
  plan: CookingPlanInput,
  locale: 'zh' | 'en',
) {
  const owned = new Set(selectedIds);
  const ranked = catalog
    .map((recipe) => {
      const missingIngredients = recipe.essential.filter((id) => !owned.has(id));
      const missingSeasonings = recipe.requiredSeasonings.filter(
        (id) => !owned.has(id),
      );
      return {
        recipe,
        match: targetScore(recipe, plan.dish || ''),
        missingIngredients,
        missingSeasonings,
        completeness: recipe.essential.length - missingIngredients.length,
      };
    })
    .sort(
      (a, b) =>
        b.match - a.match ||
        b.completeness - a.completeness ||
        a.missingSeasonings.length - b.missingSeasonings.length ||
        a.recipe.minutes - b.recipe.minutes,
    );
  const choice = ranked[0];
  const availableMinutes = Math.max(0, Math.min(240, Number(plan.minutes) || 0));
  const missing = [...choice.missingIngredients, ...choice.missingSeasonings];
  const timeFits = !availableMinutes || choice.recipe.minutes <= availableMinutes;
  const exactMatch = choice.match >= 80;
  const status =
    missing.length > 0
      ? 'missing_requirements'
      : !timeFits
        ? 'insufficient_time'
        : 'ready';
  const candidateLabel =
    locale === 'zh' ? choice.recipe.zh : choice.recipe.en;
  return {
    tool: 'recipe_catalog_and_pantry_check',
    targetMatched: exactMatch,
    candidate: { id: choice.recipe.id, name: candidateLabel },
    status,
    availableMinutes: availableMinutes || null,
    recipeMinutes: choice.recipe.minutes,
    servings: Math.max(1, Math.min(8, Number(plan.servings) || 1)),
    requiredIngredients: choice.recipe.essential.map((id) => label(id, locale)),
    requiredSeasonings: choice.recipe.requiredSeasonings.map((id) => label(id, locale)),
    missingIngredients: choice.missingIngredients.map((id) => label(id, locale)),
    missingSeasonings: choice.missingSeasonings.map((id) => label(id, locale)),
    inductionHeatRoute: choice.recipe.heat,
    safetyBaseline: choice.recipe.safety,
    alternatives: ranked.slice(1, 3).map((item) => ({
      name: locale === 'zh' ? item.recipe.zh : item.recipe.en,
      minutes: item.recipe.minutes,
      missing: [...item.missingIngredients, ...item.missingSeasonings].map((id) =>
        label(id, locale),
      ),
    })),
    readyAlternatives: ranked
      .filter(
        (item) =>
          item.recipe.id !== choice.recipe.id &&
          item.missingIngredients.length === 0 &&
          item.missingSeasonings.length === 0 &&
          (!availableMinutes || item.recipe.minutes <= availableMinutes),
      )
      .slice(0, 2)
      .map((item) => ({
        name: locale === 'zh' ? item.recipe.zh : item.recipe.en,
        minutes: item.recipe.minutes,
        heat: item.recipe.heat,
      })),
  };
}
