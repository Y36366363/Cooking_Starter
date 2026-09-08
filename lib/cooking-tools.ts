import catalogData from '@/data/cooking-catalog.json';

export type CookingPlanInput = {
  dish?: string;
  minutes?: number;
  servings?: number;
  preference?: string;
};

type CatalogRecipe = (typeof catalogData.recipes)[number];

function label(id: string, locale: 'zh' | 'en') {
  return catalogData.names[id as keyof typeof catalogData.names]?.[locale] || id;
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
  const ranked = catalogData.recipes
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
  const status =
    missing.length > 0
      ? 'missing_requirements'
      : !timeFits
        ? 'insufficient_time'
        : 'ready';
  return {
    tool: 'recipe_catalog_and_pantry_check',
    targetMatched: choice.match >= 80,
    candidate: { id: choice.recipe.id, name: choice.recipe[locale] },
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
      name: item.recipe[locale],
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
        name: item.recipe[locale],
        minutes: item.recipe.minutes,
        heat: item.recipe.heat,
      })),
  };
}
