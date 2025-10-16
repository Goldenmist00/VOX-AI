"use client"

import { useState } from 'react'
import { X, LogIn } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Login Required</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-300 mb-6">
          You need to be logged in to join the discussion and add comments.
        </p>
        
        <div className="flex gap-3">
          <a
            href="/login"
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex-1 justify-center"
          >
            <LogIn className="w-4 h-4" />
            Login
          </a>
          <a
            href="/signup"
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex-1 justify-center"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  )
}