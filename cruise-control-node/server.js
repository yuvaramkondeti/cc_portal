require('dotenv').config({path: `${__dirname}/.env`}); 
const express = require('express');
const { exec } = require('child_process');
const app = express();
const os = require('os')
const cors = require('cors');
const { Client } = require('ssh2');
const port = 3000; //backend port for node
//const CRUISE_CONTROL_URL = 'http://10.140.129.31'
const CRUISE_CONTROL_URL = process.env.CRUISE_CONTROL_URL;
console.log('CRUISE_CONTROL_URL:', CRUISE_CONTROL_URL);
//let hos = '10.140.129.30'
//let str = 'PORT_';
//console.log(process.env[`PORT_${hos}`]) //SSH port
const CRUISE_CONTROL_PORT = '9090';
//let hosts_all = ['10.156.21.47', '10.156.21.48', '10.140.129.30', '10.140.129.32', '10.140.129.31', '10.156.21.49', '10.156.21.46']
//let hosts_all = process.env.hosts_all.split(',')

app.use(express.json());
// Use CORS middleware
app.use(express.urlencoded({ extended: true }));

// Optionally, you can configure CORS for specific origins and methods
app.use(cors({
  //origin: `${CRUISE_CONTROL_URL}':${CRUISE_CONTROL_PORT}`, // Allow only this origin', 
  origin: '*', // Allow only this origin', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// endpoint to start/stop Kafka 
app.post('/kafka-stop', async (req, res) => {
    try {
		const arrayParam = req.body;
		console.log(req.body)
		// Log the parameter
		console.log('in service stop')
		console.log('Array Parameter:', arrayParam);
		let result = '';
		arrayParam['params'].forEach((host) => {
			console.log(host);
			// Configure SSH details
			const sshConfig = {
			  host: host, // Replace with your remote server IP
			  port: process.env[`PORT_${host}`],     //SSH port
			  username: process.env[`USER_${host}`], //SSH username
			  password: process.env[`PASS_${host}`] //Password for authentication
			};
			const conn = new Client();
			conn.on('ready', () => {
				conn.exec('systemctl stop kafka', (err, stream) => {
				  if (err) {
					conn.end();
					return res.status(500).send(`Error executing command: ${err.message}`);
				  }

				  //let result = '';
				  stream.on('close', (code, signal) => {
					conn.end();
					console.log(result)
					//res.send(result);
				  }).on('data', (data) => {
					result += data;
				  }).stderr.on('data', (data) => {
					result += `stderr: ${data}`;
				  });
				});
			}).connect(sshConfig);
		});	
		res.send(result);
     } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/kafka-start', async (req, res) => {
    try {
		console.log(CRUISE_CONTROL_URL);
		let hosts_all = process.env.hosts_all.split(',')
		console.log(hosts_all)
		const arrayParam = req.body;
		// Log the array parameter
		//console.log('Array Parameter:', arrayParam);
		let result = '';
		hosts_all.forEach((host) => {
			console.log(host);
			// Configure SSH details
			const sshConfig = {
			  host: host, // Replace with your remote server IP
			  port: process.env[`PORT_${host}`],     //SSH port
			  username: process.env[`USER_${host}`], //SSH username
			  password: process.env[`PASS_${host}`] //SSH password
			  // privateKey: require('fs').readFileSync('/path/to/private/key') // Optionally use a private key
			};
			const conn = new Client();
			conn.on('ready', () => {
				conn.exec('systemctl start kafka', (err, stream) => {
				  if (err) {
					conn.end();
					return res.status(500).send(`Error executing command: ${err.message}`);
				  }

				  //let result = '';
				  stream.on('close', (code, signal) => {
					conn.end();
					console.log(result)
					//res.send(result);
				  }).on('data', (data) => {
					result += data;
				  }).stderr.on('data', (data) => {
					result += `stderr: ${data}`;
				  });
				});
			}).connect(sshConfig);
		});	
		res.send(result);
     } catch (error) {
        res.status(500).send(error.message);
    }
});


app.listen(port, () => {
    console.log(`Server running at ${CRUISE_CONTROL_URL}:${port}`);
});
