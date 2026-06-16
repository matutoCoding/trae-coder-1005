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
  InputNumber,
  Select,
  Descriptions,
  Row,
  Col,
  Statistic,
  Timeline,
  Tag as AntTag,
  DatePicker,
  message,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { Earthquake, WaveformData } from '../types'
import { mockEarthquakes, mockStations, mockWaveformData, generateTimeSeriesData } from '../mock/data'

const { Option } = Select
const { TextArea } = Input

interface EarthquakeExt extends Earthquake {
  autoLocateTime?: string
  reviewTime?: string
  publishTime?: string
}

const sourceTypeMap: Record<string, { label: string; color: string }> = {
  manual: { label: '手动录入', color: 'blue' },
  waveform: { label: '波形触发', color: 'purple' },
  auto: { label: '自动定位', color: 'default' },
}

const EarthquakeReport = () => {
  const [earthquakes, setEarthquakes] = useState<EarthquakeExt[]>(
    mockEarthquakes.map(eq => {
      const ext: EarthquakeExt = { ...eq, autoLocateTime: eq.reportTime }
      if (eq.status === '人工复核' || eq.status === '已发布') {
        ext.reviewTime = dayjs(eq.reportTime).add(1, 'minute').format('YYYY-MM-DD HH:mm:ss')
      }
      if (eq.status === '已发布') {
        ext.publishTime = dayjs(eq.reportTime).add(2, 'minute').format('YYYY-MM-DD HH:mm:ss')
      }
      return ext
    })
  )
  const [modalType, setModalType] = useState<'view' | 'add' | 'review'>('view')
  const [modalVisible, setModalVisible] = useState(false)
  const [currentEq, setCurrentEq] = useState<EarthquakeExt | null>(null)
  const [form] = Form.useForm()

  const statusMap: Record<string, string> = {
    '草稿': 'orange',
    '自动定位': 'default',
    '人工复核': 'blue',
    '已发布': 'green',
  }

  const getMagnitudeColor = (mag: number) => {
    if (mag >= 5) return '#ff4d4f'
    if (mag >= 3) return '#faad14'
    return '#52c41a'
  }

  const formatDateTime = (val: string | undefined | null) => {
    if (!val) return '-'
    return dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : val
  }

  const getWaveformName = (waveformId: string | undefined) => {
    if (!waveformId) return '-'
    const wf = mockWaveformData.find(w => w.id === waveformId)
    return wf ? `${wf.stationName} - ${wf.channel}` : waveformId
  }

  const columns = [
    {
      title: '地震编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '发震地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '震级',
      dataIndex: 'magnitude',
      key: 'magnitude',
      width: 100,
      render: (mag: number, record: EarthquakeExt) => (
        <Tag color={getMagnitudeColor(mag)} style={{ fontSize: 14, fontWeight: 'bold' }}>
          M{mag}{record.magnitudeType}
        </Tag>
      ),
    },
    {
      title: '发震时间',
      dataIndex: 'occurTime',
      key: 'occurTime',
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 100,
      render: (sourceType: string | undefined) => {
        const info = sourceTypeMap[sourceType || 'auto']
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: '震源深度(km)',
      dataIndex: 'depth',
      key: 'depth',
      width: 120,
      render: (val: number) => (typeof val === 'number' ? val.toFixed(1) : '-'),
    },
    {
      title: '经纬度',
      key: 'coords',
      width: 180,
      render: (_: any, record: EarthquakeExt) => (
        <span>
          {typeof record.longitude === 'number' ? record.longitude.toFixed(2) : '-'}°E,{' '}
          {typeof record.latitude === 'number' ? record.latitude.toFixed(2) : '-'}°N
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusMap[status]}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: EarthquakeExt) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {record.status === '草稿' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleReview(record)}
            >
              编辑
            </Button>
          )}
          {record.status === '自动定位' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleReview(record)}
            >
              复核
            </Button>
          )}
          {record.status === '人工复核' && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handlePublish(record)}
            >
              发布
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleView = (eq: EarthquakeExt) => {
    setCurrentEq(eq)
    setModalType('view')
    setModalVisible(true)
  }

  const handleAdd = () => {
    setCurrentEq(null)
    setModalType('add')
    form.resetFields()
    setModalVisible(true)
  }

  const handleReview = (eq: EarthquakeExt) => {
    setCurrentEq(eq)
    setModalType('review')
    form.setFieldsValue({
      ...eq,
      occurTime: dayjs(eq.occurTime),
      stations: eq.stations,
    })
    setModalVisible(true)
  }

  const handlePublish = (eq: EarthquakeExt) => {
    const isLargeQuake = eq.magnitude >= 4
    const content = isLargeQuake
      ? `确定要发布 ${eq.location} ${eq.magnitude}级地震速报吗？\n\n本次地震震级较大，发布后将自动生成会商提醒。`
      : `确定要发布 ${eq.location} ${eq.magnitude}级地震速报吗？`

    Modal.confirm({
      title: '确认发布',
      content: content,
      onOk: () => {
        const publishTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
        setEarthquakes(earthquakes.map(e =>
          e.id === eq.id
            ? {
                ...e,
                status: '已发布' as const,
                publishTime,
                reportTime: publishTime,
                meetingRequired: e.magnitude >= 4 ? true : e.meetingRequired,
              }
            : e
        ))
        message.success('发布成功')
      },
    })
  }

  const handleSubmit = (saveAsDraft: boolean = false) => {
    form.validateFields().then(values => {
      if (modalType === 'add') {
        const now = dayjs()
        const occurTimeVal = dayjs(values.occurTime).isValid()
          ? dayjs(values.occurTime).format('YYYY-MM-DD HH:mm:ss')
          : now.format('YYYY-MM-DD HH:mm:ss')
        const reportTimeVal = now.format('YYYY-MM-DD HH:mm:ss')
        const status = saveAsDraft ? '草稿' : '自动定位'
        const newEq: EarthquakeExt = {
          id: `EQ-2024-${String(earthquakes.length + 1).toString().padStart(3, '0')}`,
          location: values.location || '',
          magnitude: Number(values.magnitude) || 0,
          magnitudeType: values.magnitudeType || 'ML',
          occurTime: occurTimeVal,
          reportTime: reportTimeVal,
          autoLocateTime: saveAsDraft ? undefined : reportTimeVal,
          longitude: Number(values.longitude) || 0,
          latitude: Number(values.latitude) || 0,
          depth: Number(values.depth) || 0,
          status,
          intensity: values.intensity,
          affectedPopulation: values.affectedPopulation,
          stations: values.stations || [],
          sourceType: 'manual',
          meetingRequired: false,
        }
        setEarthquakes([newEq, ...earthquakes])
        message.success(saveAsDraft ? '已保存为草稿' : '录入成功')
      } else if (modalType === 'review' && currentEq) {
        const reviewTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const newStatus = saveAsDraft ? '草稿' : '人工复核'
        setEarthquakes(earthquakes.map(e =>
          e.id === currentEq.id
            ? {
                ...e,
                location: values.location || e.location,
                magnitude: Number(values.magnitude) || e.magnitude,
                magnitudeType: values.magnitudeType || e.magnitudeType,
                occurTime: dayjs(values.occurTime).isValid()
                  ? dayjs(values.occurTime).format('YYYY-MM-DD HH:mm:ss')
                  : e.occurTime,
                longitude: typeof values.longitude === 'number' ? values.longitude : e.longitude,
                latitude: typeof values.latitude === 'number' ? values.latitude : e.latitude,
                depth: typeof values.depth === 'number' ? values.depth : e.depth,
                intensity: values.intensity || e.intensity,
                affectedPopulation: values.affectedPopulation || e.affectedPopulation,
                status: newStatus,
                reviewTime: saveAsDraft ? undefined : reviewTime,
                reportTime: reviewTime,
                sourceType: 'manual',
              }
            : e
        ))
        message.success(saveAsDraft ? '已保存为草稿' : '复核完成')
      }
      setModalVisible(false)
    })
  }

  const handleGotoAnalysis = () => {
    Modal.confirm({
      title: '跳转会商记录',
      content: '是否跳转到震情分析页面查看会商记录？',
      onOk: () => {
        window.location.href = '/earthquake-analysis'
      },
    })
  }

  const stationNames = currentEq
    ? currentEq.stations.map(id => {
        const s = mockStations.find(s => s.id === id)
        return s?.name || id
      }).join('，')
    : ''

  const trendOption = {
    title: { text: '近30天地震活动趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: generateTimeSeriesData(30).map(d => d[0]) },
    yAxis: { type: 'value', name: '次数' },
    series: [{
      data: generateTimeSeriesData(30, 5, 3).map(d => Math.round(d[1])),
      type: 'bar',
      color: '#1890ff',
    }],
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
  }

  const depthOption = {
    title: { text: '震源深度分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    xAxis: { type: 'category', data: ['0-10km', '10-20km', '20-30km', '30-50km', '>50km'] },
    yAxis: { type: 'value', name: '次数' },
    series: [{
      data: [12, 18, 10, 5, 2],
      type: 'bar',
      itemStyle: {
        color: (params: any) => {
          const colors = ['#52c41a', '#73d13d', '#faad14', '#fa8c16', '#f5222d']
          return colors[params.dataIndex]
        },
      },
    }],
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
  }

  const magnitudeDistOption = {
    title: { text: '震级分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 25, name: 'M<2' },
        { value: 15, name: '2≤M<3' },
        { value: 5, name: '3≤M<4' },
        { value: 2, name: 'M≥4' },
      ],
      label: { show: true, formatter: '{b}: {c}次' },
    }],
    color: ['#52c41a', '#73d13d', '#faad14', '#f5222d'],
  }

  const recentEarthquake = earthquakes[0]
  const pendingMeetingCount = earthquakes.filter(e => e.status === '已发布' && e.meetingRequired && !e.meetingRecordId).length

  return (
    <div>
      {pendingMeetingCount > 0 && (
        <Alert
          message="待会商提醒"
          description={`有 ${pendingMeetingCount} 条已发布地震待会商，请及时处理！`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" onClick={() => window.location.href = '/earthquake-analysis'}>
              去处理
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月地震"
              value={47}
              suffix="次"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最大震级"
              value={Math.max(...earthquakes.map(e => e.magnitude), 0)}
              suffix="级"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="草稿"
              value={earthquakes.filter(e => e.status === '草稿').length}
              suffix="条"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发布"
              value={earthquakes.filter(e => e.status === '已发布').length}
              suffix="条"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {recentEarthquake && recentEarthquake.magnitude >= 4 && (
        <Card
          type="inner"
          style={{ marginTop: 16, border: '2px solid #ff4d4f', background: '#fff1f0' }}
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
              <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 16 }}>
                最新地震速报
              </span>
            </Space>
          }
        >
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ fontSize: 14 }}>
                <span style={{ color: '#666' }}>发震时间：</span>
                <span style={{ fontWeight: 'bold' }}>{formatDateTime(recentEarthquake.occurTime)}</span>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: 14 }}>
                <span style={{ color: '#666' }}>发震地点：</span>
                <span style={{ fontWeight: 'bold' }}>{recentEarthquake.location}</span>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: 14 }}>
                <span style={{ color: '#666' }}>震级：</span>
                <AntTag color="red" style={{ fontSize: 14, fontWeight: 'bold' }}>
                  M{recentEarthquake.magnitude}
                </AntTag>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: 14 }}>
                <span style={{ color: '#666' }}>深度：</span>
                <span style={{ fontWeight: 'bold' }}>{recentEarthquake.depth}km</span>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Card
        title="地震速报列表"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Button icon={<SaveOutlined />} onClick={() => {
              setCurrentEq(null)
              setModalType('add')
              form.resetFields()
              setModalVisible(true)
            }}>
              草稿录入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              人工录入
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={earthquakes}
          rowKey="id"
          scroll={{ x: 1500 }}
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={10}>
          <Card>
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={7}>
          <Card>
            <ReactECharts option={depthOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={7}>
          <Card>
            <ReactECharts option={magnitudeDistOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          modalType === 'view' ? '地震详情' :
          modalType === 'add' ? '人工录入地震' : '人工复核'
        }
        open={modalVisible}
        width={800}
        destroyOnClose
        onCancel={() => setModalVisible(false)}
        footer={modalType === 'view' ? null : (
          <Space>
            <Button onClick={() => handleSubmit(true)} icon={<SaveOutlined />}>
              保存草稿
            </Button>
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" onClick={() => handleSubmit(false)}>
              {modalType === 'add' ? '提交' : '确认复核'}
            </Button>
          </Space>
        )}
      >
        {modalType === 'view' && currentEq ? (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="地震编号">{currentEq.id}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentEq.status]}>{currentEq.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发震地点">{currentEq.location}</Descriptions.Item>
              <Descriptions.Item label="震级">
                M{currentEq.magnitude}{currentEq.magnitudeType}
              </Descriptions.Item>
              <Descriptions.Item label="发震时间">{formatDateTime(currentEq.occurTime)}</Descriptions.Item>
              <Descriptions.Item label="速报时间">{formatDateTime(currentEq.reportTime)}</Descriptions.Item>
              <Descriptions.Item label="经度">
                {typeof currentEq.longitude === 'number' ? `${currentEq.longitude.toFixed(4)}°E` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="纬度">
                {typeof currentEq.latitude === 'number' ? `${currentEq.latitude.toFixed(4)}°N` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="震源深度">{currentEq.depth}km</Descriptions.Item>
              <Descriptions.Item label="烈度">{currentEq.intensity || '-'}</Descriptions.Item>
              <Descriptions.Item label="影响人口">{currentEq.affectedPopulation?.toLocaleString() || '-'}</Descriptions.Item>
              <Descriptions.Item label="观测台站">{stationNames || '-'}</Descriptions.Item>
              <Descriptions.Item label="来源类型">
                {sourceTypeMap[currentEq.sourceType || 'auto'].label}
              </Descriptions.Item>
              <Descriptions.Item label="关联波形">
                {getWaveformName(currentEq.sourceWaveformId)}
              </Descriptions.Item>
              <Descriptions.Item label="是否需要会商">
                <Tag color={currentEq.meetingRequired ? 'red' : 'default'}>
                  {currentEq.meetingRequired ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联会商记录">
                {currentEq.meetingRecordId || '-'}
              </Descriptions.Item>
            </Descriptions>

            {currentEq.meetingRecordId && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={handleGotoAnalysis}
                >
                  查看会商记录
                </Button>
              </div>
            )}

            <Card title="速报流程" size="small" style={{ marginTop: 16 }}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>自动定位完成</div>
                        <div style={{ color: '#666', fontSize: 12 }}>
                          时间：{formatDateTime(currentEq.autoLocateTime || currentEq.occurTime)}
                        </div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          系统自动检测并完成地震初步定位
                        </div>
                      </div>
                    ),
                  },
                  {
                    color: currentEq.status !== '自动定位' && currentEq.status !== '草稿' ? 'green' : 'blue',
                    children: (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {currentEq.status === '草稿' ? '草稿状态' :
                           currentEq.status !== '自动定位' ? '人工复核完成' : '等待人工复核'}
                        </div>
                        <div style={{ color: '#666', fontSize: 12 }}>
                          时间：{currentEq.status !== '自动定位' && currentEq.status !== '草稿'
                            ? formatDateTime(currentEq.reviewTime || currentEq.reportTime)
                            : '-'}
                        </div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {currentEq.status === '草稿'
                            ? '草稿状态，可继续编辑'
                            : currentEq.status !== '自动定位'
                            ? '值班人员对参数进行人工审核校正'
                            : '值班人员审核地震参数'}
                        </div>
                      </div>
                    ),
                  },
                  {
                    color: currentEq.status === '已发布' ? 'green' : 'gray',
                    children: (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {currentEq.status === '已发布' ? '速报已发布' : '等待发布'}
                        </div>
                        <div style={{ color: '#666', fontSize: 12 }}>
                          时间：{currentEq.status === '已发布'
                            ? formatDateTime(currentEq.publishTime || currentEq.reportTime)
                            : '-'}
                        </div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {currentEq.status === '已发布'
                            ? '速报信息已对外发布'
                            : '审核通过后进行发布'}
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item name="location" label="发震地点" rules={[{ required: true, message: '请输入发震地点' }]}>
              <Input placeholder="请输入发震地点" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="magnitude" label="震级" rules={[{ required: true, message: '请输入震级' }]}>
                  <InputNumber style={{ width: '100%' }} step={0.1} min={0} max={10} placeholder="请输入震级" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="magnitudeType" label="震级类型" initialValue="ML">
                  <Select>
                    <Option value="ML">ML</Option>
                    <Option value="Ms">Ms</Option>
                    <Option value="Mw">Mw</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="occurTime" label="发震时间" rules={[{ required: true, message: '请选择发震时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择发震时间" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="longitude" label="经度" rules={[{ required: true, message: '请输入经度' }]}>
                  <InputNumber style={{ width: '100%' }} step={0.0001} placeholder="东经" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="latitude" label="纬度" rules={[{ required: true, message: '请输入纬度' }]}>
                  <InputNumber style={{ width: '100%' }} step={0.0001} placeholder="北纬" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="depth" label="深度(km)" rules={[{ required: true, message: '请输入深度' }]}>
                  <InputNumber style={{ width: '100%' }} step={0.1} min={0} placeholder="震源深度" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="stations" label="观测台站">
              <Select mode="multiple" placeholder="请选择观测台站">
                {mockStations.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
            {modalType === 'review' && (
              <>
                <Form.Item name="intensity" label="烈度">
                  <Select placeholder="请选择烈度" allowClear>
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(i => (
                      <Option key={i} value={i}>{i}度</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="affectedPopulation" label="影响人口">
                  <InputNumber style={{ width: '100%' }} min={0} placeholder="受影响人口数" />
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default EarthquakeReport
