package org.mstudio.modules.wms.Logistics.service;

import org.mstudio.modules.wms.Logistics.domain.LogisticsDetail;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

/**
 * @author Macrow
 * @date 2019-07-09
 */

public interface LogisticsDetailService {

    LogisticsDetail findById(Long id);

    LogisticsDetail create(LogisticsDetail resources,Long logisticsTemplateId);

    LogisticsDetail update(Long Id, LogisticsDetail resources,Long logisticsTemplateId);

    void delete(Long id);

    Object queryAll(String search, String startDate, String endDate, Pageable pageable);

    List<LogisticsDetail> getAllList();

    Map statistics(String startDate, String endDate, String search, Pageable pageable);
}