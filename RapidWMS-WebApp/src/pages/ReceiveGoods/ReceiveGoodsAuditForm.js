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
  Row,
  Select,
  Table,
} from 'antd';
import moment from 'moment';
import { connect } from 'dva';
import styles from './ReceiveGoods.less';

const PinyinMatch = require('pinyin-match');

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ customer, wareZone, user }) => ({
  customerList: customer.allList,
  wareZoneTree: wareZone.tree,
  userList: user.list,
}))
@Form.create()
class ReceiveGoodsAuditForm extends PureComponent {
  state = {
    customerFilter: null,
    receiveGoodsType: null,
    receiveGoodsDescription: null,
    receiveGoodsItems: [],
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'customer/fetchAll',
    });
    dispatch({
      type: 'wareZone/fetchTree',
    });
    dispatch({
      type: 'user/fetch',
    });
  }

  componentWillReceiveProps(nextProps) {
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
      loading,
      customerList,
      wareZoneTree,
      userList,
    } = this.props;

    const {
      receiveGoodsId,
      customerFilter,
      receiveGoodsType,
      receiveGoodsDescription,
      receiveGoodsItems,
    } = this.state;

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
        title: '????????????',
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
                })(<InputNumber min={0} max={99999999} disabled />)}
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
              <FormItem hasFeedback>
                {getFieldDecorator(`receiveGoodsItems.${record.id}.quantity`, {
                  rules: [{ required: true, message: '???????????????' }],
                  initialValue: record.quantityInitial,
                })(<InputNumber min={0} max={99999999} />)}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '????????????',
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
                })(<InputNumber min={0} max={99999999} disabled />)}
              </FormItem>
            );
          }
          return text;
        },
      },
      {
        title: '????????????',
        dataIndex: 'packages',
        key: 'packages',
        width: '5%',
        render: (text, record) => {
          if (record) {
            return (
              <FormItem hasFeedback>
                {getFieldDecorator(`receiveGoodsItems.${record.id}.packages`, {
                  rules: [{ required: true, message: '???????????????' }],
                  initialValue: record.packagesInitial,
                })(<InputNumber min={0} max={99999999} />)}
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
    ];

    const handleGoBackToList = () => {
      router.push({
        pathname: '/aog/receiveGoods',
        // query: {
        //   queryParams,
        // },
      });
    };

    const handleSubmit = e => {
      e.preventDefault();
      form.validateFields((err, fieldsValue) => {
        if (err) {
          return;
        }
        dispatch({
          type: 'receiveGoods/audit',
          payload: fieldsValue,
          callback: response => {
            if (response.status === 400) {
              notification.error({
                message: '??????????????????',
                description: response.message,
              });
            } else {
              message.success('???????????????');
              handleGoBackToList();
            }
          },
        });
      });
    };

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
        case 'OTHER':
          result = 3;
          break;
        default:
          result = null;
          break;
      }
      return result;
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

    return (
      <div className={styles.standardList}>
        <Card
          bordered
          title="??????????????????"
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
                  })(<Select disabled>{getCustomersOptions(customerList)}</Select>)}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem label="??????????????????" {...this.formLayout} hasFeedback>
                  {getFieldDecorator('receiveGoodsType', {
                    rules: [{ required: true, message: '?????????????????????' }],
                    initialValue: getTypeValue(receiveGoodsType),
                  })(
                    <Select
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
                  ??????????????????
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
      </div>
    );
  }
}

export default ReceiveGoodsAuditForm;
