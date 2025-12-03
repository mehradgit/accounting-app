'use client'

import { useState } from 'react'

export default function Header() {
  const [user] = useState({
    name: 'کاربر سیستم',
    role: 'مدیر'
  })

  return (
    <header className="header bg-white shadow-sm border-bottom py-3 px-4">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">سیستم حسابداری و انبارداری</h4>
            <small className="text-muted">به سیستم خوش آمدید</small>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="fw-medium">{user.name}</div>
              <small className="text-muted">{user.role}</small>
            </div>
            
            <div className="dropdown">
              <button 
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '40px', height: '40px' }}
              >
                <span>👤</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}