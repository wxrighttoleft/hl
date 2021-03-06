package org.mstudio.modules.wms.dispatch.service.impl;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.ObjectUtil;
import org.mstudio.exception.BadRequestException;
import org.mstudio.modules.system.domain.User;
import org.mstudio.modules.system.repository.UserRepository;
import org.mstudio.modules.wms.address.repository.AddressRepository;
import org.mstudio.modules.wms.customer_order.domain.OrderStatus;
import org.mstudio.modules.wms.dispatch.domain.DispatchCoefficient;
import org.mstudio.modules.wms.dispatch.domain.DispatchPiece;
import org.mstudio.modules.wms.dispatch.domain.DispatchStatusEnum;
import org.mstudio.modules.wms.dispatch.domain.DispatchSys;
import org.mstudio.modules.wms.dispatch.repository.DispatchCoefficientRepository;
import org.mstudio.modules.wms.dispatch.repository.DispatchPieceRepository;
import org.mstudio.modules.wms.dispatch.repository.DispatchSysRepository;
import org.mstudio.modules.wms.dispatch.service.DispatchService;
import org.mstudio.modules.wms.dispatch.service.mapper.DispatchPieceMapper;
import org.mstudio.modules.wms.dispatch.service.object.DispatchPieceDTO;
import org.mstudio.modules.wms.pack.domain.Pack;
import org.mstudio.modules.wms.pack.repository.PackRepository;
import org.mstudio.modules.wms.pick_match.domain.PickMatch;
import org.mstudio.modules.wms.pick_match.domain.PickMatchTypeEnum;
import org.mstudio.modules.wms.receive_goods.domain.ReceiveGoodsPiece;
import org.mstudio.modules.wms.receive_goods.domain.ReceiveGoodsPieceTypeEnum;
import org.mstudio.utils.PageUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

import static org.mstudio.utils.SecurityContextHolder.getUserDetails;

/**
 * @author lfj
 */

@Service
@Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
public class DispatchServiceImpl implements DispatchService {

    private static final String CACHE_NAME = "Dispatch";

    @Autowired
    private DispatchCoefficientRepository dispatchCoefficientRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private DispatchSysRepository dispatchSysRepository;

    @Autowired
    private PackRepository packRepository;

    @Autowired
    private DispatchPieceRepository dispatchPieceRepository;
    @Autowired
    private DispatchPieceMapper dispatchPieceMapper;

    @Override
    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
    public Map queryAll(Pageable pageable) {
        Specification<DispatchCoefficient> spec = (Specification<DispatchCoefficient>) (root, criteriaQuery, criteriaBuilder) -> null;
        // ???????????????????????????????????????
        Sort sort = pageable.getSort().and(new Sort(Sort.Direction.DESC, "id"));
        Pageable newPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<DispatchCoefficient> page = dispatchCoefficientRepository.findAll(spec, newPageable);
        return PageUtil.toPage(page);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public DispatchCoefficient update(Long id, DispatchCoefficient resource) {
        Optional<DispatchCoefficient> optional = dispatchCoefficientRepository.findById(id);
        if (!optional.isPresent()) {
            throw new BadRequestException("?????????ID??????");
        }
        DispatchCoefficient coefficient = optional.get();
        if (!coefficient.getId().equals(resource.getId())) {
            throw new BadRequestException("?????????ID??????");
        }

        return dispatchCoefficientRepository.save(resource);
    }

    @Override
    @Cacheable(value = CACHE_NAME, keyGenerator = "keyGenerator")
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true, rollbackFor = Exception.class)
    public Map querySysAll(Pageable pageable) {
        Specification<DispatchSys> spec = (Specification<DispatchSys>) (root, criteriaQuery, criteriaBuilder) -> null;
        // ???????????????????????????????????????
        Sort sort = pageable.getSort().and(new Sort(Sort.Direction.DESC, "id"));
        Pageable newPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<DispatchSys> page = dispatchSysRepository.findAll(spec, newPageable);
        return PageUtil.toPage(page);
    }

    @Override
    @Cacheable(value = CACHE_NAME, key = "#p0")
    public DispatchCoefficient findById(Long id) {
        Optional<DispatchCoefficient> optionalAddress = dispatchCoefficientRepository.findById(id);
        if (!optionalAddress.isPresent()) {
            throw new BadRequestException(" ??????????????? ID=" + id);
        }
        return optionalAddress.get();
    }


