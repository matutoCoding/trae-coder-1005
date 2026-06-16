import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Descriptions,
  Tabs,
  Timeline,
  message,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { MaintenanceRecord } from '../types'
import { mockMaintenanceRecords, mockStations, mockEquipments
} from '../mock/data'

const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker
const { TabPane } = Tabs

const DeviceMaintenance = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>(mockMaintenanceRecords)
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [modalType, setModalType] = useState<'view' | 'add' | 'process'>('view')
  const [modalVisible, setModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<MaintenanceRecord | null>(null)
  const [form] = Form.useForm()

  const statusMap: Record<string, { color: string; icon: any }> = {
    '待处理': { color: 'default', icon: <ClockCircleOutlined /> },
    '处理中': { color: 'processing', icon: <ExclamationCircleOutlined /> },
    '已完成': { color: 'success', icon: <CheckCircleOutlined /> },
  }

  const typeMap: Record<string, string> = {
    '日常维护': 'blue',
    '故障维修': 'red',
    '应急处置': 'orange',
    '升级改造': 'purple',
  }

  const columns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color={typeMap[type]}>{type}</Tag>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '所属台站',
      dataIndex: 'stationId',
      key: 'stationId',
      render: (id: string) => {
        const station = mockStations.find(s => s.id === id)
        return station?.name || id
      },
    },
    {
      title: '关联设备',
      dataIndex: 'equipmentId',
      key: 'equipmentId',
      render: (id?: string) => {
        if (!id) return '-'
        const equipment = mockEquipments.find(e => e.id === id)
        return equipment?.name || id
      },
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 170,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = statusMap[status]
        return (
          <Tag color={s.color}>
            {s.icon} {status}
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: MaintenanceRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {record.status !== '已完成' && (
            <Button
              type="link"
              size="small"
              type="primary"
              onClick={() => handleProcess(record)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleView = (record: MaintenanceRecord) => {
    setCurrentRecord(record)
    setModalType('view')
    setModalVisible(true)
  }

  const handleAdd = () => {
    setCurrentRecord(null)
    setModalType('add')
    form.resetFields()
    setModalVisible(true)
  }

  const handleProcess = (record: MaintenanceRecord) => {
    setCurrentRecord(record)
    setModalType('process')
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (modalType === 'add') {
        const newRecord: MaintenanceRecord = {
          ...values,
          id: `MR-${String(records.length + 1).padStart(3, '0')}`,
          status: '待处理' as const,
        }
        setRecords([newRecord, ...records])
        message.success('工单创建成功')
      } else if (modalType === 'process' && currentRecord) {
        setRecords(records.map(r =>
          r.id === currentRecord.id
            ? {
                ...r,
                ...values,
                status: values.status || (currentRecord.status === '待处理' ? '处理中' as const : '已完成' as const),
                endTime: values.status === '已完成' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : undefined,
              }
            : r
        ))
        message.success('处理记录已更新')
      }
      setModalVisible(false)
    })
  }

  const filteredRecords = records.filter(r => {
    if (filterType && r.type !== filterType) return false
    if (filterStatus && r.status !== filterStatus) return false
    return true
  })

  const station = currentRecord
    ? mockStations.find(s => s.id === currentRecord.stationId)
    : null
  const equipment = currentRecord?.equipmentId
    ? mockEquipments.find(e => e.id === currentRecord.equipmentId)
    : null

  const typeStats = {
    '日常维护': records.filter(r => r.type === '日常维护').length,
    '故障维修': records.filter(r => r.type === '故障维修').length,
    '应急处置': records.filter(r => r.type === '应急处置').length,
    '升级改造': records.filter(r => r.type === '升级改造').length,
  }

  const statusStats = {
    pending: records.filter(r => r.status === '待处理').length,
    processing: records.filter(r => r.status === '处理中').length,
    completed: records.filter(r => r.status === '已完成').length,
  }

  const monthlyTrendOption = {
    title: { text: '月度维护统计', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`) },
    yAxis: { type: 'value', name: '次数' },
    series: [
      {
        name: '日常维护',
        data: [5, 8, 6, 10, 7, 9, 8, 12, 6, 8, 10, 7],
        type: 'bar',
        stack: 'total',
        color: '#1890ff',
      },
      {
        name: '故障维修',
        data: [2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 3, 1],
        type: 'bar',
        stack: 'total',
        color: '#f5222d',
      },
      {
        name: '应急处置',
        data: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        type: 'bar',
        stack: 'total',
        color: '#faad14',
      },
    ],
    legend: { data: ['日常维护', '故障维修', '应急处置'], top: 30 },
    grid: { left: 50, right: 20, top: 70, bottom: 30 },
  }

  const faultTypeOption = {
    title: { text: '故障类型分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 8, name: '设备故障', itemStyle: { color: '#f5222d' } },
        { value: 5, name: '网络中断', itemStyle: { color: '#faad14' } },
        { value: 3, name: '电源故障', itemStyle: { color: '#fa8c16' } },
        { value: 4, name: '软件异常', itemStyle: { color: '#722ed1' } },
        { value: 2, name: '环境因素', itemStyle: { color: '#13c2c2' } },
      ],
      label: { show: true, formatter: '{b}: {c}次' },
    }],
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="待处理" value={statusStats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="处理中" value={statusStats.processing} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已完成" value={statusStats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本月工单" value={15} />
          </Card>
        </Col>
      </Row>

      <Card
        title="设备维护管理"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建工单
          </Button>
        }
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="维护工单" key="1">
            <Space style={{ marginBottom: 16 }}>
              <Select
                placeholder="工单类型"
                style={{ width: 150 }}
                allowClear
                onChange={setFilterType}
              >
                <Option value="日常维护">日常维护</Option>
                <Option value="故障维修">故障维修</Option>
                <Option value="应急处置">应急处置</Option>
                <Option value="升级改造">升级改造</Option>
              </Select>
              <Select
                placeholder="处理状态"
                style={{ width: 150 }}
                allowClear
                onChange={setFilterStatus}
              >
                <Option value="待处理">待处理</Option>
                <Option value="处理中">处理中</Option>
                <Option value="已完成">已完成</Option>
              </Select>
              <RangePicker showTime />
            </Space>

            <Table
              columns={columns}
              dataSource={filteredRecords}
              rowKey="id"
              scroll={{ x: 1200 }}
            />
          </TabPane>

          <TabPane tab="统计分析" key="2">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <ReactECharts option={monthlyTrendOption} style={{ height: 320 }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <ReactECharts option={faultTypeOption} style={{ height: 320 }} />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="断网断电处置" key="3">
            <Card size="small" title="应急处置流程">
              <Timeline
                items={[
                  {
                    color: 'red',
                    children: '告警监测：系统自动检测到网络中断或电源故障',
                  },
                  {
                    color: 'orange',
                    children: '告警通知：通过短信、邮件、APP推送通知值班人员',
                  },
                  {
                    color: 'blue',
                    children: '远程诊断：检查设备状态，确认故障类型和范围',
                  },
                  {
                    color: 'purple',
                    children: '应急处理：启动备用电源、切换卫星通信链路',
                  },
                  {
                    color: 'green',
                    children: '现场维修：技术人员现场排查和修复故障',
                  },
                  {
                    color: 'green',
                    children: '恢复验证：确认设备恢复正常运行',
                  },
                ]}
              />
            </Card>

            <Card size="small" title="应急预案" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="网络中断处置"
                  description="1. 检查本地网络设备状态；2. 联系运营商确认线路；3. 切换至卫星通信备用链路；4. 记录中断时间和影响范围"
                  type="warning"
                  showIcon
                />
                <Alert
                  message="电源故障处置"
                  description="1. 检查UPS供电状态；2. 启动备用发电机；3. 非必要设备可暂时关闭；4. 记录断电时间和恢复时间"
                  type="error"
                  showIcon
                />
                <Alert
                  message="设备故障处置"
                  description="1. 远程重启设备；2. 切换至备用设备；3. 联系厂家技术支持；4. 准备备机现场更换"
                  type="info"
                  showIcon
                />
              </Space>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          modalType === 'view' ? '工单详情' :
          modalType === 'add' ? '新建工单' : '处理工单'
        }
        open={modalVisible}
        width={700}
        onCancel={() => setModalVisible(false)}
        onOk={modalType !== 'view' ? handleSubmit : undefined}
        footer={modalType === 'view' ? null : undefined}
      >
        {modalType === 'view' && currentRecord ? (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="工单编号">{currentRecord.id}</Descriptions.Item>
              <Descriptions.Item label="工单类型">
                <Tag color={typeMap[currentRecord.type]}>{currentRecord.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentRecord.status].color}>{currentRecord.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="所属台站">{station?.name}</Descriptions.Item>
              <Descriptions.Item label="关联设备">{equipment?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{currentRecord.handler}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{currentRecord.startTime}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{currentRecord.endTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{currentRecord.title}</Descriptions.Item>
              <Descriptions.Item label="问题描述" span={2}>
                {currentRecord.description}
              </Descriptions.Item>
              {currentRecord.result && (
                <Descriptions.Item label="处理结果" span={2}>
                  {currentRecord.result}
                </Descriptions.Item>
              )}
            </Descriptions>

            {currentRecord.type === '应急处置' && (
              <Card title="处置时间线" size="small" style={{ marginTop: 16 }}>
                <Timeline
                  items={[
                    {
                      color: 'red',
                      children: `故障发生 - ${currentRecord.startTime}`,
                    },
                    {
                      color: 'orange',
                      children: `工单创建 - ${currentRecord.startTime}`,
                    },
                    currentRecord.endTime
                      ? {
                          color: 'green',
                          children: `处置完成 - ${currentRecord.endTime}`,
                        }
                      : {
                          color: 'blue',
                          children: '处置中...',
                        },
                  ]}
                />
              </Card>
            )}
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item name="type" label="工单类型" rules={[{ required: true }]}>
              <Select>
                <Option value="日常维护">日常维护</Option>
                <Option value="故障维修">故障维修</Option>
                <Option value="应急处置">应急处置</Option>
                <Option value="升级改造">升级改造</Option>
              </Select>
            </Form.Item>
            <Form.Item name="stationId" label="所属台站" rules={[{ required: true }]}>
              <Select placeholder="请选择台站">
                {mockStations.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="equipmentId" label="关联设备">
              <Select placeholder="请选择设备（可选）">
                {mockEquipments.map(e => (
                  <Option key={e.id} value={e.id}>{e.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="title" label="标题" rules={[{ required: true }]}>
              <Input placeholder="请输入工单标题" />
            </Form.Item>
            <Form.Item name="description" label="问题描述" rules={[{ required: true }]}>
              <TextArea rows={3} placeholder="请详细描述问题" />
            </Form.Item>
            <Form.Item name="handler" label="处理人" rules={[{ required: true }]}>
              <Input placeholder="请输入处理人姓名" />
            </Form.Item>
            <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            {modalType === 'process' && (
              <>
                <Form.Item name="status" label="更新状态">
                  <Select placeholder="请选择状态">
                    {currentRecord?.status === '待处理' && (
                      <Option value="处理中">处理中</Option>
                    )}
                    <Option value="已完成">已完成</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="result" label="处理结果">
                  <TextArea rows={3} placeholder="请填写处理结果" />
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default DeviceMaintenance
