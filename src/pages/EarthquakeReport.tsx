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
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SendOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { Earthquake } from '../types'
import { mockEarthquakes, mockStations, generateTimeSeriesData
} from '../mock/data'

const { Option } = Select
const { TextArea } = Input

const EarthquakeReport = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>(mockEarthquakes)
  const [modalType, setModalType] = useState<'view' | 'add' | 'review'>('view')
  const [modalVisible, setModalVisible] = useState(false)
  const [currentEq, setCurrentEq] = useState<Earthquake | null>(null)
  const [form] = Form.useForm()

  const statusMap: Record<string, string> = {
    '自动定位': 'default',
    '人工复核': 'blue',
    '已发布': 'green',
  }

  const getMagnitudeColor = (mag: number) => {
    if (mag >= 5) return '#ff4d4f'
    if (mag >= 3) return '#faad14'
    return '#52c41a'
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
      render: (mag: number, record: Earthquake) => (
        <Tag color={getMagnitudeColor(mag)} style={{ fontSize: 14, fontWeight: 'bold' }}>
          M{mag}{record.magnitudeType}
        </Tag>
      ),
    },
    {
      title: '发震时间',
      dataIndex: 'occurTime',
      key: 'occurTime',
    },
    {
      title: '震源深度(km)',
      dataIndex: 'depth',
      key: 'depth',
      width: 120,
      render: (val: number) => val.toFixed(1),
    },
    {
      title: '经纬度',
      key: 'coords',
      width: 180,
      render: (_: any, record: Earthquake) => (
        <span>{record.longitude.toFixed(2)}°E, {record.latitude.toFixed(2)}°N</span>
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
      width: 200,
      render: (_: any, record: Earthquake) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
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

  const handleView = (eq: Earthquake) => {
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

  const handleReview = (eq: Earthquake) => {
    setCurrentEq(eq)
    setModalType('review')
    form.setFieldsValue(eq)
    setModalVisible(true)
  }

  const handlePublish = (eq: Earthquake) => {
    Modal.confirm({
      title: '确认发布',
      content: `确定要发布 ${eq.location} ${eq.magnitude}级地震速报吗？`,
      onOk: () => {
        setEarthquakes(earthquakes.map(e =>
          e.id === eq.id ? { ...e, status: '已发布' as const } : e
        ))
      },
    })
  }

  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (modalType === 'add') {
        const newEq: Earthquake = {
          ...values,
          id: `EQ-2024-${String(earthquakes.length + 1).toString().padStart(3, '0')}`,
          status: '自动定位',
          stations: [],
        }
        setEarthquakes([newEq, ...earthquakes])
      } else if (modalType === 'review' && currentEq) {
        setEarthquakes(earthquakes.map(e =>
          e.id === currentEq.id ? { ...e, ...values, status: '人工复核' as const } : e
        ))
      }
      setModalVisible(false)
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

  return (
    <div>
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
            value={Math.max(...earthquakes.map(e => e.magnitude))}
            suffix="级"
            valueStyle={{ color: '#ff4d4f' }}
          />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
            title="待复核"
            value={earthquakes.filter(e => e.status === '自动定位').length}
            suffix="条"
            valueStyle={{ color: '#faad14' }}
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
                <span style={{ fontWeight: 'bold' }}>{recentEarthquake.occurTime}</span>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            人工录入
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={earthquakes}
          rowKey="id"
          scroll={{ x: 1200 }}
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
        onCancel={() => setModalVisible(false)}
        onOk={modalType !== 'view' ? handleSubmit : undefined}
        footer={modalType === 'view' ? null : undefined}
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
              <Descriptions.Item label="发震时间">{currentEq.occurTime}</Descriptions.Item>
              <Descriptions.Item label="速报时间">{currentEq.reportTime}</Descriptions.Item>
              <Descriptions.Item label="经度">{currentEq.longitude.toFixed(4)}°E</Descriptions.Item>
              <Descriptions.Item label="纬度">{currentEq.latitude.toFixed(4)}°N</Descriptions.Item>
              <Descriptions.Item label="震源深度">{currentEq.depth}km</Descriptions.Item>
              <Descriptions.Item label="烈度">{currentEq.intensity || '-'}</Descriptions.Item>
              <Descriptions.Item label="影响人口">{currentEq.affectedPopulation?.toLocaleString() || '-'}</Descriptions.Item>
              <Descriptions.Item label="观测台站">{stationNames || '-'}</Descriptions.Item>
            </Descriptions>

            <Card title="速报流程" size="small" style={{ marginTop: 16 }}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: `自动定位完成 - ${currentEq.occurTime}`,
                  },
                  {
                    color: currentEq.status !== '自动定位' ? 'green' : 'blue',
                    children: currentEq.status !== '自动定位'
                      ? `人工复核完成 - ${currentEq.reportTime}`
                      : '等待人工复核',
                  },
                  {
                    color: currentEq.status === '已发布' ? 'green' : 'gray',
                    children: currentEq.status === '已发布'
                      ? '速报已发布'
                      : '等待发布',
                  },
                ]}
              />
            </Card>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item name="location" label="发震地点" rules={[{ required: true }]}>
              <Input placeholder="请输入发震地点" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="magnitude" label="震级" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} step={0.1} min={0} max={10} />
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
            <Form.Item name="occurTime" label="发震时间" rules={[{ required: true }]}>
              <Input type="datetime-local" style={{ width: '100%' }} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="longitude" label="经度" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} step={0.0001} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="latitude" label="纬度" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} step={0.0001} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="depth" label="深度(km)" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} step={0.1} min={0} />
                </Form.Item>
              </Col>
            </Row>
            {modalType === 'review' && (
              <>
                <Form.Item name="intensity" label="烈度">
                  <Select placeholder="请选择烈度">
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(i => (
                      <Option key={i} value={i}>{i}度</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="affectedPopulation" label="影响人口">
                  <InputNumber style={{ width: '100%' }} />
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
