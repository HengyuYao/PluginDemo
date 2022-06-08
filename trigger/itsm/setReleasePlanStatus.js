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

// 【系统上线计划】事项类型objectId
const SYSTEM_RELEASE_PLAN_ITEM_TYPE_ID = "SglszQZ2nt";

// 【上线成功】事项状态ID
const RELEASE_SUCCESS_STATUS_ID = "2tsuAN31Nu";

// 【业务验证】事项状态ID
const BUSINESS_VERIFY_STATUS_ID = "7yh7PB7MZ4";

// 【人工确认】事项状态ID
const MANUAL_CONFIRMATION_STATUS_ID = "VBUYSzBYLJ";

try {
  // 上线计划事项key与objectId
  const { key: releasePlanKey, objectId: releasePlanObjectId } = body;

  printLogs(
    `上线计划 ${releasePlanKey} 下所有系统上线计划均流转至 上线成功/取消/回退 状态，开始计算上线计划流转目标状态`
  );

  printLogs(`查询 ${releasePlanKey} 上线计划下系统上线计划列表`);

  const ItemParseQuery = await apis.getParseQuery(false, "Item");

  const SystemReleasePlansParse = await ItemParseQuery
    .equalTo("itemType", SYSTEM_RELEASE_PLAN_ITEM_TYPE_ID) // 系统上线计划事项类型
    .containedIn("ancestors", [releasePlanObjectId]) // 父事项为当前上线计划
    .include(["status"]) // 拿到状态
    .findAll({ sessionToken });

  const SystemReleasePlans = SystemReleasePlansParse?.map(
    (SystemReleasePlanParse) => SystemReleasePlanParse.toJSON()
  );

  printLogs(
    `上线计划 ${releasePlanKey} 下系统上线计划列表查询完毕，数据为`,
    SystemReleasePlans
  );

  printLogs("获取所有系统上线计划当前的状态清单");

  // 声明用于存储当前系统上线计划状态id与名字的变量
  const SYSTEM_RELEASE_STATUS_MAP = {};

  // 遍历系统上线计划，将其保存到状态变量中
  SystemReleasePlans?.forEach((systemReleasePlan) => {
    const { name: statusName, objectId: statusId } = systemReleasePlan?.status;

    SYSTEM_RELEASE_STATUS_MAP[statusId] = statusName;
  });

  // 系统上线计划的状态长度不为 1，代表状态不一致，流转上线计划至【人工确认】状态
  if (Object.keys(SYSTEM_RELEASE_STATUS_MAP).length !== 1) {
    printLogs(
      `上线计划 ${releasePlanKey} 下系统上线计划清单上线结果状态不一致，流转至【人工确认】状态`
    );

    await apis.requestCoreApi("POST", "/parse/functions/transitionItem", {
      id: releasePlanObjectId,
      destinationStatus: MANUAL_CONFIRMATION_STATUS_ID,
    });

    return {
      success: true,
      message: "成功将上线计划流转至【人工确认】状态",
    };
  }

  // 所有系统上线计划最终状态一致，拿到状态 ID 和 名称
  const [[CURRENT_STATUS_ID, CURRENT_STATUS_NAME]] = Object.entries(
    SYSTEM_RELEASE_STATUS_MAP
  );

  // 是否全部为上线成功
  const isReleaseSuccess = CURRENT_STATUS_ID === RELEASE_SUCCESS_STATUS_ID;

  /**
   * 计算上线计划的目标状态
   *   - 当系统上线计划均为【上线成功】状态时，将其流转至【业务验证】状态
   *   - 当为其他状态（上线取消/上线回退/关闭）时，将上线计划也流转至对应状态
   */
  const destinationStatusId = isReleaseSuccess
    ? BUSINESS_VERIFY_STATUS_ID
    : CURRENT_STATUS_ID;

  const destinationStatusName = isReleaseSuccess
    ? "业务验证"
    : CURRENT_STATUS_NAME;

  printLogs(
    `上线计划 ${releasePlanKey} 下所有系统上线计划状态均为 ${CURRENT_STATUS_NAME}，将上线计划流转至 ${destinationStatusName} 状态`
  );

  await apis.requestCoreApi("POST", "/parse/functions/transitionItem", {
    id: releasePlanObjectId,
    destinationStatus: destinationStatusId,
  });

  return {
    success: true,
    message: `成功将上线计划流转至 ${destinationStatusName} 状态`,
  };
} catch (error) {
  return {
    success: false,
    message: error?.message,
  };
}
