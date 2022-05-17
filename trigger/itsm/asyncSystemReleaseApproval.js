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

try {
  const { key: releaseApprovalKey } = body;

  printLogs(
    `系统上线计划 ${releaseApprovalKey} 提交评估，开始向ITSM系统同步数据`
  );

  printLogs(`获取 ${releaseApprovalKey} 系统上线计划数据`);

  const releaseApprovalParse = await apis.getData(false, "Item", {
    key: releaseApprovalKey,
  });

  const releaseApproval = releaseApprovalParse.toJSON();

  printLogs(
    `${releaseApprovalKey} 系统上线计划事项数据查询完成，数据为`,
    releaseApproval
  );

  const {
    ancestors: [
      business_intention_id, // 业务意向ID
      business_requirement_id, // 业务需求ID
    ] = [],
    values: {
      ItemCode: systemReleaseApprovalItemCode, // 事项编号
      Degree_of_urgency, // 紧急程度
      onlinetime, // 上线日期
      system_identification, // 系统标识
      system_manager, // 系统负责人
      editor_story_desc, // 需求描述
      change_scope, // 变更范围
      improtance_degree, // 重要程度
      radio_online_report, // 报备
      involved_application_system, // 涉及系统
      dropdown_production_type, // 投产类型
    } = {},
    objectId: releaseApprovalId,
  } = releaseApproval;

  // 生成申请时间，默认取当天
  const application_date = new Date().getTime();

  // 保存申请时间数据到事项中
  apis.requestCoreApi("PUT", `/parse/api/items/${releaseApprovalId}`, {
    values: { application_date },
  });

  printLogs(`获取 ${releaseApprovalKey} 所属业务意向事项数据`);

  const businessIntentionParse = await apis.getData(false, "Item", {
    objectId: business_intention_id,
  });

  const businessIntention = businessIntentionParse.toJSON();

  printLogs(
    `${releaseApprovalKey} 所属业务意向事项数据查询完毕，数据为`,
    businessIntention
  );

  printLogs(`获取 ${releaseApprovalKey} 系统上线计划所属业务需求事项数据`);

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
    `${releaseApprovalKey} 所属业务需求事项数据查询完毕，数据为`,
    businessRequirement
  );

  printLogs(`查询系统上线计划涉及系统 ${involved_application_system} 相关数据`);

  const systemTypeParse = await apis.getData(false, "ItemType", {
    name: "系统",
  });

  const systemType = systemTypeParse.toJSON();

  const SystemItemQuery = await apis.getParseQuery(false, "Item");

  const systemItemsParse = await SystemItemQuery.equalTo(
    "itemType",
    systemType.objectId
  ) // 系统类型事项
    .containedIn("objectId", involved_application_system) // id为涉及系统引用字段关联的数据
    .findAll({ sessionToken });

  const systemItems = systemItemsParse?.map((system) => system.toJSON());

  printLogs(
    `系统上线计划涉及系统 ${involved_application_system} 详细数据查询完毕，数据为`,
    systemItems
  );

  const ASYNC_DATA_TO_ITSM = {
    // 需要处理的数据
    product_change_type: dropdown_production_type?.join(","), // 投产变更类型
    Degree_of_urgency: Degree_of_urgency?.join(","), // 紧急程度
    change_scope: change_scope?.join(","), // 变更范围
    improtance_degree: improtance_degree?.join(","), // 重要程度
    system_manager: system_manager // 系统负责人,用户类型，先转成用户名，再连接,
      ?.map((user) => user.username)
      ?.join(","),
    demand_leader: demand_leader // 需求牵头人,用户类型，先转成用户名，再连接,
      ?.map((user) => user.username)
      ?.join(","),
    business_intention_number: businessIntention?.key, // 业务意向编号
    editor_story_desc: convertRichText(editor_story_desc), // 需求描述，从富文本转换成文本
    involved_application_system: systemItems?.map(
      (systemItem) => systemItem?.values?.system_identification
    ),
    // 不需要处理直接传递的数据
    item_id: systemReleaseApprovalItemCode, // 事项编号
    onlinetime, // 上线日期
    application_date, // 申请日期
    radio_online_report, // 报备
    system_identification, // 系统标识
    business_requirement_name, // 业务需求标题
    business_requirement_number, // 业务需求编号
  };

  printLogs("向ITSM传递的系统上线计划数据整合完成，数据为", ASYNC_DATA_TO_ITSM);

  printLogs("向ITSM同步系统上线计划数据");

  const asyncResult = await apis.post("/test", ASYNC_DATA_TO_ITSM);

  printLogs("向ITSM同步信息成功，响应信息为", asyncResult);

  return {
    success: true,
    message: "同步成功",
    data: asyncResult,
  };
} catch (error) {
  return error?.message;
}
