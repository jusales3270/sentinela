import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import ScanPage from './pages/ScanPage'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import DomainVerify from './pages/DomainVerify'
import AuthTerms from './pages/AuthTerms'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scan/:id" element={<ScanPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/verify-domain" element={<DomainVerify />} />
        <Route path="/authorize" element={<AuthTerms />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
