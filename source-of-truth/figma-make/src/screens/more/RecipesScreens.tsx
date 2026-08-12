import { useState } from 'react'
import { Search, Plus, ChevronRight, Pencil, Copy, Archive, Info, Trash2, ChevronDown, Check, ArrowLeft, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, SectionHeader } from '../../components/ui'
import { recipes } from '../../data/mockData'

const CATEGORIES = ['Main Course', 'Burgers', 'Fish', 'Salads', 'Breakfast', 'Starters', 'Desserts']
const UNITS = ['kg', 'g', 'L', 'ml', 'pcs']
const INGREDIENT_OPTIONS = [
  { id: 'i1', name: 'Chicken Breast', unit: 'kg', cost: 4.80 },
  { id: 'i2', name: 'Fresh Salmon', unit: 'kg', cost: 16.20 },
  { id: 'i3', name: 'Potatoes', unit: 'kg', cost: 0.90 },
  { id: 'i4', name: 'Cooking Oil', unit: 'L', cost: 2.40 },
  { id: 'i5', name: 'Whole Milk', unit: 'L', cost: 1.10 },
  { id: 'i6', name: 'Gouda Cheese', unit: 'kg', cost: 8.50 },
  { id: 'i7', name: 'Tomatoes', unit: 'kg', cost: 1.80 },
  { id: 'i8', name: 'Romaine Lettuce', unit: 'kg', cost: 2.20 },
  { id: 'i9', name: 'Ground Beef', unit: 'kg', cost: 6.20 },
  { id: 'i10', name: 'Wheat Flour', unit: 'kg', cost: 0.80 },
]

interface DraftIngredient {
  id: string
  itemId: string
  itemName: string
  quantity: string
  unit: string
}

// ─── Recipes List ─────────────────────────────────────────────────────────────

