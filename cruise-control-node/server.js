require('dotenv').config({path: `${__dirname}/.env`}); 
const express = require('express');
const { exec } = require('child_process');
const app = express();
const { Kafka } = require('kafkajs');
const os = require('os')
const cors = require('cors');
//const WebSocket = require('ws');
const { Client } = require('ssh2');
require('promise.allsettled').shim();

const port = 3000; //backend port for node
//const CRUISE_CONTROL_URL = 'http://10.140.129.31'
const CRUISE_CONTROL_URL = process.env.CRUISE_CONTROL_URL;
console.log('CRUISE_CONTROL_URL:', CRUISE_CONTROL_URL);
const CRUISE_CONTROL_PORT = '9090';
//let hosts_all = ['10.156.21.47', '10.156.21.48', '10.140.129.30', '10.140.129.32', '10.140.129.31', '10.156.21.49', '10.156.21.46']

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

app.get('/log-files/:param1/:param2', async (req, res) => {
    console.log(req.params)
	const { param1, param2 } = req.params; // Access route parameter
		//let result = '';
		if(param1 === 'server_logs') {
			console.log(param2);
			// Configure SSH details
			const sshConfig = {
			  host: param2, // Replace with your remote server IP
			  port: process.env[`PORT_${param2}`],     //SSH port
			  username: process.env[`USER_${param2}`], //SSH username
			  password: process.env[`PASS_${param2}`] //Password for authentication
			};
			const conn = new Client();
			conn.on('ready', () => {
			    conn.exec('ls -lt /opt/kafka/logs/server.*', (err, stream) => {
				  if (err) {
					conn.end();
					return res.status(500).send(`Error executing command: ${err.message}`);
				  }
					let output = '';
					stream.on('close', (code, signal) => {
						console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
						const fileNames = output.split('\n').filter(file => file.trim() !== '');
						const onlyFileNames = fileNames.map(entry => entry.split('/').pop());
						console.log(onlyFileNames);
						res.status(200).json(onlyFileNames);
						conn.end();
					}).on('data', (data) => {
						output += data.toString();
					}).stderr.on('data', (data) => {
						console.error('STDERR: ' + data);
					});
						  
				});
			}).connect(sshConfig);		
		}
		
});

app.get('/log-data/:param1/:param2/:param3', async (req, res) => {
 try {
	console.log('in log-data api');
    console.log(req.params)
	const { param1, param2, param3 } = req.params; // Access route parameter
		//let result = '';
		if(param1 === 'server_logs') {
			console.log(param2);
			// Configure SSH details
			const sshConfig = {
			  host: param2, // Replace with your remote server IP
			  port: process.env[`PORT_${param2}`],     //SSH port
			  username: process.env[`USER_${param2}`], //SSH username
			  password: process.env[`PASS_${param2}`] //Password for authentication
			};
			// Path to your log file
			const baseLogPath = process.env.KAFKA_LOG_PATH; // Update with your log file name
			const remoteLogFilePath = baseLogPath + '/' + param3; // Construct the full path

            const conn = new Client();
			conn.on('ready', () => {
				conn.exec(`cat ${remoteLogFilePath}`, (err, stream) => {
				  if (err) {
					console.error('Error executing command:', err);
					return res.status(500).send('Error reading log file');
				  }

				  let logData = '';
				  stream.on('data', (chunk) => {
					logData += chunk;
				  });

				  stream.on('close', (code, signal) => {
					conn.end();
					//res.send(`<pre>${logData}</pre>`); // Send log data as response
					//logData = logData.replace(/(WARN)/g, '<span class="highlight">$1</span>');
					/*const filteredLogs = logData.filter(log => 
						log.level === 'ERROR' || log.level === 'WARNING' || log.level === 'WARN'
					);*/
					res.status(200).json({logData});
				  });
				});
		    }).connect(sshConfig);
			
		}
     } catch (error) {
        res.status(500).send(error.message);
    }		
});

