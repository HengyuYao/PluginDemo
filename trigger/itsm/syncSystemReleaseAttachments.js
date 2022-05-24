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

// 系统上线计划事项类型objectId
const SYSTEM_ONLINE_APPROVAL_PLAN_ITEM_TYPE_ID = "SglszQZ2nt";

// 投产变更申请单 - 业务测试报告审批表
const BUSINESS_TEST_APPROVAL = "BUSINESS_TEST_APPROVAL";

// 需求审批表 - 开发需求申请表
const REQUIREMENT_DEVELOP_APPROVAL = "REQUIREMENT_DEVELOP_APPROVAL";

// 系统上线计划 - 报备材料
const PREPARE_MATERIAL = "PREPARE_MATERIAL";

// 系统上线计划 - 投产及变更实施方案
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
  [EXECUTE_SOLUTION]: 0, // 投产及变更实施方案
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

// ITSM 的环境域名
const ITSM_DOMAIN = global.env.ITSM_DOMAIN;

// ITSM 的Apikey
const ITSM_API_KEY = global.env.ITSM_API_KEY;

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

  const { objectId: releaseApprovalId } = releaseApproval;

  printLogs(`查询 ${releaseApprovalKey} 上线计划下的系统上线计划数据`);

  // 拿到 PARSE QUERY
  const SystemReleaseQuery = await apis.getParseQuery(false, "Item");

  const systemReleasesParse = await SystemReleaseQuery
    .equalTo("itemType", SYSTEM_ONLINE_APPROVAL_PLAN_ITEM_TYPE_ID) // 系统上线计划事项类型
    .containedIn("ancestors", [releaseApprovalId]) // 在上线计划的下
    .findAll({ sessionToken });

  const systemReleases = systemReleasesParse?.map((systemRelease) =>
    systemRelease.toJSON()
  );

  printLogs(
    `${releaseApprovalKey} 上线计划下系统上线计划数据查询完毕，列表为`,
    systemReleases
  );

  printLogs("依次生成系统上线计划传递附件数据");

  const SYNC_ATTACHMENTS_REQUESTS = systemReleases?.map((systemRelease) => {
    const {
      values: {
        ItemCode, // 事项编号
        dropdown_production_type: [CHANGE_TYPE], // 投产类型
        // 投产及变更实施方案原字段值
        execute_solution, // 实施方案_投产
        ssfa_bg, // 实施方案_变更
        // 业务测试报告审批表
        ywcsbgspb_tc, // 业务测试报告审批表_投产
        ywcsbgspb_bg, // 业务测试报告审批表_变更
        // 开发需求申请表
        development_requirement_apply, // 开发需求申请表_投产
        kfxqsqb_bg, // 开发需求申请表_变更
        // 其他附件
        qtfj_bg, // 其它附件_变更
        other_atachment, // 其它附件_投产
        // 报备材料
        prepare_material,
        // 安装部署手册
        installation_deployment_manual,
        // 数据库设计说明书
        database_design_specification,
        // 性能测试报告
        performance_test_report,
        // 运行管理手册
        operation_management_manual,
        // 技术测试报告审批表
        technology_test_form,
      },
      key: systemReleaseKey,
    } = systemRelease;

    const SYNC_DATA = {
      item_id: ItemCode,
      relation_files: [
        // 投产及变更实施方案转换值
        ...convertFieldToArray(
          CHANGE_TYPE === "投产" ? execute_solution : ssfa_bg,
          EXECUTE_SOLUTION
        ),
        // 业务测试报告审批表
        ...convertFieldToArray(
          CHANGE_TYPE === "投产" ? ywcsbgspb_tc : ywcsbgspb_bg,
          BUSINESS_TEST_APPROVAL
        ),
        // 开发需求申请表
        ...convertFieldToArray(
          CHANGE_TYPE === "投产" ? development_requirement_apply : kfxqsqb_bg,
          REQUIREMENT_DEVELOP_APPROVAL
        ),
        // 其他附件
        ...convertFieldToArray(
          CHANGE_TYPE === "投产" ? other_atachment : qtfj_bg,
          OTHER_ATTACHMENT
        ),
        // 报备材料
        ...convertFieldToArray(prepare_material, PREPARE_MATERIAL),
        // 安装部署手册
        ...convertFieldToArray(
          installation_deployment_manual,
          INSTALLATION_DEPLOYMENT_MANUAL
        ),
        // 数据库设计说明书
        ...convertFieldToArray(
          database_design_specification,
          DATABASE_DESIGN_SPECIFICATION
        ),
        // 性能测试报告
        ...convertFieldToArray(
          performance_test_report,
          PERFORMANCE_TEST_REPORT
        ),
        // 运行管理手册
        ...convertFieldToArray(
          operation_management_manual,
          OPERATION_MANAGEMENT_MANUAL
        ),
        // 技术测试报告审批表
        ...convertFieldToArray(technology_test_form, TECHNOLOGY_TEST_FORM),
      ],
    };

    printLogs(
      `系统上线计划 ${systemReleaseKey} 附件列表数据整合完毕，数据为`,
      SYNC_DATA
    );

    return apis.post(
      `${ITSM_DOMAIN}/linksystem/openapi/v1/devops/synAttachFileInfo?apikey=${ITSM_API_KEY}`,
      SYNC_DATA
    );
  });

  printLogs("向ITSM批量发送系统上线计划附件列表请求");

  const sync_result = await Promise.all(SYNC_ATTACHMENTS_REQUESTS);

  return {
    success: true,
    message: "同步成功",
    data: sync_result?.data,
  };
} catch (error) {
  return error?.message;
}
