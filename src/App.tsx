import { useState } from 'react';
import { Button } from "@/components/ui/button";
import RecordPage from './pages/RecordPage';
import HistoryPage from './pages/HistoryPage';
import { History, Mic2 } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'record' | 'history'>('record');

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex space-x-8">
                <Button
                  variant={currentPage === 'record' ? 'default' : 'ghost'}
                  onClick={() => setCurrentPage('record')}
                >
                  <Mic2 className="mr-2 h-4 w-4" />
                  Record
                </Button>
                <Button
                  variant={currentPage === 'history' ? 'default' : 'ghost'}
                  onClick={() => setCurrentPage('history')}
                >
                  <History className="mr-2 h-4 w-4" />
                  History
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {currentPage === 'record' ? <RecordPage /> : <HistoryPage />}
    </div>
  );
}