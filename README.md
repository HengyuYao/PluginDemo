# ITSM对接插件

## 开发
`yarn dev`

## 构建
`yarn build`

## 插件打包
`yarn build-app`

## 需求文档
请查阅项目中的以下两个文档：

1. DevOps与ITSM系统对接20220510 v1.8.docx
2. 生产缺陷上线流程.docx


## 上线计划自动化配置

### 1 - 自动创建系统上线计划

#### 整体配置

![image-20220608153919440](https://s2.loli.net/2022/06/08/wBgDUG1lx3OVeJm.png)

#### Web请求配置

请求地址：http://gitee-proxima-core:1337/app/osc/system_communicate/webhooks/createSystemReleaseApproval

![image-20220608153933831](https://s2.loli.net/2022/06/08/h2I4vJOu3x8A6M7.png)

### 2 - 系统上线计划提交评估，同步上线计划状态

#### 整体配置

![image-20220608154213186](https://s2.loli.net/2022/06/08/eDbFNKhLQi3EonW.png)

#### 状态流转逻辑

当子【系统上线计划】全部提交评估后，将父【上线计划】流转至 风险评估中 状态。

### 3 - 系统上线计划提交评估，向ITSM同步系统上线计划

#### 整体配置

![image-20220608152405659](https://s2.loli.net/2022/06/08/7R5OjpSrWgznfQP.png)

#### Web请求配置

![image-20220608152519695](https://s2.loli.net/2022/06/08/knCoiQ35lT2m41y.png)

请求地址：http://gitee-proxima-core:1337/app/osc/system_communicate/webhooks/syncSystemReleaseApproval

### 4 - 根据系统上线计划评估结果，流转上线计划状态

#### 整体配置

![image-20220608152636930](https://s2.loli.net/2022/06/08/YPyJpi5LN3A2SKW.png)

#### 状态流转逻辑

1. 当存在【系统上线计划】评估未通过 时，父【上线计划】也流转至 评估未通过
2. 当所有子【系统上线计划】评估通过时，父【上线计划】流转至 评估通过状态

### 5 - 同步投产变更申请、需求审批单附件至系统上线计划

#### 整体配置

![image-20220608153535816](https://s2.loli.net/2022/06/08/B1pdVnwAJOxuzSW.png)

#### Web请求配置

请求地址：http://gitee-proxima-core:1337/app/osc/system_communicate/webhooks/setSystemReleaseAttachments

![image-20220608153611837](https://s2.loli.net/2022/06/08/DboZE9l6Gvzqdw7.png)

### 6 - 系统上线计划附件上传完毕，流转上线计划状态

#### 整体配置

![image-20220608153711774](https://s2.loli.net/2022/06/08/Jf3kKaP2sqpbEDV.png)

#### 状态流转逻辑

当子【系统上线计划】状态全部为 待投产 时，将【上线计划】状态流转至 牵头人复核。

### 7 - 牵头人复核附件完成，向 ITSM 同步系统上线计划附件

#### 整体配置

![image-20220608153241206](https://s2.loli.net/2022/06/08/H2V5K4ZhwlS8Asb.png)

#### Web请求配置

请求地址：http://gitee-proxima-core:1337/app/osc/system_communicate/webhooks/syncSystemReleaseAttachments

![image-20220608153254389](https://s2.loli.net/2022/06/08/WYD6SLcb5jIvx91.png)

### 8 - 根据系统上线计划上线结果，流转上线计划状态

#### 整体配置

![image-20220608154608416](https://s2.loli.net/2022/06/08/EyQiL2JMS6XgkpP.png)

#### Web请求配置

请求地址：http://gitee-proxima-core:1337/app/osc/system_communicate/webhooks/setReleasePlanStatus

![image-20220608154629746](https://s2.loli.net/2022/06/08/e6AcLam8okEC9r1.png)

#### 状态流转逻辑

- 子【系统上线计划】事项的上线结果相同，即均为 上线成功/上线取消/上线回退 中的某一个时，将父【上线计划】也流转至对应状态。其中，当子【系统上线计划】全部上线成功时，父【上线计划】流转 至业务验证状态。
- 子【系统上线计划】事项状态不一致时，将父【上线计划】状态流转至 人工确认 状态。

### 9 - 业务验证完成后，向 ITSM 同步验证结果

#### 整体配置

![image-20220608160012508](https://s2.loli.net/2022/06/08/AkPMmQKCaEfdlF6.png)

#### Web请求配置

请求地址：http://gitee-proxima-core:1337/app/osc/system_communicate/webhooks/syncOnlineVerifyResult

![image-20220608160036510](https://s2.loli.net/2022/06/08/ovapqsEQjWULklw.png)

### 10 - 上线完成后，流转业务需求状态

#### 整体配置

![image-20220608160154874](https://s2.loli.net/2022/06/08/kBh3uOfSm1vADxU.png)

#### 状态流转逻辑

- 当父【业务需求】下存在 版本 字段相同的【部分上线申请】事项时，将【业务需求】流转至 部分上线 状态

  ![image-20220608160452259](https://s2.loli.net/2022/06/08/jN7zxVGhQbSv6wE.png)

- 当父【业务需求】下的所有【部分上线申请】事项中的 版本 字段均与 【上线计划】不通，将【业务需求】流转至 全部上线状态

  ![image-20220608160502747](https://s2.loli.net/2022/06/08/RDPyOeKCWG46TZd.png)

## 缺陷上线计划自动化配置

### 1 - 向 ITSM 同步缺陷上线计划

#### 整体配置

![image-20220608160722228](https://s2.loli.net/2022/06/08/ID7AEH5GkXeJKfo.png)

#### Web请求配置

请求地址：http://gitee-proxima-core:1337/app/osc/system_communicate/webhooks/syncBugFixPlanApproval

![image-20220608160737506](https://s2.loli.net/2022/06/08/F2x39Bh84Rc1eb7.png)

### 2 - 向 ITSM 同步缺陷上线计划附件

### 整体配置

![image-20220608160828960](https://s2.loli.net/2022/06/08/3C8fM1KTnm6HYGO.png)

#### Web请求配置

请求地址：http://gitee-proxima-core:1337/app/osc/system_communicate/webhooks/syncBugFixAttachments

![image-20220608160840651](https://s2.loli.net/2022/06/08/J6NeCR5adBt1cfy.png)
