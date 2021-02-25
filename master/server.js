const express = require('express');
const cp = require('child_process');
const cors = require('cors');
const http = require('http');
const querystring = require('querystring');
const bodyParser = require('body-parser');
const fs = require('fs');
const os = require('os');
const path = require('path');
const app = express();
const port = 8090;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
        res.send('OK');
})
var clusterReady = false;
var token = "";
var publicKey = "";
var nodeCounter = 1;
app.get('/checkCluser', (req, res) => {
        if(clusterReady == true)
                res.send('OK');
});
;

app.post('/', (req, res) => {
    console.log('starting kub binding');
    if(publicKey == ""){
        cp.exec('ssh-keygen -t rsa -N "" -f ~/.ssh/id_rsa', function(errr, stdoutt, stderrr){
            cp.exec('sudo -- sh -c "echo ' + req.body.slave + ' node' + nodeCounter + ' >> /etc/hosts"', function(errrr, stdouttt, stderrrr){
                
                console.log('key generated');  
                publicKey = fs.readFileSync(path.join(os.homedir(),'.ssh/id_rsa.pub'), 'utf8');
                    cp.execSync('sudo swapoff -a');
                    cp.execSync('sudo hostnamectl set-hostname "master"');
                    cp.execSync('curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -');
                    cp.execSync('sudo add-apt-repository    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \ $(lsb_release -cs) \ stable"');
                    cp.execSync('sudo apt-get update && sudo apt-get install -y apt-transport-https gnupg2 curl');
                    cp.execSync('curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -');
                    cp.execSync('echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list');
                    cp.execSync('sudo apt-get update -y');
                    cp.execSync('sudo apt-get install -y kubectl');
                    cp.execSync('sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl');
                    cp.execSync('sudo apt-get install docker-ce -y');
                    cp.execSync('sudo apt-get install -y kubelet kubeadm');
                    cp.execSync('sudo apt-mark hold kubelet kubeadm kubectl');
                    cp.execSync('sudo systemctl daemon-reload');
                    cp.execSync('sudo systemctl restart kubelet');
                    cp.execSync('echo "net.bridge.bridge-nf-call-iptables=1" | sudo tee -a /etc/sysctl.conf');
                    cp.execSync('sudo sysctl -p');
                    var tokenRes = cp.execSync('sudo kubeadm init --ignore-preflight-errors stringSlice');
                    cp.execSync('mkdir -p $HOME/.kube');
                    cp.execSync('sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config');
                    cp.execSync('sudo chown $(id -u):$(id -g) $HOME/.kube/config');
                    cp.execSync(String.raw`sudo kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"`);
                    cp.execSync('sudo apt-get update -y');
                        console.log('finished binding');
                        token = tokenRes.substring(tokenRes.lastIndexOf('kubeadm join'));
                        var data = querystring.stringify({
                            token: token,
                            key: publicKey,
                            slaveName: 'node' + nodeCounter
                        });
                        nodeCounter++;
                        var options = {
                         host: req.body.slave,
                         port: 8090,
                         path: '/bind',
                         method: 'POST',
                         headers: {
                           'Content-Type': 'application/x-www-form-urlencoded',
                           'Content-Length': Buffer.byteLength(data)
                         }
                        };
                        console.log('sending token to ' + req.body.slave);
                        var httpreq = http.request(options, function (response) {
                            response.on('data', function(datt) {
                                console.log(datt);
                            });
                            response.on('end', function() {
                                console.log('slave bound');
                                clusterReady = true;
                                res.send({'msg': 'OK'});
                            });
                        });
                        httpreq.write(data);
                        httpreq.end();
                        console.log('token sent');
            });
        });
    } else {
        cp.exec('sudo -- sh -c "echo ' + req.body.slave + ' node' + nodeCounter + ' >> /etc/hosts"', function(errrr, stdouttt, stderrrr){
            var data = querystring.stringify({
                        token: token,
                        key: publicKey,
                        slaveName: 'node' + nodeCounter
                    });
            nodeCounter++;
            var options = {
             host: req.body.slave,
             port: 8090,
             path: '/bind',
             method: 'POST',
             headers: {
               'Content-Type': 'application/x-www-form-urlencoded',
               'Content-Length': Buffer.byteLength(data)
             }
            };
            console.log('sending token to ' + req.body.slave);
            var httpreq = http.request(options, function (response) {
                response.on('data', function(datt) {
                    console.log(datt);
                });
                response.on('end', function() {
                    console.log('slave bound');
                    res.send({'msg': 'OK'});
                });
            });
            httpreq.write(data);
            httpreq.end();
            console.log('token sent');
        });
    }
});
var listener = app.listen(port, () => {
        console.log(`Web Server listening at ${port}`);
});
listener.timeout = 3600000;