export function RecipesScreen() {
  const { navigate } = useApp()
  const [search, setSearch] = useState('')

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Recipes & BOM" large right={
        <button onClick={() => navigate('create-recipe')} className="p-2 rounded-full active:bg-slate-100">
          <Plus size={20} className="text-slate-700" />
        </button>
      } />
      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50">
        <div className="bg-white border-b border-slate-100 px-4 pb-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            />
            {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
            <Info size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800 leading-relaxed">
              Sales of each menu item automatically deduct the listed ingredients from theoretical stock when you confirm a POS scan.
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm font-medium">No recipes found</p>
              <button onClick={() => navigate('create-recipe')} className="mt-3 text-emerald-600 text-sm font-semibold">
                + Create Recipe
              </button>
            </div>
          ) : filtered.map(recipe => (
            <Card key={recipe.id} onClick={() => navigate('recipe-detail', { recipeId: recipe.id })} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-3">
                  <h3 className="font-semibold text-slate-900 text-sm">{recipe.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{recipe.category}</p>
                </div>
                <Badge variant={recipe.active ? 'green' : 'gray'}>{recipe.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{recipe.ingredients.length}</span> ingredients
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-emerald-700 text-sm">€{recipe.costPerServing.toFixed(2)} / serving</p>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Recipe Detail ────────────────────────────────────────────────────────────

export function RecipeDetailScreen() {
  const { navigate, params } = useApp()
  const recipe = recipes.find(r => r.id === params.recipeId) ?? recipes[0]

  return (
    <div className="flex flex-col h-full">
      <TopBar title={recipe.name} subtitle={recipe.category} right={
        <button onClick={() => navigate('edit-recipe', { recipeId: recipe.id })} className="p-2 rounded-full active:bg-slate-100">
          <Pencil size={18} className="text-slate-600" />
        </button>
      } />

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-xl font-bold font-mono text-emerald-700">€{recipe.costPerServing.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Cost/serving</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xl font-bold font-mono text-slate-800">{recipe.ingredients.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Ingredients</p>
          </Card>
          <Card className="p-3 text-center">
            <div className="flex justify-center mt-1">
              <Badge variant={recipe.active ? 'green' : 'gray'}>{recipe.active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">Status</p>
          </Card>
        </div>

        <Card className="p-4">
          <SectionHeader title="Ingredients (BOM)" action="Add" />
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-slate-500">{ing.itemName[0]}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{ing.itemName}</p>
                <p className="text-xs text-slate-400">per serving</p>
              </div>
              <p className="font-mono font-semibold text-slate-700 text-sm">{ing.quantity} {ing.unit}</p>
            </div>
          ))}
        </Card>

        <div className="p-4 bg-blue-50 rounded-2xl">
          <p className="text-xs font-semibold text-blue-700 mb-1">How BOM deductions work</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Each sale of <strong>{recipe.name}</strong> automatically deducts the listed quantities from your theoretical inventory when you confirm a POS scan report. Physical stock is only updated through manual counts.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pb-4">
          <button onClick={() => navigate('edit-recipe', { recipeId: recipe.id })}
            className="flex flex-col items-center gap-1.5 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700">
            <Pencil size={16} /> Edit
          </button>
          <button className="flex flex-col items-center gap-1.5 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700">
            <Copy size={16} /> Duplicate
          </button>
          <button className="flex flex-col items-center gap-1.5 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500">
            <Archive size={16} /> Archive
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared ingredient editor rows ───────────────────────────────────────────

function IngredientRow({ ing, showPicker, onTogglePicker, onUpdate, onRemove, canRemove }: {
  ing: DraftIngredient
  showPicker: boolean
  onTogglePicker: () => void
  onUpdate: (patch: Partial<DraftIngredient>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const opt = INGREDIENT_OPTIONS.find(o => o.id === ing.itemId)
  const lineTotal = opt && ing.quantity ? opt.cost * parseFloat(ing.quantity) : 0

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <button onClick={onTogglePicker}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs flex items-center justify-between">
            <span className={ing.itemName ? 'text-slate-800 font-medium' : 'text-slate-300'}>
              {ing.itemName || 'Select ingredient'}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {showPicker && (
            <div className="mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm z-10 relative">
              {INGREDIENT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => onUpdate({ itemId: opt.id, itemName: opt.name, unit: opt.unit })}
                  className={`w-full text-left px-3 py-2 text-xs border-b border-slate-50 last:border-0 flex items-center justify-between
                    ${opt.id === ing.itemId ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-700'}`}>
                  <span>{opt.name}</span>
                  <span className="text-slate-400">€{opt.cost.toFixed(2)}/{opt.unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {canRemove && (
          <button onClick={onRemove} className="p-1.5 text-slate-300 active:text-red-400 flex-shrink-0">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Qty per serving</label>
          <input type="number" value={ing.quantity} onChange={e => onUpdate({ quantity: e.target.value })}
            placeholder="0.00"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div className="w-20">
          <label className="text-xs text-slate-400 mb-1 block">Unit</label>
          <select value={ing.unit} onChange={e => onUpdate({ unit: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {lineTotal > 0 && (
        <p className="text-xs text-slate-400 mt-1.5">≈ €{lineTotal.toFixed(3)} per serving</p>
      )}
    </Card>
  )
}

// ─── Create Recipe ────────────────────────────────────────────────────────────

export function CreateRecipeScreen() {
  const { goBack, platform } = useApp()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [active, setActive] = useState(true)
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([
    { id: '1', itemId: '', itemName: '', quantity: '', unit: 'kg' }
  ])
  const [showIngredientPicker, setShowIngredientPicker] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const canSave = name.trim().length > 0 && category.length > 0 &&
    ingredients.some(i => i.itemId && parseFloat(i.quantity) > 0)

  const estimatedCost = ingredients.reduce((sum, ing) => {
    const opt = INGREDIENT_OPTIONS.find(o => o.id === ing.itemId)
    return sum + (opt && ing.quantity ? opt.cost * parseFloat(ing.quantity) : 0)
  }, 0)

  const addIng = () => setIngredients(prev => [...prev, { id: Date.now().toString(), itemId: '', itemName: '', quantity: '', unit: 'kg' }])
  const removeIng = (id: string) => setIngredients(prev => prev.filter(i => i.id !== id))
  const updateIng = (id: string, patch: Partial<DraftIngredient>) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
    if (patch.itemId) setShowIngredientPicker(null)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white px-8 gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <Check size={36} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Recipe Created</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            "{name}" has been added to your recipe library and is now active for POS deductions.
          </p>
        </div>
        <button onClick={goBack} className="w-full py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white">
          Back to Recipes
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-1 text-slate-600">
            {platform === 'ios'
              ? <><ArrowLeft size={18} /><span className="text-sm font-medium">Cancel</span></>
              : <X size={20} />
            }
          </button>
          <h1 className="text-base font-bold text-slate-900">New Recipe</h1>
          <button disabled={!canSave} onClick={() => setSaved(true)}
            className={`text-sm font-bold ${canSave ? 'text-emerald-600' : 'text-slate-300'}`}>
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Recipe Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Menu 1 — Chicken Plate"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Category</label>
            <button onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm flex items-center justify-between">
              <span className={category ? 'text-slate-900' : 'text-slate-300'}>{category || 'Select category'}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {showCategoryPicker && (
              <div className="mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => { setCategory(cat); setShowCategoryPicker(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between
                      ${cat === category ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-700'}`}>
                    {cat}{cat === category && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Active for POS Deductions</p>
              <p className="text-xs text-slate-400 mt-0.5">Sales deduct ingredients from theoretical stock</p>
            </div>
            <button onClick={() => setActive(!active)}
              className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Ingredients (BOM)</h2>
            {estimatedCost > 0 && (
              <span className="text-xs font-mono font-bold text-emerald-700">€{estimatedCost.toFixed(2)} est. / serving</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {ingredients.map(ing => (
              <IngredientRow key={ing.id} ing={ing}
                showPicker={showIngredientPicker === ing.id}
                onTogglePicker={() => setShowIngredientPicker(showIngredientPicker === ing.id ? null : ing.id)}
                onUpdate={patch => updateIng(ing.id, patch)}
                onRemove={() => removeIng(ing.id)}
                canRemove={ingredients.length > 1}
              />
            ))}
            <button onClick={addIng}
              className="flex items-center gap-2 py-3 px-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-500 font-medium">
              <Plus size={16} /> Add ingredient
            </button>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Note:</strong> Each sale of this recipe deducts the listed ingredient quantities from your theoretical inventory when you confirm a POS scan.
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-slate-100">
        <button disabled={!canSave} onClick={() => setSaved(true)}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-colors ${
            canSave ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
          }`}>
          Create Recipe
        </button>
      </div>
    </div>
  )
}

// ─── Edit Recipe ──────────────────────────────────────────────────────────────

export function EditRecipeScreen() {
  const { goBack, params } = useApp()
  const source = recipes.find(r => r.id === params.recipeId) ?? recipes[0]

  const [name, setName] = useState(source.name)
  const [category, setCategory] = useState(source.category)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [active, setActive] = useState(source.active)
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    source.ingredients.map((ing, i) => ({
      id: i.toString(),
      itemId: ing.itemId,
      itemName: ing.itemName,
      quantity: ing.quantity.toString(),
      unit: ing.unit,
    }))
  )
  const [showIngredientPicker, setShowIngredientPicker] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const canSave = name.trim().length > 0

  const estimatedCost = ingredients.reduce((sum, ing) => {
    const opt = INGREDIENT_OPTIONS.find(o => o.id === ing.itemId)
    return sum + (opt && ing.quantity ? opt.cost * parseFloat(ing.quantity) : 0)
  }, 0)

  const addIng = () => setIngredients(prev => [...prev, { id: Date.now().toString(), itemId: '', itemName: '', quantity: '', unit: 'kg' }])
  const removeIng = (id: string) => setIngredients(prev => prev.filter(i => i.id !== id))
  const updateIng = (id: string, patch: Partial<DraftIngredient>) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
    if (patch.itemId) setShowIngredientPicker(null)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white px-8 gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <Check size={36} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Recipe Updated</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Changes to "{name}" have been saved and are active for future POS deductions.
          </p>
        </div>
        <button onClick={goBack} className="w-full py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white">
          Back to Recipe
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-1 text-slate-600">
            <ArrowLeft size={18} /><span className="text-sm font-medium">Cancel</span>
          </button>
          <h1 className="text-base font-bold text-slate-900">Edit Recipe</h1>
          <button disabled={!canSave} onClick={() => setSaved(true)}
            className={`text-sm font-bold ${canSave ? 'text-emerald-600' : 'text-slate-300'}`}>
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Recipe Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Category</label>
            <button onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm flex items-center justify-between">
              <span className="text-slate-900">{category}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {showCategoryPicker && (
              <div className="mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => { setCategory(cat); setShowCategoryPicker(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between
                      ${cat === category ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-700'}`}>
                    {cat}{cat === category && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Active for POS Deductions</p>
              <p className="text-xs text-slate-400 mt-0.5">Sales deduct ingredients from theoretical stock</p>
            </div>
            <button onClick={() => setActive(!active)}
              className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Ingredients (BOM)</h2>
            {estimatedCost > 0 && (
              <span className="text-xs font-mono font-bold text-emerald-700">€{estimatedCost.toFixed(2)} est. / serving</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {ingredients.map(ing => (
              <IngredientRow key={ing.id} ing={ing}
                showPicker={showIngredientPicker === ing.id}
                onTogglePicker={() => setShowIngredientPicker(showIngredientPicker === ing.id ? null : ing.id)}
                onUpdate={patch => updateIng(ing.id, patch)}
                onRemove={() => removeIng(ing.id)}
                canRemove={ingredients.length > 1}
              />
            ))}
            <button onClick={addIng}
              className="flex items-center gap-2 py-3 px-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-500 font-medium">
              <Plus size={16} /> Add ingredient
            </button>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Caution:</strong> Changing ingredient quantities affects future POS deductions. Past deductions are not retroactively adjusted.
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-slate-100 flex flex-col gap-2">
        <button disabled={!canSave} onClick={() => setSaved(true)}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-colors ${
            canSave ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
          }`}>
          Save Changes
        </button>
        <button onClick={goBack} className="w-full py-3 text-sm font-semibold text-slate-500 text-center">
          Discard Changes
        </button>
      </div>
    </div>
  )
}
