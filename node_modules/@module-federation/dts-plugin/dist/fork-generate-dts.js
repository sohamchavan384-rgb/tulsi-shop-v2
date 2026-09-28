Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
require('./Broker-C-uWF8l5.js');
const require_expose_rpc = require('./expose-rpc-jaGpsAVL.js');

//#region src/core/lib/forkGenerateDts.ts
async function forkGenerateDts(options) {
	return require_expose_rpc.generateTypes(options);
}
process.on("message", (message) => {
	if (message.type === require_expose_rpc.RpcGMCallTypes.EXIT) process.exit(0);
});
require_expose_rpc.exposeRpc(forkGenerateDts);

//#endregion
exports.forkGenerateDts = forkGenerateDts;