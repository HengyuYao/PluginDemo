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

  printLogs(`获取Id为 ${programApprovalId} 的投产变更审批单事项数据`);
  // 获取投产变更审批单事项
  const programApprovalParse = await apis.getData(false, "Item", {
    objectId: programApprovalId,
  });

  const releaseApprovalItem = programApprovalParse.toJSON();

  printLogs("投产变更审批单事项数据获取完毕");

  printLogs(`获取 ${programApprovalId} 投产变更审批单事项所属业务需求数据`);
  // 获取投产变更审批单事项的父业务需求事项
  const [, businessRequirementId] = releaseApprovalItem?.ancestors;

  const businessRequirementParse = await apis.getData(false, "Item", {
    objectId: businessRequirementId,
  });

  const businessRequirement = businessRequirementParse.toJSON();

  printLogs("投产变更审批单所属业务需求事项数据获取完毕");

  // 获取业务需求关联的系统事项
  const {
    values: { requirement_relate_systems = [] } = {},
    name: business_requirement_name,
  } = businessRequirement;

  printLogs(
    "当前业务需求事项配置的涉及系统字段数据为",
    requirement_relate_systems
  );

  // 系统投产变更审批单需要继承自投产变更审批单的数据
  const {
    emergency_degree, // 紧急程度
    requirement_content, // 需求内容
    onlinetime, // 上线日期
    application_date, // 申请日期
    changeType, // 变更类型
    business_requirement_number, // 业务需求标题
  } = releaseApprovalItem?.values ?? {};

  printLogs("查询系统投产变更审批单事项类型");
  // 获取系统投产变更审批单事项类型
  const systemReleaseApprovalType = await apis.getData(false, "ItemType", {
    name: "系统投产变更审批单",
  });

  // 获取到插件信息，用于创建事项
  const myApp = await apis.getData(false, "App", { key: appKey });

  printLogs("生成批量创建系统投产变更审批单事项请求");
  // 生成创建系统投产变更审批单请求
  const createSystemReleaseApprovals = requirement_relate_systems?.map(
    (relateSystemId) => {
      return new Promise(async (resolve, reject) => {
        // 获取到系统类型事项数据
        const relateSystemParse = await apis.getData(false, "Item", {
          objectId: relateSystemId,
        });

        const relateSystem = relateSystemParse.toJSON();

        // 拿到系统类型事项绑定的空间ID
        const systemSpaceId = relateSystem?.values?.System_bind_space;

        // 获得事项类型parse对象
        const systemReleaseApproval = await apis.getParseObject(false, "Item");

        // 系统投产变更审批单事项的字段值
        const systemReleaseApprovalValues = {
          // 继承业务需求的标题
          business_requirement_name,
          // 继承投产变更审批单的值
          emergency_degree, // 紧急程度
          requirement_content, // 需求内容
          onlinetime, // 上线日期
          application_date, // 申请日期
          changeType, // 变更类型
          business_requirement_number, // 业务需求标题
          // 继承自系统事项的值
          System_id: relateSystem?.values?.System_id, // 系统标识
          System_responsible: relateSystem?.values?.System_responsible, // 系统负责人
        };

        systemReleaseApproval.set({
          tenant: releaseApprovalItem?.tenant, // 沿用父事项的租户
          workspace: {
            __type: "Pointer",
            className: "Workspace",
            objectId: systemSpaceId,
          }, // 创建到对应的空间
          itemType: systemReleaseApprovalType, // 事项类型
          // 设置层级关系，在投产变更审批单的下一层
          ancestors: [...releaseApprovalItem?.ancestors, programApprovalId],
          ancestorsCount: 3,
          // 事项名称，由系统名称-投产变更审批单名称组成
          name: `${relateSystem?.name}-${releaseApprovalItem?.name}`,
          values: systemReleaseApprovalValues,
          createdBy: myApp.toJSON().createdBy,
        });

        printLogs(
          `${systemSpaceId} 空间下需要创建的系统投产变更审批单数据整合完毕，完整数据为`,
          systemReleaseApproval
        );

        // 新建系统投产变更审批单
        try {
          printLogs(`开始创建 ${systemSpaceId} 下的系统投产变更审批单事项`);
          await apis.saveItemWithKey(systemReleaseApproval);

          printLogs(
            "系统投产变更审批单事项创建成功，创建结果为",
            systemReleaseApproval
          );
          resolve(systemReleaseApproval);
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
  return error;
}
