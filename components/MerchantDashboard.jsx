'use client'
import { useState, useEffect } from 'react'
import { getMerchantDashboardStats, getDeals, createDeal, updateDeal, getCategories } from '../lib/supabase-admin'

const THEME = {
  colors: {
    primary: '#8B1F24', secondary: '#D4A843', background: '#080608', surface: '#111015', 
    card: '#18141F', border: '#374151', text: '#F0EDE8', textSecondary: '#9CA3AF', 
    success: '#10B981', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6'
  },
  gradients: { primary: 'linear-gradient(135deg, #8B1F24, #A62028)' },
  radius: { sm: 8, md: 12, lg: 16, xl: 24 }
}

function StatCard({ title, value, icon, color = THEME.colors.primary, loading }) {
  return (
    <div style={{
      background: THEME.colors.surface, borderRadius: THEME.radius.lg, padding: '20px',
      border: `1px solid ${THEME.colors.border}`, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 60, opacity: 0.1, color: color }}>{icon}</div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: THEME.colors.textSecondary, fontWeight: 600 }}>{title}</span>
          <span style={{ fontSize: 20, color: color }}>{icon}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: THEME.colors.text, marginBottom: 4 }}>
          {loading ? '...' : value}
        </div>
      </div>
    </div>
  )
}

