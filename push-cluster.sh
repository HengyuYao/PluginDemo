#!/bin/bash

set -e;

# 集群命名空间
NAMESPACE=proxima-hs

# Proxima-Core Pod名称
POD_NAME=gitee-proxima-core-5b8bd4966b-wsg89

# 插件的UID
PLUGIN_UID=b2008172-93bf-4393-97bc-efde86b61848

echo "开始更新应用";

kubectl -n $NAMESPACE cp trigger $POD_NAME:/parse-server/apps/$PLUGIN_UID

kubectl -n $NAMESPACE cp manifest.yml $POD_NAME:/parse-server/apps/$PLUGIN_UID

echo "应用更新完成";
