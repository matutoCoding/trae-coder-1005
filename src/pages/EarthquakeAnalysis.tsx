import { useState } from 'react'
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
} from 'antd'
import ReactECharts from 'echarts-for-react'
import { WarningOutlined } from '@ant-design/icons'
import type { PrecursorData } from '../types'
import { mockPrecursorData, mockStations, generateTimeSeriesData } from '../mock/data'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

const EarthquakeAnalysis = () => {
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStation, setSelectedStation] = useState<string>('')

  const filteredData = mockPrecursorData.filter(d => {
    if (selectedType && d.type !== selectedType) return false
    if (selectedStation && d.stationId !== selectedStation) return false
    return true
  })

  const abnormalCount = mockPrecursorData.filter(d => d.isAbnormal).length
  const normalCount = mockPrecursorData.filter(d => !d.isAbnormal).length

  const typeColor: Record<string, string> = {
    '水位': '#1890ff',
    '水温': '#faad14',
    '氡气': '#722ed1',
    '地磁': '#52c41a',
    '地电': '#13c2c2',
    '形变': '#f5222d',
  }

  const columns = [
    {
      title: '台站名称',
      dataIndex: 'stationId',
      key: 'stationId',
      render: (id: string) => {
        const station = mockStations.find(s => s.id === id)
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
                {mockStations.map(s => (
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
                  const station = mockStations.find(s => s.id === item.stationId)
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
        </Tabs>
      </Card>
    </div>
  )
}

export default EarthquakeAnalysis
