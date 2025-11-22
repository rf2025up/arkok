#!/bin/bash

# Sealos 状态检查脚本

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          Sealos 应用部署状态检查                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查 kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl 未安装${NC}"
    exit 1
fi

echo -e "${BLUE}📋 检查结果:${NC}"
echo

# 1. 检查命名空间
echo "1️⃣  命名空间检查"
if kubectl get namespace growark &> /dev/null; then
    echo -e "${GREEN}✅ 命名空间 'growark' 存在${NC}"
else
    echo -e "${RED}❌ 命名空间 'growark' 不存在${NC}"
    echo "   运行: kubectl create namespace growark"
    exit 1
fi
echo

# 2. 检查 Deployment
echo "2️⃣  Deployment 状态"
DEPLOY=$(kubectl get deployment -n growark -o json 2>/dev/null)
if [ -z "$DEPLOY" ]; then
    echo -e "${RED}❌ 未找到 Deployment${NC}"
    echo "   运行: kubectl apply -f k8s-deployment.yaml"
else
    DEPLOY_COUNT=$(echo "$DEPLOY" | jq '.items | length')
    if [ "$DEPLOY_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ 找到 $DEPLOY_COUNT 个 Deployment${NC}"
        kubectl get deployment -n growark
    else
        echo -e "${RED}❌ 没有 Deployment${NC}"
    fi
fi
echo

# 3. 检查 Pod
echo "3️⃣  Pod 状态"
PODS=$(kubectl get pods -n growark -o json 2>/dev/null)
if [ -z "$PODS" ]; then
    echo -e "${RED}❌ 未找到 Pod${NC}"
else
    POD_COUNT=$(echo "$PODS" | jq '.items | length')
    if [ "$POD_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ 找到 $POD_COUNT 个 Pod${NC}"

        RUNNING=$(echo "$PODS" | jq '[.items[] | select(.status.phase=="Running")] | length')
        PENDING=$(echo "$PODS" | jq '[.items[] | select(.status.phase=="Pending")] | length')
        FAILED=$(echo "$PODS" | jq '[.items[] | select(.status.phase=="Failed")] | length')

        echo "   运行中: $RUNNING"
        echo "   等待中: $PENDING"
        echo "   失败: $FAILED"

        if [ "$FAILED" -gt 0 ]; then
            echo -e "${RED}   ⚠️  有失败的 Pod，检查日志:${NC}"
            echo "   kubectl logs -n growark <pod-name>"
        fi

        echo
        kubectl get pods -n growark -o wide
    else
        echo -e "${RED}❌ 没有 Pod${NC}"
    fi
fi
echo

# 4. 检查 Service
echo "4️⃣  Service 和公网 IP"
SVCs=$(kubectl get svc -n growark -o json 2>/dev/null)
if [ -z "$SVCs" ]; then
    echo -e "${RED}❌ 未找到 Service${NC}"
else
    SVC_COUNT=$(echo "$SVCs" | jq '.items | length')
    if [ "$SVC_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ 找到 $SVC_COUNT 个 Service${NC}"

        # 检查 LoadBalancer
        LB_COUNT=$(echo "$SVCs" | jq '[.items[] | select(.spec.type=="LoadBalancer")] | length')
        if [ "$LB_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ 找到 $LB_COUNT 个 LoadBalancer 服务${NC}"

            # 获取外部 IP
            EXTERNAL_IP=$(echo "$SVCs" | jq -r '.items[] | select(.spec.type=="LoadBalancer") | .status.loadBalancer.ingress[0].ip' 2>/dev/null | head -1)

            if [ -z "$EXTERNAL_IP" ] || [ "$EXTERNAL_IP" = "null" ]; then
                echo -e "${YELLOW}⏳ 外部 IP 还在分配中... (<pending>)${NC}"
                echo "   请等待 3-5 分钟后重新检查"
                echo "   或运行: kubectl get svc -n growark --watch"
            else
                echo -e "${GREEN}✅ 外部 IP: $EXTERNAL_IP${NC}"
                echo
                echo -e "${BLUE}🌐 你的公网地址:${NC}"
                echo -e "${GREEN}   http://$EXTERNAL_IP${NC}"
                echo -e "${GREEN}   API: http://$EXTERNAL_IP/api${NC}"
                echo -e "${GREEN}   WebSocket: ws://$EXTERNAL_IP${NC}"
                echo

                # 测试连接
                echo -e "${BLUE}🧪 尝试测试连接...${NC}"
                if curl -s http://$EXTERNAL_IP/health > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ 健康检查成功！${NC}"
                    RESPONSE=$(curl -s http://$EXTERNAL_IP/health)
                    echo "   响应: $RESPONSE"
                else
                    echo -e "${YELLOW}⚠️  无法连接到 http://$EXTERNAL_IP/health${NC}"
                    echo "   可能原因:"
                    echo "   1. 应用还在启动中"
                    echo "   2. 网络连接问题"
                    echo "   3. 防火墙阻止"
                    echo
                    echo "   查看日志: kubectl logs -n growark -l app=backend -f"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  没有 LoadBalancer 服务${NC}"
            echo "   查看所有服务:"
            kubectl get svc -n growark -o wide
        fi
    else
        echo -e "${RED}❌ 没有 Service${NC}"
    fi
fi
echo

# 5. 检查 HPA
echo "5️⃣  自动扩缩容 (HPA)"
HPA=$(kubectl get hpa -n growark -o json 2>/dev/null)
if [ -z "$HPA" ]; then
    echo -e "${YELLOW}⚠️  未配置 HPA${NC}"
else
    HPA_COUNT=$(echo "$HPA" | jq '.items | length')
    if [ "$HPA_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ 配置了 $HPA_COUNT 个 HPA${NC}"
        kubectl get hpa -n growark
    fi
fi
echo

# 6. 检查资源使用
echo "6️⃣  资源使用情况"
if kubectl top pods -n growark &> /dev/null; then
    kubectl top pods -n growark
else
    echo -e "${YELLOW}⚠️  无法获取资源指标（metrics-server 可能未安装）${NC}"
fi
echo

# 7. 最近的事件
echo "7️⃣  最近的事件"
kubectl get events -n growark --sort-by='.lastTimestamp' | tail -5
echo

# 总结
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      检查完成                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

# 建议
echo -e "${BLUE}📝 建议:${NC}"
echo

if kubectl get svc -n growark -o json 2>/dev/null | jq -e '.items[] | select(.spec.type=="LoadBalancer" and .status.loadBalancer.ingress[0].ip)' > /dev/null 2>&1; then
    EXTERNAL_IP=$(kubectl get svc -n growark -o json | jq -r '.items[] | select(.spec.type=="LoadBalancer") | .status.loadBalancer.ingress[0].ip' | head -1)
    echo -e "${GREEN}✅ 应用已成功部署！${NC}"
    echo
    echo "后续步骤:"
    echo "1. 更新前端应用的 API_URL:"
    echo -e "${YELLOW}   REACT_APP_API_URL=http://$EXTERNAL_IP/api${NC}"
    echo "2. 部署前端应用到 Sealos"
    echo "3. 测试三端同步功能"
    echo
else
    echo -e "${YELLOW}⚠️  应用还未完全就绪${NC}"
    echo
    echo "检查清单:"
    echo "- [ ] Deployment 已创建"
    echo "- [ ] Pod 已启动 (状态为 Running)"
    echo "- [ ] LoadBalancer 已创建"
    echo "- [ ] 外部 IP 已分配 (不是 <pending>)"
    echo "- [ ] 健康检查通过"
    echo
    echo "调试建议:"
    echo "1. 查看 Pod 日志: kubectl logs -n growark -l app=backend -f"
    echo "2. 查看事件: kubectl get events -n growark"
    echo "3. 描述 Pod: kubectl describe pod -n growark <pod-name>"
    echo "4. 描述 Service: kubectl describe svc -n growark"
fi
echo
