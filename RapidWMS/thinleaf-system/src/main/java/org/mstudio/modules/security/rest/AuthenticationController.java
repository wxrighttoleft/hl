package org.mstudio.modules.security.rest;

import lombok.extern.slf4j.Slf4j;
import org.mstudio.aop.log.Log;
import org.mstudio.modules.security.security.AuthenticationInfo;
import org.mstudio.modules.security.security.AuthorizationUser;
import org.mstudio.modules.security.security.JwtUser;
import org.mstudio.modules.security.utils.JwtTokenUtil;
import org.mstudio.utils.EncryptUtils;
import org.mstudio.utils.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * @date 2018-11-23
 * 授权、根据token获取用户详细信息
 */
@Slf4j
@RestController
@RequestMapping("auth")
public class AuthenticationController {

    @Value("${jwt.header}")
    private String tokenHeader;

    @Value("${jwt.licence}")
    private Long licence;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    @Qualifier("jwtUserDetailsService")
    private UserDetailsService userDetailsService;

    /**
     * 登录授权
     *
     * @param authorizationUser
     * @return
     */
    @Log("用户登录")
    @PostMapping(value = "${jwt.auth.path}")
    public ResponseEntity login(@Validated @RequestBody AuthorizationUser authorizationUser) throws Exception {

        final JwtUser jwtUser = (JwtUser) userDetailsService.loadUserByUsername(authorizationUser.getUsername());

        if (!jwtUser.getPassword().equals(EncryptUtils.encryptPassword(authorizationUser.getPassword()))) {
            throw new AccountExpiredException("密码错误");
        }

        if (!jwtUser.isEnabled()) {
            throw new AccountExpiredException("账号已停用，请联系管理员");
        }

        if (System.currentTimeMillis() > licence) {
            throw new AccountExpiredException("系统试用已到期，请联系管理员");
        }

        // 生成令牌
        final String token = jwtTokenUtil.generateToken(jwtUser);

        // 返回 token
        return ResponseEntity.ok(new AuthenticationInfo(token, jwtUser));
    }

    /**
     * 获取用户信息
     *
     * @return
     */
    @GetMapping(value = "${jwt.auth.account}")
    public ResponseEntity getUserInfo() {
        UserDetails userDetails = SecurityContextHolder.getUserDetails();
        JwtUser jwtUser = (JwtUser) userDetailsService.loadUserByUsername(userDetails.getUsername());
        return ResponseEntity.ok(jwtUser);
    }
}
