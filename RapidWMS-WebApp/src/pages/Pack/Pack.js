import React, { Fragment, PureComponent } from 'react';
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
  Popconfirm,
  Progress,
  Select,
  Table,
  Tag,
  Radio,
  Upload,
} from 'antd';

import Highlighter from 'react-highlight-words';
import moment from 'moment';
import router from 'umi/router';
import accounting from 'accounting';
import FormItem from 'antd/es/form/FormItem';
import { Document, Page } from 'react-pdf';
import print from 'print-js';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './Pack.less';
import { getToken } from '../../models/login';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const initialSortState = {
  sortTotalPrice: null,
  sortUserName: null,
  sortCreateTime: null,
  sortFlowSn: null,
  sortAddressName: null,
};

const initialModalState = {
  singleModalVisible: false,
  sendingModalVisible: false,
  signedModalVisible: false,
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
  searchAddress: null,
  searchOrderSn: null,
  isPrintedFilter: null,
  isPackagedFilter: null,
  packStatusFilter: null,
  packTypeFilter: null,
  receiveTypeFilter: null,
  customerFilter: null,
  addressTypeFilter: null,
  startDate: null,
  endDate: null,
  selectedRowKeys: [],
  selectedRows: [],
  uploadFileList: [],
  numPages: 0,
  ...initialSortState,
  ...initialModalState,
};

