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
    item_id: systemProgramApprovalItemCode, // 系统投产变更审批单事项Id
    audit_result, // 审批结果
  } = body;

  printLogs(
    `接收到ITSM同步的 ID 为 ${systemProgramApprovalItemCode} 的系统投产变更审批单事项的审批结果，评估结果为`,
    audit_result
  );

  printLogs(`查询事项 ${systemProgramApprovalItemCode} 对应的数据`);

  const systemProgramApprovalQuery = await apis.getParseQuery(false, "Item");

  const [systemProgramApprovalParse] = await systemProgramApprovalQuery.matches(
    "values.ItemCode",
    systemProgramApprovalItemCode
  );

  const systemProgramApproval = systemProgramApprovalParse.toJSON();

  const { objectId: systemProgramApprovalId } = systemProgramApproval;

  printLogs(
    `事项 ${systemProgramApprovalItemCode} 数据查询完毕，数据为`,
    systemProgramApproval
  );

  // 根据审批结果确定流转到的状态名称
  const targetStatusName = audit_result ? "审批通过" : "审批未通过";

  printLogs(
    `根据审批结果 ${audit_result} 确定流转目标状态为`,
    targetStatusName
  );

  printLogs(`查询 ${targetStatusName} 状态相关数据`);

  // 获取目标状态的相关数据
  const targetStatusParse = await apis.getData(false, "Status", {
    name: targetStatusName,
  });

  const targetStatus = targetStatusParse.toJSON();

  printLogs(`${targetStatusName} 状态数据查询成功，数据为`, targetStatus);

  printLogs(
    `将 ID 为 ${systemProgramApprovalId} 的系统投产变更审批单事项流转到至 ${targetStatusName} 状态`
  );

  await apis.requestCoreApi("POST", "/parse/functions/transitionItem", {
    id: systemProgramApprovalId,
    destinationStatus: targetStatus?.objectId,
  });

  printLogs(
    `成功将 ${systemProgramApprovalId} 系统投产变更审批单事项流转至目标状态`
  );

  return {
    success: true,
    data: null,
    message: "系统投产变更审批单审批结果同步完成",
  };
} catch (error) {
  return error?.message;
}
