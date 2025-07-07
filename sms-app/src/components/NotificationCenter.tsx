import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  Badge,
  Button,
  Tabs,
  Empty,
  Space,
  Typography,
  Tag,
  Spin,
  message,
  Popconfirm,
  Checkbox,
  Divider
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { api } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import './NotificationCenter.css';

const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationCenterProps {
  visible?: boolean;
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible: externalVisible,
  onClose: externalOnClose
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const visible = externalVisible !== undefined ? externalVisible : internalVisible;
  const onClose = externalOnClose || (() => setInternalVisible(false));

  // Fetch notifications
  const fetchNotifications = async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      const params = {
        limit: 20,
        offset: currentOffset,
        unreadOnly: activeTab === 'unread'
      };

      const response = await api.get('/api/notifications', { params });
      const { notifications: newNotifications, unreadCount: count, hasMore: more } = response.data.data;

      if (reset) {
        setNotifications(newNotifications);
        setOffset(20);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
        setOffset(prev => prev + 20);
      }

      setUnreadCount(count);
      setHasMore(more);
    } catch (error) {
      message.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchNotifications(true);
    }
  }, [visible, activeTab]);

  // Mark as read
  const markAsRead = async (ids: number[]) => {
    try {
      await api.put('/api/notifications/read', { notificationIds: ids });
      setNotifications(prev =>
        prev.map(n =>
          ids.includes(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - ids.length));
      message.success('Marked as read');
    } catch (error) {
      message.error('Failed to mark as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      message.success('All notifications marked as read');
    } catch (error) {
      message.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      message.success('Notification deleted');
    } catch (error) {
      message.error('Failed to delete notification');
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'maintenance_reminder': <ToolOutlined style={{ color: '#1890ff' }} />,
      'certificate_warning': <SafetyCertificateOutlined style={{ color: '#fa8c16' }} />,
      'certificate_expired': <SafetyCertificateOutlined style={{ color: '#f5222d' }} />,
      'low_stock': <ShoppingCartOutlined style={{ color: '#fa8c16' }} />,
      'fault_assignment': <WarningOutlined style={{ color: '#f5222d' }} />,
      'fault_status_change': <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      'system_announcement': <NotificationOutlined style={{ color: '#722ed1' }} />
    };
    return iconMap[type] || <BellOutlined />;
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      'urgent': 'red',
      'high': 'orange',
      'normal': 'blue',
      'low': 'default'
    };
    return colorMap[priority] || 'default';
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }

    if (notification.data?.link) {
      window.location.href = notification.data.link;
      onClose();
    }
  };

  // Render notification item
  const renderNotificationItem = (notification: Notification) => (
    <List.Item
      key={notification.id}
      className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
      onClick={() => handleNotificationClick(notification)}
      actions={[
        !notification.is_read && (
          <Button
            size="small"
            icon={<CheckOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              markAsRead([notification.id]);
            }}
          >
            Mark Read
          </Button>
        ),
        <Popconfirm
          title="Delete this notification?"
          onConfirm={(e) => {
            e?.stopPropagation();
            deleteNotification(notification.id);
          }}
          onClick={(e) => e?.stopPropagation()}
        >
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={
          <div className="notification-icon">
            {getNotificationIcon(notification.type)}
          </div>
        }
        title={
          <Space>
            <Text strong>{notification.title}</Text>
            <Tag color={getPriorityColor(notification.priority)} size="small">
              {notification.priority}
            </Tag>
          </Space>
        }
        description={
          <div>
            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
              {notification.message}
            </Paragraph>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </Text>
          </div>
        }
      />
      {selectedIds.length > 0 && (
        <Checkbox
          checked={selectedIds.includes(notification.id)}
          onChange={(e) => {
            e.stopPropagation();
            setSelectedIds(prev =>
              e.target.checked
                ? [...prev, notification.id]
                : prev.filter(id => id !== notification.id)
            );
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </List.Item>
  );

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'urgent') return n.priority === 'urgent' || n.priority === 'high';
    return true;
  });

  return (
    <>
      {!externalVisible && (
        <Badge count={unreadCount} offset={[-5, 5]}>
          <Button
            type="text"
            icon={<BellOutlined />}
            onClick={() => setInternalVisible(true)}
            style={{ fontSize: 20 }}
          />
        </Badge>
      )}

      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Notifications</Title>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchNotifications(true)}
                loading={loading}
              />
              <Button
                icon={<SettingOutlined />}
                onClick={() => window.location.href = '/notifications/preferences'}
              />
            </Space>
          </div>
        }
        placement="right"
        onClose={onClose}
        visible={visible}
        width={480}
        bodyStyle={{ padding: 0 }}
      >
        <div className="notification-actions">
          <Space>
            {selectedIds.length > 0 ? (
              <>
                <Text>{selectedIds.length} selected</Text>
                <Button
                  size="small"
                  onClick={() => markAsRead(selectedIds)}
                >
                  Mark Selected as Read
                </Button>
                <Button
                  size="small"
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="small"
                  onClick={() => setSelectedIds(filteredNotifications.map(n => n.id))}
                >
                  Select All
                </Button>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    onClick={markAllAsRead}
                  >
                    Mark All as Read
                  </Button>
                )}
              </>
            )}
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ marginBottom: 0, paddingLeft: 16, paddingRight: 16 }}
        >
          <TabPane tab={`All (${notifications.length})`} key="all" />
          <TabPane tab={`Unread (${unreadCount})`} key="unread" />
          <TabPane tab="Urgent" key="urgent" />
        </Tabs>

        <div className="notification-list">
          <List
            dataSource={filteredNotifications}
            renderItem={renderNotificationItem}
            loading={loading}
            locale={{
              emptyText: (
                <Empty
                  description={
                    activeTab === 'unread'
                      ? 'No unread notifications'
                      : activeTab === 'urgent'
                      ? 'No urgent notifications'
                      : 'No notifications'
                  }
                />
              )
            }}
            loadMore={
              hasMore && !loading && activeTab === 'all' ? (
                <div style={{ textAlign: 'center', margin: '12px 0' }}>
                  <Button onClick={() => fetchNotifications()}>Load More</Button>
                </div>
              ) : null
            }
          />
        </div>
      </Drawer>
    </>
  );
};