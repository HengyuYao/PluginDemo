#!/bin/bash

set -e;

# 集群命名空间
NAMESPACE=huishang

# Proxima-Core Pod名称
POD_NAME=gitee-proxima-core-6dc5b5bb49-28cmp

# 插件的UID
PLUGIN_UID=5e4dd0e2-7130-46c7-a405-d2937bb6f561

echo "开始更新应用";

kubectl -n $NAMESPACE cp trigger $POD_NAME:/parse-server/apps/osc/$PLUGIN_UID

kubectl -n $NAMESPACE cp manifest.yml $POD_NAME:/parse-server/apps/osc/$PLUGIN_UID

echo "应用更新完成";