    @Override
//    @Cacheable(value = CACHE_NAME, key = "#p1")
    public Map statistics(String startDate, String endDate, String search, Pageable pageable) {
        Specification<User> spec = (Specification<User>) (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<Predicate>();
            if (!ObjectUtils.isEmpty(search)) {
                predicates.add(criteriaBuilder.like(root.get("username").as(String.class), "%" + search + "%"));
            }
            Predicate[] p = new Predicate[predicates.size()];
            return criteriaBuilder.and(predicates.toArray(p));
        };
        Sort sort = pageable.getSort().and(new Sort(Sort.Direction.DESC, "id"));
        Pageable newPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<User> page = userRepo.findAll(spec, newPageable);

        Date start = null;
        Date end = null;
        if (startDate != null && endDate != null) {
            start = DateUtil.parse(startDate);
            end = DateUtil.parse(endDate);
            // ????????????????????????????????????????????????????????????0????????????????????????
            Calendar c = Calendar.getInstance();
            c.setTime(end);
            c.add(Calendar.DAY_OF_MONTH, 1);
            end = c.getTime();
        }
        Date finalStart = start;
        Date finalEnd = end;

        return PageUtil.toPage(page.map(user -> {
            Map m = new HashMap();
            m.put("id", user.getId());
            m.put("username", user.getUsername());
            Float unFinishScore = 0f;
            Float finishScore = 0f;
            for (DispatchPiece dispatchPiece : user.getDispatchPieces()) {
                if (startDate != null && endDate != null) {
                    if (dispatchPiece.getCreateTime().before(finalStart) || dispatchPiece.getCreateTime().after(finalEnd)) {
                        continue;
                    }
                }
                if (DispatchStatusEnum.FINISH.equals(dispatchPiece.getStatus())) {
                    finishScore += dispatchPiece.getScore();
                } else {
                    unFinishScore += dispatchPiece.getScore();
                }
            }
            m.put("unFinishScore", unFinishScore);
            m.put("finishScore", finishScore);
            return m;
        }));
    }

    @Override
//    @Cacheable(value = CACHE_NAME, key = "#p1")
    public Map statisticsAll(String startDate, String endDate, String search, Pageable pageable) {
        Specification<User> spec = (Specification<User>) (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<Predicate>();
            if (!ObjectUtils.isEmpty(search)) {
                predicates.add(criteriaBuilder.like(root.get("username").as(String.class), "%" + search + "%"));
            }
            Predicate[] p = new Predicate[predicates.size()];
            return criteriaBuilder.and(predicates.toArray(p));
        };
        Sort sort = pageable.getSort().and(new Sort(Sort.Direction.DESC, "id"));
        Pageable newPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<User> page = userRepo.findAll(spec, newPageable);

        Date start = null;
        Date end = null;
        if (startDate != null && endDate != null) {
            start = DateUtil.parse(startDate);
            end = DateUtil.parse(endDate);
            // ????????????????????????????????????????????????????????????0????????????????????????
            Calendar c = Calendar.getInstance();
            c.setTime(end);
            c.add(Calendar.DAY_OF_MONTH, 1);
            end = c.getTime();
        }
        Date finalStart = start;
        Date finalEnd = end;

        return PageUtil.toPage(page.map(user -> {
            Map m = new HashMap();
            m.put("id", user.getId());
            m.put("username", user.getUsername());
            Float unFinishScore = 0f;
            Float finishScore = 0f;
            for (DispatchPiece dispatchPiece : user.getDispatchPieces()) {
                if (startDate != null && endDate != null) {
                    if (dispatchPiece.getCreateTime().before(finalStart) || dispatchPiece.getCreateTime().after(finalEnd)) {
                        continue;
                    }
                }
                if (DispatchStatusEnum.FINISH.equals(dispatchPiece.getStatus())) {
                    finishScore += dispatchPiece.getScore();
                } else {
                    unFinishScore += dispatchPiece.getScore();
                }
            }
            m.put("unFinishScore", unFinishScore);
            m.put("finishScore", finishScore);

            Float pickMatchScore = 0f;
            Float reviewScore = 0f;
            for (PickMatch pm : user.getPickMatchs()) {
                if (startDate != null && endDate != null) {
                    if (pm.getCreateTime().before(finalStart) || pm.getCreateTime().after(finalEnd)) {
                        continue;
                    }
                }
                if (null != pm.getType()) {
                    if (PickMatchTypeEnum.PICK_MATCH.equals(pm.getType())) {
                        pickMatchScore += pm.getScore();
                    } else {
                        reviewScore += pm.getScore();
                    }
                }
            }
            m.put("pickMatchScore", pickMatchScore);
            m.put("reviewScore", reviewScore);

            Float unloadScore = 0f;
            Float putInScore = 0f;
            for (ReceiveGoodsPiece receiveGoodsPiece : user.getReceiveGoodsPieces()) {
                if (startDate != null && endDate != null) {
                    if (receiveGoodsPiece.getCreateTime().before(finalStart) || receiveGoodsPiece.getCreateTime().after(finalEnd)) {
                        continue;
                    }
                }
                if (ReceiveGoodsPieceTypeEnum.UNLOAD == receiveGoodsPiece.getType()) {
                    unloadScore += receiveGoodsPiece.getScore();
                } else {
                    putInScore += receiveGoodsPiece.getScore();
                }
            }
            m.put("unloadScore", unloadScore);
            m.put("putInScore", putInScore);

            return m;
        }));
    }

