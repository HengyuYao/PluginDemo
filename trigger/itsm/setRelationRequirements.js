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

try {
  const {
    key: releaseApprovalKey, // 投产变更申请单事项 key
  } = body;

  printLogs(
    `接收到 ${releaseApprovalKey} 投产变更申请单的关联需求计算请求，开始处理`
  );

  printLogs(`查询处于【UAT测试通过】的业务需求数据`);

  const requirementStatusParse = await apis.getData(false, "Status", {
    name: "UAT测试通过",
  });

  const requirementStatus = requirementStatusParse.toJSON();

  printLogs(`【UAT测试通过】状态数据查询完成，数据为`, requirementStatus);

  const businessRequirementTypeParse = await apis.getData(false, "ItemType", {
    name: "业务需求",
  });

  const businessRequirementType = businessRequirementTypeParse.toJSON();

  printLogs("业务需求事项类型数据查询完成，数据为", businessRequirementType);

  // 拿到 Item 表的 parse query
  const itemParseQuery = await apis.getParseQuery(false, "Item");

  const requirementsListParse = await itemParseQuery
    .equalTo("itemType", businessRequirementType?.objectId)
    .equalTo("status", requirementStatus?.objectId)
    .findAll({ sessionToken });

  const requirementsList = requirementsListParse?.map((requirement) =>
    requirement.toJSON()
  );

  printLogs("【UAT测试通过】业务需求数据查询完成，列表为", requirementsList);

  printLogs("查询处于【评估通过】状态的上线计划事项列表");

  const systemReleaseStatusParse = await apis.getData(false, "Status", {
    name: "评估通过",
  });

  const systemReleaseStatus = systemReleaseStatusParse.toJSON();

  printLogs(`【评估】状态数据查询完成，数据为`, systemReleaseStatus);

  const systemReleaseTypeParse = await apis.getData(false, "ItemType", {
    name: "业务需求",
  });

  const systemReleaseType = systemReleaseTypeParse.toJSON();

  printLogs("上线计划事项类型数据查询完成，数据为", businessRequirementType);

  const systemReleasesParse = await itemParseQuery
    .equalTo("itemType", systemReleaseType?.objectId)
    .equalTo("status", systemReleaseStatus?.objectId)
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
} catch (error) {
  return {
    success: false,
    message: error?.message,
  };
}
