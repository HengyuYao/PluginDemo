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

// ITSM 的环境域名
const ITSM_DOMAIN = global.env.ITSM_DOMAIN;

// ITSM 的Apikey
const ITSM_API_KEY = global.env.ITSM_API_KEY;

try {
  const { key: bugfixPlanKey } = body;

  printLogs(`${bugfixPlanKey} 缺陷上线计划完成业务验证，向 ITSM 同步验证结果`);

  printLogs(`获取 ${bugfixPlanKey} 缺陷上线计划事项数据`);

  const bugfixPlanParse = await apis.getData(false, "Item", {
    key: bugfixPlanKey,
  });

  const bugfixPlan = bugfixPlanParse.toJSON();

  printLogs(
    `${bugfixPlanKey} 缺陷上线计划事项数据查询完成，数据为`,
    bugfixPlan
  );

  const {
    VerifyTime: verify_date, // 验证时间
    feedback: verify_opinion, // 业务验证意见
    yanzhengjieguo: [verify_result], // 验证结果
    Department, // 所属部门
    Verifier, // 验证人员
    ItemCode: bugfixItemNumber,
  } = bugfixPlan?.values;

  const SYNC_VERIFY_DATA = {
    verify_date,
    verify_opinion,
    item_id: bugfixItemNumber,
    verify_result: verify_result === "验证通过",
    verify_depart: Department?.join(","), // 验证部门
    verify_user: Verifier
      ?.map((user) => user.username) // 验证人员
      ?.join(","),
  };

  printLogs(
    `缺陷上线计划 ${bugfixPlanKey} 验证结果数据整合完毕，数据为`,
    SYNC_VERIFY_DATA
  );

  printLogs(`向ITSM发送缺陷上线计划 ${bugfixPlanKey} 业务验证结果信息`);

  const sync_result = await apis.post(
    `${ITSM_DOMAIN}/linksystem/openapi/v1/devops/synVerifyResult?apikey=${ITSM_API_KEY}`,
    SYNC_VERIFY_DATA
  );

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
