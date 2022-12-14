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
const SYSTEM_RELEASE_PLAN_ITEM_TYPE_ID = global?.env?.systemReleasePlanTypeId || "SglszQZ2nt";

// 系统子需求事项类型的key
const SYSTEM_CHILD_REQUIREMENT_ITEM_TYPE_ID = global?.env?.systemChildRequirementTypeId || 'MMRH7KxHmQ';

// 过滤字段（是否投产）的key和value
const FILTER_KEY = global?.env?.filterKey || 'shifoutouchan';
const FILTER_VALUE = global?.env?.filterValue || ['1'];
const KEY = global?.env?.key || 'suoshuxitong';
try {
  const { key: releaseApprovalKey } = body;

  printLogs(`获取key为 ${releaseApprovalKey} 的上线计划事项数据`);
  // 获取上线计划事项
  const releaseApprovalParse = await apis.getData(false, "Item", {
    key: releaseApprovalKey,
  });

  const releaseApprovalItem = releaseApprovalParse.toJSON();

  printLogs("上线计划事项数据获取完毕，数据为", releaseApprovalItem);

  printLogs(`获取key为 ${releaseApprovalKey} 的上线计划事项所属业务需求数据`);

  // 获取上线计划事项的父业务需求事项
  const [, businessRequirementId] = releaseApprovalItem?.ancestors;

  const businessRequirementParse = await apis.getData(false, "Item", {
    objectId: businessRequirementId,
  });

  const businessRequirement = businessRequirementParse.toJSON();

  printLogs(
    "上线计划所属业务需求事项数据获取完毕，数据为",
    businessRequirement
  );

  // 获取业务需求关联的系统事项
  const {
    name: business_requirement_title,
    values: {
      ItemCode: business_requirement_number, // 业务需求编号
    } = {},
  } = businessRequirement;

  // 系统上线计划需要继承自上线计划的数据
  const {
    values: {
      Degree_of_urgency, // 紧急程度
      editor_story_desc, // 需求描述
      onlinetime, // 上线日期
      shejixitong, // 涉及系统
      demand_leader, // 需求牵头人
    },
    objectId: releaseApprovalId,
    name: releaseApprovalName,
  } = releaseApprovalItem;

  printLogs(
    "当前上线计划事项的涉及系统字段数据为",
    shejixitong
  );

  printLogs("查询可投产的系统子需求", `${SYSTEM_CHILD_REQUIREMENT_ITEM_TYPE_ID} ${FILTER_KEY} ${FILTER_VALUE} ${KEY}`);
  const systemRequirementQuery = await apis.getParseQuery(false, "Item");

  const systemRequirementsParse = await systemRequirementQuery
    .equalTo("itemType", SYSTEM_CHILD_REQUIREMENT_ITEM_TYPE_ID) // 系统子需求事项类型
    .equalTo(`values.${FILTER_KEY}`, FILTER_VALUE) // 根据过滤字段查询
    .containedIn("ancestors", [businessRequirementId]) // 在业务需求之下
    .findAll({ sessionToken });

  const systemRequirementWorkspaces = systemRequirementsParse?.map(systemRequirement =>
    systemRequirement.toJSON().values[KEY][0]
  ) || [];

  printLogs("可投产的系统子需求所属系统查询完成，数据为", systemRequirementWorkspaces);


  printLogs("查询系统上线计划事项类型");
  // 获取系统上线计划事项类型
  const systemReleaseApprovalType = await apis.getData(false, "ItemType", {
    objectId: SYSTEM_RELEASE_PLAN_ITEM_TYPE_ID,
  });

  // 获取到插件信息，用于创建事项
  const myApp = await apis.getData(false, "App", { key: appKey });

  printLogs("生成批量创建系统上线计划事项请求");

  // 生成创建系统上线计划请求
  const createSystemReleaseApprovalRequests = shejixitong?.filter(id => systemRequirementWorkspaces.includes(id))?.map(
    (relateSystemId) => {
      return new Promise(async (resolve, reject) => {
        printLogs(`查询 ${relateSystemId} 系统事项数据`);

        // 获取到系统类型事项数据
        const relateSystemParse = await apis.getData(false, "Item", {
          objectId: relateSystemId,
        });

        const relateSystem = relateSystemParse.toJSON();

        printLogs(
          `${relateSystemId} 系统事项数据查询完成，数据为`,
          relateSystem
        );

        // 解析系统事项中需要的数据
        const {
          name: system_name,
          values: {
            system_manager, // 系统负责人
            bind_system: systemSpaceId, // 绑定空间Id
            ItemCode: system_identification, // 事项编号 - 系统标识
          },
        } = relateSystem;

        printLogs(`${relateSystemId} 系统事项绑定的空间ID为`, systemSpaceId);

        // 获得事项类型parse对象
        const systemReleaseApproval = await apis.getParseObject(false, "Item");

        printLogs("开始整合要创建的系统投产变更单事项数据");

        // 系统上线计划事项的字段值
        const systemReleaseApprovalValues = {
          // 继承业务需求的标题
          business_requirement_title,
          business_requirement_number,
          // 继承上线计划的值
          demand_leader,
          Degree_of_urgency, // 紧急程度
          editor_story_desc, // 需求内容
          onlinetime, // 上线日期
          online_requirement: [businessRequirementId], // 上线需求，引用业务需求数据
          // 继承自系统事项的值
          system_identification, // 系统标识
          system_manager, // 系统负责人
          dropdown_blong_system: [system_name], // 系统名称
          suoshuxitong: [relateSystemId], // 所属系统
        };

        systemReleaseApproval.set({
          tenant: releaseApprovalItem?.tenant, // 沿用父事项的租户
          workspace: {
            __type: "Pointer",
            className: "Workspace",
            objectId: systemSpaceId,
          }, // 创建到对应的空间
          itemType: systemReleaseApprovalType, // 事项类型
          // 设置层级关系，在上线计划的下一层
          ancestors: [...releaseApprovalItem?.ancestors, releaseApprovalId],
          ancestorsCount: 3,
          // 事项名称，由 [事项类型系统名称]-上线计划名称 组成
          name: `[XTSX${system_name}]-${releaseApprovalName}`,
          values: systemReleaseApprovalValues,
          createdBy: myApp.toJSON().createdBy,
        });

        printLogs(
          `${systemSpaceId} 空间下需要创建的系统上线计划数据整合完毕，完整数据为`,
          systemReleaseApproval
        );

        // 新建系统上线计划
        try {
          printLogs(`开始创建 ${systemSpaceId} 下的系统上线计划事项`);

          const createResult = await apis.saveItemWithKey(
            systemReleaseApproval
          );

          printLogs("系统上线计划事项创建成功，创建结果为", createResult);

          resolve(createResult);
        } catch (createError) {
          reject(createError);
        }
      });
    }
  );

  printLogs("开始整合不同空间下的系统上线计划事项信息并依次创建");

  const createSystemReleaseApprovalsResult = await Promise.all(
    createSystemReleaseApprovalRequests
  );

  printLogs("所有系统上线计划事项数据创建完成");

  return {
    success: true,
    message: "所有系统上线计划事项数据创建完成",
    data: createSystemReleaseApprovalsResult,
  };
} catch (error) {
  return error?.message;
}
