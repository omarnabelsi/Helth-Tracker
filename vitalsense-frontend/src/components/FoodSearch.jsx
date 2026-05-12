import { useState, useCallback, useRef, useEffect } from 'react'
import { debounce } from 'lodash'
import { supabase } from '../lib/supabase'
import { Search, Loader2, Sparkles } from 'lucide-react'

import { isFoodValidForMeal, getSuggestionsForMeal, MEAL_TIMES } from '../data/mealTimeRules'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FoodSearch = ({ onSelect, mealType }) => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState('')
  const [searchError, setSearchError] = useState('')

  // Cache to avoid repeat API calls
  const cache = useRef({})

  const doSearch = useCallback(
    debounce(async (q) => {
      if (!q.trim() || q.length < 2) {
        setResults([])
        setSource('')
        setSearchError('')
        return
      }

      if (cache.current[q]) {
        setResults(cache.current[q].results)
        setSource(cache.current[q].source)
        setLoading(false)
        return
      }

      setLoading(true)
      setSearchError('')
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(
          `${API_BASE}/api/search-food?query=${encodeURIComponent(q)}`,
          {
            headers: { Authorization: `Bearer ${session?.access_token}` },
            signal: controller.signal
          }
        )
        const data = await res.json()
        cache.current[q] = data
        setResults(data.results || [])
        setSource(data.source)
      } catch (err) {
        if (err.name === 'AbortError') {
          setSearchError(isAr ? 'انتهت مهلة البحث. حاول مرة أخرى.' : 'Search timed out. Please try again.')
        } else {
          console.error('Search error:', err)
          setSearchError(isAr ? 'تعذّر الاتصال بالخادم.' : 'Could not reach the server.')
        }
        setResults([])
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    }, 500),
    [isAr]
  )

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setSearchError('')
    if (val.length >= 2) {
      setLoading(true)
      doSearch(val)
    } else {
      setResults([])
      setSource('')
      setLoading(false)
    }
  }

  const sourceBadge = {
    local: { label: isAr ? 'لبناني 🇱🇧' : 'Lebanese 🇱🇧', color: 'text-green-600', bg: 'bg-green-50' },
    usda: { label: isAr ? 'قاعدة بيانات عالمية 🌍' : 'Global DB 🌍', color: 'text-blue-600', bg: 'bg-blue-50' },
    gemini: { label: isAr ? 'تقدير الذكاء الاصطناعي 🤖' : 'AI Estimate 🤖', color: 'text-purple-600', bg: 'bg-purple-50' },
    none: { label: isAr ? 'لم يتم العثور' : 'Not found', color: 'text-gray-500', bg: 'bg-gray-50' }
  }

  const suggestions = mealType ? getSuggestionsForMeal(mealType, isAr ? 'ar' : 'en') : [
    'Shawarma', 'Grilled Chicken', 'Hummus', 'Falafel', 'Tabboula', 'Kafta', 'Lentil Soup', 'Oats', 'Eggs'
  ]

  const mealInfo = mealType ? MEAL_TIMES[mealType] : null

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* Search Input */}
      <div className="relative mb-4 flex-shrink-0">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
          <Search size={18} />
        </div>
        <input
          value={query}
          onChange={handleChange}
          placeholder={isAr ? 'ابحث عن أي طبق...' : 'Search any dish in the world...'}
          className="w-full pl-11 pr-11 py-3.5 bg-bg-main border border-gray-100 rounded-2xl text-text-primary text-sm focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all placeholder:text-text-light"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 size={18} className="text-primary-accent animate-spin" />
          </div>
        )}
      </div>

      {/* Source Indicator */}
      {source && results.length > 0 && (
        <div className="mb-3 px-1 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sourceBadge[source]?.color} ${sourceBadge[source]?.bg}`}>
            {sourceBadge[source]?.label}
          </span>
        </div>
      )}

      {/* Suggestions or Results scroll area */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
        {!query && (
          <div className="animate-fade-in">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3 px-1">
              {mealType 
                ? (isAr ? `مقترحات لـ ${mealInfo?.labelAr}:` : `Best for ${mealInfo?.label}:`)
                : (isAr ? 'خيارات لبنانية شائعة' : 'Popular Lebanese Choices')}
            </p>
            <div className="flex flex-wrap gap-2 mb-4 px-1">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); doSearch(s) }}
                  className="bg-primary-pale border border-primary-accent/10 hover:border-primary-accent/30 rounded-xl px-4 py-2 text-xs text-text-muted hover:text-primary-accent transition-all"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Meal rule hint */}
            {mealInfo && (
              <div className="mb-4 p-3 bg-primary-pale/50 border border-primary-accent/10 rounded-xl">
                <p className="text-[10px] text-primary-accent font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  {isAr ? 'نصيحة ذكية' : 'Smart Tip'}
                </p>
                <p className="text-[11px] text-text-muted">
                  {isAr ? mealInfo.descriptionAr : mealInfo.description}
                </p>
              </div>
            )}

            {/* What NOT to show hints */}
            {mealType === 'breakfast' && (
              <div className="mb-4 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <p className="text-[11px] text-red-500">
                  ⚠️ {isAr ? 'لن تظهر: البيتزا، الشاورما، الأطباق الثقيلة — غير مناسبة للفطور' : 'Filtered out: pizza, heavy stews, fried meals — not appropriate for breakfast'}
                </p>
              </div>
            )}
            {mealType === 'snack' && (
              <div className="mb-4 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <p className="text-[11px] text-red-500">
                  ⚠️ {isAr ? 'الوجبة الخفيفة يجب أن تكون أقل من 300 سعرة — الأطباق الثقيلة محجوبة' : 'Snacks must be under 300 kcal — heavy meals are blocked'}
                </p>
              </div>
            )}
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="space-y-2 px-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-bg-main rounded-xl p-4 flex justify-between items-center animate-pulse">
                <div className="space-y-2">
                  <div className="w-32 h-3 bg-gray-200 rounded"></div>
                  <div className="w-24 h-2 bg-gray-100 rounded"></div>
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-2 px-1 pb-4">
            {results
              .filter(food => {
                if (!mealType) return true
                const check = isFoodValidForMeal(food.name, mealType)
                return check.valid
              })
              .map((food, i) => (
              <button
                key={food.id || i}
                onClick={() => onSelect(food)}
                className="w-full text-left bg-bg-main border border-gray-100 hover:border-primary-accent/40 rounded-2xl p-4 transition-all hover:shadow-md flex justify-between items-center group"
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-text-primary mb-1 group-hover:text-primary-accent transition-colors truncate">{food.name}</div>
                  <div className="text-[11px] text-text-muted">
                    P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g · per {food.serving}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-lg font-bold text-primary-accent font-heading">{food.calories}</div>
                  <div className="text-[9px] text-text-light font-bold uppercase tracking-tighter">kcal</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && searchError && (
          <div className="text-center py-10 px-6">
            <div className="text-3xl mb-3 opacity-50">⚠️</div>
            <p className="text-sm font-bold text-orange-500 mb-1">{searchError}</p>
            <p className="text-xs text-text-muted">Try searching for a Lebanese dish — it works offline!</p>
          </div>
        )}

        {!loading && !searchError && query.length > 1 && results.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="text-4xl mb-4 opacity-40">🥗</div>
            <p className="text-sm font-bold text-text-primary mb-1">No results for "{query}"</p>
            <p className="text-xs text-text-muted">Try a simpler term, or search for a Lebanese dish like Shawarma, Falafel, or Kafta.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FoodSearch
