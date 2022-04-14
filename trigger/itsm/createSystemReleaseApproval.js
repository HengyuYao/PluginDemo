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

  printLogs(`获取Id为 ${releaseApprovalId} 的上线计划申请单事项数据`);
  // 获取上线计划申请单事项
  const releaseApprovalParse = await apis.getData(false, "Item", {
    objectId: releaseApprovalId,
  });

  const releaseApprovalItem = releaseApprovalParse.toJSON();

  printLogs("上线计划申请单事项数据获取完毕");

  printLogs(`获取 ${releaseApprovalId} 上线计划申请单事项所属业务需求数据`);
  // 获取上线计划申请单事项的父业务需求事项
  const [, businessRequirementId] = releaseApprovalItem?.ancestors;

  const businessRequirementParse = await apis.getData(false, "Item", {
    objectId: businessRequirementId,
  });

  const businessRequirement = businessRequirementParse.toJSON();

  printLogs("上线计划申请单所属业务需求事项数据获取完毕");

  // 获取业务需求关联的系统事项
  const {
    values: { involved_application_system = [] } = {},
    name: business_requirement_name,
  } = businessRequirement;

  printLogs(
    "当前业务需求事项配置的涉及系统字段数据为",
    involved_application_system
  );

  // 系统上线计划申请单需要继承自上线计划申请单的数据
  const {
    emergency_degree, // 紧急程度
    requirement_content, // 需求内容
    onlinetime, // 上线日期
    application_date, // 申请日期
    changeType, // 变更类型
    business_requirement_number, // 业务需求编号
  } = releaseApprovalItem?.values ?? {};

  printLogs("查询系统上线计划申请单事项类型");
  // 获取系统上线计划申请单事项类型
  const systemReleaseApprovalType = await apis.getData(false, "ItemType", {
    name: "系统上线计划申请单",
  });

  // 获取到插件信息，用于创建事项
  const myApp = await apis.getData(false, "App", { key: appKey });

  printLogs("生成批量创建系统上线计划申请单事项请求");

  // 生成创建系统上线计划申请单请求
  const createSystemReleaseApprovalRequests = involved_application_system?.map(
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

        // 获得事项类型parse对象
        const systemReleaseApproval = await apis.getParseObject(false, "Item");

        printLogs("开始整合要创建的系统投产变更单事项数据");

        // 系统上线计划申请单事项的字段值
        const systemReleaseApprovalValues = {
          // 继承业务需求的标题
          business_requirement_name,
          // 继承上线计划申请单的值
          emergency_degree, // 紧急程度
          requirement_content, // 需求内容
          onlinetime, // 上线日期
          application_date, // 申请日期
          changeType, // 变更类型
          business_requirement_number, // 业务需求标题
          // 继承自系统事项的值
          system_identification, // 系统标识
          system_manager, // 系统负责人
        };

        systemReleaseApproval.set({
          tenant: releaseApprovalItem?.tenant, // 沿用父事项的租户
          workspace: {
            __type: "Pointer",
            className: "Workspace",
            objectId: systemSpaceId,
          }, // 创建到对应的空间
          itemType: systemReleaseApprovalType, // 事项类型
          // 设置层级关系，在上线计划申请单的下一层
          ancestors: [...releaseApprovalItem?.ancestors, releaseApprovalId],
          ancestorsCount: 3,
          // 事项名称，由系统名称-上线计划申请单名称组成
          name: `${relateSystem?.name}-${releaseApprovalItem?.name}`,
          values: systemReleaseApprovalValues,
          createdBy: myApp.toJSON().createdBy,
        });

        printLogs(
          `${systemSpaceId} 空间下需要创建的系统上线计划申请单数据整合完毕，完整数据为`,
          systemReleaseApproval
        );

        // 新建系统上线计划申请单
        try {
          printLogs(`开始创建 ${systemSpaceId} 下的系统上线计划申请单事项`);

          const createResultParse = await apis.saveItemWithKey(
            systemReleaseApproval
          );

          const createResult = createResultParse.toJSON();

          printLogs("系统上线计划申请单事项创建成功，创建结果为", createResult);

          resolve(createResult);
        } catch (createError) {
          reject(createError);
        }
      });
    }
  );

  printLogs("开始整合不同空间下的系统上线计划申请单事项信息并依次创建");

  const createSystemReleaseApprovalsResult = await Promise.all(
    createSystemReleaseApprovalRequests
  );

  printLogs("所有系统上线计划申请单事项数据创建完成");

  return {
    success: true,
    message: "所有系统上线计划申请单事项数据创建完成",
    data: createSystemReleaseApprovalsResult,
  };
} catch (error) {
  return error;
}
