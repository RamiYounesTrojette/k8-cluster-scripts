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
                        var list1 = [];
                        var list2 = [];
                        var list3 = [];
                var executioner = cp.execFile('../master.sh', function(err, stdout, stderr){
                    console.log('finished binding');

                    token = stdout.substring(stdout.lastIndexOf('kubeadm join'), stdout.lastIndexOf('serviceaccount/weave-net created'));
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
                            res.send('OK');
                        });
                    });
                    httpreq.write(data);
                    httpreq.end();
                    console.log('token sent');
                });
                executioner.stdout.setEncoding('utf8');
                        executioner.stdout.on('data', function (chunk) {
                                list1.push(chunk);
                        });
                        executioner.stdout.on('end', function () {
                                fs.writeFile("./stdout.txt", list1.join(), erer => {
                                        if (eerr) {
                                                console.error(erer)
                                                return
                                        }
                                });
                        });
                        executioner.err.setEncoding('utf8');
                        executioner.err.on('data', function (chunk) {
                                list2.push(chunk);
                        });
                        executioner.err.on('end', function () {
                                fs.writeFile("./err.txt", list2.join(), erer => {
                                        if (erer) {
                                                console.error(erer)
                                                return
                                        }
                                });
                        });
                        executioner.stderr.setEncoding('utf8');
                        executioner.stderr.on('data', function (chunk) {
                                list3.push(chunk);
                        });
                        executioner.stderr.on('end', function () {
                                fs.writeFile("./stderr.txt", list3.join(), erer => {
                                        if (erer) {
                                                console.error(erer)
                                                return
                                        }
                                });
                        });
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
                    res.send('OK');
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
