# 地震台站监测系统

## 项目简介

地震台站监测系统是一个用于台网中心管理台站、数据和速报的客户端软件。系统包含7个功能模块，覆盖地震台站档案管理、设备运行监控、波形数据采集、地震速报发布、震情分析、设备维护和值班管理等业务场景。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI组件库**: Ant Design 5
- **图表库**: ECharts 5
- **路由管理**: React Router 6
- **日期处理**: Day.js
- **图标库**: @ant-design/icons

## 功能模块

### 1. 系统概览 (Dashboard)
- 台站和设备运行状态统计
- 数据传输监控
- 地震活动趋势图表
- 最近地震信息展示
- 台站类型分布统计

### 2. 台站台账 (Station Ledger)
- 地震台站档案管理
- 台站信息的增删改查
- 台站详细信息查看
- 关联设备信息展示
- 台站类型、状态筛选

### 3. 设备运行 (Device Operation)
- 测震仪、强震仪运行监控
- 设备温度、电压实时监测
- 设备运行状态统计
- 设备详情和历史趋势
- 设备类型、状态筛选

### 4. 波形数据 (Waveform Data)
- 地震波形实时显示
- 波形数据列表管理
- 台站数据传输监控
- 数据延时和丢包率统计
- 波形数据导出功能

### 5. 地震速报 (Earthquake Report)
- 地震自动定位结果
- 人工复核流程
- 震级速报发布
- 速报流程时间线
- 地震趋势分析图表

### 6. 震情分析 (Earthquake Analysis)
- 震情趋势分析
- b值变化曲线
- 能量释放累计图表
- 前兆观测数据（水位、水温、氡气、地磁等）
- 异常数据告警
- 异常分析列表

### 7. 设备维护 (Device Maintenance)
- 设备故障维护工单
- 日常维护计划
- 断网断电应急处置流程
- 应急预案展示
- 维护统计分析
- 故障类型分布

### 8. 值班管理 (Duty Management)
- 值班排班管理
- 日历视图和列表视图
- 今日值班信息
- 震情会商记录
- 会议纪要管理

## 项目结构

```
src/
├── components/          # 公共组件
│   └── Layout/
│       └── MainLayout.tsx    # 主布局组件
├── pages/               # 页面组件
│   ├── Dashboard.tsx         # 系统概览
│   ├── StationLedger.tsx     # 台站台账
│   ├── DeviceOperation.tsx   # 设备运行
│   ├── WaveformData.tsx      # 波形数据
│   ├── EarthquakeReport.tsx  # 地震速报
│   ├── EarthquakeAnalysis.tsx # 震情分析
│   ├── DeviceMaintenance.tsx # 设备维护
│   └── DutyManagement.tsx    # 值班管理
├── mock/                # 模拟数据
│   └── data.ts               # 模拟数据源
├── types/               # TypeScript类型定义
│   └── index.ts              # 类型定义文件
├── App.tsx              # 应用入口组件
├── main.tsx             # 应用入口文件
└── index.css            # 全局样式
```

## 数据类型定义

### Station (台站)
- id, name, code, type, location
- longitude, latitude, altitude
- constructionDate, status
- contact, phone, description

### Equipment (设备)
- id, stationId, name, type, model, manufacturer
- installDate, lastMaintenanceDate
- status, runTime, temperature, voltage
- networkStatus

### Earthquake (地震)
- id, location, longitude, latitude, depth
- magnitude, magnitudeType
- occurTime, reportTime, status
- intensity, affectedPopulation, stations

### MaintenanceRecord (维护记录)
- id, stationId, equipmentId, type
- title, description, status
- startTime, endTime, handler, result

### DutySchedule (值班排班)
- id, date, shift, personnel, leader, notes

### MeetingRecord (会议记录)
- id, title, time, location, participants
- content, conclusions, recorder

### PrecursorData (前兆数据)
- id, stationId, type, value, time, unit
- threshold, isAbnormal

### WaveformData (波形数据)
- id, stationId, stationName, channel
- startTime, endTime, sampleRate
- data, maxAmplitude, minAmplitude, hasEvent

### TransmissionStatus (传输状态)
- stationId, stationName, lastDataTime
- dataDelay, packetLossRate, networkBandwidth, isOnline

## 安装运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖
```bash
npm install
```

### 开发运行
```bash
npm run dev
```

访问 http://localhost:3000 查看应用

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

### 代码检查
```bash
npm run lint
```

## 主要功能说明

### 地震速报流程
1. **自动定位**: 系统根据台站波形数据自动计算地震参数
2. **人工复核**: 值班人员对自动定位结果进行审核和修正
3. **速报发布**: 复核通过后发布正式地震速报

### 应急处置流程
1. 系统监测到网络中断或电源故障
2. 通过短信、邮件、APP推送通知值班人员
3. 远程诊断故障类型和范围
4. 启动备用电源、切换卫星通信链路
5. 技术人员现场排查和修复
6. 确认设备恢复正常运行

### 前兆异常处理
1. 系统实时监测前兆观测数据
2. 数据超出阈值时自动告警
3. 值班人员核实异常原因
4. 记录异常处理结果
5. 异常数据纳入震情分析

## 界面设计特点

1. **专业配色**: 采用蓝色为主色调，体现专业、可信的视觉感受
2. **信息分层**: 通过卡片、标签、颜色区分不同状态和优先级
3. **数据可视化**: 大量使用图表展示趋势和分布
4. **响应式布局**: 支持不同屏幕尺寸的自适应显示
5. **操作便捷**: 常用操作一键可达，表单设计简洁明了

## 扩展建议

1. **后端对接**: 当前使用模拟数据，实际部署时需要对接后端API
2. **WebSocket**: 波形数据和实时告警可通过WebSocket推送
3. **权限管理**: 增加用户角色和权限控制
4. **数据导出**: 支持报表导出为PDF或Excel
5. **地图集成**: 台站位置和地震分布可集成GIS地图
6. **消息通知**: 集成短信、邮件、企业微信等通知渠道
7. **移动端适配**: 开发移动端版本，支持外勤人员使用

## 注意事项

1. 本软件为客户端演示版本，数据均为模拟数据
2. 实际部署时需要配置真实的数据源和后端服务
3. 建议定期备份配置和历史数据
4. 关键操作建议增加二次确认机制
5. 系统时间需要与标准时间同步，确保数据时效性

## 技术支持

如有问题或建议，请联系系统管理员。

---

**版本**: v1.0.0
**更新日期**: 2024-01-01
