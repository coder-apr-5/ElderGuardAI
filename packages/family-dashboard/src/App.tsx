import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layout/DashboardLayout';
import { MedicationsPage } from './pages/MedicationsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Family Dashboard shell */}
        <Route path="/family" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/family/medications" replace />} />
          <Route path="medications" element={<MedicationsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/family/medications" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
