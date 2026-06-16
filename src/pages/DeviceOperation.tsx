import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Select,
  Input,
  Row,
  Col,
  Statistic,
  Progress,
  Descriptions,
  Modal,
} from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { Equipment } from '../types'
import { mockEquipments, mockStations, generateTimeSeriesData } from '../mock/data'

const { Option } = Select

const DeviceOperation = () => {
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [currentDevice, setCurrentDevice] = useState<Equipment | null>(null)

  const filteredEquipments = mockEquipments.filter(e => {
    if (filterType && e.type !== filterType) return false
    if (filterStatus && e.status !== filterStatus) return false
    if (searchText && !e.name.includes(searchText) && !e.model.includes(searchText)) return false
    return true
  })

  const statusMap: Record<string, string> = {
    '正常': 'green',
    '警告': 'orange',
    '故障': 'red',
    '离线': 'default',
  }

  const columns = [
    {
      title: '所属台站',
      dataIndex: 'stationId',
      key: 'stationId',
      render: (stationId: string) => {
        const station = mockStations.find(s => s.id === stationId)
        return station?.name || '-'
      },
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '设备类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const color: Record<string, string> = {
          '测震仪': 'blue',
          '强震仪': 'green',
          '数据采集器': 'purple',
          '通信设备': 'cyan',
          '电源设备': 'orange',
        }
        return <Tag color={color[type]}>{type}</Tag>
      },
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '生产厂商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
    },
    {
      title: '温度(°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      render: (val?: number) => val ? val.toFixed(1) : '-',
    },
    {
      title: '电压(V)',
      dataIndex: 'voltage',
      key: 'voltage',
      width: 100,
      render: (val?: number) => val ? val.toFixed(1) : '-',
    },
    {
      title: '运行时间(h)',
      dataIndex: 'runTime',
      key: 'runTime',
      width: 120,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '网络状态',
      dataIndex: 'networkStatus',
      key: 'networkStatus',
      width: 100,
      render: (status?: string) => (
        <Tag color={status === '在线' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusMap[status]}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Equipment) => (
        <a onClick={() => handleView(record)}>查看详情</a>
      ),
    },
  ]

  const handleView = (device: Equipment) => {
    setCurrentDevice(device)
    setModalVisible(true)
  }

  const station = currentDevice
    ? mockStations.find(s => s.id === currentDevice.stationId)
    : null

  const tempChartOption = {
    title: { text: '温度趋势 (近24小时)', left: 'center', textStyle: { fontSize: 12 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    },
    yAxis: { type: 'value', name: '°C', min: 15, max: 35 },
    series: [{
      data: Array.from({ length: 24 }, () => 20 + Math.random() * 8),
      type: 'line',
      smooth: true,
      color: '#1890ff',
      markLine: {
        silent: true,
        data: [{ yAxis: 30, label: { formatter: '阈值' } }],
        lineStyle: { color: '#ff4d4f' },
      },
    }],
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
  }

  const voltageChartOption = {
    title: { text: '电压趋势 (近24小时)', left: 'center', textStyle: { fontSize: 12 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    },
    yAxis: { type: 'value', name: 'V', min: 10, max: 15 },
    series: [{
      data: Array.from({ length: 24 }, () => 12 + Math.random() * 0.8 - 0.4),
      type: 'line',
      smooth: true,
      color: '#52c41a',
    }],
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
  }

  const typeStats = {
    '测震仪': mockEquipments.filter(e => e.type === '测震仪').length,
    '强震仪': mockEquipments.filter(e => e.type === '强震仪').length,
    '数据采集器': mockEquipments.filter(e => e.type === '数据采集器').length,
    '通信设备': mockEquipments.filter(e => e.type === '通信设备').length,
  }

  const statusCounts = {
    normal: mockEquipments.filter(e => e.status === '正常').length,
    warning: mockEquipments.filter(e => e.status === '警告').length,
    fault: mockEquipments.filter(e => e.status === '故障' || e.status === '离线').length,
  }

  const statusPieOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      avoidLabelOverlap: false,
      label: { show: true, formatter: '{b}\n{c}台' },
      data: [
        { value: statusCounts.normal, name: '正常', itemStyle: { color: '#52c41a' } },
        { value: statusCounts.warning, name: '警告', itemStyle: { color: '#faad14' } },
        { value: statusCounts.fault, name: '故障/离线', itemStyle: { color: '#ff4d4f' } },
      ],
    }],
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="设备总数" value={mockEquipments.length} suffix="台" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行率"
              value={(statusCounts.normal / mockEquipments.length * 100).toFixed(1)}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={Math.round(statusCounts.normal / mockEquipments.length * 100)}
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="告警设备"
              value={statusCounts.warning + statusCounts.fault}
              suffix="台"
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="orange">警告 {statusCounts.warning}</Tag>
              <Tag color="red">故障 {statusCounts.fault}</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <ReactECharts option={statusPieOption} style={{ height: 120 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="设备运行监控"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Select
              placeholder="设备类型"
              style={{ width: 120 }}
              allowClear
              onChange={setFilterType}
            >
              <Option value="测震仪">测震仪</Option>
              <Option value="强震仪">强震仪</Option>
              <Option value="数据采集器">数据采集器</Option>
              <Option value="通信设备">通信设备</Option>
            </Select>
            <Select
              placeholder="设备状态"
              style={{ width: 120 }}
              allowClear
              onChange={setFilterStatus}
            >
              <Option value="正常">正常</Option>
              <Option value="警告">警告</Option>
              <Option value="故障">故障</Option>
              <Option value="离线">离线</Option>
            </Select>
            <Input
              placeholder="搜索设备名称/型号"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              onChange={e => setSearchText(e.target.value)}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredEquipments}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="设备详情"
        open={modalVisible}
        width={800}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {currentDevice && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="设备ID">{currentDevice.id}</Descriptions.Item>
              <Descriptions.Item label="设备名称">{currentDevice.name}</Descriptions.Item>
              <Descriptions.Item label="设备类型">{currentDevice.type}</Descriptions.Item>
              <Descriptions.Item label="所属台站">{station?.name}</Descriptions.Item>
              <Descriptions.Item label="型号">{currentDevice.model}</Descriptions.Item>
              <Descriptions.Item label="生产厂商">{currentDevice.manufacturer}</Descriptions.Item>
              <Descriptions.Item label="安装日期">{currentDevice.installDate}</Descriptions.Item>
              <Descriptions.Item label="上次维护">{currentDevice.lastMaintenanceDate}</Descriptions.Item>
              <Descriptions.Item label="运行时间">{currentDevice.runTime.toLocaleString()}小时</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentDevice.status]}>{currentDevice.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前温度">
                <span style={{ color: currentDevice.temperature && currentDevice.temperature > 30 ? '#ff4d4f' : '#52c41a' }}>
                  {currentDevice.temperature?.toFixed(1)}°C
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="当前电压">{currentDevice.voltage?.toFixed(1)}V</Descriptions.Item>
            </Descriptions>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card size="small">
                  <ReactECharts option={tempChartOption} style={{ height: 200 }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <ReactECharts option={voltageChartOption} style={{ height: 200 }} />
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DeviceOperation
