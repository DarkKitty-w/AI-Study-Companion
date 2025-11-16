import React from 'react';
import { AppProvider } from './contexts/AppContext';
import Header from './components/common/Header';
import ToolSelector from './components/layout/ToolSelector';
import MainContent from './components/layout/MainContent';
import SettingsModal from './components/common/SettingsModal';

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-80 flex-shrink-0">
              <ToolSelector />
            </div>
            <div className="flex-1 min-w-0">
              <MainContent />
            </div>
          </div>
        </div>
        <SettingsModal />
      </div>
    </AppProvider>
  );
}

export default App;