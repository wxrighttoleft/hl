import React, { PureComponent } from 'react';
import router from 'umi/router';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  notification,
  Popconfirm,
  Row,
  Select,
  Steps,
  Table,
  Tag,
} from 'antd';
import Highlighter from 'react-highlight-words';
import moment from 'moment';
import { connect } from 'dva';
import styles from './Pack.less';

const FormItem = Form.Item;
const { Option } = Select;
const { Search } = Input;
const { Step } = Steps;

const PinyinMatch = require('pinyin-match');

@connect(({ order, customer, address, loading, logisticsTemplate }) => ({
  orderList: order.list.content,
  orderTotal: order.list.totalElements,
  customerList: customer.allList,
  addressList: address.allList,
  loadingOrders: loading.models.order,
  logisticsTemplateList: logisticsTemplate.allList,
}))
@Form.create()
class PackForm extends PureComponent {
  state = {
    search: null,
    orderCurrentPage: 1,
    orderPageSize: 10,
    packId: null,
    customerFilter: null,
    packDescription: null,
    packType: null,
    packages: null,
    trackingNumber: null,
    address: null,
    packStatus: null,
    allItems: [],
    weight: null,
    realityWeight: null,
    size: null,
    logisticsTemplate: { id: undefined },
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'customer/fetchAll',
    });
    dispatch({
      type: 'address/fetchAll',
    });
    dispatch({
      type: 'order/fetchNone',
    });
    dispatch({
      type: 'logisticsTemplate/fetchGroupAll',
    });
  }

  componentWillReceiveProps(nextProps) {
    const { orderList } = this.props;
    if (orderList !== undefined && orderList !== null) {
      const orderLists = orderList.reduce((acc, cur) => [...acc, ...cur.customerOrderPages], []);
      if (orderLists.length === 1) {
        const row = orderLists[0];
        const { allItems } = this.state;
        if (!allItems.some(item => item.id === row.id)) {
          if (allItems.length > 0 && allItems[0].clientStore !== row.clientStore) {
            message.error(`???????????????`);
          } else {
            this.setState({
              allItems: [...allItems, row],
            });
            message.success(`??????${row.flowSn}??????`);
          }
        }
      }
    }

    const { pack, loading } = nextProps;
    if (pack !== null && pack !== undefined && loading) {
      let result;
      switch (pack.packType) {
        case 'SENDING':
          result = 0;
          break;
        case 'TRANSFER':
          result = 1;
          break;
        case 'SELF_PICKUP':
          result = 2;
          break;
        default:
          result = null;
          break;
      }
      this.setState({
        packId: pack.id,
        customerFilter: pack.customer.id,
        packDescription: pack.description,
        packType: result,
        packages: pack.packages,
        trackingNumber: pack.trackingNumber,
        address: pack.address,
        packStatus: pack.packStatus,
        allItems: pack.customerOrderPages,
      });
    }
  }

  render() {
    const {
      dispatch,
      form,
      form: { getFieldDecorator },
      orderList,
      orderTotal,
      customerList,
      addressList,
      loadingOrders,
      isEdit,
      loading,
      queryParams,
      logisticsTemplateList,
    } = this.props;
    const orderLists = [];
    if (orderList) {
      orderList.forEach(o => {
        const { clientStore, clientOrderSn, customerOrderPages } = o;
        customerOrderPages.forEach(p =>
          orderLists.push(Object.assign(p, { clientStore, clientOrderSn }))
        );
      });
    }
    const { orderPageSize, orderCurrentPage, search } = this.state;

    const {
      packId,
      customerFilter,
      packDescription,
      packType,
      packages,
      trackingNumber,
      address,
      packStatus,
      allItems,
      weight,
      realityWeight,
      size,
      logisticsTemplate,
    } = this.state;

    const handleSelectCustomer = value => {
      if (!isEdit) {
        this.setState({
          customerFilter: value,
          allItems: [],
        });
        dispatch({
          type: 'order/fetchNone',
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

    const handleAddOrder = row => {
      if (allItems.some(item => item.id === row.id)) {
        message.warning(`${row.flowSn}????????????????????????`);
      } else if (allItems.length > 0 && allItems[0].clientStore !== row.clientStore) {
        message.error(`???????????????`);
      } else {
        this.setState({
          allItems: [...allItems, row],
        });
        message.success(`??????${row.flowSn}??????`);
      }
    };

    const handleRemoveOrder = id => {
      this.setState({
        allItems: allItems.filter(item => item.id !== id),
      });
    };

    const columns = [
      {
        title: '#',
        width: '1%',
        key: 'index',
        render: (text, record, index) => {
          return `${index + 1 + (orderCurrentPage - 1) * orderPageSize}`;
        },
      },
      {
        title: '??????',
        dataIndex: 'orderStatus',
        key: 'orderStatus',
        width: '1%',
        align: 'center',
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
        title: '????????????',
        dataIndex: 'createTime',
        key: 'createTime',
        width: '5%',
        render: text => {
          return <Tag>{moment(text).format('YY/MM/DD/HH:mm')}</Tag>;
        },
      },
      {
        title: '?????????',
        dataIndex: 'flowSn',
        key: 'flowSn',
        width: '15%',
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
        title: '???????????????',
        dataIndex: 'clientOrderSn',
        key: 'clientOrderSn',
        width: '15%',
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
        dataIndex: 'clientStore',
        key: 'clientStore',
        width: '15%',
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
    ];

    const orderColumns = [
      ...columns,
      {
        title: '??????',
        width: '5%',
        align: 'right',
        render: (text, row) => {
          return (
            <Button
              htmlType="button"
              size="small"
              type="primary"
              onClick={e => {
                e.preventDefault();
                handleAddOrder(row);
              }}
            >
              ??????
            </Button>
          );
        },
      },
    ];

    const selectOrderColumns = [
      ...columns,
      {
        title: '??????',
        width: '6%',
        align: 'right',
        render: record => {
          return (
            <span>
              <Popconfirm
                title="??????????????????"
                onConfirm={() => handleRemoveOrder(record.id)}
                okText="??????"
                cancelText="??????"
              >
                <Button htmlType="button" type="danger" size="small">
                  ??????
                </Button>
              </Popconfirm>
            </span>
          );
        },
      },
    ];

    const handleOrderQuery = (newSearch, newOrderCurrentPage) => {
      dispatch({
        type: 'order/fetchForPack',
        payload: {
          search: newSearch,
          pageSize: orderPageSize,
          currentPage: newOrderCurrentPage,
          orderBy: null,
          customerFilter,
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
        orderCurrentPage: 1,
      });
      handleOrderQuery(value, orderCurrentPage);
    };

    const searchContent = (
      <div className={styles.extraContent}>
        <Search
          className={styles.extraContentSearch}
          placeholder="?????????????????????????????????????????????????????????"
          onSearch={handleSearch}
        />
      </div>
    );

    const handleGoBackToList = () => {
      router.push({
        pathname: '/transit/pack',
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
          type: 'pack/submit',
          payload: { ...fieldsValue, isEdit, customerOrderPages: allItems },
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

    const handleOrderTableChange = pagination => {
      const { current: newOrderCurrentPage } = pagination;
      this.setState({
        orderCurrentPage: newOrderCurrentPage,
      });
      handleOrderQuery(search, newOrderCurrentPage);
    };

    const handlePackTypeChange = value => {
      this.setState({
        packType: value,
      });
      if (value === 2) {
        form.setFieldsValue({
          address: null,
        });
      }
    };

    const orderPaginationProps = {
      showTotal: handleTotal,
      current: orderCurrentPage,
      total: orderTotal,
      pageSize: orderPageSize,
    };

    const getPackTypeOptions = () => {
      const receiveGoodsTypeArray = [
        { id: 0, name: '????????????' },
        { id: 1, name: '????????????' },
        { id: 2, name: '????????????' },
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

    const getAddressOptions = allAddress => {
      const children = [];
      if (Array.isArray(allAddress)) {
        allAddress.forEach(addressItem => {
          children.push(
            <Option key={addressItem.id} value={addressItem.id}>
              {addressItem.clientStore} /{addressItem.name} / {addressItem.addressType.name} /{' '}
              {addressItem.contact} / {addressItem.phone}
            </Option>
          );
        });
      }
      return children;
    };

    const getPackStatusValue = status => {
      switch (status) {
        case 'PACKAGE':
          return 0;
        case 'SENDING':
          return 1;
        case 'CLIENT_SIGNED':
          return 2;
        case 'COMPLETE':
          return 3;
        default:
          return 0;
      }
    };

    const getLogisticsTemplateOptions = () => {
      const children = [];
      if (Array.isArray(logisticsTemplateList)) {
        logisticsTemplateList.forEach(item => {
          children.push(
            <Option key={item.id} value={item.id}>
              {item.name}
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
                current={getPackStatusValue(packStatus)}
              >
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
              <Col span={3}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('packType', {
                    rules: [{ required: true, message: '?????????????????????' }],
                    initialValue: packType,
                  })(
                    <Select
                      showSearch
                      filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      placeholder="?????????????????????"
                      onChange={handlePackTypeChange}
                    >
                      {getPackTypeOptions()}
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={2}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('packages', {
                    rules: [{ required: true, message: '?????????????????????' }],
                    initialValue: packages,
                  })(<InputNumber min={1} />)}
                </FormItem>
              </Col>
              <Col span={2}>
                <FormItem label="??????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('logisticsTemplate.id', {
                    initialValue: logisticsTemplate.id,
                  })(
                    <Select
                      showSearch
                      allowClear
                      filterOption={(input, option) =>
                        PinyinMatch.match(option.props.children.toString(), input)
                      }
                      placeholder="???????????????"
                    >
                      {getLogisticsTemplateOptions()}
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={2}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('weight', {
                    initialValue: weight,
                  })(<InputNumber min={1} max={99999999} step={1} precision={2} />)}
                </FormItem>
              </Col>
              <Col span={2}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('realityWeight', {
                    initialValue: realityWeight,
                  })(<InputNumber min={1} max={99999999} step={1} precision={2} />)}
                </FormItem>
              </Col>
              <Col span={2}>
                <FormItem label="??????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('size', {
                    initialValue: size,
                  })(<InputNumber min={1} max={99999999} step={1} precision={2} />)}
                </FormItem>
              </Col>
              <Col span={3}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('trackingNumber', {
                    initialValue: trackingNumber,
                  })(<Input />)}
                </FormItem>
              </Col>
              <Col span={2}>
                <FormItem label="??????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('description', {
                    initialValue: packDescription,
                  })(<Input />)}
                </FormItem>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={11}>
                <FormItem label="????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('address', {
                    rules: [{ required: packType !== 2, message: '???????????????' }],
                    initialValue: address !== undefined && address !== null ? address.id : null,
                  })(
                    <Select
                      disabled={packType === 2}
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
            <Table
              columns={selectOrderColumns}
              dataSource={allItems}
              pagination={false}
              size="middle"
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
              {getFieldDecorator('packId', {
                initialValue: packId,
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
            columns={orderColumns}
            dataSource={orderLists}
            rowKey="id"
            loading={loadingOrders}
            pagination={orderPaginationProps}
            onChange={handleOrderTableChange}
            size="small"
          />
        </Card>
      </div>
    );
  }
}

export default PackForm;
