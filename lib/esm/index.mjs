/**
 * @author Kent Phung
 * @email daikhanh9260@gmail.com
 * @version 1.0.3
 * @license MIT
 * @link https://github.com/knfs-library/alb
 */

/**
 * Implements a simple application load balancer (ALB) using Node.js cluster module.
 * Distributes the incoming requests among multiple worker processes while maintaining 
 * minimum, maximum, and idle configurations.
 * 
 * @module ALB
 * @param {Function} app - A function representing the main application logic for each worker. 
 *                         This is typically an Express application instance.
 * @param {Object} [albConfig=albConfigDefault] - Configuration object for the ALB.
 * @param {number} [albConfig.max=os.cpus().length] - Maximum number of worker processes allowed.
 *                                                    Defaults to the number of CPU cores available.
 * @param {number} [albConfig.min=2] - Minimum number of worker processes to maintain.
 *                                     Defaults to 2.
 * @param {number} [albConfig.idleTime=30000] - Maximum idle time (in milliseconds) for a worker 
 *                                              before it is terminated. Defaults to 30,000ms.
 * 
 * @throws {Error} Throws an error if `app` is not a function.
 * 
 * @example
 * import express from 'express';
 * import alb from './alb';
 * 
 * const app = () => {
 *     const server = express();
 *     server.get('/', (req, res) => res.send('Hello from worker ' + process.pid));
 *     server.listen(3000, () => console.log(`Worker ${process.pid} listening on port 3000`));
 * };
 * 
 * alb(app, { max: 4, min: 2, idleTime: 15000 });
 */


import cluster from 'cluster';
import os from 'os';

const albConfigDefault = {
	max: os.cpus().length,
	min: 2,
	idleTime: 30000,
	log: false
}

function log(message, allow = false) {
	if (allow) {
		console.log(message)
	}
}

export default (app, albConfig = albConfigDefault) => {
	albConfig = { ...albConfigDefault, ...albConfig };
	const workerStatus = new Map();
	const MIN_WORKERS = 1 >= albConfig.min ? 1 : albConfig.min;
	let MAX_WORKERS = 1 >= albConfig.max ? 1 : albConfig.max;
	const IDLE_TIMEOUT = 10000 >= albConfig.idleTime ? 10000 : albConfig.idleTime;

	if (MAX_WORKERS > os.cpus().length) {
		console.warn(`You are running a system with a maximum number of cores greater than the number of CPU cores is ${os.cpus().length}, so max will be set to the number of CPU cores.`);
		MAX_WORKERS = os.cpus().length;
	}

	if (cluster.isMaster) {
		log(`Master process ${process.pid} is running`, albConfig.log);

		for (let i = 0; i < MIN_WORKERS; i++) {
			forkWorker();
		}

		cluster.on('exit', (worker, code, signal) => {
			log(`Worker ${worker.process.pid} exited`, albConfig.log);

			workerStatus.delete(worker.id);

			if (workerStatus.size < MIN_WORKERS) {
				log('Maintaining minimum workers...', albConfig.log);

				forkWorker();
			}
		});

		cluster.on('message', (worker, message) => {
			if (message.type === 'request_handled') {
				workerStatus.set(worker.id, Date.now());
			}
		});

		setInterval(() => {
			const now = Date.now();
			for (const [workerId, lastActive] of workerStatus.entries()) {
				if (now - lastActive > IDLE_TIMEOUT && workerStatus.size > MIN_WORKERS) {
					log(`Stopping idle worker ${workerId}`, albConfig.log);

					cluster.workers[workerId]?.kill();
					workerStatus.delete(workerId);
				}
			}
		}, 3000);
	} else {
		console.log(`Worker ${process.pid} started`);
		app();
	}

	function forkWorker() {
		if (Object.keys(cluster.workers).length < MAX_WORKERS) {
			const worker = cluster.fork();
			workerStatus.set(worker.id, Date.now());
			log(`Worker ${worker.process.pid} forked`, albConfig.log);
		} else {
			log('Maximum worker limit reached.', albConfig.log);
		}
	}
}
