package org.mstudio.modules.wms.stock.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import lombok.Synchronized;
import lombok.extern.slf4j.Slf4j;
import org.mstudio.exception.BadRequestException;
import org.mstudio.modules.security.security.JwtUser;
import org.mstudio.modules.wms.common.MultiOperateResult;
import org.mstudio.modules.wms.customer.service.object.CustomerVO;
import org.mstudio.modules.wms.customer_order.domain.CustomerOrder;
import org.mstudio.modules.wms.customer_order.domain.CustomerOrderItem;
import org.mstudio.modules.wms.customer_order.domain.CustomerOrderStock;
import org.mstudio.modules.wms.customer_order.repository.CustomerOrderItemRepository;
import org.mstudio.modules.wms.customer_order.repository.CustomerOrderStockRepository;
import org.mstudio.modules.wms.goods.domain.Goods;
import org.mstudio.modules.wms.goods.repository.GoodsRepository;
import org.mstudio.modules.wms.receive_goods.domain.ReceiveGoods;
import org.mstudio.modules.wms.receive_goods.domain.ReceiveGoodsItem;
import org.mstudio.modules.wms.receive_goods.repository.ReceiveGoodsItemRepository;
import org.mstudio.modules.wms.stock.domain.CountStock;
import org.mstudio.modules.wms.stock.domain.Stock;
import org.mstudio.modules.wms.stock.dto.*;
import org.mstudio.modules.wms.stock.repository.CountStockRepository;
import org.mstudio.modules.wms.stock.repository.StockRepository;
import org.mstudio.modules.wms.stock.service.StockService;
import org.mstudio.modules.wms.stock.service.mapper.StockMapper;
import org.mstudio.modules.wms.stock.service.object.*;
import org.mstudio.modules.wms.stock_flow.domain.StockFlowType;
import org.mstudio.modules.wms.stock_flow.service.StockFlowService;
import org.mstudio.modules.wms.stock_flow.service.impl.StockFlowServiceImpl;
import org.mstudio.modules.wms.ware_position.domain.WarePosition;
import org.mstudio.modules.wms.ware_position.repository.WarePositionRepository;
import org.mstudio.modules.wms.ware_position.service.impl.WarePositionServiceImpl;
import org.mstudio.utils.PageUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import static org.mstudio.utils.SecurityContextHolder.getUserDetails;

/**
 * @author Macrow
 * @date 2019-02-22
 */

@Slf4j
@Service
public class StockServiceImpl implements StockService {

    private static final String CACHE_NAME = "Stock";

    @Value("${excel.export-max-count}")
    private Integer maxCount;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private StockMapper stockMapper;

    @Autowired
    private StockFlowService stockFlowService;

    @Autowired
    private GoodsRepository goodsRepository;

    @Autowired
    private WarePositionRepository warePositionRepository;

    @Autowired
    private CustomerOrderItemRepository customerOrderItemRepository;

    @Autowired
    private CustomerOrderStockRepository customerOrderStockRepository;

    @Autowired
    private StockService stockService;

    @Autowired
    private ReceiveGoodsItemRepository receiveGoodsItemRepository;

    @Autowired
    private CountStockRepository countStockRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
//    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    public Map queryAll(Set<CustomerVO> customers, Boolean exportExcel, String wareZoneFilter, String customerFilter, String goodsTypeFilter, Boolean isActiveFilter, String search, Pageable pageable, Double quantityGuaranteeSearch, Boolean isSingle) {
        Specification<Stock> spec = new Specification<Stock>() {
            @Override
            public Predicate toPredicate(Root<Stock> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> predicates = new ArrayList<>();

                if (wareZoneFilter != null && !"".equals(wareZoneFilter)) {
                    String[] wareZoneIds = wareZoneFilter.split(",");
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("warePosition").get("wareZone").get("id"));
                    Arrays.stream(wareZoneIds).forEach(id -> in.value(Long.valueOf(id)));
                    predicates.add(in);
                }

                if (customerFilter != null && !"".equals(customerFilter)) {
                    String[] customerIds = customerFilter.split(",");
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("goods").get("customer").get("id"));
                    Arrays.stream(customerIds).forEach(id -> in.value(Long.valueOf(id)));
                    predicates.add(in);
                }

                if (goodsTypeFilter != null && !"".equals(goodsTypeFilter)) {
                    String[] goodsTypeIds = goodsTypeFilter.split(",");
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("goods").get("goodsType").get("id"));
                    Arrays.stream(goodsTypeIds).forEach(id -> in.value(Long.valueOf(id)));
                    predicates.add(in);
                }

                if (isActiveFilter != null) {
                    predicates.add(criteriaBuilder.equal(root.get("isActive").as(Boolean.class), isActiveFilter));
                }

                if (search != null) {
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.like(root.get("goods").get("name").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("goods").get("sn").as(String.class), "%" + search + "%"),
                            criteriaBuilder.like(root.get("warePosition").get("name").as(String.class), "%" + search + "%")
                    ));
                }
                if (quantityGuaranteeSearch != null) {
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.ge(root.get("quantityGuarantee").as(Double.class), quantityGuaranteeSearch)
                    ));
                }


                // ??????????????????????????????
                if (!customers.isEmpty()) {
                    List<Long> customerIdList = customers.stream().map(customer -> Long.valueOf(customer.getId())).collect(Collectors.toList());
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("goods").get("customer").get("id"));
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
        Pageable newPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
        if (exportExcel) {
            newPageable = PageRequest.of(0, maxCount, pageable.getSort());
        }

        if (isSingle) {
            newPageable = PageRequest.of(0, maxCount, pageable.getSort());
            Page<Stock> page = stockRepository.findAll(spec, newPageable);
            Page<StockDTO> pageDto = page.map(stockMapper::toDto);
            List<StockDTO> list = pageDto.getContent();
            Map<String, StockDTO> map = new LinkedHashMap<>();
            list.forEach(innerStockDTO -> {
                String sn = innerStockDTO.getGoods().getSn();
                String customerId = innerStockDTO.getGoods().getCustomer().getId();
                String key = sn + customerId;
                if (map.containsKey(key)) {
                    StockDTO stockDTO = map.get(key);
                    stockDTO.setQuantity(stockDTO.getQuantity() + innerStockDTO.getQuantity());
                } else {
                    map.put(key, innerStockDTO);
                }
            });

            list = new ArrayList<>(map.values());
            return PageUtil.toPageOfMap(pageable.getPageNumber(), pageable.getPageSize(), list);
        }
        Page<Stock> page = stockRepository.findAll(spec, newPageable);
        return PageUtil.toPage(page.map(stockMapper::toDto));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
