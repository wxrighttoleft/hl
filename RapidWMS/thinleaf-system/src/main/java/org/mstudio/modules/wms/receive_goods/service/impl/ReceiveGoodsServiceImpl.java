package org.mstudio.modules.wms.receive_goods.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import lombok.extern.slf4j.Slf4j;
import org.mstudio.exception.BadRequestException;
import org.mstudio.modules.security.security.JwtUser;
import org.mstudio.modules.system.repository.UserRepository;
import org.mstudio.modules.wms.common.WmsUtil;
import org.mstudio.modules.wms.customer.domain.Customer;
import org.mstudio.modules.wms.customer.repository.CustomerRepository;
import org.mstudio.modules.wms.customer.service.object.CustomerVO;
import org.mstudio.modules.wms.goods.service.impl.GoodsServiceImpl;
import org.mstudio.modules.wms.receive_goods.domain.ReceiveGoods;
import org.mstudio.modules.wms.receive_goods.domain.ReceiveGoodsItem;
import org.mstudio.modules.wms.receive_goods.repository.ReceiveGoodsItemRepository;
import org.mstudio.modules.wms.receive_goods.repository.ReceiveGoodsRepository;
import org.mstudio.modules.wms.receive_goods.service.ReceiveGoodsService;
import org.mstudio.modules.wms.receive_goods.service.ReceivePieceService;
import org.mstudio.modules.wms.receive_goods.service.mapper.ReceiveGoodsMapper;
import org.mstudio.modules.wms.receive_goods.service.object.ReceiveGoodsDTO;
import org.mstudio.modules.wms.receive_goods.service.object.ReceiveGoodsExcelObj;
import org.mstudio.modules.wms.receive_goods.service.object.ReceiveGoodsVO;
import org.mstudio.modules.wms.stock.service.StockService;
import org.mstudio.modules.wms.stock_flow.repository.StockFlowRepository;
import org.mstudio.utils.PageUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import java.io.ByteArrayOutputStream;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

import static org.mstudio.utils.SecurityContextHolder.getUserDetails;

/**
 * @author Macrow
 * @date 2019-02-22
 */

@Slf4j
@Service
@Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
public class ReceiveGoodsServiceImpl implements ReceiveGoodsService {

    public final static String CACHE_NAME = "ReceiveGoods";

    private static final String RECEIVE_GOODS_SN_PREFIX = "RG";

    @Value("${excel.export-max-count}")
    private Integer maxCount;

    @Autowired
    private ReceiveGoodsRepository receiveGoodsRepository;

    @Autowired
    private ReceiveGoodsMapper receiveGoodsMapper;

    @Autowired
    private ReceiveGoodsItemRepository receiveGoodsItemRepository;

    @Autowired
    private StockService stockService;

