#!/bin/bash

echo "Creating k3d cluster 'awx-cluster'..."
k3d cluster create awx-cluster --servers 1 --agents 1 -p "8080:80@loadbalancer"

echo "Deploying AWX Operator..."
kubectl apply -k "github.com/ansible/awx-operator/config/default?ref=2.12.2"

echo "Waiting for AWX Operator to be ready..."
kubectl wait --for=condition=Ready pods --all -n awx --timeout=300s

echo "Creating AWX Deployment..."
cat <<EOF | kubectl apply -f -
apiVersion: awx.ansible.com/v1beta1
kind: AWX
metadata:
  name: awx-demo
  namespace: awx
spec:
  service_type: ClusterIP
  ingress_type: Ingress
  ingress_ingress_class_name: traefik
  hostname: localhost
EOF

echo "AWX deployment started. Run 'kubectl get pods -n awx' to check status."
echo "Once ready, you can access AWX at http://localhost:8080 (if port forwarded) or via the Codespace ports tab."
echo "Get the password with: kubectl get secret awx-demo-admin-password -n awx -o jsonpath='{.data.password}' | base64 --decode"
