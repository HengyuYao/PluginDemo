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

//使用sm4加密的方法
function buildUrlSm4(userId, redirectURL) {
  const DECRYPT = 0;
  const ENCRYPT = 1;
  const ROUND = 32;
  const BLOCK = 16;

  const Sbox = [
    0xd6, 0x90, 0xe9, 0xfe, 0xcc, 0xe1, 0x3d, 0xb7, 0x16, 0xb6, 0x14, 0xc2,
    0x28, 0xfb, 0x2c, 0x05, 0x2b, 0x67, 0x9a, 0x76, 0x2a, 0xbe, 0x04, 0xc3,
    0xaa, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99, 0x9c, 0x42, 0x50, 0xf4,
    0x91, 0xef, 0x98, 0x7a, 0x33, 0x54, 0x0b, 0x43, 0xed, 0xcf, 0xac, 0x62,
    0xe4, 0xb3, 0x1c, 0xa9, 0xc9, 0x08, 0xe8, 0x95, 0x80, 0xdf, 0x94, 0xfa,
    0x75, 0x8f, 0x3f, 0xa6, 0x47, 0x07, 0xa7, 0xfc, 0xf3, 0x73, 0x17, 0xba,
    0x83, 0x59, 0x3c, 0x19, 0xe6, 0x85, 0x4f, 0xa8, 0x68, 0x6b, 0x81, 0xb2,
    0x71, 0x64, 0xda, 0x8b, 0xf8, 0xeb, 0x0f, 0x4b, 0x70, 0x56, 0x9d, 0x35,
    0x1e, 0x24, 0x0e, 0x5e, 0x63, 0x58, 0xd1, 0xa2, 0x25, 0x22, 0x7c, 0x3b,
    0x01, 0x21, 0x78, 0x87, 0xd4, 0x00, 0x46, 0x57, 0x9f, 0xd3, 0x27, 0x52,
    0x4c, 0x36, 0x02, 0xe7, 0xa0, 0xc4, 0xc8, 0x9e, 0xea, 0xbf, 0x8a, 0xd2,
    0x40, 0xc7, 0x38, 0xb5, 0xa3, 0xf7, 0xf2, 0xce, 0xf9, 0x61, 0x15, 0xa1,
    0xe0, 0xae, 0x5d, 0xa4, 0x9b, 0x34, 0x1a, 0x55, 0xad, 0x93, 0x32, 0x30,
    0xf5, 0x8c, 0xb1, 0xe3, 0x1d, 0xf6, 0xe2, 0x2e, 0x82, 0x66, 0xca, 0x60,
    0xc0, 0x29, 0x23, 0xab, 0x0d, 0x53, 0x4e, 0x6f, 0xd5, 0xdb, 0x37, 0x45,
    0xde, 0xfd, 0x8e, 0x2f, 0x03, 0xff, 0x6a, 0x72, 0x6d, 0x6c, 0x5b, 0x51,
    0x8d, 0x1b, 0xaf, 0x92, 0xbb, 0xdd, 0xbc, 0x7f, 0x11, 0xd9, 0x5c, 0x41,
    0x1f, 0x10, 0x5a, 0xd8, 0x0a, 0xc1, 0x31, 0x88, 0xa5, 0xcd, 0x7b, 0xbd,
    0x2d, 0x74, 0xd0, 0x12, 0xb8, 0xe5, 0xb4, 0xb0, 0x89, 0x69, 0x97, 0x4a,
    0x0c, 0x96, 0x77, 0x7e, 0x65, 0xb9, 0xf1, 0x09, 0xc5, 0x6e, 0xc6, 0x84,
    0x18, 0xf0, 0x7d, 0xec, 0x3a, 0xdc, 0x4d, 0x20, 0x79, 0xee, 0x5f, 0x3e,
    0xd7, 0xcb, 0x39, 0x48,
  ];

  const CK = [
    0x00070e15, 0x1c232a31, 0x383f464d, 0x545b6269, 0x70777e85, 0x8c939aa1,
    0xa8afb6bd, 0xc4cbd2d9, 0xe0e7eef5, 0xfc030a11, 0x181f262d, 0x343b4249,
    0x50575e65, 0x6c737a81, 0x888f969d, 0xa4abb2b9, 0xc0c7ced5, 0xdce3eaf1,
    0xf8ff060d, 0x141b2229, 0x30373e45, 0x4c535a61, 0x686f767d, 0x848b9299,
    0xa0a7aeb5, 0xbcc3cad1, 0xd8dfe6ed, 0xf4fb0209, 0x10171e25, 0x2c333a41,
    0x484f565d, 0x646b7279,
  ];

  /**
   * 16 进制串转字节数组
   */
  function hexToArray(str) {
    const arr = [];
    for (let i = 0, len = str.length; i < len; i += 2) {
      arr.push(parseInt(str.substr(i, 2), 16));
    }
    return arr;
  }

  /**
   * 字节数组转 16 进制串
   */
  function ArrayToHex(arr) {
    return arr
      .map((item) => {
        item = item.toString(16);
        return item.length === 1 ? "0" + item : item;
      })
      .join("");
  }

  /**
   * utf8 串转字节数组
   */
  function utf8ToArray(str) {
    const arr = [];

    for (let i = 0, len = str.length; i < len; i++) {
      const point = str.codePointAt(i);

      if (point <= 0x007f) {
        // 单字节，标量值：00000000 00000000 0zzzzzzz
        arr.push(point);
      } else if (point <= 0x07ff) {
        // 双字节，标量值：00000000 00000yyy yyzzzzzz
        arr.push(0xc0 | (point >>> 6)); // 110yyyyy（0xc0-0xdf）
        arr.push(0x80 | (point & 0x3f)); // 10zzzzzz（0x80-0xbf）
      } else if (point <= 0xd7ff || (point >= 0xe000 && point <= 0xffff)) {
        // 三字节：标量值：00000000 xxxxyyyy yyzzzzzz
        arr.push(0xe0 | (point >>> 12)); // 1110xxxx（0xe0-0xef）
        arr.push(0x80 | ((point >>> 6) & 0x3f)); // 10yyyyyy（0x80-0xbf）
        arr.push(0x80 | (point & 0x3f)); // 10zzzzzz（0x80-0xbf）
      } else if (point >= 0x010000 && point <= 0x10ffff) {
        // 四字节：标量值：000wwwxx xxxxyyyy yyzzzzzz
        i++;
        arr.push(0xf0 | ((point >>> 18) & 0x1c)); // 11110www（0xf0-0xf7）
        arr.push(0x80 | ((point >>> 12) & 0x3f)); // 10xxxxxx（0x80-0xbf）
        arr.push(0x80 | ((point >>> 6) & 0x3f)); // 10yyyyyy（0x80-0xbf）
        arr.push(0x80 | (point & 0x3f)); // 10zzzzzz（0x80-0xbf）
      } else {
        // 五、六字节，暂时不支持
        arr.push(point);
        throw new Error("input is not supported");
      }
    }

    return arr;
  }

  /**
   * 字节数组转 utf8 串
   */
  function arrayToUtf8(arr) {
    const str = [];
    for (let i = 0, len = arr.length; i < len; i++) {
      if (arr[i] >= 0xf0 && arr[i] <= 0xf7) {
        // 四字节
        str.push(
          String.fromCodePoint(
            ((arr[i] & 0x07) << 18) +
              ((arr[i + 1] & 0x3f) << 12) +
              ((arr[i + 2] & 0x3f) << 6) +
              (arr[i + 3] & 0x3f)
          )
        );
        i += 3;
      } else if (arr[i] >= 0xe0 && arr[i] <= 0xef) {
        // 三字节
        str.push(
          String.fromCodePoint(
            ((arr[i] & 0x0f) << 12) +
              ((arr[i + 1] & 0x3f) << 6) +
              (arr[i + 2] & 0x3f)
          )
        );
        i += 2;
      } else if (arr[i] >= 0xc0 && arr[i] <= 0xdf) {
        // 双字节
        str.push(
          String.fromCodePoint(((arr[i] & 0x1f) << 6) + (arr[i + 1] & 0x3f))
        );
        i++;
      } else {
        // 单字节
        str.push(String.fromCodePoint(arr[i]));
      }
    }

    return str.join("");
  }

  /**
   * 32 比特循环左移
   */
  function rotl(x, y) {
    return (x << y) | (x >>> (32 - y));
  }

  /**
   * 非线性变换
   */
  function byteSub(a) {
    return (
      ((Sbox[(a >>> 24) & 0xff] & 0xff) << 24) |
      ((Sbox[(a >>> 16) & 0xff] & 0xff) << 16) |
      ((Sbox[(a >>> 8) & 0xff] & 0xff) << 8) |
      (Sbox[a & 0xff] & 0xff)
    );
  }

  /**
   * 线性变换，加密/解密用
   */
  function l1(b) {
    return b ^ rotl(b, 2) ^ rotl(b, 10) ^ rotl(b, 18) ^ rotl(b, 24);
  }

  /**
   * 线性变换，生成轮密钥用
   */
  function l2(b) {
    return b ^ rotl(b, 13) ^ rotl(b, 23);
  }

  /**
   * 以一组 128 比特进行加密/解密操作
   */
  function sms4Crypt(input, output, roundKey) {
    const x = new Array(4);

    // 字节数组转成字数组（此处 1 字 = 32 比特）
    const tmp = new Array(4);
    for (let i = 0; i < 4; i++) {
      tmp[0] = input[4 * i] & 0xff;
      tmp[1] = input[4 * i + 1] & 0xff;
      tmp[2] = input[4 * i + 2] & 0xff;
      tmp[3] = input[4 * i + 3] & 0xff;
      x[i] = (tmp[0] << 24) | (tmp[1] << 16) | (tmp[2] << 8) | tmp[3];
    }

    // x[i + 4] = x[i] ^ l1(byteSub(x[i + 1] ^ x[i + 2] ^ x[i + 3] ^ roundKey[i]))
    for (let r = 0, mid; r < 32; r += 4) {
      mid = x[1] ^ x[2] ^ x[3] ^ roundKey[r + 0];
      x[0] ^= l1(byteSub(mid)); // x[4]

      mid = x[2] ^ x[3] ^ x[0] ^ roundKey[r + 1];
      x[1] ^= l1(byteSub(mid)); // x[5]

      mid = x[3] ^ x[0] ^ x[1] ^ roundKey[r + 2];
      x[2] ^= l1(byteSub(mid)); // x[6]

      mid = x[0] ^ x[1] ^ x[2] ^ roundKey[r + 3];
      x[3] ^= l1(byteSub(mid)); // x[7]
    }

    // 反序变换
    for (let j = 0; j < 16; j += 4) {
      output[j] = (x[3 - j / 4] >>> 24) & 0xff;
      output[j + 1] = (x[3 - j / 4] >>> 16) & 0xff;
      output[j + 2] = (x[3 - j / 4] >>> 8) & 0xff;
      output[j + 3] = x[3 - j / 4] & 0xff;
    }
  }

  /**
   * 密钥扩展算法
   */
  function sms4KeyExt(key, roundKey, cryptFlag) {
    const x = new Array(4);

    // 字节数组转成字数组（此处 1 字 = 32 比特）
    const tmp = new Array(4);
    for (let i = 0; i < 4; i++) {
      tmp[0] = key[0 + 4 * i] & 0xff;
      tmp[1] = key[1 + 4 * i] & 0xff;
      tmp[2] = key[2 + 4 * i] & 0xff;
      tmp[3] = key[3 + 4 * i] & 0xff;
      x[i] = (tmp[0] << 24) | (tmp[1] << 16) | (tmp[2] << 8) | tmp[3];
    }

    // 与系统参数做异或
    x[0] ^= 0xa3b1bac6;
    x[1] ^= 0x56aa3350;
    x[2] ^= 0x677d9197;
    x[3] ^= 0xb27022dc;

    // roundKey[i] = x[i + 4] = x[i] ^ l2(byteSub(x[i + 1] ^ x[i + 2] ^ x[i + 3] ^ CK[i]))
    for (let r = 0, mid; r < 32; r += 4) {
      mid = x[1] ^ x[2] ^ x[3] ^ CK[r + 0];
      roundKey[r + 0] = x[0] ^= l2(byteSub(mid)); // x[4]

      mid = x[2] ^ x[3] ^ x[0] ^ CK[r + 1];
      roundKey[r + 1] = x[1] ^= l2(byteSub(mid)); // x[5]

      mid = x[3] ^ x[0] ^ x[1] ^ CK[r + 2];
      roundKey[r + 2] = x[2] ^= l2(byteSub(mid)); // x[6]

      mid = x[0] ^ x[1] ^ x[2] ^ CK[r + 3];
      roundKey[r + 3] = x[3] ^= l2(byteSub(mid)); // x[7]
    }

    // 解密时使用反序的轮密钥
    if (cryptFlag === DECRYPT) {
      for (let r = 0, mid; r < 16; r++) {
        mid = roundKey[r];
        roundKey[r] = roundKey[31 - r];
        roundKey[31 - r] = mid;
      }
    }
  }

  function sm4(
    inArray,
    key,
    cryptFlag,
    { padding = "pkcs#7", mode, iv = [], output = "string" } = {}
  ) {
    if (mode === "cbc") {
      // CBC 模式，默认走 ECB 模式
      if (typeof iv === "string") iv = hexToArray(iv);
      if (iv.length !== 128 / 8) {
        // iv 不是 128 比特
        throw new Error("iv is invalid");
      }
    }

    // 检查 key
    if (typeof key === "string") key = hexToArray(key);
    if (key.length !== 128 / 8) {
      // key 不是 128 比特
      throw new Error("key is invalid");
    }

    // 检查输入
    if (typeof inArray === "string") {
      if (cryptFlag === ENCRYPT) {
        // 加密，输入为 utf8 串
        inArray = utf8ToArray(inArray);
      } else if (cryptFlag === DECRYPT) {
        // 解密，输入为 16 进制串
        inArray = hexToArray(inArray);
      }
    } else {
      inArray = [...inArray];
    }

    // 新增填充，sm4 是 16 个字节一个分组，所以统一走到 pkcs#7
    if (
      (padding === "pkcs#5" || padding === "pkcs#7") &&
      cryptFlag !== DECRYPT
    ) {
      const paddingCount = BLOCK - (inArray.length % BLOCK);
      for (let i = 0; i < paddingCount; i++) inArray.push(paddingCount);
    }

    // 生成轮密钥
    const roundKey = new Array(ROUND);
    sms4KeyExt(key, roundKey, cryptFlag);

    const outArray = [];
    let lastVector = iv;
    let restLen = inArray.length;
    let point = 0;
    while (restLen >= BLOCK) {
      const input = inArray.slice(point, point + 16);
      const output = new Array(16);

      if (mode === "cbc") {
        for (let i = 0; i < BLOCK; i++) {
          if (cryptFlag !== DECRYPT) {
            // 加密过程在组加密前进行异或
            input[i] ^= lastVector[i];
          }
        }
      }

      sms4Crypt(input, output, roundKey);

      for (let i = 0; i < BLOCK; i++) {
        if (mode === "cbc") {
          if (cryptFlag === DECRYPT) {
            // 解密过程在组解密后进行异或
            output[i] ^= lastVector[i];
          }
        }

        outArray[point + i] = output[i];
      }

      if (mode === "cbc") {
        if (cryptFlag !== DECRYPT) {
          // 使用上一次输出作为加密向量
          lastVector = output;
        } else {
          // 使用上一次输入作为解密向量
          lastVector = input;
        }
      }

      restLen -= BLOCK;
      point += BLOCK;
    }

    // 去除填充，sm4 是 16 个字节一个分组，所以统一走到 pkcs#7
    if (
      (padding === "pkcs#5" || padding === "pkcs#7") &&
      cryptFlag === DECRYPT
    ) {
      const paddingCount = outArray[outArray.length - 1];
      outArray.splice(outArray.length - paddingCount, paddingCount);
    }

    // 调整输出
    if (output !== "array") {
      if (cryptFlag !== DECRYPT) {
        // 加密，输出转 16 进制串
        return ArrayToHex(outArray);
      } else {
        // 解密，输出转 utf8 串
        return arrayToUtf8(outArray);
      }
    } else {
      return outArray;
    }
  }

  const encryptContent = JSON.stringify({
    userId: userId,
    requestTime: 0,
    redirectURL: redirectURL,
  });

  return sm4(encryptContent, "86C63180C2806ED1F47B859DE501215B", 1);
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
const OA_PUSH_HOST = global.env.OA_PUSH_HOST;
//系统来源代码TODO:待文双确定
const sysCode = global.env.sysCode;
//部门名称TODO:待文双确定
const deptName = global.env.deptName;
// one的登录地址
const DEVOPS_HOST = global.env.ONE_LOGIN_HOST || "http://devops.tsp.hsb.biz";
//代办事项类型 1:待办,2:待处,3:待批,4待阅
const type = 1;
//事项缓急程度 0特急，1加急，2普通
const Level = 2;

try {
  const { itemId, itemKey, title, workspace } = body;

  printLogs(`接收到事项 ${itemId} 的标题为 ${title} 的待办发送请求`);

  printLogs("开始查询事项的当前处理人列表");

  const userListResult = await apis.requestCoreApi(
    "GET",
    `/parse/api/workflows/${itemId}/available-users`
  );

  printLogs("事项当前处理人列表查询完毕，数据为", userListResult);

  printLogs("开始事项的当前处理人列表数据");

  // 每一个用户的 username 由 username(nickname) 组成， 从中拆解出实际的 nickname
  const userList = userListResult?.map(
    ({ username }) => username.split("(")[1]?.replace(')', '')
  );

  printLogs("开始整合向新门户平台传递待办信息列表数据");

  const REQUEST_PARAMS = {
    sign,
    backList: userList.map((username) => {
      printLogs(`整合加密向 ${username} 用户传递待办信息的单点登录路径`);

      // proxima事项详情页面
      const itemDetailPage = `${DEVOPS_HOST}/project/osc/workspaces/${workspace}/item/${itemKey}`;

      printLogs(`生成事项详情页面地址为`, itemDetailPage);

      printLogs('加密用户信息与事项详情地址信息');

      const cryptoSign = buildUrlSm4(username, itemDetailPage);

      const redirectUrl = `${DEVOPS_HOST}/api/facade/rest/v1/users/login/directLogin?sign=${cryptoSign}`;

      printLogs('将加密信息与One登陆登录地址组成待办跳转地址，结果为', redirectUrl);

      return {
        type, // 待办类型
        title, // 待办标题
        Level, // 待办紧急程度
        sysCode, // 系统标识
        deptName, // 部门名称
        url: redirectUrl, // 跳转地址
        userCode: username, // 待办接收人
        affairId: username + "-" + uuid(), // 待办标识，唯一ID
        occurrenctTime: getCurrentTime(),
      };
    }),
  };

  printLogs("待办信息数据整合完成，数据为", REQUEST_PARAMS);

  printLogs("开始向新门户传递待办信息列表, 请求地址为", OA_PUSH_HOST);

  const result = await apis.post(OA_PUSH_HOST, REQUEST_PARAMS, {
    "Content-Type": "application/json;charset=utf-8",
  });

  printLogs("徽商待办事项推送完成，徽商响应信息为", result?.data);


  const todoRecords = [];
  for( const record of (REQUEST_PARAMS?.backList || [])) {
    const build = await apis.getParseObject(true, 'TodoRecord');
    build.set('itemId', itemId);
    build.set('affairId', record?.affairId);
    todoRecords.push(build);
  };

  apis.saveAllObject(todoRecords);

  return {
    result: result?.data,
    data: REQUEST_PARAMS,
  };
} catch (error) {
  printLogs("推送待办事项失败，错误信息为", error);

  return error;
}
