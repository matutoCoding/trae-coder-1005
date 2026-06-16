import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Tag,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Space,
  Tabs,
  List,
  Alert,
  Button,
  Modal,
  Form,
  Input,
  Descriptions,
  message,
} from 'antd'
import ReactECharts from 'echarts-for-react'
import {
  WarningOutlined,
  PlusOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { PrecursorData, MeetingRecord, Earthquake } from '../types'
import {
  mockPrecursorData,
  generateTimeSeriesData,
} from '../mock/data'
import { useApp } from '../store/AppContext'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input

const meetingTypeColorMap: Record<string, string> = {
  '日常会商': 'blue',
  '震情会商': 'green',
  '紧急会商': 'red',
  '年度会商': 'purple',
}

const EarthquakeAnalysis = () => {
  const navigate = useNavigate()
  const { earthquakes, meetingRecords, stations, addMeetingRecord, updateMeetingRecord } = useApp()
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStation, setSelectedStation] = useState<string>('')
  const [meetingModalVisible, setMeetingModalVisible] = useState(false)
  const [meetingModalType, setMeetingModalType] = useState<'view' | 'add'>('view')
  const [currentMeeting, setCurrentMeeting] = useState<MeetingRecord | null>(null)
  const [meetingForm] = Form.useForm()

  const filteredData = mockPrecursorData.filter(d => {
    if (selectedType && d.type !== selectedType) return false
    if (selectedStation && d.stationId !== selectedStation) return false
    return true
  })

  const abnormalCount = mockPrecursorData.filter(d => d.isAbnormal).length
  const normalCount = mockPrecursorData.filter(d => !d.isAbnormal).length

  const pendingMeetings = earthquakes.filter(
    eq => eq.status === '已发布' && eq.meetingRequired && !eq.meetingRecordId
  )

  const typeColor: Record<string, string> = {
    '水位': '#1890ff',
    '水温': '#faad14',
    '氡气': '#722ed1',
    '地磁': '#52c41a',
    '地电': '#13c2c2',
    '形变': '#f5222d',
  }

  const formatDateTime = (val: string | undefined | null) => {
    if (!val) return '-'
    return dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : val
  }

  const getEarthquakeById = (id: string | undefined): Earthquake | undefined => {
    if (!id) return undefined
    return earthquakes.find(eq => eq.id === id)
  }

  const handleCreateMeeting = (earthquake: Earthquake) => {
    meetingForm.resetFields()
    meetingForm.setFieldsValue({
      title: `${earthquake.location}${earthquake.magnitude}级地震震情会商会`,
      time: dayjs(),
      location: '应急指挥中心',
      meetingType: earthquake.magnitude >= 5 ? '紧急会商' : '震情会商',
      earthquakeId: earthquake.id,
      participants: [],
      content: '',
      conclusions: '',
      recorder: '',
    })
    setCurrentMeeting(null)
    setMeetingModalType('add')
    setMeetingModalVisible(true)
  }

  const handleViewMeeting = (record: MeetingRecord) => {
    setCurrentMeeting(record)
    setMeetingModalType('view')
    setMeetingModalVisible(true)
  }

  const handleAddMeeting = () => {
    meetingForm.resetFields()
    setCurrentMeeting(null)
    setMeetingModalType('add')
    setMeetingModalVisible(true)
  }

  const handleSubmitMeeting = () => {
    meetingForm.validateFields().then(values => {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const newRecord: MeetingRecord = {
        id: `MT-${String(meetingRecords.length + 1).padStart(3, '0')}`,
        title: values.title || '',
        time: dayjs(values.time).isValid()
          ? dayjs(values.time).format('YYYY-MM-DD HH:mm:ss')
          : now,
        location: values.location || '',
        participants: values.participants || [],
        content: values.content || '',
        conclusions: values.conclusions || '',
        recorder: values.recorder || '',
        earthquakeId: values.earthquakeId,
        meetingType: values.meetingType || '日常会商',
      }
      addMeetingRecord(newRecord)
      setMeetingModalVisible(false)
      message.success('会议记录创建成功')
    })
  }

  const handleGotoReport = (earthquakeId: string | undefined) => {
    if (!earthquakeId) return
    Modal.confirm({
      title: '跳转地震速报',
      content: '是否跳转到地震速报页面查看详情？',
      onOk: () => {
        navigate('/earthquake-report')
      },
    })
  }

  const columns = [
    {
      title: '台站名称',
      dataIndex: 'stationId',
      key: 'stationId',
      render: (id: string) => {
        const station = stations.find(s => s.id === id)
        return station?.name || id
      },
    },
    {
      title: '观测类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={typeColor[type]}>{type}</Tag>
      ),
    },
    {
      title: '观测值',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (val: number, record: PrecursorData) => (
        <span style={{ color: record.isAbnormal ? '#ff4d4f' : '#52c41a', fontWeight: record.isAbnormal ? 'bold' : 'normal' }}>
          {val.toFixed(2)} {record.unit}
        </span>
      ),
    },
    {
      title: '阈值范围',
      key: 'threshold',
      width: 180,
      render: (_: any, record: PrecursorData) => (
        <span>
          {record.threshold.min.toFixed(2)} - {record.threshold.max.toFixed(2)} {record.unit}
        </span>
      ),
    },
    {
      title: '观测时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '状态',
      dataIndex: 'isAbnormal',
      key: 'isAbnormal',
      width: 100,
      render: (abnormal: boolean) => (
        <Tag color={abnormal ? 'red' : 'green'}>
          {abnormal ? '异常' : '正常'}
        </Tag>
      ),
    },
  ]

  const meetingColumns = [
    {
      title: '会议编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '会议类型',
      dataIndex: 'meetingType',
      key: 'meetingType',
      width: 100,
      render: (type: string) => (
        <Tag color={meetingTypeColorMap[type] || 'default'}>{type}</Tag>
      ),
    },
    {
      title: '会议标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '关联地震',
      dataIndex: 'earthquakeId',
      key: 'earthquakeId',
      width: 200,
      render: (earthquakeId: string | undefined) => {
        const eq = getEarthquakeById(earthquakeId)
        if (!eq) return '-'
        return (
          <Button
            type="link"
            size="small"
            onClick={() => handleGotoReport(earthquakeId)}
          >
            {eq.id} - {eq.location}
          </Button>
        )
      },
    },
    {
      title: '会议时间',
      dataIndex: 'time',
      key: 'time',
      width: 160,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '会议地点',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '记录人',
      dataIndex: 'recorder',
      key: 'recorder',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: MeetingRecord) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewMeeting(record)}
        >
          查看
        </Button>
      ),
    },
  ]

  const createTrendChart = (type: string, color: string) => {
    const data = generateTimeSeriesData(30, 10, 2)
    return {
      title: { text: `${type}变化趋势(30天)`, left: 'center', textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map(d => d[0]), axisLabel: { rotate: 45, fontSize: 10 } },
      yAxis: { type: 'value' },
      series: [{
        data: data.map(d => d[1]),
        type: 'line',
        smooth: true,
        color,
        areaStyle: { opacity: 0.3 },
      }],
      grid: { left: 50, right: 20, top: 40, bottom: 60 },
    }
  }

  const magnitudeTrendOption = {
    title: { text: '震情趋势分析', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
    },
    yAxis: [
      { type: 'value', name: '频次' },
      { type: 'value', name: '最大震级', position: 'right' },
    ],
    legend: { data: ['地震频次', '最大震级'], top: 30 },
    series: [
      {
        name: '地震频次',
        data: [12, 15, 8, 22, 18, 25, 30, 28, 15, 20, 18, 24],
        type: 'bar',
        color: '#1890ff',
      },
      {
        name: '最大震级',
        data: [2.3, 3.1, 2.8, 4.2, 3.5, 2.9, 3.8, 4.5, 3.2, 2.7, 3.0, 3.3],
        type: 'line',
        smooth: true,
        color: '#f5222d',
        yAxisIndex: 1,
      },
    ],
    grid: { left: 50, right: 50, top: 80, bottom: 30 },
  }

  const bValueOption = {
    title: { text: 'b值变化曲线', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
    },
    yAxis: { type: 'value', name: 'b值', min: 0.5, max: 1.5 },
    series: [{
      data: [1.02, 0.98, 1.05, 1.1, 0.95, 0.88, 0.82, 0.9, 1.0, 1.08, 1.12, 1.05],
      type: 'line',
      smooth: true,
      color: '#722ed1',
      markLine: {
        silent: true,
        data: [
          { yAxis: 1.0, label: { formatter: '正常基线', position: 'end' } },
        ],
        lineStyle: { type: 'dashed', color: '#faad14' },
      },
    }],
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
  }

  const energyReleaseOption = {
    title: { text: '能量释放累计', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
    },
    yAxis: { type: 'value', name: '累计能量(J)' },
    series: [{
      data: [100, 250, 320, 580, 650, 720, 980, 1250, 1320, 1450, 1580, 1720],
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      color: '#faad14',
    }],
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
  }

  const abnormalData = mockPrecursorData.filter(d => d.isAbnormal)

  return (
    <div>
      {pendingMeetings.length > 0 && (
        <Alert
          message="待会商提醒"
          description={
            <div>
              <div style={{ marginBottom: 8 }}>
                有 {pendingMeetings.length} 条已发布地震待会商，请及时处理！
              </div>
              <Space wrap>
                {pendingMeetings.map(eq => (
                  <Card
                    key={eq.id}
                    size="small"
                    style={{ width: 280, border: '1px solid #faad14' }}
                    title={
                      <Space>
                        <Tag color="orange">{eq.magnitude}级</Tag>
                        <span style={{ fontSize: 13 }}>{eq.location}</span>
                      </Space>
                    }
                    extra={
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleCreateMeeting(eq)}
                      >
                        创建会商
                      </Button>
                    }
                  >
                    <div style={{ fontSize: 12, color: '#666' }}>
                      编号：{eq.id}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      时间：{formatDateTime(eq.occurTime)}
                    </div>
                  </Card>
                ))}
              </Space>
            </div>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {abnormalData.length > 0 && (
        <Alert
          message="前兆异常告警"
          description={`发现 ${abnormalData.length} 项前兆观测数据异常，请关注！`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="观测项总数" value={mockPrecursorData.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
          <Statistic
            title="正常"
            value={normalCount}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
        </Col>
        <Col span={6}>
          <Card>
          <Statistic
            title="异常"
            value={abnormalCount}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
        </Col>
        <Col span={6}>
          <Card>
          <Statistic title="本月地震" value={47} />
        </Card>
        </Col>
      </Row>

      <Card
        title="震情分析"
        size="small"
        style={{ marginTop: 16 }}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="震情趋势" key="1">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <ReactECharts option={magnitudeTrendOption} style={{ height: 320 }} />
              </Col>
              <Col span={12}>
                <ReactECharts option={bValueOption} style={{ height: 320 }} />
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <ReactECharts option={energyReleaseOption} style={{ height: 300 }} />
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="前兆观测" key="2">
            <Space style={{ marginBottom: 16 }}>
              <Select
                placeholder="观测类型"
                style={{ width: 150 }}
                allowClear
                onChange={setSelectedType}
              >
                <Option value="水位">水位</Option>
                <Option value="水温">水温</Option>
                <Option value="氡气">氡气</Option>
                <Option value="地磁">地磁</Option>
                <Option value="地电">地电</Option>
                <Option value="形变">形变</Option>
              </Select>
              <Select
                placeholder="选择台站"
                style={{ width: 150 }}
                allowClear
                onChange={setSelectedStation}
              >
                {stations.map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
              </Select>
              <RangePicker showTime />
            </Space>

            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              size="small"
              scroll={{ x: 1000 }}
            />

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card size="small">
                  <ReactECharts
                    option={createTrendChart('水位', '#1890ff')}
                    style={{ height: 250 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <ReactECharts
                    option={createTrendChart('水温', '#faad14')}
                    style={{ height: 250 }}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="异常分析" key="3">
            {abnormalData.length > 0 ? (
              <List
                dataSource={abnormalData}
                renderItem={(item) => {
                  const station = stations.find(s => s.id === item.stationId)
                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<WarningOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />}
                        title={
                          <Space>
                            <span>{station?.name}</span>
                            <Tag color="red">{item.type}</Tag>
                          </Space>
                        }
                        description={`观测值: ${item.value.toFixed(2)} ${item.unit}，阈值范围: ${item.threshold.min.toFixed(2)}-${item.threshold.max.toFixed(2)} ${item.unit}`}
                      />
                      <Tag color="red">异常</Tag>
                    </List.Item>
                  )
                }}
              />
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                暂无异常数据
              </div>
            )}
          </TabPane>

          <TabPane tab="会议记录" key="4">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMeeting}>
                新增会议
              </Button>
            </div>
            <Table
              columns={meetingColumns}
              dataSource={meetingRecords}
              rowKey="id"
              size="small"
              scroll={{ x: 1200 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={meetingModalType === 'view' ? '会议详情' : '新增会议'}
        open={meetingModalVisible}
        width={800}
        destroyOnClose
        onCancel={() => setMeetingModalVisible(false)}
        footer={meetingModalType === 'view' ? null : (
          <Space>
            <Button onClick={() => setMeetingModalVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmitMeeting}>确认提交</Button>
          </Space>
        )}
      >
        {meetingModalType === 'view' && currentMeeting ? (
          <div>
            {currentMeeting.earthquakeId && (
              <Card
                size="small"
                style={{ marginBottom: 16, border: '1px solid #1890ff', background: '#e6f7ff' }}
                title={
                  <Space>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <span style={{ color: '#1890ff', fontWeight: 'bold' }}>关联地震速报</span>
                  </Space>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleGotoReport(currentMeeting.earthquakeId)}
                  >
                    查看详情
                  </Button>
                }
              >
                {(() => {
                  const eq = getEarthquakeById(currentMeeting.earthquakeId)
                  if (!eq) return null
                  return (
                    <Row gutter={16}>
                      <Col span={8}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#666' }}>地震编号：</span>
                          <span style={{ fontWeight: 'bold' }}>{eq.id}</span>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#666' }}>发震地点：</span>
                          <span style={{ fontWeight: 'bold' }}>{eq.location}</span>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#666' }}>震级：</span>
                          <Tag color="red" style={{ fontWeight: 'bold' }}>
                            M{eq.magnitude}{eq.magnitudeType}
                          </Tag>
                        </div>
                      </Col>
                      <Col span={12} style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#666' }}>发震时间：</span>
                          <span>{formatDateTime(eq.occurTime)}</span>
                        </div>
                      </Col>
                      <Col span={12} style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#666' }}>状态：</span>
                          <Tag color={eq.status === '已发布' ? 'green' : 'blue'}>{eq.status}</Tag>
                        </div>
                      </Col>
                    </Row>
                  )
                })()}
              </Card>
            )}

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="会议编号">{currentMeeting.id}</Descriptions.Item>
              <Descriptions.Item label="会议类型">
                <Tag color={meetingTypeColorMap[currentMeeting.meetingType] || 'default'}>
                  {currentMeeting.meetingType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="会议标题" span={2}>{currentMeeting.title}</Descriptions.Item>
              <Descriptions.Item label="会议时间">{formatDateTime(currentMeeting.time)}</Descriptions.Item>
              <Descriptions.Item label="会议地点">{currentMeeting.location}</Descriptions.Item>
              <Descriptions.Item label="记录人">{currentMeeting.recorder}</Descriptions.Item>
              <Descriptions.Item label="参会人员">
                {currentMeeting.participants.join('，')}
              </Descriptions.Item>
              <Descriptions.Item label="会议内容" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{currentMeeting.content}</div>
              </Descriptions.Item>
              <Descriptions.Item label="会议结论" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{currentMeeting.conclusions}</div>
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <Form form={meetingForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="meetingType" label="会议类型" rules={[{ required: true, message: '请选择会议类型' }]}>
                  <Select placeholder="请选择会议类型">
                    <Option value="日常会商">日常会商</Option>
                    <Option value="震情会商">震情会商</Option>
                    <Option value="紧急会商">紧急会商</Option>
                    <Option value="年度会商">年度会商</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="time" label="会议时间" rules={[{ required: true, message: '请选择会议时间' }]}>
                  <DatePicker showTime style={{ width: '100%' }} placeholder="请选择会议时间" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="title" label="会议标题" rules={[{ required: true, message: '请输入会议标题' }]}>
              <Input placeholder="请输入会议标题" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="location" label="会议地点" rules={[{ required: true, message: '请输入会议地点' }]}>
                  <Input placeholder="请输入会议地点" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="recorder" label="记录人" rules={[{ required: true, message: '请输入记录人' }]}>
                  <Input placeholder="请输入记录人" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="earthquakeId" label="关联地震">
              <Select placeholder="请选择关联地震（可选）" allowClear>
                {earthquakes.map(eq => (
                  <Option key={eq.id} value={eq.id}>
                    {eq.id} - {eq.location} ({eq.magnitude}级)
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="participants" label="参会人员">
              <Select mode="tags" placeholder="请输入参会人员，回车添加">
                {['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'].map(p => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="content" label="会议内容">
              <TextArea rows={4} placeholder="请输入会议内容" />
            </Form.Item>
            <Form.Item name="conclusions" label="会议结论">
              <TextArea rows={3} placeholder="请输入会议结论" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default EarthquakeAnalysis
