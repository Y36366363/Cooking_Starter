'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Bot, ChevronRight, Clock3, Flame, Leaf, Library, Plus, Search, Settings2, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Recipe = { id: number; title: string; type: string; time: number; level: string; ingredients: string[]; note: string };
type WebMcpContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };
declare global { interface Document { modelContext?: WebMcpContext } }
const seedRecipes: Recipe[] = [
  { id: 1, title: '番茄炒蛋', type: '家常快手', time: 12, level: '新手', ingredients: ['番茄', '鸡蛋', '小葱'], note: '先把蛋炒至七成熟盛出，番茄出沙后再回锅，口感会更嫩。' },
  { id: 2, title: '香菇青菜', type: '清淡素食', time: 15, level: '新手', ingredients: ['上海青', '香菇', '蒜'], note: '菜梗先入锅，菜叶后放；大火快炒能减少出水。' },
  { id: 3, title: '可乐鸡翅', type: '下饭菜', time: 35, level: '熟练', ingredients: ['鸡翅', '姜', '可乐'], note: '鸡翅擦干再煎，收汁阶段勤翻动，避免糖分焦苦。' },
];
const nav = [
  { label: '智能烹饪台', icon: Sparkles, active: true }, { label: '我的菜谱', icon: Library },
  { label: '基础课堂', icon: BookOpen }, { label: '偏好与设备', icon: Settings2 },
];

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>(seedRecipes);
  const [ingredients, setIngredients] = useState('番茄、鸡蛋、小葱');
  const [time, setTime] = useState('20 分钟内');
  const [goal, setGoal] = useState('省时家常');
  const [vegetarian, setVegetarian] = useState(false);
  const [result, setResult] = useState<Recipe | null>(seedRecipes[0]);
  const [thinking, setThinking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', ingredients: '', note: '' });
  const recipesRef = useRef(recipes);

  useEffect(() => { recipesRef.current = recipes; }, [recipes]);

  useEffect(() => {
    const saved = window.localStorage.getItem('shizhi-recipes');
    if (saved) try { setRecipes(JSON.parse(saved)); } catch { window.localStorage.removeItem('shizhi-recipes'); }
  }, []);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const registration = context.registerTool({
      name: 'create_recipe', title: '录入菜谱教学',
      description: '把一道菜的名称、食材与关键教学保存到当前食知知识库。',
      inputSchema: { type: 'object', properties: { title: { type: 'string', minLength: 1 }, ingredients: { type: 'array', minItems: 1, items: { type: 'string' } }, note: { type: 'string' } }, required: ['title', 'ingredients'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input: unknown) {
        const value = input as { title?: unknown; ingredients?: unknown; note?: unknown };
        if (typeof value.title !== 'string' || !value.title.trim() || !Array.isArray(value.ingredients) || !value.ingredients.every((item) => typeof item === 'string' && item.trim())) throw new Error('菜名和至少一种有效食材为必填项');
        const next: Recipe = { id: Date.now(), title: value.title.trim(), type: 'Agent 录入', time: 25, level: '自定义', ingredients: value.ingredients.map((item) => String(item).trim()), note: typeof value.note === 'string' && value.note.trim() ? value.note.trim() : '这道菜还没有教学笔记，可以随时继续编辑。' };
        const updated = [next, ...recipesRef.current]; recipesRef.current = updated; setRecipes(updated); setResult(next); window.localStorage.setItem('shizhi-recipes', JSON.stringify(updated));
        return { id: next.id, title: next.title, saved: true };
      },
    }, { signal: lifecycle.signal });
    Promise.resolve(registration).catch(() => lifecycle.abort());
    return () => lifecycle.abort();
  }, []);
  const ingredientList = useMemo(() => ingredients.split(/[、,，\s]+/).map((item) => item.trim()).filter(Boolean), [ingredients]);
  function analyze() {
    setThinking(true);
    window.setTimeout(() => {
      const pool = vegetarian ? recipes.filter((recipe) => !recipe.ingredients.some((item) => /肉|鸡|鱼|虾|牛|羊/.test(item))) : recipes;
      const matched = pool.find((recipe) => recipe.ingredients.some((item) => ingredientList.some((input) => item.includes(input) || input.includes(item))));
      setResult(matched ?? pool[0] ?? recipes[0] ?? null); setThinking(false);
    }, 650);
  }
  function openCreate() { setEditingId(null); setForm({ title: '', ingredients: '', note: '' }); setDialogOpen(true); }
  function openEdit(recipe: Recipe) { setEditingId(recipe.id); setForm({ title: recipe.title, ingredients: recipe.ingredients.join('、'), note: recipe.note }); setDialogOpen(true); }
  function saveRecipe() {
    if (!form.title.trim() || !form.ingredients.trim()) return;
    const next: Recipe = { id: Date.now(), title: form.title.trim(), type: '我的教学', time: 25, level: '自定义', ingredients: form.ingredients.split(/[、,，\n]+/).map((item) => item.trim()).filter(Boolean), note: form.note.trim() || '这道菜还没有教学笔记，可以随时继续编辑。' };
    const updated = editingId ? recipes.map((recipe) => recipe.id === editingId ? { ...recipe, title: next.title, ingredients: next.ingredients, note: next.note } : recipe) : [next, ...recipes];
    setRecipes(updated); window.localStorage.setItem('shizhi-recipes', JSON.stringify(updated));
    setForm({ title: '', ingredients: '', note: '' }); setDialogOpen(false);
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Flame /></span><div><strong>食知</strong><small>Cooking Agent</small></div></div>
      <nav aria-label="主要导航">{nav.map(({ label, icon: Icon, active }) => <button className={active ? 'nav-item active' : 'nav-item'} key={label}><Icon />{label}</button>)}</nav>
      <div className="sidebar-note"><span className="pulse-dot" /><div><strong>知识库已就绪</strong><small>{recipes.length} 道菜谱 · 本机保存</small></div></div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><p>晚上好，今天想怎么吃？</p><h1>让食材决定下一顿饭</h1></div><Button className="add-button" onClick={openCreate}><Plus />录入我的菜谱</Button></header>
      <div className="agent-hero"><img src="/kitchen-workspace.png" alt="热锅旁准备好的番茄、鸡蛋和青菜" /><div className="hero-shade" /><div className="hero-copy"><span><Bot /> 食知 Agent</span><h2>把你手边的食材，<br />变成今晚可执行的一餐。</h2><p>会结合你的时间、口味、厨具与已有教学来给出建议。</p></div></div>
      <section className="agent-panel" aria-label="食材分析条件">
        <div className="panel-heading"><div><span className="eyebrow">STEP 01</span><h2>告诉我现有食材</h2></div><span className="mode-pill"><span />本地推理演示</span></div>
        <label className="ingredient-field"><Search /><Input value={ingredients} onChange={(event) => setIngredients(event.target.value)} placeholder="例如：鸡蛋、番茄、豆腐……" /></label>
        <div className="condition-row">
          <div className="condition"><span>可用时间</span><Select value={time} onValueChange={(value) => setTime(value ?? '20 分钟内')}><SelectTrigger><Clock3 /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="20 分钟内">20 分钟内</SelectItem><SelectItem value="40 分钟内">40 分钟内</SelectItem><SelectItem value="不限时间">不限时间</SelectItem></SelectContent></Select></div>
          <div className="condition"><span>烹饪目标</span><Select value={goal} onValueChange={(value) => setGoal(value ?? '省时家常')}><SelectTrigger><UtensilsCrossed /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="省时家常">省时家常</SelectItem><SelectItem value="低脂高蛋白">低脂高蛋白</SelectItem><SelectItem value="练习厨艺">练习厨艺</SelectItem></SelectContent></Select></div>
          <label className="check-condition"><Checkbox checked={vegetarian} onCheckedChange={(value) => setVegetarian(Boolean(value))} /><span><strong>只看素食</strong><small>排除肉类与海鲜</small></span></label>
          <Button className="analyze-button" onClick={analyze} disabled={thinking}>{thinking ? '正在分析…' : '开始分析'}<Sparkles /></Button>
        </div>
      </section>
      <div className="content-grid">
        <section className="recommendation"><div className="section-title"><div><span className="eyebrow">STEP 02</span><h2>Agent 的建议</h2></div><button>查看分析逻辑 <ChevronRight /></button></div>
          {result ? <article className="result-card"><div className="result-main"><div className="recipe-icon"><UtensilsCrossed /></div><div><div className="recipe-labels"><span>首选方案</span><small>{goal} · {time}</small></div><h3>{result.title}</h3><p>{result.note}</p><div className="tags"><span><Clock3 />约 {result.time} 分钟</span><span><Flame />{result.level}</span><span><Leaf />食材匹配 {Math.min(ingredientList.length, result.ingredients.length)}/{result.ingredients.length}</span></div></div></div><div className="agent-reason"><Bot /><p><strong>为什么推荐它</strong>你已有核心食材，步骤少、容错高。建议先处理最耗时的食材，最后再做容易出水或过熟的部分。</p></div></article> : <div className="empty-state">先录入一道菜谱，再让 Agent 为你匹配。</div>}
        </section>
        <aside className="library-card"><div className="section-title"><div><span className="eyebrow">你的知识库</span><h2>最近菜谱</h2></div><button>全部</button></div><div className="recipe-list">{recipes.slice(0, 4).map((recipe) => <div className="recipe-row" key={recipe.id}><button onClick={() => setResult(recipe)}><span>{recipe.title.slice(0, 1)}</span><div><strong>{recipe.title}</strong><small>{recipe.type} · {recipe.time} 分钟</small></div><ChevronRight /></button><button className="edit-recipe" onClick={() => openEdit(recipe)}>编辑</button></div>)}</div></aside>
      </div>
    </section>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="recipe-dialog"><DialogHeader><DialogTitle>{editingId ? '编辑菜谱教学' : '录入我的菜谱教学'}</DialogTitle><DialogDescription>先保存最重要的做法和判断标准，之后可继续完善。</DialogDescription></DialogHeader><div className="form-stack"><label>菜名<Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="例如：妈妈的红烧肉" /></label><label>食材<Input value={form.ingredients} onChange={(event) => setForm({ ...form, ingredients: event.target.value })} placeholder="用顿号分隔：五花肉、冰糖、生抽" /></label><label>关键教学<textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="火候、顺序、容易失败的地方……" /></label></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={saveRecipe}>{editingId ? '保存修改' : '保存到知识库'}</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}
