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
  const { objectId: releaseApprovalId } = body;

  printLogs(
    `系统上线计划申请单 ${releaseApprovalId} 创建完成，开始向ITSM系统同步数据`
  );

  printLogs(`获取 ${releaseApprovalId} 系统上线计划申请单数据`);

  const releaseApprovalParse = await apis.getData(false, "Item", {
    objectId: releaseApprovalId,
  });

  const releaseApproval = releaseApprovalParse.toJSON();

  printLogs(
    `${releaseApprovalId} 系统上线计划申请单事项数据查询完成，数据为`,
    releaseApproval
  );

  const {
    key: item_id, // 传递key给ITSM平台
    ancestors: [
      business_intention_id, // 业务意向ID
      business_requirement_id, // 业务需求ID
    ] = [],
    values: {
      emergency_degree, // 紧急程度
      onlinetime, // 上线日期
      application_date, // 申请日期
      changeType, // 变更类型
      business_requirement_number, // 业务需求编号
      system_identification, // 系统标识
      system_manager, // 系统负责人
      requirement_content, // 需求内容
    } = {},
  } = releaseApproval;

  printLogs(`获取 ${releaseApprovalId} 所属业务意向事项数据`);

  const businessIntentionParse = await apis.getData(false, "Item", {
    objectId: business_intention_id,
  });

  const businessIntention = businessIntentionParse.toJSON();

  printLogs(
    `${releaseApprovalId} 所属业务意向事项数据查询完毕，数据为`,
    businessIntention
  );

  printLogs(`获取 ${releaseApprovalId} 所属业务需求事项数据`);

  const businessRequirementParse = await apis.getData(false, "Item", {
    objectId: business_requirement_id,
  });

  const businessRequirement = businessRequirementParse.toJSON();

  const { name: business_requirement_name } = businessRequirement;

  printLogs(
    `${releaseApprovalId} 所属业务需求事项数据查询完毕，数据为`,
    businessRequirement
  );

  const ASYNC_DATA_TO_ITSM = {
    // 需要处理的数据
    changeType: changeType?.join(','), // 变更类型
    system_manager: system_manager // 系统负责人,用户类型，先转成用户名，再连接,
      ?.map((user) => user.username)
      ?.join(","),
    business_intention_id: businessIntention?.key, // 业务意向编号
    // 不需要处理直接传递的数据
    item_id, // 事项编号
    onlinetime, // 上线日期
    application_date, // 申请日期
    emergency_degree, // 紧急程度
    requirement_content, // 需求内容
    system_identification, // 系统标识
    business_requirement_name, // 业务需求标题
    business_requirement_number, // 业务需求编号
  }

  printLogs("向ITSM传递的系统上线计划申请单数据整合完成，数据为", ASYNC_DATA_TO_ITSM);

  printLogs("向ITSM同步系统投产变更审批单数据");

  const asyncResult = await apis.post("/test", ASYNC_DATA_TO_ITSM);

  printLogs("向ITSM同步信息成功，相应结果为", asyncResult);

  return {
    success: true,
    message: "同步成功",
    data: asyncResult,
  };
} catch (error) {
  return error;
}
