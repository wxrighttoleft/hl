import React, { PureComponent } from 'react';
import { findDOMNode } from 'react-dom';
import moment from 'moment';
import { connect } from 'dva';
import {
  List,
  Card,
  Input,
  Button,
  Modal,
  Form,
  message,
  Popconfirm,
  notification,
  Tree,
} from 'antd';

import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import styles from './Role.less';

const FormItem = Form.Item;
const { Search } = Input;
const { TreeNode } = Tree;

@connect(({ role, loading }) => ({
  list: role.list,
  permissions: role.permissions,
  menus: role.menus,
  loading: loading.models.role,
}))
@Form.create()
class RoleList extends PureComponent {
  state = {
    visible: false,
    done: false,
    visiblePermission: false,
    visibleMenu: false,
    selectedPermissionKeys: [],
    selectedMenuKeys: [],
  };

  formLayout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 13 },
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'role/fetch',
    });
    dispatch({
      type: 'role/fetchPermissionTree',
    });
    dispatch({
      type: 'role/fetchMenuTree',
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
        type: 'role/submit',
        payload: { id, ...fieldsValue },
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            message.success(id === '' ? '?????????????????????' : '?????????????????????');
            dispatch({
              type: 'role/fetch',
            });
          }
        },
      });
    });
  };

  confirmDelete = id => {
    const { dispatch } = this.props;
    dispatch({
      type: 'role/submit',
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
            type: 'role/fetch',
          });
        }
      },
    });
  };

  handleSearchByRoleName = value => {
    const { dispatch } = this.props;
    dispatch({
      type: 'role/fetch',
      payload: { query: `&name=${value}` },
    });
  };

  handlePermissionEdit = item => {
    this.setState({
      visiblePermission: true,
      selectedPermissionKeys: item.permissions.map(p => `${p.id}`),
      current: item,
    });
  };

  handlePermissionSubmit = () => {
    const { selectedPermissionKeys, current } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'role/updatePermission',
      payload: {
        id: current.id,
        permissions: selectedPermissionKeys.map(key => {
          return { id: key };
        }),
      },
      callback: () => {
        message.success('?????????????????????');
        dispatch({
          type: 'role/fetch',
        });
      },
    });
    this.setState({
      current: undefined,
      visiblePermission: false,
    });
  };

  handlePermissionCancel = () => {
    setTimeout(() => this.addBtn.blur(), 0);
    this.setState({
      visiblePermission: false,
    });
  };

  handleCheckPermission = keys => {
    this.setState({
      selectedPermissionKeys: keys,
    });
  };

  handleMenuEdit = item => {
    this.setState({
      visibleMenu: true,
      selectedMenuKeys: item.menus.map(p => `${p.id}`),
      current: item,
    });
  };

  handleMenuSubmit = () => {
    const { selectedMenuKeys, current } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'role/updateMenu',
      payload: {
        id: current.id,
        menus: selectedMenuKeys.map(key => {
          return { id: key };
        }),
      },
      callback: () => {
        message.success('?????????????????????');
        dispatch({
          type: 'role/fetch',
        });
      },
    });
    this.setState({
      current: undefined,
      visibleMenu: false,
    });
  };

  handleMenuCancel = () => {
    setTimeout(() => this.addBtn.blur(), 0);
    this.setState({
      visibleMenu: false,
    });
  };

  handleCheckMenu = keys => {
    // ??????????????? checkStrictly ??????????????????????????????keys?????????????????????
    this.setState({
      selectedMenuKeys: keys.checked,
    });
  };

  renderTreeNodes = data => {
    let result;
    if (Array.isArray(data)) {
      result = data.map(item => {
        if (item.children) {
          return (
            <TreeNode title={item.label} key={item.id} dataRef={item}>
              {this.renderTreeNodes(item.children)}
            </TreeNode>
          );
        }
        return <TreeNode title={item.label} key={item.id} dataRef={item} />;
      });
    }
    return result;
  };

  render() {
    const { list, permissions, menus, loading } = this.props;
    const {
      form: { getFieldDecorator },
    } = this.props;
    const { visible, done, current = {} } = this.state;
    const { visiblePermission, selectedPermissionKeys } = this.state;
    const { visibleMenu, selectedMenuKeys } = this.state;

    const modalFooter = done
      ? { footer: null, onCancel: this.handleDone }
      : { okText: '??????', onOk: this.handleSubmit, onCancel: this.handleCancel };

    const modalPermissionFooter = {
      okText: '??????',
      onOk: this.handlePermissionSubmit,
      onCancel: this.handlePermissionCancel,
    };

    const modalMenuFooter = {
      okText: '??????',
      onOk: this.handleMenuSubmit,
      onCancel: this.handleMenuCancel,
    };

    const extraContent = (
      <div className={styles.extraContent}>
        <Search
          className={styles.extraContentSearch}
          placeholder="??????????????????????????????"
          onSearch={this.handleSearchByRoleName}
        />
      </div>
    );

    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      pageSize: 10,
      total: list.length,
    };

    const ListContent = ({ data: createTime }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <span>????????????</span>
          <p />
          {moment(createTime).format('lll')}
        </div>
      </div>
    );

    const getModalContent = () => {
      if (done) {
        message.success('??????????????????');
        this.handleDone();
      }
      return (
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('name', {
              rules: [{ required: true, message: '??????????????????' }],
              initialValue: current.name,
            })(<Input placeholder="??????????????????" />)}
          </FormItem>
          <FormItem label="??????" {...this.formLayout}>
            {getFieldDecorator('remark', {
              initialValue: current.remark,
            })(<Input placeholder="????????????" />)}
          </FormItem>
        </Form>
      );
    };

    const getModalCollectionContent = (collections, selectedKeys, checkMethod, strict) => {
      return (
        <Form>
          <FormItem {...this.formLayout}>
            <Tree
              className={styles.center}
              checkable
              checkedKeys={selectedKeys}
              onCheck={checkMethod}
              checkStrictly={strict}
              blockNode
            >
              {this.renderTreeNodes(collections)}
            </Tree>
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
              size="small"
              rowKey="id"
              loading={loading}
              pagination={paginationProps}
              dataSource={list}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button
                      htmlType="button"
                      type="dashed"
                      onClick={e => {
                        e.preventDefault();
                        this.handlePermissionEdit(item);
                      }}
                    >
                      ????????????
                    </Button>,
                    <Button
                      htmlType="button"
                      type="dashed"
                      onClick={e => {
                        e.preventDefault();
                        this.handleMenuEdit(item);
                      }}
                    >
                      ????????????
                    </Button>,
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
                    title={
                      <a
                        onClick={e => {
                          e.preventDefault();
                          this.showEditModal(item);
                        }}
                      >
                        {item.name}
                      </a>
                    }
                    description={item.remark}
                  />
                  <ListContent data={item.createTime} />
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
        <Modal
          title={`?????? ${current.name} ??????`}
          className={styles.standardListForm}
          width={640}
          bodyStyle={{ padding: '28px 0 0' }}
          destroyOnClose
          visible={visiblePermission}
          {...modalPermissionFooter}
        >
          {getModalCollectionContent(
            permissions,
            selectedPermissionKeys,
            this.handleCheckPermission,
            false
          )}
        </Modal>
        <Modal
          title={`?????? ${current.name} ??????`}
          className={styles.standardListForm}
          width={640}
          bodyStyle={{ padding: '28px 0 0' }}
          destroyOnClose
          visible={visibleMenu}
          {...modalMenuFooter}
        >
          {getModalCollectionContent(menus, selectedMenuKeys, this.handleCheckMenu, true)}
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default RoleList;
