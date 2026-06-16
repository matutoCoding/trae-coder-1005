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
  Form,
  Button,
  message,
  Alert,
  DatePicker,
} from 'antd'
import { SearchOutlined, EyeOutlined, ToolOutlined, LinkOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { Equipment, MaintenanceRecord } from '../types'
import { useApp } from '../store/AppContext'

const { Option } = Select
const { TextArea } = Input

const DeviceOperation = () => {
  const navigate = useNavigate()
  const { equipments, maintenanceRecords, stations, addMaintenanceRecord } = useApp()
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [maintainModalVisible, setMaintainModalVisible] = useState(false)
  const [currentDevice, setCurrentDevice] = useState<Equipment | null>(null)
  const [form] = Form.useForm()

  const filteredEquipments = equipments.filter(e => {
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

  const sourceTypeMap: Record<string, { text: string; color: string }> = {
    'manual': { text: '手动创建', color: 'blue' },
    'equipment': { text: '设备触发', color: 'orange' },
  }

  const getStationName = (stationId: string) => {
    const station = stations.find(s => s.id === stationId)
    return station?.name || '-'
  }

  const getLastMaintenanceRecord = (equipmentId: string) => {
    const equipment = equipments.find(e => e.id === equipmentId)
    if (!equipment?.lastMaintenanceRecordId) return null
    return maintenanceRecords.find(r => r.id === equipment.lastMaintenanceRecordId) || null
  }

  const columns = [
    {
      title: '所属台站',
      dataIndex: 'stationId',
      key: 'stationId',
      render: (stationId: string) => getStationName(stationId),
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
      width: 180,
      render: (_: any, record: Equipment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status !== '正常' && (
            <Button
              type="primary"
              size="small"
              danger
              icon={<ToolOutlined />}
              onClick={() => handleInitiateMaintenance(record)}
            >
              发起维护
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleViewDetail = (device: Equipment) => {
    setCurrentDevice(device)
    setDetailModalVisible(true)
  }

  const handleInitiateMaintenance = (device: Equipment) => {
    setCurrentDevice(device)
    const station = stations.find(s => s.id === device.stationId)
    form.setFieldsValue({
      type: '故障维修',
      stationId: device.stationId,
      stationName: station?.name || '',
      equipmentId: device.id,
      equipmentName: device.name,
      title: `${device.name}故障维修`,
      description: `设备状态：${device.status}\n请尽快安排人员进行维修处理。`,
      handler: '',
      startTime: dayjs(),
    })
    setMaintainModalVisible(true)
  }

  const handleCreateMaintenance = () => {
    form.validateFields().then(values => {
      if (!currentDevice) return

      const startTimeVal = values.startTime as Dayjs | string
      const formattedStartTime = dayjs.isDayjs(startTimeVal)
        ? (startTimeVal as Dayjs).format('YYYY-MM-DD HH:mm:ss')
        : dayjs(startTimeVal).isValid()
          ? dayjs(startTimeVal).format('YYYY-MM-DD HH:mm:ss')
          : dayjs().format('YYYY-MM-DD HH:mm:ss')

      const newRecord: MaintenanceRecord = {
        id: `MR-${String(maintenanceRecords.length + 1).padStart(3, '0')}`,
        stationId: values.stationId,
        equipmentId: values.equipmentId,
        type: values.type,
        title: values.title,
        description: values.description,
        status: '待处理',
        startTime: formattedStartTime,
        handler: values.handler,
        sourceType: 'equipment',
      }

      addMaintenanceRecord(newRecord)
      setMaintainModalVisible(false)
      form.resetFields()

      Modal.success({
        title: '工单创建成功',
        content: (
          <div>
            <p>工单编号：{newRecord.id}</p>
            <p>工单已创建，请到设备维护模块处理。</p>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => {
                Modal.destroyAll()
                navigate('/device-maintenance')
              }}
            >
              跳转到设备维护
            </Button>
          </div>
        ),
      })
    })
  }

  const station = currentDevice
    ? stations.find(s => s.id === currentDevice.stationId)
    : null

  const lastMaintenanceRecord = currentDevice
    ? getLastMaintenanceRecord(currentDevice.id)
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
    '测震仪': equipments.filter(e => e.type === '测震仪').length,
    '强震仪': equipments.filter(e => e.type === '强震仪').length,
    '数据采集器': equipments.filter(e => e.type === '数据采集器').length,
    '通信设备': equipments.filter(e => e.type === '通信设备').length,
  }

  const statusCounts = {
    normal: equipments.filter(e => e.status === '正常').length,
    warning: equipments.filter(e => e.status === '警告').length,
    fault: equipments.filter(e => e.status === '故障' || e.status === '离线').length,
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
            <Statistic title="设备总数" value={equipments.length} suffix="台" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行率"
              value={(statusCounts.normal / equipments.length * 100).toFixed(1)}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={Math.round(statusCounts.normal / equipments.length * 100)}
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
        open={detailModalVisible}
        width={800}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        destroyOnClose
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

            {lastMaintenanceRecord && (
              <Card
                size="small"
                title="最近维护记录"
                style={{ marginTop: 16 }}
                extra={
                  <Tag color={sourceTypeMap[lastMaintenanceRecord.sourceType || 'manual']?.color || 'default'}>
                    {sourceTypeMap[lastMaintenanceRecord.sourceType || 'manual']?.text || '手动创建'}
                  </Tag>
                }
              >
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="工单编号">{lastMaintenanceRecord.id}</Descriptions.Item>
                  <Descriptions.Item label="工单类型">
                    <Tag color="red">{lastMaintenanceRecord.type}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="维护时间">{lastMaintenanceRecord.startTime}</Descriptions.Item>
                  <Descriptions.Item label="处理状态">
                    <Tag color={statusMap[lastMaintenanceRecord.status] || 'default'}>
                      {lastMaintenanceRecord.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="维护结果" span={2}>
                    {lastMaintenanceRecord.result || '暂无结果'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

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

      <Modal
        title="发起维护工单"
        open={maintainModalVisible}
        width={600}
        onCancel={() => setMaintainModalVisible(false)}
        onOk={handleCreateMaintenance}
        destroyOnClose
      >
        {currentDevice && (
          <div>
            <Alert
              message="系统已自动预填工单信息，确认后将创建维护工单"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={form} layout="vertical" preserve={false}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="type" label="工单类型" rules={[{ required: true, message: '请选择工单类型' }]}>
                    <Select placeholder="请选择工单类型">
                      <Option value="日常维护">日常维护</Option>
                      <Option value="故障维修">故障维修</Option>
                      <Option value="应急处置">应急处置</Option>
                      <Option value="升级改造">升级改造</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="stationName" label="所属台站">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="stationId" label="台站ID" hidden>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="equipmentId" label="设备ID" hidden>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="equipmentName" label="关联设备">
                <Input disabled />
              </Form.Item>
              <Form.Item name="title" label="工单标题" rules={[{ required: true, message: '请输入工单标题' }]}>
                <Input placeholder="请输入工单标题" />
              </Form.Item>
              <Form.Item name="description" label="问题描述" rules={[{ required: true, message: '请输入问题描述' }]}>
                <TextArea rows={4} placeholder="请详细描述问题" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="handler" label="处理人" rules={[{ required: true, message: '请输入处理人姓名' }]}>
                    <Input placeholder="请输入处理人姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="startTime" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
                    <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" disabled />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DeviceOperation
