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
    item_id: systemReleaseApprovalItemCode, // 系统上线计划申请单事项Id
    evaluate_result, // 评估结果，通过/不通过
    whether_compliance_regulations, // 数据是否符合需求
    risk_assessment_content, // 风险评估内容
    evaluation_files, // ITSM评估的附件
  } = body;

  printLogs(
    `接收到ITSM同步的 ID 为 ${systemReleaseApprovalItemCode} 的系统上线计划申请单事项的审批结果，评估结果为`,
    evaluate_result
  );

  printLogs(`查询事项 ${systemReleaseApprovalItemCode} 对应的数据`);

  const systemReleaseApprovalQuery = await apis.getParseQuery(false, "Item");

  const [systemReleaseApprovalParse] = await systemReleaseApprovalQuery.matches(
    "values.ItemCode",
    systemReleaseApprovalItemCode
  );

  const systemReleaseApproval = systemReleaseApprovalParse.toJSON();

  const { objectId: systemReleaseApprovalId } = systemReleaseApproval;

  printLogs(
    `事项 ${systemReleaseApprovalItemCode} 数据查询完毕，数据为`,
    systemReleaseApproval
  );

  // 根据审批结果确定流转到的状态名称
  const targetStatusName = evaluate_result ? "评估通过" : "评估未通过";

  printLogs(
    `根据审批结果 ${evaluate_result} 确定流转目标状态为`,
    targetStatusName
  );

  printLogs(`查询 ${targetStatusName} 状态相关数据`);

  // 获取目标状态的相关数据
  const targetStatusParse = await apis.getData(false, "Status", {
    name: targetStatusName,
  });

  const targetStatus = targetStatusParse.toJSON();

  printLogs(`${targetStatusName} 状态数据查询成功，数据为`, targetStatus);

  printLogs("将ITSM评估结果中附件保存到事项中");

  printLogs(
    "将评估结果中附件信息传递给自动化处理并保存到事项中，保存的附件列表为",
    evaluation_files
  );

  apis.post("http://gitee-proxima-atm:5678/webhook/sync-file-to-item", {
    itemId: systemReleaseApprovalId, // 系统上线计划申请单事项ID
    fieldKey: "evaluation_related_vicinity", // 系统上线计划申请单中附件字段
    files: evaluation_files, // 评估结果中的附件列表
  });

  printLogs("将ITSM评估的相关信息保存到事项中");

  await apis.requestCoreApi(
    "PUT",
    `/parse/api/items/${systemReleaseApprovalId}`,
    {
      values: {
        risk_assessment_content, // 风险评估内容
        whether_compliance_regulations: [whether_compliance_regulations], // 本次投产变更及数据是否符合相关规定
      },
    }
  );

  printLogs(
    `将ID为 ${systemReleaseApprovalId} 的系统上线计划申请单事项流转到至 ${targetStatusName} 状态`
  );

  await apis.requestCoreApi("POST", "/parse/functions/transitionItem", {
    id: systemReleaseApprovalId,
    destinationStatus: targetStatus?.objectId,
  });

  printLogs(
    `成功将 ${systemReleaseApprovalId} 系统上线计划申请单事项流转至目标状态`
  );

  return {
    success: true,
    data: null,
    message: "系统上线计划申请单审批结果同步完成",
  };
} catch (error) {
  return error?.message;
}
