import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
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
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [stations] = useState<Station[]>(mockStations)
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments)
  const [waveformData, setWaveformData] = useState<WaveformData[]>(mockWaveformData)
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>(mockEarthquakes)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(mockMaintenanceRecords)
  const [dutySchedules, setDutySchedules] = useState<DutySchedule[]>(mockDutySchedules)
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>(mockHandoverRecords)
  const [meetingRecords, setMeetingRecords] = useState<MeetingRecord[]>(mockMeetingRecords)
  const [transmissionStatus] = useState<TransmissionStatus[]>(mockTransmissionStatus)

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
