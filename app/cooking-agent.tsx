'use client';

import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ArrowDown,
  Check,
  ChefHat,
  ChevronDown,
  ChevronRight,
  Clock3,
  Flame,
  Globe2,
  Lightbulb,
  MessageSquarePlus,
  Plus,
  Search,
  Send,
  Star,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type Lang = 'zh' | 'en';
type Category = 'vegetable' | 'protein' | 'staple' | 'other';
type PantryItem = {
  id: string;
  zh: string;
  en: string;
  category: Category;
  aliases?: string[];
};
type Seasoning = {
  zh: string;
  en: string;
  required: boolean;
  amountZh: string;
  amountEn: string;
};
type RecipeStep = {
  titleZh: string;
  titleEn: string;
  textZh: string;
  textEn: string;
  level?: number;
};
type Recipe = {
  id: string;
  zh: string;
  en: string;
  difficulty: number;
  minutes: number;
  heat: string;
  imageIndex: number;
  tested?: boolean;
  essential: string[];
  optional: string[];
  seasonings: Seasoning[];
  descZh: string;
  descEn: string;
  steps: RecipeStep[];
};
type WebMcpContext = {
  registerTool: (
    tool: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};
declare global {
  interface Document {
    modelContext?: WebMcpContext;
  }
}

const pantryItems: PantryItem[] = [
  ['tomato', '西红柿', 'Tomato', 'vegetable', ['番茄']],
  ['bok-choy', '小白菜', 'Bok choy', 'vegetable', ['青菜']],
  ['napa', '大白菜', 'Napa cabbage', 'vegetable'],
  ['cabbage', '卷心菜', 'Cabbage', 'vegetable', ['包菜', '圆白菜']],
  ['spinach', '菠菜', 'Spinach', 'vegetable'],
  ['lettuce', '生菜', 'Lettuce', 'vegetable'],
  ['choy-sum', '菜心', 'Choy sum', 'vegetable'],
  ['gai-lan', '芥蓝', 'Chinese broccoli', 'vegetable'],
  ['broccoli', '西兰花', 'Broccoli', 'vegetable'],
  ['cauliflower', '菜花', 'Cauliflower', 'vegetable', ['花椰菜']],
  ['cucumber', '黄瓜', 'Cucumber', 'vegetable'],
  ['eggplant', '茄子', 'Eggplant', 'vegetable'],
  ['potato', '土豆', 'Potato', 'vegetable', ['马铃薯']],
  ['sweet-potato', '红薯', 'Sweet potato', 'vegetable'],
  ['carrot', '胡萝卜', 'Carrot', 'vegetable'],
  ['radish', '白萝卜', 'Daikon', 'vegetable'],
  ['lotus', '莲藕', 'Lotus root', 'vegetable'],
  ['winter-melon', '冬瓜', 'Winter melon', 'vegetable'],
  ['pumpkin', '南瓜', 'Pumpkin', 'vegetable'],
  ['zucchini', '西葫芦', 'Zucchini', 'vegetable'],
  ['green-pepper', '青椒', 'Green pepper', 'vegetable', ['辣椒', 'pepper']],
  ['red-pepper', '红椒', 'Red pepper', 'vegetable'],
  ['chili', '小米椒', 'Fresh chili', 'vegetable'],
  ['green-bean', '四季豆', 'Green beans', 'vegetable'],
  ['long-bean', '豆角', 'Long beans', 'vegetable'],
  ['snow-pea', '荷兰豆', 'Snow peas', 'vegetable'],
  ['pea', '豌豆', 'Peas', 'vegetable'],
  ['corn', '玉米', 'Corn', 'vegetable'],
  ['celery', '芹菜', 'Celery', 'vegetable'],
  ['onion', '洋葱', 'Onion', 'vegetable'],
  ['scallion', '小葱', 'Scallion', 'vegetable', ['葱', 'green onion']],
  ['garlic', '大蒜', 'Garlic', 'vegetable', ['蒜']],
  ['ginger', '生姜', 'Ginger', 'vegetable', ['姜']],
  ['leek', '韭菜', 'Chinese chives', 'vegetable'],
  ['cilantro', '香菜', 'Cilantro', 'vegetable', ['coriander']],
  ['mushroom', '香菇', 'Shiitake', 'vegetable'],
  ['oyster-mushroom', '平菇', 'Oyster mushroom', 'vegetable'],
  ['enoki', '金针菇', 'Enoki', 'vegetable'],
  ['wood-ear', '木耳', 'Wood ear', 'vegetable'],
  ['sprout', '豆芽', 'Bean sprouts', 'vegetable'],
  ['egg', '鸡蛋', 'Egg', 'protein', ['eggs']],
  ['pork-mince', '猪肉末', 'Minced pork', 'protein', ['肉末', 'ground pork']],
  ['pork-slice', '猪肉片', 'Sliced pork', 'protein'],
  ['pork-belly', '五花肉', 'Pork belly', 'protein'],
  ['rib', '排骨', 'Pork ribs', 'protein'],
  ['chicken-breast', '鸡胸肉', 'Chicken breast', 'protein'],
  ['chicken-thigh', '鸡腿肉', 'Chicken thigh', 'protein'],
  ['chicken-wing', '鸡翅', 'Chicken wings', 'protein'],
  ['beef', '牛肉片', 'Sliced beef', 'protein'],
  ['shrimp', '虾仁', 'Shrimp', 'protein'],
  ['fish', '鱼片', 'Fish fillet', 'protein'],
  ['tofu', '豆腐', 'Tofu', 'protein'],
  ['firm-tofu', '老豆腐', 'Firm tofu', 'protein'],
  ['ham', '火腿', 'Ham', 'protein'],
  ['rice', '米饭', 'Cooked rice', 'staple'],
  ['noodle', '面条', 'Noodles', 'staple'],
  ['rice-noodle', '米粉', 'Rice noodles', 'staple'],
  ['dumpling', '饺子', 'Dumplings', 'staple'],
  ['flour', '面粉', 'Flour', 'staple'],
  ['milk', '牛奶', 'Milk', 'other'],
  ['seaweed', '紫菜', 'Dried seaweed', 'other'],
  ['pickle', '榨菜', 'Pickled mustard', 'other'],
].map(
  ([id, zh, en, category, aliases]) =>
    ({ id, zh, en, category, aliases }) as PantryItem,
);
const S = (
  zh: string,
  en: string,
  required: boolean,
  amountZh: string,
  amountEn: string,
): Seasoning => ({ zh, en, required, amountZh, amountEn });
const P = (
  titleZh: string,
  titleEn: string,
  textZh: string,
  textEn: string,
  level?: number,
): RecipeStep => ({ titleZh, titleEn, textZh, textEn, level });
const basic = (
  id: string,
  zh: string,
  en: string,
  imageIndex: number,
  essential: string[],
  optional: string[],
  seasonings: Seasoning[],
  descZh: string,
  descEn: string,
  steps: RecipeStep[],
  difficulty = 1,
  minutes = 15,
  heat = '6档 → 8档 → 5档',
  tested = false,
): Recipe => ({
  id,
  zh,
  en,
  imageIndex,
  essential,
  optional,
  seasonings,
  descZh,
  descEn,
  steps,
  difficulty,
  minutes,
  heat,
  tested,
});

const recipes: Recipe[] = [
  basic(
    'tomato-egg',
    '西红柿炒鸡蛋',
    'Tomato & Egg Stir-fry',
    0,
    ['tomato', 'egg'],
    ['scallion'],
    [
      S(
        '食用油',
        'Cooking oil',
        true,
        '铺满锅底薄薄一层',
        'Thin layer covering pan',
      ),
      S('盐', 'Salt', false, '少量，推荐', 'Small pinch, recommended'),
      S('糖', 'Sugar', false, '1/2–1 茶匙，推荐', '1/2–1 tsp, recommended'),
      S(
        '番茄酱',
        'Ketchup',
        false,
        '约 1 茶匙，推荐',
        'About 1 tsp, recommended',
      ),
    ],
    '一人份：2–3 个鸡蛋配 1 个中等番茄。看食材状态，再按档位操作。',
    'One serving: 2–3 eggs and one medium tomato. Watch the food, then adjust levels.',
    [
      P(
        '备鸡蛋',
        'Prepare eggs',
        '将 2–3 个鸡蛋打入碗中，用筷子充分搅匀。可以加入少量盐，再搅拌至蛋清和蛋黄完全融合。',
        'Beat 2–3 eggs thoroughly. Optionally add a small pinch of salt and mix again.',
      ),
      P(
        '切番茄',
        'Cut tomato',
        '将番茄放稳，平着切去蒂头附近一小片。切成两半；每一半竖切两刀、再横切一刀，中等番茄约得到 8 块。番茄与蛋液分碗备用。',
        'Slice off a thin piece around the stem. Halve it; make two lengthwise cuts and one crosswise cut per half for about 8 chunks. Keep separate from egg.',
      ),
      P(
        '热锅加油',
        'Preheat and oil',
        '空锅开 5 档约 40 秒。加油并转锅，锅底应有完整薄油层，不能还有大片干锅。油流动顺滑、微微发亮即可下蛋，不必等冒烟。',
        'Preheat at level 5 for 40 seconds. Add enough oil for a complete thin film. Add egg when oil shimmers; do not wait for smoke.',
        5,
      ),
      P(
        '炒鸡蛋',
        'Cook eggs',
        '调到 7 档，倒入蛋液。底部开始凝固后从外向内轻推、翻面；持续翻炒但不要猛烈，保留较大的嫩蛋块。八九成熟、表面略湿时盛出。',
        'Set level 7. Once the base sets, gently push inward and turn. Keep large tender curds; remove while slightly glossy.',
        7,
      ),
      P(
        '炒番茄',
        'Cook tomato',
        '保持 5 档，下番茄。加少量糖和番茄酱，翻炒约 1 分钟；再加 1–2 汤匙水，炒到番茄变软、汁水融合。',
        'At level 5 add tomato, a little sugar and ketchup. Cook 1 minute; add 1–2 tbsp water and cook until softened.',
        5,
      ),
      P(
        '合炒出锅',
        'Combine and serve',
        '倒回鸡蛋，5 档混合翻炒 30–60 秒。关机后用余温再翻几下；尝味后按需补一点盐，立即出锅。',
        'Return eggs and toss at level 5 for 30–60 seconds. Switch off, toss with residual heat, taste and add salt only if needed.',
        5,
      ),
    ],
    1,
    18,
    '5档 → 7档 → 5档',
    true,
  ),
  basic(
    'pepper-mince',
    '辣椒炒肉末',
    'Pepper with Minced Pork',
    1,
    ['green-pepper', 'pork-mince'],
    ['garlic', 'scallion'],
    [
      S('食用油', 'Cooking oil', true, '1 汤匙', '1 tbsp'),
      S('生抽', 'Light soy sauce', true, '1 茶匙', '1 tsp'),
      S('盐', 'Salt', false, '少量', 'A pinch'),
      S('料酒', 'Shaoxing wine', false, '1 茶匙', '1 tsp'),
    ],
    '肉末先炒散，辣椒后下，适合单灶电磁炉。',
    'Brown mince first and add pepper later.',
    [
      P(
        '备菜',
        'Prepare',
        '青椒去蒂去籽切小丁；蒜切末。肉末若很湿，先用厨房纸吸干。',
        'Deseed and dice pepper; mince garlic. Pat wet pork dry.',
      ),
      P(
        '炒肉末',
        'Brown pork',
        '6 档热锅 45 秒后加油，调 8 档，肉末分散下锅；静置 20 秒再划散，炒到不再粉红。',
        'Preheat at 6, add oil, then brown pork at 8 until no longer pink.',
        8,
      ),
      P(
        '调味',
        'Season',
        '转 6 档，加蒜、料酒和生抽翻匀约 20 秒。',
        'At 6 add garlic, wine and soy; toss 20 seconds.',
        6,
      ),
      P(
        '下辣椒',
        'Add pepper',
        '转 5 档，下青椒炒 2–3 分钟，至颜色变亮且刚断生。尝味后决定是否补盐。',
        'At 5 cook pepper 2–3 minutes until bright and just tender. Taste before salting.',
        5,
      ),
    ],
    2,
    18,
    '6档 → 8档 → 5档',
    true,
  ),
  basic(
    'pepper-pork',
    '辣椒炒肉片',
    'Pepper Pork Stir-fry',
    2,
    ['green-pepper', 'pork-slice'],
    ['ginger', 'garlic'],
    [
      S('食用油', 'Cooking oil', true, '1–1.5 汤匙', '1–1.5 tbsp'),
      S('生抽', 'Light soy sauce', true, '2 茶匙', '2 tsp'),
      S('淀粉', 'Cornstarch', false, '1 茶匙，推荐', '1 tsp, recommended'),
    ],
    '薄切和短时腌制让肉片保持嫩滑。',
    'Thin slices and a short marinade keep pork tender.',
    [
      P(
        '腌肉',
        'Marinate',
        '肉片尽量切薄，加 1 茶匙生抽和淀粉抓匀，静置 10 分钟。',
        'Mix thin pork slices with soy and starch; rest 10 minutes.',
      ),
      P(
        '切椒',
        'Cut pepper',
        '青椒去蒂去籽，切成与肉片接近的大小。',
        'Deseed and cut pepper to match pork size.',
      ),
      P(
        '滑炒',
        'Sear pork',
        '6 档热锅加油，调 8 档摊开肉片，炒到八成熟后先盛出。',
        'Preheat at 6, add oil; sear pork at 8 until almost done, then remove.',
        8,
      ),
      P(
        '合炒',
        'Finish',
        '5 档炒香姜蒜和青椒约 2 分钟，肉片回锅，加剩余生抽，翻匀至全熟。',
        'Cook aromatics and pepper at 5 for 2 minutes. Return pork and cook through.',
        5,
      ),
    ],
    2,
    25,
    '6档 → 8档 → 5档',
    true,
  ),
  basic(
    'cucumber-mince',
    '黄瓜炒肉末',
    'Cucumber with Minced Pork',
    3,
    ['cucumber', 'pork-mince'],
    ['garlic'],
    [
      S('食用油', 'Cooking oil', true, '1 汤匙', '1 tbsp'),
      S('生抽', 'Light soy sauce', true, '1 茶匙', '1 tsp'),
      S('盐', 'Salt', false, '少量', 'A pinch'),
      S('香醋', 'Rice vinegar', false, '几滴', 'A few drops'),
    ],
    '黄瓜最后下锅，只炒一小会，保留清脆口感。',
    'Add cucumber last and cook briefly for crunch.',
    [
      P(
        '备菜',
        'Prepare',
        '黄瓜纵切四条，去掉过多软籽瓤，切 1.5 厘米小块；蒜切末。',
        'Quarter cucumber, remove excess soft seeds and cut into 1.5 cm pieces.',
      ),
      P(
        '炒肉',
        'Brown pork',
        '6 档热锅加油，8 档炒散肉末，直到不再粉红并出现少量焦边。',
        'Preheat at 6, then brown pork at 8.',
        8,
      ),
      P(
        '调味',
        'Season',
        '转 5 档，加蒜和生抽炒 20 秒。',
        'At 5 add garlic and soy for 20 seconds.',
        5,
      ),
      P(
        '下黄瓜',
        'Add cucumber',
        '调 7 档，下黄瓜快速翻炒 60–90 秒。尝味加盐；喜欢清爽味可关火前滴几滴醋。',
        'At 7 toss cucumber for 60–90 seconds. Taste, salt, and optionally add vinegar.',
        7,
      ),
    ],
    2,
    16,
    '6档 → 8档 → 5档',
    true,
  ),
  basic(
    'bok-choy',
    '清炒小白菜',
    'Garlic Bok Choy',
    4,
    ['bok-choy'],
    ['garlic'],
    [
      S('食用油', 'Cooking oil', true, '1 汤匙', '1 tbsp'),
      S('盐', 'Salt', true, '约 1/4 茶匙', 'About 1/4 tsp'),
      S('鸡精', 'Chicken bouillon', false, '一小撮', 'Tiny pinch'),
    ],
    '擦干菜叶、菜梗先下、短时快炒，是不出水的关键。',
    'Dry leaves, stems first, and a short hot stir-fry prevent wateriness.',
    [
      P(
        '洗净沥干',
        'Wash and dry',
        '小白菜掰开洗净，充分沥水；较大的菜梗与菜叶切开。',
        'Wash and thoroughly dry; separate large stems and leaves.',
      ),
      P(
        '爆香',
        'Bloom garlic',
        '6 档热锅 40 秒，加油后放蒜，转 4 档炒 10 秒，不要炒黑。',
        'Preheat at 6, add oil and garlic; lower to 4 for 10 seconds.',
        4,
      ),
      P(
        '先炒菜梗',
        'Cook stems',
        '调 8 档，先下菜梗翻炒约 45 秒。',
        'At 8 stir-fry stems for about 45 seconds.',
        8,
      ),
      P(
        '再下菜叶',
        'Add leaves',
        '加入菜叶和盐，炒 45–75 秒，刚变软但仍鲜亮时关火。',
        'Add leaves and salt; cook 45–75 seconds until just wilted.',
        8,
      ),
    ],
    1,
    10,
    '6档 → 8档 → 4档',
    true,
  ),
  basic(
    'bok-choy-mince',
    '小白菜炒肉末',
    'Bok Choy with Minced Pork',
    5,
    ['bok-choy', 'pork-mince'],
    ['garlic'],
    [
      S('食用油', 'Cooking oil', true, '1 汤匙', '1 tbsp'),
      S('生抽', 'Light soy sauce', true, '1 茶匙', '1 tsp'),
      S('盐', 'Salt', false, '少量', 'A pinch'),
    ],
    '先荤后素，一锅完成蛋白质和蔬菜。',
    'Meat first keeps the greens bright.',
    [
      P(
        '备菜',
        'Prepare',
        '小白菜洗净沥干，菜梗和菜叶分开；蒜切末。',
        'Dry bok choy; separate stems and leaves.',
      ),
      P(
        '炒肉',
        'Brown pork',
        '6 档热锅加油，8 档炒熟肉末；油太多时舀出一部分。',
        'Preheat at 6, brown pork at 8; spoon out excess fat.',
        8,
      ),
      P(
        '炒菜梗',
        'Cook stems',
        '转 5 档，加蒜和生抽，再下菜梗炒约 1 分钟。',
        'At 5 add garlic, soy and stems for 1 minute.',
        5,
      ),
      P(
        '合炒',
        'Finish',
        '调 7 档，下菜叶炒 45–60 秒，尝味加盐，立即出锅。',
        'At 7 toss leaves 45–60 seconds; taste and serve.',
        7,
      ),
    ],
    2,
    16,
    '6档 → 8档 → 5档',
    true,
  ),
  basic(
    'fried-egg',
    '煎荷包蛋',
    'Induction Fried Egg',
    6,
    ['egg'],
    [],
    [
      S('食用油', 'Cooking oil', true, '1–2 茶匙', '1–2 tsp'),
      S('盐', 'Salt', false, '一小撮', 'A pinch'),
      S('黑胡椒', 'Black pepper', false, '少量', 'A little'),
    ],
    '中档定型、低档焖熟，避免中心过热。',
    'Set at medium and finish low to handle hot spots.',
    [
      P(
        '预热',
        'Preheat',
        '平底锅 5 档预热 30 秒，加油并转动锅底。',
        'Preheat at 5 for 30 seconds; add and swirl oil.',
        5,
      ),
      P(
        '下蛋',
        'Add egg',
        '鸡蛋先磕入小碗，贴近锅面轻轻倒入，避免油溅。',
        'Crack into a bowl, then slide gently into the pan.',
        5,
      ),
      P(
        '焖熟',
        'Finish',
        '边缘定型后调 3 档。想全熟可沿锅边加 1 茶匙水并盖 1–2 分钟；蛋白全白后关机。',
        'Once edges set, lower to 3. For firm egg, add 1 tsp water and cover 1–2 minutes.',
        3,
      ),
    ],
    1,
    6,
    '5档 → 3档',
    true,
  ),
  basic(
    'egg-rice',
    '鸡蛋炒饭',
    'Egg Fried Rice',
    7,
    ['rice', 'egg'],
    ['scallion', 'pea', 'carrot', 'ham'],
    [
      S('食用油', 'Cooking oil', true, '1 汤匙', '1 tbsp'),
      S('盐', 'Salt', true, '少量', 'A pinch'),
      S('生抽', 'Light soy sauce', false, '1 茶匙', '1 tsp'),
    ],
    '冷藏米饭更容易炒散；配菜切小。',
    'Cold rice separates best; keep add-ins small.',
    [
      P(
        '准备',
        'Prepare',
        '将 1 碗冷米饭抓散；鸡蛋打匀；配菜切小丁。',
        'Loosen a bowl of cold rice; beat egg and dice add-ins.',
      ),
      P(
        '炒蛋',
        'Cook egg',
        '6 档热锅加油，8 档下蛋液，刚凝固就划散。',
        'Preheat at 6; scramble egg at 8.',
        8,
      ),
      P(
        '炒饭',
        'Fry rice',
        '加入米饭，压散后不断翻炒 2–3 分钟，直到松散热透。',
        'Add rice; press apart and toss 2–3 minutes.',
        8,
      ),
      P(
        '调味',
        'Season',
        '转 6 档，加盐与可选生抽；加入配菜或葱花，翻匀关火。',
        'At 6 add salt, optional soy and add-ins.',
        6,
      ),
    ],
    1,
    12,
  ),
  basic(
    'broccoli',
    '蒜蓉西兰花',
    'Garlic Broccoli',
    8,
    ['broccoli'],
    ['garlic'],
    [
      S('食用油', 'Cooking oil', true, '1 汤匙', '1 tbsp'),
      S('盐', 'Salt', true, '1/4 茶匙', '1/4 tsp'),
      S('蚝油', 'Oyster sauce', false, '1 茶匙', '1 tsp'),
    ],
    '少量水焖粗梗，再开盖收干。',
    'A splash of water steams thick stems.',
    [
      P(
        '切洗',
        'Prepare',
        '切成均匀小朵，粗梗去皮切片，洗净沥干。',
        'Cut even florets; peel and slice stems.',
      ),
      P(
        '炒香',
        'Bloom garlic',
        '5 档热锅加油，蒜末炒 10 秒。',
        'At 5 cook garlic 10 seconds.',
        5,
      ),
      P(
        '焖熟',
        'Steam',
        '7 档下西兰花炒 30 秒，加 2 汤匙水，加盖 2 分钟。',
        'At 7 toss 30 seconds, add 2 tbsp water and cover 2 minutes.',
        7,
      ),
      P(
        '收干',
        'Finish',
        '开盖，加盐和可选蚝油，5 档炒到锅底基本无水。',
        'Uncover, season and toss at 5 until nearly dry.',
        5,
      ),
    ],
    1,
    14,
    '5档 → 7档 → 5档',
  ),
  basic(
    'potato',
    '酸辣土豆丝',
    'Hot & Sour Potato Slivers',
    9,
    ['potato'],
    ['green-pepper', 'chili'],
    [
      S('食用油', 'Cooking oil', true, '1 汤匙', '1 tbsp'),
      S('盐', 'Salt', true, '1/4 茶匙', '1/4 tsp'),
      S('米醋', 'Rice vinegar', true, '1 汤匙', '1 tbsp'),
      S('花椒', 'Sichuan peppercorn', false, '少量', 'A few'),
    ],
    '土豆丝先冲掉表面淀粉，才会爽脆不粘。',
    'Rinse surface starch for crisp, separate slivers.',
    [
      P(
        '切丝浸泡',
        'Cut and rinse',
        '土豆切细丝，清水洗 2–3 次至水明显变清，彻底沥干。',
        'Julienne and rinse 2–3 times until water clears; drain well.',
      ),
      P(
        '爆香',
        'Bloom',
        '6 档热锅加油，可选炒香花椒或辣椒。',
        'At 6 bloom optional peppercorn or chili.',
        6,
      ),
      P(
        '快炒',
        'Stir-fry',
        '8 档下土豆丝，不断翻炒约 2 分钟；太干可沿锅边加 1 汤匙水。',
        'At 8 toss 2 minutes; add 1 tbsp water if too dry.',
        8,
      ),
      P(
        '调味',
        'Season',
        '转 6 档加盐，醋沿锅边淋入，炒 20–30 秒出锅。',
        'At 6 add salt and vinegar; toss 20–30 seconds.',
        6,
      ),
    ],
    2,
    20,
  ),
  basic(
    'mapo',
    '家常麻婆豆腐',
    'Easy Mapo Tofu',
    10,
    ['tofu', 'pork-mince'],
    ['scallion', 'garlic'],
    [
      S('食用油', 'Cooking oil', true, '1 汤匙', '1 tbsp'),
      S('豆瓣酱', 'Chili bean paste', true, '1 汤匙', '1 tbsp'),
      S('生抽', 'Light soy sauce', false, '1 茶匙', '1 tsp'),
      S('淀粉', 'Cornstarch', false, '1 茶匙兑水', '1 tsp with water'),
    ],
    '温和家常版；豆腐下锅后轻推，不猛烈翻炒。',
    'A gentle home version; nudge rather than stir tofu.',
    [
      P(
        '准备',
        'Prepare',
        '豆腐切 2 厘米块；淀粉加 2 汤匙冷水调匀。',
        'Cut 2 cm tofu cubes; mix starch with 2 tbsp water.',
      ),
      P(
        '炒酱',
        'Cook sauce',
        '7 档炒散肉末；转 5 档加豆瓣酱和蒜炒香。',
        'Brown pork at 7; cook paste and garlic at 5.',
        5,
      ),
      P(
        '煮豆腐',
        'Simmer',
        '加 150 毫升水和豆腐，煮开后转 4 档咕嘟 5 分钟，不要大力铲。',
        'Add 150 ml water and tofu; simmer at 4 for 5 minutes.',
        4,
      ),
      P(
        '勾芡',
        'Thicken',
        '淀粉水重新搅匀，分两次淋入并轻推；略稠后关火。',
        'Re-stir slurry, add in two batches and nudge gently.',
        4,
      ),
    ],
    2,
    22,
    '5档 → 7档 → 4档',
  ),
  basic(
    'wings',
    '可乐鸡翅',
    'Cola Chicken Wings',
    11,
    ['chicken-wing'],
    ['ginger', 'scallion'],
    [
      S('食用油', 'Cooking oil', true, '1 茶匙', '1 tsp'),
      S('可乐', 'Cola', true, '约 250 毫升', 'About 250 ml'),
      S('生抽', 'Light soy sauce', true, '1 汤匙', '1 tbsp'),
      S('老抽', 'Dark soy sauce', false, '1/2 茶匙', '1/2 tsp'),
    ],
    '先煎、低档焖、最后升档收汁；甜汁不要离人。',
    'Brown, simmer low, then reduce; watch the sweet sauce.',
    [
      P(
        '处理鸡翅',
        'Prepare',
        '鸡翅擦干，两面划两刀。冷冻鸡翅须完全解冻；接触生肉后洗手和刀板。',
        'Pat dry and score. Fully thaw; clean hands and board after raw chicken.',
      ),
      P(
        '煎上色',
        'Brown',
        '6 档热锅加油，7 档每面煎约 2 分钟至浅金黄。',
        'Preheat at 6; brown at 7, about 2 minutes per side.',
        7,
      ),
      P(
        '焖煮',
        'Simmer',
        '加可乐、生抽和姜，接近没过鸡翅。煮开后转 3 档，加盖 15–18 分钟，中途翻面。',
        'Add cola, soy and ginger. Once boiling, cover at 3 for 15–18 minutes; turn once.',
        3,
      ),
      P(
        '收汁',
        'Reduce',
        '确认中心完全熟透后开盖调 6 档，持续翻动；汁能薄薄挂住鸡翅即关火。',
        'Confirm cooked through, uncover and reduce at 6 while turning constantly.',
        6,
      ),
    ],
    2,
    35,
    '6档 → 7档 → 3档 → 6档',
  ),
];

const copy = {
  zh: {
    brand: '食知',
    sub: '留学生电磁炉菜谱',
    tested: '实测成功',
    guest: '访客投稿',
    myIngredients: '我现在有',
    ingredientHint: '从食材库点选，或输入后从联想结果中选择',
    add: '搜索食材（如：西红柿）',
    library: '食材库',
    expand: '展开',
    collapse: '收起',
    noMatch: '食材库中没有匹配项',
    added: '已添加',
    categories: {
      vegetable: '蔬菜菌菇',
      protein: '蛋白质',
      staple: '主食',
      other: '其他',
    },
    recommend: '你现在最适合做',
    recommendSub: '只按最低必需食材匹配，实测菜谱保留原顺序',
    can: '最低食材已齐',
    missing: '还缺',
    item: '样',
    induction: '电磁炉',
    gas: '燃气灶 · 稍后',
    all: '全部菜谱',
    allSub: '按菜名或食材搜索',
    search: '搜索菜名或食材',
    minutes: '分钟',
    heat: '火力档位',
    difficulty: '难度',
    open: '查看做法与对比',
    have: '最低食材 · 已有',
    need: '最低食材 · 还缺',
    optional: '可选加料',
    seasonings: '佐料',
    required: '必须',
    recommended: '可选 / 推荐',
    steps: '详细步骤',
    tip: '1–9 档怎么用',
    tipText:
      '1–2 档保温/极小火，3–4 档小火，5–6 档中火，7–8 档大火，9 档仅用于短时烧水或爆炒。不同品牌有差异，第一次以食材状态为准。',
    submitTitle: '分享菜谱或改进建议',
    staticSubmitDesc:
      '公开预览版暂不接收投稿；安全审核后台正在接入，作者邮箱不会公开。',
    submitDesc: '投稿会进入待审核列表，通过后才会转交作者，作者邮箱不会公开。',
    name: '怎么称呼你',
    dish: '菜名',
    content: '步骤、档位、用量或建议',
    send: '提交审核',
    comingSoon: '投稿功能正在接入',
    sending: '正在提交…',
    success: '已收到，谢谢！',
    error: '提交失败，请稍后重试。',
    close: '关闭',
    serving: '默认 1 人份',
  },
  en: {
    brand: 'SHIZHI',
    sub: 'Induction recipes for students',
    tested: 'Kitchen-tested',
    guest: 'Share a recipe',
    myIngredients: 'What I have',
    ingredientHint:
      'Pick from the library, or type and choose an autocomplete result',
    add: 'Search ingredients (e.g. tomato)',
    library: 'Ingredient library',
    expand: 'Expand',
    collapse: 'Collapse',
    noMatch: 'No matching ingredient in the library',
    added: 'Added',
    categories: {
      vegetable: 'Vegetables & mushrooms',
      protein: 'Protein',
      staple: 'Staples',
      other: 'Other',
    },
    recommend: 'Best matches right now',
    recommendSub: 'Minimum ingredients only; tested recipes keep their order',
    can: 'Minimum ingredients ready',
    missing: 'Missing',
    item: '',
    induction: 'Induction',
    gas: 'Gas stove · Later',
    all: 'All recipes',
    allSub: 'Search by dish or ingredient',
    search: 'Search dishes or ingredients',
    minutes: 'min',
    heat: 'Heat levels',
    difficulty: 'Difficulty',
    open: 'View method & comparison',
    have: 'Minimum ingredients · have',
    need: 'Minimum ingredients · missing',
    optional: 'Optional add-ins',
    seasonings: 'Seasonings',
    required: 'Required',
    recommended: 'Optional / recommended',
    steps: 'Detailed method',
    tip: 'Using levels 1–9',
    tipText:
      '1–2 keep warm/very low, 3–4 low, 5–6 medium, 7–8 high; reserve 9 for brief boiling or searing. Hobs vary, so watch the food.',
    submitTitle: 'Share a recipe or improvement',
    staticSubmitDesc:
      'Public preview submissions are disabled while a secure review inbox is connected. The author email stays private.',
    submitDesc: 'Submissions enter review; the author email is never shown.',
    name: 'Your name',
    dish: 'Dish name',
    content: 'Steps, levels, quantities, or suggestions',
    send: 'Submit',
    comingSoon: 'Coming soon',
    sending: 'Submitting…',
    success: 'Received—thank you!',
    error: 'Could not submit. Try again later.',
    close: 'Close',
    serving: 'Default: 1 serving',
  },
};
const byId = (id: string) => pantryItems.find((x) => x.id === id)!;
const itemName = (id: string, lang: Lang) =>
  lang === 'zh' ? byId(id).zh : byId(id).en;

export default function Home() {
  const [lang, setLang] = useState<Lang>('zh'),
    t = copy[lang];
  const isStatic = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'github-pages';
  const [owned, setOwned] = useState(['tomato', 'egg', 'scallion']),
    [ingredient, setIngredient] = useState(''),
    [libraryOpen, setLibraryOpen] = useState(false),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState<Recipe | null>(null);
  const [guestOpen, setGuestOpen] = useState(false),
    [submitState, setSubmitState] = useState<
      'idle' | 'sending' | 'success' | 'error'
    >('idle'),
    [guest, setGuest] = useState({ name: '', dishName: '', content: '' });
  const [agentOpen, setAgentOpen] = useState(true),
    [agentCode, setAgentCode] = useState(''),
    [agentMessage, setAgentMessage] = useState(''),
    [agentMessages, setAgentMessages] = useState<
      { role: 'user' | 'assistant'; text: string }[]
    >([]),
    [agentBusy, setAgentBusy] = useState(false),
    [agentError, setAgentError] = useState('');
  const query = ingredient.trim().toLowerCase();
  const suggestions = useMemo(
    () =>
      query
        ? pantryItems
            .filter((x) =>
              [x.zh, x.en, ...(x.aliases || [])].some((v) =>
                v.toLowerCase().includes(query),
              ),
            )
            .slice(0, 7)
        : [],
    [query],
  );
  const score = useCallback(
    (r: Recipe) => r.essential.filter((id) => owned.includes(id)).length,
    [owned],
  );
  const missingFor = useCallback(
    (r: Recipe) => r.essential.filter((id) => !owned.includes(id)),
    [owned],
  );
  const sorted = useMemo(
    () =>
      [...recipes].sort(
        (a, b) =>
          score(b) - score(a) ||
          Number(!!b.tested) - Number(!!a.tested) ||
          recipes.indexOf(a) - recipes.indexOf(b),
      ),
    [score],
  );
  const filtered = recipes.filter(
    (r) =>
      !search.trim() ||
      [
        r.zh,
        r.en,
        ...r.essential.flatMap((id) => [byId(id).zh, byId(id).en]),
        ...r.optional.flatMap((id) => [byId(id).zh, byId(id).en]),
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function add(id: string) {
    if (!owned.includes(id)) setOwned((v) => [...v, id]);
    setIngredient('');
  }
  function key(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && suggestions.length) {
      e.preventDefault();
      add(suggestions[0].id);
    }
  }
  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isStatic) return;
    setSubmitState('sending');
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...guest, locale: lang }),
      });
      if (!response.ok) throw 0;
      setSubmitState('success');
      setGuest({ name: '', dishName: '', content: '' });
    } catch {
      setSubmitState('error');
    }
  }
  async function askAgent(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = agentMessage.trim();
    if (!message || !agentCode.trim() || agentBusy) return;
    setAgentMessage('');
    setAgentError('');
    setAgentMessages((current) => [
      ...current,
      { role: 'user', text: message },
    ]);
    setAgentBusy(true);
    try {
      if (isStatic) {
        const best = sorted[0];
        const missing = missingFor(best).map((id) => itemName(id, lang));
        const answer =
          lang === 'zh'
            ? `【演示模式】按你当前选择，优先推荐「${best.zh}」。${missing.length ? `还缺：${missing.join('、')}。` : '最低食材已经齐全。'}\n\n你可以先打开这道菜查看详细步骤、1–9 档火力和佐料。若想让 AI 真正分析你的口味，请在服务器版配置访问密码和模型密钥。`
            : `[Preview mode] Your best match is “${best.en}”. ${missing.length ? `Still needed: ${missing.join(', ')}.` : 'All minimum ingredients are ready.'}\n\nOpen the recipe for detailed steps, 1–9 heat levels and seasonings. Configure the protected server endpoint for live AI analysis.`;
        setAgentMessages((current) => [
          ...current,
          { role: 'assistant', text: answer },
        ]);
        return;
      }
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message,
          ingredients: owned.map((id) => itemName(id, lang)),
          locale: lang,
          accessCode: agentCode.trim(),
        }),
      });
      const payload = (await response.json()) as {
        answer?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'agent_error');
      setAgentMessages((current) => [
        ...current,
        { role: 'assistant', text: payload.answer || '' },
      ]);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'agent_error';
      setAgentError(
        code === 'rate_limit'
          ? lang === 'zh'
            ? '普通密码已达到每小时 5 次上限。'
            : 'This access code reached its hourly limit.'
          : code === 'invalid_access_code'
            ? lang === 'zh'
              ? '密码不正确，请检查后重试。'
              : 'Invalid access code.'
            : lang === 'zh'
              ? 'Agent 暂时不可用，请稍后再试。'
              : 'The agent is temporarily unavailable.',
      );
    } finally {
      setAgentBusy(false);
    }
  }
  useEffect(() => {
    const c = document.modelContext;
    if (!c?.registerTool) return;
    const a = new AbortController();
    Promise.resolve(
      c.registerTool(
        {
          name: 'open_recipe',
          title: '打开菜谱详情',
          description: '按菜谱 ID 打开详情并比较最低食材。',
          inputSchema: {
            type: 'object',
            properties: {
              recipeId: { type: 'string', enum: recipes.map((r) => r.id) },
            },
            required: ['recipeId'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute(input: unknown) {
            const r = recipes.find(
              (x) => x.id === (input as { recipeId?: unknown }).recipeId,
            );
            if (!r) throw Error('Recipe not found');
            setSelected(r);
            return {
              recipeId: r.id,
              missing: missingFor(r).map((id) => itemName(id, lang)),
            };
          },
        },
        { signal: a.signal },
      ),
    ).catch(() => a.abort());
    return () => a.abort();
  }, [lang, missingFor]);
  return (
    <main>
      <header className="site-header">
        <a className="logo" href="#top">
          <span>
            <Zap />
          </span>
          <div>
            <strong>{t.brand}</strong>
            <small>{t.sub}</small>
          </div>
        </a>
        <div className="header-actions">
          <div className="stove-switch">
            <button className="active">
              <Zap />
              {t.induction}
            </button>
            <button disabled>
              <Flame />
              {t.gas}
            </button>
          </div>
          <button
            className="guest-button"
            onClick={() => {
              setGuestOpen(true);
              setSubmitState('idle');
            }}
          >
            <MessageSquarePlus />
            {t.guest}
          </button>
          <div className="language-switch">
            <Globe2 />
            <button
              className={lang === 'zh' ? 'active' : ''}
              onClick={() => setLang('zh')}
            >
              中文
            </button>
            <button
              className={lang === 'en' ? 'active' : ''}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
        </div>
      </header>
      <div id="top" className="page-wrap">
        <section className="pantry">
          <div className="pantry-head">
            <span className="step">01</span>
            <div>
              <h1>{t.myIngredients}</h1>
              <p>{t.ingredientHint}</p>
            </div>
          </div>
          <div className="ingredient-controls">
            <div className="chips">
              {owned.map((id) => (
                <span key={id}>
                  {itemName(id, lang)}
                  <button
                    onClick={() => setOwned((v) => v.filter((x) => x !== id))}
                  >
                    <X />
                  </button>
                </span>
              ))}
            </div>
            <div className="ingredient-input">
              <Search />
              <Input
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                onKeyDown={key}
                placeholder={t.add}
              />
              {query && (
                <div className="ingredient-suggestions">
                  {suggestions.length ? (
                    suggestions.map((x) => (
                      <button
                        key={x.id}
                        onClick={() => add(x.id)}
                        disabled={owned.includes(x.id)}
                      >
                        <span>
                          {lang === 'zh' ? x.zh : x.en}
                          <small>{lang === 'zh' ? x.en : x.zh}</small>
                        </span>
                        {owned.includes(x.id) ? <em>{t.added}</em> : <Plus />}
                      </button>
                    ))
                  ) : (
                    <p>{t.noMatch}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            className="library-toggle"
            aria-expanded={libraryOpen}
            onClick={() => setLibraryOpen(!libraryOpen)}
          >
            <ChefHat />
            {t.library}
            <span>{pantryItems.length}</span>
            {libraryOpen ? t.collapse : t.expand}
            <ChevronDown className={libraryOpen ? 'open' : ''} />
          </button>
          {libraryOpen && (
            <div className="ingredient-library">
              {(['vegetable', 'protein', 'staple', 'other'] as Category[]).map(
                (cat) => (
                  <div key={cat}>
                    <h2>{t.categories[cat]}</h2>
                    <div>
                      {pantryItems
                        .filter((x) => x.category === cat)
                        .map((x) => (
                          <button
                            className={owned.includes(x.id) ? 'selected' : ''}
                            key={x.id}
                            onClick={() =>
                              owned.includes(x.id)
                                ? setOwned((v) => v.filter((id) => id !== x.id))
                                : add(x.id)
                            }
                          >
                            {owned.includes(x.id) && <Check />}
                            {lang === 'zh' ? x.zh : x.en}
                          </button>
                        ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
        <section className={`agent-panel ${agentOpen ? 'is-open' : ''}`}>
          <button
            className="agent-panel-toggle"
            onClick={() => setAgentOpen((open) => !open)}
            aria-expanded={agentOpen}
          >
            <span className="agent-mark">
              <Zap />
            </span>
            <span>
              <strong>
                {lang === 'zh' ? 'AI 厨神 Agent' : 'AI Cooking Agent'}
              </strong>
              <small>
                {lang === 'zh'
                  ? '告诉我你有什么、想吃什么，我来组合菜谱'
                  : 'Tell me what you have and what you want to eat'}
              </small>
            </span>
            <span className="agent-lock">
              {lang === 'zh' ? '受控访问' : 'Protected'} <ChevronDown />
            </span>
          </button>
          {agentOpen && (
            <div className="agent-panel-body">
              <div className="agent-intro">
                <div>
                  <h2>
                    {lang === 'zh'
                      ? '从食材到做法，一起规划'
                      : 'Plan a dish from your pantry'}
                  </h2>
                  <p>
                    {lang === 'zh'
                      ? 'Agent 会优先匹配现有菜谱；缺料时会列出缺少项，也可以按你的条件设计创新菜。'
                      : 'The agent matches your pantry first, lists missing items, and can design a custom dish when needed.'}
                  </p>
                </div>
                <span className="agent-prompt-hint">
                  {lang === 'zh'
                    ? '示例：我有鸡蛋和西红柿，想少油、15 分钟内完成'
                    : 'Example: I have eggs and tomato; low oil, ready in 15 minutes'}
                </span>
              </div>
              <div className="agent-access">
                <label>
                  {lang === 'zh' ? '访问密码' : 'Access code'}
                  <Input
                    type="password"
                    value={agentCode}
                    onChange={(e) => setAgentCode(e.target.value)}
                    placeholder={
                      lang === 'zh'
                        ? '输入作者提供的密码'
                        : 'Enter the code provided by the author'
                    }
                  />
                </label>
                <small>
                  {lang === 'zh'
                    ? '普通密码每小时最多 5 次；管理员密码不受次数限制。密码只发送到受保护服务器，不会交给模型。'
                    : 'Standard codes allow 5 requests/hour; admin codes are unlimited. The code is sent only to the protected server, never to the model.'}
                </small>
              </div>
              {agentMessages.length > 0 && (
                <div className="agent-thread">
                  {agentMessages.map((item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      className={`agent-bubble ${item.role}`}
                    >
                      <span>
                        {item.role === 'user'
                          ? lang === 'zh'
                            ? '你'
                            : 'You'
                          : 'AI'}
                      </span>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
              <form className="agent-form" onSubmit={askAgent}>
                <Input
                  value={agentMessage}
                  onChange={(e) => setAgentMessage(e.target.value)}
                  placeholder={
                    lang === 'zh'
                      ? '描述你的食材、口味、时间或设备条件…'
                      : 'Describe ingredients, taste, time, or equipment…'
                  }
                />
                <Button
                  type="submit"
                  disabled={
                    !agentCode.trim() || !agentMessage.trim() || agentBusy
                  }
                >
                  <Send />
                  {agentBusy
                    ? lang === 'zh'
                      ? '思考中…'
                      : 'Thinking…'
                    : lang === 'zh'
                      ? '询问 Agent'
                      : 'Ask agent'}
                </Button>
              </form>
              {agentError && <p className="agent-error">{agentError}</p>}
            </div>
          )}
        </section>
        <section className="recommend">
          <div className="section-head">
            <div>
              <span className="step">02</span>
              <h2>{t.recommend}</h2>
              <p>{t.recommendSub}</p>
            </div>
            <a href="#all-recipes">
              {t.all}
              <ArrowDown />
            </a>
          </div>
          <div className="recipe-grid">
            {sorted.slice(0, 4).map((r, i) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                lang={lang}
                rank={i + 1}
                match={score(r)}
                missing={missingFor(r)}
                onOpen={() => setSelected(r)}
              />
            ))}
          </div>
        </section>
        <section className="induction-note">
          <div className="coil">
            <span />
            <span />
            <span />
          </div>
          <div>
            <span>
              <Lightbulb />
              {t.tip}
            </span>
            <p>{t.tipText}</p>
          </div>
          <div className="level-scale">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </section>
        <section id="all-recipes" className="all-recipes">
          <div className="section-head">
            <div>
              <span className="step">03</span>
              <h2>{t.all}</h2>
              <p>{t.allSub}</p>
            </div>
            <div className="search-box">
              <Search />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
              />
            </div>
          </div>
          <div className="recipe-table">
            {filtered.map((r) => (
              <button key={r.id} onClick={() => setSelected(r)}>
                <RecipeImage recipe={r} />
                <span>
                  <strong>{lang === 'zh' ? r.zh : r.en}</strong>
                  <small>
                    {r.tested && (
                      <em>
                        <Check />
                        {t.tested}
                      </em>
                    )}
                    {r.essential.map((id) => itemName(id, lang)).join(' · ')}
                  </small>
                </span>
                <span className="table-meta">
                  <Stars count={r.difficulty} />
                  <small>
                    {r.minutes} {t.minutes}
                  </small>
                </span>
                <span className="power">
                  <Zap />
                  {r.heat}
                </span>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>
        <button
          className="submission-banner"
          onClick={() => {
            setGuestOpen(true);
            setSubmitState('idle');
          }}
        >
          <MessageSquarePlus />
          <span>
            <strong>{t.submitTitle}</strong>
            <small>{isStatic ? t.staticSubmitDesc : t.submitDesc}</small>
          </span>
          <ChevronRight />
        </button>
      </div>
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="recipe-sheet">
          <SheetHeader>
            {selected && <RecipeImage recipe={selected} large />}
            <SheetTitle>
              {selected && (lang === 'zh' ? selected.zh : selected.en)}
            </SheetTitle>
            <SheetDescription>
              {selected && (lang === 'zh' ? selected.descZh : selected.descEn)}
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="sheet-body">
              <div className="serving-label">{t.serving}</div>
              <div className="sheet-stats">
                <span>
                  <Stars count={selected.difficulty} />
                  <small>{t.difficulty}</small>
                </span>
                <span>
                  <Clock3 />
                  <strong>
                    {selected.minutes} {t.minutes}
                  </strong>
                </span>
                <span>
                  <Zap />
                  <strong>{selected.heat}</strong>
                  <small>{t.heat}</small>
                </span>
              </div>
              <div className="comparison">
                <h3>{t.have}</h3>
                <div>
                  {selected.essential
                    .filter((id) => owned.includes(id))
                    .map((id) => (
                      <span className="have" key={id}>
                        <Check />
                        {itemName(id, lang)}
                      </span>
                    ))}
                </div>
                <h3>{t.need}</h3>
                <div>
                  {missingFor(selected).length ? (
                    missingFor(selected).map((id) => (
                      <span className="need" key={id}>
                        <Plus />
                        {itemName(id, lang)}
                      </span>
                    ))
                  ) : (
                    <span className="ready">
                      <Check />
                      {t.can}
                    </span>
                  )}
                </div>
                {selected.optional.length > 0 && (
                  <>
                    <h3>{t.optional}</h3>
                    <div>
                      {selected.optional.map((id) => (
                        <span
                          className={owned.includes(id) ? 'have' : 'optional'}
                          key={id}
                        >
                          {owned.includes(id) ? <Check /> : <Plus />}
                          {itemName(id, lang)}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="seasonings">
                <h3>
                  <Utensils />
                  {t.seasonings}
                </h3>
                {selected.seasonings.map((x) => (
                  <div key={x.zh}>
                    <span className={x.required ? 'required' : 'recommended'}>
                      {x.required ? t.required : t.recommended}
                    </span>
                    <strong>{lang === 'zh' ? x.zh : x.en}</strong>
                    <small>{lang === 'zh' ? x.amountZh : x.amountEn}</small>
                  </div>
                ))}
              </div>
              <HeatGuide />
              <div className="steps">
                <h3>
                  <ChefHat />
                  {t.steps}
                </h3>
                {selected.steps.map((x, i) => (
                  <div key={x.titleZh}>
                    <span>{i + 1}</span>
                    <section>
                      <header>
                        <strong>{lang === 'zh' ? x.titleZh : x.titleEn}</strong>
                        {x.level && (
                          <em>
                            <Zap />
                            {x.level} {lang === 'zh' ? '档' : 'level'}
                          </em>
                        )}
                      </header>
                      <p>{lang === 'zh' ? x.textZh : x.textEn}</p>
                    </section>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={guestOpen} onOpenChange={setGuestOpen}>
        <DialogContent className="guest-dialog">
          <DialogHeader>
            <DialogTitle>{t.submitTitle}</DialogTitle>
            <DialogDescription>
              {isStatic ? t.staticSubmitDesc : t.submitDesc}
            </DialogDescription>
          </DialogHeader>
          {submitState === 'success' ? (
            <div className="submit-success">
              <Check />
              <p>{t.success}</p>
              <Button onClick={() => setGuestOpen(false)}>{t.close}</Button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label>
                {t.name}
                <Input
                  required
                  disabled={isStatic}
                  value={guest.name}
                  onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                />
              </label>
              <label>
                {t.dish}
                <Input
                  required
                  disabled={isStatic}
                  value={guest.dishName}
                  onChange={(e) =>
                    setGuest({ ...guest, dishName: e.target.value })
                  }
                />
              </label>
              <label>
                {t.content}
                <textarea
                  required
                  disabled={isStatic}
                  value={guest.content}
                  onChange={(e) =>
                    setGuest({ ...guest, content: e.target.value })
                  }
                />
              </label>
              {submitState === 'error' && (
                <p className="form-error">{t.error}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGuestOpen(false)}
                >
                  {t.close}
                </Button>
                <Button
                  type="submit"
                  disabled={isStatic || submitState === 'sending'}
                >
                  {isStatic
                    ? t.comingSoon
                    : submitState === 'sending'
                      ? t.sending
                      : t.send}
                  <Send />
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Stars({ count }: { count: number }) {
  return (
    <span className="stars">
      {[1, 2, 3].map((n) => (
        <Star key={n} className={n <= count ? 'filled' : ''} />
      ))}
    </span>
  );
}
function RecipeImage({
  recipe,
  large = false,
}: {
  recipe: Recipe;
  large?: boolean;
}) {
  const col = recipe.imageIndex % 4,
    row = Math.floor(recipe.imageIndex / 4);
  return (
    <div
      className={`recipe-photo${large ? ' large' : ''}`}
      role="img"
      aria-label={`${recipe.zh} / ${recipe.en}`}
      style={{ backgroundPosition: `${(col * 100) / 3}% ${row * 50}%` }}
    />
  );
}
function HeatGuide() {
  return (
    <div className="heat-guide">
      <div>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <i />
    </div>
  );
}
function RecipeCard({
  recipe: r,
  lang,
  rank,
  match,
  missing,
  onOpen,
}: {
  recipe: Recipe;
  lang: Lang;
  rank: number;
  match: number;
  missing: string[];
  onOpen: () => void;
}) {
  const t = copy[lang];
  return (
    <button className={`recipe-card rank-${rank}`} onClick={onOpen}>
      <div className="card-top">
        <span className="rank">0{rank}</span>
        {r.tested && (
          <em>
            <Check />
            {t.tested}
          </em>
        )}
      </div>
      <div>
        <RecipeImage recipe={r} />
        <h3>{lang === 'zh' ? r.zh : r.en}</h3>
        <p>{lang === 'zh' ? r.descZh : r.descEn}</p>
        <div className="match-bar">
          <i
            style={{
              width: `${Math.round((match / r.essential.length) * 100)}%`,
            }}
          />
        </div>
        <div className="match-line">
          <strong className={missing.length ? 'missing' : 'ready'}>
            {missing.length
              ? `${t.missing} ${missing.length} ${t.item}`
              : t.can}
          </strong>
          <span>
            {missing.length ? (
              missing.map((id) => itemName(id, lang)).join(' · ')
            ) : (
              <>
                <Check />
                100%
              </>
            )}
          </span>
        </div>
        <footer>
          <Stars count={r.difficulty} />
          <span>
            <Clock3 />
            {r.minutes} {t.minutes}
          </span>
          <span>
            <Zap />
            {r.heat}
          </span>
        </footer>
        <div className="open-label">
          {t.open}
          <ChevronRight />
        </div>
      </div>
    </button>
  );
}
