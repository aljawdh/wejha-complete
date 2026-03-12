'use client'
import { useState, useEffect } from 'react'
import CustomerAuth from '../components/CustomerAuth'
import UserApp from '../components/UserApp'
import MerchantAuth from '../components/MerchantAuth'
import MerchantDashboard from '../components/MerchantDashboard'
import AdminApp from '../components/AdminApp'

export default function HomePage() {
  const [currentView, setCurrentView] = useState('customer-auth')
  const [user, setUser] = useState(null)
  const [merchant, setMerchant] = useState(null)

  // Check for existing sessions on load
  useEffect(() => {
    // Check customer session
    const savedUser = localStorage.getItem('wejha_user_session')
    if (savedUser) {
      try {
        const userSession = JSON.parse(savedUser)
        const loginTime = new Date(userSession.loginTime)
        const now = new Date()
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) { // 24-hour session
          setUser(userSession.user)
          setCurrentView('customer-app')
        } else {
          localStorage.removeItem('wejha_user_session')
        }
      } catch (error) {
        localStorage.removeItem('wejha_user_session')
      }
    }

    // Check merchant session
    const savedMerchant = localStorage.getItem('wejha_merchant_session')
    if (savedMerchant) {
      try {
        const merchantSession = JSON.parse(savedMerchant)
        const loginTime = new Date(merchantSession.loginTime)
        const now = new Date()
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60)
        
        if (hoursDiff < 8) { // 8-hour session for merchants
          setMerchant(merchantSession.merchant)
          setCurrentView('merchant-dashboard')
        } else {
          localStorage.removeItem('wejha_merchant_session')
        }
      } catch (error) {
        localStorage.removeItem('wejha_merchant_session')
      }
    }

    // Check for admin or merchant login routes
    const path = window.location.pathname
    if (path === '/admin/login') {
      setCurrentView('admin-app')
    } else if (path === '/merchant/login' || path === '/merchant/register') {
      setCurrentView('merchant-auth')
    }
  }, [])

  const handleCustomerLogin = (userData) => {
    setUser(userData)
    setCurrentView('customer-app')
  }

  const handleCustomerLogout = () => {
    setUser(null)
    setCurrentView('customer-auth')
    localStorage.removeItem('wejha_user_session')
  }

  const handleMerchantLogin = (merchantData) => {
    setMerchant(merchantData)
    setCurrentView('merchant-dashboard')
  }

  const handleMerchantLogout = () => {
    setMerchant(null)
    setCurrentView('customer-auth')
    localStorage.removeItem('wejha_merchant_session')
  }

  const handleViewChange = (view) => {
    setCurrentView(view)
  }

  // Route-based rendering
  if (typeof window !== 'undefined') {
    const path = window.location.pathname
    
    if (path === '/admin/login') {
      return <AdminApp language="ar" />
    }
    
    if (path === '/merchant/login' || path === '/merchant/register') {
      return (
        <MerchantAuth 
          language="ar" 
          onLogin={handleMerchantLogin}
          onViewChange={handleViewChange}
        />
      )
    }
  }

  // Main app rendering
  switch (currentView) {
    case 'customer-app':
      return (
        <UserApp
          user={user}
          onLogout={handleCustomerLogout}
          onViewChange={handleViewChange}
          language="ar"
        />
      )
      
    case 'merchant-dashboard':
      return (
        <MerchantDashboard
          merchant={merchant}
          onLogout={handleMerchantLogout}
          language="ar"
        />
      )
      
    case 'admin-app':
      return <AdminApp language="ar" />
      
    case 'merchant-auth':
      return (
        <MerchantAuth 
          language="ar" 
          onLogin={handleMerchantLogin}
          onViewChange={handleViewChange}
        />
      )
      
    default:
      return (
        <CustomerAuth
          onLogin={handleCustomerLogin}
          onViewChange={handleViewChange}
          language="ar"
        />
      )
  }
}
