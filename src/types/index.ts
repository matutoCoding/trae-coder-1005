export interface Station {
  id: string
  name: string
  code: string
  type: '测震台' | '强震台' | '前兆台'
  location: string
  longitude: number
  latitude: number
  altitude: number
  constructionDate: string
  status: '运行中' | '维护中' | '停用'
  equipment: Equipment[]
  contact: string
  phone: string
  description?: string
}

export interface Equipment {
  id: string
  stationId: string
  name: string
  type: '测震仪' | '强震仪' | '数据采集器' | '通信设备' | '电源设备'
  model: string
  manufacturer: string
  installDate: string
  lastMaintenanceDate: string
  status: '正常' | '警告' | '故障' | '离线'
  runTime: number
  temperature?: number
  voltage?: number
  networkStatus?: '在线' | '离线'
}

export interface WaveformData {
  id: string
  stationId: string
  stationName: string
  channel: string
  startTime: string
  endTime: string
  sampleRate: number
  data: number[]
  maxAmplitude: number
  minAmplitude: number
  hasEvent: boolean
}

export interface Earthquake {
  id: string
  location: string
  longitude: number
  latitude: number
  depth: number
  magnitude: number
  magnitudeType: string
  occurTime: string
  reportTime: string
  status: '自动定位' | '人工复核' | '已发布'
  intensity?: string
  affectedPopulation?: number
  stations: string[]
}

export interface PrecursorData {
  id: string
  stationId: string
  type: '水位' | '水温' | '氡气' | '地磁' | '地电' | '形变'
  value: number
  time: string
  unit: string
  threshold: {
    min: number
    max: number
  }
  isAbnormal: boolean
}

export interface MaintenanceRecord {
  id: string
  stationId: string
  equipmentId?: string
  type: '日常维护' | '故障维修' | '应急处置' | '升级改造'
  title: string
  description: string
  status: '待处理' | '处理中' | '已完成'
  startTime: string
  endTime?: string
  handler: string
  result?: string
}

export interface DutySchedule {
  id: string
  date: string
  shift: '早班' | '中班' | '晚班'
  personnel: string[]
  leader: string
  notes?: string
}

export interface MeetingRecord {
  id: string
  title: string
  time: string
  location: string
  participants: string[]
  content: string
  conclusions: string
  recorder: string
}

export interface TransmissionStatus {
  stationId: string
  stationName: string
  lastDataTime: string
  dataDelay: number
  packetLossRate: number
  networkBandwidth: number
  isOnline: boolean
}
