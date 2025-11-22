#!/bin/bash

# Growark 快速部署脚本 - Sealos版本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 检查前置条件
check_requirements() {
    print_info "检查前置条件..."

    # 检查 kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl 未安装"
        echo "请访问: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    print_success "kubectl 已安装"

    # 检查 docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker 未安装（可选，用于本地构建）"
    else
        print_success "Docker 已安装"
    fi

    # 检查 kubeconfig
    if ! kubectl cluster-info &> /dev/null; then
        print_error "无法连接到 Kubernetes 集群"
        echo "请确保 kubectl 已配置"
        exit 1
    fi
    print_success "Kubernetes 连接正常"
}

# 配置参数
configure_deployment() {
    print_info "配置部署参数..."

    read -p "应用名称 (默认: growark-backend): " APP_NAME
    APP_NAME=${APP_NAME:-growark-backend}

    read -p "命名空间 (默认: growark): " NAMESPACE
    NAMESPACE=${NAMESPACE:-growark}

    read -p "副本数 (默认: 3): " REPLICAS
    REPLICAS=${REPLICAS:-3}

    read -p "镜像地址 (默认: node:18-alpine): " IMAGE
    IMAGE=${IMAGE:-node:18-alpine}

    read -p "数据库主机 (默认: entr-postgresql.ns-ll4yxeb3.svc): " DB_HOST
    DB_HOST=${DB_HOST:-entr-postgresql.ns-ll4yxeb3.svc}

    read -p "数据库用户 (默认: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}

    read -sp "数据库密码 (默认: 4z2hdw8n): " DB_PASSWORD
    DB_PASSWORD=${DB_PASSWORD:-4z2hdw8n}
    echo

    read -p "CPU请求 (默认: 250m): " CPU_REQUEST
    CPU_REQUEST=${CPU_REQUEST:-250m}

    read -p "内存请求 (默认: 256Mi): " MEMORY_REQUEST
    MEMORY_REQUEST=${MEMORY_REQUEST:-256Mi}

    print_success "参数配置完成"
}

# 创建命名空间
create_namespace() {
    print_info "创建命名空间: $NAMESPACE"

    if kubectl get namespace $NAMESPACE &> /dev/null; then
        print_warning "命名空间已存在"
    else
        kubectl create namespace $NAMESPACE
        print_success "命名空间创建成功"
    fi
}

# 创建Secret
create_secret() {
    print_info "创建数据库密钥..."

    # 检查Secret是否已存在
    if kubectl get secret -n $NAMESPACE postgres-secret &> /dev/null; then
        print_warning "Secret已存在，跳过创建"
        return
    fi

    kubectl create secret generic postgres-secret \
        --from-literal=username=$DB_USER \
        --from-literal=password=$DB_PASSWORD \
        -n $NAMESPACE

    print_success "Secret创建成功"
}

# 创建ConfigMap
create_configmap() {
    print_info "创建配置映射..."

    # 检查ConfigMap是否已存在
    if kubectl get configmap -n $NAMESPACE backend-config &> /dev/null; then
        print_warning "ConfigMap已存在，跳过创建"
        return
    fi

    kubectl create configmap backend-config \
        --from-literal=NODE_ENV=production \
        --from-literal=PORT=3000 \
        --from-literal=DB_HOST=$DB_HOST \
        --from-literal=DB_PORT=5432 \
        --from-literal=DB_NAME=postgres \
        -n $NAMESPACE

    print_success "ConfigMap创建成功"
}

