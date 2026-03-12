'use client'
import { useState, useEffect } from 'react'
import { merchantLogin, merchantRegister } from '../lib/auth-functions'
import { getCategories } from '../lib/supabase-admin'

// ============================================================================
// COMPLETE MERCHANT AUTHENTICATION - PRODUCTION READY
// ============================================================================

const ARAB_COUNTRIES = [
  { code: 'QAT', name: 'قطر', nameEn: 'Qatar', prefix: '+974', flag: '🇶🇦' },
  { code: 'SAU', name: 'السعودية', nameEn: 'Saudi Arabia', prefix: '+966', flag: '🇸🇦' },
  { code: 'ARE', name: 'الإمارات', nameEn: 'UAE', prefix: '+971', flag: '🇦🇪' },
  { code: 'KWT', name: 'الكويت', nameEn: 'Kuwait', prefix: '+965', flag: '🇰🇼' },
  { code: 'BHR', name: 'البحرين', nameEn: 'Bahrain', prefix: '+973', flag: '🇧🇭' },
  { code: 'OMN', name: 'عُمان', nameEn: 'Oman', prefix: '+968', flag: '🇴🇲' },
  { code: 'JOR', name: 'الأردن', nameEn: 'Jordan', prefix: '+962', flag: '🇯🇴' },
  { code: 'LBN', name: 'لبنان', nameEn: 'Lebanon', prefix: '+961', flag: '🇱🇧' },
  { code: 'EGY', name: 'مصر', nameEn: 'Egypt', prefix: '+20', flag: '🇪🇬' },
  { code: 'IRQ', name: 'العراق', nameEn: 'Iraq', prefix: '+964', flag: '🇮🇶' },
  { code: 'SYR', name: 'سوريا', nameEn: 'Syria', prefix: '+963', flag: '🇸🇾' },
  { code: 'MAR', name: 'المغرب', nameEn: 'Morocco', prefix: '+212', flag: '🇲🇦' },
  { code: 'DZA', name: 'الجزائر', nameEn: 'Algeria', prefix: '+213', flag: '🇩🇿' },
  { code: 'TUN', name: 'تونس', nameEn: 'Tunisia', prefix: '+216', flag: '🇹🇳' },
  { code: 'LBY', name: 'ليبيا', nameEn: 'Libya', prefix: '+218', flag: '🇱🇾' },
  { code: 'SDN', name: 'السودان', nameEn: 'Sudan', prefix: '+249', flag: '🇸🇩' },
  { code: 'YEM', name: 'اليمن', nameEn: 'Yemen', prefix: '+967', flag: '🇾🇪' }
]

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
// Terms and Conditions Modal
// ============================================================================
function TermsModal({ isOpen, onClose, onAccept, language = 'ar' }) {
  if (!isOpen) return null

  const terms = {
    ar: {
      title: 'الشروط والأحكام',
      sections: [
        {
          title: '1. شروط الانضمام',
          content: 'يجب أن يكون لديك رخصة تجارية سارية وأن تقوم بتقديم منتجات أو خدمات حقيقية للعملاء.'
        },
        {
          title: '2. العمولة والدفع',
          content: 'تبلغ العمولة 10% من قيمة كل كوبون مستخدم. سيتم الدفع شهرياً خلال 15 يوم عمل.'
        },
        {
          title: '3. جودة الخدمة',
          content: 'يجب تقديم خدمة عملاء ممتازة والالتزام بالعروض المعلنة على المنصة.'
        },
        {
          title: '4. إلغاء الشراكة',
          content: 'يحق لوِجهة إنهاء الشراكة في حالة عدم الالتزام بالشروط أو شكاوى العملاء.'
        },
        {
          title: '5. حماية البيانات',
          content: 'نلتزم بحماية بياناتك وبيانات عملائك وفقاً لقوانين حماية البيانات.'
        }
      ]
    },
    en: {
      title: 'Terms and Conditions',
      sections: [
        {
          title: '1. Membership Requirements',
          content: 'You must have a valid business license and provide real products or services to customers.'
        },
        {
          title: '2. Commission and Payment',
          content: 'Commission rate is 10% of each used coupon value. Payment is made monthly within 15 business days.'
        },
        {
          title: '3. Service Quality',
          content: 'You must provide excellent customer service and comply with offers announced on the platform.'
        },
        {
          title: '4. Partnership Termination',
          content: 'Wejha has the right to terminate the partnership in case of non-compliance or customer complaints.'
        },
        {
          title: '5. Data Protection',
          content: 'We are committed to protecting your data and your customers\' data according to data protection laws.'
        }
      ]
    }
  }

  const content = terms[language] || terms.ar

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 999
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: THEME.colors.surface,
        borderRadius: THEME.radius.xl,
        padding: '24px',
        maxWidth: 600,
        width: 'calc(100% - 40px)',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: `1px solid ${THEME.colors.border}`,
        zIndex: 1000
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: `1px solid ${THEME.colors.border}`
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: THEME.colors.text,
            margin: 0
          }}>
            {content.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: THEME.colors.textMuted,
              color: 'white',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 24 }}>
          {content.sections.map((section, index) => (
            <div key={index} style={{ marginBottom: 20 }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: THEME.colors.primary,
                marginBottom: 8
              }}>
                {section.title}
              </h3>
              <p style={{
                fontSize: 14,
                color: THEME.colors.text,
                lineHeight: 1.6,
                margin: 0
              }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: THEME.radius.md,
              border: `1px solid ${THEME.colors.border}`,
              background: 'none',
              color: THEME.colors.text,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={onAccept}
            style={{
              padding: '12px 24px',
              borderRadius: THEME.radius.md,
              border: 'none',
              background: THEME.gradients.primary,
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            {language === 'ar' ? 'موافق على الشروط' : 'Accept Terms'}
          </button>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// Merchant Login Component
// ============================================================================
function MerchantLogin({ onLogin, onSwitchToRegister, language = 'ar' }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await merchantLogin(formData.email, formData.password)

      if (result.success) {
        // Store session
        localStorage.setItem('wejha_merchant_session', JSON.stringify({
          merchant: result.merchant,
          loginTime: new Date().toISOString()
        }))
        
        onLogin(result.merchant)
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(language === 'ar' ? 'فشل في تسجيل الدخول' : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: THEME.gradients.surface,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: 420,
        background: THEME.colors.surface,
        borderRadius: THEME.radius.xl,
        padding: '32px 24px',
        border: `1px solid ${THEME.colors.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
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
            🏪
          </div>
          
          <h1 style={{
            fontSize: 24,
            fontWeight: 900,
            color: THEME.colors.text,
            marginBottom: 8,
            fontFamily: "'Tajawal', sans-serif"
          }}>
            {language === 'ar' ? 'دخول التاجر' : 'Merchant Login'}
          </h1>
          
          <p style={{
            color: THEME.colors.textSecondary,
            fontSize: 14,
            margin: 0
          }}>
            {language === 'ar' ? 'ادخل لإدارة متجرك' : 'Login to manage your store'}
          </p>
        </div>

        {/* Demo Info */}
        <div style={{
          background: `${THEME.colors.info}15`,
          border: `1px solid ${THEME.colors.info}30`,
          borderRadius: THEME.radius.md,
          padding: '12px',
          marginBottom: 20
        }}>
          <div style={{ fontSize: 12, color: THEME.colors.info, marginBottom: 4, fontWeight: 600 }}>
            {language === 'ar' ? 'للتجربة:' : 'For Demo:'}
          </div>
          <div style={{ fontSize: 11, color: THEME.colors.text, fontFamily: 'monospace' }}>
            merchant@wejha.qa / 123456
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: `${THEME.colors.error}15`,
            border: `1px solid ${THEME.colors.error}30`,
            borderRadius: THEME.radius.md,
            padding: '12px 16px',
            marginBottom: 20,
            color: THEME.colors.error,
            fontSize: 13
          }}>
            {error}
          </div>
        )}

        {/* Email Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            color: THEME.colors.textSecondary,
            marginBottom: 6,
            fontWeight: 600
          }}>
            {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: THEME.radius.md,
              border: `1.5px solid ${THEME.colors.border}`,
              background: THEME.colors.card,
              color: THEME.colors.text,
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            color: THEME.colors.textSecondary,
            marginBottom: 6,
            fontWeight: 600
          }}>
            {language === 'ar' ? 'كلمة المرور' : 'Password'}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: THEME.radius.md,
              border: `1.5px solid ${THEME.colors.border}`,
              background: THEME.colors.card,
              color: THEME.colors.text,
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: THEME.radius.md,
            border: 'none',
            background: loading ? THEME.colors.textMuted : THEME.gradients.primary,
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 16,
                height: 16,
                border: '2px solid #ffffff33',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>{language === 'ar' ? 'جاري الدخول...' : 'Logging in...'}</span>
            </>
          ) : (
            <>
              <span>🔑</span>
              <span>{language === 'ar' ? 'دخول' : 'Login'}</span>
            </>
          )}
        </button>

        {/* Register Link */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: THEME.colors.textSecondary }}>
            {language === 'ar' ? 'ليس لديك حساب؟' : 'Don\'t have an account?'}
          </span>
          {' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.colors.primary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {language === 'ar' ? 'سجل الآن' : 'Register Now'}
          </button>
        </div>

        {/* CSS */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </form>
    </div>
  )
}

// ============================================================================
// Merchant Registration Component
// ============================================================================
function MerchantRegister({ onRegisterSuccess, onSwitchToLogin, language = 'ar' }) {
  const [currentStep, setCurrentStep] = useState(1) // 1: Basic Info, 2: Business Info, 3: Terms
  const [categories, setCategories] = useState([])
  const [countries, setCountries] = useState(ARAB_COUNTRIES)
  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    name_ar: '',
    name_en: '',
    description: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    instagram: '',
    password: '',
    confirmPassword: '',
    
    // Business Info
    category_id: '',
    country_id: 1, // Default Qatar
    city_id: 1,
    address: '',
    business_license: '',
    tax_id: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const result = await getCategories()
      if (result.data) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError(language === 'ar' ? 'اسم المتجر مطلوب' : 'Store name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError(language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required')
      return false
    }
    if (!formData.phone.trim()) {
      setError(language === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required')
      return false
    }
    if (formData.password.length < 6) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError(language === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.category_id) {
      setError(language === 'ar' ? 'فئة المتجر مطلوبة' : 'Store category is required')
      return false
    }
    if (!formData.address.trim()) {
      setError(language === 'ar' ? 'العنوان مطلوب' : 'Address is required')
      return false
    }
    if (!formData.business_license.trim()) {
      setError(language === 'ar' ? 'رقم الرخصة التجارية مطلوب' : 'Business license is required')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  const handleSubmitRegistration = async () => {
    if (!termsAccepted) {
      setError(language === 'ar' ? 'يجب الموافقة على الشروط والأحكام' : 'You must accept the terms and conditions')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await merchantRegister(formData)

      if (result.success) {
        onRegisterSuccess(result.message)
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError(language === 'ar' ? 'فشل في التسجيل' : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleTermsAccept = () => {
    setTermsAccepted(true)
    setShowTerms(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: THEME.gradients.surface,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 500,
        background: THEME.colors.surface,
        borderRadius: THEME.radius.xl,
        padding: '32px 24px',
        border: `1px solid ${THEME.colors.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
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
            🏪
          </div>
          
          <h1 style={{
            fontSize: 24,
            fontWeight: 900,
            color: THEME.colors.text,
            marginBottom: 8,
            fontFamily: "'Tajawal', sans-serif"
          }}>
            {language === 'ar' ? 'انضم كتاجر' : 'Join as Merchant'}
          </h1>
          
          <p style={{
            color: THEME.colors.textSecondary,
            fontSize: 14,
            margin: 0
          }}>
            {language === 'ar' ? `الخطوة ${currentStep} من 3` : `Step ${currentStep} of 3`}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: 4,
          background: THEME.colors.border,
          borderRadius: 2,
          marginBottom: 24,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(currentStep / 3) * 100}%`,
            height: '100%',
            background: THEME.gradients.primary,
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: `${THEME.colors.error}15`,
            border: `1px solid ${THEME.colors.error}30`,
            borderRadius: THEME.radius.md,
            padding: '12px 16px',
            marginBottom: 20,
            color: THEME.colors.error,
            fontSize: 13
          }}>
            {error}
          </div>
        )}

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: THEME.colors.text,
              marginBottom: 20
            }}>
              {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
            </h3>

            {/* Store Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 6,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'اسم المتجر *' : 'Store Name *'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={language === 'ar' ? 'مثال: مطعم الأصالة' : 'Example: Heritage Restaurant'}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: THEME.radius.md,
                  border: `1.5px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 6,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="merchant@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: THEME.radius.md,
                  border: `1.5px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 6,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+974 5012 3456"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: THEME.radius.md,
                  border: `1.5px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 6,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'كلمة المرور *' : 'Password *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={language === 'ar' ? 'كلمة مرور قوية' : 'Strong password'}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: THEME.radius.md,
                  border: `1.5px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 6,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder={language === 'ar' ? 'أعد كتابة كلمة المرور' : 'Re-enter password'}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: THEME.radius.md,
                  border: `1.5px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextStep}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: THEME.radius.md,
                border: 'none',
                background: THEME.gradients.primary,
                color: 'white',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 16
              }}
            >
              {language === 'ar' ? 'التالي' : 'Next'}
            </button>
          </>
        )}

        {/* Step 2: Business Information */}
        {currentStep === 2 && (
          <>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: THEME.colors.text,
              marginBottom: 20
            }}>
              {language === 'ar' ? 'معلومات العمل' : 'Business Information'}
            </h3>

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 6,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'فئة المتجر *' : 'Store Category *'}
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: THEME.radius.md,
                  border: `1.5px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none'
                }}
              >
                <option value="">{language === 'ar' ? 'اختر الفئة' : 'Select Category'}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {language === 'ar' ? (category.name_ar || category.name) : (category.name_en || category.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 6,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'العنوان *' : 'Address *'}
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder={language === 'ar' ? 'العنوان الكامل للمتجر' : 'Full store address'}
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: THEME.radius.md,
                  border: `1.5px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Business License */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 6,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'رقم الرخصة التجارية *' : 'Business License Number *'}
              </label>
              <input
                type="text"
                value={formData.business_license}
                onChange={(e) => handleChange('business_license', e.target.value)}
                placeholder={language === 'ar' ? 'رقم الرخصة التجارية' : 'Business license number'}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: THEME.radius.md,
                  border: `1.5px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Tax ID (Optional) */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 6,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'الرقم الضريبي (اختياري)' : 'Tax ID (Optional)'}
              </label>
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                placeholder={language === 'ar' ? 'الرقم الضريبي' : 'Tax identification number'}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: THEME.radius.md,
                  border: `1.5px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16
            }}>
              <button
                onClick={() => setCurrentStep(1)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: THEME.radius.md,
                  border: `1px solid ${THEME.colors.border}`,
                  background: 'none',
                  color: THEME.colors.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {language === 'ar' ? 'السابق' : 'Previous'}
              </button>
              
              <button
                onClick={handleNextStep}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: THEME.radius.md,
                  border: 'none',
                  background: THEME.gradients.primary,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Terms and Conditions */}
        {currentStep === 3 && (
          <>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: THEME.colors.text,
              marginBottom: 20
            }}>
              {language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions'}
            </h3>

            <div style={{
              background: THEME.colors.card,
              borderRadius: THEME.radius.md,
              padding: '16px',
              marginBottom: 20,
              border: `1px solid ${THEME.colors.border}`
            }}>
              <p style={{
                fontSize: 14,
                color: THEME.colors.text,
                lineHeight: 1.6,
                margin: 0
              }}>
                {language === 'ar' 
                  ? 'للمتابعة، يجب عليك قراءة والموافقة على الشروط والأحكام. تشمل هذه الشروط العمولة 10%، شروط الجودة، وحماية البيانات.'
                  : 'To continue, you must read and accept our terms and conditions. These include the 10% commission, quality standards, and data protection policies.'
                }
              </p>
            </div>

            {/* Terms Acceptance */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24
            }}>
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  accentColor: THEME.colors.primary
                }}
              />
              <label htmlFor="terms-checkbox" style={{
                fontSize: 13,
                color: THEME.colors.text,
                cursor: 'pointer'
              }}>
                {language === 'ar' ? 'أوافق على' : 'I agree to the'}{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: THEME.colors.primary,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions'}
                </button>
              </label>
            </div>

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16
            }}>
              <button
                onClick={() => setCurrentStep(2)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: THEME.radius.md,
                  border: `1px solid ${THEME.colors.border}`,
                  background: 'none',
                  color: THEME.colors.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {language === 'ar' ? 'السابق' : 'Previous'}
              </button>
              
              <button
                onClick={handleSubmitRegistration}
                disabled={loading || !termsAccepted}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: THEME.radius.md,
                  border: 'none',
                  background: loading || !termsAccepted ? THEME.colors.textMuted : THEME.gradients.primary,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading || !termsAccepted ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 14,
                      height: 14,
                      border: '2px solid #ffffff33',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>{language === 'ar' ? 'جاري التسجيل...' : 'Registering...'}</span>
                  </>
                ) : (
                  <>
                    <span>🎉</span>
                    <span>{language === 'ar' ? 'إنهاء التسجيل' : 'Complete Registration'}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Login Link */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: THEME.colors.textSecondary }}>
            {language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
          </span>
          {' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.colors.primary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {language === 'ar' ? 'دخول' : 'Login'}
          </button>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={handleTermsAccept}
        language={language}
      />
    </div>
  )
}

