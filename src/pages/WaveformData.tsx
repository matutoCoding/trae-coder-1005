import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Select,
  Button,
  Row,
  Col,
  DatePicker,
  Statistic,
  Progress,
} from 'antd'
import { PlayCircleOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { WaveformData, TransmissionStatus } from '../types'
import { mockWaveformData, mockTransmissionStatus, mockStations } from '../mock/data'

const { RangePicker } = DatePicker
const { Option } = Select

const WaveformData = () => {
  const [selectedStation, setSelectedStation] = useState<string>('')
  const [selectedWaveform, setSelectedWaveform] = useState<WaveformData | null>(mockWaveformData[0])

  const waveformOption = (data: WaveformData) => {
    const timePoints = Array.from({ length: data.data.length }, (_, i) => {
      const startTime = dayjs(data.startTime)
      const msPerSample = 1000 / data.sampleRate
      return startTime.add(i * msPerSample, 'millisecond').format('HH:mm:ss.SSS')
    })

    return {
      title: {
        text: `${data.stationName} - ${data.channel}`,
        left: 'center',
        textStyle: { fontSize: 14 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const { dataIndex, value } = params[0]
          return `时间: ${timePoints[dataIndex]}<br/>幅值: ${value.toFixed(4)}`
        },
      },
      grid: {
        left: 60,
        right: 20,
        top: 50,
        bottom: 50,
      },
      xAxis: {
        type: 'category',
        data: timePoints,
        axisLabel: {
          rotate: 45,
          interval: Math.floor(data.data.length / 10),
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: '幅值(μm/s)',
        min: Math.min(...data.data) * 1.2,
        max: Math.max(...data.data) * 1.2,
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100, height: 20, bottom: 10 },
      ],
      series: [{
        data: data.data,
        type: 'line',
        symbol: 'none',
        lineStyle: {
          width: 1,
          color: data.hasEvent ? '#ff4d4f' : '#1890ff',
        },
        markLine: data.hasEvent ? {
          silent: true,
          data: [
            { yAxis: data.maxAmplitude * 0.8, label: { formatter: 'P波到达', position: 'end' } },
          ],
          lineStyle: { color: '#faad14', type: 'dashed' },
        } : undefined,
      }],
    }
  }

  const waveformColumns = [
    {
      title: '台站名称',
      dataIndex: 'stationName',
      key: 'stationName',
    },
    {
      title: '通道',
      dataIndex: 'channel',
      key: 'channel',
      width: 80,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
    },
    {
      title: '采样率',
      dataIndex: 'sampleRate',
      key: 'sampleRate',
      width: 80,
      render: (val: number) => `${val}Hz`,
    },
    {
      title: '最大幅值',
      dataIndex: 'maxAmplitude',
      key: 'maxAmplitude',
      width: 100,
      render: (val: number) => val.toFixed(4),
    },
    {
      title: '事件检测',
      dataIndex: 'hasEvent',
      key: 'hasEvent',
      width: 100,
      render: (val: boolean) => (
        <Tag color={val ? 'red' : 'green'}>
          {val ? '有事件' : '无事件'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: WaveformData) => (
        <Button type="link" size="small" onClick={() => setSelectedWaveform(record)}>
          查看波形
        </Button>
      ),
    },
  ]

  const transmissionColumns = [
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
        <span style={{ color: val > 10 ? '#ff4d4f' : val > 5 ? '#faad14' : '#52c41a' }}>
          {val.toFixed(2)}
        </span>
      ),
    },
    {
      title: '丢包率(%)',
      dataIndex: 'packetLossRate',
      key: 'packetLossRate',
      render: (val: number) => (
        <span style={{ color: val > 5 ? '#ff4d4f' : val > 1 ? '#faad14' : '#52c41a' }}>
          {val.toFixed(2)}
        </span>
      ),
    },
    {
      title: '网络带宽(Mbps)',
      dataIndex: 'networkBandwidth',
      key: 'networkBandwidth',
      render: (val: number) => val.toFixed(1),
    },
    {
      title: '在线状态',
      dataIndex: 'isOnline',
      key: 'isOnline',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'}>{val ? '在线' : '离线'}</Tag>
      ),
    },
  ]

  const onlineCount = mockTransmissionStatus.filter(t => t.isOnline).length
  const avgDelay = mockTransmissionStatus.reduce((sum, t) => sum + t.dataDelay, 0) / mockTransmissionStatus.length
  const avgPacketLoss = mockTransmissionStatus.reduce((sum, t) => sum + t.packetLossRate, 0) / mockTransmissionStatus.length

  const delayChartOption = {
    title: { text: '各台站数据延时', left: 'center', textStyle: { fontSize: 12 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: mockTransmissionStatus.map(t => t.stationName.replace('台站', '')),
      axisLabel: { rotate: 30, fontSize: 10 },
    },
    yAxis: { type: 'value', name: '秒' },
    series: [{
      type: 'bar',
      data: mockTransmissionStatus.map(t => ({
        value: t.dataDelay.toFixed(2),
        itemStyle: { color: t.dataDelay > 10 ? '#ff4d4f' : t.dataDelay > 5 ? '#faad14' : '#52c41a' },
      })),
    }],
    grid: { left: 50, right: 20, top: 40, bottom: 50 },
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="在线台站" value={onlineCount} suffix={`/${mockStations.length}`} />
            <Progress
              percent={Math.round(onlineCount / mockStations.length * 100)}
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均延时"
              value={avgDelay.toFixed(2)}
              suffix="s"
              valueStyle={{ color: avgDelay > 5 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均丢包率"
              value={avgPacketLoss.toFixed(2)}
              suffix="%"
              valueStyle={{ color: avgPacketLoss > 1 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="波形数据流" value="实时" valueStyle={{ color: '#1890ff' }} />
            <Tag color="green" icon={<PlayCircleOutlined />}>采集中</Tag>
          </Card>
        </Col>
      </Row>

      <Card
        title="实时波形显示"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Select
              placeholder="选择台站"
              style={{ width: 150 }}
              allowClear
              value={selectedStation}
              onChange={setSelectedStation}
            >
              {mockStations.map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
            <RangePicker showTime />
            <Button icon={<ReloadOutlined />}>刷新</Button>
            <Button icon={<DownloadOutlined />}>导出数据</Button>
          </Space>
        }
      >
        {selectedWaveform && (
          <ReactECharts
            option={waveformOption(selectedWaveform)}
            style={{ height: 300 }}
            notMerge
          />
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="波形数据列表" size="small">
            <Table
              columns={waveformColumns}
              dataSource={mockWaveformData}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="数据传输监控" size="small">
            <Table
              columns={transmissionColumns}
              dataSource={mockTransmissionStatus}
              rowKey="stationId"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="传输状态统计" size="small" style={{ marginTop: 16 }}>
        <ReactECharts option={delayChartOption} style={{ height: 280 }} />
      </Card>
    </div>
  )
}

export default WaveformData
