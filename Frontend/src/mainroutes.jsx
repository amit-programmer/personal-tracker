import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import NotFound from './components/NotFound'
import Login from './components/Login'
import Signup from './components/Signup'
import Finance from './components/Finance'
import Food from './components/Food'

export default function MainRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/finance" element={<Finance />} />
        <Route path="/food" element={<Food />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
