import { n as RpcGMCallTypes, r as generateTypes, t as exposeRpc } from "./expose-rpc-B0rqtOKP.mjs";
import "./Broker-BfFUcTHm.mjs";

//#region src/core/lib/forkGenerateDts.ts
async function forkGenerateDts(options) {
	return generateTypes(options);
}
process.on("message", (message) => {
	if (message.type === RpcGMCallTypes.EXIT) process.exit(0);
});
exposeRpc(forkGenerateDts);

//#endregion
export { forkGenerateDts };