import React from 'react';
import Nav from './components/Nav';

function App() {
  return (
    <div className="min-h-screen bg-gray-800">
      <Nav />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <header className="w-full max-w-2xl bg-black/80 border border-gray-200 rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-100 mb-3">Personal Tracker</h1>
        <p className="text-gray-400">Welcome — this is your App component. Start building your project here.</p>
      </header>
      </div>
    </div>
  );
}

export default App;