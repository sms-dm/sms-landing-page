import React from 'react';
import { Badge, Button, Drawer, List, Space, Tag, Typography, Progress } from 'antd';
import { 
  WifiOutlined, 
  CloudSyncOutlined, 
  CloudUploadOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useOffline } from '../hooks/useOffline';
import './OfflineIndicator.css';

const { Text, Title } = Typography;

export const OfflineIndicator: React.FC = () => {
  const {
    isOnline,
    isServiceWorkerReady,
    offlineQueue,
    syncInProgress,
    retrySync,
    clearQueue
  } = useOffline();

  const [drawerVisible, setDrawerVisible] = React.useState(false);

  if (!isServiceWorkerReady) {
    return null;
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'POST': return 'green';
      case 'PUT': return 'blue';
      case 'DELETE': return 'red';
      case 'PATCH': return 'orange';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <>
      <div className="offline-indicator">
        {!isOnline && (
          <Tag color="red" icon={<WifiOutlined />}>
            Offline Mode
          </Tag>
        )}
        
        {offlineQueue.length > 0 && (
          <Badge count={offlineQueue.length} size="small">
            <Button
              type="text"
              size="small"
              icon={<CloudUploadOutlined />}
              onClick={() => setDrawerVisible(true)}
            >
              Pending Sync
            </Button>
          </Badge>
        )}

        {isOnline && syncInProgress && (
          <Space>
            <CloudSyncOutlined spin />
            <Text type="secondary">Syncing...</Text>
          </Space>
        )}
      </div>

      <Drawer
        title="Offline Queue"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        width={400}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={retrySync}
              loading={syncInProgress}
              disabled={!isOnline}
            >
              Retry Sync
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the offline queue?')) {
                  clearQueue();
                }
              }}
            >
              Clear Queue
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>Status: </Text>
            {isOnline ? (
              <Tag color="green" icon={<WifiOutlined />}>Online</Tag>
            ) : (
              <Tag color="red" icon={<WifiOutlined />}>Offline</Tag>
            )}
          </div>

          {!isOnline && (
            <div className="offline-message">
              <Text type="warning">
                You are currently offline. Any changes you make will be queued and 
                automatically synced when your connection is restored.
              </Text>
            </div>
          )}

          <div>
            <Title level={5}>Queued Requests ({offlineQueue.length})</Title>
            {offlineQueue.length === 0 ? (
              <Text type="secondary">No pending requests</Text>
            ) : (
              <List
                dataSource={offlineQueue}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Tag color={getMethodColor(item.method)}>{item.method}</Tag>
                        <Text code>{item.url}</Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Queued: {formatTimestamp(item.timestamp)}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </div>

          {syncInProgress && (
            <div>
              <Title level={5}>Syncing...</Title>
              <Progress percent={30} status="active" />
            </div>
          )}
        </Space>
      </Drawer>
    </>
  );
};