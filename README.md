# Ansible & AWX in Codespaces

This repository is configured to run Ansible and AWX provided by `k3d` inside a GitHub Codespace.

## Getting Started

1. Open this repository in GitHub Codespaces.
2. Wait for the `postCreateCommand` to finish (it installs Ansible, k3d, and tools).
3. To start AWX, run the helper script in the terminal:

   ```bash
   bash start-awx.sh
   ```

   This script will:
   - Create a k3d cluster.
   - Install the AWX Operator.
   - Deploy a demo AWX instance.

## Accessing AWX

Once deployed (it may take a few minutes for the pods to start), you can access AWX:

- **URL**: `http://localhost:8080` (or via the **Ports** tab in VS Code).
- **Username**: `admin`
- **Password**: Run the following command to retrieve the admin password:

  ```bash
  kubectl get secret awx-demo-admin-password -n awx -o jsonpath='{.data.password}' | base64 --decode
  ```

## Tools Included

- **Ansible**: Pre-installed via pip.
- **k3d**: Lightweight Kubernetes for running AWX.
- **kubectl**: Kubernetes CLI.
- **AWX Operator**: Deployed via `start-awx.sh`.
