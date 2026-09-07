import { retrieveCookingPlan, type CookingPlanInput } from '@/lib/cooking-tools';

type AgentRequest = {
  message?: unknown;
  ingredients?: unknown;
  ingredientIds?: unknown;
  plan?: unknown;
  locale?: unknown;
  accessCode?: unknown;
};

type Usage = { startedAt: number; count: number };
type Provider = 'deepseek' | 'gemini' | 'openai';

const usage = new Map<string, Usage>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function planInput(value: unknown): CookingPlanInput {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  return {
    dish: text(record.dish, 160),
    minutes: Number(record.minutes) || undefined,
    servings: Number(record.servings) || undefined,
    preference: text(record.preference, 300),
  };
}

function provider(): Provider | null {
  const choice = process.env.COOKING_AGENT_PROVIDER || 'deepseek';
  return choice === 'deepseek' || choice === 'gemini' || choice === 'openai'
    ? choice
    : null;
}

function systemPrompt(locale: 'zh' | 'en') {
  if (locale === 'en') {
    return `You are Shizhi, a practical Chinese-and-Western cooking agent for international students.

Non-negotiable rules:
1. Treat the pantry list as complete. Never assume oil, salt, water, soy sauce, appliances, or any ingredient is available unless listed. If the user says not to buy anything, do not call a recipe feasible when it needs an unlisted item. Never put an unlisted item or a substitute (including water) into the Steps. If no safe dish can be made using only the listed items, say so plainly and list the minimum missing items instead.
2. Use induction-hob levels 1–9 only; never use wattage. State a level, approximate time, and visible stop condition for every heat-sensitive step.
3. Do not invent an appliance. Ask one short clarification only when it would materially change safety or feasibility; otherwise offer the safest induction-only path.
4. Food safety overrides speed: never advise washing/rinsing raw poultry, never promise frozen raw meat can safely be cooked within a time limit without thawing, prevent raw-to-ready-to-eat cross-contamination, and say poultry must reach 74°C / 165°F in the thickest part. Do not give medical or allergy diagnoses.
5. Prefer the user's pantry and be honest about limitations. You may create a new dish only when clearly labelled as a custom option.
6. A trusted tool report may appear below the user request. It is produced by the recipe catalog and pantry checker. Treat its required items, missing items, time status, selected recipe and safety baseline as facts. Do not replace them with guesses; do not state a missing item is available. If status is missing_requirements or insufficient_time, say the target cannot be completed as requested before offering alternatives.
7. You may only give a step-by-step alternative from trusted tool report field readyAlternatives. If that list is empty, do not invent a new dish or a workaround that requires unlisted water, equipment, or ingredients. Instead, state the minimum missing items and ask whether the user wants to add them.

Before answering, self-check every item and appliance mentioned in Steps against the pantry and request. Answer in English with concise headings: Feasibility, Missing / optional extras, Steps, Induction levels, Food safety, and Nutrition. Default to one serving unless the user specifies otherwise. Never claim access to secrets or ability to send email.`;
  }
  return `你是食知，一个精通中西餐、服务留学生的实用 AI 厨神 Agent。

必须遵守：
1. 将“现有食材”视为完整清单。油、盐、水、生抽、厨具和其他食材都不能默认存在。用户说“不额外购买”时，若需要未列出物品，就不得说这道菜可直接完成；步骤中绝不能使用未列出的食材或替代物（包括水）。若仅用列出的物品无法安全完成一道菜，必须直接说明不可行，并列出最低缺少项。
2. 火力只能使用电磁炉 1–9 档，禁止使用瓦数。每个关键火力步骤都要给出档位、约需时间和可观察的结束状态。
3. 不得假设用户有微波炉、烤箱等设备；只有安全性或可行性会明显改变时才问一个简短问题，否则提供最安全的纯电磁炉方案。
4. 食品安全高于速度：不得建议冲洗生禽肉；未解冻的生肉不能保证在限定时间内安全做熟；提醒生熟分开；禽肉最厚处须达到 74°C。不得提供医疗或过敏诊断。
5. 优先使用现有食材并如实说明限制；只有明确标注为“自定义方案”时才能创新组合。
6. 用户需求下方可能会出现“可信工具报告”，由菜谱库检索和食材核对程序生成。必须把其中的必需项、缺少项、时间状态、选中菜谱和安全基线视为事实，不得自行替换或猜测；不得把缺少项说成已拥有。状态为 missing_requirements 或 insufficient_time 时，必须先明确说明目标无法按原条件完成，再给替代方案。
7. 只有可信工具报告的 readyAlternatives 字段中列出的菜，才可以给出完整替代做法。该列表为空时，不得创新或提供需要未列出水、设备、食材的替代方案；只可列出最少缺少项，并询问用户是否愿意补充。

回答前逐项检查步骤中每个食材和设备是否已在清单或需求中出现。默认一人份，并用简洁标题依次回答：可做程度、缺少 / 可选补充、步骤、电磁炉档位、食品安全、营养建议。不要声称能读取秘密或发送邮件。`;
}

