import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space, Tag } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  ToolOutlined,
  BarChartOutlined,
  BellOutlined,
  SendOutlined,
  LineChartOutlined,
  FileProtectOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '系统概览',
  },
  {
    key: '/station-ledger',
    icon: <DatabaseOutlined />,
    label: '台站台账',
  },
  {
    key: '/device-operation',
    icon: <ToolOutlined />,
    label: '设备运行',
  },
  {
    key: '/waveform-data',
    icon: <BarChartOutlined />,
    label: '波形数据',
  },
  {
    key: '/earthquake-report',
    icon: <SendOutlined />,
    label: '地震速报',
  },
  {
    key: '/earthquake-analysis',
    icon: <LineChartOutlined />,
    label: '震情分析',
  },
  {
    key: '/device-maintenance',
    icon: <FileProtectOutlined />,
    label: '设备维护',
  },
  {
    key: '/duty-management',
    icon: <TeamOutlined />,
    label: '值班管理',
  },
]

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'))

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '系统设置',
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
      },
    ],
  }

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          background: '#001529',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 12 : 16,
          fontWeight: 'bold',
          borderBottom: '1px solid #1f1f1f',
        }}>
          {collapsed ? '地震' : '地震台站监测系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Tag color="green">系统运行正常</Tag>
            <span style={{ color: '#666' }}>{currentTime}</span>
          </Space>
          <Space size="large">
            <Space>
              <Tag color="green">在线台站: 8/10</Tag>
              <Tag color="orange">待处理告警: 3</Tag>
            </Space>
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>管理员</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{
          margin: '16px',
          padding: '24px',
          background: '#fff',
          minHeight: 280,
          overflow: 'auto',
          borderRadius: 8,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
