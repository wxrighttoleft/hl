import React, { PureComponent } from 'react';
import router from 'umi/router';
import {
  Button,
  Card,
  Cascader,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  notification,
  Popconfirm,
  Row,
  Select,
  Steps,
  Switch,
  Table,
  Tag,
  Tooltip,
  AutoComplete,
} from 'antd';
import Highlighter from 'react-highlight-words';
import accounting from 'accounting';
import moment from 'moment';
import { connect } from 'dva';
import styles from './Order.less';

const FormItem = Form.Item;
const { Option } = Select;
const { Search } = Input;
const { Step } = Steps;
const intformat = require('biguint-format');
const FlakeId = require('flake-idgen');

const flakeIdGen1 = new FlakeId();
const PinyinMatch = require('pinyin-match');

@connect(({ goods, stock, customer, wareZone, store, loading, address }) => ({
  goodsList: goods.list.content,
  goodsTotal: goods.list.totalElements,
  stockList: stock.list.content,
  stockTotal: stock.list.totalElements,
  customerList: customer.allList,
  wareZoneList: wareZone.allList,
  wareZoneTree: wareZone.tree,
  storeList: store.allList,
  loadingGoods: loading.models.goods,
  loadingStock: loading.models.stock,
  addressList: address.allList,
}))
@Form.create()
class OrderForm extends PureComponent {
  state = {
    search: null,
    goodsCurrentPage: 1,
    goodsPageSize: 5,
    stockCurrentPage: 1,
    stockPageSize: 5,
    orderId: null,
    customerFilter: null,
    orderDescription: null,
    autoIncreaseSn: null,
    printTitle: null,
    clientName: null,
    clientStore: null,
    clientOrderSn: null,
    clientOrderSn2: null,
    clientOperator: null,
    useNewAutoIncreaseSn: false,
    usePackCount: false,
    targetWareZones: [],
    fetchAll: false,
    orderExpireDateMin: null,
    orderExpireDateMax: null,
    fetchStocks: true,
    orderStatus: null,
    allItems: [],
    qualityAssuranceExponent: null,
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'customer/fetchMy',
    });
    dispatch({
      type: 'wareZone/fetchTree',
    });
    dispatch({
      type: 'wareZone/fetchAll',
    });
    dispatch({
      type: 'store/fetchAll',
    });
    dispatch({
      type: 'goods/fetchNone',
    });
    dispatch({
      type: 'stock/fetchNone',
    });
    dispatch({
      type: 'address/fetchAll',
    });
  }

  componentWillReceiveProps(nextProps) {
    const { customerList } = this.props;
    if (customerList !== undefined && customerList !== null) {
      if (customerList.length === 1) {
        this.setState({
          customerFilter: customerList[0].id,
        });
      }
    }
    const { loading, order } = nextProps;
    if (order !== null && order !== undefined && loading) {
      const orderItems = order.customerOrderItems;
      const orderStocks = order.customerOrderStocks;
      let allItems = [];
      orderStocks.forEach(item => {
        allItems.push({
          ...item,
        });
      });
      orderItems.forEach(item => {
        allItems.push({
          sortOrder: item.sortOrder,
          id: item.id,
          goods: {
            name: item.name,
            sn: item.sn,
            packCount: item.packCount,
            monthsOfWarranty: item.monthsOfWarranty,
          },
          quantityInitial: item.quantityInitial,
          quantity: item.quantity,
          quantityLeft: item.quantityLeft,
          price: item.price,
          expireDate: item.expireDate,
          warePosition: null,
        });
      });
      allItems = allItems.sort((a, b) => {
        return a.sortOrder - b.sortOrder;
      });

      this.setState({
        orderId: order.id,
        allItems,
        customerFilter: order.owner.id,
        orderDescription: order.description,
        autoIncreaseSn: order.autoIncreaseSn,
        printTitle: order.printTitle,
        clientName: order.clientName,
        clientStore: order.clientStore,
        clientOrderSn: order.clientOrderSn,
        clientOrderSn2: order.clientOrderSn2,
        clientOperator: order.clientOperator,
        orderStatus: order.orderStatus,
        fetchAll: order.fetchAll,
        orderExpireDateMin: order.expireDateMin,
        orderExpireDateMax: order.expireDateMax,
        targetWareZones: order.targetWareZones === null ? [] : order.targetWareZones.split(','),
        qualityAssuranceExponent: order.qualityAssuranceExponent,
      });
    }
  }

  render() {
    const {
      dispatch,
      form,
      form: { getFieldDecorator },
      goodsList,
      goodsTotal,
      stockList,
      stockTotal,
      customerList,
      wareZoneList,
      wareZoneTree,
      storeList,
      loadingGoods,
      loadingStock,
      isEdit,
      loading,
      queryParams,
      addressList,
    } = this.props;

    const { goodsPageSize, goodsCurrentPage, stockPageSize, stockCurrentPage, search } = this.state;

    const {
      orderId,
      customerFilter,
      orderDescription,
      autoIncreaseSn,
      printTitle,
      clientName,
      clientStore,
      clientOrderSn,
      clientOrderSn2,
      clientOperator,
      useNewAutoIncreaseSn,
      usePackCount,
      fetchAll,
      orderExpireDateMin,
      orderExpireDateMax,
      fetchStocks,
      orderStatus,
      allItems,
      targetWareZones,
      qualityAssuranceExponent,
    } = this.state;

    const handleSelectCustomer = value => {
      if (!isEdit) {
        this.setState({
          customerFilter: value,
          allItems: [],
        });
        dispatch({
          type: 'goods/fetchNone',
        });
        dispatch({
          type: 'stock/fetchNone',
        });
      }
    };

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

    const getWarePositionOptions = () => {
      if (wareZoneTree !== null && wareZoneTree !== undefined && wareZoneTree.length > 0) {
        const options = [];
        wareZoneTree.forEach(zone => {
          const children = [];
          if (
            zone.warePositions !== null &&
            zone.warePositions !== undefined &&
            zone.warePositions.length > 0
          ) {
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
          }
        });
        return options;
      }
      return [];
    };

    const handleAddOrderItem = (
      id,
      name,
      sn,
      packCount,
      price,
      expireDate,
      quantityLeft,
      quantityInitial,
      warePositionId,
      wareZoneId,
      monthsOfWarranty
    ) => {
      const item = {
        sortOrder: allItems.length + 1,
        id: intformat(flakeIdGen1.next(), 'dec'),
        goods: { id, sn, name, packCount, monthsOfWarranty },
        warePosition: warePositionId ? { id: warePositionId, wareZone: { id: wareZoneId } } : null,
        price,
        expireDate,
        quantityLeft,
        quantityInitial,
      };
      this.setState({
        allItems: [...allItems, item],
      });
      message.success(`??????${name}??????`);
    };

    const handleRemoveOrderItem = id => {
      let newAllItems = allItems.filter(item => item.id !== id);
      newAllItems = newAllItems.map((item, index) => {
        return { ...item, sortOrder: index };
      });
      this.setState({
        allItems: newAllItems,
      });
    };

    const goodsColumns = [
      {
        title: '#',
        width: '1%',
        key: 'index',
        render: (text, record, index) => {
          return `${index + 1 + (goodsCurrentPage - 1) * goodsPageSize}`;
        },
      },
      {
        title: '????????????',
        dataIndex: 'name',
        key: 'name',
        width: '15%',
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
        width: '20%',
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
      },
      {
        title: '??????',
        dataIndex: 'price',
        key: 'price',
        width: '5%',
        align: 'right',
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
      },
      {
        title: '??????',
        width: '8%',
        align: 'right',
        render: (text, row) => {
          return (
            <Button
              size="small"
              htmlType="button"
              type="primary"
              onClick={() =>
                handleAddOrderItem(
                  row.id,
                  row.name,
                  row.sn,
                  row.packCount,
                  row.price,
                  null,
                  row.stockCount,
                  null,
                  null,
                  null,
                  row.monthsOfWarranty
                )
              }
            >
              ??????
            </Button>
          );
        },
      },
    ];

    const stockColumns = [
      {
        title: '#',
        width: '1%',
        key: 'index',
        render: (text, record, index) => {
          return `${index + 1 + (stockCurrentPage - 1) * stockPageSize}`;
        },
      },
      {
        title: '????????????',
        width: '10%',
        dataIndex: 'goods.name',
        key: 'stock.goods.name',
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
        dataIndex: 'warePosition.name',
        key: 'warePosition.name',
        width: '8%',
      },
      {
        title: '??????',
        dataIndex: 'warePosition.wareZone.name',
        key: 'warePosition.wareZone.name',
        width: '10%',
      },
      {
        title: '????????????',
        dataIndex: 'goods.customer.name',
        key: 'goods.customer.name',
        width: '10%',
      },
      {
        title: '??????',
        dataIndex: 'quantity',
        key: 'quantity',
        width: '5%',
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
        dataIndex: 'goods.sn',
        key: 'goods.sn',
        width: '12%',
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
        dataIndex: 'expireDate',
        key: 'expireDate',
        width: '8%',
        align: 'right',
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
        dataIndex: 'goods.price',
        key: 'goods.price',
        width: '5%',
        align: 'right',
        render: text => {
          if (text === 0) {
            return <Tag color="green">{accounting.formatMoney(text, '???')}</Tag>;
          }
          return <Tag color="red">{accounting.formatMoney(text, '???')}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'goods.packCount',
        key: 'goods.packCount',
        width: '5%',
        align: 'right',
        render: text => {
          return <Tag color="#2db7f5">{text}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'goods.monthsOfWarranty',
        key: 'goods.monthsOfWarranty',
        width: '5%',
        align: 'right',
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
        width: '5%',
        align: 'right',
        render: (text, row) => {
          return (
            <Button
              size="small"
              htmlType="button"
              type="primary"
              onClick={() =>
                handleAddOrderItem(
                  row.goods.id,
                  row.goods.name,
                  row.goods.sn,
                  row.goods.packCount,
                  row.goods.price,
                  row.expireDate,
                  row.quantity,
                  null,
                  row.warePosition.id,
                  row.warePosition.wareZone.id,
                  row.goods.monthsOfWarranty
                )
              }
            >
              ??????
            </Button>
          );
        },
      },
    ];

    const orderColumns = [
      {
        title: '#',
        width: '1%',
        key: 'key',
        render: (text, record, index) => {
          return (
            <span>
              {index + 1}
              <FormItem>
                {getFieldDecorator(`allItems.${record.id}.id`, {
                  initialValue: record.goods.id,
                })(<Input hidden />)}
              </FormItem>
            </span>
          );
        },
      },
      {
        title: '????????????',
        dataIndex: 'goods.name',
        key: 'goods.name',
        width: '20%',
        render: (text, record) => {
          if (record) {
            return (
              <span>
                {text}
                <FormItem>
                  {getFieldDecorator(`allItems.${record.id}.name`, {
                    initialValue: record.goods.name,
                  })(<Input hidden />)}
                </FormItem>
              </span>
            );
          }
          return text;
        },
      },
      {
        title: '??????',
        dataIndex: 'goods.sn',
        key: 'goods.sn',
        width: '15%',
        render: (text, record) => {
          if (record) {
            return (
              <span>
                {text}
                <FormItem>
                  {getFieldDecorator(`allItems.${record.id}.sn`, {
                    initialValue: record.goods.sn,
                  })(<Input hidden />)}
                </FormItem>
              </span>
            );
          }
          return text;
        },
      },
      {
        title: '??????',
        dataIndex: 'goods.packCount',
        key: 'goods.packCount',
        width: '5%',
        align: 'right',
        render: (text, record) => {
          if (record) {
            return (
              <span>
                <Tag color="#2db7f5">{text}</Tag>
                <FormItem>
                  {getFieldDecorator(`allItems.${record.id}.packCount`, {
                    initialValue: record.goods.packCount,
                  })(<Input hidden />)}
                </FormItem>
              </span>
            );
          }
          return text;
        },
      },
      {
        title: '??????',
        dataIndex: 'goods.monthsOfWarranty',
        key: 'goods.monthsOfWarranty',
        width: '5%',
        align: 'right',
        render: (text, record) => {
          return (
            <span>
              <Tag color="orange">{text}???</Tag>
              <FormItem>
                {getFieldDecorator(`allItems.${record.id}.monthsOfWarranty`, {
                  initialValue: record.goods.monthsOfWarranty,
                })(<Input hidden />)}
              </FormItem>
            </span>
          );
        },
      },
      {
        title: '?????????',
        dataIndex: 'expireDate',
        key: 'expireDate',
        width: '10%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`allItems.${record.id}.expireDate`, {
                  initialValue: text ? moment(new Date(text)) : null,
                })(<DatePicker disabled placeholder="??????????????????" />)}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '????????????',
        dataIndex: 'warePositionIn',
        key: 'warePositionIn',
        width: '15%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`allItems.${record.id}.warePosition`, {
                  initialValue:
                    record.warePosition !== null
                      ? [record.warePosition.wareZone.id, record.warePosition.id]
                      : null,
                })(
                  <Cascader
                    disabled
                    expandTrigger="hover"
                    placeholder="??????????????????"
                    options={getWarePositionOptions()}
                  />
                )}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '??????',
        dataIndex: 'price',
        key: 'price',
        width: '5%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`allItems.${record.id}.price`, {
                  rules: [{ required: true, message: '???????????????' }],
                  initialValue: text,
                })(
                  <InputNumber
                    min={0}
                    max={99999999}
                    step={0.01}
                    precision={2}
                    placeholder="???????????????"
                  />
                )}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '??????',
        dataIndex: 'quantityLeft',
        key: 'quantityLeft',
        width: '5%',
        render: (text, record) => {
          if (record) {
            return (
              <span>
                {text}
                <FormItem>
                  {getFieldDecorator(`allItems.${record.id}.sortOrder`, {
                    initialValue: record.sortOrder,
                  })(<Input hidden />)}
                </FormItem>
              </span>
            );
          }
          return text;
        },
      },
      {
        title: '????????????',
        dataIndex: 'quantityInitial',
        key: 'quantityInitial',
        width: '5%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`allItems.${record.id}.quantityInitial`, {
                  rules: [{ required: true, message: '???????????????' }],
                  initialValue: text,
                })(<InputNumber min={1} max={99999999} />)}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '????????????',
        dataIndex: 'quantity',
        key: 'quantity',
        width: '5%',
        render: (text, record) => {
          if (record) {
            return (
              <span>
                {text}
                <FormItem>
                  <Input hidden />
                </FormItem>
              </span>
            );
          }
          return text;
        },
      },
      {
        title: '??????',
        width: '6%',
        align: 'right',
        render: record => {
          return (
            <Popconfirm
              title="??????????????????"
              onConfirm={() => handleRemoveOrderItem(record.id)}
              okText="??????"
              cancelText="??????"
            >
              <Button htmlType="button" href="#" type="danger">
                ??????
              </Button>
              <FormItem>
                <Input hidden />
              </FormItem>
            </Popconfirm>
          );
        },
      },
    ];

    const handleGoodsQuery = (newSearch, newGoodsCurrentPage) => {
      dispatch({
        type: 'goods/fetch',
        payload: {
          search: newSearch,
          pageSize: goodsPageSize,
          currentPage: newGoodsCurrentPage,
          orderBy: null,
          goodsTypeFilter: null,
          goodsCustomerFilter: customerFilter,
        },
      });
    };

    const handleStockQuery = (newSearch, newStockCurrentPage) => {
      dispatch({
        type: 'stock/fetch',
        payload: {
          search: newSearch,
          pageSize: stockPageSize,
          currentPage: newStockCurrentPage,
          orderBy: null,
          wareZoneFilter: null,
          customerFilter,
          goodsTypeFilter: null,
          isActiveFilter: null,
        },
      });
    };

    const handleSearch = value => {
      if (customerFilter === null || customerFilter === undefined) {
        message.warning('?????????????????????????????????????????????');
        return;
      }
      this.setState({
        search: value,
        goodsCurrentPage: 1,
        stockCurrentPage: 1,
      });
      handleGoodsQuery(value, goodsCurrentPage);
      handleStockQuery(value, stockCurrentPage);
    };

    const searchContent = (
      <div className={styles.extraContent}>
        <Search
          className={styles.extraContentSearch}
          placeholder="???????????????????????????????????????"
          onSearch={handleSearch}
        />
      </div>
    );

    const handleGoBackToList = () => {
      router.push({
        pathname: '/order/order',
        query: {
          queryParams,
        },
      });
    };

    const handleSubmit = e => {
      e.preventDefault();
      form.validateFields((err, fieldsValue) => {
        if (err) {
          return;
        }
        dispatch({
          type: 'order/submit',
          payload: { ...fieldsValue, isEdit },
          callback: response => {
            if (response.status === 400) {
              notification.error({
                message: '??????????????????',
                description: response.message,
              });
            } else {
              message.success(isEdit ? '???????????????' : '???????????????');
              handleGoBackToList();
            }
          },
        });
      });
    };

    const handleTotal = (total, range) => {
      return `??????${total}?????????????????????${range[0]}-${range[1]}???`;
    };

    const handleGoodsTableChange = pagination => {
      const { current: newGoodsCurrentPage } = pagination;
      this.setState({
        goodsCurrentPage: newGoodsCurrentPage,
      });
      handleGoodsQuery(search, newGoodsCurrentPage);
    };

    const handleStockTableChange = pagination => {
      const { current: newStockCurrentPage } = pagination;
      this.setState({
        stockCurrentPage: newStockCurrentPage,
      });
      handleStockQuery(search, newStockCurrentPage);
    };

    const handleUseNewAutoIncreaseSnSwitch = value => {
      this.setState({
        useNewAutoIncreaseSn: value,
      });
    };

    const handleFetchAllSwitch = value => {
      this.setState({
        fetchAll: value,
      });
    };

    const handleUsePackCountSwitch = value => {
      this.setState({
        usePackCount: value,
      });
    };

    const handleFetchStockSwitch = value => {
      this.setState({
        fetchStocks: value,
      });
    };

    const goodsPaginationProps = {
      showTotal: handleTotal,
      current: goodsCurrentPage,
      total: goodsTotal,
      pageSize: goodsPageSize,
    };

    const stockPaginationProps = {
      showTotal: handleTotal,
      current: stockCurrentPage,
      total: stockTotal,
      pageSize: stockPageSize,
    };

    const getWareZoneOptions = allWareZones => {
      const children = [];
      if (Array.isArray(allWareZones)) {
        allWareZones.forEach(wareZone => {
          children.push(
            <Option key={wareZone.id} value={wareZone.id}>
              {wareZone.name}
            </Option>
          );
        });
      }
      return children;
    };

    const getAllStores = allStores => {
      const children = [];
      if (Array.isArray(allStores)) {
        allStores.forEach(storeItem => {
          children.push(storeItem.name);
        });
      }
      return children;
    };

    const getOrderStatusValue = status => {
      switch (status) {
        case 'INIT':
          return 1;
        case 'FETCH_STOCK':
          return 2;
        case 'GATHERING_GOODS':
          return 3;
        case 'GATHER_GOODS':
          return 4;
        case 'CONFIRM':
          return 5;
        case 'PACKAGE':
          return 6;
        case 'SENDING':
          return 7;
        case 'CLIENT_SIGNED':
          return 8;
        case 'COMPLETE':
          return 9;
        case 'CANCEL':
          return 99;
        default:
          return 0;
      }
    };

    const getAddressOptions = () => {
      const children = [];
      if (Array.isArray(addressList)) {
        addressList.forEach(addressItem => {
          children.push(
            <Option
              key={addressItem.id}
              value={`${addressItem.clientStore},${addressItem.name},${addressItem.addressType.name}`}
            >
              {addressItem.clientStore} / {addressItem.name} / {addressItem.addressType.name}
            </Option>
          );
        });
      }
      return children;
    };

    return (
      <div className={styles.standardList}>
        <Card
          bordered
          title={isEdit ? '??????????????????' : '????????????'}
          style={{ marginTop: 24 }}
          bodyStyle={{ padding: '0 32px 40px 32px' }}
        >
          <Row gutter={16}>
            <Col>
              <Steps
                size="small"
                labelPlacement="vertical"
                style={{ float: 'right' }}
                current={getOrderStatusValue(orderStatus)}
              >
                <Step title="????????????" />
                <Step title="????????????" />
                <Step title="????????????" />
                <Step title="????????????" />
                <Step title="????????????" />
                <Step title="????????????" />
                <Step title="????????????" />
                <Step title="????????????" />
                <Step title="????????????" />
              </Steps>
            </Col>
          </Row>
          <Form onSubmit={handleSubmit}>
            <Row gutter={16}>
              <Col span={5}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('customer', {
                    rules: [{ required: true, message: '?????????????????????' }],
                    initialValue: customerFilter,
                  })(
                    <Select
                      disabled={isEdit}
                      showSearch
                      filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      placeholder="?????????????????????"
                      onChange={handleSelectCustomer}
                    >
                      {getCustomersOptions(customerList)}
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={4}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('description', {
                    initialValue: orderDescription,
                  })(<Input />)}
                </FormItem>
              </Col>
              <Col span={3}>
                <FormItem label="???????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('autoIncreaseSn', {
                    initialValue: autoIncreaseSn,
                  })(<Input />)}
                </FormItem>
              </Col>
              <Col span={3}>
                <FormItem label="???????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('orderExpireDateMin', {
                    initialValue: orderExpireDateMin ? moment(new Date(orderExpireDateMin)) : null,
                  })(<DatePicker />)}
                </FormItem>
              </Col>
              <Col span={3}>
                <FormItem label="???????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('orderExpireDateMax', {
                    initialValue: orderExpireDateMax ? moment(new Date(orderExpireDateMax)) : null,
                  })(<DatePicker />)}
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('targetWareZones', {
                    initialValue:
                      targetWareZones === undefined ||
                      targetWareZones === null ||
                      targetWareZones === ''
                        ? []
                        : targetWareZones,
                  })(
                    <Select
                      mode="multiple"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      placeholder="??????????????????????????????"
                      style={{ width: '100%' }}
                    >
                      {getWareZoneOptions(wareZoneList)}
                    </Select>
                  )}
                </FormItem>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={5}>
                <FormItem label="??????????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('printTitle', {
                    initialValue: printTitle,
                  })(<Input />)}
                </FormItem>
              </Col>
              <Col span={4}>
                <FormItem label="??????????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('clientName', {
                    rules: [{ required: true, message: '???????????????????????????' }],
                    initialValue: clientName,
                  })(
                    <AutoComplete
                      dataSource={getAllStores(storeList)}
                      filterOption={(input, option) =>
                        PinyinMatch.match(option.props.children.toString(), input)
                      }
                    />
                  )}
                </FormItem>
              </Col>
              <Col span={3}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('qualityAssuranceExponent', {
                    initialValue: qualityAssuranceExponent,
                  })(<Input />)}
                </FormItem>
              </Col>
              <Col span={12}>
                <FormItem label="??????????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('clientStore', {
                    rules: [{ required: true, message: '???????????????????????????' }],
                    initialValue: clientStore,
                  })(
                    <Select
                      showSearch
                      allowClear
                      filterOption={(input, option) =>
                        PinyinMatch.match(option.props.children.toString(), input)
                      }
                    >
                      {getAddressOptions(addressList)}
                    </Select>
                  )}
                </FormItem>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={5}>
                <FormItem label="???????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('clientOrderSn', {
                    initialValue: clientOrderSn,
                  })(<Input />)}
                </FormItem>
              </Col>
              <Col span={4}>
                <FormItem label="???????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('clientOrderSn2', {
                    initialValue: clientOrderSn2,
                  })(<Input />)}
                </FormItem>
              </Col>
              <Col span={4}>
                <FormItem label="????????????????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('clientOperator', {
                    initialValue: clientOperator,
                  })(<Input />)}
                </FormItem>
              </Col>
            </Row>
            <Table
              columns={orderColumns}
              dataSource={allItems}
              pagination={false}
              size="small"
              rowKey="id"
              loading={loading}
            />
            <Row gutter={16}>
              <Col span={3}>
                <FormItem label="??????????????????" {...this.formLayout}>
                  {getFieldDecorator('fetchAll', {
                    initialValue: fetchAll !== undefined && fetchAll,
                  })(
                    <Switch
                      checked={fetchAll !== undefined && fetchAll}
                      checkedChildren="???"
                      unCheckedChildren="???"
                      onChange={handleFetchAllSwitch}
                    />
                  )}
                </FormItem>
              </Col>
              <Col span={3}>
                <FormItem label="????????????????????????" {...this.formLayout}>
                  {getFieldDecorator('usePackCount', {
                    initialValue: usePackCount !== undefined && usePackCount,
                  })(
                    <Switch
                      checked={usePackCount !== undefined && usePackCount}
                      checkedChildren="???"
                      unCheckedChildren="???"
                      onChange={handleUsePackCountSwitch}
                    />
                  )}
                </FormItem>
              </Col>
              <Col span={3}>
                <FormItem label="??????????????????" {...this.formLayout}>
                  {getFieldDecorator('useNewAutoIncreaseSn', {
                    initialValue: useNewAutoIncreaseSn,
                  })(
                    <Switch
                      checkedChildren="???"
                      unCheckedChildren="???"
                      onChange={handleUseNewAutoIncreaseSnSwitch}
                    />
                  )}
                </FormItem>
              </Col>
              <Col span={3}>
                <FormItem label="??????????????????" {...this.formLayout}>
                  {getFieldDecorator('fetchStocks', {
                    initialValue: fetchStocks,
                  })(
                    <Switch
                      checkedChildren="???"
                      unCheckedChildren="???"
                      defaultChecked
                      onChange={handleFetchStockSwitch}
                    />
                  )}
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={12} offset={6}>
                <Button
                  htmlType="submit"
                  type="primary"
                  size="large"
                  style={{ width: '70%', marginTop: 24 }}
                  onClick={handleSubmit}
                >
                  ??????
                </Button>
                <Button
                  htmlType="button"
                  size="large"
                  style={{ width: '20%', marginTop: 24, marginLeft: 24 }}
                  onClick={handleGoBackToList}
                >
                  ????????????
                </Button>
              </Col>
            </Row>
            <FormItem>
              {getFieldDecorator('orderId', {
                initialValue: orderId,
              })(<Input hidden />)}
            </FormItem>
          </Form>
        </Card>
        <Card
          bordered={false}
          style={{ marginTop: 12, paddingTop: 24 }}
          bodyStyle={{ padding: '0 32px 40px 32px' }}
          extra={searchContent}
        >
          <Table
            columns={goodsColumns}
            dataSource={goodsList}
            rowKey="id"
            loading={loadingGoods}
            pagination={goodsPaginationProps}
            onChange={handleGoodsTableChange}
            size="small"
          />
          <Table
            columns={stockColumns}
            dataSource={stockList}
            rowKey="id"
            loading={loadingStock}
            pagination={stockPaginationProps}
            onChange={handleStockTableChange}
            size="small"
          />
        </Card>
      </div>
    );
  }
}

export default OrderForm;
