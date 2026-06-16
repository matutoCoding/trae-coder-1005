import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type {
  Station,
  Equipment,
  WaveformData,
  Earthquake,
  MaintenanceRecord,
  DutySchedule,
  HandoverRecord,
  MeetingRecord,
  TransmissionStatus,
} from '../types'
import {
  mockStations,
  mockEquipments,
  mockWaveformData,
  mockEarthquakes,
  mockMaintenanceRecords,
  mockDutySchedules,
  mockHandoverRecords,
  mockMeetingRecords,
  mockTransmissionStatus,
} from '../mock/data'

const STORAGE_KEY = 'seismic-station-data-v1'

interface PersistedStateShape {
  equipments: Equipment[]
  waveformData: WaveformData[]
  earthquakes: Earthquake[]
  maintenanceRecords: MaintenanceRecord[]
  dutySchedules: DutySchedule[]
  handoverRecords: HandoverRecord[]
  meetingRecords: MeetingRecord[]
}

const defaultPersisted: PersistedStateShape = {
  equipments: mockEquipments,
  waveformData: mockWaveformData,
  earthquakes: mockEarthquakes,
  maintenanceRecords: mockMaintenanceRecords,
  dutySchedules: mockDutySchedules,
  handoverRecords: mockHandoverRecords,
  meetingRecords: mockMeetingRecords,
}

const loadPersisted = (): PersistedStateShape => {
  try {
    if (typeof window === 'undefined') return defaultPersisted
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPersisted
    const parsed = JSON.parse(raw)
    return { ...defaultPersisted, ...parsed }
  } catch {
    return defaultPersisted
  }
}

const savePersisted = (state: PersistedStateShape) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  } catch {
    /* ignore */
  }
}

interface AppState {
  stations: Station[]
  equipments: Equipment[]
  waveformData: WaveformData[]
  earthquakes: Earthquake[]
  maintenanceRecords: MaintenanceRecord[]
  dutySchedules: DutySchedule[]
  handoverRecords: HandoverRecord[]
  meetingRecords: MeetingRecord[]
  transmissionStatus: TransmissionStatus[]
}

interface AppContextType extends AppState {
  setEquipments: React.Dispatch<React.SetStateAction<Equipment[]>>
  setEarthquakes: React.Dispatch<React.SetStateAction<Earthquake[]>>
  setMaintenanceRecords: React.Dispatch<React.SetStateAction<MaintenanceRecord[]>>
  setDutySchedules: React.Dispatch<React.SetStateAction<DutySchedule[]>>
  setHandoverRecords: React.Dispatch<React.SetStateAction<HandoverRecord[]>>
  setMeetingRecords: React.Dispatch<React.SetStateAction<MeetingRecord[]>>
  setWaveformData: React.Dispatch<React.SetStateAction<WaveformData[]>>
  addMaintenanceRecord: (record: MaintenanceRecord) => void
  updateMaintenanceRecord: (id: string, updates: Partial<MaintenanceRecord>) => void
  addEarthquake: (eq: Earthquake) => void
  updateEarthquake: (id: string, updates: Partial<Earthquake>) => void
  updateEquipment: (id: string, updates: Partial<Equipment>) => void
  addHandoverRecord: (record: HandoverRecord) => void
  updateHandoverRecord: (id: string, updates: Partial<HandoverRecord>) => void
  addMeetingRecord: (record: MeetingRecord) => void
  updateMeetingRecord: (id: string, updates: Partial<MeetingRecord>) => void
  addDutySchedule: (schedule: DutySchedule) => void
  updateDutySchedule: (id: string, updates: Partial<DutySchedule>) => void
  resetAllData: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const initial = loadPersisted()
  const [stations] = useState<Station[]>(mockStations)
  const [equipments, setEquipments] = useState<Equipment[]>(initial.equipments)
  const [waveformData, setWaveformData] = useState<WaveformData[]>(initial.waveformData)
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>(initial.earthquakes)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(initial.maintenanceRecords)
  const [dutySchedules, setDutySchedules] = useState<DutySchedule[]>(initial.dutySchedules)
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>(initial.handoverRecords)
  const [meetingRecords, setMeetingRecords] = useState<MeetingRecord[]>(initial.meetingRecords)
  const [transmissionStatus] = useState<TransmissionStatus[]>(mockTransmissionStatus)

  useEffect(() => {
    savePersisted({
      equipments,
      waveformData,
      earthquakes,
      maintenanceRecords,
      dutySchedules,
      handoverRecords,
      meetingRecords,
    })
  }, [equipments, waveformData, earthquakes, maintenanceRecords, dutySchedules, handoverRecords, meetingRecords])

  const resetAllData = useCallback(() => {
    setEquipments(mockEquipments)
    setWaveformData(mockWaveformData)
    setEarthquakes(mockEarthquakes)
    setMaintenanceRecords(mockMaintenanceRecords)
    setDutySchedules(mockDutySchedules)
    setHandoverRecords(mockHandoverRecords)
    setMeetingRecords(mockMeetingRecords)
  }, [])

  const addMaintenanceRecord = useCallback((record: MaintenanceRecord) => {
    setMaintenanceRecords(prev => [record, ...prev])
  }, [])

  const updateMaintenanceRecord = useCallback((id: string, updates: Partial<MaintenanceRecord>) => {
    setMaintenanceRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }, [])

  const addEarthquake = useCallback((eq: Earthquake) => {
    setEarthquakes(prev => [eq, ...prev])
  }, [])

  const updateEarthquake = useCallback((id: string, updates: Partial<Earthquake>) => {
    setEarthquakes(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }, [])

  const updateEquipment = useCallback((id: string, updates: Partial<Equipment>) => {
    setEquipments(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }, [])

  const addHandoverRecord = useCallback((record: HandoverRecord) => {
    setHandoverRecords(prev => [record, ...prev])
    if (record.scheduleId) {
      setDutySchedules(prev => prev.map(s =>
        s.id === record.scheduleId ? { ...s, handoverRecordId: record.id } : s
      ))
    }
  }, [])

  const updateHandoverRecord = useCallback((id: string, updates: Partial<HandoverRecord>) => {
    setHandoverRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }, [])

  const addMeetingRecord = useCallback((record: MeetingRecord) => {
    setMeetingRecords(prev => [record, ...prev])
    if (record.earthquakeId) {
      setEarthquakes(prev => prev.map(e =>
        e.id === record.earthquakeId ? { ...e, meetingRecordId: record.id } : e
      ))
    }
  }, [])

  const updateMeetingRecord = useCallback((id: string, updates: Partial<MeetingRecord>) => {
    setMeetingRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }, [])

  const addDutySchedule = useCallback((schedule: DutySchedule) => {
    setDutySchedules(prev => [...prev, schedule])
  }, [])

  const updateDutySchedule = useCallback((id: string, updates: Partial<DutySchedule>) => {
    setDutySchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const value: AppContextType = {
    stations,
    equipments,
    waveformData,
    earthquakes,
    maintenanceRecords,
    dutySchedules,
    handoverRecords,
    meetingRecords,
    transmissionStatus,
    setEquipments,
    setEarthquakes,
    setMaintenanceRecords,
    setDutySchedules,
    setHandoverRecords,
    setMeetingRecords,
    setWaveformData,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    addEarthquake,
    updateEarthquake,
    updateEquipment,
    addHandoverRecord,
    updateHandoverRecord,
    addMeetingRecord,
    updateMeetingRecord,
    addDutySchedule,
    updateDutySchedule,
    resetAllData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}
