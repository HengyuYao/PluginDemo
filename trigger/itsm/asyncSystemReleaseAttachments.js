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

// 投产变更申请单 - 业务测试报告审批表
const BUSINESS_TEST_APPROVAL = "BUSINESS_TEST_APPROVAL";

// 需求审批表 - 开发需求申请表
const REQUIREMENT_DEVELOP_APPROVAL = "REQUIREMENT_DEVELOP_APPROVAL";

// 系统上线计划 - 报备材料
const PREPARE_MATERIAL = "PREPARE_MATERIAL";

// 系统上线计划 - 实施方案
const EXECUTE_SOLUTION = "EXECUTE_SOLUTION";

// 系统上线计划 - 技术测试报告审批表
const TECHNOLOGY_TEST_FORM = "TECHNOLOGY_TEST_FORM";

// 系统上线计划 - 运行管理手册
const OPERATION_MANAGEMENT_MANUAL = "operation_management_manual";

// 系统上线计划 - 性能测试报告
const PERFORMANCE_TEST_REPORT = "PERFORMANCE_TEST_REPORT";

// 系统上线计划 - 数据库设计说明书
const DATABASE_DESIGN_SPECIFICATION = "DATABASE_DESIGN_SPECIFICATION";

// 系统上线计划 - 安装部署手册
const INSTALLATION_DEPLOYMENT_MANUAL = "INSTALLATION_DEPLOYMENT_MANUAL";

// 系统上线计划 - 其他附件
const OTHER_ATTACHMENT = "OTHER_ATTACHMENT";

const ATTACHMENT_FILE_CODE_ENUM = {
  [EXECUTE_SOLUTION]: 0, // 实施方案
  [BUSINESS_TEST_APPROVAL]: 1, // 业务测试报告审批表
  [TECHNOLOGY_TEST_FORM]: 2, // 技术测试报告审批表
  [REQUIREMENT_DEVELOP_APPROVAL]: 3, // 开发需求申请表
  [OPERATION_MANAGEMENT_MANUAL]: 4, // 运行管理手册
  [PERFORMANCE_TEST_REPORT]: 5, // 性能测试报告
  [DATABASE_DESIGN_SPECIFICATION]: 6, // 数据库设计说明书
  [INSTALLATION_DEPLOYMENT_MANUAL]: 7, // 安装部署手册
  [PREPARE_MATERIAL]: 8, // 报备材料
  [OTHER_ATTACHMENT]: 9, // 其他附件
};

// 把 proxima 的附件格式转换成约定格式
function convertFieldToArray(attachments, ATTACHMENT_TYPE) {
  if (!attachments?.length) {
    return [];
  }

  const type = ATTACHMENT_FILE_CODE_ENUM[ATTACHMENT_TYPE];

  // 只取所需字段
  return attachments?.map(({ name, url }) => ({ name, url, type }));
}

try {
  const { key: releaseApprovalKey } = body;

  printLogs(
    `上线计划 ${releaseApprovalKey} 复核完成，开始向ITSM系统同步附件列表`
  );

  printLogs(`获取 ${releaseApprovalKey} 上线计划事项数据`);

  const releaseApprovalParse = await apis.getData(false, "Item", {
    key: releaseApprovalKey,
  });

  const releaseApproval = releaseApprovalParse.toJSON();

  printLogs(
    `${releaseApprovalKey} 上线计划事项数据查询完成，数据为`,
    releaseApproval
  );

  const {
    ancestors: [
      business_mention_id, // 拿到业务意向编号
      business_requirement_id, // 业务需求编号
    ] = [],
  } = releaseApproval;

  printLogs(`查询 ${releaseApprovalKey} 上线计划对应的需求审批单数据`);

  const requirementApprovalTypeParse = await apis.getData(false, "ItemType", {
    name: "需求审批单",
  });

  const requirementApprovalType = requirementApprovalTypeParse.toJSON();

  printLogs("需求审批单事项类型数据查询完成，数据为", requirementApprovalType);

  // 拿到事项查询方法
  const RequirementApprovalQuery = await apis.getParseQuery(false, "Item");

  const [requirementApprovalParse] = await RequirementApprovalQuery.equalTo(
    "itemType",
    requirementApprovalType?.objectId
  )
    .containedIn("ancestors", [business_mention_id]) // 在上线计划的业务意向下
    .containedIn("values.associated_business_requirement", [
      business_requirement_id,
    ])
    .find({ sessionToken }); // 关联了上线计划所属业务需求

  const requirementApproval = requirementApprovalParse.toJSON();

  printLogs("需求审批单事项数据查询完成，数据为", requirementApproval);

  printLogs(`查询 ${releaseApprovalKey} 上线计划对应的投产变更审批单数据`);

  const changeApprovalTypeParse = await apis.getData(false, "ItemType", {
    name: "投产变更申请单",
  });

  const changeApprovalType = changeApprovalTypeParse.toJSON();

  const ChangeApprovalQuery = await apis.getParseQuery(false, "Item");

  const [changeApprovalParse] = await ChangeApprovalQuery.equalTo(
    "itemType",
    changeApprovalType?.objectId
  ) // 投产变更申请单
    // .containedIn("values.associated_business_requirement", [
    //   business_requirement_id,
    // ]) // 引用了当前业务需求
    .find({ sessionToken });

  const changeApproval = changeApprovalParse.toJSON();

  printLogs("投产变更申请单数据查询完毕，数据为", changeApproval);

  const {
    appendix_approval_form, // 需求审批表 - 开发需求申请表
  } = requirementApproval?.values;

  const {
    product_change_apply_files, // 投产变更申请单 - 业务测试报告审批表
  } = changeApproval?.values;

  // 需求审批表和投产变更申请单的附件数据要附在每一个系统上线计划附件数据中
  const COMMON_ATTACHMENTS = [
    ...convertFieldToArray(
      appendix_approval_form,
      REQUIREMENT_DEVELOP_APPROVAL
    ),
    ...convertFieldToArray(product_change_apply_files, BUSINESS_TEST_APPROVAL),
  ];

  printLogs(
    "需求审批表、投产变更申请单中附件数据整合完成，数据为",
    COMMON_ATTACHMENTS
  );

  return {
    success: true,
    message: "同步成功",
    data: null,
  };
} catch (error) {
  return error?.message;
}