// ============================================================================
// Main Merchant Auth Component
// ============================================================================
export default function MerchantAuth({ onAuthSuccess, language = 'ar' }) {
  const [currentView, setCurrentView] = useState('login') // 'login' or 'register'
  const [registrationSuccess, setRegistrationSuccess] = useState(null)

  // Check existing session
  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = () => {
    try {
      const savedSession = localStorage.getItem('wejha_merchant_session')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        
        // Check if session is still valid (24 hours)
        const loginTime = new Date(session.loginTime)
        const now = new Date()
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          onAuthSuccess(session.merchant)
          console.log('✅ Restored merchant session:', session.merchant.id)
        } else {
          localStorage.removeItem('wejha_merchant_session')
          console.log('❌ Merchant session expired')
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
      localStorage.removeItem('wejha_merchant_session')
    }
  }

  const handleLoginSuccess = (merchant) => {
    onAuthSuccess(merchant)
  }

  const handleRegisterSuccess = (message) => {
    setRegistrationSuccess(message)
    setTimeout(() => {
      setCurrentView('login')
      setRegistrationSuccess(null)
    }, 3000)
  }

  if (registrationSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: THEME.gradients.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: THEME.colors.surface,
          borderRadius: THEME.radius.xl,
          padding: '32px 24px',
          maxWidth: 400,
          width: '100%',
          border: `1px solid ${THEME.colors.border}`,
          textAlign: 'center'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `${THEME.colors.success}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <span style={{ fontSize: 36, color: THEME.colors.success }}>🎉</span>
          </div>
          
          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: THEME.colors.text,
            marginBottom: 16
          }}>
            {language === 'ar' ? 'تم التسجيل بنجاح!' : 'Registration Successful!'}
          </h2>
          
          <p style={{
            fontSize: 14,
            color: THEME.colors.textSecondary,
            lineHeight: 1.5,
            margin: 0
          }}>
            {registrationSuccess}
          </p>
          
          <p style={{
            fontSize: 12,
            color: THEME.colors.textMuted,
            marginTop: 16,
            margin: 0
          }}>
            {language === 'ar' ? 'سيتم تحويلك لصفحة الدخول...' : 'Redirecting to login...'}
          </p>
        </div>
      </div>
    )
  }

  if (currentView === 'register') {
    return (
      <MerchantRegister
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => setCurrentView('login')}
        language={language}
      />
    )
  }

  return (
    <MerchantLogin
      onLogin={handleLoginSuccess}
      onSwitchToRegister={() => setCurrentView('register')}
      language={language}
    />
  )
}
