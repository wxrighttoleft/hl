import React, { PureComponent } from 'react';
import { findDOMNode } from 'react-dom';
import moment from 'moment';
import { connect } from 'dva';
import {
  List,
  Card,
  Radio,
  Input,
  Button,
  Avatar,
  Modal,
  Form,
  Select,
  Tag,
  Switch,
  message,
  Popconfirm,
  notification,
} from 'antd';

import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import styles from './User.less';

const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Search } = Input;

@connect(({ user, role, loading }) => ({
  list: user.list,
  roles: role.list,
  loading: loading.models.user && loading.models.role,
}))
@Form.create()
class UserList extends PureComponent {
  state = { visible: false, done: false, filter: 'all', searchUserName: '' };

  formLayout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 13 },
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetch',
    });
    dispatch({
      type: 'role/fetchTree',
    });
  }

  showModal = () => {
    this.setState({
      visible: true,
      current: undefined,
    });
  };

  showEditModal = item => {
    this.setState({
      visible: true,
      current: item,
    });
  };

  handleDone = () => {
    setTimeout(() => this.addBtn.blur(), 0);
    this.setState({
      done: false,
      visible: false,
    });
  };

  handleCancel = () => {
    setTimeout(() => this.addBtn.blur(), 0);
    this.setState({
      visible: false,
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;
    const { current } = this.state;
    const id = current ? current.id : '';

    setTimeout(() => this.addBtn.blur(), 0);
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleDone();
      dispatch({
        type: 'user/submit',
        payload: { id, ...fieldsValue },
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            message.success(id === '' ? '????????????????????????????????????123456' : '?????????????????????');
            dispatch({
              type: 'user/fetch',
            });
          }
        },
      });
    });
  };

  confirmDelete = id => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/submit',
      payload: { id },
      callback: response => {
        if (response.status === 400) {
          notification.error({
            message: '??????????????????',
            description: response.message,
          });
        } else {
          message.success('???????????????');
          dispatch({
            type: 'user/fetch',
          });
        }
      },
    });
  };

  confirmResetPassword = id => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/resetPassword',
      payload: { id },
      callback: () => {
        message.success('?????????????????????');
      },
    });
  };

  handleSearchByFilter = e => {
    const filter = e.target.value;
    const { searchUserName } = this.state;
    let queryString = '';
    this.setState({ filter });
    if (filter !== 'all') queryString += `&enabled=${filter}`;
    if (searchUserName !== '') queryString += `&username=${searchUserName}`;
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetch',
      payload: { query: queryString },
    });
  };

  handleSearchByUserName = value => {
    const { filter } = this.state;
    let queryString = '';
    this.setState({ searchUserName: value });
    if (filter !== 'all') queryString += `&enabled=${filter}`;
    if (value !== '') queryString += `&username=${value}`;
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetch',
      payload: { query: queryString },
    });
  };

  render() {
    const { list, roles, loading } = this.props;
    const {
      form: { getFieldDecorator },
    } = this.props;
    const { visible, done, current = {}, filter } = this.state;

    const modalFooter = done
      ? { footer: null, onCancel: this.handleDone }
      : { okText: '??????', onOk: this.handleSubmit, onCancel: this.handleCancel };

    const extraContent = (
      <div className={styles.extraContent}>
        <RadioGroup defaultValue="all" onChange={this.handleSearchByFilter} value={filter}>
          <RadioButton value="all">??????</RadioButton>
          <RadioButton value="true">?????????</RadioButton>
          <RadioButton value="false">?????????</RadioButton>
        </RadioGroup>
        <Search
          className={styles.extraContentSearch}
          placeholder="??????????????????????????????"
          onSearch={this.handleSearchByUserName}
        />
      </div>
    );

    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      pageSize: 10,
      total: list.length,
    };

    const ListContent = ({ data: { enabled, createTime } }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <span>??????</span>
          <p />
          {enabled ? <Tag color="green">?????????</Tag> : <Tag color="red">?????????</Tag>}
        </div>
        <div className={styles.listContentItem}>
          <span>????????????</span>
          <p />
          {moment(createTime).format('lll')}
        </div>
      </div>
    );

    const getRolesNames = currentRoles => {
      if (currentRoles instanceof Array) {
        return currentRoles.map(role => role.id);
      }
      return [];
    };

    const getRolesOptions = allRoles => {
      const { Option } = Select;
      const children = [];
      if (Array.isArray(allRoles)) {
        allRoles.map(role => {
          return children.push(
            <Option key={role.id} value={role.id}>
              {role.label}
            </Option>
          );
        });
        return children;
      }
      return null;
    };

    const ItemRolesTags = ({ itemRoles }) =>
      itemRoles.map(role => {
        return (
          <Tag color="blue" key={role.id}>
            {role.name}
          </Tag>
        );
      });

    const getModalContent = () => {
      if (done) {
        message.success('??????????????????');
        this.handleDone();
      }
      return (
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('username', {
              rules: [
                { required: true, message: '??????????????????' },
                { min: 2, max: 20, message: '????????????2???20??????' },
              ],
              initialValue: current.username,
            })(<Input placeholder="?????????????????????2???20??????" />)}
          </FormItem>
          <FormItem label="??????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('coefficient', {
              rules: [{ required: true, message: '???????????????' }],
              initialValue: current.coefficient,
            })(<Input placeholder="0.1" />)}
          </FormItem>
          <FormItem label="??????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('num', {
              rules: [{ required: true, message: '???????????????' }],
              initialValue: current.num,
            })(<Input placeholder="001" />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('email', {
              rules: [
                { required: true, message: '?????????????????????' },
                {
                  pattern: new RegExp(
                    '^[a-z0-9]+([._\\\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$'
                  ),
                  message: '??????????????????????????????(?????????????????????)',
                },
              ],
              initialValue: current.email,
            })(<Input placeholder="name@domain.com" />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout}>
            {getFieldDecorator('enabled', {
              rules: [{ required: true, message: '????????????????????????' }],
              initialValue: current.enabled !== undefined ? current.enabled : true,
            })(<Switch defaultChecked={current.enabled !== undefined ? current.enabled : true} />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('roles', {
              rules: [{ required: true, message: '???????????????????????????' }],
              initialValue: getRolesNames(current.roles),
            })(
              <Select mode="multiple" style={{ width: '100%' }} placeholder="???????????????">
                {getRolesOptions(roles)}
              </Select>
            )}
          </FormItem>
        </Form>
      );
    };

    return (
      <PageHeaderWrapper>
        <div className={styles.standardList}>
          <Card
            className={styles.listCard}
            bordered={false}
            title="????????????"
            style={{ marginTop: 24 }}
            bodyStyle={{ padding: '0 32px 40px 32px' }}
            extra={extraContent}
          >
            <Button
              type="dashed"
              style={{ width: '100%', marginBottom: 8 }}
              icon="plus"
              onClick={this.showModal}
              ref={component => {
                /* eslint-disable */
                this.addBtn = findDOMNode(component);
                /* eslint-enable */
              }}
            >
              ???????????????
            </Button>
            <List
              size="default"
              rowKey="id"
              loading={loading}
              pagination={paginationProps}
              dataSource={list}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="??????????????????????????????123456???"
                      onConfirm={() => this.confirmResetPassword(item.id)}
                      okText="????????????"
                      cancelText="??????"
                    >
                      <a href="#">????????????</a>
                    </Popconfirm>,
                    <a
                      onClick={e => {
                        e.preventDefault();
                        this.showEditModal(item);
                      }}
                    >
                      ??????
                    </a>,
                    <Popconfirm
                      title="???????????????????????????"
                      onConfirm={() => this.confirmDelete(item.id)}
                      okText="??????"
                      cancelText="??????"
                    >
                      <a href="#">??????</a>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} shape="square" size="large" />}
                    title={
                      <a
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          this.showEditModal(item);
                        }}
                      >
                        {`${item.username}  /  ${item.email}`}
                      </a>
                    }
                    description={<ItemRolesTags itemRoles={item.roles} />}
                  />
                  <ListContent data={item} />
                </List.Item>
              )}
            />
          </Card>
        </div>
        <Modal
          title={done ? null : `${current.id ? '??????' : '??????'}??????`}
          className={styles.standardListForm}
          width={640}
          bodyStyle={done ? { padding: '72px 0' } : { padding: '28px 0 0' }}
          destroyOnClose
          visible={visible}
          {...modalFooter}
        >
          {getModalContent()}
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default UserList;
