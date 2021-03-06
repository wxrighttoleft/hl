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
  Table,
  Tag,
  Tooltip,
} from 'antd';
import Highlighter from 'react-highlight-words';
import accounting from 'accounting';
import moment from 'moment';
import { connect } from 'dva';
import styles from './ReceiveGoods.less';

const PinyinMatch = require('pinyin-match');

const FormItem = Form.Item;
const { Option } = Select;
const { Search } = Input;
const intformat = require('biguint-format');
const FlakeId = require('flake-idgen');

const flakeIdGen1 = new FlakeId();

@connect(({ goods, stock, customer, wareZone, loading, user }) => ({
  goodsList: goods.list.content,
  goodsTotal: goods.list.totalElements,
  stockList: stock.list.content,
  stockTotal: stock.list.totalElements,
  customerList: customer.allList,
  wareZoneTree: wareZone.tree,
  loadingGoods: loading.models.goods,
  loadingStock: loading.models.stock,
  userList: user.list,
}))
@Form.create()
class ReceiveGoodsForm extends PureComponent {
  state = {
    search: null,
    goodsCurrentPage: 1,
    goodsPageSize: 5,
    stockCurrentPage: 1,
    stockPageSize: 5,
    receiveGoodsId: null,
    customerFilter: null,
    receiveGoodsType: null,
    receiveGoodsDescription: null,
    receiveGoodsItems: [],
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
      type: 'goods/fetchNone',
    });
    dispatch({
      type: 'stock/fetchNone',
    });
    dispatch({
      type: 'user/fetch',
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

    const { goodsList } = this.props;
    if (goodsList !== undefined && goodsList !== null) {
      if (goodsList.length === 1) {
        const goodId = goodsList[0].id;
        const goodSn = goodsList[0].sn;
        const goodsName = goodsList[0].name;
        const { receiveGoodsItems } = this.state;
        if (!receiveGoodsItems.some(item => item.goods.id === goodId || item.goods.sn === goodSn)) {
          const item = {
            id: intformat(flakeIdGen1.next(), 'dec'),
            goods: { id: goodId, sn: goodSn, name: goodsName },
            warePosition: { id: null, wareZone: { id: null } },
            expireDate: null,
            quantityInitial: null,
            price: goodsList[0].price,
          };
          this.setState({
            receiveGoodsItems: [...receiveGoodsItems, item],
          });
          message.success(`??????${goodsList[0].name}??????`);
        }
      }
    }

    const { receiveGoods, loading } = nextProps;
    if (receiveGoods !== null && receiveGoods !== undefined && loading) {
      this.setState({
        receiveGoodsId: receiveGoods.id,
        receiveGoodsItems: receiveGoods.receiveGoodsItems.sort((a, b) => {
          return a.createTime - b.createTime;
        }),
        customerFilter: receiveGoods.customer.id,
        receiveGoodsType: receiveGoods.receiveGoodsType,
        receiveGoodsDescription: receiveGoods.description,
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
      wareZoneTree,
      loadingGoods,
      loadingStock,
      isEdit,
      loading,
      queryParams,
      userList,
    } = this.props;

    const { goodsPageSize, goodsCurrentPage, stockPageSize, stockCurrentPage, search } = this.state;

    const {
      receiveGoodsId,
      customerFilter,
      receiveGoodsType,
      receiveGoodsDescription,
      receiveGoodsItems,
    } = this.state;

    const handleSelectCustomer = value => {
      if (!isEdit) {
        this.setState({
          customerFilter: value,
          receiveGoodsItems: [],
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

    const getReceiveGoodsTypeOptions = () => {
      const receiveGoodsTypeArray = [
        { id: 0, name: '????????????' },
        { id: 1, name: '????????????' },
        { id: 2, name: '????????????' },
        { id: 3, name: '????????????' },
      ];
      const children = [];
      if (Array.isArray(receiveGoodsTypeArray)) {
        receiveGoodsTypeArray.forEach(type => {
          children.push(
            <Option key={type.id} value={type.id}>
              {type.name}
            </Option>
          );
        });
      }
      return children;
    };

    const handleAddReceiveGoodsItems = (
      id,
      name,
      sn,
      expireDate,
      quantityInitial,
      warePositionId,
      wareZoneId,
      price
    ) => {
      const item = {
        id: intformat(flakeIdGen1.next(), 'dec'),
        goods: { id, sn, name },
        warePosition: { id: warePositionId, wareZone: { id: wareZoneId } },
        expireDate,
        quantityInitial,
        price,
      };
      this.setState({
        receiveGoodsItems: [...receiveGoodsItems, item],
      });
      message.success(`??????${name}??????`);
    };

    const handleRemoveReceiveGoodsItem = id => {
      this.setState({
        receiveGoodsItems: receiveGoodsItems.filter(item => item.id !== id),
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
        width: '8%',
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
        title: '????????????',
        dataIndex: 'returnPrice',
        key: 'returnPrice',
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
                handleAddReceiveGoodsItems(
                  row.id,
                  row.name,
                  row.sn,
                  new Date(),
                  null,
                  null,
                  null,
                  receiveGoodsType === 1 ? row.returnPrice : row.price
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
        dataIndex: 'goods.name',
        key: 'stock.goods.name',
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
        dataIndex: 'warePosition.name',
        key: 'warePosition.name',
        width: '6%',
      },
      {
        title: '??????',
        dataIndex: 'warePosition.wareZone.name',
        key: 'warePosition.wareZone.name',
        width: '8%',
      },
      {
        title: '??????',
        dataIndex: 'quantity',
        key: 'quantity',
        width: '6%',
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
        width: '8%',
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
        width: '6%',
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
        title: '????????????',
        dataIndex: 'goods.customer.name',
        key: 'goods.customer.name',
        width: '15%',
      },
      {
        title: '??????',
        dataIndex: 'isActive',
        key: 'isActive',
        width: '6%',
        align: 'center',
        render: text => {
          if (!text) {
            return <Tag color="red">??????</Tag>;
          }
          return <Tag color="blue">??????</Tag>;
        },
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
                handleAddReceiveGoodsItems(
                  row.goods.id,
                  row.goods.name,
                  row.goods.sn,
                  row.expireDate,
                  null,
                  row.warePosition.id,
                  row.warePosition.wareZone.id,
                  receiveGoodsType === 1 ? row.goods.returnPrice : row.goods.price
                )
              }
            >
              ??????
            </Button>
          );
        },
      },
    ];

    const getUserOptions = () => {
      const children = [];
      if (Array.isArray(userList)) {
        userList.forEach(userItem => {
          children.push(
            <Option key={userItem.id} value={userItem.id}>
              {userItem.username}
            </Option>
          );
        });
      }
      return children;
    };

    const receiveGoodsColumns = [
      {
        title: '#',
        width: '1%',
        key: 'key',
        render: (text, record, index) => {
          return `${index + 1}`;
        },
      },
      {
        title: '????????????',
        dataIndex: 'goods.name',
        key: 'goods.name',
        width: '15%',
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
                  {getFieldDecorator(`receiveGoodsItems.${record.id}.id`, {
                    initialValue: record.goods.id,
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
        dataIndex: 'price',
        key: 'price',
        width: '10%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`receiveGoodsItems.${record.id}.price`, {
                  rules: [{ required: true, message: '???????????????' }],
                  initialValue: text,
                })(<InputNumber min={0.0} max={99999999.99} step={0.01} precision={2} />)}
              </FormItem>
            );
          }
          return text;
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
                {getFieldDecorator(`receiveGoodsItems.${record.id}.expireDate`, {
                  rules: [{ required: true, message: '??????????????????' }],
                  initialValue: moment(new Date(text)),
                })(<DatePicker />)}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '??????????????????',
        dataIndex: 'warePositionIn',
        key: 'warePositionIn',
        width: '10%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`receiveGoodsItems.${record.id}.warePosition`, {
                  rules: [{ required: true, message: '???????????????' }],
                  initialValue: record.warePosition.id
                    ? [record.warePosition.wareZone.id, record.warePosition.id]
                    : null,
                })(
                  <Cascader
                    showSearch
                    filterOption={(input, option) =>
                      option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    expandTrigger="hover"
                    placeholder="???????????????????????????"
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
        dataIndex: 'quantityInitial',
        key: 'quantityInitial',
        width: '5%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`receiveGoodsItems.${record.id}.quantityInitial`, {
                  rules: [{ required: true, message: '???????????????' }],
                  initialValue: text,
                })(<InputNumber min={1} max={99999999} precision={0} />)}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '??????',
        dataIndex: 'packagesInitial',
        key: 'packagesInitial',
        width: '5%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`receiveGoodsItems.${record.id}.packagesInitial`, {
                  rules: [{ required: true, message: '???????????????' }],
                  initialValue: text,
                })(<InputNumber min={1} max={99999999} precision={0} />)}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '?????????',
        dataIndex: 'unloadUser',
        key: 'unloadUser',
        width: '10%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`receiveGoodsItems.${record.id}.unloadUser.id`, {
                  rules: [{ required: true, message: '??????????????????' }],
                  initialValue: record.unloadUser ? record.unloadUser.id : null,
                })(
                  <Select
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      PinyinMatch.match(option.props.children.toString(), input)
                    }
                  >
                    {getUserOptions()}
                  </Select>
                )}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '?????????',
        dataIndex: 'receiveUser',
        key: 'receiveUser',
        width: '10%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`receiveGoodsItems.${record.id}.receiveUser.id`, {
                  rules: [{ required: true, message: '??????????????????' }],
                  initialValue: record.receiveUser ? record.receiveUser.id : null,
                })(
                  <Select
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      PinyinMatch.match(option.props.children.toString(), input)
                    }
                  >
                    {getUserOptions()}
                  </Select>
                )}
              </FormItem>
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
              onConfirm={() => handleRemoveReceiveGoodsItem(record.id)}
              okText="??????"
              cancelText="??????"
            >
              <Button htmlType="button" href="#" type="danger">
                ??????
              </Button>
            </Popconfirm>
          );
        },
      },
    ];

    const getTypeValue = value => {
      let result;
      switch (value) {
        case 'NEW':
          result = 0;
          break;
        case 'REJECTED':
          result = 1;
          break;
        case 'POLICY':
          result = 2;
          break;
        case '????????????':
          result = 3;
          break;
        default:
          result = null;
          break;
      }
      return result;
    };

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
        pathname: '/aog/receiveGoods',
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
          type: 'receiveGoods/submit',
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

    const handleReceiveGoodsTypeChange = value => {
      this.setState({
        receiveGoodsType: value,
      });
    };

    return (
      <div className={styles.standardList}>
        <Card
          bordered
          title={isEdit ? '??????????????????' : '????????????'}
          style={{ marginTop: 24 }}
          bodyStyle={{ padding: '0 32px 40px 32px' }}
        >
          <Form onSubmit={handleSubmit}>
            <Row gutter={16}>
              <Col span={8}>
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
              <Col span={8}>
                <FormItem label="??????????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('receiveGoodsType', {
                    rules: [{ required: true, message: '?????????????????????' }],
                    initialValue: getTypeValue(receiveGoodsType),
                  })(
                    <Select
                      onChange={handleReceiveGoodsTypeChange}
                      showSearch
                      filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      placeholder="?????????????????????"
                    >
                      {getReceiveGoodsTypeOptions()}
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem label="????????????" {...this.formLayout}>
                  {getFieldDecorator('description', {
                    initialValue: receiveGoodsDescription,
                  })(<Input />)}
                </FormItem>
              </Col>
            </Row>
            <Table
              columns={receiveGoodsColumns}
              dataSource={receiveGoodsItems}
              pagination={false}
              size="small"
              rowKey="id"
              loading={loading}
            />
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
              {getFieldDecorator('receiveGoodsId', {
                initialValue: receiveGoodsId,
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
          <div style={{ marginBottom: 8 }} />
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

export default ReceiveGoodsForm;
