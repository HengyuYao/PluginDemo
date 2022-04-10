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

  printLogs('上线计划申请单事项数据获取完毕');

  printLogs(`获取 ${releaseApprovalId} 上线计划申请单事项所属业务需求数据`);
  // 获取上线计划申请单事项的父业务需求事项
  const [, businessRequirementId] = releaseApprovalItem?.ancestors;

  const businessRequirementParse = await apis.getData(false, "Item", {
    objectId: businessRequirementId,
  });

  const businessRequirement = businessRequirementParse.toJSON();

  printLogs('上线计划申请单所属业务需求事项数据获取完毕');

  // 获取业务需求关联的系统事项
  const { values: { requirement_relate_systems = [] } = {} } =
    businessRequirement?.values;

  printLogs('当前业务需求事项配置的涉及系统字段数据为', requirement_relate_systems);

  // 系统上线计划申请单需要继承自上线计划申请单的数据
  const systemReleaseApprovalInheritValues = {
    ...(releaseApprovalItem?.values ?? {}),
  };

  printLogs('查询系统上线计划申请单事项类型');
  // 获取系统上线计划申请单事项类型
  const systemReleaseApprovalType = await apis.getData("ItemType", {
    name: "系统上线计划申请单",
  });

  // 获取到插件信息，用于创建事项
  const myApp = await apis.getData(false, "App", { key: appKey });

  printLogs('生成批量创建系统上线计划申请单事项请求');
  // 生成创建系统上线计划申请单请求
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
        const Item = await apis.getParseObject(false, "Item");

        // 系统上线计划申请单事项的字段值
        const systemReleaseApprovalValues = {
          ...systemReleaseApprovalInheritValues, // 继承上线计划申请单的值
          System_id: relateSystem?.values?.System_id,
          System_responsible: relateSystem?.values?.System_responsible,
        };

        Item.set({
          tenant: releaseApprovalItem?.tenant, // 沿用父事项的租户
          workspace: {
            __type: "Pointer",
            className: "WorkSpace",
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

        printLogs(`${systemSpaceId} 空间下需要创建的系统上线计划申请单数据整合完毕，完整数据为`, Item);

        // 新建系统上线计划申请单
        try {
          printLogs(`开始创建 ${systemSpaceId} 下的系统上线计划申请单事项`);
          const systemReleaseApproval = await apis.saveItemWithKey(Item);

          printLogs('系统上线计划申请单事项创建成功，创建结果为', systemReleaseApproval);
          resolve(systemReleaseApproval);
        } catch (createError) {
          reject(createError);
        }
      });
    }
  );

  printLogs('开始整合不同空间下的系统上线计划申请单事项信息并依次创建');
  const systemReleaseApprovals = Promise.all(createSystemReleaseApprovals);

  printLogs('所有系统上线计划申请单事项数据创建完成');
} catch (error) {
  return error;
}
