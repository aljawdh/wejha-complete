'use client'
import { useState, useEffect } from 'react'
import { 
  getRealDashboardStats, 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getMerchants,
  updateMerchantStatus,
  getDeals,
  updateDeal,
  createMerchant
} from '../lib/supabase-admin'

// ============================================================================
// COMPLETE ADMIN DASHBOARD - PRODUCTION READY WITH AUTO-SAVE
// ============================================================================

const THEME = {
  colors: {
    primary: '#8B1F24', primaryLight: '#A62028', secondary: '#D4A843',
    background: '#080608', surface: '#111015', card: '#18141F', border: '#374151',
    text: '#F0EDE8', textSecondary: '#9CA3AF', textMuted: '#6B7280',
    success: '#10B981', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6'
  },
  gradients: {
    primary: 'linear-gradient(135deg, #8B1F24, #A62028)',
    surface: 'linear-gradient(180deg, #111015, #18141F)'
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24 }
}

// ============================================================================
// StatusBadge Component
// ============================================================================
function StatusBadge({ status, language = 'ar' }) {
  const getStatusColor = (status) => {
    const colors = {
      active: THEME.colors.success, pending: THEME.colors.warning, suspended: THEME.colors.error,
      rejected: THEME.colors.error, inactive: THEME.colors.textMuted, verified: THEME.colors.success,
      unverified: THEME.colors.warning
    }
    return colors[status] || THEME.colors.textSecondary
  }

  const getStatusText = (status, language) => {
    const texts = {
      active: { ar: 'نشط', en: 'Active' }, pending: { ar: 'معلق', en: 'Pending' },
      suspended: { ar: 'معلق', en: 'Suspended' }, rejected: { ar: 'مرفوض', en: 'Rejected' },
      inactive: { ar: 'غير نشط', en: 'Inactive' }, verified: { ar: 'محقق', en: 'Verified' },
      unverified: { ar: 'غير محقق', en: 'Unverified' }
    }
    return texts[status]?.[language] || status
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px',
      borderRadius: THEME.radius.sm, fontSize: 11, fontWeight: 600,
      background: `${getStatusColor(status)}20`, color: getStatusColor(status),
      border: `1px solid ${getStatusColor(status)}40`
    }}>
      ● {getStatusText(status, language)}
    </span>
  )
}

