import React, { PureComponent } from 'react';
import router from 'umi/router';
import { Alert, Button, Card, Col, Divider, Form, Row, Steps, Table, Tag, Timeline } from 'antd';
import Highlighter from 'react-highlight-words';
import accounting from 'accounting';
import moment from 'moment';
import { connect } from 'dva';
import Zmage from 'react-zmage';
import styles from './Pack.less';

const { Step } = Steps;
const intformat = require('biguint-format');
const FlakeId = require('flake-idgen');

const flakeIdGen1 = new FlakeId();

@connect(({ customer, address, loading }) => ({
  customerList: customer.allList,
  addressList: address.allList,
  loadingOrders: loading.models.order,
}))
@Form.create()
class PackDetail extends PureComponent {
  state = {
    search: null,
    orderCurrentPage: 1,
    orderPageSize: 10,
    customerFilter: null,
    packDescription: null,
    packType: null,
    packages: null,
    trackingNumber: null,
    address: null,
    packStatus: null,
    allItems: [],
    operateSnapshots: [],
    cancelDescription: null,
    signedPhoto: null,
    packItems: [],
    maxNumber: 0,
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
  }

  componentWillReceiveProps(nextProps) {
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
      let address = '';
      if (pack.address !== undefined && pack.address !== null) {
        address = `${pack.address.name} / ${pack.address.contact} / ${pack.address.phone}`;
      }
      this.setState({
        customerFilter: pack.customer.name,
        packDescription: pack.description,
        packType: result,
        packages: pack.packages,
        trackingNumber: pack.trackingNumber,
        address,
        packStatus: pack.packStatus,
        flowSn: pack.flowSn,
        allItems: pack.customerOrderPages,
        operateSnapshots: pack.operateSnapshots,
        cancelDescription: pack.cancelDescription,
        signedPhoto: pack.signedPhoto,
        packItems: pack.packItems,
        maxNumber: pack.packages,
      });
    }
  }

  render() {
    const { loading, queryParams } = this.props;

    const { orderPageSize, orderCurrentPage, search } = this.state;

    const {
      customerFilter,
      packDescription,
      packType,
      packages,
      trackingNumber,
      address,
      packStatus,
      flowSn,
      allItems,
      operateSnapshots,
      cancelDescription,
      signedPhoto,
      packItems,
      maxNumber,
    } = this.state;

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
        title: '????????????',
        dataIndex: 'createTime',
        key: 'createTime',
        width: '1%',
        render: text => {
          return <Tag>{moment(text).format('YY/MM/DD/HH:mm')}</Tag>;
        },
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
        title: '??????',
        dataIndex: 'simpleCustomerOrder.clientStore',
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
        dataIndex: 'simpleCustomerOrder.clientOrderSn',
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

    const packItemColumns = [
      {
        title: '#',
        width: '1%',
        key: 'index',
        render: (text, record, index) => {
          return `${index + 1}`;
        },
      },
      {
        title: '?????????',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '????????????',
        dataIndex: 'sn',
        key: 'sn',
      },
      {
        title: '????????????',
        dataIndex: 'expireDate',
        key: 'expireDate',
        width: '5%',
        render: text => {
          return <Tag>{moment(text).format('YYYY-MM-DD')}</Tag>;
        },
      },
      {
        title: '??????',
        dataIndex: 'quantity',
        key: 'quantity',
        width: '5%',
        align: 'right',
        render: text => {
          return <Tag color="red">{accounting.formatNumber(text)}</Tag>;
        },
      },
    ];

    const selectOrderColumns = [...columns];

    const handleGoBackToList = () => {
      router.push({
        pathname: '/transit/pack',
        query: {
          queryParams,
        },
      });
    };

    const getPackTypeValue = () => {
      switch (packType) {
        case 0:
          return '????????????';
        case 1:
          return '????????????';
        case 2:
          return '????????????';
        default:
          return '??????';
      }
    };

    const getPackStatusValue = status => {
      switch (status) {
        case 'PACKAGE':
          return 1;
        case 'SENDING':
          return 2;
        case 'CLIENT_SIGNED':
          return 3;
        case 'COMPLETE':
          return 4;
        default:
          return 0;
      }
    };

    const getPackSteps = () => {
      if (packStatus !== 'CANCEL') {
        return (
          <div style={{ paddingBottom: 30 }}>
            {packStatus === 'COMPLETE' ? (
              <span>
                <Alert type="success" showIcon message="?????????????????????????????????" />
                <Divider />
              </span>
            ) : (
              ''
            )}
            <Steps size="small" labelPlacement="vertical" current={getPackStatusValue(packStatus)}>
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
            {moment(snapshot.createTime).format('llll')} <Tag color="blue">{snapshot.operator}</Tag>{' '}
            {snapshot.operation}
          </Timeline.Item>
        )
      );
      return <Timeline>{items}</Timeline>;
    };

    const getPackItemsContent = () => {
      if (packItems.length !== 0) {
        const sortedItems = packItems.sort((a, b) => a.number - b.number);
        const subArray = [];
        const resultArray = [];
        let start = 0;
        for (let i = 0; i < sortedItems.length; i += 1) {
          if (i > 0 && sortedItems[i].number !== sortedItems[i - 1].number) {
            subArray.push(sortedItems.slice(start, i));
            start = i;
          }
          if (i === sortedItems.length - 1) {
            subArray.push(sortedItems.slice(start, i + 1));
          }
        }
        let j = 0;
        for (let i = 1; i <= maxNumber; i += 1) {
          if (subArray[j] !== undefined && subArray[j][0].number === i) {
            resultArray.push(subArray[j]);
            j += 1;
          } else {
            resultArray.push([]);
          }
        }
        const result = [];
        resultArray.forEach((array, index) => {
          result.push(
            <Card
              key={intformat(flakeIdGen1.next(), 'dec')}
              title={`???${index + 1}???`}
              style={{ marginTop: 24, marginBottom: 24 }}
              size="small"
            >
              <Table
                columns={packItemColumns}
                dataSource={array}
                pagination={false}
                size="middle"
                rowKey="id"
              />
            </Card>
          );
        });
        return result;
      }
      return (
        <Card style={{ marginTop: 24, marginBottom: 24 }} size="small">
          ?????????????????????
        </Card>
      );
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
            <Col>{getPackSteps()}</Col>
          </Row>
          <Row gutter={16}>
            <Col span={5}>
              <span style={{ fontWeight: 'bold' }}>?????????</span>
              {customerFilter}
            </Col>
            <Col span={3}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              {getPackTypeValue()}
            </Col>
            <Col span={3}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              {packages}
            </Col>
            <Col span={3}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              {trackingNumber}
            </Col>
            <Col span={10}>
              <span style={{ fontWeight: 'bold' }}>?????????</span>
              {packDescription}
            </Col>
          </Row>
          <Divider />
          <Row gutter={16}>
            <Col span={10}>
              <span style={{ fontWeight: 'bold' }}>???????????????</span>
              {address}
            </Col>
            <Col span={6}>
              <span style={{ fontWeight: 'bold' }}>??????????????????</span>
              {flowSn}
            </Col>
          </Row>
          <Divider />
          <Card title="???????????????" size="small">
            <Table
              columns={selectOrderColumns}
              dataSource={allItems}
              pagination={false}
              size="middle"
              rowKey="id"
              loading={loading}
            />
          </Card>
          <Divider />
          {getPackItemsContent()}
          <Row>
            <Col span={16} offset={6}>
              <Button
                htmlType="button"
                type="primary"
                size="large"
                style={{ width: '70%', marginTop: 24 }}
                onClick={handleGoBackToList}
              >
                ????????????
              </Button>
            </Col>
          </Row>
        </Card>
        <Card title="????????????" bordered={false} style={{ marginTop: 12 }}>
          {getOperateSnapshots()}
        </Card>
        {signedPhoto !== null ? (
          <Card title="????????????" bordered={false} style={{ marginTop: 12 }}>
            {signedPhoto.split(',').map(item => {
              return <Zmage src={item} height="200" key={item} />;
            })}
          </Card>
        ) : (
          ''
        )}
      </div>
    );
  }
}

export default PackDetail;
