import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Card, Form, Input, Popover, Table, Tag, DatePicker, Icon } from 'antd';
import accounting from 'accounting';

import Highlighter from 'react-highlight-words';
import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './StockFlow.less';

const { Search } = Input;
const { RangePicker } = DatePicker;

const initialSortState = {
  sortCreateTime: null,
  sortOperator: null,
  sortName: null,
  sortSn: null,
  sortQuantity: null,
  sortWarePositionIn: null,
  sortWarePositionOut: null,
};

const initialState = {
  currentPage: 1,
  pageSize: 10,
  orderBy: null,
  search: null,
  searchWarePositionIn: null,
  searchWarePositionOut: null,
  startDate: null,
  endDate: null,
  flowOperateTypeFilter: null,
  customerFilter: null,
  wareZoneInFilter: null,
  wareZoneOutFilter: null,
  ...initialSortState,
};

@connect(({ stockFlow, wareZone, customer, loading }) => ({
  list: stockFlow.list.content,
  total: stockFlow.list.totalElements,
  wareZoneList: wareZone.allList,
  customerList: customer.allList,
  loading: loading.models.stockFlow && loading.models.wareZone && loading.models.customer,
}))
@Form.create()
class StockFlow extends PureComponent {
  state = initialState;

  formLayout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 13 },
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const {
      search,
      searchWarePositionIn,
      searchWarePositionOut,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter,
    } = this.state;
    this.handleQuery(
      dispatch,
      false,
      search,
      searchWarePositionIn,
      searchWarePositionOut,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter
    );
    dispatch({
      type: 'wareZone/fetchAll',
    });
    dispatch({
      type: 'customer/fetchMy',
    });
  }

  handleQuery = (
    dispatch,
    exportExcel,
    search,
    searchWarePositionIn,
    searchWarePositionOut,
    startDate,
    endDate,
    pageSize,
    currentPage,
    orderBy,
    flowOperateTypeFilter,
    customerFilter,
    wareZoneInFilter,
    wareZoneOutFilter
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
      type: 'stockFlow/fetch',
      payload: {
        exportExcel,
        search,
        searchWarePositionIn,
        searchWarePositionOut,
        startDate: startDateString,
        endDate: endDateString,
        pageSize,
        currentPage,
        orderBy,
        flowOperateTypeFilter,
        customerFilter,
        wareZoneInFilter,
        wareZoneOutFilter,
      },
    });
  };

  handleExportExcel = () => {
    const { dispatch } = this.props;
    const {
      search,
      searchWarePositionIn,
      searchWarePositionOut,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter,
    } = this.state;
    this.handleQuery(
      dispatch,
      true,
      search,
      searchWarePositionIn,
      searchWarePositionOut,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter
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
        null
      );
    });
  };

  handleOperateTypeFilter = () => {
    const flowOperateTypeFilter = [];
    flowOperateTypeFilter.push({ text: '??????-????????????', value: '0' });
    flowOperateTypeFilter.push({ text: '??????-????????????', value: '1' });
    flowOperateTypeFilter.push({ text: '??????-????????????', value: '2' });
    flowOperateTypeFilter.push({ text: '??????-????????????', value: '3' });
    flowOperateTypeFilter.push({ text: '??????-????????????', value: '4' });
    flowOperateTypeFilter.push({ text: '??????-????????????', value: '5' });
    return flowOperateTypeFilter;
  };

  handleCustomerFilter = () => {
    const { customerList } = this.props;
    const customerFilters = [];
    if (customerList && customerList !== undefined) {
      customerList.map(customer => {
        return customerFilters.push({ text: customer.name, value: customer.id });
      });
    }
    return customerFilters;
  };

  handleWareZoneFilters = () => {
    const { wareZoneList } = this.props;
    const wareZoneFilter = [];
    if (wareZoneList) {
      wareZoneList.map(wareZone => {
        return wareZoneFilter.push({ text: wareZone.name, value: wareZone.id });
      });
    }
    return wareZoneFilter;
  };

  handleSearchChange = e => {
    this.setState({
      search: e.target.value,
    });
  };

  handleWarePositionInSearchChange = e => {
    this.setState({
      searchWarePositionIn: e.target.value,
    });
  };

  handleWarePositionOutSearchChange = e => {
    this.setState({
      searchWarePositionOut: e.target.value,
    });
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
      searchWarePositionIn,
      searchWarePositionOut,
      pageSize,
      currentPage,
      orderBy,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter,
    } = this.state;
    this.handleQuery(
      dispatch,
      false,
      search,
      searchWarePositionIn,
      searchWarePositionOut,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter
    );
  };

  handleSearch = () => {
    const { dispatch } = this.props;
    const {
      search,
      searchWarePositionIn,
      searchWarePositionOut,
      startDate,
      endDate,
      pageSize,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter,
    } = this.state;
    this.setState({
      currentPage: 1,
      orderBy: null,
    });
    this.handleQuery(
      dispatch,
      false,
      search,
      searchWarePositionIn,
      searchWarePositionOut,
      startDate,
      endDate,
      pageSize,
      1,
      null,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter
    );
  };

  handleTotal = (total, range) => {
    return `??????${total}?????????????????????${range[0]}-${range[1]}???`;
  };

  handleTableChange = (pagination, filters, sorter) => {
    const { dispatch } = this.props;
    const { search, searchWarePositionIn, searchWarePositionOut, startDate, endDate } = this.state;
    const { current: currentPage, pageSize } = pagination;
    const { field, order } = sorter;
    const {
      flowOperateType: flowOperateTypeFilter = null,
      'goods.customer.name': customerFilter = null,
      'warePositionIn.wareZone.name': wareZoneInFilter = null,
      'warePositionOut.wareZone.name': wareZoneOutFilter = null,
    } = filters;
    const orderBy = field !== undefined ? `${field},${order}` : null;

    let sortOrders;
    switch (field) {
      case 'createTime':
        sortOrders = { ...initialSortState, sortCreateTime: order };
        break;
      case 'operator':
        sortOrders = { ...initialSortState, sortOperator: order };
        break;
      case 'name':
        sortOrders = { ...initialSortState, sortName: order };
        break;
      case 'sn':
        sortOrders = { ...initialSortState, sortSn: order };
        break;
      case 'quantity':
        sortOrders = { ...initialSortState, sortQuantity: order };
        break;
      case 'warePositionIn.name':
        sortOrders = { ...initialSortState, sortWarePositionIn: order };
        break;
      case 'warePositionOut.name':
        sortOrders = { ...initialSortState, sortWarePositionOut: order };
        break;
      default:
        sortOrders = initialSortState;
    }

    this.setState({
      currentPage,
      pageSize,
      orderBy,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter,
      ...sortOrders,
    });
    this.handleQuery(
      dispatch,
      false,
      search,
      searchWarePositionIn,
      searchWarePositionOut,
      startDate,
      endDate,
      pageSize,
      currentPage,
      orderBy,
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter
    );
  };

  render() {
    const { list, total, loading } = this.props;
    const { pageSize, currentPage } = this.state;
    const { search, searchWarePositionIn, searchWarePositionOut, startDate, endDate } = this.state;
    const {
      flowOperateTypeFilter,
      customerFilter,
      wareZoneInFilter,
      wareZoneOutFilter,
    } = this.state;

    const {
      sortCreateTime,
      sortOperator,
      sortName,
      sortSn,
      sortQuantity,
      sortWarePositionIn,
      sortWarePositionOut,
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
          placeholder="?????????/??????/??????"
          onChange={this.handleSearchChange}
          onSearch={this.handleSearch}
        />
        <Search
          value={searchWarePositionIn}
          className={styles.warePosition}
          placeholder="????????????"
          onChange={this.handleWarePositionInSearchChange}
          onSearch={this.handleSearch}
        />
        <Search
          value={searchWarePositionOut}
          className={styles.warePosition}
          placeholder="????????????"
          onChange={this.handleWarePositionOutSearchChange}
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
        title: '??????',
        dataIndex: 'flowOperateType',
        key: 'flowOperateType',
        width: '1%',
        filters: this.handleOperateTypeFilter(),
        filteredValue: flowOperateTypeFilter,
        render: text => {
          let result;
          let color;
          switch (text) {
            case 'IN_ADD':
              result = '??????-????????????';
              color = '#DC143C';
              break;
            case 'IN_CUSTOMER_REJECTED':
              result = '??????-????????????';
              color = '#DDA0DD';
              break;
            case 'IN_PROFIT':
              result = '??????-????????????';
              color = '#191970';
              break;
            case 'OUT_LOSSES':
              result = '??????-????????????';
              color = '#FF8C00';
              break;
            case 'OUT_ORDER_FIT':
              result = '??????-????????????';
              color = '#00BFFF';
              break;
            case 'MOVE':
              result = '??????-????????????';
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
        dataIndex: 'goods.customer.shortNameCn',
        key: 'goods.customer.name',
        width: '5%',
        filters: this.handleCustomerFilter(),
        filteredValue: customerFilter,
      },
      {
        title: '??????',
        dataIndex: 'createTime',
        key: 'createTime',
        width: '1%',
        sorter: true,
        sortOrder: sortCreateTime,
        render: text => {
          return <Tag>{moment(text).format('YYYY-MM-DD/HH:mm')}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'operator',
        key: 'operator',
        width: '5%',
        sorter: true,
        sortOrder: sortOperator,
      },
      {
        title: '??????',
        dataIndex: 'price',
        key: 'price',
        width: '5%',
        render: text => {
          return <Tag>{accounting.formatMoney(text, '???')}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'description',
        key: 'description',
        width: '8%',
      },
      {
        title: '????????????',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        sortOrder: sortName,
        render: (text, record) => {
          const tooltip = (
            <div>
              <p>
                <b>??????</b>: {accounting.formatMoney(record.price, '???')}
              </p>
              <p>
                <b>?????????</b>: {moment(record.expireDate).format('YYYY-MM-DD')}
              </p>
              <p>
                <b>??????</b>: {record.packCount}
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
        title: '????????????',
        dataIndex: 'sn',
        key: 'sn',
        width: '10%',
        sorter: true,
        sortOrder: sortSn,
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
        dataIndex: 'quantity',
        key: 'quantity',
        width: '5%',
        sorter: true,
        sortOrder: sortQuantity,
        render: (text, record) => {
          let iconType;
          switch (record.flowOperateType) {
            case 'IN_ADD':
            case 'IN_CUSTOMER_REJECTED':
            case 'IN_STOCK_REJECTED':
            case 'IN_ORDER_REJECTED':
            case 'IN_PROFIT':
              iconType = '+';
              break;
            case 'OUT_LOSSES':
            case 'OUT_ORDER_FIT':
              iconType = '-';
              break;
            case 'MOVE':
              iconType = '~';
              break;
            default:
              iconType = '?';
              break;
          }
          return `${iconType}${text}`;
        },
      },
      {
        title: '?????????',
        dataIndex: 'expireDate',
        key: 'expireDate',
        width: '1%',
        render: text => {
          return <Tag>{moment(text).format('YYYY-MM-DD')}</Tag>;
        },
      },
      {
        title: '????????????',
        dataIndex: 'warePositionIn.wareZone.name',
        key: 'warePositionIn.wareZone.name',
        width: '8%',
        filters: this.handleWareZoneFilters(),
        filteredValue: wareZoneInFilter,
        render: text => {
          if (text == null) {
            return <Tag color="#A9A9A9">???</Tag>;
          }
          return text;
        },
      },
      {
        title: '????????????',
        dataIndex: 'warePositionIn.name',
        key: 'warePositionIn.name',
        width: '6%',
        sorter: true,
        sortOrder: sortWarePositionIn,
        render: text => {
          if (text != null) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[searchWarePositionIn]}
                autoEscape
                textToHighlight={text !== null && text !== undefined ? text.toString() : ''}
              />
            );
          }
          return <Tag color="#A9A9A9">???</Tag>;
        },
      },
      {
        title: '????????????',
        dataIndex: 'warePositionOut.wareZone.name',
        key: 'warePositionOut.wareZone.name',
        width: '8%',
        filters: this.handleWareZoneFilters(),
        filteredValue: wareZoneOutFilter,
        render: text => {
          if (text == null) {
            return <Tag color="#A9A9A9">???</Tag>;
          }
          return text;
        },
      },
      {
        title: '????????????',
        dataIndex: 'warePositionOut.name',
        key: 'warePositionOut.name',
        width: '6%',
        sorter: true,
        sortOrder: sortWarePositionOut,
        render: text => {
          if (text != null) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[searchWarePositionOut]}
                autoEscape
                textToHighlight={text !== null && text !== undefined ? text.toString() : ''}
              />
            );
          }
          return <Tag color="#A9A9A9">???</Tag>;
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
            <div className={styles.tableList}>
              <div className={styles.tableListOperator}>
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
                size="small"
              />
            </div>
          </Card>
        </div>
      </PageHeaderWrapper>
    );
  }
}

export default StockFlow;
