package org.mstudio.modules.monitor.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 *
 * @date 2018-12-24
 */
@Data
@AllArgsConstructor
public class LogMessage {

    private String body;
    private String timestamp;
    private String threadName;
    private String className;
    private String level;
}
