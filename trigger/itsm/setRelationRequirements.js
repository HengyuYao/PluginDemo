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

// 业务需求事项类型key
const BUSINESS_REQUIREMENT_ITEM_TYPE_KEY = 'YWXQ';

// 上线计划事项类型key
const ONLINE_PLAN_ITEM_TYPE_KEY = 'online_plan_apply';

// 【待投产】事项状态id
const WILL_RELEASE_STATUS_ID = "KFHC1wdKm6";

// 【评估通过】事项状态id
const EVALUATE_PASS_STATUS_ID = "fqdDibfUlR";

try {
  const {
    key: releaseApprovalKey, // 投产变更申请单事项 key
  } = body;

  printLogs(
    `接收到 ${releaseApprovalKey} 投产变更申请单的关联需求计算请求，开始处理`
  );

  printLogs(`查询处于【待投产】的业务需求数据`);

  const businessRequirementTypeParse = await apis.getData(false, "ItemType", {
    key: BUSINESS_REQUIREMENT_ITEM_TYPE_KEY,
  });

  const businessRequirementType = businessRequirementTypeParse.toJSON();

  printLogs("业务需求事项类型数据查询完成，数据为", businessRequirementType);

  // 拿到 Item 表的 parse query
  const itemParseQuery = await apis.getParseQuery(false, "Item");

  const requirementsListParse = await itemParseQuery
    .equalTo("itemType", businessRequirementType?.objectId) // 业务需求
    .equalTo("status", WILL_RELEASE_STATUS_ID) // 待投产状态
    .findAll({ sessionToken });

  const requirementsList = requirementsListParse?.map((requirement) =>
    requirement.toJSON()
  );

  printLogs("【待投产】业务需求数据查询完成，列表为", requirementsList);

  printLogs("查询处于【评估通过】状态的上线计划事项列表");

  const systemReleaseTypeParse = await apis.getData(false, "ItemType", {
    key: ONLINE_PLAN_ITEM_TYPE_KEY,
  });

  const systemReleaseType = systemReleaseTypeParse.toJSON();

  printLogs("上线计划事项类型数据查询完成，数据为", businessRequirementType);

  const systemReleasesParse = await itemParseQuery
    .equalTo("itemType", systemReleaseType?.objectId)
    .equalTo("status", EVALUATE_PASS_STATUS_ID) // 评估通过状态
    .findAll({ sessionToken });

  const systemReleases = systemReleasesParse?.map((systemRelease) =>
    systemRelease.toJSON()
  );

  printLogs("【评估通过】状态的上线计划数据查询完成，列表为", systemReleases);

  printLogs("开始计算业务需求与上线计划的交集，过滤出最终的业务需求Id");

  // 拿到符合条件的业务需求的 objectId 数组，并查找符合条件的上线计划中有没有对应业务需求的子事项
  const requirementIdsList = requirementsList
    ?.map((requirement) => requirement?.objectId)
    ?.filter((requirementId) => {
      // 上线计划的 ancestors 包含当前需求 ID 时，表示上线计划是业务需求的子事项
      return systemReleases?.some((systemRelease) =>
        systemRelease?.ancestors?.includes(requirementId)
      );
    });

  printLogs("计算完成，最终符合条件的业务需求数据ID为", requirementIdsList);

  printLogs(`开始更新 ${releaseApprovalKey} 投产变更申请单关联业务需求字段`);

  const releaseApprovalParse = await apis.getData(false, "Item", {
    key: releaseApprovalKey,
  });

  const result = await apis.requestCoreApi(
    "PUT",
    `/parse/api/items/${releaseApprovalParse.id}`,
    {
      "values.associated_business_requirement": requirementIdsList,
    }
  );

  printLogs(
    `${releaseApprovalKey} 投产变更申请单关联业务需求字段更新成功，结果为`,
    result
  );
} catch (error) {
  return {
    success: false,
    message: error?.message,
  };
}
