package org.mstudio.modules.system.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.mstudio.modules.wms.customer.service.object.CustomerVO;

import java.io.Serializable;
import java.sql.Timestamp;
import java.util.Date;
import java.util.Set;

/**
 *
 * @date 2018-11-23
 */
@Data
public class UserDTO implements Serializable {

    @ApiModelProperty(hidden = true)
    private Long id;

    private String username;

    private String avatar;

    private String email;

    private Boolean enabled;

    @JsonIgnore
    private String password;

    private Timestamp createTime;

    private Date lastPasswordResetTime;

    private Float coefficient;

    @ApiModelProperty(hidden = true)
    private Set<RoleDTO> roles;

    @ApiModelProperty(hidden = true)
    private Set<CustomerVO> customers;

    /**
     * 编号
     */
    private String num;
}
