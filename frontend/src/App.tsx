import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/layout/Header';
import FirDashboard from './components/FirDashboard';
import PerformanceReportPage from './components/PerformanceReportPage';
import PDFGeneratorPage from './components/PDFGeneratorPage';

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'performance' | 'pdf-generator'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <AuthPage />;
  }

  const canViewPerformanceReport = user?.role === 'admin' || user?.role === 'sdpo';
  const canViewPDFGenerator = user?.role === 'admin';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header 
          onNavigate={setCurrentPage} 
          showPerformanceLink={canViewPerformanceReport}
          showPDFGeneratorLink={canViewPDFGenerator}
        />
        <main className="flex-1">
          {currentPage === 'dashboard' && <FirDashboard />}
          {currentPage === 'performance' && canViewPerformanceReport && <PerformanceReportPage />}
          {currentPage === 'pdf-generator' && canViewPDFGenerator && <PDFGeneratorPage />}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default App;
