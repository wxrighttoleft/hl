package org.mstudio.modules.wms.customer_order.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.NumberUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import cn.hutool.poi.excel.sax.handler.RowHandler;
import com.itextpdf.barcodes.Barcode128;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.xobject.PdfFormXObject;
import com.itextpdf.kernel.utils.PdfMerger;
import com.itextpdf.layout.Canvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.property.AreaBreakType;
import com.itextpdf.layout.property.HorizontalAlignment;
import com.itextpdf.layout.property.TextAlignment;
import com.itextpdf.layout.property.UnitValue;
import lombok.extern.slf4j.Slf4j;
import org.mstudio.exception.BadRequestException;
import org.mstudio.modules.security.security.JwtUser;
import org.mstudio.modules.system.domain.User;
import org.mstudio.modules.system.repository.UserRepository;
import org.mstudio.modules.system.service.dto.UserVO;
import org.mstudio.modules.wms.address.domain.Address;
import org.mstudio.modules.wms.address.repository.AddressRepository;
import org.mstudio.modules.wms.common.MultiOperateResult;
import org.mstudio.modules.wms.common.WmsUtil;
import org.mstudio.modules.wms.customer.service.CustomerService;
import org.mstudio.modules.wms.customer.service.impl.CustomerServiceImpl;
import org.mstudio.modules.wms.customer.service.object.CustomerDTO;
import org.mstudio.modules.wms.customer.service.object.CustomerVO;
import org.mstudio.modules.wms.customer_order.domain.*;
import org.mstudio.modules.wms.customer_order.repository.CustomerOrderItemRepository;
import org.mstudio.modules.wms.customer_order.repository.CustomerOrderPageRepository;
import org.mstudio.modules.wms.customer_order.repository.CustomerOrderRepository;
import org.mstudio.modules.wms.customer_order.repository.CustomerOrderStockRepository;
import org.mstudio.modules.wms.customer_order.service.CustomerOrderService;
import org.mstudio.modules.wms.customer_order.service.handler.GeneralHandler;
import org.mstudio.modules.wms.customer_order.service.handler.HtmlHandler;
import org.mstudio.modules.wms.customer_order.service.handler.Kingdee2Handler;
import org.mstudio.modules.wms.customer_order.service.handler.KingdeeHandler;
import org.mstudio.modules.wms.customer_order.service.mapper.CustomerOrderMapper;
import org.mstudio.modules.wms.customer_order.service.object.*;
import org.mstudio.modules.wms.goods.domain.Goods;
import org.mstudio.modules.wms.goods.repository.GoodsRepository;
import org.mstudio.modules.wms.goods.service.impl.GoodsServiceImpl;
import org.mstudio.modules.wms.kpi.Object.OrderSales;
import org.mstudio.modules.wms.operate_snapshot.repository.OperateSnapshotRepository;
import org.mstudio.modules.wms.operate_snapshot.service.OperateSnapshotService;
import org.mstudio.modules.wms.pack.domain.Pack;
import org.mstudio.modules.wms.pack.repository.PackRepository;
import org.mstudio.modules.wms.pack.service.impl.PackServiceImpl;
import org.mstudio.modules.wms.pick_match.repository.PickMatchRepository;
import org.mstudio.modules.wms.pick_match.service.PickMatchService;
import org.mstudio.modules.wms.stock.domain.Stock;
import org.mstudio.modules.wms.stock.dto.AddDTO;
import org.mstudio.modules.wms.stock.dto.ReduceForOrderItemDTO;
import org.mstudio.modules.wms.stock.dto.ReduceForOrderStockDTO;
import org.mstudio.modules.wms.stock.service.StockService;
import org.mstudio.modules.wms.stock_flow.domain.StockFlow;
import org.mstudio.modules.wms.stock_flow.repository.StockFlowRepository;
import org.mstudio.modules.wms.stock_flow.service.StockFlowService;
import org.mstudio.modules.wms.stock_flow.service.impl.StockFlowServiceImpl;
import org.mstudio.modules.wms.stock_flow.service.object.StockFlowDTO;
import org.mstudio.modules.wms.ware_position.service.object.WarePositionDTO;
import org.mstudio.modules.wms.ware_zone.service.WareZoneService;
import org.mstudio.modules.wms.ware_zone.service.object.WareZoneVO;
import org.mstudio.utils.FileUtil;
import org.mstudio.utils.PageUtil;
import org.mstudio.utils.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.*;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static org.mstudio.utils.SecurityContextHolder.getUserDetails;

/**
 * @author Macrow
 * @date 2019-02-22
 */

@Slf4j
@Service
public class CustomerOrderServiceImpl implements CustomerOrderService {

    public static final String CACHE_NAME = "CustomerOrder";

    private static final String CUSTOMER_ORDER_PAGE_SN_PREFIX = "PAGE";

    @Value("${rapidWMS.logo_name}")
    private String logoName;

    // todo ??????????????????
    private static final Integer CUSTOMER_ORDER_PAGE_SIZE = 1;

    @Value("${upload.path}")
    private String uploadPath;

    @Value("${excel.export-max-count}")
    private Integer maxCount;

    @Value("${rapidWMS.print_extra_info}")
    private Boolean printExtraInfo;

    @Autowired
    private CustomerOrderRepository customerOrderRepository;

    @Autowired
    private CustomerOrderMapper customerOrderMapper;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private StockService stockService;

    @Autowired
    private GoodsRepository goodsRepository;

    @Autowired
    private StockFlowRepository stockFlowRepository;

    @Autowired
    private CustomerOrderItemRepository customerOrderItemRepository;

    @Autowired
    private CustomerOrderStockRepository customerOrderStockRepository;

    @Autowired
    private OperateSnapshotRepository operateSnapshotRepository;

    @Autowired
    private OperateSnapshotService operateSnapshotService;

    @Autowired
    private CustomerOrderService customerOrderService;

    @Autowired
    private WareZoneService wareZoneService;

    @Autowired
    private StockFlowService stockFlowService;

    @Autowired
    private PackRepository packRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PickMatchService pickMatchService;

    @Autowired
    private CustomerOrderPageRepository customerOrderPageRepository;

    @Autowired
    private PickMatchRepository pickMatchRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Override
//    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    @Transactional(readOnly = true)
    public Map queryAll(Set<CustomerVO> customers, Boolean exportExcel, Boolean isPrintedFilter, String isSatisfiedFilter, String customerFilter, String orderStatusFilter, String receiveTypeFilter, Boolean isActiveFilter, String startDate, String endDate, String search, Pageable pageable) {
        return query(customers, exportExcel, isPrintedFilter, isSatisfiedFilter, customerFilter, orderStatusFilter, receiveTypeFilter, isActiveFilter, startDate, endDate, search, pageable);
    }

    @Override
//    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    @Transactional(readOnly = true)
    public Map listForPack(String customerFilter, String search, Pageable pageable) {
        return query(null, false, true, null, customerFilter, String.valueOf(OrderStatus.CONFIRM.getIndex()), null, true, null, null, search, pageable);
    }

    @Override
    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    @Transactional(readOnly = true)
    public Map listForComplete(Set<CustomerVO> customers, Boolean exportExcel, String customerFilter, String packTypeFilter, String receiveTypeFilter, String startDate, String endDate, String search, Pageable pageable) {
        Specification<CustomerOrder> spec = new Specification<CustomerOrder>() {
            @Override
            public Predicate toPredicate(Root<CustomerOrder> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> predicates = new ArrayList<>();

                if (customerFilter != null && !"".equals(customerFilter)) {
                    String[] customerIds = customerFilter.split(",");
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("owner").get("id"));
                    Arrays.stream(customerIds).forEach(id -> in.value(Long.valueOf(id)));
                    predicates.add(in);
                }

                if (packTypeFilter != null && !"".equals(packTypeFilter)) {
                    String[] packTypeIds = packTypeFilter.split(",");
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("pack").get("packType"));
                    Arrays.stream(packTypeIds).forEach(id -> in.value(Long.valueOf(id)));
                    predicates.add(in);
                }

                String orderStatusFilter = String.valueOf(OrderStatus.COMPLETE.getIndex());
                if (orderStatusFilter != null && !"".equals(orderStatusFilter)) {
                    String[] orderStatus = orderStatusFilter.split(",");
                    CriteriaBuilder.In<Integer> in = criteriaBuilder.in(root.get("orderStatus"));
                    Arrays.stream(orderStatus).forEach(id -> in.value(Integer.parseInt(id)));
                    predicates.add(in);
                }

                if (receiveTypeFilter != null && !"".equals(receiveTypeFilter)) {
                    String[] receiveTypes = receiveTypeFilter.split(",");
                    CriteriaBuilder.In<Integer> in = criteriaBuilder.in(root.get("receiveType"));
                    Arrays.stream(receiveTypes).forEach(id -> in.value(Integer.parseInt(id)));
                    predicates.add(in);
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

                if (customers != null && !customers.isEmpty()) {
                    List<Long> customerIdList = customers.stream().map(customer -> Long.valueOf(customer.getId())).collect(Collectors.toList());
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("owner").get("id"));
                    customerIdList.forEach(id -> in.value(id));
                    predicates.add(in);
                }

                if (search != null) {
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.like(root.get("printTitle").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientName").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientStore").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientAddress").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientOrderSn").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientOrderSn2").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientOperator").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("flowSn").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("autoIncreaseSn").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("description").as(String.class), "%" + search + "%")
                    ));
                }

                if (predicates.size() != 0) {
                    Predicate[] p = new Predicate[predicates.size()];
                    return criteriaBuilder.and(predicates.toArray(p));
                } else {
                    return null;
                }
            }
        };

        // ?????????????????????????????????????????????????????????
        Sort sort = pageable.getSort()
                .and(new Sort(Sort.Direction.DESC, "id"))
                .and(new Sort(Sort.Direction.DESC, "autoIncreaseSn"));
        Pageable newPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        if (exportExcel) {
            newPageable = PageRequest.of(0, maxCount, sort);
        }
        Page<CustomerOrder> page = customerOrderRepository.findAll(spec, newPageable);
        return PageUtil.toPage(page.map(customerOrderMapper::toVO));
    }

    @Override
    @Transactional(readOnly = true)