//    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    public Map queryAll(Set<CustomerVO> customers, Boolean exportExcel, String wareZoneFilter, String customerFilter, String goodsTypeFilter, Boolean isActiveFilter, String search, Pageable pageable, Double quantityGuaranteeSearch) {
        return queryAll(customers, exportExcel, wareZoneFilter, customerFilter, goodsTypeFilter, isActiveFilter, search, pageable, quantityGuaranteeSearch, false);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
//    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    public Map queryAllOfCount(Set<CustomerVO> customers, Boolean exportExcel, String wareZoneFilter, String customerFilter, String goodsTypeFilter, Boolean isActiveFilter, String search, Pageable pageable, Double quantityGuaranteeSearch) {
        List<CountStock> countStockList = countStockRepository.findAll();
        if (countStockList.isEmpty()) {
            return PageUtil.toPageOfMap(pageable.getPageNumber(), pageable.getPageSize(), new ArrayList<>());
        }
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Map<String, CountStock> countMap = new LinkedHashMap<>();
        countStockList.forEach(innerCS -> {
            String key = innerCS.getSn() + innerCS.getPackCount() + innerCS.getCustomerName() + innerCS.getWarePositionName() + sdf.format(innerCS.getExpireDate());
            countMap.put(key, innerCS);
        });
        Specification<Stock> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (wareZoneFilter != null && !"".equals(wareZoneFilter)) {
                String[] wareZoneIds = wareZoneFilter.split(",");
                CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("warePosition").get("wareZone").get("id"));
                Arrays.stream(wareZoneIds).forEach(id -> in.value(Long.valueOf(id)));
                predicates.add(in);
            }

            if (customerFilter != null && !"".equals(customerFilter)) {
                String[] customerIds = customerFilter.split(",");
                CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("goods").get("customer").get("id"));
                Arrays.stream(customerIds).forEach(id -> in.value(Long.valueOf(id)));
                predicates.add(in);
            }

            if (goodsTypeFilter != null && !"".equals(goodsTypeFilter)) {
                String[] goodsTypeIds = goodsTypeFilter.split(",");
                CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("goods").get("goodsType").get("id"));
                Arrays.stream(goodsTypeIds).forEach(id -> in.value(Long.valueOf(id)));
                predicates.add(in);
            }

            if (isActiveFilter != null) {
                predicates.add(criteriaBuilder.equal(root.get("isActive").as(Boolean.class), isActiveFilter));
            }

            if (search != null) {
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(root.get("goods").get("name").as(String.class), "%" + search + "%"),
                        criteriaBuilder.like(root.get("goods").get("sn").as(String.class), "%" + search + "%"),
                        criteriaBuilder.like(root.get("warePosition").get("name").as(String.class), "%" + search + "%")
                ));
            }
            if (quantityGuaranteeSearch != null) {
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.ge(root.get("quantityGuarantee").as(Double.class), quantityGuaranteeSearch)
                ));
            }


            // ??????????????????????????????
            if (!customers.isEmpty()) {
                List<Long> customerIdList = customers.stream().map(customer -> Long.valueOf(customer.getId())).collect(Collectors.toList());
                CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("goods").get("customer").get("id"));
                customerIdList.forEach(id -> in.value(id));
                predicates.add(in);
            }

            if (predicates.size() != 0) {
                Predicate[] p = new Predicate[predicates.size()];
                return criteriaBuilder.and(predicates.toArray(p));
            } else {
                return null;
            }
        };
        Pageable newPageable = PageRequest.of(0, maxCount, pageable.getSort());

        Page<Stock> page = stockRepository.findAll(spec, newPageable);
        Page<StockDTO> pageDto = page.map(stockMapper::toDto);
        List<StockDTO> list = new ArrayList<>(pageDto.getContent());
        List<StockCountDTO> stockCountDTOList = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            StockDTO innerStockDTO = list.get(i);
            String sn = innerStockDTO.getGoods().getSn();
            Integer packCount = innerStockDTO.getGoods().getPackCount();
            String customerName = innerStockDTO.getGoods().getCustomer().getName();
            String warePositionName = innerStockDTO.getWarePosition().getName();
            String expireDate = sdf.format(innerStockDTO.getExpireDate());
            String key = sn + packCount + customerName + warePositionName + expireDate;
            if (countMap.containsKey(key)) {
                CountStock countStock = countMap.get(key);
                StockCountDTO tmp = new StockCountDTO();
                BeanUtil.copyProperties(innerStockDTO, tmp);
                tmp.setCurrentQuantity(countStock.getCurrentQuantity());
                stockCountDTOList.add(tmp);
            } else {
                list.remove(innerStockDTO);
                i--;
            }
        }
        return PageUtil.toPageOfMap(pageable.getPageNumber(), pageable.getPageSize(), stockCountDTOList);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
    @Cacheable(value = CACHE_NAME, key = "#p0")
    public StockDTO findById(Long id) {
        Optional<Stock> optionalStock = stockRepository.findById(id);
        if (optionalStock.isPresent()) {
            return stockMapper.toDto(optionalStock.get());
        } else {
            throw new BadRequestException("id????????????");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockDTO> QueryByCustomerIdAndGoodsSnAndPackCount(Long customerId, String goodsSn, Integer packCount) {
        Optional<Goods> optionalGoods = goodsRepository.findByCustomerIdAndSnAndPackCount(customerId, goodsSn, packCount);
        if (!optionalGoods.isPresent()) {
            throw new BadRequestException("??????????????????????????????");
        }
        List<Stock> stocks = stockRepository.findByGoodsId(optionalGoods.get().getId());
        return stockMapper.toDto(stocks);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
    @Cacheable(value = CACHE_NAME, key = "'countByGoodsId' + #p0")
    public Long countByGoodsId(Long goodsId) {
        List<Stock> stocks = stockRepository.findByGoodsId(goodsId);
        return stocks.stream().mapToLong(Stock::getQuantity).sum();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
    @Cacheable(value = CACHE_NAME, key = "'countByWarePositionId' + #p0")
    public Long countByWarePositionId(Long warePositionId) {
        List<Stock> stocks = stockRepository.findByWarePositionId(warePositionId);
        return stocks.stream().mapToLong(Stock::getQuantity).sum();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
    @Cacheable(value = CACHE_NAME, key = "'countByGoodsIdAndWarePositionIdAndExpireTime' + #p0")
    public Long countByGoodsIdAndWarePositionIdAndExpireTime(Long goodsId, Long warePositionId, Date expireDate) {
        Optional<Stock> optionalStock = stockRepository.findByWarePositionIdAndGoodsIdAndExpireDateAndIsActive(warePositionId, goodsId, expireDate, true);
        if (optionalStock.isPresent()) {
            return optionalStock.get().getQuantity();
        } else {
            return 0L;
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
    public byte[] exportExcelData(List<StockDTO> stocks) {
        List<StockExcelObj> rows = CollUtil.newArrayList();
        for (int i = 0; i < stocks.size(); i++) {
            StockExcelObj excelObj = new StockExcelObj();
            excelObj.setIndex(Long.valueOf(i + 1));
            excelObj.setGoodsName(stocks.get(i).getGoods().getName());
            excelObj.setWareZoneName(stocks.get(i).getWarePosition().getWareZone().getName());
            excelObj.setWarePositionName(stocks.get(i).getWarePosition().getName());
            excelObj.setGoodsSn(stocks.get(i).getGoods().getSn());
            excelObj.setGoodsPrice(stocks.get(i).getGoods().getPrice());
            Integer months = stocks.get(i).getGoods().getMonthsOfWarranty();
            int year = months / 12;
            int month = months % 12;
            String monthsOfWarranty = month + "???";
            if (year >= 1) {
                if (month == 0) {
                    monthsOfWarranty = year + "???";
                } else {
                    monthsOfWarranty = year + "???" + monthsOfWarranty;
                }
            }
            excelObj.setMonthsOfWarranty(monthsOfWarranty);
            excelObj.setGoodsPackCount(stocks.get(i).getGoods().getPackCount());
            excelObj.setGoodsUnit(stocks.get(i).getGoods().getUnit());
            excelObj.setExpireDate(DateUtil.format(stocks.get(i).getExpireDate(), "yyyy-MM-dd"));
            excelObj.setQuantity(stocks.get(i).getQuantity());
            excelObj.setGoodsTypeName(stocks.get(i).getGoods().getGoodsType().getName());
            excelObj.setCustomerName(stocks.get(i).getGoods().getCustomer().getName());
            excelObj.setIsActive(stocks.get(i).getIsActive() ? "??????" : "??????");

            rows.add(excelObj);
        }

        ByteArrayOutputStream outByteStream = new ByteArrayOutputStream();
        ExcelWriter writer = ExcelUtil.getBigWriter();
        writer.addHeaderAlias("index", "#");
        writer.addHeaderAlias("goodsName", "????????????");
        writer.addHeaderAlias("warePositionName", "??????");
        writer.addHeaderAlias("wareZoneName", "??????");
        writer.addHeaderAlias("goodsSn", "????????????");
        writer.addHeaderAlias("goodsPrice", "????????????");
        writer.addHeaderAlias("monthsOfWarranty", "????????????");
        writer.addHeaderAlias("goodsPackCount", "????????????");
        writer.addHeaderAlias("goodsUnit", "????????????");
        writer.addHeaderAlias("expireDate", "????????????");
        writer.addHeaderAlias("quantity", "??????");
        writer.addHeaderAlias("goodsTypeName", "????????????");
        writer.addHeaderAlias("customerName", "????????????");
        writer.addHeaderAlias("isActive", "??????");

        writer.write(rows, true);
        writer.flush(outByteStream);
        writer.close();
        return outByteStream.toByteArray();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
    public byte[] exportSingleExcelData(List<StockDTO> stocks) {
        List<StockExcelObj> rows = CollUtil.newArrayList();
        for (int i = 0; i < stocks.size(); i++) {
            StockExcelObj excelObj = new StockExcelObj();
            excelObj.setIndex(Long.valueOf(i + 1));
            excelObj.setGoodsName(stocks.get(i).getGoods().getName());
            excelObj.setGoodsSn(stocks.get(i).getGoods().getSn());
            excelObj.setGoodsPrice(stocks.get(i).getGoods().getPrice());
            Integer months = stocks.get(i).getGoods().getMonthsOfWarranty();
            int year = months / 12;
            int month = months % 12;
            String monthsOfWarranty = month + "???";
            if (year >= 1) {
                if (month == 0) {
                    monthsOfWarranty = year + "???";
                } else {
                    monthsOfWarranty = year + "???" + monthsOfWarranty;
                }
            }
            excelObj.setMonthsOfWarranty(monthsOfWarranty);
            excelObj.setGoodsPackCount(stocks.get(i).getGoods().getPackCount());
            excelObj.setGoodsUnit(stocks.get(i).getGoods().getUnit());
            excelObj.setQuantity(stocks.get(i).getQuantity());
            excelObj.setGoodsTypeName(stocks.get(i).getGoods().getGoodsType().getName());
            excelObj.setCustomerName(stocks.get(i).getGoods().getCustomer().getName());

            rows.add(excelObj);
        }

        ByteArrayOutputStream outByteStream = new ByteArrayOutputStream();
        ExcelWriter writer = ExcelUtil.getBigWriter();
        writer.addHeaderAlias("index", "#");
        writer.addHeaderAlias("goodsName", "????????????");
        writer.addHeaderAlias("goodsSn", "????????????");
        writer.addHeaderAlias("goodsPrice", "????????????");
        writer.addHeaderAlias("monthsOfWarranty", "????????????");
        writer.addHeaderAlias("goodsPackCount", "????????????");
        writer.addHeaderAlias("goodsUnit", "????????????");
        writer.addHeaderAlias("quantity", "??????");
        writer.addHeaderAlias("goodsTypeName", "????????????");
        writer.addHeaderAlias("customerName", "????????????");

        writer.write(rows, true);
        writer.flush(outByteStream);
        writer.close();
        return outByteStream.toByteArray();
    }

    // ========================= ?????????????????????????????????????????????????????????????????????????????????????????? =========================

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    public void activate(StockActivateDTO stockActivateDTO) {
        synchronizedOperate(StockOperate.ACTIVE, stockActivateDTO);
    }

    private void activateStub(StockActivateDTO stockActivateDTO) {
        Arrays.stream(stockActivateDTO.getSelectedRowKeys()).forEach(id -> {
            Optional<Stock> optionalStock = stockRepository.findById(id);
            if (!optionalStock.isPresent()) {
                throw new BadRequestException("Id??????????????????????????????");
            }
            Stock stock = optionalStock.get();
            stock.setIsActive(stockActivateDTO.getIsActive());
            stockRepository.save(stock);
        });
    }

    /**
     * ????????????????????????????????????????????????
     *
     * @param stockSingleOperateDTO
     */
    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = WarePositionServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    public void singleOperate(StockSingleOperateDTO stockSingleOperateDTO) {
        Long targetWarePositionId = stockSingleOperateDTO.getWarePosition()[1];
        Optional<Stock> optionalStock = stockRepository.findById(stockSingleOperateDTO.getId());
        Optional<WarePosition> optionalTargetWarePosition = warePositionRepository.findById(targetWarePositionId);
        if (!optionalStock.isPresent() || !optionalTargetWarePosition.isPresent()) {
            throw new BadRequestException("?????????/????????????????????????????????????");
        }

        Long quantity = stockSingleOperateDTO.getQuantity();
        Stock stock = optionalStock.get();
        WarePosition targetWarePosition = optionalTargetWarePosition.get();
        JwtUser user = (JwtUser) getUserDetails();

        // ???????????????????????????????????????????????????stock??????????????????????????????????????????stock???set???????????????get???????????????????????????????????????set?????????
        Stock newStock = new Stock();
        newStock.setId(stock.getId());
        newStock.setWarePosition(stock.getWarePosition());
        newStock.setGoods(stock.getGoods());
        newStock.setExpireDate(stock.getExpireDate());
        newStock.setQuantity(quantity);

        String description = stockSingleOperateDTO.getDescription();
        switch (stockSingleOperateDTO.getOperate()) {
            // ??????
            case "move":
                newStock.setWarePosition(targetWarePosition);
                newStock.setId(null);
                move(new MoveDTO(stock, newStock, user, description, BigDecimal.ZERO));
                break;
            // ??????
            case "increase":
                add(new AddDTO(newStock, StockFlowType.IN_PROFIT, null, null, user.getUsername(), description, BigDecimal.ZERO));
                break;
            // ??????
            case "decrease":
                reduce(new ReduceDTO(newStock, StockFlowType.OUT_LOSSES, true, BigDecimal.valueOf(0L), null, user, null, null, description));
                break;
            // ??????????????????
            case "expireDate":
                updateExpireDate(new UpdateExpireDateDTO(stock.getId(), stockSingleOperateDTO.getQuantity(), stockSingleOperateDTO.getExpireDate()));
                break;
            default:
                throw new BadRequestException("????????????");
        }
    }

    /**
     * ??????????????????: ???????????????????????????
     *
     * @param stockMultipleOperateDTO
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultiOperateResult multipleOperate(StockMultipleOperateDTO stockMultipleOperateDTO) {
        MultiOperateResult result = new MultiOperateResult();
        if (stockMultipleOperateDTO.getIds().length != stockMultipleOperateDTO.getOriginWarePosition().length &&
                stockMultipleOperateDTO.getIds().length != stockMultipleOperateDTO.getQuantity().length) {
            throw new BadRequestException("????????????");
        }
        String operate = stockMultipleOperateDTO.getOperate();
        if (!"move".equals(operate) && !"decrease".equals(operate)) {
            throw new BadRequestException("????????????");
        }
        Long[] warePosition = "decrease".equals(operate) ? stockMultipleOperateDTO.getOriginWarePosition() : stockMultipleOperateDTO.getWarePosition();

        for (int i = 0; i < stockMultipleOperateDTO.getIds().length; i++) {
            StockSingleOperateDTO stockSingleOperateDTO = new StockSingleOperateDTO();
            stockSingleOperateDTO.setOperate(operate);
            stockSingleOperateDTO.setDescription(stockMultipleOperateDTO.getDescription());
            stockSingleOperateDTO.setId(stockMultipleOperateDTO.getIds()[i]);
            stockSingleOperateDTO.setQuantity(stockMultipleOperateDTO.getQuantity()[i]);
            stockSingleOperateDTO.setOriginWarePosition(stockMultipleOperateDTO.getOriginWarePosition()[i]);
            stockSingleOperateDTO.setWarePosition(warePosition);
            try {
                stockService.singleOperate(stockSingleOperateDTO);
                result.addSucceed();
            } catch (BadRequestException e) {
                result.addFailed();
            }
        }
        return result;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = WarePositionServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    @Synchronized
    public void receiveGoods(ReceiveGoods receiveGoods) {
        synchronizedOperate(StockOperate.RECEIVE_GOODS, receiveGoods);
    }

    private void receiveGoodsStub(ReceiveGoods receiveGoods) {
        StockFlowType stockFlowType;
        switch (receiveGoods.getReceiveGoodsType()) {
            case NEW:
                stockFlowType = StockFlowType.IN_ADD;
                break;
            case REJECTED:
                stockFlowType = StockFlowType.IN_CUSTOMER_REJECTED;
                break;
            case POLICY:
                stockFlowType = StockFlowType.IN_POLICY;
                break;
            case OTHER:
                stockFlowType = StockFlowType.IN_OTHER;
                break;
            default:
                throw new BadRequestException("???????????????????????????");
        }
        receiveGoods.getReceiveGoodsItems().forEach(item -> {
            Long goodsId = item.getGoods().getId();
            Optional<Goods> optionalGoods = goodsRepository.findById(goodsId);
            if (!optionalGoods.isPresent()) {
                throw new BadRequestException("???????????????????????????????????????");
            }
            Goods goods = optionalGoods.get();

            Stock stock = new Stock();
            stock.setWarePosition(item.getWarePosition());
            if (item.getQuantityCancelFetch() != null) {
                stock.setQuantity(item.getQuantityCancelFetch());
            } else {
                stock.setQuantity(item.getQuantity() + item.getPackages() * goods.getPackCount());
            }
            stock.setExpireDate(item.getExpireDate());

            stock.setGoods(goods);
            stock.setIsActive(true);
            if (item.getQuantityCancelFetch() == null) {
                add(new AddDTO(stock, stockFlowType, receiveGoods, null, receiveGoods.getCreator(), receiveGoods.getDescription(), item.getPrice()));
            } else {
                add(stock);
            }

        });
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = WarePositionServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    public Boolean cancelReceiveGoods(ReceiveGoods receiveGoods) {
        return (Boolean) synchronizedOperate(StockOperate.CANCEL_RECEIVE_GOODS, receiveGoods);
    }

    private Boolean cancelReceiveGoodsStub(ReceiveGoods receiveGoods) {
        Boolean isSatisfied = true;
        for (ReceiveGoodsItem item : receiveGoods.getReceiveGoodsItems()) {
            isSatisfied = stockService.reduceForReceiveGoods(item) && isSatisfied;
        }
        if (!isSatisfied) {
            receiveGoods(receiveGoods);
        }
        for (ReceiveGoodsItem item : receiveGoods.getReceiveGoodsItems()) {
            item.setQuantityCancelFetch(null);
            if (isSatisfied) {
                item.setQuantity(null);
            }
            receiveGoodsItemRepository.save(item);
        }
        return isSatisfied;
    }

    /**
     * ???????????????????????????
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateExpireDate(UpdateExpireDateDTO updateExpireDateDTO) {
        synchronizedOperate(StockOperate.UPDATE_EXPIRE_DATE, updateExpireDateDTO);
    }

    private void updateExpireDateStub(Long stockId, Long changeQuantity, Date newExpireDate) {
        Optional<Stock> optionalStock = stockRepository.findById(stockId);
        if (!optionalStock.isPresent()) {
            throw new BadRequestException("???????????????????????????????????????");
        }
        Stock existStock = optionalStock.get();
        Boolean existStockIsActive = existStock.getIsActive();
        WarePosition existStockWarePosition = existStock.getWarePosition();
        Goods existStockGoods = existStock.getGoods();
        Long noChangeQuantity = existStock.getQuantity() - changeQuantity;
        if (noChangeQuantity < 0) {
            throw new BadRequestException("?????????????????????????????????????????????");
        } else {
            if (noChangeQuantity > 0) {
                existStock.setQuantity(noChangeQuantity);
                stockRepository.save(existStock);
            }
            if (noChangeQuantity == 0) {
                stockRepository.delete(existStock);
            }
            Optional<Stock> targetStockOptional = stockRepository.findByWarePositionIdAndGoodsIdAndExpireDate(existStockWarePosition.getId(), existStockGoods.getId(), newExpireDate);
            if (targetStockOptional.isPresent()) {
                Stock targetStock = targetStockOptional.get();
                targetStock.setQuantity(targetStock.getQuantity() + changeQuantity);
                stockRepository.save(targetStock);
            } else {
                Stock newStock = new Stock();
                newStock.setQuantity(changeQuantity);
                newStock.setExpireDate(newExpireDate);
                newStock.setIsActive(existStockIsActive);
                newStock.setWarePosition(existStockWarePosition);
                newStock.setGoods(existStockGoods);
                stockRepository.save(newStock);
            }
        }
    }

    /**
     * ????????????????????????????????????
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void move(MoveDTO moveDTO) {
        synchronizedOperate(StockOperate.MOVE, moveDTO);
    }

    @Override
    public void updateQuantityGuarantee() {
        long now = new Date().getTime();
        List<Stock> stockList = stockRepository.findAll();
        stockList.forEach(s -> {
            long expireDate = s.getExpireDate().getTime();
            long monthsOfWarranty = Long.valueOf(s.getGoods().getMonthsOfWarranty());
            long timeOfWarranty = (monthsOfWarranty * 365 * 24 * 60 * 60 * 1000) / 12;
            double quantityGuarantee = 1 - (expireDate - now) * 1D / timeOfWarranty;
            s.setQuantityGuarantee(quantityGuarantee);
            stockRepository.save(s);
        });
    }

    @Override
    public Boolean create(List<CountStock> resources) {
        // todo ??????????????????
        // ???????????????
        countStockRepository.deleteAll();
        // ????????????
        countStockRepository.saveAll(resources);
        return true;
    }

    private void moveStub(Stock stock, Stock newStock, JwtUser user, String description, BigDecimal price) {
        if (newStock.getQuantity() > stock.getQuantity()) {
            throw new BadRequestException("??????????????????????????????");
        }
        if (newStock.getWarePosition().getId().equals(stock.getWarePosition().getId())) {
            // throw new BadRequestException("?????????????????????????????????????????????");
            return;
        }
        if (stock.getQuantity() > newStock.getQuantity()) {
            stock.setQuantity(stock.getQuantity() - newStock.getQuantity());
            stockRepository.save(stock);
        } else {
            stockRepository.delete(stock);
        }
        add(newStock);
        stockFlowService.create(
                StockFlowType.MOVE,
                stock.getGoods().getSn(),
                stock.getGoods().getName(),
                newStock.getQuantity(),
                price,
                stock.getExpireDate(),
                stock.getGoods().getPackCount(),
                stock.getGoods().getUnit(),
                null,
                null,
                stock.getGoods(),
                newStock.getWarePosition(),
                stock.getWarePosition(),
                user.getUsername(),
                description
        );
    }

    /**
     * ??????????????????????????????????????????????????????
     *
     * @param stock
     */
    private void add(Stock stock) {
        Optional<Stock> originStockOptional;
        if (stock.getId() != null) {
            originStockOptional = stockRepository.findById(stock.getId());
        } else {
            originStockOptional = stockRepository.findByWarePositionIdAndGoodsIdAndExpireDate(stock.getWarePosition().getId(), stock.getGoods().getId(), stock.getExpireDate());
        }

        if (originStockOptional.isPresent()) {
            // ?????????????????????isActive????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
            Stock originStock = originStockOptional.get();
            originStock.setQuantity(originStock.getQuantity() + stock.getQuantity());
            stockRepository.save(originStock);
        } else {
            // ?????????????????????
            stock.setIsActive(true);
            stockRepository.save(stock);
        }
    }

    /**
     * ????????????
     */
    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = WarePositionServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    public void add(AddDTO addDTO) {
        synchronizedOperate(StockOperate.ADD, addDTO);
    }

    private void addStub(Stock resource, StockFlowType stockFlowType, ReceiveGoods receiveGoods, CustomerOrder customerOrder, String userName, String description, BigDecimal price) {
        checkStock(resource);
        add(resource);
        if (stockFlowType != null) {
            stockFlowService.create(
                    stockFlowType,
                    resource.getGoods().getSn(),
                    resource.getGoods().getName(),
                    resource.getQuantity(),
                    price,
                    resource.getExpireDate(),
                    resource.getGoods().getPackCount(),
                    resource.getGoods().getUnit(),
                    customerOrder,
                    receiveGoods,
                    resource.getGoods(),
                    resource.getWarePosition(),
                    null,
                    userName,
                    description
            );
        }
    }

    /**
     * ??????????????????????????????
     *
     * @return ?????????????????????????????????????????????
     */
    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = WarePositionServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    @Synchronized
    public Boolean reduce(ReduceDTO reduceDTO) {
        return (Boolean) synchronizedOperate(StockOperate.REDUCE, reduceDTO);
    }

    private Boolean reduceStub(Stock resources, StockFlowType stockFlowType, Boolean fetchAll, BigDecimal price, CustomerOrder order,
                               JwtUser user, CustomerOrderStock orderStock, ReceiveGoodsItem receiveGoodsItem,
                               String stockFlowDescription) {
        checkStock(resources);
        Boolean result;
        Boolean generateStockFlow;
        String description;
        Long resultCount;
        Optional<Stock> stockOptional;
        Stock stock = null;
        if (resources.getId() != null) {
            stockOptional = stockRepository.findById(resources.getId());
        } else {
            stockOptional = stockRepository.findByWarePositionIdAndGoodsIdAndExpireDateAndIsActive(resources.getWarePosition().getId(), resources.getGoods().getId(), resources.getExpireDate(), true);
        }
        // ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        if (!stockOptional.isPresent()) {
            generateStockFlow = false;
            resultCount = 0L;
            description = "????????????";
            result = false;
        } else {
            stock = stockOptional.get();
            // ??????????????????????????????
            if (resources.getQuantity() > stock.getQuantity()) {
                if (fetchAll) {
                    // ??????????????????????????????????????????????????????????????????
                    generateStockFlow = false;
                    resultCount = 0L;
                    description = "???????????????????????????????????????";
                    result = false;
                } else {
                    // ???????????????
                    generateStockFlow = true;
                    resultCount = stock.getQuantity();
                    description = "??????????????????";
                    result = false;
                    stockRepository.delete(stock);
                }
            }
            // ????????????????????????????????????
            else {
                generateStockFlow = true;
                resultCount = resources.getQuantity();
                // ??????????????????????????????
                description = "";
                result = true;
                if (resources.getQuantity().equals(stock.getQuantity())) {
                    // ????????????????????????????????????????????????
                    stockRepository.delete(stock);
                } else if (resources.getQuantity() < stock.getQuantity()) {
                    // ???????????????????????????????????????????????????
                    stock.setQuantity(stock.getQuantity() - resources.getQuantity());
                    stockRepository.save(stock);
                }
            }
        }
        if (stock != null && generateStockFlow && stockFlowType != null && receiveGoodsItem == null) {
            stockFlowService.create(
                    stockFlowType,
                    stock.getGoods().getSn(),
                    stock.getGoods().getName(),
                    resultCount,
                    price,
                    stock.getExpireDate(),
                    stock.getGoods().getPackCount(),
                    stock.getGoods().getUnit(),
                    order,
                    null,
                    stock.getGoods(),
                    null,
                    stock.getWarePosition(),
                    user.getUsername(),
                    stockFlowDescription
            );
        }
        if (orderStock != null) {
            orderStock.setQuantity(resultCount);
            orderStock.setDescription(description);
            customerOrderStockRepository.save(orderStock);
        }
        if (receiveGoodsItem != null) {
            receiveGoodsItem.setQuantityCancelFetch(resultCount);
            receiveGoodsItem.setDescription(description);
            receiveGoodsItemRepository.save(receiveGoodsItem);
        }
        return result;
    }

    /**
     * ??????????????????????????????????????????
     */
    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = WarePositionServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    @Synchronized
    public Boolean reduceForOrderItem(ReduceForOrderItemDTO reduceForOrderItemDTO) {
        return (Boolean) synchronizedOperate(StockOperate.REDUCE_FOR_ORDER_ITEM, reduceForOrderItemDTO);
    }

    private Boolean reduceStub(CustomerOrderItem orderItem, Date expireDateMin, Date expireDateMax, String targetWareZones, Boolean fetchAll, JwtUser user, Long customerId, Boolean usePackCount, String stockFlowDescription) {
        // TODO REDUCE_FOR_ORDER_ITEM-??????-reduceStub
        Specification<Stock> spec = new Specification<Stock>() {
            @Override
            public Predicate toPredicate(Root<Stock> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> predicates = new ArrayList<>();

                predicates.add(criteriaBuilder.equal(root.get("goods").get("customer").get("id"), customerId));
                predicates.add(criteriaBuilder.equal(root.get("goods").get("sn"), orderItem.getSn()));
                predicates.add(criteriaBuilder.equal(root.get("isActive"), true));

                if (usePackCount != null && usePackCount) {
                    predicates.add(criteriaBuilder.equal(root.get("goods").get("packCount"), orderItem.getPackCount()));
                }

                if (targetWareZones != null && !"".equals(targetWareZones)) {
                    String[] wareZoneIds = targetWareZones.split(",");
                    CriteriaBuilder.In<Long> in = criteriaBuilder.in(root.get("warePosition").get("wareZone").get("id"));
                    Arrays.stream(wareZoneIds).forEach(id -> in.value(Long.valueOf(id)));
                    predicates.add(in);
                }

                if (expireDateMin != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("expireDate"), expireDateMin));
                }

                if (expireDateMax != null) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("expireDate"), expireDateMax));
                }

                Predicate[] p = new Predicate[predicates.size()];
                criteriaQuery.where(criteriaBuilder.and(predicates.toArray(p)));

                List<Order> orders = new ArrayList<>();
                orders.add(criteriaBuilder.asc(root.get("expireDate").as(Date.class)));
                orders.add(criteriaBuilder.asc(root.get("warePosition").get("wareZone").get("sortOrder")));
                orders.add(criteriaBuilder.asc(root.get("warePosition").get("sortOrder")));

                criteriaQuery.orderBy(orders);

                return criteriaQuery.getRestriction();
            }
        };

        Long resultCount;
        String description;
        Boolean result;
        List<Stock> stocks = stockRepository.findAll(spec);

        if (stocks.isEmpty()) {
            // ?????????SN?????????????????????????????????????????????????????????????????????
            resultCount = 0L;
            description = "????????????";
            result = false;
        } else {
            Long stockCount = stocks.stream().mapToLong(Stock::getQuantity).sum();
            if (orderItem.getQuantityInitial() > stockCount && fetchAll) {
                // ?????????????????????????????????????????????????????????????????????0
                resultCount = 0L;
                description = "???????????????????????????????????????";
                result = false;
            } else {
                Long orderItemQuantityLeft = orderItem.getQuantityInitial();
                Long reduceCount;
                Boolean isSatisfied;
                for (Stock stock : stocks) {
                    // ????????????????????????
                    if (orderItemQuantityLeft < stock.getQuantity()) {
                        reduceCount = orderItemQuantityLeft;
                        stock.setQuantity(stock.getQuantity() - reduceCount);
                        stockRepository.save(stock);
                        orderItemQuantityLeft = 0L;
                        isSatisfied = true;
                    }
                    // ??????????????????
                    else if (orderItemQuantityLeft.equals(stock.getQuantity())) {
                        reduceCount = orderItemQuantityLeft;
                        stockRepository.delete(stock);
                        orderItemQuantityLeft = 0L;
                        isSatisfied = true;
                    }
                    // ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
                    else {
                        reduceCount = stock.getQuantity();
                        stockRepository.delete(stock);
                        orderItemQuantityLeft = orderItemQuantityLeft - reduceCount;
                        isSatisfied = false;
                    }

                    stockFlowService.create(
                            StockFlowType.OUT_ORDER_FIT,
                            stock.getGoods().getSn(),
                            stock.getGoods().getName(),
                            reduceCount,
                            orderItem.getPrice(),
                            stock.getExpireDate(),
                            stock.getGoods().getPackCount(),
                            stock.getGoods().getUnit(),
                            orderItem.getCustomerOrder(),
                            null,
                            stock.getGoods(),
                            null,
                            stock.getWarePosition(),
                            user.getUsername(),
                            stockFlowDescription
                    );

                    if (isSatisfied) {
                        break;
                    }
                }
                // ??????0?????????????????????????????????0???????????????
                result = orderItemQuantityLeft <= 0;
                resultCount = orderItem.getQuantityInitial() - orderItemQuantityLeft;
                description = result ? "" : "??????????????????";
            }
        }
        orderItem.setQuantity(resultCount);
        orderItem.setDescription(description);
        customerOrderItemRepository.save(orderItem);
        return result;
    }

    /**
     * ????????????????????????????????????????????????
     */
    @Override
    @Caching(evict = {
            @CacheEvict(value = CACHE_NAME, allEntries = true),
            @CacheEvict(value = WarePositionServiceImpl.CACHE_NAME, allEntries = true),
            @CacheEvict(value = StockFlowServiceImpl.CACHE_NAME, allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    public Boolean reduceForOrderStock(ReduceForOrderStockDTO reduceForOrderStockDTO) {
        Stock stock = new Stock();
        stock.setGoods(reduceForOrderStockDTO.getOrderStock().getGoods());
        stock.setWarePosition(reduceForOrderStockDTO.getOrderStock().getWarePosition());
        stock.setExpireDate(reduceForOrderStockDTO.getOrderStock().getExpireDate());
        stock.setQuantity(reduceForOrderStockDTO.getOrderStock().getQuantityInitial());
        return reduce(new ReduceDTO(stock, StockFlowType.OUT_ORDER_FIT, reduceForOrderStockDTO.getFetchAll(), reduceForOrderStockDTO.getOrderStock().getPrice(), reduceForOrderStockDTO.getOrderStock().getCustomerOrder(), reduceForOrderStockDTO.getUser(), reduceForOrderStockDTO.getOrderStock(), null, reduceForOrderStockDTO.getOrderStock().getDescription()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Boolean reduceForReceiveGoods(ReceiveGoodsItem receiveGoodsItem) {
        checkStock(receiveGoodsItem);
        Long goodsId = receiveGoodsItem.getGoods().getId();
        Optional<Goods> optionalGoods = goodsRepository.findById(goodsId);
        if (!optionalGoods.isPresent()) {
            throw new BadRequestException("???????????????????????????????????????");
        }
        Goods goods = optionalGoods.get();
        Stock stock = new Stock();
        stock.setGoods(receiveGoodsItem.getGoods());
        stock.setWarePosition(receiveGoodsItem.getWarePosition());
        stock.setExpireDate(receiveGoodsItem.getExpireDate());
        stock.setQuantity(receiveGoodsItem.getQuantity() + receiveGoodsItem.getPackages() * goods.getPackCount());
        return reduce(new ReduceDTO(stock, null, true, null, null, null, null, receiveGoodsItem, receiveGoodsItem.getDescription()));
    }

    @Synchronized
    private Object synchronizedOperate(StockOperate operate, Object param) {
        Object result = null;
        switch (operate) {
            case ACTIVE:
                this.activateStub((StockActivateDTO) param);
                break;
            case RECEIVE_GOODS:
                this.receiveGoodsStub((ReceiveGoods) param);
                break;
            case CANCEL_RECEIVE_GOODS:
                result = this.cancelReceiveGoodsStub((ReceiveGoods) param);
                break;
            case ADD:
                AddDTO addDTO = (AddDTO) param;
                this.addStub(addDTO.getResource(), addDTO.getStockFlowType(), addDTO.getReceiveGoods(), addDTO.getCustomerOrder(), addDTO.getUserName(), addDTO.getDescription(), addDTO.getPrice());
                break;
            case REDUCE:
                ReduceDTO reduceDTO = (ReduceDTO) param;
                result = this.reduceStub(reduceDTO.getResources(), reduceDTO.getStockFlowType(), reduceDTO.getFetchAll(), reduceDTO.getPrice(), reduceDTO.getOrder(), reduceDTO.getUser(), reduceDTO.getOrderStock(), reduceDTO.getReceiveGoodsItem(), reduceDTO.getStockFlowDescription());
                break;
            case REDUCE_FOR_ORDER_ITEM:
                // TODO REDUCE_FOR_ORDER_ITEM-??????
                ReduceForOrderItemDTO reduceForOrderItemDTO = (ReduceForOrderItemDTO) param;
                result = this.reduceStub(
                        reduceForOrderItemDTO.getOrderItem(), reduceForOrderItemDTO.getExpireDateMin(), reduceForOrderItemDTO.getExpireDateMax(),
                        reduceForOrderItemDTO.getTargetWareZones(), reduceForOrderItemDTO.getFetchAll(), reduceForOrderItemDTO.getUser(),
                        reduceForOrderItemDTO.getCustomerId(), reduceForOrderItemDTO.getUsePackCount(), reduceForOrderItemDTO.getStockFlowDescription()
                );
                break;
            case UPDATE_EXPIRE_DATE:
                UpdateExpireDateDTO updateExpireDateDTO = (UpdateExpireDateDTO) param;
                this.updateExpireDateStub(updateExpireDateDTO.getStockId(), updateExpireDateDTO.getChangeQuantity(), updateExpireDateDTO.getNewExpireDate());
                break;
            case MOVE:
                MoveDTO moveDTO = (MoveDTO) param;
                this.moveStub(moveDTO.getStock(), moveDTO.getNewStock(), moveDTO.getUser(), moveDTO.getDescription(), moveDTO.getPrice());
                break;
            default:
                throw new IllegalArgumentException("????????????");
        }
        return result;
    }

    private void checkStock(ReceiveGoodsItem resource) {
        checkStock(resource.getWarePosition().getId(), resource.getGoods().getId(), resource.getExpireDate(), resource.getQuantity());
    }

    private void checkStock(Stock resource) {
        checkStock(resource.getWarePosition().getId(), resource.getGoods().getId(), resource.getExpireDate(), resource.getQuantity());
    }

    private void checkStock(Long warePositionId, Long goodsId, Date expireDate, Long quantity) {
        if (warePositionId == null) {
            throw new BadRequestException("?????????????????????");
        }
        if (goodsId == null) {
            throw new BadRequestException("?????????????????????");
        }
        if (expireDate == null) {
            throw new BadRequestException("?????????????????????????????????");
        }
        if (quantity == null) {
            throw new BadRequestException("?????????????????????");
        }
    }

    protected enum StockOperate {
        ACTIVE, RECEIVE_GOODS, CANCEL_RECEIVE_GOODS, ADD, REDUCE, REDUCE_FOR_ORDER_ITEM, UPDATE_EXPIRE_DATE, MOVE
    }
}