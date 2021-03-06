import React, { PureComponent } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Icon,
  Upload,
  Select,
  Switch,
  Tabs,
  notification,
  message,
  Divider,
  Input,
} from 'antd';
import { FormattedMessage } from 'umi/locale';

import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import { getToken } from '../../models/login';
import styles from './Order.less';

const FormItem = Form.Item;
const { TabPane } = Tabs;
const { Option } = Select;

@connect(({ customer, wareZone }) => ({
  customerList: customer.allList,
  wareZoneList: wareZone.allList,
}))
@Form.create()
class ImportOrder extends PureComponent {
  state = {
    customerFilter: null,
    fetchAll: false,
    submitting: false,
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'customer/fetchMy',
    });
    dispatch({
      type: 'wareZone/fetchAll',
    });
  }

  render() {
    const { dispatch } = this.props;
    const {
      form,
      form: { getFieldDecorator },
    } = this.props;

    const { customerList, wareZoneList } = this.props;

    const { submitting, customerFilter, fetchAll, uploadFileList = [] } = this.state;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
        md: { span: 10 },
      },
    };

    const submitFormLayout = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 10, offset: 7 },
      },
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

    const handleSelectCustomer = value => {
      this.setState({
        customerFilter: value,
      });
    };

    const handleFetchAllSwitch = value => {
      this.setState({
        fetchAll: value,
      });
    };

    const handleKingdeeSubmit = e => {
      e.preventDefault();
      form.validateFields((err, fieldsValue) => {
        if (err) {
          return;
        }
        message.info('????????????????????????????????????');
        this.setState({ submitting: true });
        dispatch({
          type: 'order/importKingdee',
          payload: { ...fieldsValue, uploadFileList },
          callback: response => {
            this.setState({ submitting: false });
            if (response.status === 400) {
              notification.error({
                message: '??????????????????',
                description: response.message,
              });
            } else {
              const { countSucceed, countFailed } = response;
              if (countSucceed === 0) {
                notification.error({
                  message: '??????????????????',
                  description: `???${countFailed}???????????????????????????????????????????????????`,
                });
              }
              message.success(`????????????${countSucceed}?????????`);
              if (countFailed !== 0) {
                message.error(`${countFailed}???????????????????????????????????????????????????`);
              }
            }
          },
        });
      });
    };

    // const handleKingdee2Submit = e => {
    //   e.preventDefault();
    //   form.validateFields((err, fieldsValue) => {
    //     if (err) {
    //       return;
    //     }
    //     message.info('????????????????????????????????????');
    //     this.setState({ submitting: true });
    //     dispatch({
    //       type: 'order/importKingdee2',
    //       payload: { ...fieldsValue, uploadFileList },
    //       callback: response => {
    //         this.setState({ submitting: false });
    //         if (response.status === 400) {
    //           notification.error({
    //             message: '??????????????????',
    //             description: response.message,
    //           });
    //         } else {
    //           const { countSucceed, countFailed } = response;
    //           if (countSucceed === 0) {
    //             notification.error({
    //               message: '??????????????????',
    //               description: `???${countFailed}???????????????????????????????????????????????????`,
    //             });
    //           }
    //           message.success(`????????????${countSucceed}?????????`);
    //           if (countFailed !== 0) {
    //             message.error(`${countFailed}???????????????????????????????????????????????????`);
    //           }
    //         }
    //       },
    //     });
    //   });
    // };

    const handleGeneralSubmit = e => {
      e.preventDefault();
      form.validateFields((err, fieldsValue) => {
        if (err) {
          return;
        }
        message.info('????????????????????????????????????');
        this.setState({ submitting: true });
        dispatch({
          type: 'order/importGeneral',
          payload: { ...fieldsValue, uploadFileList },
          callback: response => {
            this.setState({ submitting: false });
            if (response.status === 400) {
              notification.error({
                message: '??????????????????',
                description: response.message,
              });
            } else {
              const { countSucceed, countFailed } = response;
              if (countSucceed === 0) {
                notification.error({
                  message: '??????????????????',
                  description: `???${countFailed}???????????????????????????????????????????????????`,
                });
              }
              message.success(`????????????${countSucceed}?????????`);
              if (countFailed !== 0) {
                message.error(`${countFailed}???????????????????????????????????????????????????`);
              }
            }
          },
        });
      });
    };

    // const handleHtmlSubmit = e => {
    //   e.preventDefault();
    //   form.validateFields((err, fieldsValue) => {
    //     if (err) {
    //       return;
    //     }
    //     message.info('????????????????????????????????????');
    //     this.setState({ submitting: true });
    //     dispatch({
    //       type: 'order/importHtml',
    //       payload: { ...fieldsValue, uploadFileList },
    //       callback: response => {
    //         this.setState({ submitting: false });
    //         if (response.status === 400) {
    //           notification.error({
    //             message: '??????????????????',
    //             description: response.message,
    //           });
    //         } else {
    //           const { countSucceed, countFailed } = response;
    //           if (countSucceed === 0) {
    //             notification.error({
    //               message: '??????????????????',
    //               description: `???${countFailed}???????????????????????????????????????????????????`,
    //             });
    //           }
    //           message.success(`????????????${countSucceed}?????????`);
    //           if (countFailed !== 0) {
    //             message.error(`${countFailed}???????????????????????????????????????????????????`);
    //           }
    //         }
    //       },
    //     });
    //   });
    // };

    const handleUploadChange = info => {
      let { fileList } = info;
      fileList = fileList.map(file => {
        if (file.response) {
          return file.response;
        }
        return null;
      });
      fileList = fileList.filter(file => {
        return typeof file === 'string';
      });
      this.setState({ uploadFileList: fileList });
    };

    const uploadExcelProps = {
      name: 'file',
      action: '/api/customer_orders/upload_excel_file',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      onChange: handleUploadChange,
      multiple: true,
      accept:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
    };

    const getKingdeeForm = () => {
      return (
        <Form {...formItemLayout} onSubmit={handleKingdeeSubmit} style={{ marginTop: 8 }}>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('customer', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: customerFilter,
            })(
              <Select
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
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('wareZone')(
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
          <FormItem label="???????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('orderExpireDateMin')(<DatePicker />)}
          </FormItem>
          <FormItem label="???????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('orderExpireDateMax')(<DatePicker />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('qualityAssuranceExponent')(<Input />)}
          </FormItem>
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
          <FormItem label="????????????????????????" {...this.formLayout}>
            {getFieldDecorator('usePackCount', {
              initialValue: false,
            })(<Switch checkedChildren="???" unCheckedChildren="???" />)}
          </FormItem>
          <FormItem label="??????????????????" {...this.formLayout}>
            {getFieldDecorator('useNewAutoIncreaseSn', {
              initialValue: false,
            })(<Switch checkedChildren="???" unCheckedChildren="???" />)}
          </FormItem>
          <FormItem label="??????????????????" {...this.formLayout}>
            {getFieldDecorator('fetchStocks', {
              initialValue: true,
            })(<Switch checkedChildren="???" unCheckedChildren="???" defaultChecked />)}
          </FormItem>
          <FormItem label="??????????????????" {...this.formLayout}>
            {getFieldDecorator('originalFileList', {
              rules: [{ required: true, message: '?????????????????????' }],
            })(
              <Upload {...uploadExcelProps}>
                <Button>
                  <Icon type="upload" /> ??????????????????
                </Button>
              </Upload>
            )}
          </FormItem>
          <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              <FormattedMessage id="form.submit" />
            </Button>
          </FormItem>
          <Divider />
          <a href="/template/???????????????.zip">????????????????????????</a>
        </Form>
      );
    };

    // const getKingdee2Form = () => {
    //   return (
    //     <Form {...formItemLayout} onSubmit={handleKingdee2Submit} style={{ marginTop: 8 }}>
    //       <FormItem label="????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('customer', {
    //           rules: [{ required: true, message: '?????????????????????' }],
    //           initialValue: customerFilter,
    //         })(
    //           <Select
    //             showSearch
    //             filterOption={(input, option) =>
    //               option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    //             }
    //             placeholder="?????????????????????"
    //             onChange={handleSelectCustomer}
    //           >
    //             {getCustomersOptions(customerList)}
    //           </Select>
    //         )}
    //       </FormItem>
    //       <FormItem label="????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('wareZone')(
    //           <Select
    //             mode="multiple"
    //             allowClear
    //             showSearch
    //             filterOption={(input, option) =>
    //               option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    //             }
    //             placeholder="??????????????????????????????"
    //             style={{ width: '100%' }}
    //           >
    //             {getWareZoneOptions(wareZoneList)}
    //           </Select>
    //         )}
    //       </FormItem>
    //       <FormItem label="???????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('orderExpireDateMin')(<DatePicker />)}
    //       </FormItem>
    //       <FormItem label="???????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('orderExpireDateMax')(<DatePicker />)}
    //       </FormItem>
    //       <FormItem label="????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('qualityAssuranceExponent')(<Input />)}
    //       </FormItem>
    //       <FormItem label="??????????????????" {...this.formLayout}>
    //         {getFieldDecorator('fetchAll', {
    //           initialValue: fetchAll !== undefined && fetchAll,
    //         })(
    //           <Switch
    //             checked={fetchAll !== undefined && fetchAll}
    //             checkedChildren="???"
    //             unCheckedChildren="???"
    //             onChange={handleFetchAllSwitch}
    //           />
    //         )}
    //       </FormItem>
    //       <FormItem label="????????????????????????" {...this.formLayout}>
    //         {getFieldDecorator('usePackCount', {
    //           initialValue: false,
    //         })(<Switch checkedChildren="???" unCheckedChildren="???" />)}
    //       </FormItem>
    //       <FormItem label="??????????????????" {...this.formLayout}>
    //         {getFieldDecorator('useNewAutoIncreaseSn', {
    //           initialValue: false,
    //         })(<Switch checkedChildren="???" unCheckedChildren="???" />)}
    //       </FormItem>
    //       <FormItem label="??????????????????" {...this.formLayout}>
    //         {getFieldDecorator('fetchStocks', {
    //           initialValue: true,
    //         })(<Switch checkedChildren="???" unCheckedChildren="???" defaultChecked />)}
    //       </FormItem>
    //       <FormItem label="??????????????????" {...this.formLayout}>
    //         {getFieldDecorator('originalFileList', {
    //           rules: [{ required: true, message: '?????????????????????' }],
    //         })(
    //           <Upload {...uploadExcelProps}>
    //             <Button>
    //               <Icon type="upload" /> ??????????????????
    //             </Button>
    //           </Upload>
    //         )}
    //       </FormItem>
    //       <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
    //         <Button type="primary" htmlType="submit" loading={submitting}>
    //           <FormattedMessage id="form.submit" />
    //         </Button>
    //       </FormItem>
    //       <Divider />
    //       <a href="/template/???????????????.zip">????????????????????????</a>
    //     </Form>
    //   );
    // };

    const getGeneralImportForm = () => {
      return (
        <Form {...formItemLayout} onSubmit={handleGeneralSubmit} style={{ marginTop: 8 }}>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('customer', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: customerFilter,
            })(
              <Select
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
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('wareZone')(
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
          <FormItem label="???????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('orderExpireDateMin')(<DatePicker />)}
          </FormItem>
          <FormItem label="???????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('orderExpireDateMax')(<DatePicker />)}
          </FormItem>
          <FormItem label="????????????" {...this.formLayout} hasFeedback>
            {getFieldDecorator('qualityAssuranceExponent')(<Input />)}
          </FormItem>
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
          <FormItem label="????????????????????????" {...this.formLayout}>
            {getFieldDecorator('usePackCount', {
              initialValue: false,
            })(<Switch checkedChildren="???" unCheckedChildren="???" />)}
          </FormItem>
          <FormItem label="??????????????????" {...this.formLayout}>
            {getFieldDecorator('useNewAutoIncreaseSn', {
              initialValue: false,
            })(<Switch checkedChildren="???" unCheckedChildren="???" />)}
          </FormItem>
          <FormItem label="??????????????????" {...this.formLayout}>
            {getFieldDecorator('fetchStocks', {
              initialValue: true,
            })(<Switch checkedChildren="???" unCheckedChildren="???" defaultChecked />)}
          </FormItem>
          <FormItem label="??????????????????" {...this.formLayout}>
            {getFieldDecorator('originalFileList', {
              rules: [{ required: true, message: '?????????????????????' }],
            })(
              <Upload {...uploadExcelProps}>
                <Button>
                  <Icon type="upload" /> ??????????????????
                </Button>
              </Upload>
            )}
          </FormItem>
          <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              <FormattedMessage id="form.submit" />
            </Button>
          </FormItem>
          <div>
            <h4>????????????</h4>
            <ol>
              <li>1.???????????????????????????????????????????????????????????????</li>
              <li>2.??????????????????????????????????????????&quot;??????&quot;????????????????????????</li>
            </ol>
          </div>
          <Divider />
          <a href="/template/??????????????????.zip">????????????????????????</a>
        </Form>
      );
    };

    // const uploadHtmlProps = {
    //   name: 'file',
    //   action: '/api/customer_orders/upload_html_file',
    //   headers: {
    //     Authorization: `Bearer ${getToken()}`,
    //   },
    //   onChange: handleUploadChange,
    //   multiple: true,
    //   accept: 'text/html',
    // };

    // const getHtmlImportForm = () => {
    //   return (
    //     <Form {...formItemLayout} onSubmit={handleHtmlSubmit} style={{ marginTop: 8 }}>
    //       <FormItem label="????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('customer', {
    //           rules: [{ required: true, message: '?????????????????????' }],
    //           initialValue: customerFilter,
    //         })(
    //           <Select
    //             showSearch
    //             filterOption={(input, option) =>
    //               option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    //             }
    //             placeholder="?????????????????????"
    //             onChange={handleSelectCustomer}
    //           >
    //             {getCustomersOptions(customerList)}
    //           </Select>
    //         )}
    //       </FormItem>
    //       <FormItem label="????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('wareZone')(
    //           <Select
    //             mode="multiple"
    //             allowClear
    //             showSearch
    //             filterOption={(input, option) =>
    //               option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    //             }
    //             placeholder="??????????????????????????????"
    //             style={{ width: '100%' }}
    //           >
    //             {getWareZoneOptions(wareZoneList)}
    //           </Select>
    //         )}
    //       </FormItem>
    //       <FormItem label="???????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('orderExpireDateMin')(<DatePicker />)}
    //       </FormItem>
    //       <FormItem label="???????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('orderExpireDateMax')(<DatePicker />)}
    //       </FormItem>
    //       <FormItem label="????????????" {...this.formLayout} hasFeedback>
    //         {getFieldDecorator('qualityAssuranceExponent')(<Input />)}
    //       </FormItem>
    //       <FormItem label="??????????????????" {...this.formLayout}>
    //         {getFieldDecorator('fetchAll', {
    //           initialValue: fetchAll !== undefined && fetchAll,
    //         })(
    //           <Switch
    //             checked={fetchAll !== undefined && fetchAll}
    //             checkedChildren="???"
    //             unCheckedChildren="???"
    //             onChange={handleFetchAllSwitch}
    //           />
    //         )}
    //       </FormItem>
    //       <FormItem label="????????????????????????" {...this.formLayout}>
    //         {getFieldDecorator('usePackCount', {
    //           initialValue: false,
    //         })(<Switch checkedChildren="???" unCheckedChildren="???" />)}
    //       </FormItem>
    //       <FormItem label="??????????????????" {...this.formLayout}>
    //         {getFieldDecorator('useNewAutoIncreaseSn', {
    //           initialValue: false,
    //         })(<Switch checkedChildren="???" unCheckedChildren="???" />)}
    //       </FormItem>
    //       <FormItem label="??????????????????" {...this.formLayout}>
    //         {getFieldDecorator('fetchStocks', {
    //           initialValue: true,
    //         })(<Switch checkedChildren="???" unCheckedChildren="???" defaultChecked />)}
    //       </FormItem>
    //       <FormItem label="??????????????????" {...this.formLayout}>
    //         {getFieldDecorator('originalFileList', {
    //           rules: [{ required: true, message: '?????????????????????' }],
    //         })(
    //           <Upload {...uploadHtmlProps}>
    //             <Button>
    //               <Icon type="upload" /> ??????????????????
    //             </Button>
    //           </Upload>
    //         )}
    //       </FormItem>
    //       <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
    //         <Button type="primary" htmlType="submit" loading={submitting}>
    //           <FormattedMessage id="form.submit" />
    //         </Button>
    //       </FormItem>
    //       <Divider />
    //       <a href="/template/??????HTML?????????.zip">????????????????????????</a>
    //     </Form>
    //   );
    // };

    return (
      <PageHeaderWrapper>
        <div className={styles.standardList}>
          <Card
            bordered
            title="????????????"
            style={{ marginTop: 24 }}
            bodyStyle={{ padding: '0 32px 40px 32px' }}
          >
            <Tabs defaultActiveKey="1">
              <TabPane tab="????????????????????????" key="1">
                {getGeneralImportForm()}
              </TabPane>
              <TabPane tab="???????????????????????????" key="2">
                {getKingdeeForm()}
              </TabPane>
              {/* <TabPane tab="???????????????????????????" key="3">
                {getKingdee2Form()}
              </TabPane>
              <TabPane tab="????????????HTML??????" key="4">
                {getHtmlImportForm()}
              </TabPane> */}
            </Tabs>
          </Card>
        </div>
      </PageHeaderWrapper>
    );
  }
}

export default ImportOrder;
