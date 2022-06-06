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

// 把富文本转换成字符串
function convertRichText(richText) {
  if (!Array.isArray(richText)) {
    return "";
  }

  return richText.reduce((prev, rich) => {
    // 只转换文本类型
    if (["paragraph", "p"].includes(rich?.type)) {
      // 遍历富文本对象的children，把文本内容取出来，用 \n 连接
      const pureText = rich?.children?.map(({ text }) => text)?.join("\n");
      return prev + pureText;
    }

    return prev;
  }, "");
}

// 投产变更类型在ITSM系统内的枚举
const PRODUCT_TYPE_ITSM_ENUM = {
  投产: "01",
  变更: "02",
};

// 紧急程度在ITSM系统的枚举
const DEGREE_OF_URGENCY_ITSM_ENUM = {
  紧急: "01",
  标准: "02",
};

// 变更类型在ITSM系统的枚举
const CHANGE_SCOPE_ITSM_ENUM = {
  应用系统: "01",
  网络系统: "02",
  主机系统: "03",
  IT基础设施: "04",
  其他: "05",
};

// 重要程度在 ITSM 系统的枚举
const IMPORTANCE_DEGREE_ITSM_ENUM = {
  重要: "01",
  一般: "02",
  缺陷修复: "03",
};

// 是否报备在 ITSM 系统的枚举
const NEED_REPORT_ITSM_ENUM = {
  是: "01",
  否: "02",
};

// ITSM 的环境域名
const ITSM_DOMAIN = global.env.ITSM_DOMAIN;

// ITSM 的Apikey
const ITSM_API_KEY = global.env.ITSM_API_KEY;

// 系统类型事项的objectId
const SYSTEM_ITEM_TYPE_ID = "V0bSddvrdS";

try {
  const { key: bugfixPlanKey } = body;

  printLogs(`缺陷上线计划 ${bugfixPlanKey} 提交评估，开始向ITSM系统同步数据`);

  printLogs(`获取 ${bugfixPlanKey} 缺陷上线计划数据`);

  const bugfixPlanParse = await apis.getData(false, "Item", {
    key: bugfixPlanKey,
  });

  const bugfixPlan = bugfixPlanParse.toJSON();

  printLogs(
    `${bugfixPlanKey} 缺陷上线计划事项数据查询完成，数据为`,
    bugfixPlan
  );

  const {
    ancestors: [
      online_bug_id, // 生产缺陷事项ID
    ] = [],
    workspace: { objectId: workspaceId }, // 缺陷上线计划所属空间
    values: {
      ItemCode: bugfixPlanItemCode, // 事项编号
      Degree_of_urgency, // 紧急程度
      onlinetime, // 上线日期
      system_manager, // 系统负责人
      editor_story_desc, // 需求描述
      change_scope, // 变更范围
      improtance_degree, // 重要程度
      radio_online_report, // 报备
      dropdown_production_type, // 投产类型
    } = {},
    objectId: bugfixPlanId,
  } = bugfixPlan;

  // 生成申请时间，默认取当天
  const application_date = new Date().getTime();

  // 保存申请时间数据到事项中
  apis.requestCoreApi("PUT", `/parse/api/items/${bugfixPlanId}`, {
    values: { application_date },
  });

  printLogs(`获取 ${bugfixPlanKey} 所属生产缺陷事项数据`);

  const onlineBugParse = await apis.getData(false, "Item", {
    objectId: online_bug_id,
  });

  const onlineBug = onlineBugParse.toJSON();

  printLogs(`${bugfixPlanKey} 所属生产缺陷事项数据查询完毕，数据为`, onlineBug);

  const {
    values: {
      ItemCode: online_bug_number, // 缺陷事项编号
    },
    name: online_bug_name, // 缺陷标题
  } = onlineBug;

  printLogs(`查询缺陷上线计划所属空间 ${workspaceId} 对应系统清单事项数据`);

  const SystemItemQuery = await apis.getParseQuery(false, "Item");

  const [systemItemParse] = await SystemItemQuery
    .equalTo("itemType", SYSTEM_ITEM_TYPE_ID) // 系统类型事项
    .equalTo("values.bind_system", workspaceId) // 绑定空间为缺陷所属空间
    .find({ sessionToken });

  const systemItem = systemItemParse.toJSON();

  printLogs(
    `缺陷上线计划涉及系统 ${bugfixPlanKey} 所属空间对应的系统清单事项数据查询完成，数据为`,
    systemItem
  );

  const {
    ItemCode: system_identification, // 系统标识为事项编号
  } = systemItem?.values;

  const SYNC_DATA_TO_ITSM = {
    // 需要处理的数据
    product_change_type:
      PRODUCT_TYPE_ITSM_ENUM[dropdown_production_type?.join(",")], // 投产变更类型
    Degree_of_urgency:
      DEGREE_OF_URGENCY_ITSM_ENUM[Degree_of_urgency?.join(",")], // 紧急程度
    change_scope: CHANGE_SCOPE_ITSM_ENUM[change_scope?.join(",")], // 变更范围
    importance_degree:
      IMPORTANCE_DEGREE_ITSM_ENUM[improtance_degree?.join(",")], // 重要程度
    radio_online_report: NEED_REPORT_ITSM_ENUM[radio_online_report], // 报备
    system_manager: system_manager // 系统负责人,用户类型，先转成用户名，再连接,
      ?.map((user) => user.username)
      ?.join(","),
    editor_story_desc: convertRichText(editor_story_desc), // 需求描述，从富文本转换成文本
    involved_application_system: [system_identification], // 涉及系统，缺陷上线计划只需要传当前系统自身编号
    // 不需要处理直接传递的数据
    item_id: bugfixPlanItemCode, // 事项编号
    onlinetime, // 上线日期
    application_date, // 申请日期
    system_identification, // 系统标识
    business_requirement_name: online_bug_name, // 生产缺陷标题
    business_requirement_number: online_bug_number, // 生产缺陷编号
  };

  printLogs("向ITSM传递的系统上线计划数据整合完成，数据为", SYNC_DATA_TO_ITSM);

  printLogs("向ITSM同步缺陷上线计划数据");

  const sync_result = await apis.post(
    `${ITSM_DOMAIN}/linksystem/openapi/v1/devops/createTicket?apikey=${ITSM_API_KEY}`,
    SYNC_DATA_TO_ITSM
  );

  printLogs("向ITSM同步信息成功，响应结果为", sync_result);

  return {
    success: true,
    message: "同步成功",
    data: sync_result?.data,
  };
} catch (error) {
  return error?.message;
}
