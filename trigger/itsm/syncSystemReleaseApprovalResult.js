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
  const {
    item_id: systemReleaseApprovalId, // 系统上线计划申请单事项Id
    evaluate_result, // 评估结果，通过/不通过
    data_compliance, // 数据是否符合需求
  } = body;

  // 根据评估结果获取不同的目标状态
  const targetStatus = await apis.getData(false, "Status", {
    name: evaluate_result ? "评估通过" : "评估不通过",
  });

  // 评估附件数据
  let evaluation_files = body.evaluation_files;

  if (evaluation_files?.length) {
    printLogs("开始获取评估结果中传递的附件数据");


    const getEvaluationFiles = evaluation_files?.map((file) => {
      return new Promise(async (resolve, reject) => {
        // 获取文件数据
        const fileBlob = await apis.get(file.url, { responseType: "blob" });

        // 上传文件
        try {
          const uploadResult = await apis.uploadFileToParse(
            file.name,
            fileBlob
          );
          resolve(uploadResult);
        } catch (uploadError) {
          reject(uploadError);
        }
      });
    });

    evaluation_files = await Promise.all(getEvaluationFiles);
  }

  printLogs("更新事项数据");
  await apis.requestCoreApi(`/parse/items/${systemReleaseApprovalId}`, {
    values: {
      evaluate_result,
      evaluate_content,
      data_compliance,
      evaluation_files,
    },
  });
} catch (error) {
  return error;
}
