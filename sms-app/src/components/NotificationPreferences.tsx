import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Select
} from 'antd';
import {
  BellOutlined,
  MailOutlined,
  MobileOutlined,
  SoundOutlined,
  DesktopOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface NotificationPreferences {
  // Email preferences
  notify_critical_faults: boolean;
  notify_maintenance_reminders: boolean;
  notify_fault_resolutions: boolean;
  email_digest_frequency: 'immediate' | 'daily' | 'weekly';
  
  // App preferences
  notification_sound: boolean;
  desktop_notifications: boolean;
  sms_notifications: boolean;
  
  // Channel preferences
  in_app_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

export const NotificationPreferences: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    fetchPreferences();
    checkPushSupport();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notifications/preferences');
      form.setFieldsValue(response.data.data);
    } catch (error) {
      message.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const checkPushSupport = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true);
      setPushEnabled(Notification.permission === 'granted');
    }
  };

  const handleSave = async (values: NotificationPreferences) => {
    try {
      setSaving(true);
      await api.put('/api/notifications/preferences', values);
      message.success('Notification preferences saved');
    } catch (error) {
      message.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const enablePushNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
        });

        await api.post('/api/notifications/push/subscribe', { subscription });
        setPushEnabled(true);
        message.success('Push notifications enabled');
      } else {
        message.warning('Push notification permission denied');
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      message.error('Failed to enable push notifications');
    }
  };

  const sendTestNotification = async () => {
    try {
      await api.post('/api/notifications/test', {
        type: 'test',
        channels: ['in_app', 'email']
      });
      message.success('Test notification sent! Check your notifications.');
    } catch (error) {
      message.error('Failed to send test notification');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <Title level={4}>
        <BellOutlined /> Notification Preferences
      </Title>
      <Paragraph type="secondary">
        Customize how and when you receive notifications from the SMS Portal.
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          notify_critical_faults: true,
          notify_maintenance_reminders: true,
          notify_fault_resolutions: true,
          notification_sound: true,
          desktop_notifications: false,
          sms_notifications: false,
          in_app_notifications: true,
          email_notifications: true,
          push_notifications: false,
          email_digest_frequency: 'immediate'
        }}
      >
        <Divider orientation="left">
          <MailOutlined /> Email Notifications
        </Divider>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item name="email_notifications" valuePropName="checked">
              <Space>
                <Switch />
                <Text>Enable email notifications</Text>
              </Space>
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item name="notify_critical_faults" valuePropName="checked">
              <Space>
                <Switch />
                <Text>Critical fault alerts</Text>
              </Space>
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item name="notify_maintenance_reminders" valuePropName="checked">
              <Space>
                <Switch />
                <Text>Maintenance reminders</Text>
              </Space>
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item name="notify_fault_resolutions" valuePropName="checked">
              <Space>
                <Switch />
                <Text>Fault resolution updates</Text>
              </Space>
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item 
              name="email_digest_frequency" 
              label="Email frequency"
              tooltip="How often to receive email notifications"
            >
              <Select>
                <Option value="immediate">Immediately</Option>
                <Option value="daily">Daily digest</Option>
                <Option value="weekly">Weekly digest</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          <DesktopOutlined /> In-App Notifications
        </Divider>

        <Row gutter={[16, 16]}>
          <Col span={24} md={12}>
            <Form.Item name="in_app_notifications" valuePropName="checked">
              <Space>
                <Switch />
                <Text>Show in-app notifications</Text>
              </Space>
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item name="notification_sound" valuePropName="checked">
              <Space>
                <Switch />
                <SoundOutlined />
                <Text>Notification sound</Text>
              </Space>
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item name="desktop_notifications" valuePropName="checked">
              <Space>
                <Switch />
                <DesktopOutlined />
                <Text>Desktop notifications</Text>
              </Space>
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item name="push_notifications" valuePropName="checked">
              <Space>
                <Switch disabled={!pushSupported || !pushEnabled} />
                <MobileOutlined />
                <Text>Push notifications</Text>
              </Space>
            </Form.Item>
          </Col>
        </Row>

        {pushSupported && !pushEnabled && (
          <Alert
            message="Push notifications are not enabled"
            description={
              <Space direction="vertical">
                <Text>Enable push notifications to receive alerts even when the app is closed.</Text>
                <Button size="small" onClick={enablePushNotifications}>
                  Enable Push Notifications
                </Button>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        <Divider />

        <Space>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={saving}
              icon={<SaveOutlined />}
            >
              Save Preferences
            </Button>
          </Form.Item>

          <Button onClick={sendTestNotification}>
            Send Test Notification
          </Button>
        </Space>
      </Form>
    </Card>
  );
};