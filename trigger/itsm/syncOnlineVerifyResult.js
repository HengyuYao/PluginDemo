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

// 系统上线计划事项类型objectId
const SYSTEM_RELEASE_PLAN_ITEM_TYPE_ID = "SglszQZ2nt";

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
      VerifyTime: verify_date, // 验证时间
      feedback: verify_opinion, // 业务验证意见
      VeriyResult: [verify_result], // 验证结果
      Department, // 所属部门
      Verifier, // 验证人员
    } = {},
  } = releasePlan;

  printLogs(`查询 ${releasePlanKey} 上线计划下的系统上线计划数据`);

  // 拿到事项查询方法
  const SystemReleaseQuery = await apis.getParseQuery(false, "Item");

  const systemReleasesParse = await SystemReleaseQuery
    .equalTo("itemType", SYSTEM_RELEASE_PLAN_ITEM_TYPE_ID) // 系统上线计划事项类型
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
    verify_date,
    verify_result: verify_result === "验证通过",
    verify_opinion,
    verify_depart: Department?.join(","), // 验证部门
    verify_user: Verifier?.map((user) => user.username) // 验证人员
      ?.join(","),
  };

  printLogs("依次生成系统上线计划业务验证结果同步请求");

  const SYNC_VERIFY_REQUESTS = systemReleases?.map((systemRelease) => {
    return new Promise(async (resolve) => {
      // 事项编号
      const { ItemCode } = systemRelease?.values;

      const SYNC_VERIFY_DATA = {
        item_id: ItemCode,
        ...COMMON_VERIFY_DATA,
      };

      printLogs(
        `系统上线计划 ${systemRelease?.key} 审批结果数据整合完毕，数据为`,
        SYNC_VERIFY_DATA
      );

      const result = await apis.post(
        `${ITSM_DOMAIN}/linksystem/openapi/v1/devops/synVerifyResult?apikey=${ITSM_API_KEY}`,
        SYNC_VERIFY_DATA
      );

      resolve({
        ...result?.data,
        item_id: ItemCode,
      });
    });
  });

  printLogs("向ITSM批量发送系统上线计划业务验证结果信息");

  const sync_result = await Promise.all(SYNC_VERIFY_REQUESTS);

  return {
    success: true,
    message: "同步成功",
    data: sync_result?.data,
  };
} catch (error) {
  return {
    success: false,
    message: error?.message,
  };
}
