import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import StationLedger from './pages/StationLedger'
import DeviceOperation from './pages/DeviceOperation'
import WaveformData from './pages/WaveformData'
import EarthquakeReport from './pages/EarthquakeReport'
import EarthquakeAnalysis from './pages/EarthquakeAnalysis'
import DeviceMaintenance from './pages/DeviceMaintenance'
import DutyManagement from './pages/DutyManagement'
import Dashboard from './pages/Dashboard'
import { AppProvider } from './store/AppContext'

const App = () => {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="station-ledger" element={<StationLedger />} />
          <Route path="device-operation" element={<DeviceOperation />} />
          <Route path="waveform-data" element={<WaveformData />} />
          <Route path="earthquake-report" element={<EarthquakeReport />} />
          <Route path="earthquake-analysis" element={<EarthquakeAnalysis />} />
          <Route path="device-maintenance" element={<DeviceMaintenance />} />
          <Route path="duty-management" element={<DutyManagement />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}

export default App
