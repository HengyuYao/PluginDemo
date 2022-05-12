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

// 把富文本转换成字符串
function convertRichText(richText) {
  if (!Array.isArray(richText)) {
    return ''
  }

  return richText.reduce((prev, rich) => {
    // 只转换文本类型
    if (['paragraph', 'p'].includes(rich?.type)) {
      // 遍历富文本对象的children，把文本内容取出来，用 \n 连接
      const pureText = rich?.children?.map(({ text }) => text)?.join('\n');
      return prev + pureText;
    }

    return prev;
  }, '');
}

try {
  const { key: releaseApprovalKey } = body;

  printLogs(
    `系统上线计划申请单 ${releaseApprovalKey} 提交评估，开始向ITSM系统同步数据`
  );

  printLogs(`获取 ${releaseApprovalKey} 系统上线计划申请单数据`);

  const releaseApprovalParse = await apis.getData(false, "Item", {
    key: releaseApprovalKey,
  });

  const releaseApproval = releaseApprovalParse.toJSON();

  printLogs(
    `${releaseApprovalKey} 系统上线计划申请单事项数据查询完成，数据为`,
    releaseApproval
  );

  const {
    ancestors: [
      business_intention_id, // 业务意向ID
      business_requirement_id, // 业务需求ID
    ] = [],
    values: {
      ItemCode: systemReleaseApprovalItemCode, // 事项编号
      Degree_of_urgency, // 紧急程度
      onlinetime, // 上线日期
      product_change_type, // 投产变更类型
      system_identification, // 系统标识
      system_manager, // 系统负责人
      editor_story_desc, // 需求描述
    } = {},
    objectId: releaseApprovalId
  } = releaseApproval;

  // 生成申请时间，默认取当天
  const application_date = new Date().getTime();

  // 保存申请时间数据到事项中
  apis.requestCoreApi(
    "PUT",
    `/parse/api/items/${releaseApprovalId}`,
    {
      values: { application_date },
    }
  );

  printLogs(`获取 ${releaseApprovalKey} 所属业务意向事项数据`);

  const businessIntentionParse = await apis.getData(false, "Item", {
    objectId: business_intention_id,
  });

  const businessIntention = businessIntentionParse.toJSON();

  printLogs(
    `${releaseApprovalKey} 所属业务意向事项数据查询完毕，数据为`,
    businessIntention
  );

  printLogs(`获取 ${releaseApprovalKey} 所属业务需求事项数据`);

  const businessRequirementParse = await apis.getData(false, "Item", {
    objectId: business_requirement_id,
  });

  const businessRequirement = businessRequirementParse.toJSON();

  const {
    name: business_requirement_name, // 业务需求事项名称
    values: { ItemCode: business_requirement_number }, // 业务需求事项编号
  } = businessRequirement;

  printLogs(
    `${releaseApprovalKey} 所属业务需求事项数据查询完毕，数据为`,
    businessRequirement
  );

  const ASYNC_DATA_TO_ITSM = {
    // 需要处理的数据
    product_change_type: product_change_type?.join(","), // 投产变更类型
    Degree_of_urgency: Degree_of_urgency?.join(','), // 紧急程度
    system_manager: system_manager // 系统负责人,用户类型，先转成用户名，再连接,
      ?.map((user) => user.username)
      ?.join(","),
    business_intention_number: businessIntention?.key, // 业务意向编号
    editor_story_desc: convertRichText(editor_story_desc), // 需求描述，从富文本转换成文本
    // 不需要处理直接传递的数据
    item_id: systemReleaseApprovalItemCode, // 事项编号
    onlinetime, // 上线日期
    application_date, // 申请日期
    system_identification, // 系统标识
    business_requirement_name, // 业务需求标题
    business_requirement_number, // 业务需求编号
  };

  printLogs(
    "向ITSM传递的系统上线计划申请单数据整合完成，数据为",
    ASYNC_DATA_TO_ITSM
  );

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
