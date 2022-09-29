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

//生成uuid
function uuid() {
  const s = [];
  const hexDigits = "0123456789abcdef";
  for (let i = 0; i < 18; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = "-";

  return s.join("");
}

// 补零
function fillTime(number) {
  return number < 10 ? `0${number}` : number;
}

// 获取当前时间
function getCurrentTime() {
  const date = new Date();

  const year = date.getFullYear();

  const month = fillTime(date.getMonth() + 1);

  const day = fillTime(date.getDate());

  const hours = fillTime(date.getHours());

  const minutes = fillTime(date.getMinutes());

  const seconds = fillTime(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

//调用批量推送待办事务的接口所需参数sign值
const sign = global.env.sign;
//批量推送待办事务的接口地址
const OA_DELETE_HOST = global.env.OA_DELETE_HOST;
// one的登录地址
const DEVOPS_HOST = global.env.ONE_LOGIN_HOST || "http://devops.tsp.hsb.biz";

try {
  const { itemId, title } = body;

  printLogs(`接收到事项 ${itemId} 的标题为 ${title} 的待办删除请求`);

  printLogs("开始查询事项的待办列表");
  const recordObjs = await apis.getAllData(true, 'TodoRecord', { itemId });

  printLogs("事项当前待办列表查询完毕，数据为", recordObjs);
  
  printLogs("开始向新门户传递待办信息列表, 请求地址为", OA_DELETE_HOST);
  // 批量删除
  const recordPromiseList = recordObjs?.map(
    it => apis.get(`${OA_DELETE_HOST}&sign=${sign}&affairId=${it?.get('affairId')}`, {
      "Content-Type": "application/json;charset=utf-8",
    }), 
  );

  try {
    const results = await Promise.all(recordPromiseList);
    const resultMsg = results?.map(result => result?.data?.message)?.join(',');
    printLogs("徽商待办事项删除完成，徽商响应信息为", resultMsg);
    return {
      result: resultMsg,
      data: itemId,
    };
  } catch (e) {
    throw e
  } finally {
    Promise.all(recordObjs.map(record => apis.deleteParseObject(record)));
  }

} catch (error) {
  printLogs("推送待办删除事项失败，错误信息为", error);
  return error;
}
