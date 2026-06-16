import { Card, Row, Col, Statistic, Table, Tag, List, Space, Button, Alert } from 'antd'
import {
  DatabaseOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  BellOutlined,
  TeamOutlined,
  FileTextOutlined,
  RightOutlined,
  AlertOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import {
  mockStations,
  mockEquipments,
  mockEarthquakes,
  mockMaintenanceRecords,
  mockTransmissionStatus,
  mockDutySchedules,
  mockMeetingRecords,
  generateTimeSeriesData,
  generateHistogramData,
} from '../mock/data'

const Dashboard = () => {
  const navigate = useNavigate()

  const onlineCount = mockStations.filter(s => s.status === '运行中').length
  const maintenanceCount = mockStations.filter(s => s.status === '维护中').length
  const offlineCount = mockStations.filter(s => s.status === '停用').length
  const normalEquipments = mockEquipments.filter(e => e.status === '正常').length
  const warningEquipments = mockEquipments.filter(e => e.status === '警告').length
  const faultEquipments = mockEquipments.filter(e => e.status === '故障' || e.status === '离线').length

  const pendingMeetings = mockEarthquakes.filter(e => e.status === '已发布' && e.meetingRequired && !e.meetingRecordId)
  const pendingReview = mockEarthquakes.filter(e => e.status === '自动定位' || e.status === '草稿')
  const pendingMaintenance = mockMaintenanceRecords.filter(m => m.status === '待处理' || m.status === '处理中')
  const todaySchedules = mockDutySchedules.filter(s => s.date === dayjs().format('YYYY-MM-DD'))
  const todayMeetings = mockMeetingRecords.filter(m => dayjs(m.time).isSame(dayjs(), 'day'))

  const statusColumn = [
    {
      title: '台站名称',
      dataIndex: 'stationName',
      key: 'stationName',
    },
    {
      title: '最近数据时间',
      dataIndex: 'lastDataTime',
      key: 'lastDataTime',
    },
    {
      title: '数据延时(s)',
      dataIndex: 'dataDelay',
      key: 'dataDelay',
      render: (val: number) => (
        <span style={{ color: val > 10 ? '#ff4d4f' : '#52c41a' }}>{val.toFixed(2)}</span>
      ),
    },
    {
      title: '丢包率(%)',
      dataIndex: 'packetLossRate',
      key: 'packetLossRate',
      render: (val: number) => (
        <span style={{ color: val > 5 ? '#ff4d4f' : '#52c41a' }}>{val.toFixed(2)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isOnline',
      key: 'isOnline',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'}>{val ? '在线' : '离线'}</Tag>
      ),
    },
  ]

  const trendOption = {
    title: { text: '近30天地震频次', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: generateTimeSeriesData(30).map(d => d[0]) },
    yAxis: { type: 'value', name: '频次' },
    series: [{
      data: generateTimeSeriesData(30, 10, 5).map(d => Math.round(d[1])),
      type: 'line',
      smooth: true,
      areaStyle: {},
      color: '#1890ff',
    }],
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
  }

  const magnitudeOption = {
    title: { text: '震级分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    xAxis: { type: 'category', data: generateHistogramData().map(d => d.name) },
    yAxis: { type: 'value', name: '次数' },
    series: [{
      data: generateHistogramData().map(d => d.value),
      type: 'bar',
      itemStyle: {
        color: (params: any) => {
          const colors = ['#52c41a', '#73d13d', '#faad14', '#fa8c16', '#f5222d', '#a8071a']
          return colors[params.dataIndex]
        },
      },
    }],
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
  }

  const stationTypeOption = {
    title: { text: '台站类型分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      data: [
        { value: mockStations.filter(s => s.type === '测震台').length, name: '测震台' },
        { value: mockStations.filter(s => s.type === '强震台').length, name: '强震台' },
        { value: mockStations.filter(s => s.type === '前兆台').length, name: '前兆台' },
      ],
      label: { show: true, formatter: '{b}: {c}' },
    }],
    color: ['#1890ff', '#52c41a', '#faad14'],
  }

  const recentEarthquakes = [...mockEarthquakes].sort((a, b) =>
    new Date(b.occurTime).getTime() - new Date(a.occurTime).getTime()
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已发布': return 'green'
      case '人工复核': return 'blue'
      case '自动定位': return 'default'
      case '草稿': return 'orange'
      default: return 'default'
    }
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="台站总数"
              value={mockStations.length}
              prefix={<DatabaseOutlined />}
              suffix="个"
            />
            <div style={{ marginTop: 12 }}>
              <Tag color="green">运行中 {onlineCount}</Tag>
              <Tag color="orange">维护中 {maintenanceCount}</Tag>
              <Tag color="red">停用 {offlineCount}</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="设备总数"
              value={mockEquipments.length}
              prefix={<ToolOutlined />}
              suffix="台"
            />
            <div style={{ marginTop: 12 }}>
              <Tag color="green"><CheckCircleOutlined /> 正常 {normalEquipments}</Tag>
              <Tag color="orange"><WarningOutlined /> 警告 {warningEquipments}</Tag>
              <Tag color="red"><ExclamationCircleOutlined /> 故障 {faultEquipments}</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月地震"
              value={47}
              prefix={<RiseOutlined />}
              suffix="次"
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 12 }}>
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>其中 M≥3.0: 5次</span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待办事项"
              value={pendingMeetings.length + pendingReview.length + pendingMaintenance.length}
              prefix={<BellOutlined />}
              suffix="项"
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div style={{ marginTop: 12 }}>
              <Tag color="red">待会商 {pendingMeetings.length}</Tag>
              <Tag color="orange">待复核 {pendingReview.length}</Tag>
              <Tag color="blue">待维护 {pendingMaintenance.length}</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {pendingMeetings.length > 0 && (
        <Alert
          message={
            <Space>
              <AlertOutlined style={{ color: '#faad14' }} />
              <span>
                有 <b style={{ color: '#faad14' }}>{pendingMeetings.length}</b> 条已发布地震需要召开震情会商会，请及时处理
              </span>
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          action={
            <Button size="small" type="primary" onClick={() => navigate('/earthquake-analysis')}>
              去处理 <RightOutlined />
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="数据传输监控" size="small">
            <Table
              columns={statusColumn}
              dataSource={mockTransmissionStatus}
              rowKey="stationId"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="最近地震"
            size="small"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/earthquake-report')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            <List
              dataSource={recentEarthquakes.slice(0, 5)}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/earthquake-report')}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.location}</span>
                        <Tag color={item.magnitude >= 4 ? 'red' : 'orange'}>
                          M{item.magnitude}
                        </Tag>
                      </Space>
                    }
                    description={dayjs(item.occurTime).format('YYYY-MM-DD HH:mm:ss')}
                  />
                  <Tag color={getStatusColor(item.status)}>
                    {item.status}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>速报联动事项</span>
              </Space>
            }
            size="small"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/earthquake-report')}>
                地震速报 <RightOutlined />
              </Button>
            }
          >
            <List
              size="small"
              dataSource={pendingReview.slice(0, 5)}
              locale={{ emptyText: '暂无待处理速报' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="orange">待{item.status === '草稿' ? '完善' : '复核'}</Tag>
                        <span>{item.location}</span>
                        <Tag color={item.magnitude >= 4 ? 'red' : 'default'}>M{item.magnitude}</Tag>
                      </Space>
                    }
                    description={
                      <Space size="small">
                        <span style={{ color: '#999' }}>发震：</span>
                        <span>{dayjs(item.occurTime).format('MM-DD HH:mm')}</span>
                      </Space>
                    }
                  />
                  <Button type="link" size="small" onClick={() => navigate('/earthquake-report')}>
                    处理
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>设备维护待办</span>
              </Space>
            }
            size="small"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/device-maintenance')}>
                设备维护 <RightOutlined />
              </Button>
            }
          >
            <List
              size="small"
              dataSource={pendingMaintenance.slice(0, 5)}
              locale={{ emptyText: '暂无待办工单' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={item.status === '待处理' ? 'orange' : 'blue'}>{item.status}</Tag>
                        <span>{item.title}</span>
                      </Space>
                    }
                    description={
                      <Space size="small">
                        <span style={{ color: '#999' }}>类型：</span>
                        <span>{item.type}</span>
                        <span style={{ color: '#999' }}>处理人：</span>
                        <span>{item.handler}</span>
                      </Space>
                    }
                  />
                  <Button type="link" size="small" onClick={() => navigate('/device-maintenance')}>
                    查看
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>今日值班</span>
              </Space>
            }
            size="small"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/duty-management')}>
                值班管理 <RightOutlined />
              </Button>
            }
          >
            <List
              size="small"
              dataSource={todaySchedules}
              locale={{ emptyText: '暂无今日排班' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={
                          item.shift === '早班' ? 'blue' :
                          item.shift === '中班' ? 'orange' : 'purple'
                        }>{item.shift}</Tag>
                        <span>值班人员：{item.personnel.join('、')}</span>
                      </Space>
                    }
                    description={
                      <Space size="small">
                        <span style={{ color: '#999' }}>带班：</span>
                        <span>{item.leader}</span>
                      </Space>
                    }
                  />
                  {item.handoverRecordId ? (
                    <Tag color="green">已交接</Tag>
                  ) : (
                    <Tag color="orange">待交接</Tag>
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>震情会商动态</span>
              </Space>
            }
            size="small"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/earthquake-analysis')}>
                震情分析 <RightOutlined />
              </Button>
            }
          >
            <List
              size="small"
              dataSource={[...mockMeetingRecords].sort((a, b) =>
                dayjs(b.time).valueOf() - dayjs(a.time).valueOf()
              ).slice(0, 5)}
              renderItem={(item) => (
                <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate('/earthquake-analysis')}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={
                          item.meetingType === '紧急会商' ? 'red' :
                          item.meetingType === '震情会商' ? 'blue' :
                          item.meetingType === '日常会商' ? 'green' : 'purple'
                        }>
                          {item.meetingType}
                        </Tag>
                        <span>{item.title}</span>
                      </Space>
                    }
                    description={dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                  />
                  {item.earthquakeId && (
                    <Tag color="orange">关联地震</Tag>
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={10}>
          <Card>
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={7}>
          <Card>
            <ReactECharts option={magnitudeOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={7}>
          <Card>
            <ReactECharts option={stationTypeOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
