import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  notification,
  Table,
  Tag,
  Tooltip,
  Cascader,
  Popconfirm,
  DatePicker,
} from 'antd';
import accounting from 'accounting';

import Highlighter from 'react-highlight-words';

import moment from 'moment';
import FormItem from 'antd/es/form/FormItem';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './Stock.less';

const { Search } = Input;

const initialSortState = {
  sortGoods: null,
  sortWarePosition: null,
  sortWareZone: null,
  sortQuantity: null,
  sortGoodsType: null,
  sortPrice: null,
  sortExpireDate: null,
  sortWarranty: null,
  sortPackCount: null,
  sortCustomer: null,
  quantityGuarantee: null,
};

const initialModalState = {
  singleModalVisible: false,
  singleType: null,
  multipleModalVisible: false,
  multipleType: null,
  done: false,
};

const initialState = {
  currentPage: 1,
  pageSize: 10,
  orderBy: null,
  search: null,
  quantityGuaranteeSearch: null,
  wareZoneFilter: null,
  customerFilter: null,
  goodsTypeFilter: null,
  isActiveFilter: null,
  selectedRowKeys: [],
  selectedRows: [],
  ...initialSortState,
  ...initialModalState,
};

@connect(({ stock, wareZone, customer, goodsType, loading }) => ({
  list: stock.list.content,
  total: stock.list.totalElements,
  wareZoneList: wareZone.allList,
  wareZoneTree: wareZone.tree,
  customerList: customer.allList,
  goodsTypeList: goodsType.allList,
  loading:
    loading.models.stock &&
    loading.models.wareZone &&
    loading.models.customer &&
    loading.models.goodsType,
}))
@Form.create()
class Stock extends PureComponent {
  state = initialState;

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
      wareZoneFilter,
      customerFilter,
      goodsTypeFilter,
      isActiveFilter,
      quantityGuaranteeSearch,
    } = this.state;
    this.handleQuery(
      dispatch,
      false,
      search,
      pageSize,
      currentPage,
      orderBy,
      wareZoneFilter,
      customerFilter,
      goodsTypeFilter,
      isActiveFilter,
      quantityGuaranteeSearch
    );
    dispatch({
      type: 'wareZone/fetchAll',
    });
    dispatch({
      type: 'wareZone/fetchTree',
    });
    dispatch({
      type: 'customer/fetchMy',
    });
    dispatch({
      type: 'goodsType/fetchAll',
    });
  }

  handleResetSearch = () => {
    this.setState(initialState, () => {
      const { dispatch } = this.props;
      const { pageSize, currentPage } = this.state;
      this.handleQuery(dispatch, false, null, pageSize, currentPage, null, null, null, null, null);
    });
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

  handleIsActiveFilters = () => {
    const isActiveFilters = [];
    isActiveFilters.push({ text: '??????', value: true });
    isActiveFilters.push({ text: '??????', value: false });
    return isActiveFilters;
  };

  handleSearchChange = e => {
    this.setState({
      search: e.target.value,
    });
  };

  handleSearchChange2 = e => {
    this.setState({
      quantityGuaranteeSearch: e.target.value,
    });
  };

  handleSearch = () => {
    const { dispatch } = this.props;
    const {
      pageSize,
      wareZoneFilter,
      customerFilter,
      goodsTypeFilter,
      isActiveFilter,
    } = this.state;
    let { search, quantityGuaranteeSearch } = this.state;
    search = search === '' ? '' : search;
    quantityGuaranteeSearch = quantityGuaranteeSearch === '' ? '' : quantityGuaranteeSearch;
    this.setState({
      currentPage: 1,
      orderBy: null,
    });
    this.cleanSelectedKeys();
    this.handleQuery(
      dispatch,
      false,
      search,
      pageSize,
      1,
      null,
      wareZoneFilter,
      customerFilter,
      goodsTypeFilter,
      isActiveFilter,
      quantityGuaranteeSearch
    );
  };

  handleQuery = (
    dispatch,
    exportExcel,
    search,
    pageSize,
    currentPage,
    orderBy,
    wareZoneFilter,
    customerFilter,
    goodsTypeFilter,
    isActiveFilter,
    quantityGuaranteeSearch
  ) => {
    dispatch({
      type: 'stock/fetch',
      payload: {
        exportExcel,
        search,
        pageSize,
        currentPage,
        orderBy,
        wareZoneFilter,
        customerFilter,
        goodsTypeFilter,
        isActiveFilter,
        quantityGuaranteeSearch,
      },
    });
  };

  handleTotal = (total, range) => {
    return `??????${total}?????????????????????${range[0]}-${range[1]}???`;
  };

  handleTableChange = (pagination, filters, sorter) => {
    const { dispatch } = this.props;
    const { search, quantityGuaranteeSearch } = this.state;
    const { current: currentPage, pageSize } = pagination;
    const { field, order } = sorter;
    const {
      'warePosition.wareZone.name': wareZoneFilter = null,
      'goods.customer.name': customerFilter = null,
      'goods.goodsType.name': goodsTypeFilter = null,
      isActive: isActiveFilter = null,
    } = filters;
    const orderBy = field !== undefined ? `${field},${order}` : null;

    let sortOrders;
    switch (field) {
      case 'goods.name':
        sortOrders = { ...initialSortState, sortGoods: order };
        break;
      case 'warePosition.name':
        sortOrders = { ...initialSortState, sortWarePosition: order };
        break;
      case 'warePosition.wareZone.name':
        sortOrders = { ...initialSortState, sortWareZone: order };
        break;
      case 'quantity':
        sortOrders = { ...initialSortState, sortQuantity: order };
        break;
      case 'goods.goodsType.name':
        sortOrders = { ...initialSortState, sortGoodsType: order };
        break;
      case 'goods.price':
        sortOrders = { ...initialSortState, sortPrice: order };
        break;
      case 'expireDate':
        sortOrders = { ...initialSortState, sortExpireDate: order };
        break;
      case 'goods.monthsOfWarranty':
        sortOrders = { ...initialSortState, sortWarranty: order };
        break;
      case 'goods.packCount':
        sortOrders = { ...initialSortState, sortPackCount: order };
        break;
      case 'goods.customer.name':
        sortOrders = { ...initialSortState, sortCustomer: order };
        break;
      case 'quantityGuarantee':
        sortOrders = { ...initialSortState, quantityGuarantee: order };
        break;
      default:
        sortOrders = initialSortState;
    }

    this.setState({
      currentPage,
      pageSize,
      orderBy,
      wareZoneFilter,
      customerFilter,
      goodsTypeFilter,
      isActiveFilter,
      ...sortOrders,
    });
    this.cleanSelectedKeys();
    this.handleQuery(
      dispatch,
      false,
      search,
      pageSize,
      currentPage,
      orderBy,
      wareZoneFilter,
      customerFilter,
      goodsTypeFilter,
      isActiveFilter,
      quantityGuaranteeSearch
    );
  };

  handleStockList = list => {
    if (!list) {
      return null;
    }
    return list.map(item => {
      return { ...item, customerName: item.customer ? item.customer.name : null };
    });
  };

  handleSelectRows = (selectedRowKeys, selectedRows) => {
    this.setState({
      selectedRowKeys,
      selectedRows,
    });
  };

  cleanSelectedKeys = () => {
    this.setState({
      selectedRowKeys: [],
      selectedRows: [],
    });
  };

  handleActivate = () => {
    this.handleActivateByValue(true);
  };

  handleDeActivate = () => {
    this.handleActivateByValue(false);
  };

  handleActivateByValue = value => {
    const { selectedRowKeys } = this.state;
    const { dispatch } = this.props;
    const {
      search,
      pageSize,
      currentPage,
      orderBy,
      wareZoneFilter,
      customerFilter,
      goodsTypeFilter,
      isActiveFilter,
      quantityGuaranteeSearch,
    } = this.state;
    dispatch({
      type: 'stock/activate',
      payload: { selectedRowKeys, isActive: value },
      callback: response => {
        if (response.status === 400) {
          notification.error({
            message: '??????????????????',
            description: response.message,
          });
        } else {
          message.success('???????????????');
          this.handleQuery(
            dispatch,
            false,
            search,
            pageSize,
            currentPage,
            orderBy,
            wareZoneFilter,
            customerFilter,
            goodsTypeFilter,
            isActiveFilter,
            quantityGuaranteeSearch
          );
        }
      },
    });
    this.setState({
      selectedRows: [],
      selectedRowKeys: [],
    });
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

    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleSingleDone();
      dispatch({
        type: 'stock/singleOperate',
        payload: fieldsValue,
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
              wareZoneFilter,
              customerFilter,
              goodsTypeFilter,
              isActiveFilter,
              quantityGuaranteeSearch,
            } = this.state;
            this.cleanSelectedKeys();
            this.handleQuery(
              dispatch,
              false,
              search,
              pageSize,
              currentPage,
              orderBy,
              wareZoneFilter,
              customerFilter,
              goodsTypeFilter,
              isActiveFilter,
              quantityGuaranteeSearch
            );
          }
        },
      });
    });
  };

  handleSingleMove = () => {
    this.setState({
      singleType: 'move',
    });
    this.showSingleModal();
  };

  handleSingleIncrease = () => {
    this.setState({
      singleType: 'increase',
    });
    this.showSingleModal();
  };

  handleSingleDecrease = () => {
    this.setState({
      singleType: 'decrease',
    });
    this.showSingleModal();
  };

  handleSingleChangeExpireDate = () => {
    this.setState({
      singleType: 'expireDate',
    });
    this.showSingleModal();
  };

  showMultipleModal = () => {
    this.setState({
      multipleModalVisible: true,
    });
  };

  handleMultipleDone = () => {
    this.setState({
      done: false,
      multipleModalVisible: false,
    });
  };

  handleMultipleCancel = () => {
    this.setState({
      multipleModalVisible: false,
    });
  };

  handleMultipleSubmit = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.handleMultipleDone();
      dispatch({
        type: 'stock/multipleOperate',
        payload: fieldsValue,
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
              wareZoneFilter,
              customerFilter,
              goodsTypeFilter,
              isActiveFilter,
              quantityGuaranteeSearch,
            } = this.state;
            this.cleanSelectedKeys();
            this.handleQuery(
              dispatch,
              false,
              search,
              pageSize,
              currentPage,
              orderBy,
              wareZoneFilter,
              customerFilter,
              goodsTypeFilter,
              isActiveFilter,
              quantityGuaranteeSearch
            );
          }
        },
      });
    });
  };

  handleMultipleMove = () => {
    this.setState({
      multipleType: 'move',
    });
    this.showMultipleModal();
  };

  handleMultipleDecrease = () => {
    this.setState({
      multipleType: 'decrease',
    });
    this.showMultipleModal();
  };

  getWarePositionOptions = () => {
    const { wareZoneTree } = this.props;
    if (wareZoneTree !== null && wareZoneTree !== undefined) {
      const options = [];
      wareZoneTree.forEach(zone => {
        const children = [];
        zone.warePositions.forEach(position => {
          children.push({
            value: position.id,
            label: position.name,
          });
        });
        options.push({
          value: zone.id,
          label: zone.name,
          children,
        });
      });
      return options;
    }
    return [];
  };

  handleExportExcel = () => {
    const { dispatch } = this.props;
    const {
      search,
      pageSize,
      currentPage,
      orderBy,
      wareZoneFilter,
      customerFilter,
      goodsTypeFilter,
      isActiveFilter,
      quantityGuaranteeSearch,
    } = this.state;
    this.handleQuery(
      dispatch,
      true,
      search,
      pageSize,
      currentPage,
      orderBy,
      wareZoneFilter,
      customerFilter,
      goodsTypeFilter,
      isActiveFilter,
      quantityGuaranteeSearch
    );
  };

  render() {
    const { list, total, loading } = this.props;
    const { pageSize, currentPage } = this.state;
    const { search, quantityGuaranteeSearch } = this.state;
    const { selectedRowKeys, selectedRows } = this.state;
    const { wareZoneFilter, customerFilter, goodsTypeFilter, isActiveFilter } = this.state;
    const {
      form: { getFieldDecorator },
    } = this.props;

    const {
      sortGoods,
      sortWarePosition,
      sortWareZone,
      sortQuantity,
      sortGoodsType,
      sortPrice,
      sortExpireDate,
      sortWarranty,
      sortPackCount,
      sortCustomer,
      quantityGuarantee,
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

    const { done } = this.state;

    const searchContent = (
      <div className={styles.extraContent}>
        <Search
          value={search}
          className={styles.extraContentSearch}
          placeholder="?????????, ??????, ??????,????????????"
          onChange={this.handleSearchChange}
          onSearch={this.handleSearch}
        />
        <Search
          value={quantityGuaranteeSearch}
          className={styles.extraContentSearch}
          placeholder="????????????"
          onChange={this.handleSearchChange2}
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

    const rowSelectionProps = {
      onChange: this.handleSelectRows,
      selectedRowKeys,
      selectedRows,
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
        dataIndex: 'goods.name',
        key: 'goods.name',
        width: '18%',
        sorter: true,
        sortOrder: sortGoods,
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
        dataIndex: 'warePosition.name',
        key: 'warePosition.name',
        width: '6%',
        align: 'center',
        sorter: true,
        sortOrder: sortWarePosition,
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
        dataIndex: 'warePosition.wareZone.name',
        key: 'warePosition.wareZone.name',
        width: '8%',
        sorter: true,
        sortOrder: sortWareZone,
        filters: this.handleWareZoneFilters(),
        filteredValue: wareZoneFilter,
      },
      {
        title: '??????',
        dataIndex: 'quantity',
        key: 'quantity',
        width: '6%',
        align: 'right',
        sorter: true,
        sortOrder: sortQuantity,
        render: text => {
          if (text === 0) {
            return <Tag color="green">{text}</Tag>;
          }
          return <Tag color="red">{text}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'goods.sn',
        key: 'goods.sn',
        width: '10%',
        align: 'center',
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
        dataIndex: 'goods.price',
        key: 'goods.price',
        width: '6%',
        align: 'right',
        sorter: true,
        sortOrder: sortPrice,
        render: text => {
          if (text === 0) {
            return <Tag color="green">{accounting.formatMoney(text, '???')}</Tag>;
          }
          return <Tag color="red">{accounting.formatMoney(text, '???')}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'expireDate',
        key: 'expireDate',
        width: '6%',
        align: 'right',
        sorter: true,
        sortOrder: sortExpireDate,
        render: text => {
          let result;
          let color;
          if (Date.now() - text > 0) {
            result = '?????????';
            color = 'red';
          } else {
            const leftDays = parseInt(Math.abs(text - Date.now()) / 1000 / 60 / 60 / 24, 10);
            const leftYears = Math.floor(leftDays / 365); // ?????????????????????
            const lastDays = leftDays % 365;
            result = leftYears > 0 ? `??????${leftYears}???${lastDays}???` : `??????${lastDays}???`;
            color = 'blue';
          }
          return (
            <Tooltip title={result}>
              <Tag color={color}>{moment(text).format('YYYY-MM-DD')}</Tag>
            </Tooltip>
          );
        },
      },
      {
        title: '??????',
        dataIndex: 'goods.monthsOfWarranty',
        key: 'goods.monthsOfWarranty',
        width: '6%',
        align: 'right',
        sorter: true,
        sortOrder: sortWarranty,
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
        title: '????????????',
        dataIndex: 'quantityGuarantee',
        key: 'quantityGuarantee',
        width: '6%',
        align: 'right',
        sorter: true,
        sortOrder: quantityGuarantee,
        render: text => {
          if (typeof text === 'object') {
            return <span>?????????</span>;
          }
          return <span>{text.toFixed(2)}</span>;
        },
      },
      {
        title: '??????',
        dataIndex: 'goods.packCount',
        key: 'goods.packCount',
        width: '6%',
        align: 'right',
        sorter: true,
        sortOrder: sortPackCount,
        render: text => {
          return <Tag color="#2db7f5">{text}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'goods.unit',
        key: 'goods.unit',
        width: '3%',
        align: 'center',
      },
      {
        title: '??????',
        dataIndex: 'goods.goodsType.name',
        key: 'goods.goodsType.name',
        width: '8%',
        sorter: true,
        sortOrder: sortGoodsType,
        filters: this.handleGoodsTypeFilters(),
        filteredValue: goodsTypeFilter,
      },
      {
        title: '??????',
        dataIndex: 'goods.customer.shortNameCn',
        key: 'goods.customer.name',
        width: '6%',
        sorter: true,
        sortOrder: sortCustomer,
        filters: this.handleCustomerFilters(),
        filteredValue: customerFilter,
      },
      {
        title: '??????',
        dataIndex: 'isActive',
        key: 'isActive',
        width: '6%',
        align: 'center',
        filterMultiple: false,
        filters: this.handleIsActiveFilters(),
        filteredValue:
          isActiveFilter !== null && isActiveFilter !== undefined && isActiveFilter.length > 0
            ? isActiveFilter.map(item => item.toString())
            : null,
        render: text => {
          if (!text) {
            return <Tag color="red">??????</Tag>;
          }
          return <Tag color="blue">??????</Tag>;
        },
      },
    ];

    const singleModalFooter = done
      ? { footer: null, onCancel: this.handleSingleDone }
      : { okText: '??????', onOk: this.handleSingleSubmit, onCancel: this.handleSingleCancel };

    const multipleModalFooter = done
      ? { footer: null, onCancel: this.handleMultipleDone }
      : { okText: '??????', onOk: this.handleMultipleSubmit, onCancel: this.handleMultipleCancel };

    const { singleModalVisible, multipleModalVisible, singleType, multipleType } = this.state;

    const getSingleModalContent = () => {
      if (selectedRows === null || selectedRows.length < 1) {
        return null;
      }
      const currentItem = selectedRows[0];
      if (done) {
        message.success('????????????');
        this.handleSingleDone();
      }
      let label;
      let max;
      let msg;
      let initialValue;
      let editExpireDate = false;
      switch (singleType) {
        case 'move':
          label = '????????????';
          max = currentItem.quantity;
          initialValue = max;
          msg = `??????????????????${max}`;
          break;
        case 'add':
          label = '????????????';
          max = 9999999999;
          initialValue = 1;
          msg = `????????????????????????`;
          break;
        case 'increase':
          label = '????????????';
          max = 9999999999;
          initialValue = 1;
          msg = `????????????????????????`;
          break;
        case 'decrease':
          label = '????????????';
          max = currentItem.quantity;
          initialValue = max;
          msg = `??????????????????0?????????${max}`;
          break;
        case 'expireDate':
          label = '????????????';
          max = currentItem.quantity;
          initialValue = currentItem.quantity;
          msg = `??????????????????0?????????${max}`;
          editExpireDate = true;
          break;
        default:
          return null;
      }

      const options = this.getWarePositionOptions();

      return (
        <Form>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('id', {
              initialValue: currentItem.id,
            })(<Input hidden />)}
          </FormItem>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('operate', {
              initialValue: singleType,
            })(<Input hidden />)}
          </FormItem>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('originWarePosition', {
              initialValue: currentItem.warePosition.id,
            })(<Input hidden />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('name', {
              initialValue: currentItem.goods.name,
            })(<Input disabled />)}
          </FormItem>
          <FormItem label={label} {...this.formLayout} hasFeedback>
            {getFieldDecorator('quantity', {
              rules: [{ type: 'number', required: true, min: 1, max, message: msg }],
              initialValue,
            })(<InputNumber size="large" />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('warePosition', {
              rules: [{ required: true, message: '???????????????????????????' }],
              initialValue: [currentItem.warePosition.wareZone.id, currentItem.warePosition.id],
            })(
              <Cascader
                disabled={singleType !== 'move'}
                showSearch
                filterOption={(input, option) =>
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                size="large"
                expandTrigger="hover"
                options={options}
                placeholder="???????????????????????????"
              />
            )}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('expireDate', {
              rules: [{ required: true, message: '???????????????????????????' }],
              initialValue: currentItem.expireDate
                ? moment(new Date(currentItem.expireDate))
                : null,
            })(<DatePicker disabled={!editExpireDate} />)}
          </FormItem>
          <FormItem label="??????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('description')(<Input disabled={editExpireDate} />)}
          </FormItem>
        </Form>
      );
    };

    const getMultipleModalContent = () => {
      if (selectedRows === null || selectedRows.length < 2) {
        return null;
      }
      if (done) {
        message.success('????????????');
        this.handleMultipleDone();
      }
      const totalCount = selectedRows.reduce((sum, item) => {
        return sum + item.quantity;
      }, 0);
      const options = this.getWarePositionOptions();

      return (
        <Form>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('ids', {
              initialValue: selectedRows.map(item => item.id),
            })(<Input hidden />)}
          </FormItem>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('operate', {
              initialValue: multipleType,
            })(<Input hidden />)}
          </FormItem>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('quantity', {
              initialValue: selectedRows.map(item => item.quantity),
            })(<Input hidden />)}
          </FormItem>
          <FormItem {...this.formLayout}>
            {getFieldDecorator('originWarePosition', {
              initialValue: selectedRows.map(item => item.warePosition.id),
            })(<Input hidden />)}
          </FormItem>
          <FormItem label="?????????" {...this.formLayout}>
            {getFieldDecorator('totalCount', {
              initialValue: totalCount,
            })(<InputNumber disabled size="large" />)}
          </FormItem>
          {multipleType === 'move' ? (
            <FormItem label="????????????" {...this.formLayout} hasFeedback>
              {getFieldDecorator('warePosition', {
                rules: [{ required: true, message: '???????????????????????????' }],
              })(
                <Cascader
                  showSearch
                  size="large"
                  expandTrigger="hover"
                  options={options}
                  placeholder="???????????????????????????"
                />
              )}
            </FormItem>
          ) : (
            ''
          )}
          <FormItem label="??????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('description')(<Input />)}
          </FormItem>
        </Form>
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
                {selectedRowKeys.length === 1 && (
                  <span>
                    <Button
                      icon="right-circle"
                      htmlType="button"
                      type="dashed"
                      onClick={this.handleSingleMove}
                    >
                      ????????????
                    </Button>
                    <Button
                      icon="up-circle"
                      htmlType="button"
                      type="primary"
                      onClick={this.handleSingleIncrease}
                    >
                      ????????????
                    </Button>
                    <Button
                      icon="down-circle"
                      htmlType="button"
                      type="danger"
                      onClick={this.handleSingleDecrease}
                    >
                      ????????????
                    </Button>
                    <Button
                      icon="compass"
                      htmlType="button"
                      type="primary"
                      onClick={this.handleSingleChangeExpireDate}
                    >
                      ??????????????????
                    </Button>
                  </span>
                )}
                {selectedRowKeys.length > 1 && (
                  <span>
                    <Button
                      icon="swap"
                      htmlType="button"
                      type="dashed"
                      onClick={this.handleMultipleMove}
                    >
                      ????????????
                    </Button>
                    <Button
                      icon="retweet"
                      htmlType="button"
                      type="danger"
                      onClick={this.handleMultipleDecrease}
                    >
                      ????????????
                    </Button>
                  </span>
                )}
                {selectedRowKeys.length > 0 && (
                  <span>
                    <Popconfirm title="???????????????????????????" onConfirm={this.handleDeActivate}>
                      <Button icon="stop" htmlType="button" type="danger">
                        ??????
                      </Button>
                    </Popconfirm>
                    <Popconfirm title="???????????????????????????" onConfirm={this.handleActivate}>
                      <Button icon="check-circle" htmlType="button" type="primary">
                        ????????????
                      </Button>
                    </Popconfirm>
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
                        {selectedRows.reduce((sum, item) => {
                          return sum + item.quantity;
                        }, 0)}
                      </a>{' '}
                      ???&nbsp;&nbsp; ????????????&nbsp;
                      <a style={{ fontWeight: 600 }}>
                        {accounting.formatMoney(
                          selectedRows.reduce((sum, item) => {
                            return sum + item.goods.price * item.quantity;
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
                dataSource={this.handleStockList(list)}
                rowKey="id"
                loading={loading}
                pagination={paginationProps}
                onChange={this.handleTableChange}
                rowSelection={rowSelectionProps}
                size="middle"
              />
            </div>
          </Card>
        </div>
        <Modal
          title="??????????????????"
          width={640}
          destroyOnClose
          visible={singleModalVisible}
          {...singleModalFooter}
        >
          {getSingleModalContent()}
        </Modal>
        <Modal
          title="??????????????????"
          width={640}
          destroyOnClose
          visible={multipleModalVisible}
          {...multipleModalFooter}
        >
          {getMultipleModalContent()}
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default Stock;
