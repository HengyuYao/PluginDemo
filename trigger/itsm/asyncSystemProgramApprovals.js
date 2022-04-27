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
  const { objectId: programApprovalId } = body;

  printLogs(
    `投产变更审批单 ${programApprovalId} 内部审批完成，开始向ITSM系统同步数据`
  );

  printLogs(`获取 ${programApprovalId} 投产变更审批单事项数据`);

  const programApprovalParse = await apis.getData(false, "Item", {
    objectId: programApprovalId,
  });

  const programApproval = programApprovalParse.toJSON();

  printLogs(
    `${programApprovalId} 投产变更审批单事项数据查询完成，数据为`,
    programApproval
  );

  const {
    ancestors: programApprovalAncestors,
    values: {
      associated_product_change_apply_number: programApplyKey, // 关联的投产变更申请单编号
    } = {},
  } = programApproval;

  printLogs(
    `${programApprovalId} 关联的投产变更申请单编号为 ${programApplyKey}`
  );

  printLogs(`获取 ${programApplyKey} 投产变更申请单事项数据`);

  const programApplyParse = await apis.getData(false, "Item", {
    key: programApplyKey,
  });

  const programApply = programApplyParse.toJSON();

  printLogs(
    `${programApplyKey} 投产变更申请单数据查询完毕，数据为`,
    programApply
  );

  const {
    values: {
      product_change_apply_files, // 投产变更申请单附件
      whether_part_online, // 是否部分上线
      approval_number: part_online_approval_number, // 审批编号字段，部分上线审批单编号
      dropdown_involved_application_system, // 涉及应用系统
    } = {},
  } = programApply;

  // 处理附件信息，只传递有用数据
  const approval_files = product_change_apply_files?.map(({ url, name }) => ({
    url,
    name,
  }));

  printLogs(
    `查询投产变更审批单 ${programApprovalId} 下的系统投产变更审批单数据`
  );

  // 查询系统投产变更审批单事项类型数据
  const systemProgramApprovalType = await apis.getData(false, "ItemType", {
    name: "系统投产变更审批单",
  });

  // 查询审批中状态数据
  const inAuditStatusParse = await apis.getData(false, 'Status', { name: '审批中' });

  const itemParseQuery = await apis.getParseQuery(false, "Item");

  const systemProgramApprovalsParse = await itemParseQuery
    .equalTo("itemType", systemProgramApprovalType?.id) // 系统投产变更审批单事项类型
    .equalTo('status', inAuditStatusParse?.id) // 审批中状态
    .containedIn("ancestors", [...programApprovalAncestors, programApprovalId]) // 上线计划申请单挂载在业务需求下
    .findAll({ sessionToken });

  if (!systemProgramApprovalsParse?.length) {
    throw new Error('没有待审批的投产变更审批单事项');
  }

  const systemProgramApprovals = systemProgramApprovalsParse?.map(
    (systemProgramApprovalParse) => systemProgramApprovalParse.toJSON()
  );

  printLogs(
    `投产变更审批单 ${programApprovalId} 下系统投产变更审批单数据查询完毕，列表为`,
    systemProgramApprovals
  );

  printLogs("整合向ITSM传递的系统投产变更审批单数据");

  const systemProgramApprovalRequests = systemProgramApprovals?.map(
    (systemProgramApproval) => {
      return new Promise(async (resolve) => {
        const {
          values: {
            change_scope, // 变更范围
            product_change_type, // 投产类型
            changeType, // 变更类型(重要程度),
            online_plan_risk_assessment, // 上线计划申请单(风险评估单)编号
            demand_leader, // 需求牵头人
            system_manager, // 系统负责人
            ItemCode: systemProgramApprovalItemCode
          } = {},
        } = systemProgramApproval;

        // 解析出系统上线计划申请单的事项ID
        const systemReleaseApprovalId = online_plan_risk_assessment?.join(',');

        printLogs(`查询系统上线计划申请单 ${systemReleaseApprovalId} 的数据`);

        const systemReleaseApprovalParse = await apis.getData(false, "Item", {
          objectId: systemReleaseApprovalId,
        });

        const systemReleaseApproval = systemReleaseApprovalParse.toJSON();

        printLogs(
          `系统上线计划申请单 ${systemReleaseApprovalId} 数据查询完毕，数据为`,
          systemReleaseApproval
        );

        resolve({
          item_id: systemProgramApprovalItemCode,
          // 不要处理的数据
          whether_part_online, // 是否部分上线
          part_online_approval_number, // 部分上线申请单编号
          dropdown_involved_application_system, // 涉及应用系统
          // 需要处理的数据，一般都为数组类型，只取第一个，为了方便，直接使用join连接
          changeType: changeType?.join(","),
          change_scope: change_scope?.join(","),
          product_change_type: product_change_type?.join(","),
          demand_leader: demand_leader?.map((user) => user.username)?.join(","), // 用户类型，先转成用户名，再连接
          system_manager: system_manager
            ?.map((user) => user.username)
            ?.join(","), // 用户类型，先转成用户名，再连接
          online_plan_risk_assessment: systemReleaseApproval?.key, // 系统上线计划申请单的key
        });
      });
    }
  );

  const approval_items = await Promise.all(systemProgramApprovalRequests);

  printLogs(`系统投产变更审批单数据整合完成，结果为`, approval_items);

  // 向ITSM传递的数据
  const ASYNC_DATA_TO_ITSM = {
    approval_files,
    approval_items,
  };

  printLogs("向ITSM传递数据全部整合完成，数据为", ASYNC_DATA_TO_ITSM);

  printLogs("向ITSM同步系统投产变更审批单数据");

  const asyncResult = await apis.post("/test", ASYNC_DATA_TO_ITSM);

  printLogs("向ITSM同步信息成功，相应结果为", asyncResult);

  return {
    success: true,
    message: "同步成功",
    data: asyncResult,
  };
} catch (error) {
  return error?.message;
}
