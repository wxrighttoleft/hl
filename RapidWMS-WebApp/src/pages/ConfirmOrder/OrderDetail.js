import React, { PureComponent } from 'react';
import router from 'umi/router';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Icon,
  Popover,
  Row,
  Steps,
  Table,
  Tag,
  Timeline,
  Alert,
} from 'antd';
import accounting from 'accounting';
import moment from 'moment';
import { connect } from 'dva';
import styles from './Order.less';

const { Step } = Steps;

@connect(({ customer, stockFlow, loading }) => ({
  customerList: customer.allList,
  stockFlowList: stockFlow.list,
  loadingStockFlow: loading.models.stockFlow,
}))
@Form.create()
class OrderDetail extends PureComponent {
  state = {
    customerFilter: null,
    orderDescription: null,
    clientName: null,
    clientStore: null,
    clientAddress: null,
    clientOrderSn: null,
    clientOperator: null,
    orderStatus: null,
    fetchAll: false,
    usePackCount: false,
    orderExpireDate: null,
    flowSn: null,
    autoIncreaseSn: null,
    allItems: [],
    operateSnapshots: [],
    tableFooter: null,
    wareZones: null,
    cancelDescription: null,
  };

  componentDidMount() {
    const { dispatch, id } = this.props;
    dispatch({
      type: 'customer/fetchMy',
    });
    dispatch({
      type: 'stockFlow/fetchByOrderId',
      payload: id,
    });
  }