//service to get all topic names
app.get('/topics', async (req, res) => {
 try {
	  console.log('in topics api');
	  let hosts_all = process.env.hosts_all.split(',')
      let result = '';
   	  // Configure SSH details
		  const sshConfig = {
			host: hosts_all[0], // Replace with your remote server IP
			port: process.env[`PORT_${hosts_all[0]}`],     //SSH port
			username: process.env[`USER_${hosts_all[0]}`], //SSH username
			password: process.env[`PASS_${hosts_all[0]}`] //SSH password
		 };
		 const conn = new Client();
		 const kafkaTopicsPath = `${process.env.KAFKA_BIN_PATH}/kafka-topics.sh`;

		 conn.on('ready', () => {
			 //conn.exec(`${kafkaTopicsPath} --list --bootstrap-server ${sshConfig.host}:9092 | grep -v '^__' `,  { cwd: process.env.KAFKA_BIN_PATH }, (err, stream) => {
			 conn.exec(`${kafkaTopicsPath} --describe --bootstrap-server ${sshConfig.host}:9092 |  sed 's/\x1b\[[0-9;]*m//g' | grep -E 'Topic:|PartitionCount:|ReplicationFactor:' `,  { cwd: process.env.KAFKA_BIN_PATH }, (err, stream) => {
				if (err) {
					conn.end();
					return res.status(500).send(`Error executing command: ${err.message}`);
				}
				  //let result = '';
				stream.on('close', (code, signal) => {
					conn.end();
					console.log(result)
					res.send(result);
				}).on('data', (data) => {
					result += data;
				}).stderr.on('data', (data) => {
						result += `stderr: ${data}`;
				});
			});
		}).connect(sshConfig);
		//res.send(result);
		
    } catch (error) {
        res.status(500).send(error.message);
    }
});

if (!Array.prototype.flat) {
  Array.prototype.flat = function(depth = 1) {
    return this.reduce(function(flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) && (depth > 1)
        ? toFlatten.flat(depth - 1)
        : toFlatten);
    }, []);
  };
}

let hosts_all = process.env.hosts_all.split(',')
const kafka = new Kafka({
  clientId: 'caps-app',
  brokers: hosts_all.map(host => `${host}:9092`) // Replace with your Kafka broker addresses
});
let consumer;
/*const timestamp = Date.now();
const groupId = `caps-group-${timestamp}`;
const consumer = kafka.consumer({ groupId });*/

if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function (callback) {
    return [].concat(...this.map(callback));
  };
}

// Function to consume messages from a given topic
async function consumeMessages(topic, count) {
 console.log('total messages')
 console.log(count)
 if (consumer) {
    await consumer.disconnect();
 }
 const timestamp = Date.now();
 const groupId = `caps-group-${timestamp}`;
 consumer = kafka.consumer({ groupId });
 const messages = [];

 try {
   await consumer.connect();
   await consumer.subscribe({ topic, fromBeginning: true });
   return new Promise((resolve, reject) => {
	  let messageCount = 0; // Track the number of messages consumed
      const maxMessages = 1000; 
	  
	  // Set a timeout to ensure we don't wait forever
      const timeout = setTimeout(() => {
        console.log('Max time reached or no messages, stopping consumer.');
        consumer.disconnect(); // Stop consumer after timeout
        resolve(messages); // Resolve with the messages we've consumed
      }, 5000); // 5 seconds timeout
	  
      consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
      const { offset, key, value } = message;
      /*console.log({
		partition,
        offset,
        key: key ? key.toString() : null, // Kafka key might be null
        value: value.toString(),
	  });*/
	  
	  messages.push({
          partition,
          offset,
          key: key ? key.toString() : null,
          value: value ? value.toString() : null,
      });
	  messageCount++;
     // Stop consuming after reaching maxMessages or after a set amount of time
      if (messageCount >= maxMessages) {
          clearTimeout(timeout);
          console.log('Max messages reached, stopping consumer.');
          consumer.disconnect();
          resolve(messages);
      }
     },
	}).catch((error) => {
        clearTimeout(timeout); // Clear timeout if there's an error
        console.error('Error in consuming messages:', error);
        reject(error); // Reject the promise on error
      }); // If there's an error, reject the promise
   });
  } catch (error) {
    console.error('Error in consuming messages:', error);
    throw error;
  }
}

/*// Handle consumer crashes
consumer.on('consumer.crash', (error) => {
  console.error('Consumer crashed:', error);
  // Restart consumer logic can go here if needed
});*/

// Endpoint to receive topic name from Vue.js client
app.post('/consume', async (req, res) => {
  const { topicName } = req.body; // Topic name from Vue.js client
  try {
	 const messageCountData = getTopicMessageCount(topicName)
	 console.log('messageCountData', messageCountData)
	  
    const data = await consumeMessages(topicName, messageCountData);
    res.status(200).send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error consuming messages');
  }
});

// Optional: Graceful shutdown to disconnect the consumer when server is stopped
process.on('SIGINT', async () => {
  await consumer.disconnect();
  console.log('Kafka consumer disconnected gracefully');
  process.exit(0);
});

