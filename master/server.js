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
                cp.execFile('../master.sh', function(err, stdout, stderr){
                    console.log('finished binding');
                        fs.writeFile("./errors", err, err => {
                            if (err) {
                              console.error(err)
                              return
                            }
                            //file written successfully
                          }); 
                        fs.writeFile("./stdout", stdout, err => {
                            if (err) {
                              console.error(err)
                              return
                            }
                            //file written successfully
                          }; 
                        fs.writeFile("./stderr", stderr,err => {
                            if (err) {
                              console.error(err)
                              return
                            }
  //file written successfully
}); 

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
