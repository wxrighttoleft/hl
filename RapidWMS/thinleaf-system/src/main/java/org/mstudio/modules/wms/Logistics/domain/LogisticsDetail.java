package org.mstudio.modules.wms.Logistics.domain;

import lombok.Data;
import org.mstudio.modules.wms.common.BaseEntity;

import javax.persistence.Entity;
import javax.persistence.Table;

/**
 * 物流结算明细
* @author lfj
* @date 2020-12-01
*/

@Data
@Entity
@Table(name = "wms_logistics_detail")
@org.hibernate.annotations.Table(appliesTo = "wms_logistics_detail",comment = "物流结算明细")
public class LogisticsDetail extends BaseEntity {

    /**
     * 省
     */
    private String province;

    /**
     * 单据
     */
    private String bill;

    /**
     * 件
     */
    private Float piece;

    /**
     * 实际重量
     */
    private Float realityWeight;

    /**
     * 计算重量
     */
    private Float computeWeight;

    /**
     * 续重/续件（千克、件）单位
     */
    private Float renew;

    /**
     * 实际 续重/续件（千克、件）数量
     */
    private Float renewNum;

    /**
     * 渠道
     */
    private String name;

    /**
     * 首重/首件（千克、件）
     */
    private Float first;

    /**
     * 首重/首件单价（分）
     */
    private Integer firstPrice;

    /**
     * 续重/续件单价（分）
     */
    private Integer renewPrice;

    /**
     * 总价
     */
    private Integer totalPrice;

    /**
     * 备注
     */
    private String remark;

    /**
     * 客户
     */
    private String customer;

    /**
     * 地址
     */
    private String address;

    /**
     * 保费（分）
     */
    private Integer protectPrice;


}