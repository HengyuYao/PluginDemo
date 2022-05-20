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

// 系统类型事项key
const SYSTEM_ITEM_TYPE_KEY = "system";

try {
  printLogs("接到 ITSM 平台获取 Devops 平台系统类型事项请求");

  printLogs("开始获取系统事项类型数据");

  const systemTypeParse = await apis.getData(false, "ItemType", {
    key: SYSTEM_ITEM_TYPE_KEY,
  });

  const systemType = systemTypeParse.toJSON();

  printLogs("系统事项类型数据获取完成，数据为", systemType);

  printLogs("查询平台内所有系统类型事项数据");

  const systemItemQuery = await apis.getParseQuery(false, "Item");

  const systemItemsParse = await systemItemQuery
    .equalTo("itemType", systemType.objectId) // 系统事项类型
    .findAll({ sessionToken });

  const systemItems = systemItemsParse?.map((systemItem) =>
    systemItem.toJSON()
  );

  printLogs("系统类型事项数据查询完成，数据为", systemItems);

  printLogs("开始整合系统类型事项数据格式");

  const ASYNC_DATA_TO_ITSM = systemItems?.map((systemItem) => {
    const {
      values: {
        system_identification, // 系统标识
        system_manager, // 系统负责人
      } = {},
      name: system_name,
    } = systemItem;

    return {
      system_name,
      system_identification,
      // 用户类型数据，需要提取出username，并拼接成字符串
      system_manager: system_manager?.map((user) => user.username)?.join(","),
    };
  });

  printLogs("系统类型数据整合完成，整合结果为", ASYNC_DATA_TO_ITSM);

  return {
    success: true,
    message: "系统数据查询完成",
    data: ASYNC_DATA_TO_ITSM,
  };
} catch (err) {
  return {
    success: false,
    data: null,
    message: err?.message,
  };
}
