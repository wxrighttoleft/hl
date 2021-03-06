import React, { PureComponent } from 'react';
import router from 'umi/router';
import { Button, Card, Col, Divider, Icon, Popover, Row, Table, Tag } from 'antd';
import moment from 'moment';
import { connect } from 'dva';
import accounting from 'accounting';
import styles from './ReceiveGoods.less';

@connect(({ stockFlow, loading }) => ({
  stockFlowList: stockFlow.list,
  loadingStockFlow: loading.models.stockFlow,
}))
class ReceiveGoodsDetail extends PureComponent {
  state = {
    customerFilter: null,
    receiveGoodsType: null,
    receiveGoodsDescription: null,
    creator: null,
    createTime: null,
    auditor: null,
    auditTime: null,
    receiveGoodsItems: [],
    loadingReceiveGoodsItems: true,
  };

  componentDidMount() {
    const { dispatch, id } = this.props;
    dispatch({
      type: 'stockFlow/findByReceiveGoodsId',
      payload: id,
    });
  }

  componentWillReceiveProps(nextProps) {
    const { receiveGoods, loading } = nextProps;
    this.setState({
      loadingReceiveGoodsItems: loading,
    });
    if (receiveGoods !== null && receiveGoods !== undefined && loading) {
      this.setState({
        receiveGoodsItems: receiveGoods.receiveGoodsItems.sort((a, b) => {
          return a.createTime - b.createTime;
        }),
        customerFilter: receiveGoods.customer.name,
        receiveGoodsType: receiveGoods.receiveGoodsType,
        receiveGoodsDescription: receiveGoods.description,
        creator: receiveGoods.creator,
        createTime: receiveGoods.createTime,
        auditor: receiveGoods.auditor,
        auditTime: receiveGoods.auditTime,
      });
    }
  }

  render() {
    const { stockFlowList = [], loadingStockFlow, queryParams } = this.props;
    const {
      customerFilter,
      receiveGoodsType,
      receiveGoodsDescription,
      receiveGoodsItems,
      creator,
      createTime,
      auditor,
      auditTime,
      loadingReceiveGoodsItems,
    } = this.state;

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
      },
      {
        title: '??????',
        dataIndex: 'price',
        key: 'price',
        width: '15%',
        render: text => {
          if (text === 0) {
            return <Tag color="green">{accounting.formatMoney(text, '???')}</Tag>;
          }
          return <Tag color="red">{accounting.formatMoney(text, '???')}</Tag>;
        },
      },
      {
        title: '?????????',
        dataIndex: 'expireDate',
        key: 'expireDate',
        width: '10%',
        render: text => {
          return moment(text).format('YYYY-MM-DD');
        },
      },
      {
        title: '????????????',
        dataIndex: 'warePosition',
        key: 'warePosition',
        width: '10%',
        render: record => {
          if (record !== null && record !== undefined) {
            return `${record.wareZone.name} / ${record.name}`;
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
        title: '????????????',
        dataIndex: 'packagesInitial',
        key: 'packagesInitial',
        width: '5%',
      },
      {
        title: '????????????',
        dataIndex: 'packages',
        key: 'packages',
        width: '5%',
        render: (text, record) => {
          if (record) {
            if (record.packagesInitial !== record.packages) {
              return <span style={{ color: 'red' }}>{text}</span>;
            }
          }
          return text;
        },
      },
      {
        title: '?????????',
        dataIndex: 'unloadUser.username',
        width: '5%',
      },
      {
        title: '?????????',
        dataIndex: 'receiveUser.username',
        width: '5%',
      },
      {
        title: '??????',
        dataIndex: 'description',
        key: 'description',
        width: '10%',
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
            case 'IN_POLICY':
              result = '??????-????????????';
              color = '#DC145F';
              break;
            case 'IN_OTHER':
              result = '??????-????????????';
              color = '#DC148F';
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
        dataIndex: 'warePositionIn.wareZone.name',
        key: 'warePositionIn.wareZone.name',
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
        dataIndex: 'warePositionIn.name',
        key: 'warePositionIn.name',
        width: '8%',
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
        pathname: '/warehouse/receiveGoods',
        query: {
          queryParams,
        },
      });
    };

    const getTypeValue = value => {
      let result;
      switch (value) {
        case 'NEW':
          result = '????????????';
          break;
        case 'REJECTED':
          result = '??????';
          break;
        default:
          result = null;
          break;
      }
      return result;
    };

    return (
      <div className={styles.standardList}>
        <Card
          bordered
          title="??????????????????"
          style={{ marginTop: 24 }}
          bodyStyle={{ padding: '0 32px 40px 32px' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              {customerFilter}
            </Col>
            <Col span={8}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              {getTypeValue(receiveGoodsType)}
            </Col>
            <Col span={8}>
              <span style={{ fontWeight: 'bold' }}>?????????</span>
              {receiveGoodsDescription}
            </Col>
          </Row>
          <Divider />
          <Row gutter={24}>
            <Col span={6}>
              <span style={{ fontWeight: 'bold' }}>????????????</span>
              {creator}
            </Col>
            <Col span={6}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              <Tag>{moment(createTime).format('lll')}</Tag>
            </Col>
            <Col span={6}>
              <span style={{ fontWeight: 'bold' }}>????????????</span>
              {auditor}
            </Col>
            <Col span={6}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              <Tag>{auditTime !== null ? moment(auditTime).format('lll') : '?????????'}</Tag>
            </Col>
          </Row>
          <Divider />
          <Table
            columns={receiveGoodsColumns}
            dataSource={Array.isArray(receiveGoodsItems) ? receiveGoodsItems : []}
            pagination={false}
            size="small"
            rowKey="id"
            loading={loadingReceiveGoodsItems}
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
      </div>
    );
  }
}

export default ReceiveGoodsDetail;
