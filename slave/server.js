const express = require('express');
const cp = require('child_process');
const cors = require('cors');
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
});

app.post('/bind', (req, res) => {
    console.log('starting kub binding');
    cp.exec('ssh-keygen -t rsa -N "" -f ~/.ssh/id_rsa', function(errrr, stdouttt, stderrrr){
        console.log('key generated');  
        let publicKey = req.body.key;
        fs.appendFileSync(path.join(os.homedir(),'.ssh/authorized_keys'), publicKey);
        fs.appendFileSync('/etc/hosts', req.body.slaveIp + " " + req.body.nodeName);
        cp.execFile('../slave.sh', function(err, stdout, stderr){
            var token = 'sudo ' + req.body.token.replace(/\\n/g, '').replace(/\\\n/g, '');
             console.log(token);
             cp.exec(token, function(errr, stdoutt, stderrr){
                 console.log('bound');
                 res.send('OK');
             });
        });
    });
});
app.listen(port, () => {
        console.log(`Web Server listening at ${port}`);
});