# 部署应用
deploy_application() {
    print_info "部署应用..."

    # 创建临时YAML文件
    TEMP_YAML=$(mktemp)

    cat > $TEMP_YAML << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $APP_NAME
  namespace: $NAMESPACE
  labels:
    app: backend
spec:
  replicas: $REPLICAS
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: $IMAGE
        imagePullPolicy: IfNotPresent
        workingDir: /app
        command:
          - /bin/sh
          - -c
          - |
            npm install --production && \\
            node server.js
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        envFrom:
        - configMapRef:
            name: backend-config
        env:
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 40
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        resources:
          requests:
            memory: "$MEMORY_REQUEST"
            cpu: "$CPU_REQUEST"
          limits:
            memory: "512Mi"
            cpu: "500m"
      restartPolicy: Always
      terminationGracePeriodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  name: $APP_NAME-svc
  namespace: $NAMESPACE
  labels:
    app: backend
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  sessionAffinity: ClientIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: $APP_NAME-hpa
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: $APP_NAME
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF

    kubectl apply -f $TEMP_YAML
    rm $TEMP_YAML

    print_success "应用部署成功"
}

# 等待部署就绪
wait_for_deployment() {
    print_info "等待部署就绪..."

    kubectl rollout status deployment/$APP_NAME -n $NAMESPACE --timeout=5m

    print_success "部署就绪"
}

# 获取服务信息
get_service_info() {
    print_info "获取服务信息..."

    # 等待外部IP分配
    print_info "等待负载均衡器分配外部IP..."
    for i in {1..30}; do
        EXTERNAL_IP=$(kubectl get service -n $NAMESPACE $APP_NAME-svc -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        if [ ! -z "$EXTERNAL_IP" ]; then
            break
        fi
        echo -n "."
        sleep 2
    done
    echo

    if [ ! -z "$EXTERNAL_IP" ]; then
        print_success "获取到外部IP: $EXTERNAL_IP"
    else
        print_warning "未能获取外部IP，请稍后手动检查"
        EXTERNAL_IP="<待分配>"
    fi

    # 获取Pod信息
    POD_COUNT=$(kubectl get pods -n $NAMESPACE -l app=backend -o json | jq '.items | length')

    echo
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║          部署完成！以下是你的服务信息          ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║ 应用名称:    $APP_NAME"
    echo "║ 命名空间:    $NAMESPACE"
    echo "║ 镜像:        $IMAGE"
    echo "║ 副本数:      $POD_COUNT / $REPLICAS"
    echo "║ 数据库:      $DB_HOST"
    echo "║"
    echo "║ 公网访问地址:"
    echo "║ API:         http://$EXTERNAL_IP/api"
    echo "║ WebSocket:   ws://$EXTERNAL_IP"
    echo "║ 健康检查:    http://$EXTERNAL_IP/health"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo
}

# 显示后续步骤
show_next_steps() {
    print_info "后续步骤："
    echo
    echo "1️⃣  配置前端应用（大屏和手机端）"
    echo "   在前端应用的环境变量中设置:"
    echo "   REACT_APP_API_URL=http://$EXTERNAL_IP/api"
    echo "   REACT_APP_WS_URL=ws://$EXTERNAL_IP"
    echo
    echo "2️⃣  查看部署日志"
    echo "   kubectl logs -n $NAMESPACE -l app=backend -f"
    echo
    echo "3️⃣  查看Pod状态"
    echo "   kubectl get pods -n $NAMESPACE"
    echo
    echo "4️⃣  查看服务状态"
    echo "   kubectl get svc -n $NAMESPACE"
    echo
    echo "5️⃣  查看自动扩缩容状态"
    echo "   kubectl get hpa -n $NAMESPACE"
    echo
    echo "6️⃣  测试API"
    echo "   curl http://$EXTERNAL_IP/health"
    echo
    echo "7️⃣  删除部署（如需要）"
    echo "   kubectl delete namespace $NAMESPACE"
    echo
}

# 主函数
main() {
    echo
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     Growark 快速部署到 Sealos                              ║"
    echo "║     Star Growth Ark - Deploy to Sealos                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo

    check_requirements
    echo
    configure_deployment
    echo
    create_namespace
    create_secret
    create_configmap
    echo
    deploy_application
    echo
    wait_for_deployment
    echo
    get_service_info
    show_next_steps

    print_success "部署脚本执行完成！"
}

# 捕获错误
trap 'print_error "脚本执行失败"; exit 1' ERR

# 运行主函数
main
