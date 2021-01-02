package org.mstudio.modules.wms.customer_order.service.handler;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.poi.excel.sax.handler.RowHandler;
import lombok.extern.slf4j.Slf4j;
import org.mstudio.exception.BadRequestException;
import org.mstudio.modules.wms.common.MultiOperateResult;
import org.mstudio.modules.wms.common.WmsUtil;
import org.mstudio.modules.wms.customer.domain.Customer;
import org.mstudio.modules.wms.customer_order.domain.CustomerOrder;
import org.mstudio.modules.wms.customer_order.domain.CustomerOrderItem;
import org.mstudio.modules.wms.customer_order.domain.OrderStatus;
import org.mstudio.modules.wms.customer_order.service.CustomerOrderService;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * @author Macrow
 * @date 2019-03-26
 */

@Slf4j
public class GeneralHandler implements RowHandler {

    private MultiOperateResult result;
    private Customer customer;
    private CustomerOrderService orderService;
    private List<CustomerOrderItem> orderItems;
    private CustomerOrder order = null;
    private String type;
    private String targetWareZone;
    private Boolean useNewAutoIncreaseSn;
    private String sn;
    private Date expireDateMin;
    private Date expireDateMax;
    private Boolean fetchAll;
    private Boolean fetchStocks;
    private int itemSortOrder = 1;
    private Float qualityAssuranceExponent;

    private final static int ORDER_PRINT_TITLE = 0;
    private final static int ORDER_CLIENT_NAME = 1;
    private final static int ORDER_CLIENT_STORE = 2;
    private final static int ORDER_CLIENT_ADDRESS = 3;
    private final static int ORDER_SN = 4;
    private final static int ORDER_SN2 = 5;
    private final static int ORDER_OPERATOR = 6;
    private final static int ORDER_DESCRIPTION = 7;

    private final static int GOODS_NAME = 8;
    private final static int GOODS_SN = 9;
    private final static int GOODS_PRICE = 10;
    private final static int GOODS_QUANTITY = 11;
    private final static int GOODS_PACK_COUNT = 12;
    private final static int MONTHS_OF_WARRANTY = 13;

    public GeneralHandler(MultiOperateResult result, CustomerOrderService orderService, Customer customer, String targetWareZone,
                          Boolean useNewAutoIncreaseSn, Date expireDateMin, Date expireDateMax, Boolean fetchAll, Boolean fetchStocks,
                          String sn, Float qualityAssuranceExponent) {
        this.result = result;
        this.customer = customer;
        this.orderService = orderService;
        this.targetWareZone = targetWareZone;
        this.useNewAutoIncreaseSn = useNewAutoIncreaseSn;
        this.type = customer.getShortNameEn();
        this.expireDateMin = expireDateMin;
        this.expireDateMax = expireDateMax;
        this.fetchAll = fetchAll;
        this.fetchStocks = fetchStocks;
        this.sn = sn;
        this.qualityAssuranceExponent = qualityAssuranceExponent;
    }

    @Override
    synchronized public void handle(int i, int i1, List<Object> list) {
        //log.info("[{}] [{}] {}", i, i1, list);

        // 第一行
        if (i1 == 0) {
            if (useNewAutoIncreaseSn) {
                sn = WmsUtil.ORDER_SN_START;
            } else {
                sn = orderService.getLastAutoIncreaseSn(customer.getId()).replace(type, "");
            }
            return;
        }
        // 最后一行，保存
        if (list.get(0) != null && list.get(0).toString().contains("结束")) {
            order.setCustomerOrderItems(orderItems);
            try {
                orderService.create(order, false, fetchStocks);
                result.addSucceed();
            } catch (BadRequestException e) {
                result.addFailed();
            }
            return;
        }

        // 单个订单开始的标志
        if (list.get(ORDER_PRINT_TITLE) != null && !list.get(ORDER_PRINT_TITLE).toString().isEmpty()) {
            // 订单循环中，上一个订单保存
            if (order != null) {
                order.setCustomerOrderItems(orderItems);
                try {
                    orderService.create(order, false, fetchStocks);
                    result.addSucceed();
                } catch (BadRequestException e) {
                    result.addFailed();
                }
                itemSortOrder = 1;
            }
            order = new CustomerOrder();
            order.setQualityAssuranceExponent(qualityAssuranceExponent);
            orderItems = new ArrayList<>();
            order.setOwner(customer);
            order.setUsePackCount(false);
            order.setTargetWareZones(targetWareZone);

            Object orderSN = list.get(ORDER_SN);
            if (orderSN instanceof Double) {
                order.setClientOrderSn(new BigDecimal(((Double) orderSN).doubleValue()).toPlainString());
            } else {
                order.setClientOrderSn(orderSN.toString());
            }

            Object orderSN2 = list.get(ORDER_SN2);
            if (orderSN2 instanceof Double) {
                order.setClientOrderSn2(new BigDecimal(((Double) orderSN2).doubleValue()).toPlainString());
            } else {
                order.setClientOrderSn2(orderSN2.toString());
            }

            order.setClientName(list.get(ORDER_CLIENT_NAME) == null ? "" : list.get(ORDER_CLIENT_NAME).toString());
            order.setClientOperator(list.get(ORDER_OPERATOR) == null ? "" : list.get(ORDER_OPERATOR).toString());
            order.setDescription(list.get(ORDER_DESCRIPTION) == null ? "" : list.get(ORDER_DESCRIPTION).toString());

            // 以下两项信息暂时由订货点名称填入
            order.setClientAddress(list.get(ORDER_CLIENT_ADDRESS) == null ? "" : list.get(ORDER_CLIENT_ADDRESS).toString());
            order.setClientStore(list.get(ORDER_CLIENT_STORE) == null ? "" : list.get(ORDER_CLIENT_STORE).toString());
            order.setExpireDateMin(expireDateMin);
            order.setExpireDateMax(expireDateMax);
            order.setFetchAll(fetchAll);
            order.setFlowSn(WmsUtil.generateTimeStampSN());
            order.setIsActive(true);
            order.setOrderStatus(OrderStatus.INIT);
            sn = WmsUtil.getNewSn(type, sn, false);
            order.setAutoIncreaseSn(sn);
        }
        // 每单行循环
        CustomerOrderItem orderItem = new CustomerOrderItem();
        orderItem.setSortOrder(itemSortOrder++);
        orderItem.setName(list.get(GOODS_NAME).toString());
        if (ObjectUtil.isNotNull(list.get(MONTHS_OF_WARRANTY))) {
            orderItem.setMonthsOfWarranty(Integer.parseInt(StrUtil.removeAll(list.get(MONTHS_OF_WARRANTY).toString(), ".0")));
        }

        Object goodsSN = list.get(GOODS_SN);
        if (goodsSN instanceof Double) {
            orderItem.setSn(new BigDecimal(((Double) goodsSN).doubleValue()).toPlainString());
        } else {
            orderItem.setSn(goodsSN.toString());
        }

        orderItem.setPackCount(WmsUtil.getFirstNumbersFromString(list.get(GOODS_PACK_COUNT) == null ? "0" : list.get(GOODS_PACK_COUNT).toString()));
        orderItem.setQuantityInitial(new Long(StrUtil.removeAll(list.get(GOODS_QUANTITY).toString(), ".0")));
        orderItem.setPrice(new BigDecimal(list.get(GOODS_PRICE).toString()));
        orderItems.add(orderItem);
    }

}