    @Autowired
    private StockFlowRepository stockFlowRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    ReceivePieceService receivePieceService;

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
//    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    public Map queryAll(Set<CustomerVO> customers, Boolean exportExcel, String customerFilter, String receiveGoodsTypeFilter,
                        Boolean isAuditedFilter,Boolean isUnloadFilter, String startDate, String endDate, String search, Pageable pageable) {
        Specification<ReceiveGoods> spec = new Specification<ReceiveGoods>() {
            @Override
            public Predicate toPredicate(Root<ReceiveGoods> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> predicates = new ArrayList<>();

                if (customerFilter != null && !"".equals(customerFilter)) {
                    String[] customerIds = customerFilter.split(",");
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("customer").get("id"));
                    Arrays.stream(customerIds).forEach(id -> in.value(Long.valueOf(id)));
                    predicates.add(in);
                }

                if (receiveGoodsTypeFilter != null && !"".equals(receiveGoodsTypeFilter)) {
                    String[] receiveGoodsType = receiveGoodsTypeFilter.split(",");
                    CriteriaBuilder.In<Integer> in = criteriaBuilder.in(root.get("receiveGoodsType"));
                    Arrays.stream(receiveGoodsType).forEach(id -> in.value(Integer.parseInt(id)));
                    predicates.add(in);
                }

                if (isAuditedFilter != null) {
                    predicates.add(criteriaBuilder.equal(root.get("isAudited").as(Boolean.class), isAuditedFilter));
                }

                if (isUnloadFilter != null) {
                    predicates.add(criteriaBuilder.equal(root.get("isUnload").as(Boolean.class), isUnloadFilter));
                }

                if (startDate != null && endDate != null) {
                    Date start = DateUtil.parse(startDate);
                    Date end = DateUtil.parse(endDate);
                    // ????????????????????????????????????????????????????????????0????????????????????????
                    Calendar c = Calendar.getInstance();
                    c.setTime(end);
                    c.add(Calendar.DAY_OF_MONTH, 1);
                    end = c.getTime();
                    predicates.add(criteriaBuilder.between(root.get("createTime").as(Date.class), start, end));
                }

                if (search != null) {
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.like(root.get("flowSn").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("customer").get("name").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("description").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("creator").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("auditor").as(String.class), "%" + search + "%")
                    ));
                }

                // ??????????????????????????????
                if (!customers.isEmpty()) {
                    List<Long> customerIdList = customers.stream().map(customer -> Long.valueOf(customer.getId())).collect(Collectors.toList());
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("customer").get("id"));
                    customerIdList.forEach(id -> in.value(id));
                    predicates.add(in);
                }

                if (predicates.size() != 0) {
                    Predicate[] p = new Predicate[predicates.size()];
                    return criteriaBuilder.and(predicates.toArray(p));
                } else {
                    return null;
                }
            }
        };

        // ???????????????????????????????????????
        Sort sort = pageable.getSort().and(new Sort(Sort.Direction.DESC, "id"));
        Pageable newPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        if (exportExcel) {
            newPageable = PageRequest.of(0, maxCount, sort);
        }
        Page<ReceiveGoods> page = receiveGoodsRepository.findAll(spec, newPageable);
        return PageUtil.toPage(page.map(receiveGoodsMapper::toVO));
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public ReceiveGoodsDTO create(ReceiveGoods resource) {
        if (resource.getReceiveGoodsItems().isEmpty()) {
            throw new BadRequestException("???????????????????????????1???????????????");
        }
        JwtUser jwtUser = (JwtUser)getUserDetails();
        resource.setFlowSn(RECEIVE_GOODS_SN_PREFIX + WmsUtil.generateSnowFlakeId());
        resource.setIsAudited(false);
        resource.setCreator(jwtUser.getUsername());
        ReceiveGoods receiveGoods = receiveGoodsRepository.save(resource);
        List<ReceiveGoodsItem> items = resource.getReceiveGoodsItems().stream().
                peek(item -> item.setReceiveGoods(receiveGoods)).collect(Collectors.toList());
        receiveGoodsItemRepository.saveAll(items);
        Optional<Customer> optionalCustomer = customerRepository.findById(receiveGoods.getCustomer().getId());
        if (optionalCustomer.isPresent()) {
            receiveGoods.setCustomer(optionalCustomer.get());
        }
        return receiveGoodsMapper.toDto(receiveGoods);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public ReceiveGoodsDTO unload(ReceiveGoods resource) {
        if (resource.getReceiveGoodsItems().isEmpty()) {
            throw new BadRequestException("???????????????????????????1???????????????");
        }
        JwtUser jwtUser = (JwtUser)getUserDetails();
        resource.setFlowSn(RECEIVE_GOODS_SN_PREFIX + WmsUtil.generateSnowFlakeId());
        resource.setIsAudited(false);
        resource.setIsUnload(true);
        resource.setCreator(jwtUser.getUsername());
        ReceiveGoods receiveGoods = receiveGoodsRepository.save(resource);
        List<ReceiveGoodsItem> items = resource.getReceiveGoodsItems().stream().
                peek(item -> item.setReceiveGoods(receiveGoods)).collect(Collectors.toList());
        receiveGoodsItemRepository.saveAll(items);
        Optional<Customer> optionalCustomer = customerRepository.findById(receiveGoods.getCustomer().getId());
        if (optionalCustomer.isPresent()) {
            receiveGoods.setCustomer(optionalCustomer.get());
        }
        return receiveGoodsMapper.toDto(receiveGoods);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public ReceiveGoodsDTO update(Long id, ReceiveGoods resource) {
        Optional<ReceiveGoods> optionalReceiveGoods = receiveGoodsRepository.findById(id);
        if (!optionalReceiveGoods.isPresent()) {
            throw new BadRequestException("?????????ID??????");
        }
        ReceiveGoods receiveGoods = optionalReceiveGoods.get();
        if (!receiveGoods.getId().equals(resource.getId())) {
            throw new BadRequestException("?????????ID??????");
        }

        if (receiveGoods.getIsAudited()) {
            throw new BadRequestException("???????????????????????????????????????");
        }

        List<ReceiveGoodsItem> items = receiveGoods.getReceiveGoodsItems();
        receiveGoodsItemRepository.deleteAll(items);

        JwtUser user = (JwtUser)getUserDetails();
        receiveGoods.setIsAudited(false);
        // ????????????????????????????????????
        // receiveGoods.setCreator(user.getUsername());
        receiveGoods.setReceiveGoodsType(resource.getReceiveGoodsType());
        receiveGoods.setDescription(resource.getDescription());
        items = resource.getReceiveGoodsItems().stream().
                peek(item -> item.setReceiveGoods(receiveGoods)).collect(Collectors.toList());
        receiveGoodsItemRepository.saveAll(items);
        receiveGoods.setReceiveGoodsItems(items);
        return receiveGoodsMapper.toDto(receiveGoodsRepository.save(receiveGoods));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = GoodsServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = GoodsServiceImpl.CACHE_NAME_UNSALE, allEntries = true)
    })
    public ReceiveGoodsVO audit(ReceiveGoods resource) {
        Optional<ReceiveGoods> optionalReceiveGoods = receiveGoodsRepository.findById(resource.getId());
        if (!optionalReceiveGoods.isPresent()) {
            throw new BadRequestException("?????????????????????ID??????");
        }
        ReceiveGoods receiveGoods = optionalReceiveGoods.get();
        if (!receiveGoods.getId().equals(resource.getId())) {
            throw new BadRequestException("?????????????????????ID??????");
        }

        if (receiveGoods.getIsAudited()) {
            throw new BadRequestException("?????????????????????????????????????????????");
        }

        if (receiveGoods.getReceiveGoodsItems().isEmpty()) {
            throw new BadRequestException("??????????????????????????????");
        }

        List<ReceiveGoodsItem> items = receiveGoods.getReceiveGoodsItems();
        receiveGoodsItemRepository.deleteAll(items);

        items = resource.getReceiveGoodsItems().stream().
                peek(item -> item.setReceiveGoods(receiveGoods)).collect(Collectors.toList());
        receiveGoodsItemRepository.saveAll(items);

        JwtUser user = (JwtUser)getUserDetails();
        receiveGoods.setIsAudited(true);
        receiveGoods.setAuditTime(new Timestamp(System.currentTimeMillis()));
        receiveGoods.setAuditor(user.getUsername());
        receiveGoods.setReceiveGoodsType(resource.getReceiveGoodsType());
        receiveGoods.setDescription(resource.getDescription());
        receiveGoods.setReceiveGoodsItems(items);
        ReceiveGoods result = receiveGoodsRepository.save(receiveGoods);
        stockService.receiveGoods(receiveGoods);
        // ????????????
        receivePieceService.save(receiveGoods);
        return receiveGoodsMapper.toVO(result);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = GoodsServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = GoodsServiceImpl.CACHE_NAME_UNSALE, allEntries = true)
    })
    public ReceiveGoodsVO cancelAudit(ReceiveGoods resource) {
        Optional<ReceiveGoods> optionalReceiveGoods = receiveGoodsRepository.findById(resource.getId());
        if (!optionalReceiveGoods.isPresent()) {
            throw new BadRequestException("?????????????????????ID??????");
        }
        ReceiveGoods receiveGoods = optionalReceiveGoods.get();
        if (!receiveGoods.getId().equals(resource.getId())) {
            throw new BadRequestException("?????????????????????ID??????");
        }

        if (!receiveGoods.getIsAudited()) {
            throw new BadRequestException("????????????????????????????????????");
        }

        if (receiveGoods.getReceiveGoodsItems().isEmpty()) {
            throw new BadRequestException("??????????????????????????????");
        }

        // ????????????-??????
        receivePieceService.cancel(receiveGoods);

        if (stockService.cancelReceiveGoods(receiveGoods)) {
            stockFlowRepository.deleteAllByReceiveGoodsId(receiveGoods.getId());
            receiveGoods.setAuditor(null);
            receiveGoods.setAuditTime(null);
            receiveGoods.setIsAudited(false);
            return receiveGoodsMapper.toVO(receiveGoodsRepository.save(receiveGoods));
        }
        return null;
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void delete(Long id) {
        Optional<ReceiveGoods> optionalReceiveGoods = receiveGoodsRepository.findById(id);
        if (!optionalReceiveGoods.isPresent()) {
            throw new BadRequestException(" ????????????????????? ID=" + id);
        }
        ReceiveGoods receiveGoods = optionalReceiveGoods.get();
        if (receiveGoods.getIsAudited()) {
            throw new BadRequestException("???????????????????????????????????????");
        }
        receiveGoodsItemRepository.deleteAll(receiveGoods.getReceiveGoodsItems());
        receiveGoodsRepository.delete(receiveGoods);
        // ????????????-??????
        receivePieceService.cancel(receiveGoods);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
//    @Cacheable(value = CACHE_NAME, key = "#p0")
    public ReceiveGoodsDTO findById(Long id) {
        Optional<ReceiveGoods> optionalReceiveGoods = receiveGoodsRepository.findById(id);
        if (!optionalReceiveGoods.isPresent()) {
            throw new BadRequestException(" ????????????????????? ID=" + id);
        }
        return receiveGoodsMapper.toDto(optionalReceiveGoods.get());
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
    public byte[] exportExcelData(List<ReceiveGoodsVO> receiveGoods) {
        List<ReceiveGoodsExcelObj> rows = CollUtil.newArrayList();
        for (int i = 0; i < receiveGoods.size(); i++) {
            ReceiveGoodsExcelObj excelObj = new ReceiveGoodsExcelObj();
            ReceiveGoodsVO receiveGoodsVO = receiveGoods.get(i);
            excelObj.setIndex(Long.valueOf(i + 1));
            excelObj.setCustomerName(receiveGoodsVO.getCustomer().getName());
            excelObj.setFlowSn(receiveGoodsVO.getFlowSn());
            excelObj.setReceiveGoodsType(receiveGoodsVO.getReceiveGoodsType().getName());
            excelObj.setCreateTime(DateUtil.format(receiveGoodsVO.getCreateTime(), "yyyy-MM-dd"));
            excelObj.setCreator(receiveGoodsVO.getCreator());
            excelObj.setIsAudited(receiveGoodsVO.getIsAudited() ? "???" : "???");
            if (receiveGoodsVO.getAuditTime() != null) {
                excelObj.setAuditTime(DateUtil.format(receiveGoodsVO.getAuditTime(), "yyyy-MM-dd"));
            }
            if (receiveGoodsVO.getAuditor() != null) {
                excelObj.setAuditor(receiveGoodsVO.getAuditor());
            }
            excelObj.setDescription(receiveGoodsVO.getDescription());
            rows.add(excelObj);
        }

        ByteArrayOutputStream outByteStream = new ByteArrayOutputStream();
        ExcelWriter writer = ExcelUtil.getBigWriter();
        writer.addHeaderAlias("index", "#");
        writer.addHeaderAlias("customerName", "????????????");
        writer.addHeaderAlias("flowSn", "?????????");
        writer.addHeaderAlias("receiveGoodsType", "????????????");
        writer.addHeaderAlias("createTime", "????????????");
        writer.addHeaderAlias("creator", "???????????????");
        writer.addHeaderAlias("isAudited", "????????????");
        writer.addHeaderAlias("auditTime", "????????????");
        writer.addHeaderAlias("auditor", "?????????");
        writer.addHeaderAlias("description", "??????");

        writer.write(rows, true);
        writer.flush(outByteStream);
        writer.close();
        return outByteStream.toByteArray();
    }

    /**
     * ??????
     * @param id
     * @return
     */
    @Override
    public ReceiveGoodsDTO putInStorage(Long id) {
        Optional<ReceiveGoods> optionalReceiveGoods = receiveGoodsRepository.findById(id);
        if (!optionalReceiveGoods.isPresent()) {
            throw new BadRequestException(" ????????????????????? ID=" + id);
        }
        ReceiveGoods receiveGoods = optionalReceiveGoods.get();
        return receiveGoodsMapper.toDto(receiveGoods);
    }

}