async function getTopicMessageCount(topic) {
  const admin = kafka.admin();  // Create an Admin instance to fetch topic and partition information
  await admin.connect();        // Connect to Kafka Admin API

  try {
    // Fetch the offsets for all partitions of the topic
    const partitions = await admin.fetchTopicOffsets(topic);
	console.log('partitions count', partitions);
	if (!partitions || partitions.length === 0) {
      throw new Error('No partitions found for the topic');
    }
    
    let totalMessages = 0;  // Variable to store the total message count across all partitions
    const offsetDetails = partitions.map((partition) => {
	 // Check if offsets exist before proceeding
      if (!partition.offsets || partition.offsets.length < 2) {
        console.error(`Offsets missing for partition ${partition.partition}`);
        return { partition: partition.partition, messageCount: 0 };
      }
      // For each partition, get the earliest and latest offsets
      const earliestOffset = partition.offsets[0].offset;
      const latestOffset = partition.offsets[1].offset;
      
      // Calculate the number of messages in the partition (latest offset - earliest offset)
      const messageCount = parseInt(latestOffset, 10) - parseInt(earliestOffset, 10);

      // Add this partition's message count to the total
      totalMessages += messageCount;

      // Log details for each partition
      console.log(`Partition: ${partition.partition}`);
      console.log(`Earliest Offset: ${earliestOffset}`);
      console.log(`Latest Offset: ${latestOffset}`);
      console.log(`Messages in Partition: ${messageCount}\n`);
      
      return {
        partition: partition.partition,
        earliestOffset,
        latestOffset,
        messageCount,
      };
    });

    // Log the total message count across all partitions
    console.log(`Total Messages in Topic "${topic}": ${totalMessages}`);

    // Return the offset details including message counts for all partitions and the total count
    return {
      totalMessages,
      offsetDetails,
    };
  } catch (error) {
    console.error('Error fetching topic offsets:', error);
    throw error;
  } finally {
    await admin.disconnect();  // Always disconnect after the operation
  }
}
/*
let messageBuffer = {};
let clients = []; // Initialize clients array
let consumer = null; // Single consumer for all connections
// Function to initialize WebSocket server
const startWebSocketServer = () => {
	const wss = new WebSocket.Server({ port: 8080 });
	console.log(wss)
	 if (!Array.isArray(clients)) {
		 clients = [];
	 }
	// Handle WebSocket connections
	wss.on('connection', (ws) => {
		console.log('Client connected');
		clients.push(ws);
		// Initialize messageBuffer for the new connection
		messageBuffer[ws] = ''; 
		 // Track last activity time for idle check
        let lastActivity = Date.now();

        // Periodic idle check every 10 seconds
        const idleCheckInterval = setInterval(() => {
            if (Date.now() - lastActivity > 30000) {  // 30 seconds idle timeout
                console.log('Client idle for too long, closing connection');
                ws.close();  // Close the connection if idle
                clearInterval(idleCheckInterval);  // Clear the idle check interval
            }
        }, 10000);  // Check every 10 seconds

		
		ws.on('message', (message) => {
			console.log('Received topic name:', message);
			startKafkaConsumer(message, ws, clients); // Start consuming messages for the requested topic

			// Optionally, you can respond to the client about successful subscription
			//ws.send(`Subscribed to topic: ${message}`);
			// Update last activity time when a message is received
            lastActivity = Date.now();
		});

		ws.on('close', () => {
			console.log('Client disconnected');
			clients = clients.filter(client => client !== ws);
			delete messageBuffer[ws];  // Clean up the buffer when the client disconnects
            clearInterval(idleCheckInterval);
			if (consumer) {
			   console.log('if kafka consumer running')
			   consumer.kill();
			   consumer = null; // Reset consumer
			}
			if (global.gc) {
			  console.log('Running garbage collection after socket close');
			  global.gc();  // Call the garbage collection function manually
			}
		});
		
	});
	//return { wss, clients }; // Return WebSocket server and clients array for further use
}
startWebSocketServer();
// Function to start Kafka consumer for a specific topic
const startKafkaConsumer = (topic, ws, clients) => {
	// Call GC before starting the process
    if (global.gc) global.gc();
	if (consumer) {
        console.log(`Already consuming topic: ${topic}`);
        //return; // If consumer is already running, skip starting a new one
		consumer.kill()
		consumer = null;
    }
	let hosts_all = process.env.hosts_all.split(',')
   	  // Configure SSH details
		 const sshConfig = {
			host: hosts_all[0], // Replace with your remote server IP
			port: process.env[`PORT_${hosts_all[0]}`],     //SSH port
			username: process.env[`USER_${hosts_all[0]}`], //SSH username
			password: process.env[`PASS_${hosts_all[0]}`] //SSH password
		 };
    const kafkaTopicsPath = `${process.env.KAFKA_BIN_PATH}/kafka-console-consumer.sh`;
    const kafkaCommand = `${kafkaTopicsPath} --bootstrap-server ${sshConfig.host}:9092 --topic ${topic} --from-beginning --property print.partition=true --property print.key=true --property print.offset=true`;
    
    consumer = exec(kafkaCommand, { cwd: process.env.KAFKA_BIN_PATH });
	console.log('consumer from exec')
	console.log(consumer)
    consumer.stdout.on('data', (data) => {
        console.log('Sending message:', data.toString());
        const messages = parseKafkaOutput(data);
		console.log('MESSAGES LENGTH', messages.length);
		if (messages.length === 0) {
            // If no valid messages, send a placeholder message
            broadcastMessage('No messages available in the topic', clients);
        } else {
			messages.forEach(message => {
				broadcastMessage(JSON.stringify(message), clients ,ws); // Broadcast each message in json
				//handleMessageFragmentation(ws, JSON.stringify(message))
			});
		}
    });

    consumer.stderr.on('data', (error) => {
        console.error('Error:', error.toString());
    });

    consumer.on('close', (code) => {
        console.log(`Consumer process exited with code ${code}`);
        broadcastMessage(`Consumer process for topic ${topic} ended`); // Notify clients that the consumer has stopped
        consumer = null; // Reset consumer when it ends
		// Call GC after process ends
        if (global.gc) global.gc();

    });

    consumer.on('error', (err) => {
        console.error('Failed to start Kafka consumer:', err);
        //ws.send(`Error starting consumer for topic ${topic}: ${err.message}`);
        ws.send(JSON.stringify({ error: `Error starting consumer for topic ${topic}: ${err.message}` }));
		consumer = null; // Reset consumer when it ends
    }); 
	// Handling the 'exit' event
    consumer.on('exit', (code, signal) => {
        console.log(`Consumer process exited (exit event) with code: ${code} and signal: ${signal}`);
        //ws.send(JSON.stringify({ message: `Consumer for topic ${topic} exited with code: ${code}, signal: ${signal}` }));
        consumer = null;
        // Clean up (optional)
        if (global.gc) global.gc();
    });
};

// Function to parse the Kafka console consumer output
const parseKafkaOutput = (output) => {
	console.log('output')
	
    const lines = output.trim().split('\n');

    return lines.map(line => {
        const parts = line.split(/\s+/); // Split by whitespace
		let offsetValue;
		
		// Check if parts[1] contains 'Offset:'
		if (parts[1] && parts[1].startsWith('Offset:')) {
           offsetValue = parts[1].split(':')[1]; 
		}   		
        return {
            partition: parts[0].split(':')[1], // Extract the partition number
			//offset: isValidOffset(parts[1].split(':')[1]) ? parseInt(parts[1].split(':')[1], 10) : null,
			offset: isValidOffset(offsetValue) ? offsetValue : "-",
            key: parts[2] === 'null' ? '-' : parts[2], // Convert to number or null
            message: parts[3] ? parts.slice(3).join(' ') : null // Join the rest as key
        };
    });
};

// Helper function to check if the offset is a valid number
const isValidOffset = (offset) => {
    return !isNaN(offset) && Number(offset) >= 0; // Ensure it's a number and non-negative

};
// Function to broadcast messages to all connected WebSocket clients
const broadcastMessage = (message, clients, ws) => {
	console.log('In broadcast Message', message)
	
	if (Array.isArray(clients)) {
		clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		})
	} else {
       console.error('Error: clients is not an array or is undefined.');
	}
	// After broadcasting, trigger garbage collection to clean up memory
    if (global.gc) global.gc();
};
// Function to handle WebSocket message buffering and reassembly
const handleMessageFragmentation = (ws, data) => {
	 if (!messageBuffer[ws]) {
        messageBuffer[ws] = ''; // Initialize buffer if not already
    }

    // Append the new chunk to the buffer
    messageBuffer[ws] += data;

    // Try to find complete messages in the buffer
    let messages = [];
    let lastIndex = 0;

    // Kafka message format: "Partition:1     Offset:1        null    hi this is new msgs"
    // We're looking for the part after the last "null" (the actual message content)
    const messageDelimiter = 'null';

    while (lastIndex < messageBuffer[ws].length) {
        const delimiterIndex = messageBuffer[ws].indexOf(messageDelimiter, lastIndex);

        // If no "null" delimiter found, break the loop (we don't have a complete message yet)
        if (delimiterIndex === -1) break;

        // Extract the message content after the last "null" delimiter
        const message = messageBuffer[ws].slice(delimiterIndex + messageDelimiter.length).trim();

        // Only add valid messages (non-empty)
        if (message) {
            messages.push(message);
        }

        // Update the index to the next position after the last "null"
        lastIndex = delimiterIndex + messageDelimiter.length;
    }

    // If we have complete messages, broadcast them to the client
    if (messages.length > 0) {
        messages.forEach(message => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ message }));
            }
        });
    }

    // Keep the remaining incomplete data in the buffer
    messageBuffer[ws] = messageBuffer[ws].slice(lastIndex);
};
*/
app.listen(port, () => {
    console.log(`Server running at ${CRUISE_CONTROL_URL}:${port}`);
	//console.log(`WebSocket server running at ${CRUISE_CONTROL_URL}:8080`);
});

