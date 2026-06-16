import dayjs from 'dayjs'
import type {
  Station,
  Equipment,
  WaveformData,
  Earthquake,
  PrecursorData,
  MaintenanceRecord,
  DutySchedule,
  HandoverRecord,
  MeetingRecord,
  TransmissionStatus,
} from '../types'

const stationNames = [
  '北京台站', '天津台站', '唐山台站', '张家口台站', '秦皇岛台站',
  '保定台站', '石家庄台站', '太原台站', '大同台站', '呼和浩特台站',
]

export const mockStations: Station[] = stationNames.map((name, index) => ({
  id: `ST-${String(index + 1).padStart(3, '0')}`,
  name,
  code: `B${String(index + 1).padStart(3, '0')}`,
  type: (['测震台', '强震台', '前兆台'] as const)[index % 3],
  location: ['北京市海淀区', '天津市河西区', '河北省唐山市', '河北省张家口市', '河北省秦皇岛市',
    '河北省保定市', '河北省石家庄市', '山西省太原市', '山西省大同市', '内蒙古呼和浩特市'][index],
  longitude: 114.0 + index * 0.5 + Math.random() * 0.3,
  latitude: 38.0 + index * 0.2 + Math.random() * 0.3,
  altitude: 50 + index * 30 + Math.random() * 20,
  constructionDate: dayjs().subtract(5 + index, 'year').format('YYYY-MM-DD'),
  status: (['运行中', '运行中', '运行中', '维护中', '运行中', '运行中', '运行中', '停用', '运行中', '运行中'] as const)[index],
  equipment: [],
  contact: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '冯二'][index],
  phone: `138${String(10000000 + index * 12345).slice(0, 8)}`,
  description: `${name}是国家地震台网的重要台站，配备先进的观测设备。`,
}))

export const mockEquipments: Equipment[] = mockStations.flatMap((station, stationIndex) => [
  {
    id: `EQ-${stationIndex * 4 + 1}`,
    stationId: station.id,
    name: '宽频带测震仪',
    type: '测震仪' as const,
    model: 'CMG-3ESP',
    manufacturer: 'Guralp',
    installDate: dayjs().subtract(3 + stationIndex, 'year').format('YYYY-MM-DD'),
    lastMaintenanceDate: dayjs().subtract(stationIndex, 'month').format('YYYY-MM-DD'),
    lastMaintenanceRecordId: stationIndex === 4 ? 'MR-001' : stationIndex === 7 ? 'MR-002' : undefined,
    status: (['正常', '正常', '警告', '正常', '故障', '正常', '正常', '离线', '正常', '正常'] as const)[stationIndex],
    runTime: 8760 * (3 + stationIndex),
    temperature: 20 + Math.random() * 5,
    voltage: 12 + Math.random() * 0.5,
    networkStatus: (['在线', '在线', '在线', '在线', '离线', '在线', '在线', '离线', '在线', '在线'] as const)[stationIndex],
  },
  {
    id: `EQ-${stationIndex * 4 + 2}`,
    stationId: station.id,
    name: '强震加速度仪',
    type: '强震仪' as const,
    model: 'Episensor',
    manufacturer: 'Kinemetrics',
    installDate: dayjs().subtract(2 + stationIndex, 'year').format('YYYY-MM-DD'),
    lastMaintenanceDate: dayjs().subtract(stationIndex + 1, 'month').format('YYYY-MM-DD'),
    status: '正常' as const,
    runTime: 8760 * (2 + stationIndex),
    temperature: 21 + Math.random() * 4,
    voltage: 12.5 + Math.random() * 0.3,
    networkStatus: '在线' as const,
  },
  {
    id: `EQ-${stationIndex * 4 + 3}`,
    stationId: station.id,
    name: '数据采集器',
    type: '数据采集器' as const,
    model: 'Q330HR',
    manufacturer: 'Quanterra',
    installDate: dayjs().subtract(2 + stationIndex, 'year').format('YYYY-MM-DD'),
    lastMaintenanceDate: dayjs().subtract(stationIndex + 2, 'month').format('YYYY-MM-DD'),
    status: (['正常', '正常', '正常', '正常', '正常', '警告', '正常', '离线', '正常', '正常'] as const)[stationIndex],
    runTime: 8760 * (2 + stationIndex),
    temperature: 22 + Math.random() * 3,
    voltage: 24 + Math.random() * 1,
    networkStatus: '在线' as const,
  },
  {
    id: `EQ-${stationIndex * 4 + 4}`,
    stationId: station.id,
    name: '卫星通信终端',
    type: '通信设备' as const,
    model: 'BGAN Explorer',
    manufacturer: 'Hughes',
    installDate: dayjs().subtract(1 + stationIndex, 'year').format('YYYY-MM-DD'),
    lastMaintenanceDate: dayjs().subtract(stationIndex + 3, 'month').format('YYYY-MM-DD'),
    status: '正常' as const,
    runTime: 8760 * (1 + stationIndex),
    temperature: 23 + Math.random() * 2,
    voltage: 48 + Math.random() * 2,
    networkStatus: '在线' as const,
  },
])

