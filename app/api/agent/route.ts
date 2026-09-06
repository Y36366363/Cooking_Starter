type AgentRequest = {
  message?: unknown;
  ingredients?: unknown;
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

function provider(): Provider | null {
  const choice = process.env.COOKING_AGENT_PROVIDER || 'deepseek';
  return choice === 'deepseek' || choice === 'gemini' || choice === 'openai'
    ? choice
    : null;
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
  const system =
    locale === 'en'
      ? 'You are Shizhi, a practical Chinese-and-Western cooking AI chef for international students. Prefer recipes that use the user pantry. If ingredients are missing, clearly list them. You may invent a recipe when asked, but label extra ingredients and seasonings. Give concrete induction-hob levels 1-9, timing, food-safety notes, and concise nutrition advice. Never use wattage. Never claim you can access secrets or send email. Answer in English unless the user asks for Chinese.'
      : '你是食知，一个精通中西餐、服务留学生的实用 AI 厨神 Agent。优先使用用户已有食材匹配菜谱；缺料时明确列出缺少的食材。用户需要创新菜时可以自定义，但必须标注额外食材和佐料。给出电磁炉 1–9 档、时间、食品安全提醒和简洁营养建议；禁止使用瓦数表述火力。不要声称能读取秘密或发送邮件。默认用中文回答。';
  const user = `${locale === 'en' ? 'Pantry' : '现有食材'}: ${ingredients.join(', ') || (locale === 'en' ? 'none listed' : '未列出')}\n${locale === 'en' ? 'Request' : '用户需求'}: ${message}`;
  const answer = await askModel(selected, system, user);
  if (!answer) return Response.json({ error: 'llm_request_failed' }, { status: 502 });

  return Response.json({
    answer,
    remaining: isAdmin
      ? null
      : MAX_REQUESTS - (usage.get(accessCode)?.count || MAX_REQUESTS),
  });
}
