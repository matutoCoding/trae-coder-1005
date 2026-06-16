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
  List,
  Calendar,
  Badge,
  message,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { DutySchedule, MeetingRecord } from '../types'
import { mockDutySchedules, mockMeetingRecords
} from '../mock/data'

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

const DutyManagement = () => {
  const [schedules, setSchedules] = useState<DutySchedule[]>(mockDutySchedules)
  const [meetings, setMeetings] = useState<MeetingRecord[]>(mockMeetingRecords)
  const [activeTab, setActiveTab] = useState('1')
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [meetingModalVisible, setMeetingModalVisible] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState<DutySchedule | null>(null)
  const [currentMeeting, setCurrentMeeting] = useState<MeetingRecord | null>(null)
  const [scheduleModalType, setScheduleModalType] = useState<'view' | 'add' | 'edit'>('view')
  const [scheduleForm] = Form.useForm()
  const [meetingForm] = Form.useForm()

  const shiftColorMap: Record<string, string> = {
    '早班': 'green',
    '中班': 'blue',
    '晚班': 'purple',
  }

  const shiftTimeMap: Record<string, string> = {
    '早班': '08:00 - 16:00',
    '中班': '16:00 - 00:00',
    '晚班': '00:00 - 08:00',
  }

  const scheduleColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      width: 100,
      render: (shift: string) => (
        <Space>
          <Tag color={shiftColorMap[shift]}>{shift}</Tag>
          <span style={{ color: '#888', fontSize: 12 }}>{shiftTimeMap[shift]}</span>
        </Space>
      ),
    },
    {
      title: '值班人员',
      dataIndex: 'personnel',
      key: 'personnel',
      render: (personnel: string[]) => (
        <Space wrap>
          {personnel.map((p, i) => (
            <Tag key={i} icon={<UserOutlined />}>{p}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '带班领导',
      dataIndex: 'leader',
      key: 'leader',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes?: string) => notes || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: DutySchedule) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewSchedule(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleEditSchedule(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  const meetingColumns = [
    {
      title: '会议标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 170,
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '参会人员',
      dataIndex: 'participants',
      key: 'participants',
      render: (participants: string[]) => (
        <Space wrap>
          {participants.map((p, i) => (
            <Tag key={i}>{p}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '记录人',
      dataIndex: 'recorder',
      key: 'recorder',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: MeetingRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewMeeting(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewMeeting(record)}
          >
            纪要
          </Button>
        </Space>
      ),
    },
  ]

  const handleViewSchedule = (schedule: DutySchedule) => {
    setCurrentSchedule(schedule)
    setScheduleModalType('view')
    setScheduleModalVisible(true)
  }

  const handleAddSchedule = () => {
    setCurrentSchedule(null)
    setScheduleModalType('add')
    scheduleForm.resetFields()
    setScheduleModalVisible(true)
  }

  const handleEditSchedule = (schedule: DutySchedule) => {
    setCurrentSchedule(schedule)
    setScheduleModalType('edit')
    scheduleForm.setFieldsValue(schedule)
    setScheduleModalVisible(true)
  }

  const handleViewMeeting = (meeting: MeetingRecord) => {
    setCurrentMeeting(meeting)
    setMeetingModalVisible(true)
  }

  const handleAddMeeting = () => {
    setCurrentMeeting(null)
    meetingForm.resetFields()
    setMeetingModalVisible(true)
  }

  const handleScheduleSubmit = () => {
    scheduleForm.validateFields().then(values => {
      if (scheduleModalType === 'add') {
        const newSchedule: DutySchedule = {
          ...values,
          id: `DS-${String(schedules.length + 1).padStart(3, '0')}`,
        }
        setSchedules([...schedules, newSchedule])
        message.success('排班创建成功')
      } else if (scheduleModalType === 'edit' && currentSchedule) {
        setSchedules(schedules.map(s =>
          s.id === currentSchedule.id ? { ...s, ...values } : s
        ))
        message.success('排班更新成功')
      }
      setScheduleModalVisible(false)
    })
  }

  const handleMeetingSubmit = () => {
    meetingForm.validateFields().then(values => {
      const newMeeting: MeetingRecord = {
        ...values,
        id: `MT-${String(meetings.length + 1).padStart(3, '0')}`,
      }
      setMeetings([newMeeting, ...meetings])
      setMeetingModalVisible(false)
      message.success('会议记录创建成功')
    })
  }

  const getListData = (value: any) => {
    const dateStr = value.format('YYYY-MM-DD')
    const daySchedules = schedules.filter(s => s.date === dateStr)
    return daySchedules.map(s => ({
      type: s.shift === '早班' ? 'success' : s.shift === '中班' ? 'processing' : 'warning',
      content: `${s.shift}: ${s.personnel.join(', ')}`,
    }))
  }

  const dateCellRender = (value: any) => {
    const listData = getListData(value)
    return (
      <ul className="events">
        {listData.map((item, i) => (
          <li key={i}>
            <Badge status={item.type as any} text={item.content} />
          </li>
        ))}
      </ul>
    )
  }

  const todaySchedule = schedules.filter(s => s.date === dayjs().format('YYYY-MM-DD'))

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="今日值班" value={todaySchedule.length * 2} suffix="人" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本周排班" value={21} suffix="人次" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待开会议" value={2} suffix="个" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="会议记录" value={meetings.length} suffix="份" />
          </Card>
        </Col>
      </Row>

      {todaySchedule.length > 0 && (
        <Card
          type="inner"
          style={{ marginTop: 16, background: '#e6f7ff', border: '1px solid #91d5ff' }}
          title={<><CalendarOutlined /> 今日值班</>}
        >
          <Row gutter={[16, 16]}>
            {todaySchedule.map(s => (
              <Col span={8} key={s.id}>
                <Card size="small" title={
                  <Space>
                    <Tag color={shiftColorMap[s.shift]}>{s.shift}</Tag>
                    <span style={{ color: '#888', fontSize: 12 }}>{shiftTimeMap[s.shift]}</span>
                  </Space>
                }>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <span style={{ color: '#888' }}>值班人员：</span>
                      {s.personnel.join('、')}
                    </div>
                    <div>
                      <span style={{ color: '#888' }}>带班领导：</span>
                      {s.leader}
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card
        title="值班管理"
        size="small"
        style={{ marginTop: 16 }}
        extra={activeTab === '1' ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSchedule}>
            新建排班
          </Button>
        ) : (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMeeting}>
            新建会议
          </Button>
        )}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="值班排班" key="1">
            <Tabs defaultActiveKey="list">
              <TabPane tab="列表视图" key="list">
                <Table
                  columns={scheduleColumns}
                  dataSource={schedules}
                  rowKey="id"
                  scroll={{ x: 1000 }}
                />
              </TabPane>
              <TabPane tab="日历视图" key="calendar">
                <Card>
                  <Calendar dateCellRender={dateCellRender} />
                </Card>
              </TabPane>
            </Tabs>
          </TabPane>

          <TabPane tab="震情会商" key="2">
            <Table
              columns={meetingColumns}
              dataSource={meetings}
              rowKey="id"
              scroll={{ x: 1000 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          scheduleModalType === 'view' ? '排班详情' :
          scheduleModalType === 'add' ? '新建排班' : '编辑排班'
        }
        open={scheduleModalVisible}
        width={600}
        onCancel={() => setScheduleModalVisible(false)}
        onOk={scheduleModalType !== 'view' ? handleScheduleSubmit : undefined}
        footer={scheduleModalType === 'view' ? null : undefined}
      >
        {scheduleModalType === 'view' && currentSchedule ? (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="日期">{currentSchedule.date}</Descriptions.Item>
              <Descriptions.Item label="班次">
                <Tag color={shiftColorMap[currentSchedule.shift]}>
                  {currentSchedule.shift}
                </Tag>
                <span style={{ marginLeft: 8, color: '#888' }}>
                  {shiftTimeMap[currentSchedule.shift]}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="值班人员" span={2}>
                <Space wrap>
                  {currentSchedule.personnel.map((p, i) => (
                    <Tag key={i} icon={<UserOutlined />}>{p}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="带班领导">{currentSchedule.leader}</Descriptions.Item>
              <Descriptions.Item label="备注">{currentSchedule.notes || '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <Form form={scheduleForm} layout="vertical">
            <Form.Item name="date" label="日期" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="shift" label="班次" rules={[{ required: true }]}>
              <Select placeholder="请选择班次">
                <Option value="早班">早班 (08:00 - 16:00)</Option>
                <Option value="中班">中班 (16:00 - 00:00)</Option>
                <Option value="晚班">晚班 (00:00 - 08:00)</Option>
              </Select>
            </Form.Item>
            <Form.Item name="personnel" label="值班人员" rules={[{ required: true }]}>
              <Select mode="multiple" placeholder="请选择值班人员">
                {['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'].map(p => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="leader" label="带班领导" rules={[{ required: true }]}>
              <Select placeholder="请选择带班领导">
                {['张三', '李四', '王五', '赵六', '钱七'].map(p => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="notes" label="备注">
              <TextArea rows={2} placeholder="备注信息" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="会议记录详情"
        open={meetingModalVisible}
        width={800}
        onCancel={() => setMeetingModalVisible(false)}
        footer={currentMeeting ? null : (
          <Button type="primary" onClick={handleMeetingSubmit}>保存</Button>
        )}
      >
        {currentMeeting ? (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="会议标题">{currentMeeting.title}</Descriptions.Item>
              <Descriptions.Item label="时间">{currentMeeting.time}</Descriptions.Item>
              <Descriptions.Item label="地点">{currentMeeting.location}</Descriptions.Item>
              <Descriptions.Item label="记录人">{currentMeeting.recorder}</Descriptions.Item>
              <Descriptions.Item label="参会人员" span={2}>
                <Space wrap>
                  {currentMeeting.participants.map((p, i) => (
                    <Tag key={i}>{p}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>
            <Card title="会议内容" size="small" style={{ marginTop: 16 }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{currentMeeting.content}</pre>
            </Card>
            <Card title="会议结论" size="small" style={{ marginTop: 16 }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{currentMeeting.conclusions}</pre>
            </Card>
          </div>
        ) : (
          <Form form={meetingForm} layout="vertical">
            <Form.Item name="title" label="会议标题" rules={[{ required: true }]}>
              <Input placeholder="请输入会议标题" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="time" label="时间" rules={[{ required: true }]}>
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="location" label="地点" rules={[{ required: true }]}>
                  <Input placeholder="请输入会议地点" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="participants" label="参会人员" rules={[{ required: true }]}>
              <Select mode="multiple" placeholder="请选择参会人员">
                {['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'].map(p => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="recorder" label="记录人" rules={[{ required: true }]}>
              <Select placeholder="请选择记录人">
                {['张三', '李四', '王五', '赵六', '钱七'].map(p => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="content" label="会议内容" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="请输入会议内容" />
            </Form.Item>
            <Form.Item name="conclusions" label="会议结论" rules={[{ required: true }]}>
              <TextArea rows={3} placeholder="请输入会议结论" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default DutyManagement
