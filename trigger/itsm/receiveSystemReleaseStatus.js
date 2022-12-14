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

// 【关闭】事项状态id与名称
const CLOSE_STATUS_ID = "OWx6xYazqA";

const CLOSE_STATUS_NAME = "关闭";

// 【评估通过】事项状态id与名称
const EVALUATE_PASS_STATUS_ID = "fqdDibfUlR";

const EVALUATE_PASS_STATUS_NAME = "评估通过";

// 【评估不通过】事项状态id与名称
const EVALUATE_FAILED_STATUS_ID = "IlT5sAXjeP";

const EVALUATE_FAILED_STATUS_NAME = "评估未通过";

// 【上线成功】事项状态id与名称
const RELEASE_SUCCESS_STATUS_ID = "2tsuAN31Nu";

const RELEASE_SUCCESS_STATUS_NAME = "上线成功";

// 【上线取消】事项状态id与名称
const RELEASE_CANCEL_STATUS_ID = "DcqqCtDihZ";

const RELEASE_CANCEL_STATUS_NAME = "上线取消";

// 【上线回退】事项状态id与名称
const RELEASE_ROLLBACK_STATUS_ID = "SqD58KvjOY";

const RELEASE_ROLLBACK_STATUS_NAME = "上线回退";

// 【上传材料】事项状态id与名称
const UPLOAD_ATTACHMENTS_STATUS_ID = "E58x6y7GrN";

const UPLOAD_ATTACHMENTS_STATUS_NAME = "上传材料";

// 【待验证】事项状态id与名称
const AWAIT_VERIFY_STATUS_ID = "iGb2eGZ3Yy";

const AWAIT_VERIFY_STATUS_NAME = "待验证";

// 【待投产】事项状态id
const WILL_RELEASE_STATUS_ID = "KFHC1wdKm6";

// 【风险评估中】事项状态id与名称
const IN_EVALUATE_STATUS_ID = "UueCLCVtcO";

// 缺陷上线计划事项类型ID
const BUG_RELEASE_ITEM_TYPE_ID = "iYh6g4qFov";

