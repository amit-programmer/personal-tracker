import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import NotFound from './components/NotFound'
import Login from './components/Login'
import Signup from './components/Signup'
import Finance from './components/Finance'
import Food from './components/Food'
import Sleep from './components/Sleep'
import Study from './components/Study'
import Target from './components/Target'
import Exercise from './components/Exercise'
import Habit from './components/Habit'

export default function MainRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/finance" element={<Finance />} />
        <Route path="/food" element={<Food />} />
        <Route path="/sleep" element={<Sleep />} />
        <Route path="/study" element={<Study />} />
        <Route path="/target" element={<Target />} />
        <Route path="/exercise" element={<Exercise />} />
        <Route path="/habit" element={<Habit />} />
        

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
