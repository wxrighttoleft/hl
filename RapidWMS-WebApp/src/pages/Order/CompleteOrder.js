import React, { Fragment, PureComponent } from 'react';
import { Document, Page } from 'react-pdf';
import { connect } from 'dva';
import {
  Alert,
  BackTop,
  Button,
  Card,
  DatePicker,
  Form,
  Icon,
  Input,
  message,
  Modal,
  notification,
  Popover,
  Table,
  Tag,
  InputNumber,
  Radio,
} from 'antd';

import Highlighter from 'react-highlight-words';
import moment from 'moment';
import router from 'umi/router';
import accounting from 'accounting';
import FormItem from 'antd/es/form/FormItem';
import print from 'print-js';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './Order.less';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const initialSortState = {
  sortClientName: null,
  sortClientOrderSn: null,
  sortClientOrderSn2: null,
  sortTotalPrice: null,
  sortCompletePrice: null,
  sortUpdateTime: null,
  sortFlowSn: null,
  sortAutoIncreaseSn: null,
};

const initialModalState = {
  singleModalVisible: false,
  completeModalVisible: false,
  updateCompleteModalVisible: false,
  printModalVisible: false,
  done: false,
};

const initialState = {
  currentPage: 1,
  pageSize: 10,
  orderBy: null,
  search: null,
  isPrintedFilter: null,
  orderStatusFilter: null,
  isSatisfiedFilter: null,
  customerFilter: null,
  packTypeFilter: null,
  receiveTypeFilter: null,
  startDate: null,
  endDate: null,
  selectedRowKeys: [],
  selectedRows: [],
  loadingFetchStockAndReturnStock: false,
  numPages: 0,
  ...initialSortState,
  ...initialModalState,
};

@connect(({ order, customer, loading }) => ({
  list: order.list.content,
  pdf: order.pdf,
  total: order.list.totalElements,
  customerList: customer.allList,
  loading: loading.models.order && loading.models.customer,
}))
@Form.create()
class Order extends PureComponent {
  state = initialState;

