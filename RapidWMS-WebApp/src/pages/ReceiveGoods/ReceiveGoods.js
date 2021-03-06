import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  notification,
  Popconfirm,
  Table,
  Tag,
} from 'antd';

import Highlighter from 'react-highlight-words';
import moment from 'moment';
import router from 'umi/router';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './ReceiveGoods.less';

const { Search } = Input;
const { RangePicker } = DatePicker;

const initialSortState = {
  sortCustomer: null,
  sortCreator: null,
  sortAuditor: null,
  sortCreateTime: null,
  sortAuditTime: null,
  sortFlowSn: null,
};

const initialState = {
  currentPage: 1,
  pageSize: 10,
  orderBy: null,
  search: null,
  customerFilter: null,
  receiveGoodsTypeFilter: null,
  isAuditedFilter: null,
  startDate: null,
  endDate: null,
  ...initialSortState,
};

@connect(({ receiveGoods, customer, loading }) => ({
  list: receiveGoods.list.content,
  total: receiveGoods.list.totalElements,
  customerList: customer.allList,
  loading: loading.models.receiveGoods && loading.models.customer,
}))
@Form.create()
class ReceiveGoods extends PureComponent {
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
      customerFilter,
      receiveGoodsTypeFilter,
      isAuditedFilter,
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
        customerFilter,
        receiveGoodsTypeFilter,
        isAuditedFilter
      );
    }
    dispatch({
      type: 'customer/fetchMy',
    });
  }

  reloadPage = () => {
    const { dispatch } = this.props;
    const {
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      receiveGoodsTypeFilter,
      isAuditedFilter,
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
      receiveGoodsTypeFilter,
      isAuditedFilter
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
      receiveGoodsTypeFilter,
      isAuditedFilter,
    } = this.state;
    return {
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      receiveGoodsTypeFilter,
      isAuditedFilter,
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
      receiveGoodsTypeFilter,
      isAuditedFilter,
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
        receiveGoodsTypeFilter,
        isAuditedFilter,
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
        null
      );
    });
    router.push('/warehouse/receiveGoods');
  };

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

  handleIsAuditFilters = () => {
    const isAuditedFilters = [];
    isAuditedFilters.push({ text: '???', value: true });
    isAuditedFilters.push({ text: '???', value: false });
    return isAuditedFilters;
  };

  handleReceiveGoodsTypeFilter = () => {
    const receiveGoodsTypeFilter = [];
    receiveGoodsTypeFilter.push({ text: '????????????', value: '0' });
    receiveGoodsTypeFilter.push({ text: '????????????', value: '1' });
    receiveGoodsTypeFilter.push({ text: '????????????', value: '2' });
    receiveGoodsTypeFilter.push({ text: '????????????', value: '3' });
    return receiveGoodsTypeFilter;
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
      receiveGoodsTypeFilter,
      isAuditedFilter,
    } = this.state;
    this.setState({
      currentPage: 1,
      orderBy: null,
    });
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
      receiveGoodsTypeFilter,
      isAuditedFilter
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
      receiveGoodsTypeFilter,
      isAuditedFilter,
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
      receiveGoodsTypeFilter,
      isAuditedFilter
    );
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
      receiveGoodsTypeFilter,
      isAuditedFilter,
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
      receiveGoodsTypeFilter,
      isAuditedFilter
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
    receiveGoodsTypeFilter,
    isAuditedFilter
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
      type: 'receiveGoods/fetch',
      payload: {
        exportExcel,
        search,
        startDate: startDateString,
        endDate: endDateString,
        pageSize,
        currentPage,
        orderBy,
        customerFilter,
        receiveGoodsTypeFilter,
        isAuditedFilter,
      },
    });
  };

  handleTotal = (total, range) => {
    return `??????${total}?????????????????????${range[0]}-${range[1]}???`;
  };

  getSortOrders = (field, order) => {
    let sortOrders;
    switch (field) {
      case 'customer.name':
        sortOrders = { ...initialSortState, sortCustomer: order };
        break;
      case 'creator':
        sortOrders = { ...initialSortState, sortCreator: order };
        break;
      case 'auditor':
        sortOrders = { ...initialSortState, sortAuditor: order };
        break;
      case 'createTime':
        sortOrders = { ...initialSortState, sortCreateTime: order };
        break;
      case 'auditTime':
        sortOrders = { ...initialSortState, sortAuditTime: order };
        break;
      case 'flowSn':
        sortOrders = { ...initialSortState, sortFlowSn: order };
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
      'customer.name': customerFilter = null,
      receiveGoodsType: receiveGoodsTypeFilter = null,
      isAudited: isAuditedFilter = null,
    } = filters;
    const orderBy = field !== undefined ? `${field},${order}` : null;

    const sortOrders = this.getSortOrders(field, order);

    this.setState({
      currentPage,
      pageSize,
      orderBy,
      customerFilter,
      receiveGoodsTypeFilter,
      isAuditedFilter,
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
      receiveGoodsTypeFilter,
      isAuditedFilter
    );
  };

  getSearchParams = () => {
    const {
      search,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      receiveGoodsTypeFilter,
      isAuditedFilter,
    } = this.state;

    let startDateString = null;
    let endDateString = null;
    if (startDate !== null && startDate !== undefined) {
      startDateString = startDate.toString();
    }
    if (endDate !== null && endDate !== undefined) {
      endDateString = endDate.toString();
    }

    return {
      search,
      startDate: startDateString,
      endDate: endDateString,
      pageSize,
      currentPage,
      orderBy,
      customerFilter,
      receiveGoodsTypeFilter,
      isAuditedFilter,
    };
  };

  handleAddReceiveGoods = () => {
    router.push({
      pathname: '/aog/addReceiveGoods',
      query: {
        queryParams: this.getQueryParams(),
      },
    });
  };

  handleAddUnloadGoods = () => {
    router.push({
      pathname: '/aog/unloadReceiveGoods',
      query: {
        queryParams: this.getQueryParams(),
      },
    });
  };

  editReceiveGoods = item => {
    router.push({
      pathname: `/aog/editReceiveGoods/${item.id}`,
      query: {
        queryParams: this.getQueryParams(),
      },
    });
  };

  auditReceiveGoods = item => {
    router.push({
      pathname: `/warehouse/auditReceiveGoods/${item.id}`,
      query: {
        queryParams: this.getQueryParams(),
      },
    });
  };

  addUnloadReceiveGoods = item => {
    const { dispatch } = this.props;
    dispatch({
      type: 'unloadGoods/putInStorage',
      payload: { id: item.id },
      callback: response => {
        if (response.status === 400) {
          notification.error({
            message: '??????????????????',
            description: response.message,
          });
        } else {
          message.success('?????????');
          this.handleSearch();
        }
      },
    });
  };

  viewReceiveGoods = item => {
    router.push({
      pathname: `/warehouse/viewReceiveGoods/${item.id}`,
      query: {
        queryParams: this.getQueryParams(),
      },
    });
  };

  confirmDelete = item => {
    const { dispatch } = this.props;
    dispatch({
      type: 'receiveGoods/delete',
      payload: item.id,
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
            startDate,
            endDate,
            pageSize,
            currentPage,
            orderBy,
            customerFilter,
            receiveGoodsTypeFilter,
            isAuditedFilter,
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
            receiveGoodsTypeFilter,
            isAuditedFilter
          );
        }
      },
    });
  };

  cancelAudit = item => {
    const { dispatch } = this.props;
    dispatch({
      type: 'receiveGoods/cancelAudit',
      payload: { receiveGoodsId: item.id },
      callback: response => {
        if (response.status === 400) {
          notification.error({
            message: '??????????????????',
            description: response.message,
          });
        } else {
          message.success('?????????????????????');
          const {
            search,
            startDate,
            endDate,
            pageSize,
            currentPage,
            orderBy,
            customerFilter,
            receiveGoodsTypeFilter,
            isAuditedFilter,
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
            receiveGoodsTypeFilter,
            isAuditedFilter
          );
        }
      },
    });
  };

  render() {
    const { list, total, loading } = this.props;
    const { pageSize, currentPage } = this.state;
    const { search, startDate, endDate } = this.state;
    const { customerFilter, receiveGoodsTypeFilter, isAuditedFilter } = this.state;

    const {
      sortCustomer,
      sortCreator,
      sortAuditor,
      sortCreateTime,
      sortAuditTime,
      sortFlowSn,
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
        dataIndex: 'isAudited',
        key: 'isAudited',
        width: '5%',
        align: 'center',
        filters: this.handleIsAuditFilters(),
        filteredValue: isAuditedFilter,
        filterMultiple: false,
        render: text => {
          if (!text) {
            return <Tag color="#FF8C00">?????????</Tag>;
          }
          return <Tag color="blue">?????????</Tag>;
        },
      },
      {
        title: '?????????',
        dataIndex: 'flowSn',
        key: 'flowSn',
        width: '6%',
        sorter: true,
        sortOrder: sortFlowSn,
        render: text => {
          if (text) {
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
        title: '????????????',
        dataIndex: 'customer.name',
        key: 'customer.name',
        width: '20%',
        sorter: true,
        sortOrder: sortCustomer,
        filters: this.handleCustomerFilters(),
        filteredValue: customerFilter,
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
        title: '????????????',
        dataIndex: 'receiveGoodsType',
        key: 'receiveGoodsType',
        width: '8%',
        align: 'center',
        filters: this.handleReceiveGoodsTypeFilter(),
        filteredValue: receiveGoodsTypeFilter,
        render: text => {
          let result;
          let color;
          switch (text) {
            case 'NEW':
              result = '????????????';
              color = '#DB7093';
              break;
            case 'REJECTED':
              result = '????????????';
              color = '#FF8C00';
              break;
            case 'POLICY':
              result = '????????????';
              color = '#DB7093';
              break;
            case 'OTHER':
              result = '????????????';
              color = '#DB7093';
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
        dataIndex: 'description',
        key: 'description',
        width: '15%',
        render: text => {
          if (text) {
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
        title: '????????????',
        dataIndex: 'createTime',
        key: 'createTime',
        width: '8%',
        sorter: true,
        sortOrder: sortCreateTime,
        render: text => {
          return <Tag>{moment(text).format('lll')}</Tag>;
        },
      },
      {
        title: '?????????',
        dataIndex: 'creator',
        key: 'creator',
        width: '6%',
        sorter: true,
        sortOrder: sortCreator,
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
        title: '????????????',
        dataIndex: 'auditTime',
        key: 'auditTime',
        width: '8%',
        sorter: true,
        sortOrder: sortAuditTime,
        render: text => {
          if (text === null || text === undefined) {
            return <Tag color="#A9A9A9">???</Tag>;
          }
          return <Tag>{moment(text).format('lll')}</Tag>;
        },
      },
      {
        title: '?????????',
        dataIndex: 'auditor',
        key: 'auditor',
        width: '6%',
        sorter: true,
        sortOrder: sortAuditor,
        render: text => {
          if (text != null) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[search]}
                autoEscape
                textToHighlight={text.toString()}
              />
            );
          }
          return <Tag color="#A9A9A9">???</Tag>;
        },
      },
      {
        title: '??????',
        width: '15%',
        align: 'right',
        render: (text, row) => {
          if (!row.isAudited) {
            if (!row.isUnload) {
              return (
                <span>
                  <Button
                    style={{ marginRight: 5 }}
                    htmlType="button"
                    type="primary"
                    size="small"
                    onClick={e => {
                      e.preventDefault();
                      this.addUnloadReceiveGoods(row);
                    }}
                  >
                    ??????
                  </Button>
                  <Button
                    style={{ marginRight: 5 }}
                    htmlType="button"
                    size="small"
                    onClick={e => {
                      e.preventDefault();
                      this.editReceiveGoods(row);
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
                    <Button htmlType="button" href="#" type="danger" size="small">
                      ??????
                    </Button>
                  </Popconfirm>
                </span>
              );
            }
            return (
              <span>
                <Button
                  style={{ marginRight: 5 }}
                  htmlType="button"
                  type="primary"
                  size="small"
                  onClick={e => {
                    e.preventDefault();
                    this.auditReceiveGoods(row);
                  }}
                >
                  ??????
                </Button>
                <Button
                  style={{ marginRight: 5 }}
                  htmlType="button"
                  size="small"
                  onClick={e => {
                    e.preventDefault();
                    this.editReceiveGoods(row);
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
                  <Button htmlType="button" href="#" type="danger" size="small">
                    ??????
                  </Button>
                </Popconfirm>
              </span>
            );
          }
          return (
            <span className={styles.buttons}>
              <Popconfirm
                title="?????? ??????"
                onConfirm={() => this.cancelAudit(row)}
                okText="????????????"
                cancelText="??????"
              >
                <Button htmlType="button" href="#" type="danger" size="small">
                  ????????????
                </Button>
              </Popconfirm>
              <Button
                htmlType="button"
                type="primary"
                size="small"
                onClick={e => {
                  e.preventDefault();
                  this.viewReceiveGoods(row);
                }}
              >
                ??????
              </Button>
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
            <div className={styles.tableList}>
              <div className={styles.tableListOperator}>
                <Button
                  icon="plus"
                  htmlType="button"
                  type="primary"
                  onClick={this.handleAddUnloadGoods}
                >
                  ????????????
                </Button>
                <Button icon="search" htmlType="button" onClick={this.handleResetSearch}>
                  ??????????????????
                </Button>
              </div>
              <Table
                columns={columns}
                dataSource={list}
                rowKey="id"
                loading={loading}
                pagination={paginationProps}
                onChange={this.handleTableChange}
                size="middle"
                onRow={record => {
                  return {
                    onDoubleClick: () => {
                      this.viewReceiveGoods(record);
                    },
                  };
                }}
              />
            </div>
          </Card>
        </div>
      </PageHeaderWrapper>
    );
  }
}

export default ReceiveGoods;
