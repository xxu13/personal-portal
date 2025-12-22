import { Card, Form, Input, Button, Switch, message, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

import styles from './ManagePage.module.scss';

const SettingsPage = () => {
  const [form] = Form.useForm();

  const handleSave = async () => {
    try {
      await form.validateFields();
      // Settings would be saved to backend here
      message.success('Settings saved (demo)');
    } catch (error) {
      message.error('Please check the form');
    }
  };

  return (
    <div className={styles.managePage}>
      <h1 className={styles.title}>Settings</h1>

      <Card className={styles.settingsCard}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            siteName: 'Personal Portal',
            siteDescription: 'A personal portal with forum features',
            allowRegistration: true,
            requireEmailVerification: false,
            postsPerPage: 20,
            commentsPerPage: 50,
          }}
        >
          <h3>Site Settings</h3>
          <Form.Item
            name="siteName"
            label="Site Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Site name" />
          </Form.Item>
          <Form.Item
            name="siteDescription"
            label="Site Description"
          >
            <Input.TextArea placeholder="Site description" rows={3} />
          </Form.Item>

          <Divider />

          <h3>User Settings</h3>
          <Form.Item
            name="allowRegistration"
            label="Allow Registration"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="requireEmailVerification"
            label="Require Email Verification"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          <h3>Content Settings</h3>
          <Form.Item
            name="postsPerPage"
            label="Posts Per Page"
          >
            <Input type="number" min={5} max={50} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item
            name="commentsPerPage"
            label="Comments Per Page"
          >
            <Input type="number" min={10} max={100} style={{ width: 120 }} />
          </Form.Item>

          <Divider />

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default SettingsPage;


