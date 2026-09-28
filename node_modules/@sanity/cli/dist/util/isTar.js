/**
 * Checks if a buffer contains a TAR archive by looking for the `ustar` magic
 * bytes at offset 257–261.
 *
 * @internal
 */ export const isTar = (buf)=>buf.length >= 262 && buf[257] === 0x75 && buf[258] === 0x73 && buf[259] === 0x74 && buf[260] === 0x61 && buf[261] === 0x72;

//# sourceMappingURL=isTar.js.map