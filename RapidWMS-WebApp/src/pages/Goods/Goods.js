import React, { PureComponent } from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'dva';
import {
  Button,
  Card,
  Form,
  Icon,
  Input,
  InputNumber,
  message,
  Modal,
  notification,
  Popconfirm,
  Select,
  Table,
  Tag,
  Alert,
} from 'antd';
import accounting from 'accounting';

import Highlighter from 'react-highlight-words';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import styles from './Goods.less';

const FormItem = Form.Item;
const { Search } = Input;
const { Option } = Select;

@connect(({ goods, customer, goodsType, loading }) => ({
  list: goods.list.content,
  total: goods.list.totalElements,
  customerList: customer.allList,
  goodsTypeList: goodsType.allList,
  loading: loading.models.goods && loading.models.customer && loading.models.goodsType,
}))
@Form.create()
class Goods extends PureComponent {
  state = {
    currentPage: 1,
    pageSize: 10,
    orderBy: null,
    search: null,
    goodsTypeFilter: null,
    goodsCustomerFilter: null,
    visible: false,
    done: false,
  };

  formLayout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 13 },
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const {
      search,
      pageSize,
      currentPage,
      orderBy,
      goodsTypeFilter,
      goodsCustomerFilter,
    } = this.state;
    this.handleQuery(
      dispatch,
      false,
      search,
      pageSize,
      currentPage,
      orderBy,
      goodsTypeFilter,
      goodsCustomerFilter
    );
    dispatch({
      type: 'customer/fetchMy',
    });
    dispatch({
      type: 'goodsType/fetchAll',
    });
  }

  handleCustomerFilters = () => {
    const { customerList } = this.props;
    const customerFilters = [];
    if (customerList) {
      customerList.map(customer => {
        return customerFilters.push({ text: customer.name, value: customer.id });
      });
    }
    return customerFilters;
  };

  handleGoodsTypeFilters = () => {
    const { goodsTypeList } = this.props;
    const goodsTypeFilters = [];
    if (goodsTypeList !== null && goodsTypeList !== undefined) {
      goodsTypeList.map(goodsType => {
        return goodsTypeFilters.push({ text: goodsType.name, value: goodsType.id });
      });
    }
    return goodsTypeFilters;
  };

  handleSearch = value => {
    this.setState({ search: value });
    const search = value === '' ? '' : value;
    const { dispatch } = this.props;
    const { pageSize, goodsTypeFilter, goodsCustomerFilter } = this.state;
    this.setState({
      currentPage: 1,
      orderBy: null,
    });
    this.handleQuery(
      dispatch,
      false,
      search,
      pageSize,
      1,
      null,
      goodsTypeFilter,
      goodsCustomerFilter
    );
  };

  handleQuery = (
    dispatch,
    exportExcel,
    search,
    pageSize,
    currentPage,
    orderBy,
    goodsTypeFilter,
    goodsCustomerFilter
  ) => {
    dispatch({
      type: 'goods/fetch',
      payload: {
        exportExcel,
        search,
        pageSize,
        currentPage,
        orderBy,
        goodsTypeFilter,
        goodsCustomerFilter,
      },
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
      dispatch({
        type: 'goods/submit',
        payload: { id, ...fieldsValue },
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            message.success(id === '' ? '???????????????' : '???????????????');
            const {
              search,
              pageSize,
              currentPage,
              orderBy,
              goodsTypeFilter,
              goodsCustomerFilter,
            } = this.state;
            this.handleQuery(
              dispatch,
              false,
              search,
              pageSize,
              currentPage,
              orderBy,
              goodsTypeFilter,
              goodsCustomerFilter
            );
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
      type: 'goods/submit',
      payload: { id },
      callback: response => {
        if (response.status === 400) {
          notification.error({
            message: '??????????????????',
            description: response.message,
          });
        } else {
          message.success('???????????????');
          const {
            search,
            pageSize,
            currentPage,
            orderBy,
            goodsTypeFilter,
            goodsCustomerFilter,
          } = this.state;
          this.handleQuery(
            dispatch,
            false,
            search,
            pageSize,
            currentPage,
            orderBy,
            goodsTypeFilter,
            goodsCustomerFilter
          );
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
    const {
      'goodsType.name': goodsTypeFilter = null,
      'customer.name': goodsCustomerFilter = null,
    } = filters;
    this.setState({
      currentPage,
      pageSize,
      orderBy,
      goodsTypeFilter,
      goodsCustomerFilter,
    });
    this.handleQuery(
      dispatch,
      false,
      search,
      pageSize,
      currentPage,
      orderBy,
      goodsTypeFilter,
      goodsCustomerFilter
    );
  };

  handleGoodsList = list => {
    if (!list) {
      return null;
    }
    return list.map(item => {
      return { ...item, customerName: item.customer ? item.customer.name : null };
    });
  };

  handleExportExcel = () => {
    const { dispatch } = this.props;
    const {
      search,
      pageSize,
      currentPage,
      orderBy,
      goodsTypeFilter,
      goodsCustomerFilter,
    } = this.state;
    this.handleQuery(
      dispatch,
      true,
      search,
      pageSize,
      currentPage,
      orderBy,
      goodsTypeFilter,
      goodsCustomerFilter
    );
  };

  render() {
    const { list, total, customerList, goodsTypeList, loading } = this.props;
    const {
      form: { getFieldDecorator },
    } = this.props;
    const { visible, done, currentItem = {} } = this.state;
    const { pageSize, currentPage, search } = this.state;

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
          className={styles.extraContentSearch}
          placeholder="????????????,??????"
          onSearch={this.handleSearch}
        />
        <Button
          style={{ marginLeft: 10 }}
          htmlType="button"
          type="primary"
          icon="export"
          onClick={this.handleExportExcel}
        >
          ??????Excel
        </Button>
      </div>
    );

    const getCustomersOptions = allCustomers => {
      const children = [];
      if (Array.isArray(allCustomers)) {
        allCustomers.forEach(customer => {
          children.push(
            <Option key={customer.id} value={customer.id}>
              {customer.name}
            </Option>
          );
        });
      }
      return children;
    };

    const getGoodsTypesOptions = allGoodsTypes => {
      const children = [];
      if (Array.isArray(allGoodsTypes)) {
        allGoodsTypes.forEach(goodsType => {
          children.push(
            <Option key={goodsType.id} value={goodsType.id}>
              {goodsType.name}
            </Option>
          );
        });
      }
      return children;
    };

    const getCurentGoodsType = item => {
      if (item !== undefined && item !== null && item.goodsType) {
        return item.goodsType.id;
      }
      return undefined;
    };

    const getCurentCustomer = item => {
      if (item !== undefined && item !== null && item.customer) {
        return item.customer.id;
      }
      return undefined;
    };

    const getModalContent = () => {
      if (done) {
        message.success('????????????');
        this.handleDone();
      }
      return (
        <Form onSubmit={this.handleSubmit}>
          <Alert
            style={{ width: 450, marginLeft: 100, marginBottom: 8 }}
            message="?????????????????????????????? ???????????????????????????????????????"
            type="info"
            showIcon
            closable
          />
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('name', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: currentItem.name,
            })(<Input placeholder="?????????????????????" />)}
          </FormItem>
          <FormItem label="??????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('sn', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: currentItem.sn,
            })(<Input placeholder="?????????????????????" />)}
          </FormItem>
          <FormItem
            label="????????????(?????????)"
            {...this.formLayout}
            extra="1???=12??????,2???=24??????,3???=36??????,4???=48??????"
            hasFeedback
          >
            {getFieldDecorator('monthsOfWarranty', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: currentItem.monthsOfWarranty,
            })(<InputNumber placeholder="????????????" />)}
          </FormItem>
          <FormItem
            label="??????"
            {...this.formLayout}
            extra="?????????????????????????????????24,36,48,100,200"
            hasFeedback
          >
            {getFieldDecorator('packCount', {
              rules: [{ required: true, message: '???????????????' }],
              initialValue: currentItem.packCount,
            })(<InputNumber placeholder="???????????????" />)}
          </FormItem>
          <FormItem label="??????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('price', {
              rules: [{ required: true, message: '???????????????' }],
              initialValue: currentItem.price,
            })(<InputNumber min={0} step={0.01} placeholder="???????????????" />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('returnPrice', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: currentItem.returnPrice,
            })(<InputNumber min={0} step={0.01} placeholder="?????????????????????" />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('unit', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: currentItem.unit,
            })(<Input placeholder="?????????????????????" />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('goodsType', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: getCurentGoodsType(currentItem),
            })(
              <Select
                showSearch
                filterOption={(input, option) =>
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                placeholder="?????????????????????"
                style={{ width: '100%' }}
              >
                {getGoodsTypesOptions(goodsTypeList)}
              </Select>
            )}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('customer', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: getCurentCustomer(currentItem),
            })(
              <Select
                showSearch
                filterOption={(input, option) =>
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                placeholder="?????????????????????"
                style={{ width: '100%' }}
              >
                {getCustomersOptions(customerList)}
              </Select>
            )}
          </FormItem>
        </Form>
      );
    };

    const columns = [
      {
        title: '#',
        width: '1%',
        key: 'index',
        render: (text, record, index) => {
          return `${index + 1 + (currentPage - 1) * pageSize}`;
        },
      },
      {
        title: '????????????',
        dataIndex: 'name',
        key: 'name',
        width: '15%',
        sorter: true,
        render: (text, record) => {
          return (
            <span>
              <a
                onClick={e => {
                  e.preventDefault();
                  this.showEditModal(record);
                }}
                style={{ marginRight: 3 }}
              >
                <Icon type="exclamation-circle" />
              </a>
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[search]}
                autoEscape
                textToHighlight={text.toString()}
              />
            </span>
          );
        },
      },
      {
        title: '??????',
        dataIndex: 'stockCount',
        key: 'stockCount',
        width: '3%',
        align: 'right',
        render: text => {
          if (text === 0) {
            return <Tag color="green">{text}</Tag>;
          }
          return <Tag color="red">{text}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'sn',
        key: 'sn',
        width: '8%',
        sorter: true,
        render: text => {
          return (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[search]}
              autoEscape
              textToHighlight={text.toString()}
            />
          );
        },
      },
      {
        title: '??????',
        dataIndex: 'goodsType.name',
        key: 'goodsType.name',
        width: '5%',
        align: 'center',
        sorter: true,
        filters: this.handleGoodsTypeFilters(),
      },
      {
        title: '??????',
        dataIndex: 'price',
        key: 'price',
        width: '5%',
        align: 'right',
        sorter: true,
        render: text => {
          if (text === 0) {
            return <Tag color="green">{accounting.formatMoney(text, '???')}</Tag>;
          }
          return <Tag color="red">{accounting.formatMoney(text, '???')}</Tag>;
        },
      },
      {
        title: '????????????',
        dataIndex: 'returnPrice',
        key: 'returnPrice',
        width: '5%',
        align: 'right',
        sorter: true,
        render: text => {
          if (text === 0) {
            return <Tag color="green">{accounting.formatMoney(text, '???')}</Tag>;
          }
          return <Tag color="red">{accounting.formatMoney(text, '???')}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'monthsOfWarranty',
        key: 'monthsOfWarranty',
        width: '5%',
        align: 'right',
        sorter: true,
        render: text => {
          if (text % 12 === 0) {
            return <Tag color="blue">{text / 12}???</Tag>;
          }
          if (text > 12) {
            return (
              <Tag color="blue">
                {Math.floor(text / 12)}???{text % 12}???
              </Tag>
            );
          }
          return <Tag color="orange">{text}???</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'packCount',
        key: 'packCount',
        width: '5%',
        align: 'right',
        sorter: true,
        render: text => {
          return <Tag color="#2db7f5">{text}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'unit',
        key: 'unit',
        width: '3%',
        align: 'center',
      },
      {
        title: '????????????',
        dataIndex: 'customer.name',
        key: 'customer.name',
        width: '12%',
        sorter: true,
        filters: this.handleCustomerFilters(),
      },
      {
        title: '??????',
        width: '8%',
        align: 'right',
        render: (text, row) => {
          return (
            <span className={styles.buttons}>
              <Button
                size="small"
                htmlType="button"
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
                <Button size="small" htmlType="button" href="#" type="danger">
                  ??????
                </Button>
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
            title="????????????"
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
              ???????????????
            </Button>
            <Table
              columns={columns}
              dataSource={this.handleGoodsList(list)}
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

export default Goods;
