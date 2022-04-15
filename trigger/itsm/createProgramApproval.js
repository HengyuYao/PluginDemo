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
  const { objectId: releaseProgramApplyId } = body;

  printLogs(`获取Id为 ${releaseProgramApplyId} 的投产变更申请单事项数据`);
  // 获取上线计划申请单事项
  const releaseApprovalParse = await apis.getData(false, "Item", {
    objectId: releaseProgramApplyId,
  });

  const releaseProgramApplyItem = releaseApprovalParse.toJSON();

  printLogs("投产变更申请单事项数据获取完毕");

  // 获取投产变更申请单事项的关联业务需求事项字段值
  const {
    values: {
      associated_business_requirement = [], // 关联的业务需求数据
    } = {},
    createdBy: releaseProgramApplyCreatedBy, // 创建人
    key: releaseProgramApplyKey, // 投产变更申请单事项key
  } = releaseProgramApplyItem;

  printLogs("获取投产变更申请单创建人信息");

  const releaseProgramApplyCreatorParse = await apis.getData(false, "_User", {
    objectId: releaseProgramApplyCreatedBy?.objectId,
  });

  const { deleted, enabled, nickname, username, objectId } =
    releaseProgramApplyCreatorParse.toJSON();

  const releaseProgramApplyCreator = {
    deleted,
    enabled,
    nickname,
    username,
    value: objectId,
    label: `${nickname}(${username})`,
  };

  printLogs("投产变更申请单创建人信息为", releaseProgramApplyCreator);

  printLogs(
    `投产变更申请单 ${releaseProgramApplyId} 中涉及的业务需求列表为`,
    associated_business_requirement
  );

  printLogs("开始生成创建投产变更审批单及系统投产变更审批单事项请求");

  // 查询上线计划申请单事项类型
  const releaseApprovalType = await apis.getData(false, "ItemType", {
    name: "上线计划申请单",
  });

  // 查询投产变更审批单事项类型
  const releaseProgramType = await apis.getData(false, "ItemType", {
    name: "投产变更审批单",
  });

  // 获取到插件信息，用于创建事项
  const myApp = await apis.getData(false, "App", { key: appKey });

  // 生成创建投产变更审批单事项数组
  const createProgramApprovalRequests = associated_business_requirement?.map(
    (requirementId) => {
      return new Promise(async () => {
        printLogs(
          `查询 ${releaseProgramApplyId} 投产变更审批单关联的 ${requirementId} 业务需求数据`
        );

        const businessRequirementParse = await apis.getData(false, "Item", {
          objectId: requirementId,
        });

        const businessRequirement = businessRequirementParse.toJSON();

        printLogs(`${requirementId} 业务需求数据查询完毕`, businessRequirement);

        const {
          objectId: businessRequirementId,
          ancestors: businessRequirementAncestors,
          name: businessRequirementName,
          values: {
            user_introducer, // 需求提出人
            dropdown_business_department, // 业务部门
          } = {},
        } = businessRequirement;

        printLogs(`查询 ${requirementId} 业务需求下的上线计划申请单事项数据`);

        // 业务需求事项下级事项的ancestor数据
        const ancestorsUnderBusinessRequirement = [
          ...businessRequirementAncestors,
          businessRequirementId,
        ];

        // 通过 Parse.Query 查询业务需求下的上线计划申请单事项数据
        const itemParseQuery = await apis.getParseQuery(false, "Item");

        const [releaseApprovalParse] = await itemParseQuery
          .equalTo("itemType", releaseApprovalType?.id) // 上线计划申请单事项类型
          .containedIn("ancestors", ancestorsUnderBusinessRequirement) // 上线计划申请单挂载在业务需求下
          .findAll({ sessionToken });

        const releaseApproval = releaseApprovalParse.toJSON();

        printLogs(
          `${requirementId} 业务需求下的上线计划申请单事项数据查询完成，数据为`,
          releaseApproval
        );

        // 解析出需要的从上线计划申请单中获取的数据
        const {
          tenant,
          workspace,
          objectId: releaseApprovalId,
          values: {
            emergency_degree, // 紧急程度
            onlinetime, // 上线日期
          } = {},
        } = releaseApproval;

        try {
          printLogs(
            `开始整合 ${requirementId} 业务需求下要创建的投产变更审批单事项数据`
          );

          // 投产变更审批单事项value
          const releaseProgramValues = {
            user_introducer, // 业务提出人
            emergency_degree,
            dropdown_business_department, // 业务部门
            application_date: +new Date(), // 申请日期
            demand_leader: [releaseProgramApplyCreator], // 需求牵头人
            online_plan_risk_assessment: [releaseApprovalId], // 上线计划申请单
            associated_product_change_apply_number: releaseProgramApplyKey, // 投产变更申请单事项key
            date_implementation_date: onlinetime, // 实施日期，与上线计划申请单的上线日期相同
            whether_part_online: "否", // 是否部分上线
            radio_online_report: "否", // 是否上线报备
          };

          // 获得事项类型parse对象
          const ReleaseProgramItem = await apis.getParseObject(false, "Item");

          ReleaseProgramItem.set({
            tenant, // 沿用当前空间的租户
            workspace, // 沿用当前空间
            itemType: releaseProgramType, // 事项类型
            // 设置层级关系，在上线计划申请单的下一层
            ancestors: ancestorsUnderBusinessRequirement,
            ancestorsCount: ancestorsUnderBusinessRequirement?.length,
            // 事项名称，由系统名称-上线计划申请单名称组成
            name: `投产变更审批单-${businessRequirementName}`,
            values: releaseProgramValues,
            createdBy: myApp.toJSON().createdBy,
          });

          printLogs(
            `${requirementId} 业务需求下的投产变更审批单事项数据整合完毕，数据为`,
            ReleaseProgramItem
          );

          printLogs(`开始创建 ${requirementId} 下的投产变更审批单事项`);

          const releaseProgramApproval = await apis.saveItemWithKey(
            ReleaseProgramItem
          );

          printLogs(
            `${requirementId} 投产变更审批单事项创建成功，创建结果为`,
            releaseProgramApproval
          );

          resolve(releaseProgramApproval);
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );

  printLogs(
    "开始在投产变更申请单关联的业务需求下整合相关数据并创建投产变更审批单"
  );

  const createProgramApprovalsResult = await Promise.all(
    createProgramApprovalRequests
  );

  printLogs("所有投产变更审批单事项数据创建完成");

  return {
    success: true,
    message: "所有投产变更审批单事项数据创建完成",
    data: createProgramApprovalsResult,
  };
} catch (error) {
  return error;
}