/**
 * 与 ITSM 约定的事项状态枚举
 *  0：关闭
 *  1：评估通过 / 上传材料
 *    系统上线计划流转到【评估通过】，缺陷上线计划流转到【上传材料】
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

// 与 ITSM 约定的目标状态与 devops 平台内状态 id 枚举
const STATUS_CODE_TO_ID_ENUM = {
  [STATUS_CODE_ENUM.CLOSE_STATE]: CLOSE_STATUS_ID,
  [STATUS_CODE_ENUM.EVALUATE_PASS]: EVALUATE_PASS_STATUS_ID,
  [STATUS_CODE_ENUM.EVALUATE_FAILED]: EVALUATE_FAILED_STATUS_ID,
  [STATUS_CODE_ENUM.RELEASE_SUCCESS]: RELEASE_SUCCESS_STATUS_ID,
  [STATUS_CODE_ENUM.RELEASE_CANCEL]: RELEASE_CANCEL_STATUS_ID,
  [STATUS_CODE_ENUM.RELEASE_ROLLBACK]: RELEASE_ROLLBACK_STATUS_ID,
};

// Devops 平台中，事项状态 id 与名称枚举
const STATUS_ID_TO_NAME_ENUM = {
  [CLOSE_STATUS_ID]: CLOSE_STATUS_NAME,
  [EVALUATE_PASS_STATUS_ID]: EVALUATE_PASS_STATUS_NAME,
  [EVALUATE_FAILED_STATUS_ID]: EVALUATE_FAILED_STATUS_NAME,
  [RELEASE_SUCCESS_STATUS_ID]: RELEASE_SUCCESS_STATUS_NAME,
  [RELEASE_CANCEL_STATUS_ID]: RELEASE_CANCEL_STATUS_NAME,
  [RELEASE_ROLLBACK_STATUS_ID]: RELEASE_ROLLBACK_STATUS_NAME,
};

try {
  const {
    item_id: releasePlanItemCode, // 系统/缺陷上线计划事项Id
    status, // ITSM同步的最新状态
  } = body;

  printLogs(
    `开始处理ITSM发送的事项编号为 ${releasePlanItemCode} 的系统/缺陷上线计划最新状态同步请求`
  );

  // 拿出目标状态 id 和 名称
  let TARGET_STATUS_ID = STATUS_CODE_TO_ID_ENUM[status];

  let TARGET_STATUS_NAME = STATUS_ID_TO_NAME_ENUM[TARGET_STATUS_ID];

  // 判断目标状态数据是否正常
  if (!TARGET_STATUS_ID) {
    return {
      success: false,
      code: 999,
      message: "目标状态不存在，请确认状态枚举",
    };
  }

  printLogs(`查询事项 ${releasePlanItemCode} 对应的数据`);

  const ItemParseQuery = await apis.getParseQuery(false, "Item");

  const releasePlanParse = await ItemParseQuery
    .equalTo("values.ItemCode", releasePlanItemCode) // 事项编号
    .include(["status"]) // 包含状态信息
    .first({ sessionToken });

  const releasePlan = releasePlanParse.toJSON();

  printLogs(`事项 ${releasePlanItemCode} 数据查询完毕，数据为`, releasePlan);

  // 根据条件判断，是否需要额外处理目标状态
  if (
    releasePlan?.itemType?.objectId === BUG_RELEASE_ITEM_TYPE_ID // 事项类型是缺陷上线计划
  ) {

    if (status === 1) {
      // 重置目标状态ID和名称，指向【上传材料】
      TARGET_STATUS_ID = UPLOAD_ATTACHMENTS_STATUS_ID;

      TARGET_STATUS_NAME = UPLOAD_ATTACHMENTS_STATUS_NAME;
    }

    if (status === 3) {
      // 重置目标状态ID和名称，指向【待验证】
      TARGET_STATUS_ID = AWAIT_VERIFY_STATUS_ID;

      TARGET_STATUS_NAME = AWAIT_VERIFY_STATUS_NAME;
    }
  }

  printLogs(
    `${releasePlanItemCode} 的系统/缺陷上线计划目标状态为`,
    TARGET_STATUS_NAME
  );

  printLogs(`查询 ${TARGET_STATUS_NAME} 状态相关数据`);

  // 获取目标状态的相关数据
  const targetStatusParse = await apis.getData(false, "Status", {
    objectId: TARGET_STATUS_ID,
  });

  const targetStatus = targetStatusParse.toJSON();

  printLogs(`目标状态 ${TARGET_STATUS_NAME} 数据查询成功，为`, targetStatus);

  const {
    objectId: releasePlanId,
    status: { objectId: CURRENT_STATUS_ID, name: CURRENT_STATUS_NAME },
  } = releasePlan;

  printLogs(
    `对事项 ${releasePlanItemCode} 状态流转进行校验，当前状态为 ${CURRENT_STATUS_NAME}，目标状态为 ${TARGET_STATUS_NAME}`
  );

  /**
   * 处理流转时的业务异常流程：
   *   1. 关闭状态只能从 评估中/评估通过/上传材料 状态流转
   *   2. 上线相关只能在评估通过状态流转
   */
  if (status === STATUS_CODE_ENUM.CLOSE_STATE) {
    const validStatusId = [
      IN_EVALUATE_STATUS_ID,
      EVALUATE_PASS_STATUS_ID,
      UPLOAD_ATTACHMENTS_STATUS_ID,
    ];

    if (!validStatusId.includes(CURRENT_STATUS_ID)) {
      return {
        success: false,
        code: 999,
        message: `上线计划当前状态为 ${CURRENT_STATUS_NAME}，无法流转至 ${TARGET_STATUS_NAME} 状态`,
      };
    }
  } else if (
    // 流转至上线后的相关状态
    [
      STATUS_CODE_ENUM.RELEASE_ROLLBACK,
      STATUS_CODE_ENUM.RELEASE_SUCCESS,
      STATUS_CODE_ENUM.RELEASE_CANCEL,
    ].includes(status)
  ) {
    // 待投产状态才可流转到上线完成、上线取消、上线回退状态
    if (CURRENT_STATUS_ID !== WILL_RELEASE_STATUS_ID) {
      return {
        success: false,
        code: 999,
        message: `上线计划当前状态为 ${CURRENT_STATUS_NAME}，无法流转至 ${TARGET_STATUS_NAME} 状态`,
      };
    }
  }

  printLogs(
    `业务逻辑校验通过，将 ${releasePlanItemCode} 事项流转到至 ${TARGET_STATUS_NAME} 状态`
  );

  await apis.requestCoreApi("POST", "/parse/functions/transitionItem", {
    id: releasePlanId,
    destinationStatus: targetStatus?.objectId,
  });

  printLogs(`成功将 ${releasePlanItemCode} 系统上线计划事项流转至目标状态`);

  return {
    success: true,
    code: 200,
    message: "系统/缺陷上线计划状态同步成功",
  };
} catch (error) {
  return {
    code: 999,
    message: error?.message,
    success: false,
  };
}
