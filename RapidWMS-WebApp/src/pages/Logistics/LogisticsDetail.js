import React, { PureComponent } from 'react';
import accounting from 'accounting';
import { connect } from 'dva';
import { Card, Form, Input, Table, Tag, DatePicker } from 'antd';

import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import Highlighter from 'react-highlight-words';
import styles from '../Common.less';

const { RangePicker } = DatePicker;
const { Search } = Input;

@connect(({ logisticsDetail, loading }) => ({
  list: logisticsDetail.list.content,
  total: logisticsDetail.list.totalElements,
  loading: loading.models.logisticsDetail,
}))
@Form.create()
class LogisticsDetail extends PureComponent {
  state = {
    currentPage: 1,
    pageSize: 10,
    orderBy: null,
    search: null,
    startDate: null,
    endDate: null,
  };

  formLayout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 13 },
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const { search, pageSize, currentPage, orderBy, startDate, endDate } = this.state;
    this.handleQuery(dispatch, search, startDate, endDate, pageSize, currentPage, orderBy);
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

  handleQuery = (dispatch, search, startDate, endDate, pageSize, currentPage, orderBy) => {
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
      type: 'logisticsDetail/fetch',
      payload: {
        search,
        startDate: startDateString,
        endDate: endDateString,
        pageSize,
        currentPage,
        orderBy,
      },
    });
  };

  handleTotal = (total, range) => {
    return `??????${total}?????????????????????${range[0]}-${range[1]}???`;
  };

  handleTableChange = (pagination, filters, sorter) => {
    const { dispatch } = this.props;
    const { search, startDate, endDate } = this.state;
    const { current: currentPage, pageSize } = pagination;
    const { field, order } = sorter;
    const orderBy = field !== undefined ? `${field},${order}` : null;
    this.setState({
      currentPage,
      pageSize,
      orderBy,
    });
    this.handleQuery(dispatch, search, startDate, endDate, pageSize, currentPage, orderBy);
  };

  handleDateRangeChange = date => {
    const startDate = date[0];
    const endDate = date[1];
    this.setState({
      startDate,
      endDate,
    });
    const { dispatch } = this.props;
    const { pageSize, search } = this.state;
    this.setState({
      currentPage: 1,
      orderBy: null,
    });
    this.handleQuery(dispatch, search, startDate, endDate, pageSize, 1, null);
  };

  render() {
    const { search, startDate, endDate } = this.state;
    const { list, total, loading } = this.props;
    const { pageSize, currentPage } = this.state;

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
          placeholder="???????????????????????????"
          onChange={this.handleSearchChange}
          onSearch={this.handleSearchByName}
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
        width: '3%',
        key: 'index',
        render: (text, record, index) => `${index + 1}`,
      },
      {
        title: '??????',
        dataIndex: 'name',
        key: 'name',
        width: '5%',
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
        title: '???',
        dataIndex: 'province',
        key: 'province',
        width: '2%',
      },
      {
        title: '??????',
        dataIndex: 'customer',
        key: 'customer',
        width: '5%',
      },
      {
        title: '????????????',
        dataIndex: 'address',
        key: 'address',
        width: '5%',
      },
      {
        title: '??????',
        dataIndex: 'bill',
        key: 'bill',
        width: '5%',
      },
      {
        title: '??????',
        dataIndex: 'piece',
        key: 'piece',
        width: '2%',
      },
      {
        title: '?????????????????????',
        dataIndex: 'realityWeight',
        key: 'realityWeight',
        width: '5%',
      },
      {
        title: '?????????????????????',
        dataIndex: 'computeWeight',
        key: 'computeWeight',
        width: '5%',
      },
      {
        title: '??????/????????????',
        dataIndex: 'renewNum',
        key: 'renewNum',
        width: '5%',
      },
      {
        title: '??????',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        width: '5%',
        render: text => {
          return <Tag color="blue">{accounting.formatMoney(text / 100, '???')}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'remark',
        key: 'remark',
        width: '10%',
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
      </PageHeaderWrapper>
    );
  }
}

export default LogisticsDetail;
