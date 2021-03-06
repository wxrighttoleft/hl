import React, { PureComponent } from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'dva';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  notification,
  Popconfirm,
  Table,
  DatePicker,
} from 'antd';

import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import Highlighter from 'react-highlight-words';
import styles from '@/pages/Common/Common.less';

const FormItem = Form.Item;
const { Search } = Input;
const basePath = 'carCost';

@connect(({ carCost, loading }) => ({
  list: carCost.list.content,
  total: carCost.list.totalElements,
  loading: loading.models.carCost,
}))
@Form.create()
class CarCost extends PureComponent {
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

  componentDidMount() {
    const { dispatch } = this.props;
    const { search, pageSize, currentPage, orderBy } = this.state;
    this.handleQuery(dispatch, search, pageSize, currentPage, orderBy);
  }

  handleSearchChange = e => {
    this.setState({
      search: e.target.value,
    });
  };

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
      type: `${basePath}/fetch`,
      payload: { search, pageSize, currentPage, orderBy },
    });
  };

  showModal = () => {
    this.setState({
      visible: true,
      currentItem: undefined,
    });
  };

  showEditModal = item => {
    this.setState({
      visible: true,
      currentItem: item,
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
    const { currentItem } = this.state;
    const id = currentItem ? currentItem.id : '';

    setTimeout(() => this.addBtn.blur(), 0);
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleDone();
      console.log(fieldsValue);
      dispatch({
        type: `${basePath}/submit`,
        payload: { id, ...fieldsValue },
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            message.success(id === '' ? '???????????????' : '???????????????');
            const { search, pageSize, currentPage, orderBy } = this.state;
            this.handleQuery(dispatch, search, pageSize, currentPage, orderBy);
          }
        },
      });
    });
  };

  confirmDelete = item => {
    const { dispatch } = this.props;
    const { id } = item;
    this.setState({
      done: false,
      visible: false,
    });
    dispatch({
      type: `${basePath}/submit`,
      payload: { id },
      callback: response => {
        if (response.status === 400) {
          notification.error({
            message: '??????????????????',
            description: response.message,
          });
        } else {
          message.success('???????????????');
          const { search, pageSize, currentPage, orderBy } = this.state;
          this.handleQuery(dispatch, search, pageSize, currentPage, orderBy);
        }
      },
    });
  };

  handleTotal = (total, range) => {
    return `??????${total}?????????????????????${range[0]}-${range[1]}???`;
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
    const { search } = this.state;
    const { list, total, loading } = this.props;
    const {
      form: { getFieldDecorator },
    } = this.props;
    const { visible, done, currentItem = {} } = this.state;
    const { pageSize, currentPage } = this.state;

    const modalFooter = done
      ? { footer: null, onCancel: this.handleDone }
      : { okText: '??????', onOk: this.handleSubmit, onCancel: this.handleCancel };

    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: this.handleTotal,
      current: currentPage,
      total,
      pageSize,
      position: 'both',
    };

    const searchContent = (
      <div className={styles.extraContent}>
        <Search
          value={search}
          className={styles.extraContentSearch}
          placeholder="????????????????????????????????????????????????"
          onChange={this.handleSearchChange}
          onSearch={this.handleSearchByName}
        />
      </div>
    );

    const getModalContent = () => {
      if (done) {
        message.success('????????????');
        this.handleDone();
      }
      return (
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="???????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('driverName', {
              rules: [{ required: true, message: '????????????????????????' }],
              initialValue: currentItem.driverName,
            })(<Input placeholder="????????????????????????" />)}
          </FormItem>
          <FormItem label="?????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('carNum', {
              rules: [{ required: true, message: '??????????????????' }],
              initialValue: currentItem.carNum,
            })(<Input placeholder="??????????????????" />)}
          </FormItem>
          <FormItem label="??????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('dateTime', {
              rules: [{ required: true, message: '???????????????' }],
              initialValue: currentItem.dateTime ? moment(new Date(currentItem.dateTime)) : null,
            })(<DatePicker placeholder="???????????????" />)}
          </FormItem>
          <FormItem label="?????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('parkingCharge', {
              rules: [{ required: true, message: '??????????????????' }],
              initialValue: currentItem.parkingCharge,
            })(<Input placeholder="??????????????????" />)}
          </FormItem>
          <FormItem label="?????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('tollCharge', {
              rules: [{ required: true, message: '??????????????????' }],
              initialValue: currentItem.tollCharge,
            })(<Input placeholder="??????????????????" />)}
          </FormItem>
          <FormItem label="?????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('mile', {
              rules: [{ required: true, message: '??????????????????' }],
              initialValue: currentItem.mile,
            })(<Input placeholder="??????????????????" />)}
          </FormItem>
          <FormItem label="??????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('oilCost', {
              rules: [{ required: true, message: '???????????????' }],
              initialValue: currentItem.oilCost,
            })(<Input placeholder="???????????????" />)}
          </FormItem>
        </Form>
      );
    };

    const columns = [
      {
        title: '#',
        width: '3%',
        key: 'index',
        render: (text, record, index) => `${index + 1}`,
      },
      {
        title: '???????????????',
        dataIndex: 'driverName',
        key: 'driverName',
        width: '15%',
        sorter: true,
        render: text => {
          if (text !== null && text !== undefined) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[search]}
                autoEscape
                textToHighlight={text.toString()}
              />
            );
          }
          return '';
        },
      },
      {
        title: '?????????',
        dataIndex: 'carNum',
        key: 'carNum',
        width: '10%',
        render: text => {
          if (text !== null && text !== undefined) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[search]}
                autoEscape
                textToHighlight={text.toString()}
              />
            );
          }
          return '';
        },
      },
      {
        title: '??????',
        dataIndex: 'dateTime',
        key: 'dateTime',
        width: '10%',
        render: text => {
          return moment(text).format('YYYY/MM/DD');
        },
      },
      {
        title: '?????????',
        dataIndex: 'parkingCharge',
        key: 'parkingCharge',
        width: '10%',
      },
      {
        title: '?????????',
        dataIndex: 'tollCharge',
        key: 'tollCharge',
        width: '10%',
      },
      {
        title: '?????????',
        dataIndex: 'mile',
        key: 'mile',
        width: '10%',
      },
      {
        title: '??????',
        dataIndex: 'oilCost',
        key: 'oilCost',
        width: '10%',
      },
      {
        title: '??????',
        width: '18%',
        render: (text, row) => {
          return (
            <span className={styles.buttons}>
              <Button
                onClick={e => {
                  e.preventDefault();
                  this.showEditModal(row);
                }}
              >
                ??????
              </Button>
              <Popconfirm
                title="??????????????????"
                onConfirm={() => this.confirmDelete(row)}
                okText="??????"
                cancelText="??????"
              >
                <Button type="danger">??????</Button>
              </Popconfirm>
            </span>
          );
        },
      },
    ];

    return (
      <PageHeaderWrapper>
        <div className={styles.standardList}>
          <Card
            bordered={false}
            title="??????????????????"
            style={{ marginTop: 24 }}
            bodyStyle={{ padding: '0 32px 40px 32px' }}
            extra={searchContent}
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
              ??????
            </Button>
            <Table
              columns={columns}
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
          title={done ? null : `${currentItem.id ? '??????' : '??????'}`}
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

export default CarCost;
