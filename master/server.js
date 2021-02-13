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
var publicKey = "";
app.get('/checkCluser', (req, res) => {
        if(clusterReady == true)
                res.send('OK');
});
;

app.post('/', (req, res) => {
    console.log('starting kub binding');
    cp.exec('ssh-keygen -t rsa -N "" -f ~/.ssh/id_rsa', function(errr, stdoutt, stderrr){
        console.log('key generated');  
        publicKey = fs.readFileSync(path.join(os.homedir(),'.ssh/id_rsa.pub'), 'utf8');
        cp.execFile('../master.sh', function(err, stdout, stderr){
            console.log('finished binding');
            var data = querystring.stringify({
                token:stdout.substring(stdout.lastIndexOf('kubeadm join'), stdout.lastIndexOf('serviceaccount/weave-net created')),
                key: publicKey,
                slaveIp: req.body.slave
            });
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
                response.on('end', function() {
                    console.log('slave bound');
                    clusterReady = true;
                    res.send('ok');
                });
            });
            httpreq.write(data);
            httpreq.end();
            console.log('token sent');
        });
    });
});
app.listen(port, () => {
        console.log(`Web Server listening at ${port}`);
});