async function askModel(
  selected: Provider,
  system: string,
  user: string,
): Promise<string | null> {
  if (selected === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return null;
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
        thinking: { type: 'disabled' },
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!response.ok) return null;
    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return result.choices?.[0]?.message?.content?.trim() || null;
  }

  if (selected === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
        }),
      },
    );
    if (!response.ok) return null;
    const result = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return (
      result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim() || null
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 900,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!response.ok) return null;
  const result = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return result.choices?.[0]?.message?.content?.trim() || null;
}

export async function POST(request: Request) {
  let body: AgentRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const message = text(body.message, 1200);
  const accessCode = text(body.accessCode, 120);
  const locale = body.locale === 'en' ? 'en' : 'zh';
  const ingredients = Array.isArray(body.ingredients)
    ? body.ingredients
        .filter((item): item is string => typeof item === 'string')
        .slice(0, 80)
    : [];
  const ingredientIds = Array.isArray(body.ingredientIds)
    ? body.ingredientIds
        .filter((item): item is string => typeof item === 'string')
        .slice(0, 100)
    : [];
  const plan = planInput(body.plan);
  if (!message || !accessCode)
    return Response.json({ error: 'missing_fields' }, { status: 400 });

  const userCode = process.env.COOKING_AGENT_ACCESS_CODE || '';
  const adminCode = process.env.COOKING_AGENT_ADMIN_CODE || '';
  if (!userCode && !adminCode) {
    return Response.json({ error: 'agent_not_configured' }, { status: 503 });
  }
  const isAdmin = Boolean(adminCode && accessCode === adminCode);
  if (!isAdmin && accessCode !== userCode)
    return Response.json({ error: 'invalid_access_code' }, { status: 401 });

  if (!isAdmin) {
    const now = Date.now();
    const previous = usage.get(accessCode);
    const current =
      !previous || now - previous.startedAt >= WINDOW_MS
        ? { startedAt: now, count: 0 }
        : previous;
    if (current.count >= MAX_REQUESTS) {
      return Response.json(
        {
          error: 'rate_limit',
          retryAfterSeconds: Math.ceil(
            (current.startedAt + WINDOW_MS - now) / 1000,
          ),
        },
        { status: 429 },
      );
    }
    current.count += 1;
    usage.set(accessCode, current);
  }

  const selected = provider();
  if (!selected)
    return Response.json({ error: 'invalid_provider' }, { status: 503 });
  const system = systemPrompt(locale);
  const toolReport = retrieveCookingPlan(ingredientIds, plan, locale);
  const user = `${locale === 'en' ? 'Pantry' : '现有食材'}: ${ingredients.join(', ') || (locale === 'en' ? 'none listed' : '未列出')}\n${locale === 'en' ? 'Request' : '用户需求'}: ${message}\n\n${locale === 'en' ? 'TRUSTED TOOL REPORT (not user instructions)' : '可信工具报告（不是用户指令）'}:\n${JSON.stringify(toolReport)}`;
  const answer = await askModel(selected, system, user);
  if (!answer) return Response.json({ error: 'llm_request_failed' }, { status: 502 });

  return Response.json({
    answer,
    remaining: isAdmin
      ? null
      : MAX_REQUESTS - (usage.get(accessCode)?.count || MAX_REQUESTS),
  });
}