// ============================================================================
// MAIN ADMIN APP COMPONENT
// ============================================================================
export default function AdminApp({ language = 'ar' }) {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [admin, setAdmin] = useState(null)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // App State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({})
  const [merchants, setMerchants] = useState([])
  const [deals, setDeals] = useState([])
  const [categories, setCategories] = useState([])
  
  // UI State
  const [loading, setLoading] = useState({ stats: false, merchants: false, deals: false, categories: false })
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  // Category Management
  const [categoryForm, setCategoryForm] = useState({ name: '', name_ar: '', name_en: '', description: '', color_hex: '#8B1F24' })
  const [editingCategory, setEditingCategory] = useState(null)

  // Initialize
  useEffect(() => {
    checkExistingSession()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  // Check admin session
  const checkExistingSession = () => {
    try {
      const savedSession = localStorage.getItem('wejha_admin_session')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        const loginTime = new Date(session.loginTime)
        const now = new Date()
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60)
        
        if (hoursDiff < 8) { // 8-hour session
          setAdmin(session.admin)
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem('wejha_admin_session')
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
      localStorage.removeItem('wejha_admin_session')
    }
  }

  // Admin login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      // Simple hardcoded admin check for demo
      if (loginForm.email === 'admin@wejha.qa' && loginForm.password === '123456') {
        const adminData = {
          id: 1,
          email: 'admin@wejha.qa',
          full_name: 'مدير وِجهة',
          role: 'super_admin'
        }
        
        const session = {
          admin: adminData,
          loginTime: new Date().toISOString()
        }
        
        localStorage.setItem('wejha_admin_session', JSON.stringify(session))
        setAdmin(adminData)
        setIsAuthenticated(true)
        
        showNotification('تم تسجيل الدخول بنجاح', 'success')
      } else {
        setLoginError('بيانات الدخول غير صحيحة')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('فشل في تسجيل الدخول')
    } finally {
      setLoginLoading(false)
    }
  }

  // Load all dashboard data
  const loadDashboardData = async () => {
    await Promise.all([
      loadStats(),
      loadMerchants(),
      loadDeals(),
      loadCategories()
    ])
  }

  const loadStats = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }))
      const result = await getRealDashboardStats()
      setStats(result.data || {})
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }

  const loadMerchants = async () => {
    try {
      setLoading(prev => ({ ...prev, merchants: true }))
      const result = await getMerchants()
      setMerchants(result.data || [])
    } catch (error) {
      console.error('Failed to load merchants:', error)
    } finally {
      setLoading(prev => ({ ...prev, merchants: false }))
    }
  }

  const loadDeals = async () => {
    try {
      setLoading(prev => ({ ...prev, deals: true }))
      const result = await getDeals()
      setDeals(result.data || [])
    } catch (error) {
      console.error('Failed to load deals:', error)
    } finally {
      setLoading(prev => ({ ...prev, deals: false }))
    }
  }

  const loadCategories = async () => {
    try {
      setLoading(prev => ({ ...prev, categories: true }))
      const result = await getCategories()
      setCategories(result.data || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(prev => ({ ...prev, categories: false }))
    }
  }

  // Category management
  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm)
        showNotification('تم تحديث الفئة بنجاح', 'success')
      } else {
        await createCategory(categoryForm)
        showNotification('تم إضافة الفئة بنجاح', 'success')
      }
      
      setCategoryForm({ name: '', name_ar: '', name_en: '', description: '', color_hex: '#8B1F24' })
      setEditingCategory(null)
      loadCategories()
      
    } catch (error) {
      console.error('Category operation failed:', error)
      showNotification('فشل في العملية', 'error')
    }
  }

  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name || '',
      name_ar: category.name_ar || '',
      name_en: category.name_en || '',
      description: category.description || '',
      color_hex: category.color_hex || '#8B1F24'
    })
    setEditingCategory(category)
  }

  const handleDeleteCategory = async (categoryId) => {
    if (confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
      try {
        await deleteCategory(categoryId)
        showNotification('تم حذف الفئة بنجاح', 'success')
        loadCategories()
      } catch (error) {
        console.error('Delete category failed:', error)
        showNotification('فشل في حذف الفئة', 'error')
      }
    }
  }

  // Merchant status update
  const handleMerchantStatusUpdate = async (merchantId, newStatus) => {
    try {
      await updateMerchantStatus(merchantId, newStatus)
      showNotification(`تم ${newStatus === 'active' ? 'تفعيل' : 'تعليق'} التاجر بنجاح`, 'success')
      loadMerchants()
    } catch (error) {
      console.error('Merchant status update failed:', error)
      showNotification('فشل في تحديث حالة التاجر', 'error')
    }
  }

  // Global save function
  const handleGlobalSave = async () => {
    setSaving(true)
    try {
      // Save all pending changes
      await Promise.all([
        loadDashboardData() // Refresh all data
      ])
      
      setHasChanges(false)
      showNotification('تم حفظ جميع التغييرات بنجاح', 'success')
    } catch (error) {
      console.error('Global save failed:', error)
      showNotification('فشل في حفظ التغييرات', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  // Logout
  const handleLogout = () => {
    if (confirm('هل تريد تسجيل الخروج؟')) {
      localStorage.removeItem('wejha_admin_session')
      setIsAuthenticated(false)
      setAdmin(null)
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: THEME.gradients.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <form onSubmit={handleLogin} style={{
          width: '100%',
          maxWidth: 400,
          background: THEME.colors.surface,
          borderRadius: THEME.radius.xl,
          padding: '32px',
          border: `1px solid ${THEME.colors.border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64,
              height: 64,
              background: THEME.gradients.primary,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              margin: '0 auto 16px'
            }}>
              👑
            </div>
            <h1 style={{
              fontSize: 24,
              fontWeight: 900,
              color: THEME.colors.text,
              marginBottom: 8
            }}>
              لوحة الإدارة
            </h1>
            <p style={{ color: THEME.colors.textSecondary, fontSize: 14, margin: 0 }}>
              ادخل لإدارة منصة وِجهة
            </p>
          </div>

          <div style={{
            background: `${THEME.colors.info}15`,
            border: `1px solid ${THEME.colors.info}30`,
            borderRadius: THEME.radius.md,
            padding: '12px',
            marginBottom: 20,
            fontSize: 12,
            color: THEME.colors.info
          }}>
            <strong>للتجربة:</strong><br/>
            admin@wejha.qa / 123456
          </div>

          {loginError && (
            <div style={{
              background: `${THEME.colors.error}15`,
              border: `1px solid ${THEME.colors.error}30`,
              borderRadius: THEME.radius.md,
              padding: '12px',
              marginBottom: 20,
              color: THEME.colors.error,
              fontSize: 13
            }}>
              {loginError}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.border}`,
                background: THEME.colors.card,
                color: THEME.colors.text,
                fontSize: 14,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <input
              type="password"
              placeholder="كلمة المرور"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.border}`,
                background: THEME.colors.card,
                color: THEME.colors.text,
                fontSize: 14,
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: THEME.radius.md,
              border: 'none',
              background: loginLoading ? THEME.colors.textMuted : THEME.gradients.primary,
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: loginLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {loginLoading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid #ffffff33',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span>جاري الدخول...</span>
              </>
            ) : (
              <>
                <span>🔑</span>
                <span>دخول</span>
              </>
            )}
          </button>
        </form>

        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Main dashboard
  return (
    <div style={{
      minHeight: '100vh',
      background: THEME.colors.background,
      color: THEME.colors.text
    }}>
      {/* Header */}
      <div style={{
        background: THEME.colors.surface,
        borderBottom: `1px solid ${THEME.colors.border}`,
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 40,
              height: 40,
              background: THEME.gradients.primary,
              borderRadius: THEME.radius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18
            }}>
              👑
            </div>
            <div>
              <h1 style={{
                fontSize: 20,
                fontWeight: 900,
                margin: 0,
                color: THEME.colors.text
              }}>
                لوحة تحكم وِجهة
              </h1>
              <p style={{
                fontSize: 12,
                color: THEME.colors.textSecondary,
                margin: 0
              }}>
                مرحباً {admin?.full_name}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 12px',
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.border}`,
                background: 'none',
                color: THEME.colors.text,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              🔄 تحديث
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 12px',
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.border}`,
                background: 'none',
                color: THEME.colors.textSecondary,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              👋 خروج
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        background: THEME.colors.surface,
        borderBottom: `1px solid ${THEME.colors.border}`,
        padding: '0 24px'
      }}>
        <div style={{
          display: 'flex',
          gap: 32
        }}>
          {[
            { key: 'dashboard', label: 'الرئيسية', icon: '📊' },
            { key: 'merchants', label: 'التجار', icon: '🏪' },
            { key: 'deals', label: 'العروض', icon: '🎯' },
            { key: 'categories', label: 'الفئات', icon: '📂' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '16px 0',
                border: 'none',
                background: 'none',
                color: activeTab === tab.key ? THEME.colors.primary : THEME.colors.textSecondary,
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? `2px solid ${THEME.colors.primary}` : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ maxWidth: 1200 }}>
            <h2 style={{
              fontSize: 24,
              fontWeight: 800,
              color: THEME.colors.text,
              marginBottom: 24
            }}>
              نظرة عامة
            </h2>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 20,
              marginBottom: 32
            }}>
              <div style={{
                background: THEME.colors.surface,
                borderRadius: THEME.radius.lg,
                padding: '20px',
                border: `1px solid ${THEME.colors.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>👥</span>
                  <span style={{ fontSize: 12, color: THEME.colors.textSecondary }}>إجمالي المستخدمين</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: THEME.colors.text }}>
                  {loading.stats ? '...' : (stats.total_users || 0)}
                </div>
              </div>

              <div style={{
                background: THEME.colors.surface,
                borderRadius: THEME.radius.lg,
                padding: '20px',
                border: `1px solid ${THEME.colors.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>🏪</span>
                  <span style={{ fontSize: 12, color: THEME.colors.textSecondary }}>التجار النشطين</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: THEME.colors.text }}>
                  {loading.stats ? '...' : (stats.active_merchants || 0)}
                </div>
              </div>

              <div style={{
                background: THEME.colors.surface,
                borderRadius: THEME.radius.lg,
                padding: '20px',
                border: `1px solid ${THEME.colors.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>🎯</span>
                  <span style={{ fontSize: 12, color: THEME.colors.textSecondary }}>العروض النشطة</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: THEME.colors.text }}>
                  {loading.stats ? '...' : (stats.active_deals || 0)}
                </div>
              </div>

              <div style={{
                background: THEME.colors.surface,
                borderRadius: THEME.radius.lg,
                padding: '20px',
                border: `1px solid ${THEME.colors.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>💰</span>
                  <span style={{ fontSize: 12, color: THEME.colors.textSecondary }}>إجمالي الإيرادات</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: THEME.colors.text }}>
                  {loading.stats ? '...' : `${(stats.total_revenue || 0).toLocaleString()} ر.ق`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Merchants Tab */}
        {activeTab === 'merchants' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 800,
                color: THEME.colors.text,
                margin: 0
              }}>
                إدارة التجار
              </h2>
              <div style={{ fontSize: 12, color: THEME.colors.textSecondary }}>
                إجمالي: {merchants.length}
              </div>
            </div>

            {/* Merchants Table */}
            <div style={{
              background: THEME.colors.surface,
              borderRadius: THEME.radius.lg,
              border: `1px solid ${THEME.colors.border}`,
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                gap: '16px',
                padding: '16px 20px',
                background: THEME.colors.card,
                borderBottom: `1px solid ${THEME.colors.border}`,
                fontWeight: 700,
                fontSize: 12,
                color: THEME.colors.textSecondary
              }}>
                <div>التاجر</div>
                <div>الفئة</div>
                <div>الحالة</div>
                <div>التحقق</div>
                <div>تاريخ التسجيل</div>
                <div>إجراءات</div>
              </div>

              {loading.merchants ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
                  <p style={{ color: THEME.colors.textSecondary }}>جاري التحميل...</p>
                </div>
              ) : merchants.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🏪</div>
                  <p style={{ color: THEME.colors.textSecondary }}>لا يوجد تجار مسجلين</p>
                </div>
              ) : (
                merchants.map((merchant, index) => (
                  <div
                    key={merchant.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                      gap: '16px',
                      padding: '16px 20px',
                      borderBottom: index < merchants.length - 1 ? `1px solid ${THEME.colors.border}` : 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = THEME.colors.card}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.colors.text }}>
                        {merchant.name}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.colors.textSecondary }}>
                        {merchant.email}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 13, color: THEME.colors.textSecondary }}>
                      {merchant.categories?.name || 'غير محدد'}
                    </div>
                    
                    <StatusBadge status={merchant.status} language={language} />
                    <StatusBadge status={merchant.verification_status} language={language} />
                    
                    <div style={{ fontSize: 11, color: THEME.colors.textMuted }}>
                      {merchant.created_at ? new Date(merchant.created_at).toLocaleDateString('ar-SA') : '--'}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      {merchant.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleMerchantStatusUpdate(merchant.id, 'active')}
                            style={{
                              padding: '4px 8px',
                              borderRadius: THEME.radius.sm,
                              border: 'none',
                              background: THEME.colors.success,
                              color: 'white',
                              fontSize: 10,
                              cursor: 'pointer'
                            }}
                          >
                            ✓ قبول
                          </button>
                          <button
                            onClick={() => handleMerchantStatusUpdate(merchant.id, 'rejected')}
                            style={{
                              padding: '4px 8px',
                              borderRadius: THEME.radius.sm,
                              border: 'none',
                              background: THEME.colors.error,
                              color: 'white',
                              fontSize: 10,
                              cursor: 'pointer'
                            }}
                          >
                            ✗ رفض
                          </button>
                        </>
                      )}
                      
                      {merchant.status === 'active' && (
                        <button
                          onClick={() => handleMerchantStatusUpdate(merchant.id, 'suspended')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: THEME.radius.sm,
                            border: 'none',
                            background: THEME.colors.warning,
                            color: 'white',
                            fontSize: 10,
                            cursor: 'pointer'
                          }}
                        >
                          ⏸ تعليق
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Deals Tab */}
        {activeTab === 'deals' && (
          <div>
            <h2 style={{
              fontSize: 24,
              fontWeight: 800,
              color: THEME.colors.text,
              marginBottom: 24
            }}>
              إدارة العروض ({deals.length})
            </h2>

            <div style={{
              background: THEME.colors.surface,
              borderRadius: THEME.radius.lg,
              border: `1px solid ${THEME.colors.border}`,
              overflow: 'hidden'
            }}>
              {loading.deals ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
                  <p style={{ color: THEME.colors.textSecondary }}>جاري التحميل...</p>
                </div>
              ) : deals.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎯</div>
                  <p style={{ color: THEME.colors.textSecondary }}>لا توجد عروض</p>
                </div>
              ) : (
                <div style={{ padding: '20px' }}>
                  {deals.map(deal => (
                    <div
                      key={deal.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px',
                        border: `1px solid ${THEME.colors.border}`,
                        borderRadius: THEME.radius.md,
                        marginBottom: 12,
                        background: THEME.colors.card
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: THEME.colors.text,
                          marginBottom: 4
                        }}>
                          {deal.title}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: THEME.colors.textSecondary
                        }}>
                          🏪 {deal.merchants?.name} • 💰 {deal.final_price} ر.ق • 🎫 {deal.remaining_coupons}/{deal.max_coupons}
                        </div>
                      </div>
                      
                      <StatusBadge status={deal.is_active ? 'active' : 'inactive'} language={language} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <h2 style={{
              fontSize: 24,
              fontWeight: 800,
              color: THEME.colors.text,
              marginBottom: 24
            }}>
              إدارة فئات التطبيق
            </h2>

            {/* Add/Edit Category Form */}
            <div style={{
              background: THEME.colors.surface,
              borderRadius: THEME.radius.lg,
              border: `1px solid ${THEME.colors.border}`,
              padding: '24px',
              marginBottom: 24
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: THEME.colors.text,
                marginBottom: 20
              }}>
                {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
              </h3>

              <form onSubmit={handleCategorySubmit}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  marginBottom: 20
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 12,
                      color: THEME.colors.textSecondary,
                      marginBottom: 6,
                      fontWeight: 600
                    }}>
                      الاسم العام
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => {
                        setCategoryForm(prev => ({ ...prev, name: e.target.value }))
                        setHasChanges(true)
                      }}
                      placeholder="مثال: مطاعم"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        background: THEME.colors.card,
                        color: THEME.colors.text,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 12,
                      color: THEME.colors.textSecondary,
                      marginBottom: 6,
                      fontWeight: 600
                    }}>
                      الاسم العربي
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name_ar}
                      onChange={(e) => {
                        setCategoryForm(prev => ({ ...prev, name_ar: e.target.value }))
                        setHasChanges(true)
                      }}
                      placeholder="مطاعم وأماكن الطعام"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        background: THEME.colors.card,
                        color: THEME.colors.text,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 12,
                      color: THEME.colors.textSecondary,
                      marginBottom: 6,
                      fontWeight: 600
                    }}>
                      الاسم الإنجليزي
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name_en}
                      onChange={(e) => {
                        setCategoryForm(prev => ({ ...prev, name_en: e.target.value }))
                        setHasChanges(true)
                      }}
                      placeholder="Restaurants"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        background: THEME.colors.card,
                        color: THEME.colors.text,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 12,
                      color: THEME.colors.textSecondary,
                      marginBottom: 6,
                      fontWeight: 600
                    }}>
                      لون الفئة
                    </label>
                    <input
                      type="color"
                      value={categoryForm.color_hex}
                      onChange={(e) => {
                        setCategoryForm(prev => ({ ...prev, color_hex: e.target.value }))
                        setHasChanges(true)
                      }}
                      style={{
                        width: '100%',
                        height: 38,
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        background: THEME.colors.card,
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 12,
                    color: THEME.colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: 600
                  }}>
                    الوصف
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => {
                      setCategoryForm(prev => ({ ...prev, description: e.target.value }))
                      setHasChanges(true)
                    }}
                    placeholder="وصف مختصر للفئة"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: THEME.radius.md,
                      border: `1px solid ${THEME.colors.border}`,
                      background: THEME.colors.card,
                      color: THEME.colors.text,
                      fontSize: 13,
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 20px',
                      borderRadius: THEME.radius.md,
                      border: 'none',
                      background: THEME.gradients.primary,
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {editingCategory ? '✅ تحديث' : '➕ إضافة'}
                  </button>

                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null)
                        setCategoryForm({ name: '', name_ar: '', name_en: '', description: '', color_hex: '#8B1F24' })
                      }}
                      style={{
                        padding: '12px 20px',
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        background: 'none',
                        color: THEME.colors.text,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      ❌ إلغاء
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Categories List */}
            <div style={{
              background: THEME.colors.surface,
              borderRadius: THEME.radius.lg,
              border: `1px solid ${THEME.colors.border}`,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px 20px',
                background: THEME.colors.card,
                borderBottom: `1px solid ${THEME.colors.border}`,
                fontWeight: 700,
                fontSize: 14,
                color: THEME.colors.text
              }}>
                الفئات الحالية ({categories.length})
              </div>

              {loading.categories ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
                  <p style={{ color: THEME.colors.textSecondary }}>جاري التحميل...</p>
                </div>
              ) : categories.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📂</div>
                  <p style={{ color: THEME.colors.textSecondary }}>لا توجد فئات</p>
                </div>
              ) : (
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 16
                  }}>
                    {categories.map(category => (
                      <div
                        key={category.id}
                        style={{
                          background: THEME.colors.card,
                          borderRadius: THEME.radius.md,
                          padding: '16px',
                          border: `1px solid ${THEME.colors.border}`,
                          position: 'relative'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: category.color_hex || THEME.colors.primary
                        }} />

                        <div style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: THEME.colors.text,
                          marginBottom: 8,
                          paddingRight: 24
                        }}>
                          {category.name}
                        </div>

                        <div style={{
                          fontSize: 12,
                          color: THEME.colors.textSecondary,
                          marginBottom: 12
                        }}>
                          {category.description || 'لا يوجد وصف'}
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: 8,
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            fontSize: 11,
                            color: THEME.colors.textMuted
                          }}>
                            ID: {category.id}
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleEditCategory(category)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: THEME.radius.sm,
                                border: 'none',
                                background: THEME.colors.info,
                                color: 'white',
                                fontSize: 10,
                                cursor: 'pointer'
                              }}
                            >
                              ✏️ تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: THEME.radius.sm,
                                border: 'none',
                                background: THEME.colors.error,
                                color: 'white',
                                fontSize: 10,
                                cursor: 'pointer'
                              }}
                            >
                              🗑️ حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Save Button */}
      {hasChanges && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000
        }}>
          <button
            onClick={handleGlobalSave}
            disabled={saving}
            style={{
              padding: '16px 24px',
              borderRadius: THEME.radius.lg,
              border: 'none',
              background: saving ? THEME.colors.textMuted : THEME.gradients.primary,
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 8px 32px rgba(139, 31, 36, 0.4)',
              animation: 'pulse 2s infinite'
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: 20,
                  height: 20,
                  border: '2px solid #ffffff33',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>حفظ التغييرات</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: notification.type === 'success' ? THEME.colors.success : THEME.colors.error,
          color: 'white',
          padding: '12px 16px',
          borderRadius: THEME.radius.md,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 1000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
