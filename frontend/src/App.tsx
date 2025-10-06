import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/layout/Header';
import FirDashboard from './components/FirDashboard';
import PDFGeneratorPage from './components/PDFGeneratorPage';
import ReportGeneratorPage from './components/ReportGeneratorPage';

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'pdf-generator' | 'reports'>('dashboard');

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

  const canViewPDFGenerator = user?.role === 'admin';
  const canViewReports = user?.role === 'admin' || user?.role === 'sdpo';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header 
          onNavigate={setCurrentPage} 
          showReportsLink={canViewReports}
        />
        <main className="flex-1">
          {currentPage === 'dashboard' && <FirDashboard />}
          {currentPage === 'pdf-generator' && canViewPDFGenerator && <PDFGeneratorPage />}
          {currentPage === 'reports' && canViewReports && <ReportGeneratorPage />}
          {currentPage === 'pdf-generator' && !canViewPDFGenerator && (
            <div className="container mx-auto py-8 px-4">
              <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="text-muted-foreground">
                  You need admin privileges to access the PDF Generator. 
                  Current role: {user?.role || 'Unknown'}
                </p>
              </div>
            </div>
          )}
          {currentPage === 'reports' && !canViewReports && (
            <div className="container mx-auto py-8 px-4">
              <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="text-muted-foreground">
                  You need admin or SDPO privileges to access the Reports. 
                  Current role: {user?.role || 'Unknown'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default App;
