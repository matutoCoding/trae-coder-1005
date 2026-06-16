import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Descriptions,
  Alert,
} from 'antd'
import {
  PlayCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileTextOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { WaveformData, Earthquake, Station, TransmissionStatus } from '../types'
import { mockTransmissionStatus } from '../mock/data'
import { useApp } from '../store/AppContext'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

const sourceTypeMap: Record<string, { label: string; color: string }> = {
  manual: { label: '手动录入', color: 'blue' },
  waveform: { label: '波形触发', color: 'purple' },
  auto: { label: '自动定位', color: 'default' },
}

const statusMap: Record<string, string> = {
  '草稿': 'orange',
  '自动定位': 'default',
  '人工复核': 'blue',
  '已发布': 'green',
}

const WaveformData = () => {
  const navigate = useNavigate()
  const { waveformData, earthquakes, stations, addEarthquake } = useApp()
  const [selectedStation, setSelectedStation] = useState<string>('')
  const [selectedWaveform, setSelectedWaveform] = useState<WaveformData | null>(waveformData[0] ?? null)

  const [generateModalVisible, setGenerateModalVisible] = useState(false)
  const [generatingWaveform, setGeneratingWaveform] = useState<WaveformData | null>(null)
  const [generateForm] = Form.useForm()

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

  const getStation = (stationId: string): Station | undefined => {
    return stations.find(s => s.id === stationId)
  }

  const getRelatedEarthquake = (waveformId: string): Earthquake | undefined => {
    return earthquakes.find(eq => eq.sourceWaveformId === waveformId)
  }

  const getMagnitudeColor = (mag: number) => {
    if (mag >= 5) return '#ff4d4f'
    if (mag >= 3) return '#faad14'
    return '#52c41a'
  }

  const estimateMagnitude = (maxAmplitude: number): number => {
    if (maxAmplitude <= 0) return 2.5
    const mag = Math.log10(Math.abs(maxAmplitude) * 1000) * 0.8 + 1.5
    return Math.round(Math.min(Math.max(mag, 2.0), 8.0) * 10) / 10
  }

  const handleGenerateDraft = (waveform: WaveformData) => {
    setGeneratingWaveform(waveform)
    const station = getStation(waveform.stationId)
    const defaultMagnitude = waveform.prelimMagnitude ?? estimateMagnitude(waveform.maxAmplitude)

    generateForm.setFieldsValue({
      location: `${waveform.stationName}附近`,
      occurTime: dayjs(waveform.startTime),
      magnitude: defaultMagnitude,
      magnitudeType: 'ML',
      depth: 10,
      longitude: station?.longitude ?? 0,
      latitude: station?.latitude ?? 0,
      stationName: waveform.stationName,
      channel: waveform.channel,
    })
    setGenerateModalVisible(true)
  }

  const handleGenerateSubmit = () => {
    generateForm.validateFields().then(values => {
      if (!generatingWaveform) return

      const now = dayjs()
      const occurTimeVal = dayjs(values.occurTime).isValid()
        ? dayjs(values.occurTime).format('YYYY-MM-DD HH:mm:ss')
        : now.format('YYYY-MM-DD HH:mm:ss')

      const newEq: Earthquake = {
        id: `EQ-2024-${String(earthquakes.length + 1).toString().padStart(3, '0')}`,
        location: values.location || '',
        magnitude: Number(values.magnitude) || 0,
        magnitudeType: values.magnitudeType || 'ML',
        occurTime: occurTimeVal,
        reportTime: now.format('YYYY-MM-DD HH:mm:ss'),
        longitude: Number(values.longitude) || 0,
        latitude: Number(values.latitude) || 0,
        depth: Number(values.depth) || 0,
        status: '草稿',
        stations: [generatingWaveform.stationId],
        sourceType: 'waveform',
        sourceWaveformId: generatingWaveform.id,
        meetingRequired: false,
      }

      addEarthquake(newEq)
      setGenerateModalVisible(false)

      Modal.success({
        title: '速报草稿已生成',
        content: (
          <div>
            <p>草稿编号：{newEq.id}</p>
            <p>发震地点：{newEq.location}</p>
            <p>初步震级：M{newEq.magnitude}{newEq.magnitudeType}</p>
            <p style={{ marginTop: 12, color: '#666' }}>
              请到地震速报模块复核完善信息
            </p>
          </div>
        ),
        okText: '前往地震速报',
        cancelText: '留在当前页',
        onOk: () => {
          navigate('/earthquake-report')
        },
      })
    })
  }

  const handleViewEarthquake = (eq: Earthquake) => {
    Modal.info({
      title: '关联地震速报信息',
      width: 600,
      content: (
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="地震编号">
            <Space>
              {eq.id}
              <Tag color={statusMap[eq.status]}>{eq.status}</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="发震地点">{eq.location}</Descriptions.Item>
          <Descriptions.Item label="震级">
            <Tag color={getMagnitudeColor(eq.magnitude)} style={{ fontSize: 14, fontWeight: 'bold' }}>
              M{eq.magnitude}{eq.magnitudeType}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="发震时间">
            {dayjs(eq.occurTime).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="震源深度">{eq.depth.toFixed(1)} km</Descriptions.Item>
          <Descriptions.Item label="经纬度">
            {eq.longitude.toFixed(2)}°E, {eq.latitude.toFixed(2)}°N
          </Descriptions.Item>
          <Descriptions.Item label="来源类型">
            {sourceTypeMap[eq.sourceType || 'auto'].label}
          </Descriptions.Item>
          <Descriptions.Item label="报告时间">
            {dayjs(eq.reportTime).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      ),
      okText: '前往地震速报页面',
      onOk: () => {
        navigate('/earthquake-report')
      },
    })
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
      width: 200,
      render: (_: any, record: WaveformData) => {
        const relatedEq = getRelatedEarthquake(record.id)
        return (
          <Space size="small">
            <Button type="link" size="small" onClick={() => setSelectedWaveform(record)}>
              查看波形
            </Button>
            {record.hasEvent && !relatedEq && (
              <Button
                type="primary"
                size="small"
                icon={<FileTextOutlined />}
                onClick={() => handleGenerateDraft(record)}
              >
                生成速报草稿
              </Button>
            )}
            {record.hasEvent && relatedEq && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewEarthquake(relatedEq)}
              >
                查看速报
              </Button>
            )}
          </Space>
        )
      },
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

  const relatedEqForSelected = selectedWaveform ? getRelatedEarthquake(selectedWaveform.id) : null

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="在线台站" value={onlineCount} suffix={`/${stations.length}`} />
            <Progress
              percent={Math.round(onlineCount / stations.length * 100)}
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
              {stations.map(s => (
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
          <div>
            <ReactECharts
              option={waveformOption(selectedWaveform)}
              style={{ height: 300 }}
              notMerge
            />
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 4 }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space size="middle">
                    <span>台站：<strong>{selectedWaveform.stationName}</strong></span>
                    <span>通道：<strong>{selectedWaveform.channel}</strong></span>
                    <span>采样率：<strong>{selectedWaveform.sampleRate}Hz</strong></span>
                    <span>
                      事件：
                      <Tag color={selectedWaveform.hasEvent ? 'red' : 'green'}>
                        {selectedWaveform.hasEvent ? '有事件' : '无事件'}
                      </Tag>
                    </span>
                    {selectedWaveform.prelimMagnitude && (
                      <span>
                        初步震级：
                        <Tag color={getMagnitudeColor(selectedWaveform.prelimMagnitude)}>
                          M{selectedWaveform.prelimMagnitude}
                        </Tag>
                      </span>
                    )}
                  </Space>
                </Col>
                <Col>
                  <Space>
                    {selectedWaveform.hasEvent && !relatedEqForSelected && (
                      <Button
                        type="primary"
                        icon={<FileTextOutlined />}
                        onClick={() => handleGenerateDraft(selectedWaveform)}
                      >
                        生成速报草稿
                      </Button>
                    )}
                    {selectedWaveform.hasEvent && relatedEqForSelected && (
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewEarthquake(relatedEqForSelected)}
                      >
                        查看关联地震
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
              {relatedEqForSelected && (
                <Alert
                  message="该波形已生成关联地震速报"
                  description={
                    <Space>
                      <span>地震编号：<strong>{relatedEqForSelected.id}</strong></span>
                      <span>状态：<Tag color={statusMap[relatedEqForSelected.status]}>{relatedEqForSelected.status}</Tag></span>
                      <span>震级：M{relatedEqForSelected.magnitude}{relatedEqForSelected.magnitudeType}</span>
                    </Space>
                  }
                  type="info"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
            </div>
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="波形数据列表" size="small">
            <Table
              columns={waveformColumns}
              dataSource={waveformData}
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

      <Modal
        title="生成地震速报草稿"
        open={generateModalVisible}
        onOk={handleGenerateSubmit}
        onCancel={() => setGenerateModalVisible(false)}
        okText="生成草稿"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        {generatingWaveform && (
          <div>
            <Alert
              message={`从波形 ${generatingWaveform.stationName} - ${generatingWaveform.channel} 生成速报草稿`}
              description="以下字段已根据波形信息自动填充，您可以修改后生成草稿。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form
              form={generateForm}
              layout="vertical"
              preserve={false}
            >
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="location"
                    label="发震地点"
                    rules={[{ required: true, message: '请输入发震地点' }]}
                  >
                    <Input placeholder="如：北京台站附近" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="depth"
                    label="震源深度(km)"
                    rules={[{ required: true, message: '请输入震源深度' }]}
                  >
                    <InputNumber min={0} max={700} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="magnitude"
                    label="初步震级"
                    rules={[{ required: true, message: '请输入震级' }]}
                  >
                    <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="magnitudeType"
                    label="震级类型"
                    rules={[{ required: true, message: '请选择震级类型' }]}
                  >
                    <Select>
                      <Option value="ML">ML（地方震）</Option>
                      <Option value="Ms">Ms（面波震级）</Option>
                      <Option value="Mb">Mb（体波震级）</Option>
                      <Option value="Mw">Mw（矩震级）</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="occurTime"
                label="发震时间"
                rules={[{ required: true, message: '请选择发震时间' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="longitude"
                    label="经度(°E)"
                    rules={[{ required: true, message: '请输入经度' }]}
                  >
                    <InputNumber min={73} max={135} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="latitude"
                    label="纬度(°N)"
                    rules={[{ required: true, message: '请输入纬度' }]}
                  >
                    <InputNumber min={3} max={54} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="stationName" label="来源台站">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="channel" label="通道">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="来源类型">
                <Tag color="purple">波形触发 (waveform)</Tag>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WaveformData
