import { useState } from 'react'
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Descriptions,
  Row,
  Col,
} from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Station } from '../types'
import { mockStations, mockEquipments } from '../mock/data'

const { Option } = Select
const { TextArea } = Input

const StationLedger = () => {
  const [stations, setStations] = useState<Station[]>(mockStations)
  const [modalType, setModalType] = useState<'view' | 'add' | 'edit'>('view')
  const [modalVisible, setModalVisible] = useState(false)
  const [currentStation, setCurrentStation] = useState<Station | null>(null)
  const [form] = Form.useForm()

  const columns = [
    {
      title: '台站编码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: '台站名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '台站类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          '测震台': 'blue',
          '强震台': 'green',
          '前兆台': 'orange',
        }
        return <Tag color={colorMap[type]}>{type}</Tag>
      },
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '经纬度',
      key: 'coords',
      width: 180,
      render: (_: any, record: Station) => (
        <span>
          {record.longitude.toFixed(4)}°E, {record.latitude.toFixed(4)}°N
        </span>
      ),
    },
    {
      title: '海拔(m)',
      dataIndex: 'altitude',
      key: 'altitude',
      width: 100,
      render: (val: number) => val.toFixed(1),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '运行中': 'green',
          '维护中': 'orange',
          '停用': 'red',
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: Station) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleView = (station: Station) => {
    setCurrentStation(station)
    setModalType('view')
    setModalVisible(true)
  }

  const handleAdd = () => {
    setCurrentStation(null)
    setModalType('add')
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (station: Station) => {
    setCurrentStation(station)
    setModalType('edit')
    form.setFieldsValue(station)
    setModalVisible(true)
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该台站档案吗？',
      onOk: () => {
        setStations(stations.filter(s => s.id !== id))
      },
    })
  }

  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (modalType === 'add') {
        const newStation: Station = {
          ...values,
          id: `ST-${String(stations.length + 1).padStart(3, '0')}`,
          equipment: [],
        }
        setStations([...stations, newStation])
      } else if (modalType === 'edit' && currentStation) {
        setStations(stations.map(s =>
          s.id === currentStation.id ? { ...s, ...values } : s
        ))
      }
      setModalVisible(false)
    })
  }

  const stationEquipments = currentStation
    ? mockEquipments.filter(e => e.stationId === currentStation.id)
    : []

  return (
    <div>
      <Card
        title="地震台站档案管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增台站
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={stations}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          modalType === 'view' ? '台站详情' :
          modalType === 'add' ? '新增台站' : '编辑台站'
        }
        open={modalVisible}
        width={800}
        onCancel={() => setModalVisible(false)}
        onOk={modalType !== 'view' ? handleSubmit : undefined}
        footer={modalType === 'view' ? null : undefined}
      >
        {modalType === 'view' && currentStation ? (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="台站编码">{currentStation.code}</Descriptions.Item>
              <Descriptions.Item label="台站名称">{currentStation.name}</Descriptions.Item>
              <Descriptions.Item label="台站类型">{currentStation.type}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={currentStation.status === '运行中' ? 'green' : currentStation.status === '维护中' ? 'orange' : 'red'}>
                  {currentStation.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="位置">{currentStation.location}</Descriptions.Item>
              <Descriptions.Item label="海拔">{currentStation.altitude.toFixed(1)}m</Descriptions.Item>
              <Descriptions.Item label="经度">{currentStation.longitude.toFixed(6)}°E</Descriptions.Item>
              <Descriptions.Item label="纬度">{currentStation.latitude.toFixed(6)}°N</Descriptions.Item>
              <Descriptions.Item label="建设日期">{currentStation.constructionDate}</Descriptions.Item>
              <Descriptions.Item label="联系人">{currentStation.contact}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentStation.phone}</Descriptions.Item>
              <Descriptions.Item label="台站描述" span={2}>{currentStation.description}</Descriptions.Item>
            </Descriptions>

            <Card title="关联设备" size="small" style={{ marginTop: 16 }}>
              <Table
                size="small"
                columns={[
                  { title: '设备名称', dataIndex: 'name', key: 'name' },
                  { title: '型号', dataIndex: 'model', key: 'model' },
                  { title: '类型', dataIndex: 'type', key: 'type' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (s: string) => {
                      const c: Record<string, string> = { '正常': 'green', '警告': 'orange', '故障': 'red', '离线': 'default' }
                      return <Tag color={c[s]}>{s}</Tag>
                    }
                  },
                ]}
                dataSource={stationEquipments}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="code" label="台站编码" rules={[{ required: true }]}>
                  <Input placeholder="请输入台站编码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="name" label="台站名称" rules={[{ required: true }]}>
                  <Input placeholder="请输入台站名称" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="type" label="台站类型" rules={[{ required: true }]}>
                  <Select placeholder="请选择台站类型">
                    <Option value="测震台">测震台</Option>
                    <Option value="强震台">强震台</Option>
                    <Option value="前兆台">前兆台</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                  <Select placeholder="请选择状态">
                    <Option value="运行中">运行中</Option>
                    <Option value="维护中">维护中</Option>
                    <Option value="停用">停用</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="location" label="位置" rules={[{ required: true }]}>
              <Input placeholder="请输入详细地址" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="longitude" label="经度" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="经度" min={73} max={135} step={0.0001} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="latitude" label="纬度" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="纬度" min={3} max={54} step={0.0001} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="altitude" label="海拔(m)" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="海拔" step={0.1} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="constructionDate" label="建设日期" rules={[{ required: true }]}>
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="contact" label="联系人" rules={[{ required: true }]}>
                  <Input placeholder="联系人姓名" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
              <Input placeholder="联系电话" />
            </Form.Item>
            <Form.Item name="description" label="台站描述">
              <TextArea rows={3} placeholder="台站描述信息" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default StationLedger