export default function MerchantDashboard({ merchant, onLogout, language = 'ar' }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({})
  const [deals, setDeals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState({ stats: false, deals: false })
  const [dealForm, setDealForm] = useState({
    title: '', original_price: '', final_price: '', max_coupons: '', category_id: '', expires_at: '', description: ''
  })
  const [dealFormVisible, setDealFormVisible] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    if (merchant?.id) loadDashboardData()
  }, [merchant])

  const loadDashboardData = async () => {
    await Promise.all([loadStats(), loadDeals(), loadCategories()])
  }

  const loadStats = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }))
      const result = await getMerchantDashboardStats(merchant.id)
      setStats(result.data || {})
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }

  const loadDeals = async () => {
    try {
      setLoading(prev => ({ ...prev, deals: true }))
      const result = await getDeals()
      if (result.data) {
        setDeals(result.data.filter(deal => deal.merchant_id === merchant.id))
      }
    } finally {
      setLoading(prev => ({ ...prev, deals: false }))
    }
  }

  const loadCategories = async () => {
    const result = await getCategories()
    setCategories(result.data || [])
  }

  const handleDealSubmit = async (e) => {
    e.preventDefault()
    try {
      await createDeal({
        ...dealForm,
        merchant_id: merchant.id,
        original_price: parseFloat(dealForm.original_price),
        final_price: parseFloat(dealForm.final_price),
        max_coupons: parseInt(dealForm.max_coupons),
        is_active: true,
        currency: 'QAR'
      })
      showNotification('تم إضافة العرض بنجاح')
      setDealFormVisible(false)
      setDealForm({ title: '', original_price: '', final_price: '', max_coupons: '', category_id: '', expires_at: '', description: '' })
      loadDeals()
    } catch (error) {
      showNotification('فشل في إضافة العرض', 'error')
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-QA', { style: 'currency', currency: 'QAR' })
      .format(amount).replace('QAR', 'ر.ق')
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.colors.background, color: THEME.colors.text }}>
      {/* Header */}
      <div style={{
        background: THEME.colors.surface, borderBottom: `1px solid ${THEME.colors.border}`,
        padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 40, height: 40, background: THEME.gradients.primary, borderRadius: THEME.radius.md,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>🏪</div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>لوحة التاجر</h1>
              <p style={{ fontSize: 12, color: THEME.colors.textSecondary, margin: 0 }}>
                {merchant?.name || 'اسم المتجر'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              padding: '6px 12px', borderRadius: THEME.radius.md,
              background: merchant?.status === 'active' ? `${THEME.colors.success}20` : `${THEME.colors.warning}20`,
              border: `1px solid ${merchant?.status === 'active' ? THEME.colors.success : THEME.colors.warning}40`,
              fontSize: 11, fontWeight: 600,
              color: merchant?.status === 'active' ? THEME.colors.success : THEME.colors.warning
            }}>● {merchant?.status === 'active' ? 'نشط' : 'قيد المراجعة'}</div>
            <button onClick={onLogout} style={{
              padding: '8px 12px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}`,
              background: 'none', color: THEME.colors.textSecondary, cursor: 'pointer', fontSize: 12
            }}>👋 خروج</button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ background: THEME.colors.surface, borderBottom: `1px solid ${THEME.colors.border}`, padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { key: 'dashboard', label: 'الرئيسية', icon: '📊' },
            { key: 'deals', label: 'عروضي', icon: '🎯' },
            { key: 'profile', label: 'الملف الشخصي', icon: '👤' }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '16px 0', border: 'none', background: 'none',
              color: activeTab === tab.key ? THEME.colors.primary : THEME.colors.textSecondary,
              fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 500, cursor: 'pointer',
              borderBottom: activeTab === tab.key ? `2px solid ${THEME.colors.primary}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>نظرة عامة</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
              <StatCard title="إجمالي العروض" value={stats.total_deals || 0} icon="🎯" loading={loading.stats} />
              <StatCard title="الكوبونات المطلوبة" value={stats.total_claims || 0} icon="🎫" color={THEME.colors.info} loading={loading.stats} />
              <StatCard title="الكوبونات المستخدمة" value={stats.total_redemptions || 0} icon="✅" color={THEME.colors.success} loading={loading.stats} />
              <StatCard title="إجمالي الإيرادات" value={formatCurrency(stats.total_revenue || 0)} icon="💰" color={THEME.colors.secondary} loading={loading.stats} />
            </div>
          </div>
        )}

        {/* Deals Tab */}
        {activeTab === 'deals' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>إدارة العروض ({deals.length})</h2>
              <button onClick={() => setDealFormVisible(true)} style={{
                padding: '12px 20px', borderRadius: THEME.radius.md, border: 'none',
                background: THEME.gradients.primary, color: 'white', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span>➕</span><span>إضافة عرض جديد</span>
              </button>
            </div>

            {/* Deal Form Modal */}
            {dealFormVisible && (
              <>
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.8)', zIndex: 999
                }} onClick={() => setDealFormVisible(false)} />
                <div style={{
                  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  background: THEME.colors.surface, borderRadius: THEME.radius.xl, padding: '24px',
                  width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
                  border: `1px solid ${THEME.colors.border}`, zIndex: 1000
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>إضافة عرض جديد</h3>
                    <button onClick={() => setDealFormVisible(false)} style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none',
                      background: THEME.colors.textMuted, color: 'white', cursor: 'pointer'
                    }}>✕</button>
                  </div>

                  <form onSubmit={handleDealSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
                          عنوان العرض *
                        </label>
                        <input type="text" value={dealForm.title} onChange={(e) => setDealForm(prev => ({ ...prev, title: e.target.value }))}
                          required placeholder="مثال: برجر شيف + بطاطس + مشروب" style={{
                            width: '100%', padding: '10px 12px', borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.border}`, background: THEME.colors.card,
                            color: THEME.colors.text, fontSize: 13, outline: 'none'
                          }} />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
                          الفئة *
                        </label>
                        <select value={dealForm.category_id} onChange={(e) => setDealForm(prev => ({ ...prev, category_id: e.target.value }))}
                          required style={{
                            width: '100%', padding: '10px 12px', borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.border}`, background: THEME.colors.card,
                            color: THEME.colors.text, fontSize: 13, outline: 'none'
                          }}>
                          <option value="">اختر الفئة</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name_ar || category.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
                          السعر الأصلي *
                        </label>
                        <input type="number" value={dealForm.original_price}
                          onChange={(e) => setDealForm(prev => ({ ...prev, original_price: e.target.value }))}
                          required min="0" step="0.01" placeholder="50.00" style={{
                            width: '100%', padding: '10px 12px', borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.border}`, background: THEME.colors.card,
                            color: THEME.colors.text, fontSize: 13, outline: 'none'
                          }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
                          السعر بعد الخصم *
                        </label>
                        <input type="number" value={dealForm.final_price}
                          onChange={(e) => setDealForm(prev => ({ ...prev, final_price: e.target.value }))}
                          required min="0" step="0.01" placeholder="35.00" style={{
                            width: '100%', padding: '10px 12px', borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.border}`, background: THEME.colors.card,
                            color: THEME.colors.text, fontSize: 13, outline: 'none'
                          }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
                          عدد الكوبونات *
                        </label>
                        <input type="number" value={dealForm.max_coupons}
                          onChange={(e) => setDealForm(prev => ({ ...prev, max_coupons: e.target.value }))}
                          required min="1" placeholder="100" style={{
                            width: '100%', padding: '10px 12px', borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.border}`, background: THEME.colors.card,
                            color: THEME.colors.text, fontSize: 13, outline: 'none'
                          }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
                          تاريخ الانتهاء *
                        </label>
                        <input type="datetime-local" value={dealForm.expires_at}
                          onChange={(e) => setDealForm(prev => ({ ...prev, expires_at: e.target.value }))}
                          required style={{
                            width: '100%', padding: '10px 12px', borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.border}`, background: THEME.colors.card,
                            color: THEME.colors.text, fontSize: 13, outline: 'none'
                          }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
                        وصف العرض
                      </label>
                      <textarea value={dealForm.description}
                        onChange={(e) => setDealForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف تفصيلي للعرض" rows={3} style={{
                          width: '100%', padding: '10px 12px', borderRadius: THEME.radius.md,
                          border: `1px solid ${THEME.colors.border}`, background: THEME.colors.card,
                          color: THEME.colors.text, fontSize: 13, outline: 'none', resize: 'vertical'
                        }} />
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setDealFormVisible(false)} style={{
                        padding: '12px 20px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}`,
                        background: 'none', color: THEME.colors.text, fontSize: 14, cursor: 'pointer'
                      }}>إلغاء</button>
                      <button type="submit" style={{
                        padding: '12px 20px', borderRadius: THEME.radius.md, border: 'none',
                        background: THEME.gradients.primary, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                      }}>إضافة العرض</button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {/* Deals List */}
            <div style={{ background: THEME.colors.surface, borderRadius: THEME.radius.lg, border: `1px solid ${THEME.colors.border}`, overflow: 'hidden' }}>
              {loading.deals ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
                  <p style={{ color: THEME.colors.textSecondary }}>جاري تحميل العروض...</p>
                </div>
              ) : deals.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎯</div>
                  <h3 style={{ marginBottom: 8 }}>لا توجد عروض</h3>
                  <p style={{ color: THEME.colors.textSecondary, fontSize: 14 }}>ابدأ بإضافة عرضك الأول</p>
                  <button onClick={() => setDealFormVisible(true)} style={{
                    marginTop: 16, padding: '10px 16px', borderRadius: THEME.radius.md, border: 'none',
                    background: THEME.gradients.primary, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}>➕ إضافة عرض</button>
                </div>
              ) : (
                <div style={{ padding: '20px' }}>
                  {deals.map(deal => (
                    <div key={deal.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px',
                      border: `1px solid ${THEME.colors.border}`, borderRadius: THEME.radius.md,
                      background: THEME.colors.card, marginBottom: 12
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{deal.title}</div>
                        <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 8 }}>
                          💰 {formatCurrency(deal.original_price)} → {formatCurrency(deal.final_price)} • 
                          🎫 {deal.remaining_coupons}/{deal.max_coupons} • 
                          📅 {new Date(deal.expires_at).toLocaleDateString('ar-SA')}
                        </div>
                        <span style={{
                          padding: '2px 8px', borderRadius: THEME.radius.sm, fontSize: 10, fontWeight: 600,
                          background: deal.is_active ? `${THEME.colors.success}20` : `${THEME.colors.textMuted}20`,
                          color: deal.is_active ? THEME.colors.success : THEME.colors.textMuted
                        }}>{deal.is_active ? '● نشط' : '● غير نشط'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>الملف الشخصي</h2>
            <div style={{ background: THEME.colors.surface, borderRadius: THEME.radius.lg, border: `1px solid ${THEME.colors.border}`, padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
                {[
                  { label: 'اسم المتجر', value: merchant?.name },
                  { label: 'البريد الإلكتروني', value: merchant?.email },
                  { label: 'رقم الهاتف', value: merchant?.phone },
                  { label: 'حالة المتجر', value: merchant?.status === 'active' ? 'متجر نشط' : 'قيد المراجعة' }
                ].map((field, i) => (
                  <div key={i}>
                    <label style={{ display: 'block', fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
                      {field.label}
                    </label>
                    <div style={{
                      padding: '12px 16px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}`,
                      background: THEME.colors.card, fontSize: 14
                    }}>{field.value || 'غير محدد'}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>العنوان</label>
                <div style={{
                  padding: '12px 16px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}`,
                  background: THEME.colors.card, fontSize: 14, lineHeight: 1.5
                }}>{merchant?.address || 'عنوان المتجر'}</div>
              </div>

              <div style={{
                marginTop: 32, padding: '16px', background: `${THEME.colors.info}15`,
                border: `1px solid ${THEME.colors.info}30`, borderRadius: THEME.radius.md
              }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: THEME.colors.info, marginBottom: 8 }}>معلومات مهمة:</h4>
                <ul style={{ fontSize: 13, lineHeight: 1.6, margin: 0, paddingRight: 20 }}>
                  <li>العمولة على كل كوبون مستخدم: 10%</li>
                  <li>الدفع يتم شهرياً خلال 15 يوم عمل</li>
                  <li>يجب تقديم خدمة عملاء ممتازة</li>
                  <li>الالتزام بجميع العروض المعلنة</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          background: notification.type === 'success' ? THEME.colors.success : THEME.colors.error,
          color: 'white', padding: '12px 16px', borderRadius: THEME.radius.md,
          fontSize: 14, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
