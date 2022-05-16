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
  const { key: changeApprovalKey } = body;

  printLogs(`投产变更申请单 ${changeApprovalKey} 审批通过，开始将附件同步至系统上线计划申请单`);

  printLogs(`查询投产变更申请单 ${changeApprovalKey} 事项信息`);

  const changeApprovalParse = await apis.getData(false, 'Item', {
    key: changeApprovalKey
  })

  const changeApproval = changeApprovalParse.toJSON();

  printLogs(`投产变更申请单 ${changeApprovalKey} 数据查询完毕，数据为`, changeApproval);

  const {
    associated_business_requirement = [], // 关联业务需求
    service_test_form = [], // 业务测试报告审批表_已审批
  } = changeApproval?.values;

  printLogs(`依次查询 ${associated_business_requirement} 业务需求对应的需求审批单事项`);

  // 查询系统上线计划事项类型
  const requirementApprovalTypeParse = await apis.getData(false, 'ItemType', {
    name: '需求审批单'
  });

  const requirementApprovalType = requirementApprovalTypeParse.toJSON();

  const RequirementApprovalQuery = await apis.getParseQuery(false, 'Item');

  const requirementApprovalsParse = await RequirementApprovalQuery
    .equalTo('itemType', requirementApprovalType?.objectId) // 需求审批单类型
    .containedIn('values.associated_business_requirement', associated_business_requirement) // 关联了该业务需求
    .findAll({ sessionToken });

  const requirementApprovals = requirementApprovalsParse?.map((requirementApproval) => requirementApproval.toJSON())

  printLogs(`${associated_business_requirement} 业务需求对应的需求审批表数据查询完成完成，数据为`, requirementApprovals);

  // 转换数据格式便于读取
  const requirementApprovalAttachments = {};

  requirementApprovals?.forEach((requirementApproval) => {
    const {
      associated_business_requirement: relationRequirements, // 关联的业务需求
      spdfj = [], // 需求审批单_已审核
    } = requirementApproval?.values;

    relationRequirements?.forEach((requirementId) => {
      requirementApprovalAttachments[requirementId] = spdfj;
    })
  })

  printLogs('需求审批单附件与业务需求关联数据格式转换完成，数据为', requirementApprovalAttachments);

  printLogs(`依次查询 ${associated_business_requirement} 业务需求下处于【评估通过】状态的系统上线计划列表`);

  // 查询系统上线计划事项类型
  const systemReleaseTypeParse = await apis.getData(false, 'ItemType', {
    name: '系统上线计划'
  });

  const systemReleaseType = systemReleaseTypeParse.toJSON();

  // 查询评估通过状态
  const evaluatePassStatusParse = await apis.getData(false, 'Status', {
    name: '评估通过'
  });

  const evaluatePassStatus = evaluatePassStatusParse.toJSON();

  // 获取 ParseQuery
  const SystemReleaseQuery = await apis.getParseQuery(false, 'Item');

  const systemReleaseItemsParse = await SystemReleaseQuery
    .equalTo('itemType', systemReleaseType?.objectId) // 系统上线计划类型
    .equalTo('status', evaluatePassStatus?.objectId) // 评估通过状态
    .containedIn('ancestors', associated_business_requirement) // 系统上线计划在对应业务需求下
    .findAll({ sessionToken });

  const systemReleaseItems = systemReleaseItemsParse?.map((systemReleaseParse) => systemReleaseParse.toJSON());

  printLogs('符合条件的系统上线计划数据查询完毕，列表为', systemReleaseItems);

  printLogs('生成更新系统上线计划附件字段信息请求');

  const updateAttachmentsRequests = systemReleaseItems?.map((systemRelease) => {
    return new Promise(async (resolve) => {
      const {
        objectId: systemReleaseId,
        ancestors: [, business_requirement_id]
      } = systemRelease;

      // 根据系统上线计划归属的业务需求，查询到对应的需求审批单中的附件，用于开发需求申请表
      const requirement_develop_form = requirementApprovalAttachments[business_requirement_id];

      try {
        // 更新对应字段
        const updateResult = await apis.requestCoreApi('PUT',  `/parse/api/items/${systemReleaseId}`, {
          values: {
            ywcsbgspb_bg: service_test_form, // 业务测试报告 - 读取自投产变更申请单的业务测试报告字段
            ywcsbgspb_tc: service_test_form, // 业务测试报告 - 读取自投产变更申请单的业务测试报告字段
            development_requirement_apply: requirement_develop_form, // 开发需求申请表，读取自业务需求对应的需求审批单的附件字段
            kfxqsqb_bg: requirement_develop_form // 开发需求申请表，读取自业务需求对应的需求审批单的附件字段
          }
        })

        resolve(updateResult);
      } catch (updateError) {
        throw updateError;
      }
    })
  });

  const updateResults = await Promise.all(updateAttachmentsRequests);

  return {
    success: true,
    message: "附件字段更新成功",
    data: updateResults
  }
} catch (error) {
  return {
    success: false,
    message: error?.message,
  }
}