    @Override
    public Long save() {
        // ????????????
        User user = userRepository.findByUsername(getUserDetails().getUsername());

        // ???????????????????????????
        Specification<Pack> spec = new Specification<Pack>() {
            @Override
            public Predicate toPredicate(Root<Pack> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(criteriaBuilder.equal(root.get("user").get("username"), user.getUsername()));
                predicates.add(criteriaBuilder.equal(root.get("packStatus"), OrderStatus.SENDING));

                if (predicates.size() != 0) {
                    Predicate[] p = new Predicate[predicates.size()];
                    return criteriaBuilder.and(predicates.toArray(p));
                } else {
                    return null;
                }
            }
        };
        List<Pack> packs = packRepository.findAll(spec);

        // ??????????????????
        DispatchCoefficient dispatchCoefficient = dispatchCoefficientRepository.findAll().get(0);

        // ?????????????????????????????????
        Specification<DispatchPiece> dispatchPieceSpec = new Specification<DispatchPiece>() {
            @Override
            public Predicate toPredicate(Root<DispatchPiece> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(criteriaBuilder.equal(root.get("user").get("username"), user.getUsername()));
                predicates.add(criteriaBuilder.equal(root.get("status"), DispatchStatusEnum.UN_FINISH));
                Predicate[] p = new Predicate[predicates.size()];
                return criteriaBuilder.and(predicates.toArray(p));
            }
        };
        Optional<DispatchPiece> optionalDispatchPiece = dispatchPieceRepository.findOne(dispatchPieceSpec);
        DispatchPiece dispatchPiece = optionalDispatchPiece.isPresent() ? optionalDispatchPiece.get() : new DispatchPiece();
        dispatchPiece.setStorePrice(dispatchCoefficient.getStore());
        AtomicReference<Integer> storeNum = new AtomicReference<>(0);
        AtomicReference<Integer> dispatchSum = new AtomicReference<>(0);
        Map tmp = new HashMap();
        packs.forEach(item -> {
            dispatchSum.updateAndGet(v -> v + item.getPackages());
            if (!tmp.containsKey(item.getAddress().getId())) {
                storeNum.getAndSet(storeNum.get() + 1);
                tmp.put(item.getAddress().getId(), null);
            }
        });
        dispatchPiece.setStoreNum(storeNum.get());
        dispatchPiece.setDispatchPrice(dispatchCoefficient.getDispatch());
        dispatchPiece.setDispatchSum(dispatchSum.get());
        dispatchPiece.setMileagePrice(dispatchCoefficient.getMileage());
        dispatchPiece.setStatus(DispatchStatusEnum.UN_FINISH);
        dispatchPiece.setUser(user);
        dispatchPiece.setPacks(packs);
        return dispatchPieceRepository.save(dispatchPiece).getId();
    }

    @Override
    public DispatchPieceDTO finish(Float mileage, Long dispatchSysId) {
        if (ObjectUtil.isNull(mileage) || mileage.compareTo(0f) <= 0) {
            throw new BadRequestException("????????????");
        }
        if (ObjectUtil.isNull(dispatchSysId)) {
            throw new BadRequestException("??????????????????");
        }
        DispatchSys dispatchSys = dispatchSysRepository.getOne(dispatchSysId);
        if (ObjectUtil.isNull(dispatchSys)) {
            throw new BadRequestException("??????????????????");
        }
        // ????????????
        User user = userRepository.findByUsername(getUserDetails().getUsername());
        // ?????????????????????????????????
        Specification<DispatchPiece> dispatchPieceSpec = new Specification<DispatchPiece>() {
            @Override
            public Predicate toPredicate(Root<DispatchPiece> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(criteriaBuilder.equal(root.get("user").get("username"), getUserDetails().getUsername()));
                predicates.add(criteriaBuilder.equal(root.get("status"), DispatchStatusEnum.UN_FINISH));
                Predicate[] p = new Predicate[predicates.size()];
                return criteriaBuilder.and(predicates.toArray(p));
            }
        };
        Optional optional = dispatchPieceRepository.findOne(dispatchPieceSpec);
        if (!optional.isPresent()) {
            throw new BadRequestException("?????????");
        }
        DispatchPiece dispatchPiece = (DispatchPiece) optional.get();
        dispatchPiece.setMileage(mileage);
        dispatchPiece.setDispatchSys(dispatchSys);
        dispatchPiece.setScore(
                (dispatchPiece.getStoreNum() * dispatchPiece.getStorePrice() +
                        dispatchPiece.getDispatchSum() * dispatchPiece.getDispatchPrice() +
                        dispatchPiece.getMileage() * dispatchPiece.getMileagePrice()
                ) * user.getCoefficient() * dispatchSys.getValue()
        );
        dispatchPiece.setStatus(DispatchStatusEnum.FINISH);
        return dispatchPieceMapper.toDto(dispatchPieceRepository.save(dispatchPiece));
    }

}