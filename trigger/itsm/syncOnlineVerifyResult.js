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

// 系统上线计划事项类型key
const SYSTEM_ONLINE_APPROVAL_PLAN_ITEM_TYPE_KEY = "system_online_plan_apply";

// ITSM 的环境域名
const ITSM_DOMAIN = global.env.ITSM_DOMAIN;

// ITSM 的Apikey
const ITSM_API_KEY = global.env.ITSM_API_KEY;

try {
  const { key: releasePlanKey } = body;

  printLogs(`${releasePlanKey} 上线计划完成业务验证，向 ITSM 同步验证结果`);

  printLogs(`获取 ${releasePlanKey} 上线计划事项数据`);

  const releasePlanParse = await apis.getData(false, "Item", {
    key: releasePlanKey,
  });

  const releasePlan = releasePlanParse.toJSON();

  printLogs(`${releasePlanKey} 上线计划事项数据查询完成，数据为`, releasePlan);

  const {
    objectId: releasePlanId,
    values: {
      feedback: verify_opinion, // 业务验证意见
      VerifyResult: verify_result, // 验证结果
    } = {},
  } = releasePlan;

  printLogs(`查询 ${releasePlanKey} 上线计划下的系统上线计划数据`);

  const systemReleaseTypeParse = await apis.getData(false, "ItemType", {
    key: SYSTEM_ONLINE_APPROVAL_PLAN_ITEM_TYPE_KEY,
  });

  const systemReleaseType = systemReleaseTypeParse.toJSON();

  printLogs("系统上线计划事项类型数据查询完成，数据为", systemReleaseType);

  // 拿到事项查询方法
  const SystemReleaseQuery = await apis.getParseQuery(false, "Item");

  const systemReleasesParse = await SystemReleaseQuery.equalTo(
    "itemType",
    systemReleaseType?.objectId
  ) // 系统上线计划事项类型
    .containedIn("ancestors", [releasePlanId]) // 在上线计划的下
    .findAll({ sessionToken });

  const systemReleases = systemReleasesParse?.map((systemRelease) =>
    systemRelease.toJSON()
  );

  printLogs(
    `${releasePlanKey} 上线计划下系统上线计划数据查询完毕，列表为`,
    systemReleases
  );

  const COMMON_VERIFY_DATA = {
    verify_opinion,
    verify_result,
  };

  printLogs("依次生成系统上线计划业务验证结果同步请求");

  const SYNC_VERIFY_REQUESTS = systemReleases?.map((systemRelease) => {
    // 事项编号
    const { ItemCode } = systemRelease?.values;

    const SYNC_DATA = {
      item_id: ItemCode,
      ...COMMON_VERIFY_DATA,
    };

    printLogs(
      `系统上线计划 ${systemRelease?.key} 附件列表数据整合完毕，数据为`,
      SYNC_DATA
    );

    return apis.post(
      `${ITSM_DOMAIN}/linksystem/openapi/v1/devops/synVerifyResult?apikey=${ITSM_API_KEY}`,
      ASYNC_ATTACHMENTS
    );
  });

  printLogs('向ITSM批量发送系统上线计划业务验证结果信息');

  const sync_result = await Promise.all(SYNC_VERIFY_REQUESTS);

  return {
    success: true,
    message: "同步成功",
    data: sync_result,
  };
} catch (error) {
  return {
    success: false,
    message: error?.message,
  };
}
