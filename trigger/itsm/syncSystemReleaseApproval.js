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
  const { key: systemReleaseApprovalKey } = body;

  printLogs(
    `系统上线计划 ${systemReleaseApprovalKey} 提交评估，开始向ITSM系统同步数据`
  );

  printLogs(`获取 ${systemReleaseApprovalKey} 系统上线计划数据`);

  const systemReleaseApprovalParse = await apis.getData(false, "Item", {
    key: systemReleaseApprovalKey,
  });

  const systemReleaseApproval = systemReleaseApprovalParse.toJSON();

  printLogs(
    `${systemReleaseApprovalKey} 系统上线计划事项数据查询完成，数据为`,
    systemReleaseApproval
  );

  const {
    ancestors: [
      business_intention_id, // 业务意向ID
      business_requirement_id, // 业务需求ID
      release_approval_id, // 上线计划ID
    ] = [],
    values: {
      ItemCode: systemReleaseApprovalItemCode, // 事项编号
      Degree_of_urgency, // 紧急程度
      onlinetime, // 上线日期
      system_manager, // 系统负责人
      editor_story_desc, // 需求描述
      change_scope, // 变更范围
      improtance_degree, // 重要程度
      radio_online_report, // 报备
      dropdown_production_type, // 投产类型
      suoshuxitong, // 所属系统
    } = {},
    objectId: systemReleaseApprovalId,
  } = systemReleaseApproval;

  // 生成申请时间，默认取当天
  const application_date = new Date().getTime();

  // 保存申请时间数据到事项中
  apis.requestCoreApi("PUT", `/parse/api/items/${systemReleaseApprovalId}/quickEdit`, {
    values: { application_date },
  });

  printLogs(`获取 ${systemReleaseApprovalKey} 所属业务意向事项数据`);

  // 获取到系统类型事项数据
  const relateSystemParse = await apis.getData(false, "Item", {
    objectId: suoshuxitong[0],
  });

  const relateSystem = relateSystemParse.toJSON();

  printLogs(
    `${suoshuxitong[0]} 系统事项数据查询完成，数据为`,
    relateSystem
  );

  // 解析系统事项中需要的数据
  const {
    values: {
      ItemCode: system_identification, // 事项编号 - 系统标识
    },
  } = relateSystem;

  const businessIntentionParse = await apis.getData(false, "Item", {
    objectId: business_intention_id,
  });

  const businessIntention = businessIntentionParse.toJSON();

  const { ItemCode: business_intention_number } = businessIntention?.values;

  printLogs(
    `${systemReleaseApprovalKey} 所属业务意向事项数据查询完毕，数据为`,
    businessIntention
  );

  printLogs(`获取 ${systemReleaseApprovalKey} 所属业务需求事项数据`);

  const businessRequirementParse = await apis.getData(false, "Item", {
    objectId: business_requirement_id,
  });

  const businessRequirement = businessRequirementParse.toJSON();

  const {
    name: business_requirement_name, // 业务需求事项名称
    values: {
      ItemCode: business_requirement_number, // 业务需求事项编号
      demand_leader, // 需求牵头人
    },
  } = businessRequirement;

  printLogs(
    `${systemReleaseApprovalKey} 所属业务需求事项数据查询完毕，数据为`,
    businessRequirement
  );

  printLogs(`获取 ${systemReleaseApprovalKey} 所属上线计划事项数据`);

  const releaseApprovalParse = await apis.getData(false, "Item", {
    objectId: release_approval_id,
  });

  const releaseApproval = releaseApprovalParse.toJSON();

  // 涉及系统
  const { shejixitong, r_remote_field_user, r_remote_field_dep } = releaseApproval?.values;

  printLogs(
    `${systemReleaseApprovalKey} 所属上线计划事项数据查询完毕，数据为`,
    releaseApproval
  );

  printLogs(`查询上线计划涉及系统 ${shejixitong} 相关数据`);

  const SystemItemQuery = await apis.getParseQuery(false, "Item");

  const systemItemsParse = await SystemItemQuery
    .equalTo("itemType", SYSTEM_ITEM_TYPE_ID) // 系统类型事项
    .containedIn("objectId", shejixitong) // id为涉及系统引用字段关联的数据
    .findAll({ sessionToken });

  const systemItems = systemItemsParse?.map((system) => system.toJSON());

  printLogs(
    `系统上线计划涉及系统 ${shejixitong} 详细数据查询完毕，数据为`,
    systemItems
  );

  printLogs(`查询上线计划提出部门 ${r_remote_field_dep} 相关数据`);

  const DepartmentQuery = await apis.getParseQuery(false, "Group");

  const DepartmentsParse = await DepartmentQuery
    .containedIn("objectId", r_remote_field_dep) // id为涉及系统引用字段关联的数据
    .findAll({ sessionToken });

  const departments = DepartmentsParse?.map((system) => system.toJSON());

  printLogs(
    `系统上线计划提出部门 ${r_remote_field_dep} 详细数据查询完毕，数据为`,
    departments
  );

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
    demand_leader: demand_leader // 需求牵头人,用户类型，先转成用户名，再连接,
      ?.map((user) => user.username)
      ?.join(","),
    editor_story_desc: convertRichText(editor_story_desc), // 需求描述，从富文本转换成文本
    involved_application_system: systemItems?.map(
      (systemItem) => systemItem?.values?.ItemCode // 事项编号为系统标识
    ),
    // 不需要处理直接传递的数据
    item_id: systemReleaseApprovalItemCode, // 事项编号
    onlinetime, // 上线日期
    application_date, // 申请日期
    system_identification, // 系统标识
    business_intention_number, // 业务意向编号
    business_requirement_name, // 业务需求标题
    business_requirement_number, // 业务需求编号
    demand_proponent: r_remote_field_user
      ?.map((user) => user.username)
      ?.join(","), // 提出人
    demand_department: departments
      ?.map(group => group.name)
      ?.join(","), // 提出部门
  };

  printLogs(
    "向ITSM传递的系统上线计划数据整合完成，数据为",
    SYNC_DATA_TO_ITSM
  );

  printLogs("向ITSM同步系统上线计划数据");

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