@connect(({ pack, customer, addressType, user, loading }) => ({
  list: pack.list.content,
  total: pack.list.totalElements,
  pdf: pack.pdf,
  customerList: customer.allList,
  addressTypeList: addressType.allList,
  sendingUserList: user.listByRoleNames,
  loading:
    loading.models.pack &&
    loading.models.customer &&
    loading.models.addressType &&
    loading.models.user,
}))
@Form.create()
class Pack extends PureComponent {
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
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter,
    } = this.state;

    if (queryParams !== undefined && queryParams !== null) {
      this.setQueryParamsAndQuery(queryParams);
    } else {
      this.handleQuery(
        dispatch,
        false,
        search,
        searchAddress,
        searchOrderSn,
        startDate,
        endDate,
        pageSize,
        currentPage,
        orderBy,
        isPrintedFilter,
        isPackagedFilter,
        packTypeFilter,
        receiveTypeFilter,
        packStatusFilter,
        customerFilter,
        addressTypeFilter
      );
    }
    dispatch({
      type: 'customer/fetchAll',
    });
    dispatch({
      type: 'addressType/fetchAll',
    });
    dispatch({
      type: 'user/fetchByRoleNames',
      payload: '?????????',
    });
  }

  reloadPage = () => {
    this.cleanSelectedKeys();
    const { dispatch } = this.props;
    const {
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      customerFilter,
      addressTypeFilter,
      packStatusFilter,
    } = this.state;
    this.handleQuery(
      dispatch,
      false,
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter
    );
  };

  getQueryParams = () => {
    const {
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter,
    } = this.state;
    return {
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter,
    };
  };

  setQueryParamsAndQuery = params => {
    const {
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter,
    } = params;

    let sortOrders;
    if (orderBy !== undefined && orderBy !== null) {
      const orderByArray = orderBy.split(',');
      sortOrders = this.getSortOrders(orderByArray[0], orderByArray[1]);
    }

    this.setState(
      {
        search,
        searchAddress,
        searchOrderSn,
        startDate,
        endDate,
        pageSize,
        currentPage,
        orderBy,
        isPrintedFilter,
        isPackagedFilter,
        packTypeFilter,
        receiveTypeFilter,
        packStatusFilter,
        customerFilter,
        addressTypeFilter,
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
    router.push('/transit/pack');
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

  handleAddressTypeFilters = () => {
    const { addressTypeList } = this.props;
    const addressTypeFilters = [];
    if (addressTypeList && addressTypeList !== undefined) {
      addressTypeList.map(addressType => {
        return addressTypeFilters.push({ text: addressType.name, value: addressType.id });
      });
    }
    return addressTypeFilters;
  };

  handleSearchChange = e => {
    this.setState({
      search: e.target.value,
    });
  };

  handleSearchAddressChange = e => {
    this.setState({
      searchAddress: e.target.value,
    });
  };

  handleSearchOrderSnChange = e => {
    this.setState({
      searchOrderSn: e.target.value,
    });
  };

  handleSearch = value => {
    this.setState({ search: value });
    const search = value === '' ? '' : value;
    const { dispatch } = this.props;
    const {
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter,
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
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      1,
      null,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter
    );
  };

  handleSearchAddress = value => {
    this.setState({ searchAddress: value });
    const searchAddress = value === '' ? '' : value;
    const { dispatch } = this.props;
    const {
      search,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter,
    } = this.state;
    this.setState({
      currentPage: 1,
      orderBy: null,
    });
    this.handleQuery(
      dispatch,
      false,
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      1,
      null,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter
    );
  };

  handleSearchOrderSn = value => {
    this.setState({ searchOrderSn: value });
    const searchOrderSn = value === '' ? '' : value;
    const { dispatch } = this.props;
    const {
      search,
      searchAddress,
      startDate,
      endDate,
      pageSize,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter,
    } = this.state;
    this.setState({
      currentPage: 1,
      orderBy: null,
    });
    this.handleQuery(
      dispatch,
      false,
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      1,
      null,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter
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
      searchAddress,
      searchOrderSn,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter,
    } = this.state;
    this.cleanSelectedKeys();
    this.handleQuery(
      dispatch,
      false,
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter
    );
  };

  handleQuery = (
    dispatch,
    exportExcel,
    search,
    searchAddress,
    searchOrderSn,
    startDate,
    endDate,
    pageSize,
    currentPage,
    orderBy,
    isPrintedFilter,
    isPackagedFilter,
    packTypeFilter,
    receiveTypeFilter,
    packStatusFilter,
    customerFilter,
    addressTypeFilter
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
      type: 'pack/fetch',
      payload: {
        exportExcel,
        search,
        searchAddress,
        searchOrderSn,
        startDate: startDateString,
        endDate: endDateString,
        pageSize,
        currentPage,
        orderBy,
        isPrintedFilter,
        isPackagedFilter,
        packTypeFilter,
        receiveTypeFilter,
        packStatusFilter,
        customerFilter,
        addressTypeFilter,
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
      case 'totalPrice':
        sortOrders = { ...initialSortState, sortTotalPrice: order };
        break;
      case 'user.username':
        sortOrders = { ...initialSortState, sortUserName: order };
        break;
      case 'createTime':
        sortOrders = { ...initialSortState, sortCreateTime: order };
        break;
      case 'flowSn':
        sortOrders = { ...initialSortState, sortFlowSn: order };
        break;
      case 'address.name':
        sortOrders = { ...initialSortState, sortAddressName: order };
        break;
      default:
        sortOrders = initialSortState;
    }
    return sortOrders;
  };

  handleTableChange = (pagination, filters, sorter) => {
    const { dispatch } = this.props;
    const { search, searchAddress, searchOrderSn, startDate, endDate } = this.state;
    const { current: currentPage, pageSize } = pagination;
    const { field, order } = sorter;
    const {
      isPrinted: isPrintedFilter = null,
      isPackaged: isPackagedFilter = null,
      packType: packTypeFilter = null,
      receiveType: receiveTypeFilter = null,
      'customer.name': customerFilter = null,
      'address.addressType.name': addressTypeFilter = null,
      packStatus: packStatusFilter = null,
    } = filters;
    const orderBy = field !== undefined ? `${field},${order}` : null;

    const sortOrders = this.getSortOrders(field, order);

    this.cleanSelectedKeys();
    this.setState({
      currentPage,
      pageSize,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter,
      ...sortOrders,
    });
    this.handleQuery(
      dispatch,
      false,
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter
    );
  };

  showSingleModal = () => {
    this.setState({
      singleModalVisible: true,
    });
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

    form.validateFields(['ids', 'cancelDescription'], (err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleSingleDone();
      dispatch({
        type: 'pack/cancelByIds',
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

  showCompleteModal = () => {
    this.setState({
      completeModalVisible: true,
    });
  };

  handleCompleteDone = () => {
    this.setState({
      done: false,
      completeModalVisible: false,
    });
  };

  handleCompleteCancel = () => {
    this.setState({
      completeModalVisible: false,
    });
  };

  handleCompleteSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields(['ids', 'receiveType'], (err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleCompleteDone();
      dispatch({
        type: 'pack/completeByIds',
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

    form.validateFields(['ids', 'receiveType'], (err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleUpdateCompleteDone();
      dispatch({
        type: 'pack/updateCompleteByIds',
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

  showSendingModal = () => {
    this.setState({
      sendingModalVisible: true,
    });
  };

  handleSendingDone = () => {
    this.setState({
      done: false,
      sendingModalVisible: false,
    });
  };

  handleSendingCancel = () => {
    this.setState({
      sendingModalVisible: false,
    });
  };

  handleSendingSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields(['ids', 'sendingUserId'], (err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleSendingDone();
      dispatch({
        type: 'pack/sendingByIds',
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

  showSignedModal = () => {
    this.setState({
      signedModalVisible: true,
    });
  };

  handleSignedDone = () => {
    this.setState({
      done: false,
      signedModalVisible: false,
      uploadFileList: [],
    });
  };

  handleSignedCancel = () => {
    this.setState({
      signedModalVisible: false,
      uploadFileList: [],
    });
  };

  handleSignedSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;
    const { uploadFileList } = this.state;

    form.validateFields(['ids'], (err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleSignedDone();
      dispatch({
        type: 'pack/signedByIds',
        payload: { ...fieldsValue, uploadFileList },
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

  handleAddPack = () => {
    router.push({
      pathname: '/transit/addPack',
      query: {
        queryParams: this.getQueryParams(),
      },
    });
  };

  editPack = () => {
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length === 1) {
      router.push({
        pathname: `/transit/editPack/${selectedRowKeys[0]}`,
        query: {
          queryParams: this.getQueryParams(),
        },
      });
    }
  };

  assignPack = () => {
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length === 1) {
      router.push({
        pathname: `/transit/assignPack/${selectedRowKeys[0]}`,
        query: {
          queryParams: this.getQueryParams(),
        },
      });
    }
  };

  viewPack = item => {
    router.push({
      pathname: `/transit/viewPack/${item.id}`,
      query: {
        queryParams: this.getQueryParams(),
      },
    });
  };

  handlePackStatusFilters = () => {
    const packStatusFilter = [];
    packStatusFilter.push({ text: '????????????', value: 5 });
    packStatusFilter.push({ text: '????????????', value: 6 });
    packStatusFilter.push({ text: '????????????', value: 7 });
    packStatusFilter.push({ text: '????????????', value: 8 });
    packStatusFilter.push({ text: '????????????', value: 9 });
    return packStatusFilter;
  };

  getProgress = packStatus => {
    let percents;
    switch (packStatus) {
      case 'PACKAGE':
        percents = 25;
        break;
      case 'SENDING':
        percents = 50;
        break;
      case 'CLIENT_SIGNED':
        percents = 75;
        break;
      case 'COMPLETE':
        percents = 100;
        break;
      case 'CANCEL':
        percents = 0;
        break;
      default:
        percents = 0;
        break;
    }
    return percents;
  };

  handleIsPrintedFilters = () => {
    const isPrintedFilter = [];
    isPrintedFilter.push({ text: '?????????', value: true });
    isPrintedFilter.push({ text: '????????? ', value: false });
    return isPrintedFilter;
  };

  handleIsPackagedFilters = () => {
    const isPackagedFilter = [];
    isPackagedFilter.push({ text: '?????????', value: true });
    isPackagedFilter.push({ text: '????????? ', value: false });
    return isPackagedFilter;
  };

  handlePackTypeFilters = () => {
    const packTypeFilter = [];
    packTypeFilter.push({ text: '????????????', value: '0' });
    packTypeFilter.push({ text: '???????????? ', value: '1' });
    packTypeFilter.push({ text: '???????????? ', value: '2' });
    return packTypeFilter;
  };

  handleReceiveTypeFilters = () => {
    const receiveTypeFilter = [];
    receiveTypeFilter.push({ text: '????????????', value: '0' });
    receiveTypeFilter.push({ text: '???????????? ', value: '1' });
    receiveTypeFilter.push({ text: '???????????? ', value: '2' });
    return receiveTypeFilter;
  };

  handleDelete = () => {
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length >= 1) {
      const { dispatch } = this.props;
      dispatch({
        type: 'pack/deleteByIds',
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

  handleReturn = () => {
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length >= 1) {
      const { dispatch } = this.props;
      dispatch({
        type: 'pack/returnByIds',
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

  handleSendingByMe = () => {
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length >= 1) {
      const { dispatch } = this.props;
      dispatch({
        type: 'pack/sendingByMe',
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

  getSendingOptions = allSendingUser => {
    const children = [];
    if (Array.isArray(allSendingUser)) {
      allSendingUser.forEach(user => {
        children.push(
          <Option key={user.id} value={user.id}>
            {user.username}
          </Option>
        );
      });
    }
    return children;
  };

  handlePrint = () => {
    const { dispatch } = this.props;
    const { selectedRowKeys } = this.state;
    dispatch({
      type: 'pack/printByIds',
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

  handleExportExcel = () => {
    const { dispatch } = this.props;
    const {
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      customerFilter,
      addressTypeFilter,
      packStatusFilter,
    } = this.state;
    this.handleQuery(
      dispatch,
      true,
      search,
      searchAddress,
      searchOrderSn,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      isPrintedFilter,
      isPackagedFilter,
      packTypeFilter,
      receiveTypeFilter,
      packStatusFilter,
      customerFilter,
      addressTypeFilter
    );
  };

  render() {
    const { list, total, loading, sendingUserList } = this.props;
    const { pageSize, currentPage } = this.state;
    const { search, searchAddress, searchOrderSn, startDate, endDate } = this.state;
    const {
      isPrintedFilter,
      packTypeFilter,
      receiveTypeFilter,
      customerFilter,
      addressTypeFilter,
      packStatusFilter,
    } = this.state;
    const { selectedRowKeys = [], selectedRows = [] } = this.state;
    const {
      sortTotalPrice,
      sortCreateTime,
      sortFlowSn,
      sortUserName,
      sortAddressName,
    } = this.state;
    const { previewVisible, previewImage } = this.state;

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
          value={searchOrderSn}
          className={styles.extraContentSearchShort}
          placeholder="???????????????/?????????"
          onChange={this.handleSearchOrderSnChange}
          onSearch={this.handleSearchOrderSn}
        />
        <Search
          value={searchAddress}
          className={styles.extraContentSearchShort}
          placeholder="??????"
          onChange={this.handleSearchAddressChange}
          onSearch={this.handleSearchAddress}
        />
        <Search
          value={search}
          className={styles.extraContentSearchShort}
          placeholder="?????????/?????????/??????"
          onChange={this.handleSearchChange}
          onSearch={this.handleSearch}
        />
        <RangePicker
          style={{ marginLeft: 10 }}
          onChange={this.handleDateRangeChange}
          value={[startDate, endDate]}
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
        dataIndex: 'isPrinted',
        key: 'isPrinted',
        width: '1%',
        align: 'center',
        filters: this.handleIsPrintedFilters(),
        filteredValue: isPrintedFilter,
        filterMultiple: false,
        render: text => {
          if (text) {
            return <Tag color="blue">?????????</Tag>;
          }
          return <Tag color="#A9A9A9">?????????</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'packType',
        key: 'packType',
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
        title: '??????',
        dataIndex: 'packStatus',
        key: 'packStatus',
        width: '1%',
        align: 'center',
        filters: this.handlePackStatusFilters(),
        filteredValue: packStatusFilter,
        render: text => {
          let result;
          let color;
          switch (text) {
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
        dataIndex: 'packStatusProgress',
        key: 'packStatusProgress',
        width: '1%',
        align: 'center',
        render: (text, record) => {
          if (record.packStatus === 'CANCEL') {
            return <Progress type="circle" percent={0} width={30} status="exception" />;
          }
          return (
            <Progress type="circle" percent={this.getProgress(record.packStatus)} width={30} />
          );
        },
      },
      {
        title: '??????',
        dataIndex: 'customer.shortNameCn',
        key: 'customer.name',
        width: '6%',
        filters: this.handleCustomerFilters(),
        filteredValue: customerFilter,
      },
      {
        title: '????????????',
        dataIndex: 'address.name',
        key: 'address.name',
        sorter: true,
        sortOrder: sortAddressName,
        width: '15%',
        render: text => {
          if (text !== undefined && text !== null) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[search]}
                autoEscape
                textToHighlight={text !== null && text !== undefined ? text.toString() : ''}
              />
            );
          }
          return '';
        },
      },
      {
        title: '????????????',
        dataIndex: 'address.addressType.name',
        key: 'address.addressType.name',
        width: '5%',
        filters: this.handleAddressTypeFilters(),
        filteredValue: addressTypeFilter,
      },
      {
        title: '??????',
        dataIndex: 'description',
        key: 'description',
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
        title: '??????',
        dataIndex: 'packages',
        key: 'packages',
        width: '1%',
        align: 'right',
        render: text => {
          return <Tag color="#2db7f5">{text}</Tag>;
        },
      },
      {
        title: '?????????',
        dataIndex: 'user.username',
        key: 'user.username',
        width: '8%',
        sorter: true,
        sortOrder: sortUserName,
        render: text => {
          if (text === undefined || text === null) {
            return <Tag color="#A9A9A9">?????????</Tag>;
          }
          return text;
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
        dataIndex: 'flowSn',
        key: 'flowSn',
        width: '22%',
        sorter: true,
        sortOrder: sortFlowSn,
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
        dataIndex: 'receiveType',
        key: 'receiveType',
        width: '1%',
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
                this.viewPack(row);
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

    const completeModalFooter = done
      ? { footer: null, onCancel: this.handleCompleteDone }
      : {
          okText: '????????????',
          onOk: this.handleCompleteSubmit,
          onCancel: this.handleCompleteCancel,
        };

    const updateCompleteModalFooter = done
      ? { footer: null, onCancel: this.handleUpdateCompleteDone }
      : {
          okText: '????????????',
          onOk: this.handleUpdateCompleteSubmit,
          onCancel: this.handleUpdateCompleteCancel,
        };

    const sendingModalFooter = done
      ? { footer: null, onCancel: this.handleSendingDone }
      : { okText: '????????????', onOk: this.handleSendingSubmit, onCancel: this.handleSendingCancel };

    const signedModalFooter = done
      ? { footer: null, onCancel: this.handleSignedDone }
      : { okText: '????????????', onOk: this.handleSignedSubmit, onCancel: this.handleSignedCancel };

    const printModalFooter = done
      ? { footer: null, onCancel: this.handlePrintDone }
      : { okText: '????????????', onOk: this.handlePrintSubmit, onCancel: this.handlePrintCancel };

    const {
      singleModalVisible,
      completeModalVisible,
      updateCompleteModalVisible,
      sendingModalVisible,
      signedModalVisible,
      printModalVisible,
    } = this.state;

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

    const getCompleteModalContent = () => {
      if (selectedRows === null || selectedRows.length < 1) {
        return null;
      }
      if (done) {
        message.success('????????????');
        this.handleCompleteDone();
      }

      return (
        <Form>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('ids', {
              initialValue: selectedRows.map(item => item.id),
            })(<Input hidden />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout}>
            {getFieldDecorator('receiveType', {
              rules: [{ required: true, message: '????????????????????????' }],
              initialValue: 0,
            })(
              <Radio.Group>
                <Radio value={0}>????????????</Radio>
                <Radio value={1}>????????????</Radio>
                <Radio value={2}>????????????</Radio>
              </Radio.Group>
            )}
          </FormItem>
        </Form>
      );
    };

    const getUpdateCompleteModalContent = () => {
      if (selectedRows === null || selectedRows.length < 1) {
        return null;
      }
      if (done) {
        message.success('????????????');
        this.handleUpdateCompleteDone();
      }

      return (
        <Form>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('ids', {
              initialValue: selectedRows.map(item => item.id),
            })(<Input hidden />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout}>
            {getFieldDecorator('receiveType', {
              rules: [{ required: true, message: '????????????????????????' }],
              initialValue: 0,
            })(
              <Radio.Group>
                <Radio value={0}>????????????</Radio>
                <Radio value={1}>????????????</Radio>
                <Radio value={2}>????????????</Radio>
              </Radio.Group>
            )}
          </FormItem>
        </Form>
      );
    };

    const getSendingModalContent = () => {
      if (selectedRows === null || selectedRows.length < 1) {
        return null;
      }
      if (done) {
        message.success('????????????????????????');
        this.handleSendingDone();
      }

      return (
        <Form>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('ids', {
              initialValue: selectedRows.map(item => item.id),
            })(<Input hidden />)}
          </FormItem>
          <FormItem label="??????????????????" {...this.formLayout}>
            {getFieldDecorator('sendingUserId', {
              rules: [{ required: true, message: '????????????????????????' }],
              initialValue: null,
            })(
              <Select
                showSearch
                filterOption={(input, option) =>
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                placeholder="?????????????????????"
              >
                {this.getSendingOptions(sendingUserList)}
              </Select>
            )}
          </FormItem>
        </Form>
      );
    };

    const getSignedModalContent = () => {
      if (selectedRows === null || selectedRows.length < 1) {
        return null;
      }
      if (done) {
        message.success('??????????????????');
        this.handleSignedDone();
      }

      const handleUploadChange = info => {
        let { fileList } = info;
        fileList = fileList.map(file => {
          if (file.response) {
            return file.response;
          }
          return null;
        });
        fileList = fileList.filter(file => {
          return typeof file === 'string';
        });
        this.setState({ uploadFileList: fileList });
      };

      const handlePreviewCancel = () => this.setState({ previewVisible: false });

      const handlePreview = file => {
        this.setState({
          previewImage: file.url || file.thumbUrl,
          previewVisible: true,
        });
      };

      const uploadProps = {
        name: 'file',
        action: '/api/packs/upload_picture',
        listType: 'picture-card',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        multiple: true,
        accept: 'image/*',
        onChange: handleUploadChange,
        onPreview: handlePreview,
      };

      const uploadButton = (
        <div>
          <Icon type="plus" />
          <div>Upload</div>
        </div>
      );

      return (
        <Form>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('ids', {
              initialValue: selectedRows.map(item => item.id),
            })(<Input hidden />)}
          </FormItem>
          <FormItem label="??????????????????(??????)" {...this.formLayout}>
            {getFieldDecorator(
              'uploadFileList',
              []
            )(<Upload {...uploadProps}>{uploadButton}</Upload>)}
          </FormItem>
          <Modal visible={previewVisible} footer={null} onCancel={handlePreviewCancel}>
            <img alt="example" style={{ width: '100%' }} src={previewImage} />
          </Modal>
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
            <Page width={700} key={`page_${index + 1}`} pageNumber={index + 1} />
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
                <Button icon="plus" htmlType="button" type="primary" onClick={this.handleAddPack}>
                  ????????????
                </Button>
                <Button icon="search" htmlType="button" onClick={this.handleResetSearch}>
                  ??????????????????
                </Button>
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(row => row.packStatus !== 'CANCEL') && (
                    <Button
                      icon="printer"
                      htmlType="button"
                      type="primary"
                      onClick={this.handlePrint}
                    >
                      ????????????
                    </Button>
                  )}
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(row => row.packStatus === 'SENDING') && (
                    <span>
                      <Popconfirm title="???????????????????????????" onConfirm={this.handleReturn}>
                        <Button icon="close" htmlType="button" type="danger">
                          ????????????
                        </Button>
                      </Popconfirm>
                      <Button
                        icon="check-square"
                        htmlType="button"
                        type="primary"
                        onClick={this.showSignedModal}
                      >
                        ????????????
                      </Button>
                    </span>
                  )}
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(row => row.packStatus === 'PACKAGE') && (
                    <span>
                      <Button
                        icon="inbox"
                        htmlType="button"
                        type="primary"
                        onClick={this.showSendingModal}
                      >
                        ????????????
                      </Button>
                    </span>
                  )}
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(
                    row => row.packStatus === 'PACKAGE' || row.packStatus === 'CANCEL'
                  ) && (
                    <span>
                      <Popconfirm title="???????????????????????????" onConfirm={this.handleDelete}>
                        <Button icon="close" htmlType="button" type="danger">
                          ????????????
                        </Button>
                      </Popconfirm>
                    </span>
                  )}
                {/* selectedRowKeys.length >= 1 &&
                selectedRows.every(
                  row => row.packStatus === 'CLIENT_SIGNED'
                ) && (
                  <span>
                    <Button icon="check" htmlType="button" type="primary" onClick={this.showCompleteModal}>
                      ????????????
                    </Button>
                  </span>
                ) */}
                {/* selectedRowKeys.length >= 1 &&
                selectedRows.every(
                  row => row.packStatus === 'COMPLETE'
                ) && (
                  <span>
                    <Button icon="check" htmlType="button" type="primary" onClick={this.showUpdateCompleteModal}>
                      ????????????
                    </Button>
                  </span>
                ) */}
                {selectedRowKeys.length >= 1 &&
                  selectedRows.every(row => row.packStatus !== 'CANCEL') && (
                    <Button
                      icon="stop"
                      htmlType="button"
                      type="danger"
                      onClick={this.showSingleModal}
                    >
                      ????????????
                    </Button>
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
                      this.viewPack(record);
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
          visible={completeModalVisible}
          {...completeModalFooter}
        >
          {getCompleteModalContent()}
        </Modal>
        <Modal
          title="????????????"
          width={640}
          destroyOnClose
          visible={updateCompleteModalVisible}
          {...updateCompleteModalFooter}
        >
          {getUpdateCompleteModalContent()}
        </Modal>
        <Modal
          title="????????????"
          width={640}
          destroyOnClose
          visible={sendingModalVisible}
          {...sendingModalFooter}
        >
          {getSendingModalContent()}
        </Modal>
        <Modal
          title="????????????"
          width={640}
          destroyOnClose
          visible={signedModalVisible}
          {...signedModalFooter}
        >
          {getSignedModalContent()}
        </Modal>
        <Modal
          title="????????????"
          width={800}
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

export default Pack;
