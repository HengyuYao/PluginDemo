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

  const itemParseQuery = await apis.getParseQuery(false, "Item");

  const systemProgramApprovalsParse = await itemParseQuery
    .equalTo("itemType", systemProgramApprovalType?.id) // 系统投产变更审批单事项类型
    .containedIn("ancestors", [...programApprovalAncestors, programApprovalId]) // 上线计划申请单挂载在业务需求下
    .findAll({ sessionToken });

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
          key: systemProgramApprovalKey,
          values: {
            Actors, // 当前处理人
            Demand_contact, // 需求联系人
            ItemCode, // 事项编号
            ...usefulValues
          } = {},
        } = systemProgramApproval;

        const {
          change_scope, // 变更范围
          product_change_type, // 投产类型
          changeType, // 变更类型(重要程度),
          online_plan_risk_assessment, // 上线计划申请单(风险评估单)编号
          demand_leader, // 需求牵头人
          system_manager, // 系统负责人
        } = usefulValues;

        // 解析出系统上线计划申请单的事项ID
        const systemReleaseApprovalId = online_plan_risk_assessment[0];

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
          item_id: systemProgramApprovalKey,
          // 导入全部需要的数据，需要处理的数据进行额外覆盖
          ...usefulValues,
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
  return error;
}
