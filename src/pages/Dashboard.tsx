import { Card, Row, Col, Statistic, Table, Tag, List, Space } from 'antd'
import {
  DatabaseOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  BellOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { mockStations, mockEquipments, mockEarthquakes, mockTransmissionStatus, generateTimeSeriesData, generateHistogramData } from '../mock/data'

const Dashboard = () => {
  const onlineCount = mockStations.filter(s => s.status === '运行中').length
  const maintenanceCount = mockStations.filter(s => s.status === '维护中').length
  const offlineCount = mockStations.filter(s => s.status === '停用').length
  const normalEquipments = mockEquipments.filter(e => e.status === '正常').length
  const warningEquipments = mockEquipments.filter(e => e.status === '警告').length
  const faultEquipments = mockEquipments.filter(e => e.status === '故障' || e.status === '离线').length

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
              title="待处理告警"
              value={3}
              prefix={<BellOutlined />}
              suffix="条"
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div style={{ marginTop: 12 }}>
              <Tag color="red">紧急 1</Tag>
              <Tag color="orange">重要 2</Tag>
            </div>
          </Card>
        </Col>
      </Row>

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
          <Card title="最近地震" size="small">
            <List
              dataSource={recentEarthquakes}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.location}</span>
                        <Tag color={item.magnitude >= 4 ? 'red' : 'orange'}>
                          M{item.magnitude}
                        </Tag>
                      </Space>
                    }
                    description={item.occurTime}
                  />
                  <Tag color={
                    item.status === '已发布' ? 'green' :
                    item.status === '人工复核' ? 'blue' : 'default'
                  }>
                    {item.status}
                  </Tag>
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
