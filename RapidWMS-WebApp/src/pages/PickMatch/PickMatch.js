import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Card, Form, Input, message, Modal, notification, Table } from 'antd';

import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import styles from './PickMatch.less';

const FormItem = Form.Item;

@connect(({ pickMatch, loading }) => ({
  list: pickMatch.list.content,
  total: pickMatch.list.totalElements,
  loading: loading.models.pickMatch,
}))
@Form.create()
class PickMatch extends PureComponent {
  state = {
    currentPage: 1,
    pageSize: 10,
    orderBy: null,
    search: null,
    visible: false,
    done: false,
  };

  formLayout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 13 },
  };

  columns = [
    {
      title: '#',
      width: '3%',
      key: 'index',
      render: (text, record, index) => `${index + 1}`,
    },
    {
      title: '计件单价',
      dataIndex: 'piece',
      key: 'piece',
      width: '15%',
    },
    {
      title: '金额系数',
      dataIndex: 'money',
      key: 'money',
      width: '10%',
    },
    {
      title: '拣配系数',
      dataIndex: 'pickMatch',
      key: 'pickMatch',
      width: '10%',
    },
    {
      title: '复核系数',
      dataIndex: 'review',
      key: 'review',
      width: '10%',
    },
    {
      title: '操作',
      width: '10%',
      render: (text, row) => {
        return (
          <span className={styles.buttons}>
            <Button
              onClick={e => {
                e.preventDefault();
                this.showEditModal(row);
              }}
            >
              编辑
            </Button>
          </span>
        );
      },
    },
  ];

  componentDidMount() {
    const { dispatch } = this.props;
    const { search, pageSize, currentPage, orderBy } = this.state;
    this.handleQuery(dispatch, search, pageSize, currentPage, orderBy);
  }

  handleSearchByName = value => {
    this.setState({ search: value });
    const search = value === '' ? '' : value;
    const { dispatch } = this.props;
    const { pageSize } = this.state;
    this.setState({
      currentPage: 1,
      orderBy: null,
    });
    this.handleQuery(dispatch, search, pageSize, 1, null);
  };

  handleQuery = (dispatch, search, pageSize, currentPage, orderBy) => {
    dispatch({
      type: 'pickMatch/fetch',
      payload: { search, pageSize, currentPage, orderBy },
    });
  };

  showEditModal = item => {
    this.setState({
      visible: true,
      currentItem: item,
    });
  };

  handleDone = () => {
    this.setState({
      done: false,
      visible: false,
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;
    const { currentItem } = this.state;
    const id = currentItem ? currentItem.id : '';

    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleDone();
      dispatch({
        type: 'pickMatch/submit',
        payload: { id, ...fieldsValue },
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '操作发生错误',
              description: response.message,
            });
          } else {
            message.success(id === '' ? '创建成功！' : '修改成功！');
            const { search, pageSize, currentPage, orderBy } = this.state;
            this.handleQuery(dispatch, search, pageSize, currentPage, orderBy);
          }
        },
      });
    });
  };

  handleTotal = (total, range) => {
    return `总共${total}条数据，当前为${range[0]}-${range[1]}条`;
  };

  handleTableChange = (pagination, filters, sorter) => {
    const { dispatch } = this.props;
    const { search } = this.state;
    const { current: currentPage, pageSize } = pagination;
    const { field, order } = sorter;
    const orderBy = field !== undefined ? `${field},${order}` : null;
    this.setState({
      currentPage,
      pageSize,
      orderBy,
    });
    this.handleQuery(dispatch, search, pageSize, currentPage, orderBy);
  };

  render() {
    const { list, total, loading } = this.props;
    const {
      form: { getFieldDecorator },
    } = this.props;
    const { visible, done, currentItem = {} } = this.state;
    const { pageSize, currentPage } = this.state;

    const modalFooter = done
      ? { footer: null, onCancel: this.handleDone }
      : { okText: '保存', onOk: this.handleSubmit, onCancel: this.handleCancel };

    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: this.handleTotal,
      current: currentPage,
      total,
      pageSize,
      position: 'both',
    };

    const getModalContent = () => {
      if (done) {
        message.success('保存成功');
        this.handleDone();
      }
      return (
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="计件单价" {...this.formLayout} hasFeedback>
            {getFieldDecorator('piece', {
              rules: [{ required: true, message: '请输入计件系数' }],
              initialValue: currentItem.piece,
            })(<Input placeholder="请输入计件系数" />)}
          </FormItem>
          <FormItem label="金额系数" {...this.formLayout} hasFeedback>
            {getFieldDecorator('money', {
              rules: [{ required: true, message: '请输入金额系数' }],
              initialValue: currentItem.money,
            })(<Input placeholder="请输入金额系数" />)}
          </FormItem>
          <FormItem label="拣配系数" {...this.formLayout} hasFeedback>
            {getFieldDecorator('pickMatch', {
              rules: [{ required: true, message: '请输入拣配系数' }],
              initialValue: currentItem.pickMatch,
            })(<Input placeholder="请输入拣配系数" />)}
          </FormItem>
          <FormItem label="复核系数" {...this.formLayout} hasFeedback>
            {getFieldDecorator('review', {
              rules: [{ required: true, message: '请输入复核系数' }],
              initialValue: currentItem.review,
            })(<Input placeholder="请输入复核系数" />)}
          </FormItem>
        </Form>
      );
    };

    return (
      <PageHeaderWrapper>
        <div className={styles.standardList}>
          <Card
            bordered={false}
            title="系数管理"
            style={{ marginTop: 24 }}
            bodyStyle={{ padding: '0 32px 40px 32px' }}
          >
            <Table
              columns={this.columns}
              dataSource={list}
              rowKey="id"
              loading={loading}
              pagination={paginationProps}
              onChange={this.handleTableChange}
              size="small"
            />
          </Card>
        </div>
        <Modal
          title={done ? null : `${currentItem.id ? '编辑' : '添加'}`}
          className={styles.standardListForm}
          width={640}
          bodyStyle={done ? { padding: '72px 0' } : { padding: '28px 0 0' }}
          destroyOnClose
          loading={loading}
          visible={visible}
          {...modalFooter}
        >
          {getModalContent()}
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default PickMatch;