  componentWillReceiveProps(nextProps) {
    const { order, loading } = nextProps;
    if (order !== null && order !== undefined && loading) {
      const orderItems = order.customerOrderItems.sort((a, b) => {
        return a.createTime - b.createTime;
      });
      const orderStocks = order.customerOrderStocks.sort((a, b) => {
        return a.createTime - b.createTime;
      });
      const { operateSnapshots } = order;
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
          },
          quantityInitial: item.quantityInitial,
          quantity: item.quantity,
          description: item.description,
          price: item.price,
          warePosition: null,
        });
      });

      allItems = allItems.sort((a, b) => {
        return a.sortOrder - b.sortOrder;
      });

      this.setState({
        allItems,
        operateSnapshots,
        customerFilter: order.owner.name,
        orderDescription: order.description,
        clientName: order.clientName,
        clientStore: order.clientStore,
        clientAddress: order.clientAddress,
        clientOrderSn: order.clientOrderSn,
        clientOperator: order.clientOperator,
        orderStatus: order.orderStatus,
        fetchAll: order.fetchAll,
        orderExpireDate: order.expireDate,
        usePackCount: order.usePackCount,
        flowSn: order.flowSn,
        autoIncreaseSn: order.autoIncreaseSn,
        wareZones: order.targetWareZoneList,
        cancelDescription: order.cancelDescription,
        tableFooter: () => {
          return (
            <span style={{ textAlign: 'center', display: 'block' }}>
              ???????????????{allItems.map(item => item.quantity).reduce((prev, curr) => prev + curr)}???
              ???????????????<Tag color="blue">{accounting.formatMoney(order.totalPrice, '???')}</Tag>
            </span>
          );
        },
      });
    }
  }

  render() {
    const { stockFlowList, loading, loadingStockFlow, queryParams } = this.props;

    const {
      customerFilter,
      orderDescription,
      clientName,
      clientStore,
      clientAddress,
      clientOrderSn,
      clientOperator,
      orderStatus,
      fetchAll,
      usePackCount,
      orderExpireDate,
      flowSn,
      autoIncreaseSn,
      allItems,
      operateSnapshots,
      tableFooter,
      wareZones,
      cancelDescription,
    } = this.state;

    const orderColumns = [
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
        width: '10%',
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
        title: '?????????',
        dataIndex: 'expireDate',
        key: 'expireDate',
        width: '10%',
        render: text => {
          if (text) {
            return <Tag>{moment(text).format('YYYY-MM-DD')}</Tag>;
          }
          return <Tag>?????????</Tag>;
        },
      },
      {
        title: '????????????',
        dataIndex: 'warePositionIn',
        key: 'warePositionIn',
        width: '10%',
        render: (text, record) => {
          if (record !== null && record !== undefined && record.warePosition != null) {
            return `${record.warePosition.wareZone.name} / ${record.warePosition.name}`;
          }
          return <Tag>?????????</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'price',
        key: 'price',
        width: '5%',
        render: (text, record) => {
          if (record !== null && record !== undefined) {
            return <Tag color="blue">{accounting.formatMoney(text, '???')}</Tag>;
          }
          return '';
        },
      },
      {
        title: '????????????',
        dataIndex: 'quantityInitial',
        key: 'quantityInitial',
        width: '5%',
      },
      {
        title: '????????????',
        dataIndex: 'quantity',
        key: 'quantity',
        width: '5%',
        render: (text, record) => {
          if (record) {
            if (record.quantityInitial !== record.quantity) {
              return <span style={{ color: 'red' }}>{text}</span>;
            }
          }
          return text;
        },
      },
      {
        title: '??????',
        dataIndex: 'description',
        key: 'description',
        width: '8%',
      },
    ];

    const stockFlowColumns = [
      {
        title: '#',
        width: '1%',
        key: 'key',
        render: (text, record, index) => {
          return `${index + 1}`;
        },
      },
      {
        title: '??????',
        dataIndex: 'flowOperateType',
        key: 'flowOperateType',
        width: '1%',
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
        dataIndex: 'createTime',
        key: 'createTime',
        width: '1%',
        render: text => {
          return <Tag>{moment(text).format('lll')}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'operator',
        key: 'operator',
        width: '5%',
      },
      {
        title: '????????????',
        dataIndex: 'name',
        key: 'name',
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
                {text}
              </Popover>
            </span>
          );
        },
      },
      {
        title: '????????????',
        dataIndex: 'sn',
        key: 'sn',
        width: '10%',
      },
      {
        title: '??????',
        dataIndex: 'quantity',
        key: 'quantity',
        width: '5%',
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
        dataIndex: 'warePositionOut.wareZone.name',
        key: 'warePositionOut.wareZone.name',
        width: '10%',
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
        width: '10%',
        render: text => {
          if (text != null) {
            return text;
          }
          return <Tag color="#A9A9A9">???</Tag>;
        },
      },
    ];

    const handleGoBackToList = () => {
      router.push({
        pathname: '/transit/confirmOrder',
        query: {
          queryParams,
        },
      });
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

    const getOrderSteps = () => {
      if (orderStatus !== 'CANCEL') {
        return (
          <div style={{ paddingBottom: 30 }}>
            {orderStatus === 'COMPLETE' ? (
              <span>
                <Alert type="success" showIcon message="?????????????????????????????????" />
                <Divider />
              </span>
            ) : (
              ''
            )}
            <Steps
              size="small"
              labelPlacement="vertical"
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
          </div>
        );
      }
      return (
        <span>
          <Alert
            type="warning"
            showIcon
            message="??????????????????"
            description={`???????????????${cancelDescription}`}
          />
          <Divider />
        </span>
      );
    };

    const getOperateSnapshots = () => {
      const items = [];
      operateSnapshots.forEach(snapshot =>
        items.push(
          <Timeline.Item key={snapshot.id}>
            {moment(snapshot.createTime).format('lll')} <Tag color="blue">{snapshot.operator}</Tag>{' '}
            {snapshot.operation}
          </Timeline.Item>
        )
      );
      return <Timeline>{items}</Timeline>;
    };

    return (
      <div className={styles.standardList}>
        <Card
          bordered
          title="????????????"
          style={{ marginTop: 24 }}
          bodyStyle={{ padding: '0 32px 40px 32px' }}
        >
          <Row gutter={16}>
            <Col>{getOrderSteps()}</Col>
          </Row>
          <Row gutter={16}>
            <Col span={5}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              {customerFilter}
            </Col>
            <Col span={5}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              {orderDescription}
            </Col>
            <Col span={5}>
              <span style={{ fontWeight: 'bold' }}>??????????????????</span>
              {flowSn}
            </Col>
            <Col span={5}>
              <span style={{ fontWeight: 'bold' }}>??????????????????</span>
              {autoIncreaseSn}
            </Col>
            <Col span={4}>
              <span style={{ fontWeight: 'bold' }}>??????????????????</span>
              {orderExpireDate !== undefined && orderExpireDate !== null
                ? moment(orderExpireDate).format('YYYY-MM-DD')
                : '?????????'}
            </Col>
          </Row>
          <Divider />
          <Row gutter={16}>
            <Col span={5}>
              <span style={{ fontWeight: 'bold' }}>?????????????????????</span>
              {clientName}
            </Col>
            <Col span={5}>
              <span style={{ fontWeight: 'bold' }}>?????????????????????</span>
              {clientAddress}
            </Col>
            <Col span={5}>
              <span style={{ fontWeight: 'bold' }}>?????????????????????</span>
              {clientStore}
            </Col>
            <Col span={5}>
              <span style={{ fontWeight: 'bold' }}>??????????????????</span>
              {clientOrderSn}
            </Col>
            <Col span={4}>
              <span style={{ fontWeight: 'bold' }}>???????????????????????????</span>
              {clientOperator}
            </Col>
          </Row>
          <Divider />
          <Row gutter={16}>
            <Col span={3}>
              <span style={{ fontWeight: 'bold' }}>?????????????????????</span>
              {fetchAll !== undefined && fetchAll ? '???' : '???'}
            </Col>
            <Col span={3}>
              <span style={{ fontWeight: 'bold' }}>???????????????????????????</span>
              {usePackCount !== undefined && usePackCount ? '???' : '???'}
            </Col>
            <Col span={18}>
              <span style={{ fontWeight: 'bold' }}>????????????????????????</span>
              {wareZones !== undefined && wareZones
                ? wareZones.map(item => item.name).join(' / ')
                : '?????????'}
            </Col>
          </Row>
          <Divider />
          <Table
            columns={orderColumns}
            dataSource={Array.isArray(allItems) ? allItems : []}
            pagination={false}
            size="small"
            rowKey="id"
            loading={loading}
            footer={tableFooter}
          />
          <Row>
            <Col span={18} offset={6}>
              <Button
                htmlType="button"
                type="primary"
                size="large"
                style={{ width: '70%', marginTop: 24, marginLeft: 24 }}
                onClick={handleGoBackToList}
              >
                ????????????
              </Button>
            </Col>
          </Row>
        </Card>
        <Card title="????????????" bordered={false} style={{ marginTop: 12 }}>
          <Table
            columns={stockFlowColumns}
            dataSource={Array.isArray(stockFlowList) ? stockFlowList : []}
            rowKey="id"
            loading={loadingStockFlow}
            size="small"
            pagination={false}
          />
        </Card>
        <Card title="????????????" bordered={false} style={{ marginTop: 12 }}>
          {getOperateSnapshots()}
        </Card>
      </div>
    );
  }
}

export default OrderDetail;
