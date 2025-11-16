// src/App.jsx
import React from 'react';
import { AppProvider } from './contexts/AppContext';
import Header from './components/common/Header';
import ToolSelector from './components/layout/ToolSelector';
import MainContent from './components/layout/MainContent';
import ApiKeyModal from './components/common/ApiKeyModal';
import Footer from './components/common/Footer';

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Header />
          <main className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <ToolSelector />
              </div>
              <div className="lg:col-span-3">
                <MainContent />
              </div>
            </div>
          </main>
          <Footer />
        </div>
        <ApiKeyModal />
      </div>
    </AppProvider>
  );
}

export default App;