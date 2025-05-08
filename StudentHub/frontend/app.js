import React from 'react';
import ReactDOM from 'react-dom/client';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import Register from './src/components/Register';
import Login from './src/components/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
            <h1 className="text-2xl font-semibold">StudentHub</h1>
          </header>
          <main className="flex-grow p-6">
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Login />} />
            </Routes>
          </main>
          <footer className="bg-gray-200 dark:bg-gray-800 text-center p-4 text-sm text-gray-600 dark:text-gray-400">
            &copy; 2024 StudentHub. All rights reserved.
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
