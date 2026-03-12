'use client'
import { useState, useEffect } from 'react'
import { sendOTP, verifyOTP } from '../lib/auth-functions'

// ============================================================================
// CUSTOMER AUTHENTICATION COMPONENT - PRODUCTION READY
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
    primary: '#8B1F24',
    primaryLight: '#A62028',
    secondary: '#D4A843',
    background: '#080608',
    surface: '#111015',
    card: '#18141F',
    border: '#374151',
    text: '#F0EDE8',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  gradients: {
    primary: 'linear-gradient(135deg, #8B1F24, #A62028)',
    surface: 'linear-gradient(180deg, #111015, #18141F)'
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24 }
}

function CountdownTimer({ seconds, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, onExpire])

  const minutes = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <span style={{
      color: timeLeft <= 30 ? THEME.colors.error : THEME.colors.textSecondary,
      fontWeight: 600,
      fontFamily: 'monospace'
    }}>
      {minutes}:{secs.toString().padStart(2, '0')}
    </span>
  )
}

export default function CustomerAuth({ onAuthSuccess, language = 'ar' }) {
  // Authentication States
  const [currentStep, setCurrentStep] = useState('phone') // phone, otp, success
  const [selectedCountry, setSelectedCountry] = useState(ARAB_COUNTRIES[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [fullPhoneNumber, setFullPhoneNumber] = useState('')
  
  // UI States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [otpExpired, setOtpExpired] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [otpTimer, setOtpTimer] = useState(0)

  // Auto-focus on OTP inputs
  useEffect(() => {
    if (currentStep === 'otp') {
      const firstInput = document.querySelector('.otp-input')
      if (firstInput) firstInput.focus()
    }
  }, [currentStep])

  // Phone number validation
  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Check if it's a valid mobile number (minimum 8 digits)
    if (cleanPhone.length < 8) {
      return { valid: false, message: 'رقم الهاتف قصير جداً' }
    }
    
    if (cleanPhone.length > 15) {
      return { valid: false, message: 'رقم الهاتف طويل جداً' }
    }
    
    return { valid: true, message: '' }
  }

  // Send OTP
  const handleSendOTP = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Validate phone number
      const validation = validatePhoneNumber(phoneNumber)
      if (!validation.valid) {
        setError(validation.message)
        return
      }
      
      // Construct full phone number
      const fullPhone = selectedCountry.prefix + phoneNumber.replace(/\D/g, '')
      setFullPhoneNumber(fullPhone)
      
      console.log('📞 Sending OTP to:', fullPhone)
      
      // Send OTP request
      const result = await sendOTP(fullPhone, 'login')
      
      if (result.success) {
        setSuccess(result.message)
        setCurrentStep('otp')
        setOtpTimer(300) // 5 minutes
        setOtpExpired(false)
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.message)
      }
      
    } catch (error) {
      console.error('Send OTP error:', error)
      setError('فشل في إرسال رمز التحقق. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (otpCode.length !== 6) {
        setError('رمز التحقق يجب أن يكون 6 أرقام')
        return
      }
      
      console.log('🔐 Verifying OTP:', otpCode)
      
      // Verify OTP
      const result = await verifyOTP(fullPhoneNumber, otpCode)
      
      if (result.success) {
        setSuccess('تم التحقق بنجاح!')
        setCurrentStep('success')
        
        // Store user session
        const userSession = {
          user: result.user,
          phone: fullPhoneNumber,
          country: selectedCountry,
          loginTime: new Date().toISOString()
        }
        
        localStorage.setItem('wejha_user_session', JSON.stringify(userSession))
        
        // Call success callback after short delay
        setTimeout(() => {
          onAuthSuccess(result.user)
        }, 1500)
        
      } else {
        setError(result.message)
        
        // Clear OTP on error
        setOtpCode('')
        
        // Focus on first OTP input
        const firstInput = document.querySelector('.otp-input')
        if (firstInput) firstInput.focus()
      }
      
    } catch (error) {
      console.error('Verify OTP error:', error)
      setError('فشل في التحقق من الرمز. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCount >= 3) {
      setError('تم تجاوز الحد الأقصى لإعادة الإرسال. يرجى المحاولة مرة أخرى لاحقاً.')
      return
    }
    
    setResendCount(prev => prev + 1)
    await handleSendOTP()
  }

  // OTP input handling
  const handleOtpInputChange = (e, index) => {
    const value = e.target.value
    
    if (value.length > 1) {
      // Handle paste
      const pastedValue = value.slice(0, 6)
      setOtpCode(pastedValue)
      
      // Focus last input
      const lastInput = document.querySelector(`.otp-input:nth-child(${Math.min(6, pastedValue.length)})`)
      if (lastInput) lastInput.focus()
      
      return
    }
    
    // Update OTP code
    const newOtpCode = otpCode.split('')
    newOtpCode[index] = value
    const updatedCode = newOtpCode.join('').slice(0, 6)
    setOtpCode(updatedCode)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`.otp-input:nth-child(${index + 2})`)
      if (nextInput) nextInput.focus()
    }
  }

  // OTP input key handling
  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = document.querySelector(`.otp-input:nth-child(${index})`)
      if (prevInput) {
        prevInput.focus()
        // Clear previous input
        const newOtpCode = otpCode.split('')
        newOtpCode[index - 1] = ''
        setOtpCode(newOtpCode.join(''))
      }
    }
  }

  // Auto-submit OTP when complete
  useEffect(() => {
    if (otpCode.length === 6 && currentStep === 'otp' && !loading) {
      handleVerifyOTP()
    }
  }, [otpCode])

  // Reset form
  const resetForm = () => {
    setCurrentStep('phone')
    setPhoneNumber('')
    setOtpCode('')
    setError('')
    setSuccess('')
    setOtpExpired(false)
    setResendCount(0)
    setOtpTimer(0)
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
            width: 72,
            height: 72,
            background: THEME.gradients.primary,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto 20px',
            boxShadow: '0 4px 16px rgba(139, 31, 36, 0.3)'
          }}>
            🎯
          </div>
          
          <h1 style={{
            fontSize: 28,
            fontWeight: 900,
            color: THEME.colors.text,
            marginBottom: 8,
            fontFamily: "'Tajawal', sans-serif"
          }}>
            {language === 'ar' ? 'أهلاً بك في وِجهة' : 'Welcome to Wejha'}
          </h1>
          
          <p style={{
            color: THEME.colors.textSecondary,
            fontSize: 15,
            margin: 0
          }}>
            {currentStep === 'phone' && (language === 'ar' ? 'ادخل رقم هاتفك للمتابعة' : 'Enter your phone number to continue')}
            {currentStep === 'otp' && (language === 'ar' ? 'ادخل رمز التحقق المرسل' : 'Enter the verification code sent')}
            {currentStep === 'success' && (language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: `${THEME.colors.error}15`,
            border: `1px solid ${THEME.colors.error}30`,
            borderRadius: THEME.radius.md,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{
              color: THEME.colors.error,
              fontSize: 13,
              fontWeight: 500
            }}>
              {error}
            </span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            background: `${THEME.colors.success}15`,
            border: `1px solid ${THEME.colors.success}30`,
            borderRadius: THEME.radius.md,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <span style={{
              color: THEME.colors.success,
              fontSize: 13,
              fontWeight: 500
            }}>
              {success}
            </span>
          </div>
        )}

        {/* Step 1: Phone Number */}
        {currentStep === 'phone' && (
          <>
            {/* Country Selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 8,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'الدولة' : 'Country'}
              </label>
              
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: THEME.radius.md,
                    border: `2px solid ${THEME.colors.border}`,
                    background: THEME.colors.card,
                    color: THEME.colors.text,
                    fontSize: 14,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = THEME.colors.primary}
                  onMouseLeave={(e) => e.target.style.borderColor = THEME.colors.border}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{selectedCountry.flag}</span>
                    <span>{language === 'ar' ? selectedCountry.name : selectedCountry.nameEn}</span>
                    <span style={{ color: THEME.colors.textMuted }}>({selectedCountry.prefix})</span>
                  </div>
                  <span style={{ color: THEME.colors.textMuted }}>
                    {showCountryDropdown ? '▲' : '▼'}
                  </span>
                </button>

                {/* Country Dropdown */}
                {showCountryDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: THEME.colors.surface,
                    border: `1px solid ${THEME.colors.border}`,
                    borderRadius: THEME.radius.md,
                    maxHeight: 200,
                    overflowY: 'auto',
                    zIndex: 100,
                    marginTop: 4,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}>
                    {ARAB_COUNTRIES.map(country => (
                      <button
                        key={country.code}
                        onClick={() => {
                          setSelectedCountry(country)
                          setShowCountryDropdown(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'none',
                          color: THEME.colors.text,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          cursor: 'pointer',
                          textAlign: 'right'
                        }}
                        onMouseEnter={(e) => e.target.style.background = THEME.colors.card}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
                      >
                        <span style={{ fontSize: 18 }}>{country.flag}</span>
                        <span style={{ flex: 1 }}>{language === 'ar' ? country.name : country.nameEn}</span>
                        <span style={{ color: THEME.colors.textMuted }}>{country.prefix}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Phone Number Input */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 8,
                fontWeight: 600
              }}>
                {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              
              <div style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center'
              }}>
                <div style={{
                  padding: '14px 12px',
                  borderRadius: THEME.radius.md,
                  border: `2px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.textSecondary,
                  fontSize: 14,
                  fontWeight: 600,
                  minWidth: 80,
                  textAlign: 'center'
                }}>
                  {selectedCountry.prefix}
                </div>
                
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    // Allow only numbers and format
                    const value = e.target.value.replace(/\D/g, '')
                    setPhoneNumber(value)
                    setError('')
                  }}
                  placeholder={language === 'ar' ? '50123456' : '50123456'}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    borderRadius: THEME.radius.md,
                    border: `2px solid ${THEME.colors.border}`,
                    background: THEME.colors.card,
                    color: THEME.colors.text,
                    fontSize: 16,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = THEME.colors.primary}
                  onBlur={(e) => e.target.style.borderColor = THEME.colors.border}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendOTP()
                  }}
                />
              </div>
            </div>

            {/* Send OTP Button */}
            <button
              onClick={handleSendOTP}
              disabled={loading || !phoneNumber}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: THEME.radius.md,
                border: 'none',
                background: loading || !phoneNumber ? THEME.colors.textMuted : THEME.gradients.primary,
                color: 'white',
                fontSize: 16,
                fontWeight: 700,
                cursor: loading || !phoneNumber ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s'
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
                  <span>{language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</span>
                </>
              ) : (
                <>
                  <span>📱</span>
                  <span>{language === 'ar' ? 'إرسال رمز التحقق' : 'Send Verification Code'}</span>
                </>
              )}
            </button>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {currentStep === 'otp' && (
          <>
            {/* Phone Display */}
            <div style={{
              background: THEME.colors.card,
              borderRadius: THEME.radius.md,
              padding: '12px 16px',
              marginBottom: 24,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 4
              }}>
                {language === 'ar' ? 'تم الإرسال إلى' : 'Sent to'}
              </div>
              <div style={{
                fontSize: 15,
                color: THEME.colors.text,
                fontWeight: 600,
                direction: 'ltr'
              }}>
                {fullPhoneNumber}
              </div>
            </div>

            {/* OTP Input */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                color: THEME.colors.textSecondary,
                marginBottom: 12,
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {language === 'ar' ? 'رمز التحقق' : 'Verification Code'}
              </label>
              
              <div style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 16
              }}>
                {[0, 1, 2, 3, 4, 5].map(index => (
                  <input
                    key={index}
                    className="otp-input"
                    type="text"
                    maxLength={6}
                    value={otpCode[index] || ''}
                    onChange={(e) => handleOtpInputChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    style={{
                      width: 48,
                      height: 56,
                      borderRadius: THEME.radius.md,
                      border: `2px solid ${THEME.colors.border}`,
                      background: THEME.colors.card,
                      color: THEME.colors.text,
                      fontSize: 20,
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = THEME.colors.primary
                      e.target.select()
                    }}
                    onBlur={(e) => e.target.style.borderColor = THEME.colors.border}
                  />
                ))}
              </div>

              {/* Timer and Resend */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13
              }}>
                {otpTimer > 0 && !otpExpired ? (
                  <div style={{ color: THEME.colors.textSecondary }}>
                    {language === 'ar' ? 'انتهاء الصلاحية خلال:' : 'Expires in:'}{' '}
                    <CountdownTimer 
                      seconds={otpTimer}
                      onExpire={() => setOtpExpired(true)}
                    />
                  </div>
                ) : (
                  <div style={{ color: THEME.colors.textMuted }}>
                    {language === 'ar' ? 'انتهت صلاحية الرمز' : 'Code expired'}
                  </div>
                )}

                <button
                  onClick={handleResendOTP}
                  disabled={otpTimer > 0 || loading || resendCount >= 3}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: otpTimer > 0 || resendCount >= 3 ? THEME.colors.textMuted : THEME.colors.primary,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: otpTimer > 0 || resendCount >= 3 ? 'not-allowed' : 'pointer',
                    padding: 0
                  }}
                >
                  {language === 'ar' ? 'إعادة الإرسال' : 'Resend'} 
                  {resendCount > 0 && ` (${resendCount}/3)`}
                </button>
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otpCode.length !== 6}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: THEME.radius.md,
                border: 'none',
                background: loading || otpCode.length !== 6 ? THEME.colors.textMuted : THEME.gradients.primary,
                color: 'white',
                fontSize: 16,
                fontWeight: 700,
                cursor: loading || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
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
                  <span>{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>{language === 'ar' ? 'تحقق' : 'Verify'}</span>
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              onClick={resetForm}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.border}`,
                background: 'none',
                color: THEME.colors.textSecondary,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              ← {language === 'ar' ? 'تغيير رقم الهاتف' : 'Change Phone Number'}
            </button>
          </>
        )}

        {/* Step 3: Success */}
        {currentStep === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `${THEME.colors.success}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ fontSize: 40, color: THEME.colors.success }}>✅</span>
            </div>
            
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: THEME.colors.success,
              marginBottom: 8
            }}>
              {language === 'ar' ? 'تم بنجاح!' : 'Success!'}
            </h3>
            
            <p style={{
              color: THEME.colors.textSecondary,
              fontSize: 14,
              margin: 0
            }}>
              {language === 'ar' ? 'جاري تحويلك للتطبيق...' : 'Redirecting to app...'}
            </p>
          </div>
        )}

        {/* Footer */}
        {currentStep !== 'success' && (
          <div style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: `1px solid ${THEME.colors.border}`,
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: 12,
              color: THEME.colors.textMuted,
              margin: 0,
              lineHeight: 1.5
            }}>
              {language === 'ar' 
                ? 'بالمتابعة، أنت توافق على الشروط والأحكام وسياسة الخصوصية'
                : 'By continuing, you agree to our Terms & Conditions and Privacy Policy'
              }
            </p>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showCountryDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50
          }}
          onClick={() => setShowCountryDropdown(false)}
        />
      )}
      
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .otp-input::-webkit-outer-spin-button,
        .otp-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        .otp-input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  )
}
