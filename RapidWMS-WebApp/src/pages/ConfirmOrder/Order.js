import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';

import Highlighter from 'react-highlight-words';
import moment from 'moment';
import router from 'umi/router';
import accounting from 'accounting';
import FormItem from 'antd/es/form/FormItem';
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
  Popconfirm,
  Popover,
  Table,
  Tag,
  Select,
} from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './Order.less';

const PinyinMatch = require('pinyin-match');

const { Search } = Input;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const initialSortState = {
  sortClientName: null,
  sortClientOrderSn: null,
  sortTotalPrice: null,
  sortCreateTime: null,
  sortFlowSn: null,
  sortAutoIncreaseSn: null,
};

const initialModalState = {
  singleModalVisible: false,
  done: false,
  sendingModalVisible: false,
  reviewModalVisible: false,
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
  startDate: null,
  endDate: null,
  selectedRowKeys: [],
  selectedRows: [],
  loadingGather: false,
  loadingUnGather: false,
  ...initialSortState,
  ...initialModalState,
};

@connect(({ order, customer, loading, user }) => ({
  list: order.list.content,
  total: order.list.totalElements,
  customerList: customer.allList,
  loading: loading.models.order && loading.models.customer,
  sendingUser: user.list,
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
        customerFilter
      );
    }
    dispatch({
      type: 'customer/fetchAll',
    });
    dispatch({
      type: 'user/fetch',
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
      isPrintedFilter,
      isSatisfiedFilter,
      customerFilter,
      orderStatusFilter,
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
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter
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
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter,
    } = this.state;
    return {
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
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter,
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
        isPrintedFilter,
        isSatisfiedFilter,
        orderStatusFilter,
        customerFilter,
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
    router.push('/transit/confirmOrder');
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
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter,
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
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter
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
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter,
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
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter
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
    isPrintedFilter,
    isSatisfiedFilter,
    orderStatusFilter,
    customerFilter
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
      type: 'order/fetchForConfirm',
      payload: {
        exportExcel,
        search,
        startDate: startDateString,
        endDate: endDateString,
        pageSize,
        currentPage,
        orderBy,
        isPrintedFilter,
        isSatisfiedFilter,
        orderStatusFilter,
        customerFilter,
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
      case 'createTime':
        sortOrders = { ...initialSortState, sortCreateTime: order };
        break;
      case 'totalPrice':
        sortOrders = { ...initialSortState, sortTotalPrice: order };
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
      isPrinted: isPrintedFilter = null,
      isSatisfied: isSatisfiedFilter = null,
      'owner.name': customerFilter = null,
      orderStatus: orderStatusFilter = null,
    } = filters;
    const orderBy = field !== undefined ? `${field},${order}` : null;

    const sortOrders = this.getSortOrders(field, order);

    this.cleanSelectedKeys();
    this.setState({
      currentPage,
      pageSize,
      orderBy,
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter,
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
      isPrintedFilter,
      isSatisfiedFilter,
      orderStatusFilter,
      customerFilter
    );
  };

  handleSingleDone = () => {
    this.setState({
      done: false,
      singleModalVisible: false,
    });
  };

  handleSingleCancel = () => {
    this.setState({
      singleModalVisible: false,
    });
  };

  handleSingleSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleSingleDone();
      dispatch({
        type: 'order/cancelByIds',
        payload: fieldsValue,
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            const { countSucceed, countFailed } = response;
            if (countSucceed !== 0) {
              message.success(`????????????${countSucceed}???????????????`);
            }
            if (countFailed !== 0) {
              message.error(`${countFailed}?????????????????????`);
            }
            this.reloadPage();
          }
        },
      });
    });
  };

  handlePickMatchDone = () => {
    this.setState({
      done: false,
      sendingModalVisible: false,
    });
  };

  handleReviewDone = () => {
    this.setState({
      done: false,
      reviewModalVisible: false,
    });
  };

  handlePickMatchCancel = () => {
    this.setState({
      sendingModalVisible: false,
    });
  };

  handlePickMatchSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields(['ids', 'userGatheringIds'], (err, fieldsVal) => {
      if (err) {
        return;
      }
      // TODO: ???????????? dispatch
      this.handlePickMatchDone();
      const fieldsValue = Object.assign({}, fieldsVal);
      fieldsValue.userGatherings = fieldsValue.userGatheringIds.map(id => {
        return { id };
      });
      dispatch({
        type: 'order/gatherByIds',
        payload: fieldsValue,
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            const { countSucceed, countFailed } = response;
            if (countSucceed !== 0) {
              message.success(`????????????${countSucceed}???????????????`);
            }
            if (countFailed !== 0) {
              message.error(`${countFailed}?????????????????????`);
            }
            this.reloadPage();
          }
        },
      });
    });
  };

  handleReviewSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields(['ids', 'userGatheringIds'], (err, fieldsVal) => {
      if (err) {
        return;
      }
      // TODO: ?????? dispatch
      this.handleReviewDone();

      const fieldsValue = Object.assign({}, fieldsVal);
      fieldsValue.userReviewers = fieldsValue.userGatheringIds.map(id => {
        return { id };
      });
      dispatch({
        type: 'order/confirmByIds',
        payload: fieldsValue,
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            const { countSucceed, countFailed } = response;
            if (countSucceed !== 0) {
              message.success(`????????????${countSucceed}???????????????`);
            }
            if (countFailed !== 0) {
              message.error(`${countFailed}?????????????????????`);
            }
            this.reloadPage();
          }
        },
      });
    });
  };

  showPickMatchModal = () => {
    this.setState({
      sendingModalVisible: true,
    });
  };

  showReviewModal = () => {
    this.setState({
      reviewModalVisible: true,
    });
  };

  viewOrder = item => {
    router.push({
      pathname: `/transit/viewOrder/${item.id}`,
      query: {
        queryParams: this.getQueryParams(),
      },
    });
  };

  handleIsSatisfiedFilters = () => {
    const isSatisfiedFilter = [];
    isSatisfiedFilter.push({ text: '?????????', value: 'undefined' });
    isSatisfiedFilter.push({ text: '????????? ', value: 'true' });
    isSatisfiedFilter.push({ text: '???????????? ', value: 'false' });
    return isSatisfiedFilter;
  };

  handleOrderStatusFilters = () => {
    const orderStatusFilter = [];
    orderStatusFilter.push({ text: '????????????', value: 1 });
    orderStatusFilter.push({ text: '????????????', value: 2 });
    orderStatusFilter.push({ text: '????????????', value: 3 });
    orderStatusFilter.push({ text: '????????????', value: 4 });
    return orderStatusFilter;
  };

  handleGather = () => {
    this.setState({ loadingGather: true });
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length >= 1) {
      const { dispatch } = this.props;
      dispatch({
        type: 'order/gatherByIds',
        payload: selectedRowKeys,
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            const { countSucceed, countFailed } = response;
            if (countSucceed !== 0) {
              message.success(`????????????${countSucceed}???????????????`);
            }
            if (countFailed !== 0) {
              message.error(`${countFailed}?????????????????????`);
            }
            this.reloadPage();
          }
        },
      });
      this.setState({ loadingGather: false });
    }
  };

  handleUnGather = () => {
    this.setState({ loadingUnGather: true });
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length >= 1) {
      const { dispatch } = this.props;
      dispatch({
        type: 'order/unGatherByIds',
        payload: selectedRowKeys,
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            const { countSucceed, countFailed } = response;
            if (countSucceed !== 0) {
              message.success(`????????????${countSucceed}???????????????`);
            }
            if (countFailed !== 0) {
              message.error(`${countFailed}?????????????????????`);
            }
            this.reloadPage();
          }
        },
      });
      this.setState({ loadingUnGather: false });
    }
  };

  handleCompleteGather = () => {
    this.setState({ loadingGather: true });
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length >= 1) {
      const { dispatch } = this.props;
      dispatch({
        type: 'order/completeGatherByIds',
        payload: selectedRowKeys,
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            const { countSucceed, countFailed } = response;
            if (countSucceed !== 0) {
              message.success(`????????????${countSucceed}???????????????`);
            }
            if (countFailed !== 0) {
              message.error(`${countFailed}?????????????????????`);
            }
            this.reloadPage();
          }
        },
      });
      this.setState({ loadingGather: false });
    }
  };

  handleUnCompleteGather = () => {
    this.setState({ loadingUnGather: true });
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length >= 1) {
      const { dispatch } = this.props;
      dispatch({
        type: 'order/unCompleteGatherByIds',
        payload: selectedRowKeys,
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            const { countSucceed, countFailed } = response;
            if (countSucceed !== 0) {
              message.success(`????????????${countSucceed}???????????????`);
            }
            if (countFailed !== 0) {
              message.error(`${countFailed}?????????????????????`);
            }
            this.reloadPage();
          }
        },
      });
      this.setState({ loadingUnGather: false });
    }
  };

  handleConfirm = () => {
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length >= 1) {
      const { dispatch } = this.props;
      dispatch({
        type: 'order/confirmByIds',
        payload: selectedRowKeys,
        callback: response => {
          if (response.status === 400) {
            notification.error({
              message: '??????????????????',
              description: response.message,
            });
          } else {
            const { countSucceed, countFailed } = response;
            if (countSucceed !== 0) {
              message.success(`????????????${countSucceed}???????????????`);
            }
            if (countFailed !== 0) {
              message.error(`${countFailed}?????????????????????`);
            }
            this.reloadPage();
          }
        },
      });
    }
  };

  getPickMatchOptions = () => {
    const { sendingUser } = this.props;
    const children = [];
    if (Array.isArray(sendingUser)) {
      sendingUser.forEach(user => {
        children.push(
          <Option key={user.id} value={user.id}>
            {user.username}/{user.num}
          </Option>
        );
      });
    }
    return children;
  };

  render() {
    const { list, total, loading } = this.props;
    if (list && list.length > 0) {
      list.forEach(order => {
        const ugArr = [];
        const urArr = [];
        order.customerOrderPages.forEach(page => {
          page.userGatherings.forEach(user => ugArr.push(`${user.username}/${user.num}`));
          page.userReviewers.forEach(user => urArr.push(`${user.username}/${user.num}`));
        });
        Object.assign(order, {
          userGatheringsStr: ugArr.join(','),
          userReviewersStr: urArr.join(','),
        });
      });
    }
    const { pageSize, currentPage } = this.state;
    const { loadingGather, loadingUnGather, search, startDate, endDate } = this.state;
    const { isSatisfiedFilter, customerFilter, orderStatusFilter } = this.state;
    const { selectedRowKeys = [], selectedRows = [] } = this.state;
    const {
      sortClientName,
      sortClientOrderSn,
      sortTotalPrice,
      sortCreateTime,
      sortAutoIncreaseSn,
    } = this.state;

    const { singleModalVisible, sendingModalVisible, reviewModalVisible } = this.state;

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
        title: '??????',
        dataIndex: 'isSatisfied',
        key: 'isSatisfied',
        width: '1%',
        align: 'center',
        filters: this.handleIsSatisfiedFilters(),
        filteredValue: isSatisfiedFilter,
        filterMultiple: false,
        render: text => {
          switch (text) {
            case true:
              return <Tag color="blue">?????????</Tag>;
            case false:
              return <Tag color="orange">????????????</Tag>;
            default:
              return <Tag color="#A9A9A9">?????????</Tag>;
          }
        },
      },
      {
        title: '??????',
        dataIndex: 'orderStatus',
        key: 'orderStatus',
        width: '1%',
        align: 'center',
        filters: this.handleOrderStatusFilters(),
        filteredValue: orderStatusFilter,
        render: text => {
          let result;
          let color;
          switch (text) {
            case 'INIT':
              result = '????????????';
              color = '#DC143C';
              break;
            case 'FETCH_STOCK':
              result = '????????????';
              color = '#C71585';
              break;
            case 'GATHERING_GOODS':
              result = '????????????';
              color = '#F7D358';
              break;
            case 'GATHER_GOODS':
              result = '????????????';
              color = '#2F4F4F';
              break;
            case 'CONFIRM':
              result = '????????????';
              color = '#808000';
              break;
            case 'PACKAGE':
              result = '????????????';
              color = '#8A2BE2';
              break;
            case 'SENDING':
              result = '????????????';
              color = '#191970';
              break;
            case 'CLIENT_SIGNED':
              result = '????????????';
              color = '#FF8C00';
              break;
            case 'COMPLETE':
              result = '????????????';
              color = '#00BFFF';
              break;
            case 'CANCEL':
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
        dataIndex: 'owner.shortNameCn',
        key: 'owner.name',
        width: '5%',
        filters: this.handleCustomerFilters(),
        filteredValue: customerFilter,
      },
      {
        title: '????????????',
        dataIndex: 'clientName',
        key: 'clientName',
        width: '15%',
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
        dataIndex: 'description',
        key: 'description',
        width: '20%',
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
        dataIndex: 'createTime',
        key: 'createTime',
        width: '1%',
        sorter: true,
        sortOrder: sortCreateTime,
        render: text => {
          return <Tag>{moment(text).format('YY/MM/DD/HH:mm')}</Tag>;
        },
      },
      {
        title: '?????????',
        dataIndex: 'autoIncreaseSn',
        key: 'autoIncreaseSn',
        width: '15%',
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
        width: '6%',
      },
      {
        title: '?????????',
        dataIndex: 'userGatheringsStr',
        width: '1%',
        render: text => {
          return <Tag>{text}</Tag>;
        },
      },
      {
        title: '?????????',
        dataIndex: 'userReviewersStr',
        width: '1%',
        render: text => {
          return <Tag>{text}</Tag>;
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

    const singleModalFooter = done
      ? { footer: null, onCancel: this.handleSingleDone }
      : { okText: '????????????', onOk: this.handleSingleSubmit, onCancel: this.handleSingleCancel };

    const sendingModalFooter = done
      ? { footer: null, onCancel: this.handlePickMatchDone }
      : {
          okText: '????????????',
          onOk: this.handlePickMatchSubmit,
          onCancel: this.handlePickMatchCancel,
        };

    const reviewModalFooter = done
      ? {
          footer: null,
          onCancel: () => {
            this.setState({
              done: false,
              reviewModalVisible: false,
            });
          },
        }
      : {
          okText: '????????????',
          onOk: this.handleReviewSubmit,
          onCancel: () => {
            this.setState({
              reviewModalVisible: false,
            });
          },
        };

    const getSingleModalContent = () => {
      if (selectedRows === null || selectedRows.length < 1) {
        return null;
      }
      if (done) {
        message.success('????????????');
        this.handleSingleDone();
      }

      return (
        <Form>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('ids', {
              initialValue: selectedRows.map(item => item.id),
            })(<Input hidden />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout}>
            {getFieldDecorator('cancelDescription', {
              rules: [{ required: true, message: '????????????????????????' }],
              initialValue: null,
            })(<TextArea rows={4} />)}
          </FormItem>
        </Form>
      );
    };

    // TODO: ????????????-form
    const getPickMatchModalContent = () => {
      if (selectedRows === null || selectedRows.length < 1) {
        return null;
      }
      if (done) {
        message.success('????????????????????????');
        this.handlePickMatchDone();
      }

      return (
        <Form>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('ids', {
              initialValue: selectedRows.map(item => item.id),
            })(<Input hidden />)}
          </FormItem>
          <FormItem label="??????????????????" {...this.formLayout}>
            {getFieldDecorator('userGatheringIds', {
              rules: [{ required: true, message: '????????????????????????' }],
            })(
              <Select
                showSearch
                allowClear
                mode="multiple"
                filterOption={(input, option) =>
                  PinyinMatch.match(option.props.children.toString(), input)
                }
                placeholder="?????????????????????"
              >
                {this.getPickMatchOptions()}
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
            bordered={false}
            title="?????????????????????"
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
                  selectedRows.every(row => row.orderStatus === 'FETCH_STOCK') && (
                    <span>
                      <Button
                        icon="check"
                        htmlType="button"
                        type="primary"
                        onClick={this.showPickMatchModal}
                      >
                        ????????????
                      </Button>
                    </span>
                  )}
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(row => row.orderStatus === 'GATHERING_GOODS') && (
                    <Popconfirm title="?????????????????????" onConfirm={this.handleUnGather}>
                      <Button
                        icon="close"
                        htmlType="button"
                        type="danger"
                        loading={loadingUnGather}
                      >
                        ????????????
                      </Button>
                    </Popconfirm>
                  )}
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(row => row.orderStatus === 'GATHERING_GOODS') && (
                    <Popconfirm title="???????????????????????????" onConfirm={this.handleCompleteGather}>
                      <Button icon="check" htmlType="button" type="primary" loading={loadingGather}>
                        ????????????
                      </Button>
                    </Popconfirm>
                  )}
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(row => row.orderStatus === 'GATHER_GOODS') && (
                    <Popconfirm title="?????????????????????" onConfirm={this.handleUnCompleteGather}>
                      <Button
                        icon="close"
                        htmlType="button"
                        type="danger"
                        loading={loadingUnGather}
                      >
                        ????????????
                      </Button>
                    </Popconfirm>
                  )}
                {/* TODO ???????????? */}
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(row => row.orderStatus === 'GATHER_GOODS') && (
                    <span>
                      <Button
                        icon="check"
                        htmlType="button"
                        type="primary"
                        onClick={this.showReviewModal}
                      >
                        ??????????????????
                      </Button>
                    </span>
                  )}
              </div>
              <div className={styles.tableAlert}>
                <Alert
                  message={
                    <Fragment>
                      ????????? <a style={{ fontWeight: 600 }}>{selectedRows.length}</a> ???&nbsp;&nbsp;
                      ????????????&nbsp;
                      <a style={{ fontWeight: 600 }}>
                        {accounting.formatMoney(
                          selectedRows.reduce((sum, item) => {
                            return sum + item.totalPrice;
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
          title="????????????"
          width={640}
          destroyOnClose
          visible={singleModalVisible}
          {...singleModalFooter}
        >
          {getSingleModalContent()}
        </Modal>
        <Modal
          title="????????????"
          width={640}
          destroyOnClose
          visible={sendingModalVisible}
          {...sendingModalFooter}
        >
          {getPickMatchModalContent()}
        </Modal>
        <Modal
          title="????????????"
          width={640}
          destroyOnClose
          visible={reviewModalVisible}
          {...reviewModalFooter}
        >
          {getPickMatchModalContent()}
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default Order;
