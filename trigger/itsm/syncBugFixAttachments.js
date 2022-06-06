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
const SYSTEM_ONLINE_APPROVAL_PLAN_ITEM_TYPE_ID = "SglszQZ2nt";

// 系统上线计划 - 投产及变更实施方案
const EXECUTE_SOLUTION = "EXECUTE_SOLUTION";

// 系统上线计划 - 其他附件
const OTHER_ATTACHMENT = "OTHER_ATTACHMENT";

const ATTACHMENT_FILE_CODE_ENUM = {
  [EXECUTE_SOLUTION]: 0, // 投产及变更实施方案
  [OTHER_ATTACHMENT]: 9, // 其他附件
};

// ITSM 的环境域名
const ITSM_DOMAIN = global.env.ITSM_DOMAIN;

// ITSM 的Apikey
const ITSM_API_KEY = global.env.ITSM_API_KEY;

// 把 proxima 的附件格式转换成约定格式
function convertFieldToArray(attachments, ATTACHMENT_TYPE) {
  if (!attachments?.length) {
    return [];
  }

  const type = ATTACHMENT_FILE_CODE_ENUM[ATTACHMENT_TYPE];

  // 只取所需字段
  return attachments?.map(({ name, url }) => ({ name, url, type }));
}

try {
  const { key: bugfixPlanKey } = body;

  printLogs(
    `缺陷上线计划 ${bugfixPlanKey} 附件上传完毕，开始向ITSM系统同步附件列表`
  );

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
    values: {
      ItemCode: bugfixPlanItemCode, // 缺陷上线计划事项编号
      execute_solution_atachment, // 实施方案附件
      qtfj, // 其它附件
    },
  } = bugfixPlan;

  const SYNC_ATTACHMENT_DATA = {
    item_id: bugfixPlanItemCode,
    relation_files: [
      // 投产及变更实施方案转换值
      ...convertFieldToArray(execute_solution_atachment, EXECUTE_SOLUTION),
      // 其他附件
      ...convertFieldToArray(qtfj, OTHER_ATTACHMENT),
    ],
  };

  printLogs(
    `缺陷上线计划 ${bugfixPlanKey} 附件列表数据整合完毕，数据为`,
    SYNC_ATTACHMENT_DATA
  );

  printLogs("向ITSM发送缺陷上线计划附件列表请求");

  const sync_result = await apis.post(
    `${ITSM_DOMAIN}/linksystem/openapi/v1/devops/synAttachFileInfo?apikey=${ITSM_API_KEY}`,
    SYNC_ATTACHMENT_DATA
  );

  return {
    success: true,
    message: "同步成功",
    data: sync_result?.data,
  };
} catch (error) {
  return error?.message;
}