  formLayout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 13 },
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const {
      location: {
        query: { queryParams },
      },
    } = this.props;

    const {
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter,
    } = this.state;

    if (queryParams !== undefined && queryParams !== null) {
      this.setQueryParamsAndQuery(queryParams);
    } else {
      this.handleQuery(
        dispatch,
        false,
        search,
        startDate,
        endDate,
        pageSize,
        currentPage,
        orderBy,
        isPrintedFilter,
        isSatisfiedFilter,
        orderStatusFilter,
        customerFilter,
        packTypeFilter,
        receiveTypeFilter
      );
    }
    dispatch({
      type: 'customer/fetchMy',
    });
  }

  reloadPage = () => {
    this.cleanSelectedKeys();
    const { dispatch } = this.props;
    const {
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter,
    } = this.state;
    this.handleQuery(
      dispatch,
      false,
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter
    );
  };

  getQueryParams = () => {
    const {
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter,
    } = this.state;
    return {
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter,
      viewFromComplete: true,
    };
  };

  setQueryParamsAndQuery = params => {
    const {
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter,
    } = params;

    let sortOrders;
    if (orderBy !== undefined && orderBy !== null) {
      const orderByArray = orderBy.split(',');
      sortOrders = this.getSortOrders(orderByArray[0], orderByArray[1]);
    }

    this.setState(
      {
        search,
        startDate,
        endDate,
        pageSize,
        currentPage,
        orderBy,
        customerFilter,
        packTypeFilter,
        receiveTypeFilter,
        ...sortOrders,
      },
      () => {
        this.reloadPage();
      }
    );
  };

  handleResetSearch = () => {
    this.setState(initialState, () => {
      const { dispatch } = this.props;
      const { pageSize, currentPage } = this.state;
      this.handleQuery(
        dispatch,
        false,
        null,
        null,
        null,
        pageSize,
        currentPage,
        null,
        null,
        null,
        null,
        null
      );
    });
    router.push('/order/completeOrder');
  };

  handleCustomerFilters = () => {
    const { customerList } = this.props;
    const customerFilters = [];
    if (customerList && customerList !== undefined) {
      customerList.map(customer => {
        return customerFilters.push({ text: customer.name, value: customer.id });
      });
    }
    return customerFilters;
  };

  handlePackTypeFilters = () => {
    const packTypeFilters = [];
    packTypeFilters.push({ text: '????????????', value: '0' });
    packTypeFilters.push({ text: '???????????? ', value: '1' });
    packTypeFilters.push({ text: '???????????? ', value: '2' });
    return packTypeFilters;
  };

  handleSearchChange = e => {
    this.setState({
      search: e.target.value,
    });
  };

  handleSearch = value => {
    this.setState({ search: value });
    const search = value === '' ? '' : value;
    const { dispatch } = this.props;
    const {
      startDate,
      endDate,
      pageSize,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter,
    } = this.state;
    this.setState({
      currentPage: 1,
      orderBy: null,
    });
    this.cleanSelectedKeys();
    this.handleQuery(
      dispatch,
      false,
      search,
      startDate,
      endDate,
      pageSize,
      1,
      null,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter
    );
  };

  handleDateRangeChange = date => {
    const startDate = date[0];
    const endDate = date[1];
    this.setState({
      startDate,
      endDate,
    });
    const { dispatch } = this.props;
    const {
      search,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter,
    } = this.state;
    this.cleanSelectedKeys();
    this.handleQuery(
      dispatch,
      false,
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter
    );
  };

  handleQuery = (
    dispatch,
    exportExcel,
    search,
    startDate,
    endDate,
    pageSize,
    currentPage,
    orderBy,
    customerFilter,
    packTypeFilter,
    receiveTypeFilter
  ) => {
    let startDateString = null;
    let endDateString = null;
    if (
      startDate !== null &&
      endDate !== null &&
      startDate !== undefined &&
      endDate !== undefined
    ) {
      startDateString = startDate.format('YYYY-MM-DD');
      endDateString = endDate.format('YYYY-MM-DD');
    }
    dispatch({
      type: 'order/fetchComplete',
      payload: {
        exportExcel,
        search,
        startDate: startDateString,
        endDate: endDateString,
        pageSize,
        currentPage,
        orderBy,
        customerFilter,
        packTypeFilter,
        receiveTypeFilter,
      },
    });
  };

  handleTotal = (total, range) => {
    return `??????${total}?????????????????????${range[0]}-${range[1]}???`;
  };

  handleSelectRows = (newSelectedRowKeys, newSelectedRows) => {
    this.setState({
      selectedRowKeys: newSelectedRowKeys,
      selectedRows: newSelectedRows,
    });
  };

  cleanSelectedKeys = () => {
    this.setState({
      selectedRowKeys: [],
      selectedRows: [],
    });
  };

  getSortOrders = (field, order) => {
    let sortOrders;
    switch (field) {
      case 'clientName':
        sortOrders = { ...initialSortState, sortClientName: order };
        break;
      case 'clientOrderSn':
        sortOrders = { ...initialSortState, sortClientOrderSn: order };
        break;
      case 'clientOrderSn2':
        sortOrders = { ...initialSortState, sortClientOrderSn2: order };
        break;
      case 'updateTime':
        sortOrders = { ...initialSortState, sortUpdateTime: order };
        break;
      case 'totalPrice':
        sortOrders = { ...initialSortState, sortTotalPrice: order };
        break;
      case 'completePrice':
        sortOrders = { ...initialSortState, sortCompletePrice: order };
        break;
      case 'flowSn':
        sortOrders = { ...initialSortState, sortFlowSn: order };
        break;
      case 'autoIncreaseSn':
        sortOrders = { ...initialSortState, sortAutoIncreaseSn: order };
        break;
      default:
        sortOrders = initialSortState;
    }
    return sortOrders;
  };

  handleTableChange = (pagination, filters, sorter) => {
    const { dispatch } = this.props;
    const { search, startDate, endDate } = this.state;
    const { current: currentPage, pageSize } = pagination;
    const { field, order } = sorter;
    const {
      'owner.name': customerFilter = null,
      'pack.packType': packTypeFilter = null,
      receiveType: receiveTypeFilter = null,
    } = filters;
    const orderBy = field !== undefined ? `${field},${order}` : null;

    const sortOrders = this.getSortOrders(field, order);

    this.cleanSelectedKeys();
    this.setState({
      currentPage,
      pageSize,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter,
      ...sortOrders,
    });
    this.handleQuery(
      dispatch,
      false,
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter
    );
  };

  showUpdateCompleteModal = () => {
    this.setState({
      updateCompleteModalVisible: true,
    });
  };

  handleUpdateCompleteDone = () => {
    this.setState({
      done: false,
      updateCompleteModalVisible: false,
    });
  };

  handleUpdateCompleteCancel = () => {
    this.setState({
      updateCompleteModalVisible: false,
    });
  };

  handleUpdateCompleteSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields(
      ['id', 'updateCompletePrice', 'receiveType', 'updateCompleteDescription'],
      (err, fieldsValue) => {
        if (err) {
          return;
        }
        this.handleUpdateCompleteDone();
        dispatch({
          type: 'order/updateComplete',
          payload: fieldsValue,
          callback: response => {
            if (response.status === 400) {
              notification.error({
                message: '??????????????????',
                description: response.message,
              });
            } else {
              message.success('???????????????????????????');
              this.reloadPage();
            }
          },
        });
      }
    );
  };

  showPrintModal = () => {
    this.setState({
      printModalVisible: true,
    });
  };

  handlePrintDone = () => {
    this.setState({
      done: false,
      printModalVisible: false,
    });
  };

  handlePrintCancel = () => {
    this.setState({
      printModalVisible: false,
    });
    this.reloadPage();
  };

  handlePrintSubmit = () => {
    const { pdf } = this.props;
    print(pdf);
  };

  handlePrint = () => {
    const { dispatch } = this.props;
    const { selectedRowKeys } = this.state;
    dispatch({
      type: 'order/printByIds',
      payload: selectedRowKeys,
      callback: response => {
        if (response.status === 400) {
          notification.error({
            message: '??????????????????',
            description: response.message,
          });
        }
      },
    });
    this.showPrintModal();
  };

  viewOrder = item => {
    router.push({
      pathname: `/order/viewOrder/${item.id}`,
      query: {
        queryParams: this.getQueryParams(),
      },
    });
  };

  handleExportExcel = () => {
    const { dispatch } = this.props;
    const {
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter,
    } = this.state;
    this.handleQuery(
      dispatch,
      true,
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      packTypeFilter,
      receiveTypeFilter
    );
  };

  handleReceiveTypeFilters = () => {
    const receiveTypeFilter = [];
    receiveTypeFilter.push({ text: '????????????', value: '0' });
    receiveTypeFilter.push({ text: '???????????? ', value: '1' });
    receiveTypeFilter.push({ text: '???????????? ', value: '2' });
    return receiveTypeFilter;
  };

  render() {
    const { list, total, loading } = this.props;
    const { pageSize, currentPage } = this.state;
    const { search, startDate, endDate } = this.state;
    const { customerFilter, packTypeFilter, receiveTypeFilter } = this.state;
    const { selectedRowKeys = [], selectedRows = [] } = this.state;
    const {
      sortClientName,
      sortClientOrderSn,
      sortClientOrderSn2,
      sortTotalPrice,
      sortCompletePrice,
      sortUpdateTime,
      sortAutoIncreaseSn,
    } = this.state;

    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: this.handleTotal,
      current: currentPage,
      total,
      pageSize,
      position: 'both',
    };

    const rowSelectionProps = {
      columnWidth: '1%',
      onChange: this.handleSelectRows,
      selectedRowKeys,
      selectedRows,
    };

    const { done } = this.state;
    const {
      form: { getFieldDecorator },
    } = this.props;

    const searchContent = (
      <div className={styles.extraContent}>
        <Search
          value={search}
          className={styles.extraContentSearch}
          placeholder="?????????, ????????????????????????"
          onChange={this.handleSearchChange}
          onSearch={this.handleSearch}
        />
        <RangePicker
          style={{ marginLeft: 10, marginRight: 10 }}
          onChange={this.handleDateRangeChange}
          value={[startDate, endDate]}
        />
        <Button htmlType="button" type="primary" icon="export" onClick={this.handleExportExcel}>
          ??????Excel
        </Button>
      </div>
    );

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
        dataIndex: 'createTime',
        key: 'createTime',
        width: '1%',
        sorter: true,
        sortOrder: sortUpdateTime,
        render: text => {
          return <Tag>{moment(text).format('YYYY/MM/DD')}</Tag>;
        },
      },
      {
        title: '????????????',
        dataIndex: 'signTime',
        key: 'signTime',
        width: '1%',
        sorter: true,
        sortOrder: sortUpdateTime,
        render: text => {
          return <Tag>{moment(text).format('YYYY/MM/DD')}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'owner.shortNameCn',
        key: 'owner.name',
        width: '2%',
        filters: this.handleCustomerFilters(),
        filteredValue: customerFilter,
      },
      {
        title: '????????????',
        dataIndex: 'printTitle',
        key: 'printTitle',
        width: '15%',
        render: text => {
          if (text) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[search]}
                autoEscape
                textToHighlight={text === undefined ? '' : text.toString()}
              />
            );
          }
          return '';
        },
      },
      {
        title: '??????',
        dataIndex: 'pack.packType',
        key: 'pack.packType',
        width: '1%',
        align: 'center',
        filters: this.handlePackTypeFilters(),
        filteredValue: packTypeFilter,
        render: text => {
          let result;
          let color;
          switch (text) {
            case 'SENDING':
              result = '????????????';
              color = '#DC143C';
              break;
            case 'TRANSFER':
              result = '????????????';
              color = '#191970';
              break;
            case 'SELF_PICKUP':
              result = '????????????';
              color = '#2E8B57';
              break;
            default:
              result = '??????';
              color = '#696969';
              break;
          }
          return <Tag color={color}>{result}</Tag>;
        },
      },
      {
        title: '????????????',
        dataIndex: 'clientName',
        key: 'clientName',
        width: '20%',
        align: 'left',
        sorter: true,
        sortOrder: sortClientName,
        render: (text, record) => {
          const tooltip = (
            <div>
              <p>
                <b>????????????</b>: {record.clientName}
              </p>
              <p>
                <b>????????????</b>: {record.clientAddress}
              </p>
              <p>
                <b>????????????</b>: {record.clientStore}
              </p>
            </div>
          );
          return (
            <span>
              <Popover content={tooltip} title={text}>
                <a style={{ marginRight: 3 }}>
                  <Icon type="exclamation-circle" />
                </a>
              </Popover>
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[search]}
                autoEscape
                textToHighlight={text !== null && text !== undefined ? text.toString() : ''}
              />
            </span>
          );
        },
      },
      {
        title: '???????????????',
        dataIndex: 'clientOrderSn',
        key: 'clientOrderSn',
        width: '10%',
        sorter: true,
        sortOrder: sortClientOrderSn,
        render: text => {
          if (text) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[search]}
                autoEscape
                textToHighlight={text === undefined ? '' : text.toString()}
              />
            );
          }
          return '';
        },
      },
      {
        title: '???????????????',
        dataIndex: 'clientOrderSn2',
        key: 'clientOrderSn2',
        width: '10%',
        sorter: true,
        sortOrder: sortClientOrderSn2,
        render: text => {
          if (text) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[search]}
                autoEscape
                textToHighlight={text === undefined ? '' : text.toString()}
              />
            );
          }
          return '';
        },
      },
      {
        title: '????????????',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        width: '1%',
        align: 'right',
        sorter: true,
        sortOrder: sortTotalPrice,
        render: text => {
          return <Tag color="blue">{accounting.formatMoney(text, '???')}</Tag>;
        },
      },
      {
        title: '????????????',
        dataIndex: 'completePrice',
        key: 'completePrice',
        width: '1%',
        align: 'right',
        sorter: true,
        sortOrder: sortCompletePrice,
        render: (text, row) => {
          const tagColor = row.totalPrice === row.completePrice ? 'blue' : 'red';
          return <Tag color={tagColor}>{accounting.formatMoney(text, '???')}</Tag>;
        },
      },
      {
        title: '????????????',
        width: '10%',
        dataIndex: 'completeDescription',
        key: 'completeDescription',
      },
      {
        title: '?????????',
        dataIndex: 'autoIncreaseSn',
        key: 'autoIncreaseSn',
        width: '1%',
        sorter: true,
        sortOrder: sortAutoIncreaseSn,
        render: text => {
          return (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[search]}
              autoEscape
              textToHighlight={text !== null && text !== undefined ? text.toString() : ''}
            />
          );
        },
      },
      {
        title: '??????',
        dataIndex: 'userCreator.username',
        key: 'userCreator.username',
        width: '5%',
      },
      {
        title: '??????',
        dataIndex: 'userGathering.username',
        key: 'userGathering.username',
        width: '5%',
      },
      {
        title: '??????',
        dataIndex: 'userSending.username',
        key: 'userSending.username',
        width: '5%',
      },
      {
        title: '??????',
        dataIndex: 'receiveType',
        key: 'receiveType',
        width: '6%',
        align: 'center',
        filters: this.handleReceiveTypeFilters(),
        filteredValue: receiveTypeFilter,
        render: text => {
          let result;
          let color;
          switch (text) {
            case 'ALL_SEND':
              result = '????????????';
              color = '#DC143C';
              break;
            case 'PARTIAL_REJECT':
              result = '????????????';
              color = '#191970';
              break;
            case 'ALL_REJECT':
              result = '????????????';
              color = '#2E8B57';
              break;
            default:
              result = '??????';
              color = '#696969';
              break;
          }
          return <Tag color={color}>{result}</Tag>;
        },
      },
      {
        title: '??????',
        width: '1%',
        align: 'right',
        render: (text, row) => {
          return (
            <Button
              htmlType="button"
              size="small"
              type="primary"
              onClick={e => {
                e.preventDefault();
                this.viewOrder(row);
              }}
            >
              ??????
            </Button>
          );
        },
      },
    ];

    const updateCompleteModalFooter = done
      ? { footer: null, onCancel: this.handleUpdateCompleteDone }
      : {
          okText: '????????????',
          onOk: this.handleUpdateCompleteSubmit,
          onCancel: this.handleUpdateCompleteCancel,
        };

    const printModalFooter = done
      ? { footer: null, onCancel: this.handlePrintDone }
      : { okText: '????????????', onOk: this.handlePrintSubmit, onCancel: this.handlePrintCancel };

    const { updateCompleteModalVisible, printModalVisible } = this.state;

    const handleReceiveTypeConvert = type => {
      switch (type) {
        case 'ALL_SEND':
          return 0;
        case 'PARTIAL_REJECT':
          return 1;
        case 'ALL_REJECT':
          return 2;
        default:
          return -1;
      }
    };

    const getUpdateCompleteModalContent = () => {
      if (selectedRowKeys === null || selectedRowKeys.length !== 1) {
        return null;
      }
      if (done) {
        message.success('????????????');
        this.handleUpdateCompleteDone();
      }

      return (
        <Form>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('id', {
              initialValue: selectedRowKeys[0],
            })(<Input hidden />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout}>
            {getFieldDecorator('updateCompletePrice', {
              rules: [{ required: true, message: '????????????????????????' }],
              initialValue: selectedRows[0].completePrice,
            })(
              <InputNumber
                size="large"
                min={0}
                step={0.01}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            )}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout}>
            {getFieldDecorator('receiveType', {
              rules: [{ required: true, message: '????????????????????????' }],
              initialValue: handleReceiveTypeConvert(selectedRows[0].receiveType),
            })(
              <Radio.Group>
                <Radio value={0}>????????????</Radio>
                <Radio value={1}>????????????</Radio>
                <Radio value={2}>????????????</Radio>
              </Radio.Group>
            )}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout}>
            {getFieldDecorator('updateCompleteDescription', {
              rules: [{ required: false, message: '??????' }],
              initialValue: selectedRows[0].completeDescription,
            })(<TextArea rows={4} />)}
          </FormItem>
        </Form>
      );
    };

    const onDocumentLoadSuccess = document => {
      const { numPages } = document;
      this.setState({
        numPages,
      });
    };

    const getPrintModalContent = () => {
      if (selectedRows === null || selectedRows.length < 1) {
        return null;
      }
      if (done) {
        message.success('????????????');
        this.handlePrintDone();
      }
      const { pdf } = this.props;
      const { numPages } = this.state;
      return (
        <Document file={pdf} loading="?????????????????????..." onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (el, index) => (
            <Page width={900} key={`page_${index + 1}`} pageNumber={index + 1} />
          ))}
        </Document>
      );
    };

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
            <div className={styles.tableList}>
              <div className={styles.tableListOperator}>
                <Button icon="search" htmlType="button" onClick={this.handleResetSearch}>
                  ??????????????????
                </Button>
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(
                    row => row.orderStatus !== 'INIT' && row.orderStatus !== 'CANCEL'
                  ) && (
                    <Button
                      icon="printer"
                      htmlType="button"
                      type="primary"
                      onClick={this.handlePrint}
                    >
                      ???????????????
                    </Button>
                  )}
                {selectedRowKeys.length === 1 &&
                  selectedRows.every(row => ['COMPLETE'].includes(row.orderStatus)) && (
                    <Button
                      icon="edit"
                      htmlType="button"
                      type="danger"
                      onClick={this.showUpdateCompleteModal}
                    >
                      ??????????????????
                    </Button>
                  )}
              </div>
              <div className={styles.tableAlert}>
                <Alert
                  message={
                    <Fragment>
                      ????????? <a style={{ fontWeight: 600 }}>{selectedRows.length}</a> ???&nbsp;&nbsp;
                      ??????????????????&nbsp;
                      <a style={{ fontWeight: 600 }}>
                        {accounting.formatMoney(
                          selectedRows.reduce((sum, item) => {
                            return sum + item.totalPrice;
                          }, 0),
                          '???'
                        )}
                      </a>
                      &nbsp;&nbsp; ??????????????????&nbsp;
                      <a style={{ fontWeight: 600 }}>
                        {accounting.formatMoney(
                          selectedRows.reduce((sum, item) => {
                            return sum + item.completePrice;
                          }, 0),
                          '???'
                        )}
                      </a>
                      <a onClick={this.cleanSelectedKeys} style={{ marginLeft: 24 }}>
                        ??????
                      </a>
                    </Fragment>
                  }
                  type="info"
                  showIcon
                />
              </div>
              <Table
                columns={columns}
                dataSource={list}
                rowKey="id"
                loading={loading}
                pagination={paginationProps}
                onChange={this.handleTableChange}
                size="middle"
                rowSelection={rowSelectionProps}
                onRow={record => {
                  return {
                    onDoubleClick: () => {
                      this.viewOrder(record);
                    },
                    onClick: () => {
                      if (selectedRowKeys.includes(record.id)) {
                        const indexKey = selectedRowKeys.indexOf(record.id);
                        const indexRecord = selectedRows.indexOf(record);
                        if (indexKey > -1) {
                          selectedRowKeys.splice(indexKey, 1);
                        }
                        if (indexRecord > -1) {
                          selectedRows.splice(indexRecord, 1);
                        }
                      } else {
                        selectedRowKeys.push(record.id);
                        selectedRows.push(record);
                      }
                      this.setState(prevState => {
                        const newState = prevState;
                        delete newState.selectedRowKeys;
                        delete newState.selectedRows;
                        return newState;
                      });
                      this.setState({
                        selectedRowKeys,
                        selectedRows,
                      });
                    },
                  };
                }}
              />
            </div>
            <BackTop />
          </Card>
        </div>
        <Modal
          title="??????????????????"
          width={640}
          destroyOnClose
          visible={updateCompleteModalVisible}
          {...updateCompleteModalFooter}
        >
          {getUpdateCompleteModalContent()}
        </Modal>
        <Modal
          title="????????????"
          width={1000}
          destroyOnClose
          visible={printModalVisible}
          {...printModalFooter}
        >
          {getPrintModalContent()}
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default Order;
