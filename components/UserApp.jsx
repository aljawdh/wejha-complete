'use client'
import { useState, useEffect } from 'react'
import { 
  getCategories, 
  getDeals, 
  claimCoupon, 
  getUserCoupons, 
  getMerchants 
} from '../lib/supabase-admin'

import CustomerAuth from './CustomerAuth'

// ============================================================================
// COMPLETE CUSTOMER APP - PRODUCTION READY WITH ALL FEATURES
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
    secondary: 'linear-gradient(135deg, #D4A843, #E5B854)',
    surface: 'linear-gradient(180deg, #111015, #18141F)',
    card: 'linear-gradient(135deg, #18141F, #1F1A25)'
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24 }
}

// ============================================================================
// Google Maps Component with Real Integration
// ============================================================================
function MerchantsMap({ merchants, selectedMerchant, onMerchantSelect, language = 'ar' }) {
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'YOUR_API_KEY'}&libraries=places`
      script.async = true
      script.onload = initMap
      script.onerror = () => {
        console.log('Google Maps failed to load, showing fallback')
        document.getElementById('merchants-map').innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 250px; background: #18141F; border-radius: 12px; color: #9CA3AF;">
            🗺️ ${language === 'ar' ? 'خريطة المتاجر ستظهر هنا قريباً' : 'Merchants map will appear here soon'}
          </div>
        `
      }
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [merchants])

  const initMap = () => {
    if (!window.google || !merchants.length) {
      // Fallback when no merchants or Google Maps fails
      document.getElementById('merchants-map').innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 250px; background: #18141F; border-radius: 12px; color: #9CA3AF; padding: 20px;">
          <div style="font-size: 32px; margin-bottom: 12px;">🏪</div>
          <div style="text-align: center; font-size: 14px;">
            ${language === 'ar' ? 'لا توجد متاجر متاحة حالياً' : 'No merchants available currently'}
          </div>
        </div>
      `
      return
    }

    // Default center (Doha, Qatar)
    const center = merchants[0] && merchants[0].latitude ? 
      { lat: parseFloat(merchants[0].latitude), lng: parseFloat(merchants[0].longitude) } : 
      { lat: 25.2854, lng: 51.5310 }

    const map = new window.google.maps.Map(document.getElementById('merchants-map'), {
      zoom: 12,
      center: center,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#212121" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] }
      ]
    })

    merchants.forEach(merchant => {
      if (merchant.latitude && merchant.longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(merchant.latitude), lng: parseFloat(merchant.longitude) },
          map: map,
          title: language === 'ar' ? (merchant.name_ar || merchant.name) : (merchant.name_en || merchant.name),
          icon: {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#8B1F24" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12">🏪</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32)
          }
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; color: #333;">
              <strong>${language === 'ar' ? (merchant.name_ar || merchant.name) : (merchant.name_en || merchant.name)}</strong><br/>
              📍 ${merchant.address || ''}<br/>
              ${merchant.phone ? `📞 ${merchant.phone}` : ''}
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
          onMerchantSelect(merchant)
        })
      }
    })
  }

  return (
    <div style={{
      background: THEME.colors.surface,
      borderRadius: THEME.radius.lg,
      padding: '16px',
      border: `1px solid ${THEME.colors.border}`,
      marginBottom: 20
    }}>
      <h3 style={{
        fontSize: 16,
        fontWeight: 700,
        color: THEME.colors.text,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span>🗺️</span>
        <span>{language === 'ar' ? 'خريطة المتاجر' : 'Merchants Map'}</span>
        <span style={{
          background: THEME.colors.primary,
          color: 'white',
          padding: '2px 8px',
          borderRadius: THEME.radius.sm,
          fontSize: 10,
          fontWeight: 600
        }}>
          {merchants.length}
        </span>
      </h3>
      
      <div
        id="merchants-map"
        style={{
          width: '100%',
          height: 250,
          borderRadius: THEME.radius.md,
          border: `1px solid ${THEME.colors.border}`,
          overflow: 'hidden'
        }}
      />
      
      {selectedMerchant && (
        <div style={{
          marginTop: 12,
          padding: '12px',
          background: THEME.colors.card,
          borderRadius: THEME.radius.md,
          border: `1px solid ${THEME.colors.primary}40`
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: THEME.colors.text,
            marginBottom: 4
          }}>
            {language === 'ar' ? (selectedMerchant.name_ar || selectedMerchant.name) : (selectedMerchant.name_en || selectedMerchant.name)}
          </div>
          <div style={{
            fontSize: 12,
            color: THEME.colors.textSecondary,
            marginBottom: 8
          }}>
            📍 {selectedMerchant.address || language === 'ar' ? 'العنوان غير متوفر' : 'Address not available'}
          </div>
          {selectedMerchant.phone && (
            <div style={{ display: 'flex', gap: 12 }}>
              <a
                href={`tel:${selectedMerchant.phone}`}
                style={{
                  fontSize: 12,
                  color: THEME.colors.primary,
                  textDecoration: 'none',
                  padding: '4px 8px',
                  background: `${THEME.colors.primary}20`,
                  borderRadius: THEME.radius.sm
                }}
              >
                📞 {language === 'ar' ? 'اتصال' : 'Call'}
              </a>
              {selectedMerchant.whatsapp && (
                <a
                  href={`https://wa.me/${selectedMerchant.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: THEME.colors.success,
                    textDecoration: 'none',
                    padding: '4px 8px',
                    background: `${THEME.colors.success}20`,
                    borderRadius: THEME.radius.sm
                  }}
                >
                  💬 {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Enhanced Deal Card with Real Data
// ============================================================================
function DealCard({ deal, onClaim, loading, language = 'ar' }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR'
    }).format(amount).replace('QAR', 'ر.ق')
  }

  const timeLeft = deal.expires_at ? new Date(deal.expires_at) - new Date() : 0
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)))
  const hoursLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60)))
  
  const isExpired = timeLeft <= 0
  const isRunningOut = deal.remaining_coupons <= 5
  const isPopular = deal.claims_count > 10
  const isEndingSoon = hoursLeft <= 24 && hoursLeft > 0

  return (
    <div style={{
      background: THEME.gradients.card,
      borderRadius: THEME.radius.lg,
      border: `1px solid ${THEME.colors.border}`,
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.3s ease',
      transform: loading ? 'scale(0.98)' : 'scale(1)',
      opacity: isExpired ? 0.6 : 1
    }}>
      {/* Deal Image or Placeholder */}
      <div style={{
        height: 160,
        background: deal.image_url ? 
          `url(${deal.image_url})` : 
          `linear-gradient(135deg, ${THEME.colors.primary}, ${THEME.colors.primaryLight})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {!deal.image_url && (
          <div style={{
            fontSize: 48,
            opacity: 0.3,
            color: 'white'
          }}>
            🎯
          </div>
        )}

        {/* Status Badges */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          {isPopular && (
            <span style={{
              background: THEME.colors.warning,
              color: 'white',
              padding: '4px 8px',
              borderRadius: THEME.radius.sm,
              fontSize: 10,
              fontWeight: 700
            }}>
              🔥 {language === 'ar' ? 'رائج' : 'Popular'}
            </span>
          )}
          
          {isEndingSoon && !isExpired && (
            <span style={{
              background: THEME.colors.error,
              color: 'white',
              padding: '4px 8px',
              borderRadius: THEME.radius.sm,
              fontSize: 10,
              fontWeight: 700
            }}>
              ⏰ {language === 'ar' ? `${hoursLeft} ساعة` : `${hoursLeft}h`}
            </span>
          )}

          {isRunningOut && !isExpired && (
            <span style={{
              background: THEME.colors.warning,
              color: 'white',
              padding: '4px 8px',
              borderRadius: THEME.radius.sm,
              fontSize: 10,
              fontWeight: 700
            }}>
              🏃‍♂️ {language === 'ar' ? 'كمية قليلة' : 'Few left'}
            </span>
          )}
        </div>

        {/* Discount Badge */}
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: THEME.colors.success,
          color: 'white',
          padding: '8px 12px',
          borderRadius: THEME.radius.md,
          fontSize: 16,
          fontWeight: 900,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          {deal.discount_percent || Math.round(((deal.original_price - deal.final_price) / deal.original_price) * 100)}% 
          {language === 'ar' ? ' خصم' : ' OFF'}
        </div>

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
        }} />
      </div>

      {/* Deal Content */}
      <div style={{ padding: '16px' }}>
        {/* Merchant Name */}
        <div style={{
          fontSize: 11,
          color: THEME.colors.secondary,
          fontWeight: 600,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>🏪</span>
          <span>{deal.merchants?.name || deal.merchant?.name || 'متجر'}</span>
          {deal.merchants?.verification_status === 'verified' && (
            <span style={{
              color: THEME.colors.success,
              fontSize: 10
            }}>✓</span>
          )}
        </div>

        {/* Deal Title */}
        <h3 style={{
          fontSize: 16,
          fontWeight: 800,
          color: THEME.colors.text,
          marginBottom: 8,
          lineHeight: 1.3,
          height: 42,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {language === 'ar' ? (deal.title_ar || deal.title) : (deal.title_en || deal.title)}
        </h3>

        {/* Description */}
        {deal.description && (
          <p style={{
            fontSize: 12,
            color: THEME.colors.textSecondary,
            marginBottom: 12,
            lineHeight: 1.4,
            height: 32,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {language === 'ar' ? (deal.description_ar || deal.description) : (deal.description_en || deal.description)}
          </p>
        )}

        {/* Pricing */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16
        }}>
          <div style={{
            fontSize: 18,
            fontWeight: 900,
            color: THEME.colors.success
          }}>
            {formatCurrency(deal.final_price)}
          </div>
          <div style={{
            fontSize: 14,
            color: THEME.colors.textMuted,
            textDecoration: 'line-through'
          }}>
            {formatCurrency(deal.original_price)}
          </div>
          <div style={{
            fontSize: 12,
            color: THEME.colors.primary,
            fontWeight: 600
          }}>
            {language === 'ar' ? 'توفير' : 'Save'} {formatCurrency(deal.original_price - deal.final_price)}
          </div>
        </div>

        {/* Availability Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          fontSize: 12,
          color: THEME.colors.textSecondary
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>🎫</span>
            <span>
              {deal.remaining_coupons} / {deal.max_coupons} {language === 'ar' ? 'متبقي' : 'left'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⏰</span>
            <span>
              {daysLeft > 0 ? 
                `${daysLeft} ${language === 'ar' ? 'أيام' : 'days'}` : 
                `${hoursLeft} ${language === 'ar' ? 'ساعة' : 'hours'}`
              }
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: 4,
          background: THEME.colors.border,
          borderRadius: 2,
          marginBottom: 16,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.max(0, Math.min(100, (deal.remaining_coupons / deal.max_coupons) * 100))}%`,
            height: '100%',
            background: deal.remaining_coupons > 5 ? THEME.colors.success : THEME.colors.warning,
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Action Button */}
        <button
          onClick={() => onClaim(deal)}
          disabled={loading || isExpired || deal.remaining_coupons <= 0}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: THEME.radius.md,
            border: 'none',
            background: loading || isExpired || deal.remaining_coupons <= 0 ? 
              THEME.colors.textMuted : 
              THEME.gradients.primary,
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: loading || isExpired || deal.remaining_coupons <= 0 ? 'not-allowed' : 'pointer',
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
                width: 14,
                height: 14,
                border: '2px solid #ffffff33',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>{language === 'ar' ? 'جاري الحصول...' : 'Getting...'}</span>
            </>
          ) : isExpired ? (
            <>
              <span>❌</span>
              <span>{language === 'ar' ? 'انتهت صلاحية العرض' : 'Deal Expired'}</span>
            </>
          ) : deal.remaining_coupons <= 0 ? (
            <>
              <span>😞</span>
              <span>{language === 'ar' ? 'نفدت الكمية' : 'Sold Out'}</span>
            </>
          ) : (
            <>
              <span>🎫</span>
              <span>{language === 'ar' ? 'احصل على الكوبون' : 'Get Coupon'}</span>
            </>
          )}
        </button>
      </div>

      {/* Expired Overlay */}
      {isExpired && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: THEME.radius.lg
        }}>
          <div style={{
            background: THEME.colors.error,
            color: 'white',
            padding: '12px 20px',
            borderRadius: THEME.radius.md,
            fontSize: 16,
            fontWeight: 700,
            textAlign: 'center'
          }}>
            ❌<br/>
            <span style={{ fontSize: 14 }}>
              {language === 'ar' ? 'انتهت صلاحية العرض' : 'Deal Expired'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Enhanced Coupon Modal with QR Code
// ============================================================================
function CouponModal({ coupon, onClose, language = 'ar' }) {
  if (!coupon) return null

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR'
    }).format(amount).replace('QAR', 'ر.ق')
  }

  const generateQRCode = (text) => {
    // Simple QR code placeholder - in production, use a proper QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`
  }

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
        maxWidth: 400,
        width: 'calc(100% - 40px)',
        border: `1px solid ${THEME.colors.border}`,
        zIndex: 1000,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: THEME.colors.textMuted,
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14
          }}
        >
          ✕
        </button>

        {/* Success Animation */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `${THEME.colors.success}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            animation: 'pulse 2s infinite'
          }}>
            <span style={{ fontSize: 36, color: THEME.colors.success }}>🎉</span>
          </div>
          
          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: THEME.colors.text,
            marginBottom: 8
          }}>
            {language === 'ar' ? 'تهانينا!' : 'Congratulations!'}
          </h2>
          
          <p style={{
            fontSize: 14,
            color: THEME.colors.textSecondary,
            margin: 0
          }}>
            {language === 'ar' ? 'حصلت على الكوبون بنجاح' : 'You got the coupon successfully'}
          </p>
        </div>

        {/* QR Code */}
        <div style={{
          textAlign: 'center',
          marginBottom: 20
        }}>
          <img
            src={generateQRCode(coupon.coupon_code)}
            alt="QR Code"
            style={{
              width: 120,
              height: 120,
              border: `2px solid ${THEME.colors.border}`,
              borderRadius: THEME.radius.md,
              background: 'white'
            }}
          />
        </div>

        {/* Coupon Details */}
        <div style={{
          background: THEME.colors.card,
          borderRadius: THEME.radius.lg,
          padding: '20px',
          border: `2px dashed ${THEME.colors.primary}`,
          marginBottom: 20
        }}>
          {/* Coupon Code */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              fontSize: 12,
              color: THEME.colors.textSecondary,
              marginBottom: 4
            }}>
              {language === 'ar' ? 'رمز الكوبون' : 'Coupon Code'}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: THEME.colors.primary,
                fontFamily: 'monospace',
                letterSpacing: 2,
                padding: '8px',
                background: `${THEME.colors.primary}10`,
                borderRadius: THEME.radius.sm,
                cursor: 'pointer',
                userSelect: 'all'
              }}
              onClick={(e) => {
                navigator.clipboard.writeText(coupon.coupon_code)
                e.target.style.background = `${THEME.colors.success}20`
                setTimeout(() => {
                  e.target.style.background = `${THEME.colors.primary}10`
                }, 500)
              }}
            >
              {coupon.coupon_code}
            </div>
            <div style={{
              fontSize: 10,
              color: THEME.colors.textMuted,
              marginTop: 4
            }}>
              {language === 'ar' ? 'اضغط للنسخ' : 'Tap to copy'}
            </div>
          </div>

          {/* Deal Information */}
          <div style={{
            borderTop: `1px solid ${THEME.colors.border}`,
            paddingTop: 16
          }}>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: THEME.colors.text,
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {language === 'ar' ? 
                (coupon.deals?.title_ar || coupon.deals?.title) : 
                (coupon.deals?.title_en || coupon.deals?.title)
              }
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}>
              <span style={{
                fontSize: 12,
                color: THEME.colors.textSecondary
              }}>
                🏪 {coupon.merchants?.name || 'المتجر'}
              </span>
              
              <span style={{
                fontSize: 18,
                fontWeight: 900,
                color: THEME.colors.success
              }}>
                {formatCurrency(coupon.final_amount)}
              </span>
            </div>
            
            {/* Status and Expiry */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11
            }}>
              <div style={{
                color: coupon.status === 'active' ? THEME.colors.success : THEME.colors.warning,
                fontWeight: 600
              }}>
                ● {coupon.status === 'active' ? 
                  (language === 'ar' ? 'نشط' : 'Active') : 
                  (language === 'ar' ? 'مستخدم' : 'Used')
                }
              </div>
              
              <div style={{
                color: THEME.colors.warning
              }}>
                ⏰ {language === 'ar' ? 'ينتهي:' : 'Expires:'} {new Date(coupon.expires_at).toLocaleDateString('ar-QA')}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div style={{
          background: `${THEME.colors.info}15`,
          border: `1px solid ${THEME.colors.info}30`,
          borderRadius: THEME.radius.md,
          padding: '12px 16px',
          marginBottom: 20
        }}>
          <div style={{
            fontSize: 12,
            color: THEME.colors.info,
            fontWeight: 600,
            marginBottom: 4
          }}>
            {language === 'ar' ? 'تعليمات الاستخدام:' : 'Usage Instructions:'}
          </div>
          <div style={{
            fontSize: 11,
            color: THEME.colors.text,
            lineHeight: 1.4
          }}>
            {language === 'ar' 
              ? '1. اعرض هذا الكوبون أو الـ QR Code للكاشير\n2. سيتم خصم المبلغ تلقائياً\n3. استمتع بصفقتك!' 
              : '1. Show this coupon or QR Code to the cashier\n2. Discount will be applied automatically\n3. Enjoy your deal!'
            }
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: THEME.radius.md,
              border: `1px solid ${THEME.colors.border}`,
              background: 'none',
              color: THEME.colors.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {language === 'ar' ? 'حسناً' : 'OK'}
          </button>
          
          <button
            onClick={() => {
              // Share coupon functionality
              const shareData = {
                title: language === 'ar' ? 'كوبون خصم من وِجهة' : 'Discount Coupon from Wejha',
                text: `${language === 'ar' ? 'كود الكوبون:' : 'Coupon Code:'} ${coupon.coupon_code}`,
                url: window.location.href
              }
              
              if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                navigator.share(shareData)
              } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
                alert(language === 'ar' ? 'تم نسخ تفاصيل الكوبون' : 'Coupon details copied to clipboard')
              }
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: THEME.radius.md,
              border: 'none',
              background: THEME.gradients.primary,
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📤 {language === 'ar' ? 'مشاركة' : 'Share'}
          </button>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// User Coupons Section
// ============================================================================
function UserCoupons({ coupons, language = 'ar' }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR'
    }).format(amount).replace('QAR', 'ر.ق')
  }

  const activeCoupons = coupons.filter(c => c.status === 'active')
  const usedCoupons = coupons.filter(c => c.status === 'used')

  if (coupons.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: THEME.colors.textSecondary
      }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎫</div>
        <p>{language === 'ar' ? 'لا توجد كوبونات حتى الآن' : 'No coupons yet'}</p>
        <p style={{ fontSize: 12, marginTop: 8 }}>
          {language === 'ar' ? 'ابدأ في استكشاف العروض للحصول على كوبونات رائعة!' : 'Start exploring deals to get amazing coupons!'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Active Coupons */}
      {activeCoupons.length > 0 && (
        <>
          <h3 style={{
            fontSize: 18,
            fontWeight: 700,
            color: THEME.colors.text,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>🎫</span>
            <span>{language === 'ar' ? 'كوبوناتك النشطة' : 'Your Active Coupons'}</span>
            <span style={{
              background: THEME.colors.success,
              color: 'white',
              padding: '2px 8px',
              borderRadius: THEME.radius.sm,
              fontSize: 10
            }}>
              {activeCoupons.length}
            </span>
          </h3>
          
          <div style={{
            display: 'grid',
            gap: 16,
            marginBottom: 32
          }}>
            {activeCoupons.map(coupon => (
              <div
                key={coupon.id}
                style={{
                  background: THEME.colors.surface,
                  borderRadius: THEME.radius.lg,
                  padding: '16px',
                  border: `1px solid ${THEME.colors.success}40`,
                  position: 'relative'
                }}
              >
                {/* Coupon Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12
                }}>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: THEME.colors.text
                  }}>
                    {formatCurrency(coupon.final_amount)}
                  </div>
                  <div style={{
                    background: THEME.colors.success,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: THEME.radius.sm,
                    fontSize: 10,
                    fontWeight: 600
                  }}>
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </div>
                </div>

                {/* Deal Title */}
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: THEME.colors.text,
                  marginBottom: 8
                }}>
                  {language === 'ar' ? 
                    (coupon.deals?.title_ar || coupon.deals?.title) : 
                    (coupon.deals?.title_en || coupon.deals?.title)
                  }
                </div>

                {/* Merchant and Code */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: THEME.colors.textSecondary,
                  marginBottom: 12
                }}>
                  <span>🏪 {coupon.merchants?.name}</span>
                  <span style={{ 
                    fontFamily: 'monospace',
                    background: THEME.colors.card,
                    padding: '2px 6px',
                    borderRadius: THEME.radius.sm
                  }}>
                    {coupon.coupon_code}
                  </span>
                </div>

                {/* Expiry */}
                <div style={{
                  fontSize: 11,
                  color: THEME.colors.warning,
                  textAlign: 'center'
                }}>
                  ⏰ {language === 'ar' ? 'ينتهي في:' : 'Expires:'} {new Date(coupon.expires_at).toLocaleDateString('ar-QA')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Used Coupons */}
      {usedCoupons.length > 0 && (
        <>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: THEME.colors.textSecondary,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>✅</span>
            <span>{language === 'ar' ? 'الكوبونات المستخدمة' : 'Used Coupons'}</span>
            <span style={{
              background: THEME.colors.textMuted,
              color: 'white',
              padding: '2px 8px',
              borderRadius: THEME.radius.sm,
              fontSize: 10
            }}>
              {usedCoupons.length}
            </span>
          </h3>
          
          <div style={{
            display: 'grid',
            gap: 12
          }}>
            {usedCoupons.slice(0, 5).map(coupon => (
              <div
                key={coupon.id}
                style={{
                  background: THEME.colors.card,
                  borderRadius: THEME.radius.md,
                  padding: '12px',
                  border: `1px solid ${THEME.colors.border}`,
                  opacity: 0.7
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12
                }}>
                  <span style={{ color: THEME.colors.text }}>
                    {language === 'ar' ? 
                      (coupon.deals?.title_ar || coupon.deals?.title) : 
                      (coupon.deals?.title_en || coupon.deals?.title)
                    }
                  </span>
                  <span style={{ color: THEME.colors.textMuted }}>
                    ✅ {language === 'ar' ? 'مستخدم' : 'Used'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// MAIN CUSTOMER APP COMPONENT
// ============================================================================
export default function UserApp({ language = 'ar' }) {
  // Authentication State
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // App Data State
  const [categories, setCategories] = useState([])
  const [deals, setDeals] = useState([])
  const [merchants, setMerchants] = useState([])
  const [userCoupons, setUserCoupons] = useState([])
  
  // UI State
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedMerchant, setSelectedMerchant] = useState(null)
  const [loading, setLoading] = useState({
    deals: false,
    claim: false,
    categories: false,
    merchants: false,
    coupons: false
  })
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentView, setCurrentView] = useState('deals') // deals, map, coupons
  const [showFilters, setShowFilters] = useState(false)

  // Check existing session on mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  // Load app data after authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadAppData()
    }
  }, [isAuthenticated])

  // Reload deals when category or search changes
  useEffect(() => {
    if (isAuthenticated) {
      loadDeals()
    }
  }, [selectedCategory, searchTerm])

  const checkExistingSession = () => {
    try {
      const savedSession = localStorage.getItem('wejha_user_session')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        
        // Check if session is still valid (24 hours)
        const loginTime = new Date(session.loginTime)
        const now = new Date()
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          setUser(session.user)
          setIsAuthenticated(true)
          console.log('✅ Restored user session:', session.user.id)
        } else {
          localStorage.removeItem('wejha_user_session')
          console.log('❌ Session expired')
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
      localStorage.removeItem('wejha_user_session')
    }
  }

  const loadAppData = async () => {
    await Promise.all([
      loadCategories(),
      loadDeals(),
      loadMerchants(),
      loadUserCoupons()
    ])
  }

  const loadCategories = async () => {
    try {
      setLoading(prev => ({ ...prev, categories: true }))
      console.log('📂 Loading categories...')
      
      const result = await getCategories()
      
      if (result.error) {
        console.error('Categories error:', result.error)
      } else {
        const activeCategories = result.data.filter(cat => cat.is_active !== false)
        setCategories(activeCategories)
        console.log('✅ Categories loaded:', activeCategories.length)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(prev => ({ ...prev, categories: false }))
    }
  }

  const loadDeals = async () => {
    try {
      setLoading(prev => ({ ...prev, deals: true }))
      console.log('🎯 Loading deals...')
      
      const result = await getDeals()
      
      if (result.error) {
        console.error('Deals error:', result.error)
        setDeals([])
      } else {
        let filteredDeals = result.data.filter(deal => {
          // Only show active deals with remaining coupons
          const isActive = deal.is_active !== false
          const hasStock = deal.remaining_coupons > 0
          const notExpired = new Date(deal.expires_at) > new Date()
          
          return isActive && hasStock && notExpired
        })
        
        // Filter by category
        if (selectedCategory) {
          filteredDeals = filteredDeals.filter(deal => deal.category_id === selectedCategory)
        }
        
        // Filter by search term
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase()
          filteredDeals = filteredDeals.filter(deal => {
            const title = language === 'ar' ? 
              (deal.title_ar || deal.title) : 
              (deal.title_en || deal.title)
            const description = language === 'ar' ? 
              (deal.description_ar || deal.description) : 
              (deal.description_en || deal.description)
            const merchantName = deal.merchants?.name || ''
            
            return title.toLowerCase().includes(searchLower) ||
                   description?.toLowerCase().includes(searchLower) ||
                   merchantName.toLowerCase().includes(searchLower)
          })
        }
        
        // Sort by featured, then by expiry date
        filteredDeals.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1
          if (!a.is_featured && b.is_featured) return 1
          return new Date(a.expires_at) - new Date(b.expires_at)
        })
        
        setDeals(filteredDeals)
        console.log('✅ Deals loaded and filtered:', filteredDeals.length)
      }
    } catch (error) {
      console.error('Failed to load deals:', error)
      setDeals([])
    } finally {
      setLoading(prev => ({ ...prev, deals: false }))
    }
  }

  const loadMerchants = async () => {
    try {
      setLoading(prev => ({ ...prev, merchants: true }))
      console.log('🏪 Loading merchants...')
      
      const result = await getMerchants()
      
      if (result.error) {
        console.error('Merchants error:', result.error)
      } else {
        const activeMerchants = result.data.filter(merchant => 
          merchant.status === 'active' && 
          merchant.verification_status === 'verified'
        )
        setMerchants(activeMerchants)
        console.log('✅ Merchants loaded:', activeMerchants.length)
      }
    } catch (error) {
      console.error('Failed to load merchants:', error)
    } finally {
      setLoading(prev => ({ ...prev, merchants: false }))
    }
  }

  const loadUserCoupons = async () => {
    if (!user?.id) return
    
    try {
      setLoading(prev => ({ ...prev, coupons: true }))
      console.log('🎫 Loading user coupons...')
      
      const result = await getUserCoupons(user.id)
      
      if (result.error) {
        console.error('User coupons error:', result.error)
      } else {
        setUserCoupons(result.data)
        console.log('✅ User coupons loaded:', result.data.length)
      }
    } catch (error) {
      console.error('Failed to load user coupons:', error)
    } finally {
      setLoading(prev => ({ ...prev, coupons: false }))
    }
  }

  const handleClaimCoupon = async (deal) => {
    if (!user?.id) {
      alert(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first')
      return
    }

    try {
      setLoading(prev => ({ ...prev, claim: true }))
      console.log('🎫 Claiming coupon for deal:', deal.id)
      
      const result = await claimCoupon(user.id, deal.id)
      
      if (result.error) {
        alert(result.error)
        console.error('Claim error:', result.error)
      } else {
        console.log('✅ Coupon claimed successfully')
        setSelectedCoupon(result.data)
        
        // Refresh data
        await Promise.all([
          loadDeals(), // Update remaining count
          loadUserCoupons() // Update user coupons
        ])
      }
    } catch (error) {
      console.error('Claim coupon error:', error)
      alert(language === 'ar' ? 'فشل في الحصول على الكوبون' : 'Failed to get coupon')
    } finally {
      setLoading(prev => ({ ...prev, claim: false }))
    }
  }

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleLogout = () => {
    if (confirm(language === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Do you want to logout?')) {
      localStorage.removeItem('wejha_user_session')
      setUser(null)
      setIsAuthenticated(false)
      setSelectedCategory(null)
      setDeals([])
      setUserCoupons([])
      setCurrentView('deals')
      console.log('👋 User logged out')
    }
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    console.log('✅ User authenticated:', userData.id)
  }

  // Show authentication if not logged in
  if (!isAuthenticated) {
    return <CustomerAuth onAuthSuccess={handleAuthSuccess} language={language} />
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR'
    }).format(amount).replace('QAR', 'ر.ق')
  }

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
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          {/* Logo and Welcome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              background: THEME.gradients.primary,
              borderRadius: THEME.radius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              🎯
            </div>
            <div>
              <h1 style={{
                fontSize: 18,
                fontWeight: 900,
                margin: 0,
                fontFamily: "'Tajawal', sans-serif",
                color: THEME.colors.text
              }}>
                {language === 'ar' ? 'وِجهة' : 'Wejha'}
              </h1>
              <p style={{
                fontSize: 11,
                color: THEME.colors.textSecondary,
                margin: 0
              }}>
                {language === 'ar' ? `أهلاً ${user?.full_name || 'بك'}` : `Welcome ${user?.full_name || ''}`}
              </p>
            </div>
          </div>

          {/* User Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setCurrentView(currentView === 'coupons' ? 'deals' : 'coupons')}
              style={{
                padding: '8px 12px',
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.border}`,
                background: currentView === 'coupons' ? THEME.colors.primary : 'none',
                color: currentView === 'coupons' ? 'white' : THEME.colors.text,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                position: 'relative'
              }}
            >
              <span>🎫</span>
              <span>{language === 'ar' ? 'كوبوناتي' : 'My Coupons'}</span>
              {userCoupons.filter(c => c.status === 'active').length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: THEME.colors.error,
                  color: 'white',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {userCoupons.filter(c => c.status === 'active').length}
                </span>
              )}
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
              👋 {language === 'ar' ? 'خروج' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {currentView === 'deals' && (
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center'
          }}>
            <div style={{ 
              flex: 1,
              position: 'relative'
            }}>
              <input
                type="text"
                placeholder={language === 'ar' ? 'ابحث عن عرض أو متجر...' : 'Search for deals or stores...'}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  borderRadius: THEME.radius.md,
                  border: `1px solid ${THEME.colors.border}`,
                  background: THEME.colors.card,
                  color: THEME.colors.text,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
              <span style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: THEME.colors.textMuted
              }}>
                🔍
              </span>
            </div>
            
            <button
              onClick={() => setCurrentView(currentView === 'map' ? 'deals' : 'map')}
              style={{
                padding: '12px',
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.border}`,
                background: currentView === 'map' ? THEME.colors.primary : 'none',
                color: currentView === 'map' ? 'white' : THEME.colors.text,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              {currentView === 'map' ? '📋' : '🗺️'}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Deals View */}
        {currentView === 'deals' && (
          <>
            {/* Categories Filter */}
            {categories.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 8
                }}>
                  <button
                    onClick={() => handleCategoryFilter(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: THEME.radius.md,
                      border: `1px solid ${THEME.colors.border}`,
                      background: !selectedCategory ? THEME.colors.primary : 'none',
                      color: !selectedCategory ? 'white' : THEME.colors.text,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🌟 {language === 'ar' ? 'الكل' : 'All'}
                  </button>
                  
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryFilter(category.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        background: selectedCategory === category.id ? THEME.colors.primary : 'none',
                        color: selectedCategory === category.id ? 'white' : THEME.colors.text,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {language === 'ar' ? (category.name_ar || category.name) : (category.name_en || category.name)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Deals Grid */}
            {loading.deals ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 20
              }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    style={{
                      height: 300,
                      background: THEME.colors.surface,
                      borderRadius: THEME.radius.lg,
                      border: `1px solid ${THEME.colors.border}`,
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}
                  />
                ))}
              </div>
            ) : deals.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 20
              }}>
                {deals.map(deal => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onClaim={handleClaimCoupon}
                    loading={loading.claim}
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: THEME.colors.textSecondary
              }}>
                <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.5 }}>
                  {searchTerm ? '🔍' : selectedCategory ? '📂' : '🎯'}
                </div>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: THEME.colors.text
                }}>
                  {language === 'ar' ? 'لا توجد عروض' : 'No deals found'}
                </h3>
                <p style={{
                  fontSize: 14,
                  marginBottom: 20
                }}>
                  {searchTerm ? 
                    (language === 'ar' ? 'جرب كلمات بحث مختلفة' : 'Try different search terms') :
                    selectedCategory ?
                    (language === 'ar' ? 'لا توجد عروض في هذه الفئة حالياً' : 'No deals in this category currently') :
                    (language === 'ar' ? 'سيتم إضافة عروض جديدة قريباً' : 'New deals will be added soon')
                  }
                </p>
                {(searchTerm || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory(null)
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: THEME.radius.md,
                      border: `1px solid ${THEME.colors.border}`,
                      background: 'none',
                      color: THEME.colors.text,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    {language === 'ar' ? 'إظهار جميع العروض' : 'Show all deals'}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Map View */}
        {currentView === 'map' && (
          <MerchantsMap
            merchants={merchants}
            selectedMerchant={selectedMerchant}
            onMerchantSelect={setSelectedMerchant}
            language={language}
          />
        )}

        {/* Coupons View */}
        {currentView === 'coupons' && (
          <UserCoupons
            coupons={userCoupons}
            language={language}
          />
        )}
      </div>

      {/* Coupon Success Modal */}
      {selectedCoupon && (
        <CouponModal
          coupon={selectedCoupon}
          onClose={() => setSelectedCoupon(null)}
          language={language}
        />
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
        
        .deal-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(139, 31, 36, 0.2);
        }
      `}</style>
    </div>
  )
}
