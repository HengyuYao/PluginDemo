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
  const { key: programApprovalKey } = body;

  printLogs(`获取key为 ${programApprovalKey} 的投产变更审批单事项数据`);
  // 获取投产变更审批单事项
  const programApprovalParse = await apis.getData(false, "Item", {
    key: programApprovalKey,
  });

  const programApprovalItem = programApprovalParse.toJSON();

  printLogs("投产变更审批单事项数据获取完毕，数据为", programApprovalItem);

  printLogs(`获取 ${programApprovalKey} 投产变更审批单事项所属业务需求数据`);
  // 获取投产变更审批单事项的父业务需求事项
  const [, businessRequirementId] = programApprovalItem?.ancestors;

  const businessRequirementParse = await apis.getData(false, "Item", {
    objectId: businessRequirementId,
  });

  const businessRequirement = businessRequirementParse.toJSON();

  printLogs("投产变更审批单所属业务需求事项数据获取完毕，数据为", businessRequirement);

  // 获取业务需求关联的系统事项
  const {
    name: businessRequirementName,
  } = businessRequirement;

  // 系统投产变更审批单需要继承自投产变更审批单的数据
  const {
    values: {
      demand_leader, // 需求牵头人
      associated_product_change_apply_number, // 投产变更申请单编号
      application_date, // 申请日期
      date_implementation_date, // 实施日期
      involved_application_system, // 涉及系统
    },
    ancestors: programApprovalAncestors,
    tenant: programApprovalTenant,
    objectId: programApprovalId
  } = programApprovalItem;
  
  printLogs(
    "当前投产变更审批单事项的涉及系统字段数据为",
    involved_application_system
  );

  // printLogs("查询投产变更审批单对应的上线计划申请单事项数据");

  // const releaseApprovalType = await apis.getData(false, "ItemType", {
  //   name: "上线计划申请单",
  // });

  // const releaseApprovalQuery = await apis.getParseQuery(false, "Item");

  // const [releaseApprovalParse] = await releaseApprovalQuery
  //   .equalTo("itemType", releaseApprovalType?.id) // 上线计划申请单事项类型
  //   .containedIn("ancestors", programApprovalAncestors) // 上线计划申请单挂载在业务需求下
  //   .findAll({ sessionToken });

  // const releaseApproval = releaseApprovalParse.toJSON();

  // const {
  //   ancestors: releaseApprovalAncestors, // 上线计划申请单层级
  //   objectId: releaseApprovalId, // 上线计划申请单事项ID
  // } = releaseApproval;

  // printLogs(
  //   "投产变更审批单对应的上线计划申请单数据查询完毕，数据为",
  //   releaseApproval
  // );

  printLogs("查询系统投产变更审批单事项类型");

  // 获取系统投产变更审批单事项类型
  const systemProgramApprovalType = await apis.getData(false, "ItemType", {
    name: "系统投产变更审批单",
  });

  // // 获取系统上线计划申请单事项类型
  // const systemReleaseApprovalType = await apis.getData(false, "ItemType", {
  //   name: "系统上线计划申请单",
  // });

  // 获取到插件信息，用于创建事项
  const myApp = await apis.getData(false, "App", { key: appKey });

  printLogs("生成批量创建系统投产变更审批单事项请求");
  // 生成创建系统投产变更审批单请求
  const createSystemReleaseApprovals = involved_application_system?.map(
    (relateSystemId) => {
      return new Promise(async (resolve, reject) => {
        printLogs(`查询 ${relateSystemId} 系统事项数据`);

        // 获取到系统类型事项数据
        const relateSystemParse = await apis.getData(false, "Item", {
          objectId: relateSystemId,
        });

        const relateSystem = relateSystemParse.toJSON();

        printLogs(
          `${relateSystemId} 系统事项数据查询完成，数据为`,
          relateSystem
        );

        // 解析系统事项中需要的数据
        const {
          system_identification, // 系统标识
          system_manager, // 系统负责人
          bind_system: systemSpaceId, // 绑定空间Id
        } = relateSystem?.values;

        printLogs(`${relateSystemId} 系统事项绑定的空间ID为`, systemSpaceId);

        // printLogs("查询系统投产变更审批单事项对应的系统上线计划申请单事项数据");

        // const systemReleaseApprovalQuery = await apis.getParseQuery(
        //   false,
        //   "Item"
        // );

        // const [systemReleaseApprovalParse] = await systemReleaseApprovalQuery
        //   .equalTo("itemType", systemReleaseApprovalType?.id)
        //   .equalTo("values.system_identification", system_identification) // 相同的系统标识
        //   .containedIn("ancestors", [
        //     ...releaseApprovalAncestors,
        //     releaseApprovalId,
        //   ]) // 系统上线计划申请单的层级
        //   .find({ sessionToken });
        //
        // const systemReleaseApproval = systemReleaseApprovalParse.toJSON();
        //
        // printLogs(
        //   "系统投产变更审批单对应的系统上线计划申请单数据查询完成，数据为",
        //   systemReleaseApproval
        // );

        // 获得事项类型parse对象
        const systemProgramApproval = await apis.getParseObject(false, "Item");

        printLogs("开始整合要创建的系统投产变更单事项数据");

        // 系统投产变更审批单事项的字段值
        const systemProgramApprovalValues = {
          // 继承投产变更审批单的值
          demand_leader, // 需求牵头人
          associated_product_change_apply_number, // 投产变更申请单编号
          application_date, // 申请日期
          date_implementation_date, // 实施日期
          // 继承自系统事项的值
          system_identification, // 系统标识
          system_manager, // 系统负责人
          // 系统投产变更审批单自己的字段
          // online_plan_risk_assessment: [systemReleaseApproval?.objectId], // 系统投产变更审批单对应的系统上线计划申请单编号
          emergency_degree: "标准", // 紧急程度，默认标准
          radio_online_report: "否", // 是否上线报备，默认否
          product_change_type: ["变更"], // 投产变更类型，默认变更
          changeType: ["一般变更"], // 变更类型（重要程度），默认一般变更
          change_scope: ["应用系统"], // 变更范围，默认应用系统
        };

        systemProgramApproval.set({
          tenant: programApprovalTenant, // 沿用父事项的租户
          workspace: {
            __type: "Pointer",
            className: "Workspace",
            objectId: systemSpaceId,
          }, // 创建到对应的空间
          itemType: systemProgramApprovalType, // 事项类型
          // 设置层级关系，在投产变更审批单的下一层
          ancestors: [...programApprovalAncestors, programApprovalId],
          ancestorsCount: 3,
          // 事项名称，由 [事项类型-系统名称]业务需求名称 组成
          name: `[系统投产变更审批单-${relateSystem?.name}]${businessRequirementName}`,
          values: systemProgramApprovalValues,
          createdBy: myApp.toJSON().createdBy,
        });

        printLogs(
          `${systemSpaceId} 空间下需要创建的系统投产变更审批单数据整合完毕，完整数据为`,
          systemProgramApproval
        );

        // 新建系统投产变更审批单
        try {
          printLogs(`开始创建 ${systemSpaceId} 下的系统投产变更审批单事项`);
          await apis.saveItemWithKey(systemProgramApproval);

          printLogs(
            "系统投产变更审批单事项创建成功，创建结果为",
            systemProgramApproval
          );
          resolve(systemProgramApproval);
        } catch (createError) {
          reject(createError);
        }
      });
    }
  );

  printLogs("开始整合不同空间下的系统投产变更审批单事项信息并依次创建");

  await Promise.all(createSystemReleaseApprovals);

  printLogs("所有系统投产变更审批单事项数据创建完成");
} catch (error) {
  return error?.message;
}