//    @Cacheable(value = CACHE_NAME, key = "#p0")
    public CustomerOrderDTO findById(Long id) {
        CustomerOrder order = getCustomerOrder(id);
        CustomerOrderDTO orderDTO = customerOrderMapper.toDto(order);
        if (order.getTargetWareZones() != null && !order.getTargetWareZones().isEmpty()) {
            List<WareZoneVO> wareZones = wareZoneService.getListByIds(order.getTargetWareZones().split(","));
            orderDTO.setTargetWareZoneList(wareZones);
        }
        return orderDTO;
    }

    @Override
    @Transactional(readOnly = true)
//    @Cacheable(value = CACHE_NAME, key = "#p0 + '_withQuantityLeft'")
    public CustomerOrderDTO findByIdAndQueryQuantityLeft(Long id) {
        CustomerOrderDTO orderDTO = findById(id);
        Long customerId = Long.valueOf(orderDTO.getOwner().getId());
        List<CustomerOrderItemVO> customerOrderItems = orderDTO.getCustomerOrderItems();
        List<CustomerOrderStockVO> customerOrderStocks = orderDTO.getCustomerOrderStocks();
        orderDTO.setCustomerOrderItems(customerOrderItems.stream().peek(
                item -> {
                    Optional<Goods> goodsOptional = goodsRepository.findByCustomerIdAndSnAndPackCount(customerId, item.getSn(), item.getPackCount());
                    if (goodsOptional.isPresent()) {
                        item.setQuantityLeft(Long.valueOf(stockService.countByGoodsId(goodsOptional.get().getId())));
                    } else {
                        // ????????????????????????????????????
                        item.setQuantityLeft(0L);
                    }
                }).collect(Collectors.toList()));
        orderDTO.setCustomerOrderStocks(customerOrderStocks.stream().peek(
                stock -> {
                    stock.setQuantityLeft(stockService.countByGoodsIdAndWarePositionIdAndExpireTime(Long.valueOf(stock.getGoods().getId()), Long.valueOf(stock.getWarePosition().getId()), stock.getExpireDate()));
                }).collect(Collectors.toList()));
        return orderDTO;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = CustomerServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = GoodsServiceImpl.CACHE_NAME_UNSALE, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    public CustomerOrderDTO create(CustomerOrder resource, Boolean useNewAutoIncreaseSn, Boolean fetchStocks) {

        if (resource.getOwner().getId() == null) {
            throw new BadRequestException("?????????????????????????????????????????????");
        }

        List<CustomerOrderItem> orderItems = getSafeOrderItems(resource);
        List<CustomerOrderStock> orderStocks = getSafeOrderStocks(resource);

        if (orderItems.isEmpty() && orderStocks.isEmpty()) {
            throw new BadRequestException("?????????????????????????????????????????????");
        }

        if (resource.getClientOrderSn() != null && !resource.getClientOrderSn().isEmpty() && resource.getClientOrderSn2() != null && !resource.getClientOrderSn2().isEmpty()) {
            // 2019.10.16 ???????????? ????????? ??????????????????????????????
            Optional<CustomerOrder> optionalExistOrder = customerOrderRepository.findTopByClientOrderSn2AndIsActiveAndOwnerId(resource.getClientOrderSn2(), true, resource.getOwner().getId());
            if (optionalExistOrder.isPresent()) {
                throw new BadRequestException("???????????????????????????????????????????????????????????????????????????");
            }
        }

        // ??????????????????????????????????????????????????????
        resource.setDescription(resource.getDescription());
        resource.setIsActive(true);
        resource.setIsPrinted(false);
        resource.setOrderStatus(OrderStatus.INIT);
        resource.setUserCreator(userRepository.findByUsername(getUserDetails().getUsername()));
        // ????????????????????????????????????
        String sn;
        CustomerDTO customer = customerService.findById(resource.getOwner().getId());
        resource.setFlowSn(customer.getShortNameEn() + WmsUtil.generateSnowFlakeId());
        if (StrUtil.isEmptyOrUndefined(resource.getAutoIncreaseSn())) {
            sn = WmsUtil.getNewSn(customer.getShortNameEn(), getLastAutoIncreaseSn(Long.valueOf(customer.getId())), useNewAutoIncreaseSn);
            resource.setAutoIncreaseSn(sn);
        }
        if (StrUtil.isEmptyOrUndefined(resource.getTargetWareZones())) {
            resource.setTargetWareZones(null);
        }
        //???????????????????????????????????????????????????
        if (resource.getPrintTitle() == null || resource.getPrintTitle().isEmpty()) {
            resource.setPrintTitle(customer.getName());
        }
        CustomerOrder order = customerOrderRepository.save(resource);

        BigDecimal totalPrice = BigDecimal.ZERO;

        for (CustomerOrderItem item : orderItems) {
            item.setCustomerOrder(order);
            totalPrice = totalPrice.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantityInitial())));
        }
        customerOrderItemRepository.saveAll(orderItems);

        for (CustomerOrderStock item : orderStocks) {
            item.setCustomerOrder(order);
            totalPrice = totalPrice.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantityInitial())));
        }
        customerOrderStockRepository.saveAll(orderStocks);

        // ????????????????????????????????????????????????????????????????????????
        // order.setTotalPrice(totalPrice);
        order.setCustomerOrderItems(orderItems);
        order.setCustomerOrderStocks(orderStocks);
        order = customerOrderRepository.save(order);

        operateSnapshotService.create(OrderStatus.INIT.getName(), order);

        order.setCustomerOrderItems(orderItems);
        order.setCustomerOrderStocks(orderStocks);
        if (fetchStocks != null && fetchStocks) {
            customerOrderService.fetchStocks(order);
        }
        order.setCustomerOrderItems(orderItems);
        order.setCustomerOrderStocks(orderStocks);
        return customerOrderMapper.toDto(order);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = CustomerServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = GoodsServiceImpl.CACHE_NAME_UNSALE, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    synchronized public void update(Long id, CustomerOrder resource, Boolean useNewAutoIncreaseSn, Boolean fetchStocks) {
        CustomerOrder order = getCustomerOrder(id);
        if (!order.getId().equals(resource.getId())) {
            throw new BadRequestException("?????????ID??????");
        }

        if (!Arrays.asList(OrderStatus.INIT, OrderStatus.FETCH_STOCK, OrderStatus.CONFIRM).contains(order.getOrderStatus())) {
            throw new BadRequestException("???????????????????????????????????????");
        }

        List<CustomerOrderItem> orderItems = order.getCustomerOrderItems();
        List<CustomerOrderStock> orderStocks = order.getCustomerOrderStocks();
        customerOrderItemRepository.deleteAll(orderItems);
        customerOrderStockRepository.deleteAll(orderStocks);

        order.setPrintTitle(resource.getPrintTitle());
        //???????????????????????????????????????????????????
        if (resource.getPrintTitle() == null || resource.getPrintTitle().isEmpty()) {
            resource.setPrintTitle(resource.getOwner().getName());
        }
        order.setDescription(resource.getDescription());
        order.setIsPrinted(false);
        order.setExpireDateMin(resource.getExpireDateMin());
        order.setExpireDateMax(resource.getExpireDateMax());
        order.setFetchAll(resource.getFetchAll());
        order.setClientName(resource.getClientName());
        order.setClientAddress(resource.getClientAddress());
        order.setClientStore(resource.getClientStore());
        order.setClientOrderSn(resource.getClientOrderSn());
        order.setClientOrderSn2(resource.getClientOrderSn2());
        order.setClientOperator(resource.getClientOperator());
        order.setQualityAssuranceExponent(resource.getQualityAssuranceExponent());
        if (StrUtil.isEmptyOrUndefined(resource.getAutoIncreaseSn())) {
            CustomerDTO customer = customerService.findById(resource.getOwner().getId());
            String sn = WmsUtil.getNewSn(customer.getShortNameEn(), getLastAutoIncreaseSn(Long.valueOf(customer.getId())), useNewAutoIncreaseSn);
            resource.setAutoIncreaseSn(sn);
        }
        order.setAutoIncreaseSn(resource.getAutoIncreaseSn());
        order.setTargetWareZones(resource.getTargetWareZones().isEmpty() ? null : resource.getTargetWareZones());
        orderItems = resource.getCustomerOrderItems().stream()
                .peek(item -> item.setCustomerOrder(order)).collect(Collectors.toList());
        orderStocks = resource.getCustomerOrderStocks().stream()
                .peek(item -> item.setCustomerOrder(order)).collect(Collectors.toList());
        orderItems = customerOrderItemRepository.saveAll(orderItems);
        orderStocks = customerOrderStockRepository.saveAll(orderStocks);
        order.setCustomerOrderItems(orderItems);
        order.setCustomerOrderStocks(orderStocks);
        customerOrderRepository.save(order);

        operateSnapshotService.create("????????????", order);

        // ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        if (Arrays.asList(OrderStatus.FETCH_STOCK, OrderStatus.CONFIRM).contains(order.getOrderStatus())) {
            returnStock(order);
        }

        if (fetchStocks != null && fetchStocks) {
            customerOrderService.fetchStocks(order);
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = CustomerServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    synchronized public void delete(Long id) {
        CustomerOrder order = getCustomerOrder(id);
        if (order.getOrderStatus() != OrderStatus.INIT && order.getOrderStatus() != OrderStatus.CANCEL) {
            throw new BadRequestException("????????????????????????????????????????????????");
        } else {
//            if (ObjectUtil.isNotNull(order.getPack())) {
//                pickMatchRepository.deleteAll(order.getPack().getPickMatch());
//            }
            customerOrderPageRepository.deleteAll(order.getCustomerOrderPages());
            customerOrderItemRepository.deleteAll(order.getCustomerOrderItems());
            customerOrderStockRepository.deleteAll(order.getCustomerOrderStocks());
            operateSnapshotRepository.deleteAll(order.getOperateSnapshots());
            customerOrderRepository.delete(order);
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    synchronized public void fetchStocks(CustomerOrder order) {
        // todo ????????????
        if (order.getOrderStatus() != OrderStatus.INIT) {
            throw new BadRequestException("?????????????????????????????????????????????!");
        }
        List<CustomerOrderItem> orderItems = order.getCustomerOrderItems();
        List<CustomerOrderStock> orderStocks = order.getCustomerOrderStocks();
        if (orderItems.isEmpty() && orderStocks.isEmpty()) {
            throw new BadRequestException("?????????????????????????????????????????????");
        }

        Boolean isOrderItemsSatisfied = true;
        Boolean isOrderStocksSatisfied = true;
        JwtUser user = (JwtUser) getUserDetails();
        for (CustomerOrderItem orderItem : orderItems) {
            Date expireDateMin = order.getExpireDateMin();
            // ????????????????????????????????????????????????????????????
            if (Objects.nonNull(order.getQualityAssuranceExponent())) {
                Date qualityExpireDateMin = DateUtil.offsetDay(DateUtil.date(),
                        Math.round(orderItem.getMonthsOfWarranty() / 12 * 365 * (1 - order.getQualityAssuranceExponent())));
                if (Objects.nonNull(expireDateMin)) {
                    expireDateMin = qualityExpireDateMin.after(expireDateMin) ? qualityExpireDateMin : expireDateMin;
                } else {
                    expireDateMin = qualityExpireDateMin;
                }
            }
            // ???????????????????????????????????????????????????????????????????????????????????????
            isOrderItemsSatisfied = stockService
                    .reduceForOrderItem(new ReduceForOrderItemDTO(
                            orderItem, expireDateMin, order.getExpireDateMax(),
                            order.getTargetWareZones(), order.getFetchAll(), user, order.getOwner().getId(),
                            order.getUsePackCount(), order.getDescription())
                    ) && isOrderItemsSatisfied;
        }
        for (CustomerOrderStock stockItem : orderStocks) {
            isOrderStocksSatisfied = stockService.reduceForOrderStock(new ReduceForOrderStockDTO(stockItem, order.getFetchAll(), user, order.getDescription())) && isOrderStocksSatisfied;
        }

        BigDecimal totalPrice = BigDecimal.ZERO;
        for (CustomerOrderItem item : orderItems) {
            if (item.getPrice() != null && item.getQuantity() != null) {
                BigDecimal itemTotalPrice = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity().intValue()));
                totalPrice = totalPrice.add(itemTotalPrice);
            }
        }
        for (CustomerOrderStock item : orderStocks) {
            if (item.getPrice() != null && item.getQuantity() != null) {
                BigDecimal itemTotalPrice = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity().intValue()));
                totalPrice = totalPrice.add(itemTotalPrice);
            }
        }

        if (totalPrice == null) {
            totalPrice = BigDecimal.ZERO;
        }
        order.setTotalPrice(totalPrice);
        Boolean isFinalSatisfied = isOrderItemsSatisfied && isOrderStocksSatisfied;
        order.setIsSatisfied(isFinalSatisfied);
        order.setOrderStatus(OrderStatus.FETCH_STOCK);


        // todo ???????????????
        order.setCustomerOrderPages(new ArrayList<>());
        int pageNum = (int) Math.ceil(Integer.valueOf(order.getCustomerOrderItems().size()).doubleValue() / CUSTOMER_ORDER_PAGE_SIZE);
        for (int i = 0; i < pageNum; i++) {
            CustomerOrderPage customerOrderPage = new CustomerOrderPage();
            order.getCustomerOrderPages().add(customerOrderPage);
        }
        order.setWaitGatheringNum(pageNum);
        order.setWaitReviewerNum(pageNum);
        customerOrderRepository.save(order);
        for (int i = 0; i < order.getCustomerOrderPages().size(); i++) {
            CustomerOrderPage page = order.getCustomerOrderPages().get(i);
            page.setCustomerOrder(order);
            page.setOrderStatus(OrderStatus.FETCH_STOCK);
            page.setFlowSn(CUSTOMER_ORDER_PAGE_SN_PREFIX + WmsUtil.generateSnowFlakeId());
            customerOrderPageRepository.save(page);
        }
        operateSnapshotService.create(OrderStatus.FETCH_STOCK.getName(), user.getUsername(), order);

        if (!isFinalSatisfied && order.getFetchAll()) {
            returnStock(order);
        }


    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void gatherGoods(CustomerOrder order, String pageFlowSn, Long userId) {
        // todo ???????????? ???????????????
        if (!(order.getOrderStatus() == OrderStatus.FETCH_STOCK || order.getOrderStatus() == OrderStatus.GATHERING_GOODS)) {
            throw new BadRequestException("??????????????????");
        }
        for (int i = 0; i < order.getCustomerOrderPages().size(); i++) {
            CustomerOrderPage p = order.getCustomerOrderPages().get(i);
            if (StringUtils.isNotEmpty(pageFlowSn) && !pageFlowSn.equals(p.getFlowSn())) {
                continue;
            }
            if (null != userId) {
                Optional<User> userOptional = p.getUserGatherings().stream().filter(user -> user.getId() == userId).findAny();
                if (!userOptional.isPresent()) {
                    User user = userRepository.getOne(userId);
                    p.getUserGatherings().add(user);
                }
            }
            if (p.getOrderStatus().getIndex() < OrderStatus.GATHERING_GOODS.getIndex()) {
                p.setOrderStatus(OrderStatus.GATHERING_GOODS);
            }
        }
        int num = (int) order.getCustomerOrderPages().stream().filter(p -> p.getUserGatherings().size() == 0).count();
        order.setWaitGatheringNum(num);
        order.setOrderStatus(order.getWaitGatheringNum() == 0 ? OrderStatus.GATHERING_GOODS : OrderStatus.FETCH_STOCK);

        customerOrderRepository.save(order);
        operateSnapshotService.create(OrderStatus.GATHERING_GOODS.getName(), order);

    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void gatherGoods(Long id, String pageFlowSn, Long userId) {
        gatherGoods(getCustomerOrder(id), pageFlowSn, userId);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void unGatherGoods(CustomerOrder order, Long userId, String pageFlowSn) {
        // todo ????????????
        if (!(order.getOrderStatus() == OrderStatus.GATHERING_GOODS || order.getOrderStatus() == OrderStatus.FETCH_STOCK)) {
            throw new BadRequestException("??????????????????");
        }

        for (int i = 0; i < order.getCustomerOrderPages().size(); i++) {
            CustomerOrderPage p = order.getCustomerOrderPages().get(i);
            if (StringUtils.isNotEmpty(pageFlowSn) && !pageFlowSn.equals(p.getFlowSn())) continue;
            if (null != userId) {
                p.getUserGatherings().removeIf(u -> u.getId() == userId);
            } else {
                p.setUserGatherings(new ArrayList<>());
            }
            if (p.getUserGatherings().size() == 0) {
                p.setOrderStatus(OrderStatus.FETCH_STOCK);
            }
        }
        int num = (int) order.getCustomerOrderPages().stream().filter(p -> p.getUserGatherings().size() == 0).count();
        order.setWaitGatheringNum(num);
        order.setOrderStatus(order.getWaitGatheringNum() == 0 ? OrderStatus.GATHERING_GOODS : OrderStatus.FETCH_STOCK);

        customerOrderRepository.save(order);
        operateSnapshotService.create("????????????", order);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void unGatherGoods(Long id, Long userId, String pageFlowSn) {
        unGatherGoods(getCustomerOrder(id), userId, pageFlowSn);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void completeGatherGoods(Long id, String pageFlowSn) {
        // todo ????????????
        CustomerOrder order = getCustomerOrder(id);
        if (order.getOrderStatus() != OrderStatus.GATHERING_GOODS) {
            throw new BadRequestException("??????????????????");
        }

        for (int i = 0; i < order.getCustomerOrderPages().size(); i++) {
            CustomerOrderPage p = order.getCustomerOrderPages().get(i);
            if (StringUtils.isNotEmpty(pageFlowSn) && !pageFlowSn.equals(p.getFlowSn())) continue;
            if (p.getOrderStatus().getIndex() < OrderStatus.GATHER_GOODS.getIndex()) {
                p.setOrderStatus(OrderStatus.GATHER_GOODS);
            }
        }
        int num = (int) order.getCustomerOrderPages().stream().filter(p -> p.getOrderStatus().getIndex() >= OrderStatus.GATHER_GOODS.getIndex()).count();
        order.setOrderStatus(order.getCustomerOrderPages().size() == num ? OrderStatus.GATHER_GOODS : order.getOrderStatus());

        customerOrderRepository.save(order);
        operateSnapshotService.create(OrderStatus.GATHER_GOODS.getName(), order);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void unCompleteGatherGoods(CustomerOrder order, String pageFlowSn) {
        // ????????????????????????????????????????????????????????????
        // todo ????????????/?????? - app
        if (!(order.getOrderStatus() == OrderStatus.GATHER_GOODS)) {
            throw new BadRequestException("??????????????????");
        }

        for (int i = 0; i < order.getCustomerOrderPages().size(); i++) {
            CustomerOrderPage p = order.getCustomerOrderPages().get(i);
            if (StringUtils.isNotEmpty(pageFlowSn) && !pageFlowSn.equals(p.getFlowSn())) continue;
            if (p.getOrderStatus().getIndex() < OrderStatus.CONFIRM.getIndex()) {
                p.setOrderStatus(OrderStatus.FETCH_STOCK);
                p.setUserReviewers(new ArrayList<>());
                p.setUserGatherings(new ArrayList<>());
            }
        }
        int num = (int) order.getCustomerOrderPages().stream().filter(p -> p.getUserGatherings().size() == 0).count();
        order.setWaitGatheringNum(num);
        order.setOrderStatus(order.getWaitGatheringNum() == 0 ? OrderStatus.GATHERING_GOODS : OrderStatus.FETCH_STOCK);

        customerOrderRepository.save(order);
        operateSnapshotService.create("????????????", order);

    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    public void unCompleteGatherGoods(Long id, String pageFlowSn) {
        unCompleteGatherGoods(getCustomerOrder(id), pageFlowSn);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void confirm(CustomerOrder order, Long userId, String pageFlowSn) {
        // todo ???????????? app
        for (int i = 0; i < order.getCustomerOrderPages().size(); i++) {
            CustomerOrderPage p = order.getCustomerOrderPages().get(i);
            if (StringUtils.isNotEmpty(pageFlowSn) && !pageFlowSn.equals(p.getFlowSn())) {
                continue;
            }
            if (ObjectUtil.isNull(p.getUserReviewers())) {
                p.setUserReviewers(new ArrayList<>());
            }
            if (null != userId && !p.getUserReviewers().stream().filter(user1 -> user1.getId().equals(userId)).findAny().isPresent()) {
                User user = userRepository.getOne(userId);
                p.getUserReviewers().add(user);
            }
            p.setOrderStatus(OrderStatus.CONFIRM);
        }
        int num = (int) order.getCustomerOrderPages().stream().filter(p -> p.getOrderStatus() == OrderStatus.CONFIRM).count();
        order.setWaitReviewerNum(order.getCustomerOrderPages().size() - num);
        order.setOrderStatus(order.getWaitReviewerNum() == 0 ? OrderStatus.CONFIRM : order.getOrderStatus());

        customerOrderRepository.save(order);
        operateSnapshotService.create(OrderStatus.CONFIRM.getName(), order);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void confirm(Long id, Long userId, String pageFlowSn) {
        confirm(getCustomerOrder(id), userId, pageFlowSn);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = PackServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    synchronized public void complete(CustomerOrderCompleteDTO customerOrderCompleteDTO) {
        Optional<CustomerOrder> orderOptional = customerOrderRepository.findById(customerOrderCompleteDTO.getId());
        if (!orderOptional.isPresent()) {
            throw new BadRequestException("??????????????????????????????ID");
        }
        CustomerOrder order = orderOptional.get();
        if (!order.getOrderStatus().equals(OrderStatus.CLIENT_SIGNED)) {
            throw new BadRequestException("??????????????????????????????????????????");
        }
        order.setCompletePrice(customerOrderCompleteDTO.getCompletePrice());
        order.setCompleteDescription(customerOrderCompleteDTO.getCompleteDescription());
        order.setOrderStatus(OrderStatus.COMPLETE);
        order.setReceiveType(customerOrderCompleteDTO.getReceiveType());
        order = customerOrderRepository.save(order);
        operateSnapshotService.create(OrderStatus.COMPLETE.getName(), order);
        updatePackReceiveType(order);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = PackServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    synchronized public void updateComplete(CustomerOrderCompleteDTO customerOrderCompleteDTO) {
        Optional<CustomerOrder> orderOptional = customerOrderRepository.findById(customerOrderCompleteDTO.getId());
        if (!orderOptional.isPresent()) {
            throw new BadRequestException("??????????????????????????????ID");
        }
        CustomerOrder order = orderOptional.get();
        if (!order.getOrderStatus().equals(OrderStatus.COMPLETE)) {
            throw new BadRequestException("??????????????????????????????????????????");
        }
        order.setCompletePrice(customerOrderCompleteDTO.getCompletePrice());
        order.setReceiveType(customerOrderCompleteDTO.getReceiveType());
        order.setCompleteDescription(customerOrderCompleteDTO.getCompleteDescription());
        order = customerOrderRepository.save(order);
        operateSnapshotService.create("??????????????????", order);
        updatePackReceiveType(order);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void unConfirm(CustomerOrder order) {
        if (order.getOrderStatus() == OrderStatus.CONFIRM) {
            order.setOrderStatus(OrderStatus.GATHER_GOODS);
            customerOrderRepository.save(order);
            operateSnapshotService.create("????????????", order);
        } else {
            throw new BadRequestException("??????????????????");
        }
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void unConfirm(Long id) {
        unConfirm(getCustomerOrder(id));
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void cancel(CustomerOrder order, String cancelDescription) {
        // ???????????????????????????????????????
        if (order.getOrderStatus().getIndex() < OrderStatus.PACKAGE.getIndex()) {
            returnStockAndSaveOperateSnapshot(order, OrderStatus.CANCEL, OrderStatus.CANCEL.getName(), cancelDescription);
            stockFlowRepository.deleteAllByCustomerOrderId(order.getId());
        } else {
            throw new BadRequestException("??????????????????");
        }
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    synchronized public void cancel(Long id, String description) {
        cancel(getCustomerOrder(id), description);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    synchronized public void returnStock(CustomerOrder order) {
        if (order.getOrderStatus() == OrderStatus.FETCH_STOCK || order.getOrderStatus() == OrderStatus.GATHER_GOODS || order.getOrderStatus() == OrderStatus.CONFIRM) {
            order.setIsPrinted(false);
            returnStockAndSaveOperateSnapshot(order, OrderStatus.INIT, "????????????", null);
            stockFlowRepository.deleteAllByCustomerOrderId(order.getId());
            List<CustomerOrderItem> orderItems = order.getCustomerOrderItems();
            List<CustomerOrderStock> orderStocks = order.getCustomerOrderStocks();
            customerOrderPageRepository.deleteByCustomerOrder(order);
            orderItems = orderItems.stream().peek(item -> {
                item.setQuantity(null);
            }).collect(Collectors.toList());
            orderStocks = orderStocks.stream().peek(item -> {
                item.setQuantity(null);
            }).collect(Collectors.toList());
            customerOrderItemRepository.saveAll(orderItems);
            customerOrderStockRepository.saveAll(orderStocks);
        } else {
            throw new BadRequestException("??????????????????");
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    synchronized public void returnStock(Long id) {
        returnStock(getCustomerOrder(id));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'CountByCustomer' + #p0")
    public Integer countByOwnerId(Long id) {
        return customerOrderRepository.countByOwnerId(id);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    public Integer countByCreateTimeBetween(Date startDate, Date endDate) {
        return customerOrderRepository.countByCreateTimeBetween(startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    public Integer countByOrderStatus(OrderStatus orderStatus) {
        return customerOrderRepository.countByOrderStatus(orderStatus);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    public Integer countByOrderStatusAndUpdateTimeBetween(OrderStatus orderStatus, Date startDate, Date endDate) {
        return customerOrderRepository.countByOrderStatusAndUpdateTimeBetween(orderStatus, startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    public BigDecimal countTotalPriceByCreateTimeBetween(Date startDate, Date endDate) {
        List<CustomerOrder> orders = customerOrderRepository.findByCreateTimeBetweenAndIsActive(startDate, endDate, true);
        BigDecimal totalPrice = BigDecimal.ZERO;
        for (int i = 0; i < orders.size(); i++) {
            totalPrice = totalPrice.add(orders.get(i).getTotalPrice());
        }
        return totalPrice;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'queryOrderSales:' + #type + ':' + #date")
    public List<OrderSales> queryOrderSales(String type, String date) {
        Date startDate, endDate, calculateDate;
        List<CustomerOrder> orders;
        Integer orderCount, nameCount;
        BigDecimal orderPrice;
        List<OrderSales> orderSales = new ArrayList<>();
        Date queryDate = DateUtil.parseDate(date);
        switch (type) {
            case "today":
                startDate = DateUtil.beginOfDay(queryDate);
                endDate = DateUtil.offsetSecond(DateUtil.endOfDay(queryDate), 1);
                orders = customerOrderRepository.findByCreateTimeBetweenAndIsActive(startDate, endDate, true);
                nameCount = 0;
                while ((calculateDate = DateUtil.offsetHour(startDate, 1)).before(endDate)) {
                    nameCount++;
                    orderCount = 0;
                    orderPrice = BigDecimal.ZERO;
                    for (int i = 0; i < orders.size(); i++) {
                        Date orderCreateTime = orders.get(i).getCreateTime();
                        if (orderCreateTime.after(startDate) && orderCreateTime.before(calculateDate)) {
                            orderCount += 1;
                            orderPrice = orderPrice.add(orders.get(i).getTotalPrice());
                        }
                    }
                    orderSales.add(new OrderSales(nameCount + "???", orderPrice));
                    startDate = calculateDate;
                }
                break;
            case "week":
                startDate = DateUtil.beginOfWeek(queryDate);
                endDate = DateUtil.offsetSecond(DateUtil.endOfWeek(queryDate), 1);
                orders = customerOrderRepository.findByCreateTimeBetweenAndIsActive(startDate, endDate, true);
                while ((calculateDate = DateUtil.offsetDay(startDate, 1)).before(endDate)) {
                    orderCount = 0;
                    orderPrice = BigDecimal.ZERO;
                    for (int i = 0; i < orders.size(); i++) {
                        Date orderCreateTime = orders.get(i).getCreateTime();
                        if (orderCreateTime.after(startDate) && orderCreateTime.before(calculateDate)) {
                            orderCount += 1;
                            orderPrice = orderPrice.add(orders.get(i).getTotalPrice());
                        }
                    }
                    orderSales.add(new OrderSales("??????" + (DateUtil.dayOfWeek(startDate) == 1 ? "???" : (DateUtil.dayOfWeek(startDate) - 1)), orderPrice));
                    startDate = calculateDate;
                }
                break;
            case "month":
                startDate = DateUtil.beginOfMonth(queryDate);
                endDate = DateUtil.offsetSecond(DateUtil.endOfMonth(queryDate), 1);
                orders = customerOrderRepository.findByCreateTimeBetweenAndIsActive(startDate, endDate, true);
                while ((calculateDate = DateUtil.offsetDay(startDate, 1)).before(endDate)) {
                    orderCount = 0;
                    orderPrice = BigDecimal.ZERO;
                    for (int i = 0; i < orders.size(); i++) {
                        Date orderCreateTime = orders.get(i).getCreateTime();
                        if (orderCreateTime.after(startDate) && orderCreateTime.before(calculateDate)) {
                            orderCount += 1;
                            orderPrice = orderPrice.add(orders.get(i).getTotalPrice());
                        }
                    }
                    orderSales.add(new OrderSales(DateUtil.dayOfMonth(startDate) + "???", orderPrice));
                    startDate = calculateDate;
                }
                break;
            case "year":
                startDate = DateUtil.beginOfYear(queryDate);
                endDate = DateUtil.offsetSecond(DateUtil.endOfYear(queryDate), 1);
                orders = customerOrderRepository.findByCreateTimeBetweenAndIsActive(startDate, endDate, true);
                while ((calculateDate = DateUtil.offsetMonth(startDate, 1)).before(endDate)) {
                    orderCount = 0;
                    orderPrice = BigDecimal.ZERO;
                    for (int i = 0; i < orders.size(); i++) {
                        Date orderCreateTime = orders.get(i).getCreateTime();
                        if (orderCreateTime.after(startDate) && orderCreateTime.before(calculateDate)) {
                            orderCount += 1;
                            orderPrice = orderPrice.add(orders.get(i).getTotalPrice());
                        }
                    }
                    orderSales.add(new OrderSales((DateUtil.month(startDate) + 1) + "???", orderPrice));
                    startDate = calculateDate;
                }
                break;
            default:
                return null;
        }
        return orderSales;
    }

    @Override
    @Transactional(readOnly = true)
    synchronized public String getLastAutoIncreaseSn(Long customerId) {
        Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findTopByOwnerIdOrderByIdDesc(customerId);
        if (optionalCustomerOrder.isPresent()) {
            return optionalCustomerOrder.get().getAutoIncreaseSn();
        } else {
            return WmsUtil.ORDER_SN_BASE;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportExcelData(List<CustomerOrderVO> orders) {
        List<CustomerOrderExcelObj> rows = CollUtil.newArrayList();
        for (int i = 0; i < orders.size(); i++) {
            CustomerOrderExcelObj excelObj = new CustomerOrderExcelObj();
            excelObj.setIndex(Long.valueOf(i + 1));
            if (orders.get(i).getIsSatisfied() == null) {
                excelObj.setIsSatisfied("?????????");
            } else if (orders.get(i).getIsSatisfied()) {
                excelObj.setIsSatisfied("?????????");
            } else {
                excelObj.setIsSatisfied("????????????");
            }
            excelObj.setStatus(orders.get(i).getOrderStatus().getName());
            excelObj.setPrintTitle(orders.get(i).getPrintTitle());
            excelObj.setCustomerName(orders.get(i).getOwner().getName());
            excelObj.setClientName(orders.get(i).getClientName());
            excelObj.setClientAddress(orders.get(i).getClientAddress());
            excelObj.setClientStore(orders.get(i).getClientStore());
            excelObj.setClientOrderSn(orders.get(i).getClientOrderSn());
            excelObj.setClientOrderSn2(orders.get(i).getClientOrderSn2());
            excelObj.setClientOperator(orders.get(i).getClientOperator());
            excelObj.setDescription(orders.get(i).getDescription());
            excelObj.setTotalPrice(orders.get(i).getTotalPrice());
            excelObj.setCreateTime(orders.get(i).getCreateTime());
            excelObj.setSignTime(orders.get(i).getSignTime());
            excelObj.setFlowSn(orders.get(i).getFlowSn());
            excelObj.setAutoIncreaseSn(orders.get(i).getAutoIncreaseSn());
            excelObj.setCancelDescription(orders.get(i).getCancelDescription());
            excelObj.setCompleteDescription(orders.get(i).getCompleteDescription());
            excelObj.setCompletePrice(orders.get(i).getCompletePrice());
            excelObj.setReceiveType(orders.get(i).getReceiveType() != null ? orders.get(i).getReceiveType().getName() : "??????");
            excelObj.setPackTypeName(orders.get(i).getPack() != null ? orders.get(i).getPack().getPackType().getName() : "?????????");
            excelObj.setUserCreatorName(orders.get(i).getUserCreator() != null ? orders.get(i).getUserCreator().getUsername() : "");
            excelObj.setUserGatheringName(orders.get(i).getUserGatherings() != null ? orders.get(i).getUserGatherings().stream().map(UserVO::getUsername).collect(Collectors.joining(",")) : "");
            excelObj.setUserSendingName(orders.get(i).getUserSending() != null ? orders.get(i).getUserSending().getUsername() : "");
            rows.add(excelObj);
        }

        ByteArrayOutputStream outByteStream = new ByteArrayOutputStream();
        ExcelWriter writer = ExcelUtil.getBigWriter();
        writer.addHeaderAlias("index", "#");
        writer.addHeaderAlias("isSatisfied", "???????????????");
        writer.addHeaderAlias("status", "????????????");
        writer.addHeaderAlias("printTitle", "????????????");
        writer.addHeaderAlias("customerName", "????????????");
        writer.addHeaderAlias("clientName", "???????????????");
        writer.addHeaderAlias("clientAddress", "??????????????????");
        writer.addHeaderAlias("clientStore", "??????????????????");
        writer.addHeaderAlias("clientOrderSn", "???????????????");
        writer.addHeaderAlias("clientOrderSn2", "???????????????");
        writer.addHeaderAlias("clientOperator", "?????????????????????");
        writer.addHeaderAlias("autoIncreaseSn", "???????????????");
        writer.addHeaderAlias("flowSn", "?????????");
        writer.addHeaderAlias("description", "??????");
        writer.addHeaderAlias("createTime", "????????????");
        writer.addHeaderAlias("signTime", "????????????");
        writer.addHeaderAlias("totalPrice", "????????????");
        writer.addHeaderAlias("completePrice", "??????????????????");
        writer.addHeaderAlias("packTypeName", "??????????????????");
        writer.addHeaderAlias("userCreatorName", "?????????");
        writer.addHeaderAlias("userGatheringName", "?????????");
        writer.addHeaderAlias("userSendingName", "?????????");
        writer.addHeaderAlias("completeDescription", "??????????????????");
        writer.addHeaderAlias("cancelDescription", "??????????????????");
        writer.addHeaderAlias("receiveType", "????????????");
        writer.write(rows, true);
        writer.flush(outByteStream);
        writer.close();
        return outByteStream.toByteArray();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    synchronized public MultiOperateResult importKingdee(CustomerOrderImporterDTO customerOrderImporterDTO) {
        MultiOperateResult result = new MultiOperateResult();
        String path = FileUtil.getUploadPath(uploadPath);
        Long[] wareZones = customerOrderImporterDTO.getWareZone();
        String targetWareZone = (wareZones != null && wareZones.length > 0) ? StringUtils.join(wareZones, ",") : null;
        Arrays.asList(customerOrderImporterDTO.getUploadFileList()).forEach(file -> {
            String fileName = path + file;
            MultiOperateResult innerResult = importByFile(
                    customerOrderImporterDTO.getCustomer(),
                    fileName,
                    OrderImportType.KINGDEE,
                    targetWareZone,
                    customerOrderImporterDTO.getUseNewAutoIncreaseSn(),
                    customerOrderImporterDTO.getFetchStocks(),
                    customerOrderImporterDTO.getOrderExpireDateMin(),
                    customerOrderImporterDTO.getOrderExpireDateMax(),
                    customerOrderImporterDTO.getFetchAll(),
                    customerOrderImporterDTO.getQualityAssuranceExponent());
            result.addResult(innerResult);
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    synchronized public MultiOperateResult importKingdee2(CustomerOrderImporterDTO customerOrderImporterDTO) {
        MultiOperateResult result = new MultiOperateResult();
        String path = FileUtil.getUploadPath(uploadPath);
        Long[] wareZones = customerOrderImporterDTO.getWareZone();
        String targetWareZone = (wareZones != null && wareZones.length != 0) ? StringUtils.join(wareZones, ",") : null;
        Arrays.asList(customerOrderImporterDTO.getUploadFileList()).forEach(file -> {
            String fileName = path + file;
            MultiOperateResult innerResult = importByFile(
                    customerOrderImporterDTO.getCustomer(),
                    fileName,
                    OrderImportType.KINGDEE2,
                    targetWareZone,
                    customerOrderImporterDTO.getUseNewAutoIncreaseSn(),
                    customerOrderImporterDTO.getFetchStocks(),
                    customerOrderImporterDTO.getOrderExpireDateMin(),
                    customerOrderImporterDTO.getOrderExpireDateMax(),
                    customerOrderImporterDTO.getFetchAll(),
                    customerOrderImporterDTO.getQualityAssuranceExponent());
            result.addResult(innerResult);
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    synchronized public MultiOperateResult importGeneral(CustomerOrderImporterDTO customerOrderImporterDTO) {
        MultiOperateResult result = new MultiOperateResult();
        String path = FileUtil.getUploadPath(uploadPath);
        Long[] wareZones = customerOrderImporterDTO.getWareZone();
        String targetWareZone = (wareZones != null && wareZones.length != 0) ? StringUtils.join(wareZones, ",") : null;
        Arrays.asList(customerOrderImporterDTO.getUploadFileList()).forEach(file -> {
            String fileName = path + file;
            MultiOperateResult innerResult = importByFile(
                    customerOrderImporterDTO.getCustomer(),
                    fileName,
                    OrderImportType.GENERAL,
                    targetWareZone,
                    customerOrderImporterDTO.getUseNewAutoIncreaseSn(),
                    customerOrderImporterDTO.getFetchStocks(),
                    customerOrderImporterDTO.getOrderExpireDateMin(),
                    customerOrderImporterDTO.getOrderExpireDateMax(),
                    customerOrderImporterDTO.getFetchAll(),
                    customerOrderImporterDTO.getQualityAssuranceExponent());
            result.addResult(innerResult);
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    synchronized public MultiOperateResult importHtml(CustomerOrderImporterDTO customerOrderImporterDTO) {
        MultiOperateResult result = new MultiOperateResult();
        String path = FileUtil.getUploadPath(uploadPath);
        String targetWareZone = null;
        if (customerOrderImporterDTO.getWareZone() != null && customerOrderImporterDTO.getWareZone().length > 0) {
            targetWareZone = StringUtils.join(customerOrderImporterDTO.getWareZone(), ",");
        }
        final String targetWareZoneVar = targetWareZone;
        Arrays.asList(customerOrderImporterDTO.getUploadFileList()).stream().forEach(file -> {
            String fileName = path + file;
            MultiOperateResult innerResult = importByFile(
                    customerOrderImporterDTO.getCustomer(),
                    fileName,
                    OrderImportType.HTML,
                    targetWareZoneVar,
                    customerOrderImporterDTO.getUseNewAutoIncreaseSn(),
                    customerOrderImporterDTO.getFetchStocks(),
                    customerOrderImporterDTO.getOrderExpireDateMin(),
                    customerOrderImporterDTO.getOrderExpireDateMax(),
                    customerOrderImporterDTO.getFetchAll(),
                    customerOrderImporterDTO.getQualityAssuranceExponent());
            result.addResult(innerResult);
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchFetchStocks(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
            if (!optionalCustomerOrder.isPresent()) {
                result.addFailed();
            } else {
                CustomerOrder order = optionalCustomerOrder.get();
                List<CustomerOrderItem> orderItems = customerOrderItemRepository.findAllByCustomerOrderId(id);
                List<CustomerOrderStock> orderStocks = customerOrderStockRepository.findAllByCustomerOrderId(id);
                order.setCustomerOrderItems(orderItems);
                order.setCustomerOrderStocks(orderStocks);
                try {
                    customerOrderService.fetchStocks(order);
                    result.addSucceed();
                } catch (BadRequestException e) {
                    result.addFailed();
                }
            }
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchCancel(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
            if (optionalCustomerOrder.isPresent()) {
                customerOrderService.cancel(optionalCustomerOrder.get(), customerOrderMultipleOperateDTO.getCancelDescription());
                result.addSucceed();
            } else {
                result.addFailed();
            }
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchDelete(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            try {
                customerOrderService.delete(id);
                result.addSucceed();
            } catch (BadRequestException e) {
                result.addFailed();
            }
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchGatherGoods(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
            if (optionalCustomerOrder.isPresent()) {
                try {
                    CustomerOrder customerOrder = optionalCustomerOrder.get();
                    // todo ????????????-server-web
                    customerOrder.getCustomerOrderPages().forEach(page -> {
                        page.setOrderStatus(OrderStatus.GATHERING_GOODS);
                        page.setUserGatherings(customerOrderMultipleOperateDTO.getUserGatherings());
                    });
                    customerOrderService.gatherGoods(customerOrder, null, null);
                    result.addSucceed();
                } catch (BadRequestException e) {
                    result.addFailed();
                }
            } else {
                result.addFailed();
            }
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchUnGatherGoods(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
            if (optionalCustomerOrder.isPresent()) {
                try {
                    customerOrderService.unGatherGoods(optionalCustomerOrder.get(), null, null);
                    result.addSucceed();
                } catch (BadRequestException e) {
                    result.addFailed();
                }
            } else {
                result.addFailed();
            }
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchCompleteGatherGoods(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        // todo ???????????? server -web
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            try {
                customerOrderService.completeGatherGoods(id, null);
                result.addSucceed();
            } catch (BadRequestException e) {
                result.addFailed();
            }
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchUnCompleteGatherGoods(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
            if (optionalCustomerOrder.isPresent()) {
                try {
                    customerOrderService.unCompleteGatherGoods(optionalCustomerOrder.get(), null);
                    result.addSucceed();
                } catch (BadRequestException e) {
                    result.addFailed();
                }
            } else {
                result.addFailed();
            }
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchConfirm(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
            if (optionalCustomerOrder.isPresent()) {
                try {
                    // todo ???????????? serverI
                    CustomerOrder customerOrder = optionalCustomerOrder.get();
                    customerOrderMultipleOperateDTO.getUserReviewers().forEach(u -> {
                        customerOrderService.confirm(customerOrder, u.getId(), null);
                    });
                    result.addSucceed();
                } catch (BadRequestException e) {
                    result.addFailed();
                }
            } else {
                result.addFailed();
            }
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchUnConfirm(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
            if (optionalCustomerOrder.isPresent()) {
                try {
                    customerOrderService.unConfirm(optionalCustomerOrder.get());
                    result.addSucceed();
                } catch (BadRequestException e) {
                    result.addFailed();
                }
            } else {
                result.addFailed();
            }
        });
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult batchReturnStock(CustomerOrderMultipleOperateDTO customerOrderMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        Arrays.stream(customerOrderMultipleOperateDTO.getIds()).forEach(id -> {
            Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
            if (optionalCustomerOrder.isPresent()) {
                CustomerOrder order = optionalCustomerOrder.get();
                // fix lazy load no session error
                List<CustomerOrderItem> orderItems = customerOrderItemRepository.findAllByCustomerOrderId(order.getId());
                List<CustomerOrderStock> orderStocks = customerOrderStockRepository.findAllByCustomerOrderId(order.getId());
                order.setCustomerOrderItems(orderItems);
                order.setCustomerOrderStocks(orderStocks);
                try {
                    customerOrderService.returnStock(order);
                    result.addSucceed();
                } catch (BadRequestException e) {
                    result.addFailed();
                }
            } else {
                result.addFailed();
            }
        });
        return result;
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    public byte[] batchPrint(String orderIds, Boolean isOriginal) throws IOException {
        // todo ???????????????
        String[] ids = orderIds.split(",");
        List<ByteArrayOutputStream> allData = new ArrayList<>();

        for (int i = 0; i < ids.length; i++) {
            Long id = Long.valueOf(ids[i]);

            Optional<CustomerOrder> orderOptional = customerOrderRepository.findById(Long.valueOf(ids[i]));
            if (!orderOptional.isPresent()) {
                throw new BadRequestException("???????????????ID?????????");
            }
            CustomerOrder order = orderOptional.get();
            if (order.getClientOrderSn() == null) {
                order.setClientOrderSn("?????????");
            }
            if (order.getClientOrderSn2() == null) {
                order.setClientOrderSn2("?????????");
            }
            if (order.getClientAddress() == null) {
                order.setClientAddress("?????????");
            }
            if (order.getClientOperator() == null) {
                order.setClientOperator("?????????");
            }
            PdfFont font = PdfFontFactory.createFont(FileUtil.getRootPath() + "/fonts/simsun.ttf", PdfEncodings.IDENTITY_H, true);

            List<StockFlowDTO> stockFlows = stockFlowService.queryAllByOrderId(id);
            // fix lazy load no session error
            List<CustomerOrderItem> orderItems = customerOrderItemRepository.findAllByCustomerOrderId(order.getId());
            List<CustomerOrderStock> orderStocks = customerOrderStockRepository.findAllByCustomerOrderId(order.getId());

            List<CustomerOrderItem> orderItemsNotSatisfied = orderItems.stream().filter(item -> item.getQuantity() < item.getQuantityInitial()).collect(Collectors.toList());
            List<CustomerOrderStock> orderStocksNotSatisfied = orderStocks.stream().filter(stock -> stock.getQuantity() < stock.getQuantityInitial()).collect(Collectors.toList());

            orderItemsNotSatisfied.forEach(item -> {
                StockFlowDTO stockFlow = new StockFlowDTO();
                stockFlow.setSn(item.getSn());
                stockFlow.setName(item.getName());
                stockFlow.setExpireDate(null);
                stockFlow.setPackCount(item.getPackCount());
                stockFlow.setUnit("");
                // ???????????????????????????????????????
                stockFlow.setQuantity(item.getQuantity() - item.getQuantityInitial());
                stockFlow.setPrice(item.getPrice());
                WareZoneVO wareZone = new WareZoneVO();
                wareZone.setName("");
                WarePositionDTO warePosition = new WarePositionDTO();
                warePosition.setName("");
                warePosition.setWareZone(wareZone);
                stockFlow.setWarePositionOut(warePosition);
                stockFlows.add(stockFlow);
            });

            orderStocksNotSatisfied.forEach(stock -> {
                StockFlowDTO stockFlow = new StockFlowDTO();
                stockFlow.setSn(stock.getGoods().getSn());
                stockFlow.setName(stockFlow.getGoods().getName());
                stockFlow.setExpireDate(stock.getExpireDate());
                stockFlow.setPackCount(stock.getGoods().getPackCount());
                stockFlow.setUnit(stock.getGoods().getUnit());
                // ???????????????????????????????????????
                stockFlow.setQuantity(stock.getQuantity() - stock.getQuantityInitial());
                stockFlow.setPrice(stock.getPrice());
                WareZoneVO wareZone = new WareZoneVO();
                wareZone.setName("");
                WarePositionDTO warePosition = new WarePositionDTO();
                warePosition.setName("");
                warePosition.setWareZone(wareZone);
                stockFlow.setWarePositionOut(warePosition);
                stockFlows.add(stockFlow);
            });

            final List<StockFlowDTO> stockFlowPrint = new ArrayList<>();

            if (isOriginal) {
                AtomicReference<String> sn = new AtomicReference<>();
                orderItems.forEach(item -> {
                    sn.set(null);
                    stockFlows.forEach(stockFlow -> {
                        if (stockFlow.getSn().trim().equals(item.getSn().trim())) {
                            stockFlowPrint.add(stockFlow);
                            sn.set(stockFlow.getSn());
                        }
                    });
                    stockFlows.removeIf(flow -> flow.getSn().trim().equals(sn.toString().trim()));
                });
                orderStocks.forEach(stock -> {
                    sn.set(null);
                    stockFlows.forEach(stockFlow -> {
                        if (stockFlow.getSn().trim().equals(stock.getGoods().getSn().trim())) {
                            stockFlowPrint.add(stockFlow);
                            sn.set(stockFlow.getSn());
                        }
                    });
                    stockFlows.removeIf(flow -> flow.getSn().trim().equals(sn.toString().trim()));
                });
                // ????????????????????????????????????????????????????????????????????????
                if (!stockFlows.isEmpty()) {
                    throw new BadRequestException("??????????????????????????????????????????");
                }
            } else {
                stockFlowPrint.addAll(stockFlows);
            }

            int start = 0;
            List<Integer> indexs = new ArrayList<>();
            indexs.add(0);
            while (start < stockFlowPrint.size()) {
                int maxIndex = getIndex(order, stockFlowPrint, start, start);
                start = maxIndex;
                indexs.add(start);
            }
            if (!order.getIsPrinted()) {
                customerOrderPageRepository.deleteByCustomerOrder(order);
                order.setCustomerOrderPages(new ArrayList<CustomerOrderPage>());
                for (int j = 0; j < indexs.size() - 1; j++) {
                    CustomerOrderPage customerOrderPage = new CustomerOrderPage();
                    customerOrderPage.setCustomerOrder(order);
                    customerOrderPage.setStockFlows(
                            stockFlowPrint.subList(indexs.get(j), indexs.get(j + 1)).stream()
                                    .filter(f -> f.getId() != null)
                                    .map(f -> {
                                        StockFlow sf = stockFlowRepository.getOne(Long.valueOf(f.getId()));
                                        sf.setCustomerOrderPage(customerOrderPage);
                                        return sf;
                                    }).collect(Collectors.toList()));
                    customerOrderPage.setOrderStatus(order.getOrderStatus());
                    customerOrderPage.setFlowSn(CUSTOMER_ORDER_PAGE_SN_PREFIX + WmsUtil.generateSnowFlakeId());
                    BigDecimal price = BigDecimal.valueOf(0);
                    for (int k = 0; k < customerOrderPage.getStockFlows().size(); k++) {
                        StockFlow stockFlow = customerOrderPage.getStockFlows().get(k);
                        price = price.add(stockFlow.getPrice().multiply(BigDecimal.valueOf(stockFlow.getQuantity())));
                    }
                    customerOrderPage.setTotalPrice(price);
                    order.getCustomerOrderPages().add(customerOrderPage);
                    customerOrderPageRepository.save(customerOrderPage);
                    stockFlowRepository.saveAll(customerOrderPage.getStockFlows());
                }
            }


            for (int j = 0; j < indexs.size() - 1; j++) {
                ByteArrayOutputStream byteArr = getOutByteStream(order, stockFlowPrint, indexs, j);
                allData.add(byteArr);
            }
        }

        Arrays.asList(ids).forEach(stringId -> {
            Long id = Long.valueOf(stringId);
            Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
            if (optionalCustomerOrder.isPresent()) {
                CustomerOrder order = optionalCustomerOrder.get();
                order.setIsPrinted(true);
                customerOrderRepository.save(order);
            }
        });

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        PdfDocument pdfAll = new PdfDocument(new PdfWriter(output));
        PdfMerger merger = new PdfMerger(pdfAll);

        for (int i = 0; i < allData.size(); i++) {
            PdfDocument pdf = new PdfDocument(new PdfReader(new ByteArrayInputStream(allData.get(i).toByteArray())));
            merger.merge(pdf, 1, pdf.getNumberOfPages());
            pdf.close();
        }
        pdfAll.close();

        return output.toByteArray();
    }


    private ByteArrayOutputStream getOutByteStream(CustomerOrder order, List<StockFlowDTO> stockFlowPrint, List<Integer> indexs, int i) throws IOException {
        String flowSn = order.getCustomerOrderPages().get(i).getFlowSn();
        ByteArrayOutputStream outByteStream = new ByteArrayOutputStream();
        PdfDocument pdfDocument = new PdfDocument(new PdfWriter(outByteStream));
        PdfFont font = PdfFontFactory.createFont(FileUtil.getRootPath() + "/fonts/simsun.ttf", PdfEncodings.IDENTITY_H, true);
        PageXofY event = new PageXofY(pdfDocument, font);
        pdfDocument.addEventHandler(PdfDocumentEvent.END_PAGE, event);
        Document document = new Document(pdfDocument, PageSize.A5.rotate());
        document.setMargins(0, 0, 0, 0);

        Table tableHeader = BatchPrintUtil.getTableHeaderOfBatchPrint(order, pdfDocument, font, indexs.size() - 1, i + 1, flowSn);
        Table table = BatchPrintUtil.newTable(tableHeader, font);

        Long PageAllCount = 0L;
        BigDecimal price = BigDecimal.valueOf(0);

        Table tableFooter = BatchPrintUtil.getTableFooterOfBatchPrint(order, stockFlowPrint, font);

        for (int j = indexs.get(i); j < indexs.get(i + 1); j++) {
            StockFlowDTO stockFlow = stockFlowPrint.get(j);
            if (stockFlow.getQuantity() > 0) {
                PageAllCount += stockFlow.getQuantity();
                price = price.add(stockFlow.getPrice().multiply(BigDecimal.valueOf(stockFlow.getQuantity())));
            }

            BatchPrintUtil.addCell(table, stockFlow, font, price, PageAllCount, j);
        }

        table.addCell(new Cell(1, 9).add(new Paragraph(
                "???????????????" + NumberUtil.decimalFormat("###,##0", PageAllCount) + " / ??????????????? " + NumberUtil.decimalFormat("###,##0.00", price.doubleValue())).setFont(font).setFontSize(11f)).setTextAlignment(TextAlignment.RIGHT).setKeepTogether(true));

        table.addCell(new Cell(1, printExtraInfo ? 2 : 1).add(new Paragraph("").setFont(font)).setTextAlignment(TextAlignment.CENTER).setKeepTogether(true));

        table.addFooterCell(new Cell(0, 11).add(tableFooter).setBorder(Border.NO_BORDER));

        document.add(table);
        event.writeTotal(pdfDocument);
        document.close();
        pdfDocument.close();
        return outByteStream;
    }

    /**
     * ????????????????????????
     *
     * @return
     * @throws IOException
     */
    private int getIndex(CustomerOrder order, List<StockFlowDTO> stockFlowPrint, int start, int min) throws IOException {

        ByteArrayOutputStream outByteStream = new ByteArrayOutputStream();
        PdfDocument pdfDocument = new PdfDocument(new PdfWriter(outByteStream));
        PdfFont font = PdfFontFactory.createFont(FileUtil.getRootPath() + "/fonts/simsun.ttf", PdfEncodings.IDENTITY_H, true);

        Table tableHeader = BatchPrintUtil.getTableHeaderOfBatchPrint(order, pdfDocument, font);
        Table table = BatchPrintUtil.newTable(tableHeader, font);

        Long PageAllCount = 0L;
        BigDecimal price = BigDecimal.valueOf(0);

        Table tableFooter = BatchPrintUtil.getTableFooterOfBatchPrint(order, stockFlowPrint, font);

        for (int j = start; j < stockFlowPrint.size(); j++) {
            StockFlowDTO stockFlow = stockFlowPrint.get(j);
            if (stockFlow.getQuantity() > 0) {
                PageAllCount += stockFlow.getQuantity();
            }
            price = price.add(stockFlow.getPrice().multiply(BigDecimal.valueOf(stockFlow.getQuantity())));
            BatchPrintUtil.addCell(table, stockFlow, font, price, PageAllCount, j);
            if (j == min) {
                table.addCell(new Cell(1, 9).add(new Paragraph(
                        "???????????????" + NumberUtil.decimalFormat("###,##0", PageAllCount) + " / ??????????????? " + NumberUtil.decimalFormat("###,##0.00", price.doubleValue())).setFont(font).setFontSize(11f)).setTextAlignment(TextAlignment.RIGHT).setKeepTogether(true));
                table.addCell(new Cell(1, printExtraInfo ? 2 : 1).add(new Paragraph("").setFont(font)).setTextAlignment(TextAlignment.CENTER).setKeepTogether(true));
                table.addFooterCell(new Cell(0, 11).add(tableFooter).setBorder(Border.NO_BORDER));
                float height = BatchPrintUtil.getHeight(table);
                System.out.println(height);
                if (height > 400) {
                    return j;
                } else {
                    return getIndex(order, stockFlowPrint, start, j + 1);
                }
            }
        }
        return stockFlowPrint.size();
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public byte[] batchPrintPageInfo(String orderIds) throws IOException {
        String[] ids = orderIds.split(",");
        ByteArrayOutputStream outByteStream = new ByteArrayOutputStream();
        PdfDocument pdfDocument = new PdfDocument(new PdfWriter(outByteStream));
        Document document = new Document(pdfDocument, PageSize.B8.rotate());
        PdfFont font = PdfFontFactory.createFont(FileUtil.getRootPath() + "/fonts/simsun.ttf", PdfEncodings.IDENTITY_H, true);
        document.setMargins(2f, 2f, 2f, 2f);
        for (int i = 0; i < ids.length; i++) {
            Optional<CustomerOrder> orderOptional = customerOrderRepository.findById(Long.valueOf(ids[i]));
            if (!orderOptional.isPresent()) {
                throw new BadRequestException("???????????????ID?????????");
            }
            CustomerOrder customerOrder = orderOptional.get();
            List<CustomerOrderPage> customerOrderPages = customerOrder.getCustomerOrderPages();
            int pages = customerOrderPages.size();
            if (i > 0) {
                document.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            }
            for (int j = 1; j <= pages; j++) {
                if (j > 1) {
                    document.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
                }
                Table table = new Table(2);
                table.setWidth(UnitValue.createPercentValue(100));
                table.setHeight(UnitValue.createPercentValue(100));
                table.setFontSize(15f);
                table.addCell(new Cell().add(new Paragraph(logoName).setFont(font)).setTextAlignment(TextAlignment.CENTER));
                String text = pages + "-" + j;
                table.addCell(new Cell().add(new Paragraph(text).setFont(font)).setTextAlignment(TextAlignment.CENTER).setBold());
                table.addCell(new Cell().add(new Paragraph(customerOrder.getOwner().getShortNameCn()).setFont(font)).setTextAlignment(TextAlignment.CENTER));
                table.addCell(new Cell().add(new Paragraph(customerOrder.getClientStore()).setFont(font)).setTextAlignment(TextAlignment.CENTER).setBold());
                Barcode128 barcode128 = new Barcode128(pdfDocument);
                barcode128.setCode(customerOrderPages.get(i).getFlowSn());
                table.addCell(new Cell(1, 2).add(new Image(barcode128.createFormXObject(null, null, pdfDocument)).setHorizontalAlignment(HorizontalAlignment.CENTER)));
                document.add(table);
            }
        }
        document.close();
        pdfDocument.close();
        return outByteStream.toByteArray();
    }

    @Override
    public Address getAddressByClientStore(String clientStore) {
        return addressRepository.findOneByClientStore(clientStore);
    }

    @Override
    public Goods getGoodsByCustomerAndNameAndSn(Long id, String name, String sn) {
        Specification<Goods> spec = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.and(
                criteriaBuilder.equal(root.get("customer").get("id").as(Long.class), id),
                criteriaBuilder.equal(root.get("name").as(String.class), name),
                criteriaBuilder.equal(root.get("sn").as(String.class), sn));
        return (Goods) goodsRepository.findOne(spec).get();
    }

    @Override
    public CustomerOrderDTO findByCustomerOrderPagesId(Long id) {
        return customerOrderMapper.toDto(customerOrderRepository.findByCustomerOrderPagesId(id));
    }

    @Override
    public Address getAddressByClientStoreAndAddressType(String clientStore, String AddressType) {
        Specification<Address> spec = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.and(
                criteriaBuilder.equal(root.get("addressType").get("name").as(String.class), AddressType),
                criteriaBuilder.equal(root.get("clientStore").as(String.class), clientStore));
        return (Address) addressRepository.findOne(spec).get();
    }

    private void returnStockAndSaveOperateSnapshot(CustomerOrder order, OrderStatus orderStatus, String operation, String cancelDescription) {
        List<StockFlow> stockFlows = stockFlowRepository.findAllByCustomerOrderIdOrderByWarePositionOut(order.getId());
        JwtUser user = (JwtUser) getUserDetails();
        stockFlows.forEach(stockFlow -> {
            Stock newStock = new Stock();
            newStock.setWarePosition(stockFlow.getWarePositionOut());
            newStock.setGoods(stockFlow.getGoods());
            newStock.setExpireDate(stockFlow.getExpireDate());
            newStock.setQuantity(stockFlow.getQuantity());
            // ??????StockFlowType???null?????????????????????
            stockService.add(new AddDTO(newStock, null, null, order, user.getUsername(), "", BigDecimal.valueOf(0)));
        });
        order.setOrderStatus(orderStatus);
        order.setIsSatisfied(null);
        if (orderStatus == OrderStatus.CANCEL) {
            order.setIsActive(false);
        }
        order.setTotalPrice(BigDecimal.ZERO);
        if (cancelDescription != null) {
            order.setCancelDescription(cancelDescription);
        }
        customerOrderRepository.save(order);
        operateSnapshotService.create(operation, user.getUsername(), order);
    }

    private List<CustomerOrderItem> getSafeOrderItems(CustomerOrder order) {
        List<CustomerOrderItem> orderItems = order.getCustomerOrderItems();
        if (orderItems == null) {
            orderItems = new ArrayList<>();
        }
        return orderItems;
    }

    private List<CustomerOrderStock> getSafeOrderStocks(CustomerOrder order) {
        List<CustomerOrderStock> orderStocks = order.getCustomerOrderStocks();
        if (orderStocks == null) {
            orderStocks = new ArrayList<>();
        }
        return orderStocks;
    }

    private Map query(Set<CustomerVO> customers, Boolean exportExcel, Boolean isPrintedFilter,
                      String isSatisfiedFilter, String customerFilter, String orderStatusFilter,
                      String receiveTypeFilter, Boolean isActiveFilter,
                      String startDate, String endDate, String search,
                      Pageable pageable) {
        Specification<CustomerOrder> spec = new Specification<CustomerOrder>() {
            @Override
            public Predicate toPredicate(Root<CustomerOrder> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> predicates = new ArrayList<>();

                if (isPrintedFilter != null) {
                    predicates.add(criteriaBuilder.equal(root.get("isPrinted").as(Boolean.class), isPrintedFilter));
                }

                if (isSatisfiedFilter != null) {
                    if (StrUtil.equalsIgnoreCase(isSatisfiedFilter, "true")) {
                        predicates.add(criteriaBuilder.isTrue(root.get("isSatisfied")));
                    } else if (StrUtil.equalsIgnoreCase(isSatisfiedFilter, "false")) {
                        predicates.add(criteriaBuilder.isFalse(root.get("isSatisfied")));
                    } else if (StrUtil.equalsIgnoreCase(isSatisfiedFilter, "undefined")) {
                        predicates.add(criteriaBuilder.isNull(root.get("isSatisfied")));
                    }
                }

                if (customerFilter != null && !"".equals(customerFilter)) {
                    String[] customerIds = customerFilter.split(",");
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("owner").get("id"));
                    Arrays.stream(customerIds).forEach(id -> in.value(Long.valueOf(id)));
                    predicates.add(in);
                }

                if (orderStatusFilter != null && !"".equals(orderStatusFilter)) {
                    String[] orderStatus = orderStatusFilter.split(",");
                    CriteriaBuilder.In<Integer> in = criteriaBuilder.in(root.get("orderStatus"));
                    Arrays.stream(orderStatus).forEach(id -> in.value(Integer.parseInt(id)));
                    predicates.add(in);
                }

                if (receiveTypeFilter != null && !"".equals(receiveTypeFilter)) {
                    String[] receiveTypes = receiveTypeFilter.split(",");
                    CriteriaBuilder.In<Integer> in = criteriaBuilder.in(root.get("receiveType"));
                    Arrays.stream(receiveTypes).forEach(id -> in.value(Integer.parseInt(id)));
                    predicates.add(in);
                }

                if (isActiveFilter != null) {
                    predicates.add(criteriaBuilder.equal(root.get("isActive").as(Boolean.class), isActiveFilter));
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

                if (customers != null && !customers.isEmpty()) {
                    List<Long> customerIdList = customers.stream().map(customer -> Long.valueOf(customer.getId())).collect(Collectors.toList());
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("owner").get("id"));
                    customerIdList.forEach(id -> in.value(id));
                    predicates.add(in);
                }

                if (search != null) {
                    Join<CustomerOrder, CustomerOrderPage> joinCustomerOrderPages = root.joinList("customerOrderPages", JoinType.LEFT);
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.like(root.get("printTitle").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientName").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientStore").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientAddress").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientOrderSn").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientOrderSn2").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("clientOperator").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("flowSn").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("autoIncreaseSn").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("description").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(joinCustomerOrderPages.get("flowSn"), "%" + search + "%")
                    ));
                }

                if (predicates.size() != 0) {
                    Predicate[] p = new Predicate[predicates.size()];
                    return criteriaBuilder.and(predicates.toArray(p));
                } else {
                    return null;
                }
            }
        };

        // ?????????????????????????????????????????????????????????
        Sort sort = pageable.getSort()
                .and(new Sort(Sort.Direction.DESC, "id"))
                .and(new Sort(Sort.Direction.DESC, "autoIncreaseSn"));
        Pageable newPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        if (exportExcel) {
            newPageable = PageRequest.of(0, maxCount, sort);
        }
        Page<CustomerOrder> page = customerOrderRepository.findAll(spec, newPageable);
        return PageUtil.toPage(page.map(customerOrderMapper::toVO));
    }

    private MultiOperateResult importByFile(
            Long customerId, String fileName, OrderImportType orderImportType, String targetWareZone, Boolean useNewAutoIncreaseSn,
            Boolean fetchStocks, Date expireDateMin, Date expireDateMax, Boolean fetchAll, Float qualityAssuranceExponent) {
        MultiOperateResult result = new MultiOperateResult();
        switch (orderImportType) {
            case KINGDEE:
                RowHandler KingdeeHandler;
                KingdeeHandler = new KingdeeHandler(result, this, customerService.findCustomerById(customerId), targetWareZone, useNewAutoIncreaseSn, expireDateMin, expireDateMax, fetchAll, fetchStocks, getLastAutoIncreaseSn(customerId));
                WmsUtil.handleExcelFile(fileName, KingdeeHandler);
                break;
            case KINGDEE2:
                RowHandler Kingdee2Handler;
                Kingdee2Handler = new Kingdee2Handler(result, this, customerService.findCustomerById(customerId), targetWareZone, useNewAutoIncreaseSn, expireDateMin, expireDateMax, fetchAll, fetchStocks, getLastAutoIncreaseSn(customerId));
                WmsUtil.handleExcelFile(fileName, Kingdee2Handler);
                break;
            case HTML:
                HtmlHandler htmlHandler = new HtmlHandler(result, this, customerService.findCustomerById(customerId), targetWareZone, useNewAutoIncreaseSn, expireDateMin, expireDateMax, fetchAll, fetchStocks, getLastAutoIncreaseSn(customerId));
                try {
                    htmlHandler.handleHtmlFile(fileName);
                } catch (IOException e) {
                    e.printStackTrace();
                    throw new BadRequestException("??????????????????????????????????????????????????????");
                }
                break;
            case GENERAL:
                RowHandler generalHandler;
                generalHandler = new GeneralHandler(result, this, customerService.findCustomerById(customerId), targetWareZone,
                        useNewAutoIncreaseSn, expireDateMin, expireDateMax, fetchAll, fetchStocks, getLastAutoIncreaseSn(customerId), qualityAssuranceExponent);
                WmsUtil.handleExcelFile(fileName, generalHandler);
                break;
            default:
                throw new BadRequestException("????????????");
        }
        FileUtil.del(fileName);
        return result;
    }

    private CustomerOrder getCustomerOrder(Long id) {
        Optional<CustomerOrder> optionalCustomerOrder = customerOrderRepository.findById(id);
        if (!optionalCustomerOrder.isPresent()) {
            throw new BadRequestException("?????????ID??????");
        }
        return optionalCustomerOrder.get();
    }

    private void updatePackReceiveType(CustomerOrder order) {
//        Pack pack = order.getPack();
        List<CustomerOrderPage> pages = order.getCustomerOrderPages();
        List<Pack> packs = pages.stream().map(CustomerOrderPage::getPack).collect(Collectors.toList());
//        List<CustomerOrderPage> packOrders = order.getCustomerOrderPages();
        packs.forEach(pack -> {
            List<CustomerOrderPage> packOrders = pack.getCustomerOrderPages();
            if (packOrders.stream().allMatch(packOrder -> packOrder.getOrderStatus().equals(OrderStatus.COMPLETE))) {
                List<ReceiveType> receiveTypes = packOrders.stream().map(CustomerOrderPage::getReceiveType).collect(Collectors.toList());
                if (receiveTypes.stream().anyMatch(Objects::isNull)) {
                    //throw new BadRequestException("???????????????????????????????????????????????????????????????????????????????????????????????????????????????!");
                    //??????????????????
                    packOrders.forEach(innerOrder -> {
                        if (innerOrder.getReceiveType() == null) {
                            innerOrder.setReceiveType(ReceiveType.ALL_SEND);
                            customerOrderPageRepository.save(innerOrder);
                        }
                    });
                }
                ReceiveType packReceiveType;
                if (receiveTypes.stream().allMatch(ReceiveType.ALL_SEND::equals)) {
                    packReceiveType = ReceiveType.ALL_SEND;
                } else {
                    if (receiveTypes.stream().allMatch(ReceiveType.ALL_REJECT::equals)) {
                        packReceiveType = ReceiveType.ALL_REJECT;
                    } else {
                        packReceiveType = ReceiveType.PARTIAL_REJECT;
                    }
                }
                pack.setReceiveType(packReceiveType);
                pack.setPackStatus(OrderStatus.COMPLETE);
                pack = packRepository.save(pack);
                operateSnapshotService.create(OrderStatus.COMPLETE.getName(), pack);
            }
        });


    }

    protected static class PageXofY implements IEventHandler {
        protected PdfFormXObject placeholder;
        protected float side = 20;
        protected float x = 570;
        protected float y = 25;
        protected float space = 4.5f;
        protected float descent = 3;
        protected PdfFont font;

        public PageXofY(PdfDocument pdf, PdfFont font) {
            placeholder = new PdfFormXObject(new Rectangle(0, 0, side, side));
            this.font = font;
        }

        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfDocument pdf = docEvent.getDocument();
            PdfPage page = docEvent.getPage();
            Rectangle pageSize = page.getPageSize();
            PdfCanvas pdfCanvas = new PdfCanvas(
                    page.getLastContentStream(), page.getResources(), pdf);
            Canvas canvas = new Canvas(pdfCanvas, pdf, pageSize);
            canvas.setFont(font);
            canvas.setFontSize(10);
            Paragraph p = new Paragraph();
            canvas.showTextAligned(p, x, y, TextAlignment.RIGHT);
            pdfCanvas.addXObject(placeholder, x + space, y - descent);
            pdfCanvas.release();
        }

        public void writeTotal(PdfDocument pdf) {
            Canvas canvas = new Canvas(placeholder, pdf);
            canvas.setFont(font);
            canvas.setFontSize(10);
            canvas.showTextAligned("",
                    0, descent, TextAlignment.LEFT);
        }
    }
}