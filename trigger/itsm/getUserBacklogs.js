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
  const { userId } = body;

  printLogs(`收到 ITSM 发起的查询 ${userId} 用户待办事项数量请求`);

  printLogs(`生成查询 ${userId} 用户待办事项数据 IQL 语句`);

  const iql = `'当前处理人' in ['u:${userId}']`;

  printLogs(`查询 ${userId} 用户待办事项数据 IQL 语句生成完毕，语句为`, iql);

  printLogs("使用 IQL 语句，调用 proxima-core 接口");

  // 查询待办数量
  const backlogs = await apis.requestCoreApi("POST", "/parse/api/search", {
    iql,
    from: 0,
    size: 9999,
  });

  printLogs(`用户 ${userId} 待办数量查询完毕，结果为`, backlogs?.count);

  return {
    success: true,
    data: backlogs?.count,
    message: "用户待办数据查询成功",
  };
} catch (error) {
  return {
    success: false,
    meesage: "没有找到对应用户，请确认员工号",
    data: 0,
  };
}
