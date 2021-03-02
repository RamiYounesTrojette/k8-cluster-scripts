#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
sudo swapoff -a
sudo hostnamectl set-hostname "master"
sudo apt remove --yes docker docker-engine docker.io containerd runc
sudo apt update
sudo apt --yes --no-install-recommends install apt-transport-https ca-certificates
wget --quiet --output-document=- https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/ubuntu $(lsb_release --codename --short) stable"
sudo apt update
sudo apt --yes --no-install-recommends install docker-ce docker-ce-cli containerd.io
sudo usermod --append --groups docker "$USER"
sudo systemctl enable docker
sudo systemctl start docker
sudo apt-get update && sudo apt-get install -y apt-transport-https gnupg2 curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update -y
sudo apt-get install -y kubectl
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
sudo apt-get install -y kubelet kubeadm
sudo apt-mark hold kubelet kubeadm kubectl
sudo systemctl daemon-reload
sudo systemctl restart kubelet
echo "net.bridge.bridge-nf-call-iptables=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
sudo kubeadm init --ignore-preflight-errors stringSlice > token.txt
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
sudo kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
sudo apt-get update -y