const generateWaveformData = (length: number, hasEvent: boolean = false): number[] => {
  const data: number[] = []
  for (let i = 0; i < length; i++) {
    let value = Math.sin(i * 0.1) * 0.3 + Math.random() * 0.2 - 0.1
    if (hasEvent && i > length * 0.4 && i < length * 0.6) {
      value += Math.sin(i * 0.5) * 2 * Math.exp(-Math.pow((i - length * 0.5) / 50, 2))
    }
    data.push(value)
  }
  return data
}

export const mockWaveformData: WaveformData[] = mockStations.slice(0, 5).map((station, index) => ({
  id: `WV-${index + 1}`,
  stationId: station.id,
  stationName: station.name,
  channel: ['BHE', 'BHN', 'BHZ'][index % 3],
  startTime: dayjs().subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  sampleRate: 100,
  data: generateWaveformData(1000, index === 2),
  maxAmplitude: index === 2 ? 2.5 : 0.8,
  minAmplitude: index === 2 ? -2.3 : -0.7,
  hasEvent: index === 2,
  prelimMagnitude: index === 2 ? 3.8 : undefined,
}))

export const mockEarthquakes: Earthquake[] = [
  {
    id: 'EQ-2024-001',
    location: '河北省唐山市古冶区',
    longitude: 118.45,
    latitude: 39.75,
    depth: 12,
    magnitude: 4.5,
    magnitudeType: 'ML',
    occurTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    reportTime: dayjs().subtract(2, 'hour').add(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    autoLocateTime: dayjs().subtract(2, 'hour').add(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    reviewTime: dayjs().subtract(2, 'hour').add(15, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    publishTime: dayjs().subtract(2, 'hour').add(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    status: '已发布',
    intensity: 'V',
    affectedPopulation: 500000,
    stations: ['ST-001', 'ST-002', 'ST-003', 'ST-004', 'ST-005'],
    sourceType: 'auto',
    meetingRequired: true,
    meetingRecordId: 'MT-001',
  },
  {
    id: 'EQ-2024-002',
    location: '山西省太原市小店区',
    longitude: 112.55,
    latitude: 37.85,
    depth: 8,
    magnitude: 3.2,
    magnitudeType: 'ML',
    occurTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    reportTime: dayjs().subtract(1, 'day').add(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    autoLocateTime: dayjs().subtract(1, 'day').add(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    status: '人工复核',
    stations: ['ST-007', 'ST-008', 'ST-009'],
    sourceType: 'auto',
    meetingRequired: false,
  },
  {
    id: 'EQ-2024-003',
    location: '内蒙古呼和浩特市',
    longitude: 111.75,
    latitude: 40.82,
    depth: 15,
    magnitude: 2.8,
    magnitudeType: 'ML',
    occurTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
    reportTime: dayjs().subtract(3, 'day').add(1, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    autoLocateTime: dayjs().subtract(3, 'day').add(1, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    status: '自动定位',
    stations: ['ST-010'],
    sourceType: 'auto',
    meetingRequired: false,
  },
]

export const mockPrecursorData: PrecursorData[] = mockStations.flatMap((station, sIndex) =>
  (['水位', '水温', '氡气', '地磁'] as const).map((type, tIndex) => {
    const baseValues: Record<string, number> = {
      '水位': 15,
      '水温': 18,
      '氡气': 12,
      '地磁': 50000,
    }
    const units: Record<string, string> = {
      '水位': 'm',
      '水温': '°C',
      '氡气': 'Bq/L',
      '地磁': 'nT',
    }
    const value = baseValues[type] + (Math.random() - 0.5) * baseValues[type] * 0.1
    const isAbnormal = sIndex === 5 && tIndex === 0
    return {
      id: `PC-${sIndex * 4 + tIndex + 1}`,
      stationId: station.id,
      type,
      value: isAbnormal ? baseValues[type] * 1.5 : value,
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      unit: units[type],
      threshold: {
        min: baseValues[type] * 0.8,
        max: baseValues[type] * 1.2,
      },
      isAbnormal,
    }
  })
)

export const mockMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'MR-001',
    stationId: 'ST-005',
    equipmentId: 'EQ-17',
    type: '故障维修',
    title: '测震仪数据异常',
    description: '测震仪数据波动异常，幅值超出正常范围',
    status: '处理中',
    startTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    handler: '李四',
    sourceType: 'equipment',
    restoreEquipmentStatus: undefined,
  },
  {
    id: 'MR-002',
    stationId: 'ST-008',
    type: '应急处置',
    title: '台站网络中断',
    description: '光纤故障导致数据传输中断，已切换至卫星通信',
    status: '已完成',
    startTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
    endTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    handler: '王五',
    result: '光纤已修复，网络恢复正常',
    sourceType: 'equipment',
    restoreEquipmentStatus: '恢复正常',
  },
  {
    id: 'MR-003',
    stationId: 'ST-004',
    type: '日常维护',
    title: '季度设备巡检',
    description: '对台站所有设备进行例行检查和维护',
    status: '待处理',
    startTime: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    handler: '赵六',
    sourceType: 'manual',
  },
  {
    id: 'MR-004',
    stationId: 'ST-006',
    equipmentId: 'EQ-23',
    type: '故障维修',
    title: '数据采集器警告',
    description: '采集器温度偏高，需要检查散热系统',
    status: '处理中',
    startTime: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    handler: '钱七',
    sourceType: 'manual',
  },
]

export const mockDutySchedules: DutySchedule[] = Array.from({ length: 7 }, (_, i) => {
  const date = dayjs().add(i, 'day').format('YYYY-MM-DD')
  const personnel = [
    ['张三', '李四'],
    ['王五', '赵六'],
    ['钱七', '孙八'],
    ['周九', '吴十'],
    ['郑一', '冯二'],
    ['张三', '王五'],
    ['李四', '赵六'],
  ][i]
  return {
    id: `DS-${String(i + 1).padStart(3, '0')}`,
    date,
    shift: '早班' as const,
    personnel,
    leader: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九'][i],
    handoverRecordId: i === 0 ? 'HO-001' : undefined,
  }
}).flatMap((item) => [
  item,
  { ...item, id: item.id.replace('DS', 'DS2'), shift: '中班' as const, personnel: item.personnel.map(p => p + '_副'), handoverRecordId: item.id === 'DS-001' ? 'HO-002' : undefined },
  { ...item, id: item.id.replace('DS', 'DS3'), shift: '晚班' as const, personnel: item.personnel.map(p => p + '_备') },
])

export const mockHandoverRecords: HandoverRecord[] = [
  {
    id: 'HO-001',
    date: dayjs().format('YYYY-MM-DD'),
    shift: '早班',
    scheduleId: 'DS-001',
    oncomingPersonnel: ['张三', '李四'],
    outgoingPersonnel: ['钱七', '孙八'],
    handoverTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    handoverContent: '各项监测设备运行正常，数据传输稳定。完成昨日震情复盘，地震速报系统已切换至当日值班人员。',
    abnormalEvents: '无',
    handlingResult: '无',
    operator: '张三',
    notes: '接班后请关注唐山台站测震仪温度变化趋势',
  },
  {
    id: 'HO-002',
    date: dayjs().format('YYYY-MM-DD'),
    shift: '中班',
    scheduleId: 'DS2-001',
    oncomingPersonnel: ['张三_副', '李四_副'],
    outgoingPersonnel: ['张三', '李四'],
    handoverTime: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    handoverContent: '下午数据监测正常，完成了2条设备维护工单的处理跟踪。',
    abnormalEvents: '石家庄台水位波动，已核实为降雨影响，属于正常变化',
    handlingResult: '已记录异常并通知台站值守人员核实',
    operator: '张三_副',
  },
]

export const mockMeetingRecords: MeetingRecord[] = [
  {
    id: 'MT-001',
    title: '唐山古冶区4.5级地震紧急震情会商会',
    time: dayjs().subtract(2, 'hour').add(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    location: '应急指挥中心',
    participants: ['张三', '李四', '王五', '赵六', '钱七'],
    content: '1. 通报唐山古冶区4.5级地震基本情况\n2. 分析地震序列发展趋势\n3. 评估地震影响范围\n4. 部署应急处置工作',
    conclusions: '1. 本次地震为孤立型地震，短期内发生更大地震可能性较小\n2. 震中烈度约V度，无人员伤亡报告\n3. 启动应急响应三级\n4. 加强台站监测，及时发布余震信息',
    recorder: '李四',
    earthquakeId: 'EQ-2024-001',
    meetingType: '紧急会商',
  },
  {
    id: 'MT-002',
    title: '2024年第15次周度震情会商会',
    time: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
    location: '三楼会议室',
    participants: ['张三', '李四', '王五', '赵六'],
    content: '1. 上周工作总结\n2. 本周工作计划\n3. 设备维护情况汇报',
    conclusions: '1. 完成10个台站巡检\n2. 修复2处设备故障\n3. 本周重点保障数据传输质量',
    recorder: '王五',
    meetingType: '日常会商',
  },
  {
    id: 'MT-003',
    title: '月度震情形势分析会',
    time: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
    location: '三楼会议室',
    participants: ['张三', '李四', '王五', '赵六', '钱七', '孙八'],
    content: '1. 本月地震活动分析\n2. 前兆观测数据研判\n3. 下月震情形势研判',
    conclusions: '1. 本月共记录地震32次，以中小地震为主\n2. 前兆数据整体平稳，未发现明显异常\n3. 下月震情维持平静态势',
    recorder: '赵六',
    meetingType: '震情会商',
  },
]

export const mockTransmissionStatus: TransmissionStatus[] = mockStations.map((station, index) => ({
  stationId: station.id,
  stationName: station.name,
  lastDataTime: dayjs().subtract(index * 2, 'second').format('YYYY-MM-DD HH:mm:ss'),
  dataDelay: index * 2 + Math.random() * 3,
  packetLossRate: index === 4 ? 15.5 : Math.random() * 0.5,
  networkBandwidth: 10 + Math.random() * 5,
  isOnline: index !== 7 && index !== 4,
}))

export const generateTimeSeriesData = (days: number = 30, base: number = 10, variance: number = 3) => {
  const data: [string, number][] = []
  for (let i = days - 1; i >= 0; i--) {
    data.push([
      dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
      base + (Math.random() - 0.5) * variance * 2,
    ])
  }
  return data
}

export const generateHistogramData = () => {
  return [
    { name: '0-1级', value: Math.floor(Math.random() * 50) + 20 },
    { name: '1-2级', value: Math.floor(Math.random() * 30) + 10 },
    { name: '2-3级', value: Math.floor(Math.random() * 20) + 5 },
    { name: '3-4级', value: Math.floor(Math.random() * 10) + 2 },
    { name: '4-5级', value: Math.floor(Math.random() * 5) },
    { name: '5级以上', value: Math.floor(Math.random() * 2) },
  ]
}
