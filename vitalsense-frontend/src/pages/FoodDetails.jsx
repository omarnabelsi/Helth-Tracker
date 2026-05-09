import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FoodDetails = () => {
  const { t } = useTranslation()
  const { foodName } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const initialData = location.state?.food

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(
          `${API_BASE}/api/food-details?name=${encodeURIComponent(foodName)}`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        )
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setDetails(data)
      } catch (err) {
        console.error('Error fetching food details:', err)
        setError(err.message || t('nutrition.error_loading_details'))
      }
      setLoading(false)
    }

    fetchDetails()
  }, [foodName])

  if (loading && !details) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="w-12 h-12 border-4 border-primary-accent/20 border-t-primary-accent rounded-full animate-spin mb-4"></div>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>{t('nutrition.generating_analysis')}</p>
      </div>
    )
  }

  if (error && !details) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#ff4d4d', marginBottom: '16px' }}>{error}</p>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px 20px', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  const foodData = details || initialData

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'white' }}>{foodName}</h1>
      </div>

      {/* Main Card */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', overflow: 'hidden', marginBottom: '24px' }}>
        {/* Photo Section */}
        <div style={{ position: 'relative', height: '300px', width: '100%', background: '#1a1a1a' }}>
           <img 
            src={details?.image_url || `https://loremflickr.com/800/600/food,${foodName.replace(/\s+/g, '+')}`} 
            alt={foodName} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'
            }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
             <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
               {details?.description || t('nutrition.composition_desc')}
             </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Macros Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
            <div style={{ textAlign: 'center', background: 'rgba(76,175,125,0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(76,175,125,0.1)' }}>
              <div style={{ color: '#4CAF7D', fontWeight: '700', fontSize: '18px' }}>{foodData?.calories || foodData?.macros_per_100g?.calories || 0}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase' }}>{t('dashboard.calories')}</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>{foodData?.protein || foodData?.macros_per_100g?.protein || 0}g</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase' }}>{t('nutrition.protein')}</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>{foodData?.carbs || foodData?.macros_per_100g?.carbs || 0}g</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase' }}>{t('nutrition.carbs')}</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>{foodData?.fat || foodData?.macros_per_100g?.fat || 0}g</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase' }}>{t('nutrition.fat')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Left Column: Ingredients */}
              <div>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4CAF7D' }}>🥗</span> {t('nutrition.main_ingredients')}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {details?.ingredients?.map((ing, i) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                      {ing}
                    </span>
                  ))}
                  {!details && <div style={{ height: '20px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} />}
                </div>
              </div>

              {/* Right Column: Health Benefits */}
              <div>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4CAF7D' }}>✨</span> {t('nutrition.health_benefits')}
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.6' }}>
                  {details?.health_benefits?.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Vitamins & Minerals */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#4CAF7D' }}>🔬</span> {t('nutrition.notable_nutrients')}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {details?.vitamins_minerals?.map((v, i) => (
                  <span key={i} style={{ background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#4CAF7D', fontWeight: '600' }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {details?.warnings && details.warnings.length > 0 && (
              <div style={{ marginTop: '32px', background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.1)', padding: '16px', borderRadius: '16px' }}>
                <h3 style={{ color: '#ff4d4d', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ {t('nutrition.considerations')}
                </h3>
                <p style={{ color: 'rgba(255,77,77,0.7)', fontSize: '12px', margin: 0 }}>
                  {details.warnings.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={() => {
           navigate(-1)
        }}
        style={{ width: '100%', background: 'linear-gradient(135deg, #4CAF7D, #2E7D52)', border: 'none', padding: '16px', borderRadius: '16px', color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(76,175,125,0.3)' }}
      >
        {t('nutrition.back_to_logger')}
      </button>
    </div>
  )
}

export default FoodDetails
