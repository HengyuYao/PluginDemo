// 日志输出方法
function printLogs(message, data) {
  if (data) {
    console.log(
      `【${new Date().toLocaleString()}】${message}：`,
      typeof data === "object" ? JSON.stringify(data) : data
    );
  } else {
    console.log(`【${new Date().toLocaleString()}】${message}`);
  }
}

/**
 * 与 ITSM 约定的事项状态 代码与名称 枚举
 *  0：关闭
 *  1：评估通过
 *  2：评估未通过
 *  3：上线成功
 *  4：上线取消
 *  5：上线回退
 */
const STATUS_CODE_ENUM = {
  CLOSE_STATE: 0,
  EVALUATE_PASS: 1,
  EVALUATE_FAILED: 2,
  RELEASE_SUCCESS: 3,
  RELEASE_CANCEL: 4,
  RELEASE_ROLLBACK: 5,
};

const STATUS_NAME_ENUM = {
  CLOSE_STATE: "关闭",
  EVALUATE_PASS: "评估通过",
  EVALUATE_FAILED: "评估未通过",
  RELEASE_SUCCESS: "上线成功",
  RELEASE_CANCEL: "上线取消",
  RELEASE_ROLLBACK: "上线回退",
};

try {
  const {
    item_id: systemReleaseApprovalItemCode, // 系统上线计划申请单事项Id
    status, // ITSM同步的最新状态
  } = body;

  const targetStatusName = STATUS_NAME_ENUM[status];

  // 判断目标状态数据是否正常
  if (!targetStatusName) {
    return {
      success: false,
      code: 999,
      message: "目标状态不存在，请确认状态枚举",
    };
  }

  printLogs(
    `接收到ITSM同步的编号为 ${systemReleaseApprovalItemCode} 的系统上线计划状态，目标状态为`,
    targetStatusName
  );

  printLogs(`查询 ${targetStatusName} 状态相关数据`);

  // 获取目标状态的相关数据
  const targetStatusParse = await apis.getData(false, "Status", {
    name: targetStatusName,
  });

  const targetStatus = targetStatusParse.toJSON();

  printLogs(`目标状态 ${targetStatusName} 数据查询成功，为`, targetStatus);

  printLogs(`查询事项 ${systemReleaseApprovalItemCode} 对应的数据`);

  const systemReleaseApprovalQuery = await apis.getParseQuery(false, "Item");

  const [systemReleaseApprovalParse] = await systemReleaseApprovalQuery
    .matches("values.ItemCode", systemReleaseApprovalItemCode)
    .includes(["itemType"]);

  const systemReleaseApproval = systemReleaseApprovalParse.toJSON();

  printLogs(
    `事项 ${systemReleaseApprovalItemCode} 数据查询完毕，数据为`,
    systemReleaseApproval
  );

  const {
    objectId: systemReleaseApprovalId,
    status: { name: currentStatusName },
  } = systemReleaseApproval;

  printLogs(
    `对事项 ${systemReleaseApprovalItemCode} 状态流转进行校验，当前状态为 ${currentStatusName}，目标状态为 ${targetStatusName}`
  );

  /**
   * 处理流转时的业务异常流程：
   *   1. 关闭状态只能从评估中/评估通过状态流转
   *   2. 上线相关只能在评估通过状态流转
   */
  if (status === STATUS_CODE_ENUM.CLOSE_STATE) {
    const validStatusName = ["风险评估中", "评估通过"];

    if (!validStatusName.includes(currentStatusName)) {
      return {
        success: false,
        code: 999,
        message: `上线计划当前状态为${currentStatusName}，无法流转至${targetStatusName}状态`,
      };
    }
  } else if (
    [
      STATUS_CODE_ENUM.RELEASE_ROLLBACK,
      STATUS_CODE_ENUM.RELEASE_SUCCESS,
      STATUS_CODE_ENUM.RELEASE_CANCEL,
    ].includes(status) // 等于上线相关状态
  ) {
    if (currentStatusName !== "评估通过") {
      return {
        success: false,
        code: 999,
        message: `上线计划当前状态为${currentStatusName}，无法流转至${targetStatusName}状态`,
      };
    }
  }

  printLogs(
    `业务逻辑校验通过，将 ${systemReleaseApprovalItemCode} 事项流转到至 ${targetStatusName} 状态`
  );

  await apis.requestCoreApi("POST", "/parse/functions/transitionItem", {
    id: systemReleaseApprovalId,
    destinationStatus: targetStatus?.objectId,
  });

  printLogs(
    `成功将 ${systemReleaseApprovalId} 系统上线计划申请单事项流转至目标状态`
  );

  return {
    success: true,
    data: null,
    message: "系统上线计划状态同步成功",
  };
} catch (error) {
  return error?.message;
}
