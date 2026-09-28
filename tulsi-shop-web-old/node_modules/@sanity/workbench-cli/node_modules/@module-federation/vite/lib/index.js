import { i as resolveHashPlaceholderFileName, n as normalizePathForImport, r as rebaseImport } from "./buildPaths-BoaQTkxt.js";
import { a as getPackageDetectionCwd, c as getSharedCacheDescriptor, d as packageNameDecode, f as packageNameEncode, g as createModuleFederationError, h as sharedCacheHelperCode, i as getIsRolldown, l as hasPackageDependency, m as setPackageDetectionCwd, n as getInstalledPackageEntry, o as getPackageName, p as resolveImportPath, r as getInstalledPackageJson, s as getPackageNameFromNodeModulePath, u as isNuxtProjectRoot, v as mfWarn } from "./dtsConstants-BsaLBaaK.js";
import { a as filterId, c as getCommonSharedSubpaths, d as isNodeModulePath, f as isNuxtClientBase, h as resolvePublicPath, i as ensureTrailingSlash, l as getMatchingNodeModuleSubpath, m as normalizeNodeModulePath, n as invalidateSharedKeyMatcher, o as getBasePath$1, p as isViteOptimizableEntry, r as matchesSharedSource, s as getCommonSharedSubpathFromNodeModulePath, t as findSharedKey, u as isAssetLikeImport } from "./sharedKeyMatcher-DiUzRVH1.js";
import { createRequire } from "node:module";
import * as fs$2 from "fs";
import { existsSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "fs";
import { createRequire as createRequire$1, isBuiltin } from "module";
import * as path$1 from "node:path";
import path, { basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "url";
import { parseAst, version } from "vite";
import { createHash } from "node:crypto";
import * as fs$1 from "node:fs";
import { existsSync as existsSync$1, readFileSync as readFileSync$1 } from "node:fs";
import { pathToFileURL as pathToFileURL$1 } from "node:url";
import { isIPv6 } from "node:net";
//#region src/utils/regexEscape.ts
const REGEXP_SPECIAL_CHARS_RE = /[.*+?^${}()|[\]\\]/g;
/**
* Escape `value` so it matches literally when interpolated into a regex source.
*
* Federation interpolates user-controlled strings — package names, chunk file
* names, virtual module ids — into generated matchers. Those routinely contain
* `.`, `+`, `[` and `\`, which would otherwise change what the pattern matches.
*/
function escapeRegExp(value) {
	return value.replace(REGEXP_SPECIAL_CHARS_RE, "\\$&");
}
//#endregion
//#region src/utils/bundleHelpers.ts
function isOutputChunk$1(chunk) {
	return chunk.type === "chunk";
}
/**
* Whether `code` references `name` as a whole identifier.
*
* Not `\b`: a word boundary needs a `\w` on one side, and `$` is not one, so
* `\b$8\b` matches nothing at all. Minifiers assign `$`-prefixed names to any
* chunk with more than ~54 module-scope bindings, and a missed match here reads
* as "unused", which orphans a still-referenced import.
*/
function isIdentifierReferenced(name, code) {
	return new RegExp(`(?<![$\\w])${escapeRegExp(name)}(?![$\\w])`).test(code);
}
function getProxyBaseName(fileName) {
	return fileName.replace(/^.*\//, "").replace(/\.js$/, "").replace(/-[A-Za-z0-9_-]+$/, "");
}
/**
* Matches `function <name>(`. Escaped because an unescaped leading `$` is a
* regex end-anchor, so the pattern would silently match nothing.
*/
function functionDeclarationRegExp(name) {
	return new RegExp(`function\\s+${escapeRegExp(name)}\\s*\\(`);
}
function extractFunctionDeclaration(code, functionName) {
	const funcRe = new RegExp(`function\\s+${escapeRegExp(functionName)}\\s*\\([^)]*\\)\\s*\\{`);
	const funcStart = code.search(funcRe);
	if (funcStart < 0) return;
	let depth = 0;
	for (let i = code.indexOf("{", funcStart); i < code.length; i++) if (code[i] === "{") depth++;
	else if (code[i] === "}") {
		depth--;
		if (depth === 0) return code.slice(funcStart, i + 1);
	}
}
/**
* Resolve the local alias for a non-inlineable proxy binding.
* If Rollup's deconflict renamed the alias but didn't update references
* in the code body, fall back to proxyLocal so they stay in sync.
*/
function resolveProxyAlias(binding, proxyLocal, code, fullImport, claimedLocals = /* @__PURE__ */ new Set()) {
	const codeWithoutImport = code.replace(fullImport, "");
	const localUsedInCode = isIdentifierReferenced(binding.local, codeWithoutImport);
	const claimedImportLocals = /* @__PURE__ */ new Set();
	const importRe = /import\s*\{([^}]+)\}\s*from\s*["'][^"']+["']\s*;?/g;
	let match;
	while ((match = importRe.exec(codeWithoutImport)) !== null) for (const spec of match[1].split(",")) {
		const parts = spec.trim().split(/\s+as\s+/);
		claimedImportLocals.add((parts[1] || parts[0]).trim());
	}
	const local = !localUsedInCode && !claimedLocals.has(proxyLocal) && !claimedImportLocals.has(proxyLocal) ? proxyLocal : binding.local;
	return {
		imported: binding.imported,
		local
	};
}
function collectLoadShareProxyChunks(bundle, loadShareTag) {
	const proxyChunks = /* @__PURE__ */ new Map();
	for (const [fileName, chunk] of Object.entries(bundle)) {
		if (!isOutputChunk$1(chunk)) continue;
		if (fileName.includes(loadShareTag) && fileName.includes("commonjs-proxy")) proxyChunks.set(fileName, {
			code: chunk.code,
			fileName
		});
	}
	return proxyChunks;
}
function collectSystemProxyInfos(proxyChunks, loadShareTag) {
	const systemProxyInfo = /* @__PURE__ */ new Map();
	for (const [proxyFileName, proxyInfo] of Array.from(proxyChunks.entries())) {
		const depsMatch = proxyInfo.code.match(/System\.register\(\[([\s\S]*?)\]/);
		if (!depsMatch) continue;
		const loadShareDep = Array.from(depsMatch[1].matchAll(/["']([^"']+)["']/g)).map((m) => m[1]).find((dep) => dep.includes(loadShareTag) && !dep.includes("commonjs-proxy"));
		if (!loadShareDep) continue;
		const loadShareBindings = {};
		for (const m of proxyInfo.code.matchAll(/([A-Za-z_$][\w$]*)\s*=\s*module\d+\.([A-Za-z_$][\w$]*)/g)) loadShareBindings[m[1]] = m[2];
		const exportMap = {};
		const objectExportMatch = proxyInfo.code.match(/exports\(\s*\{([\s\S]*?)\}\s*\)/);
		if (objectExportMatch) for (const m of objectExportMatch[1].matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)/g)) {
			const [, exported, local] = m;
			const funcBody = extractFunctionDeclaration(proxyInfo.code, local);
			if (funcBody) exportMap[exported] = {
				type: "helper",
				code: funcBody
			};
		}
		for (const m of proxyInfo.code.matchAll(/exports\(\s*["']([^"']+)["']\s*,([\s\S]*?)\);/g)) {
			const exported = m[1];
			const expression = m[2];
			for (const [local, exportName] of Object.entries(loadShareBindings).reverse()) if (isIdentifierReferenced(local, expression)) {
				exportMap[exported] = {
					type: "reexport",
					exportName
				};
				break;
			}
		}
		if (Object.keys(exportMap).length > 0) systemProxyInfo.set(proxyFileName, {
			loadShareDep,
			exportMap
		});
	}
	return systemProxyInfo;
}
function rewriteEsmProxyConsumers(code, proxyChunks) {
	let nextCode = code;
	const claimedLocals = /* @__PURE__ */ new Set();
	for (const [proxyFileName, proxyInfo] of Array.from(proxyChunks.entries())) {
		const proxyBaseName = getProxyBaseName(proxyFileName);
		const importMatch = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*["']([^"']*${escapeRegExp(proxyBaseName)}[^"']*)["']\\s*;?`).exec(nextCode);
		if (!importMatch) continue;
		const fullImport = importMatch[0];
		const bindings = importMatch[1].split(",").map((s) => {
			const parts = s.trim().split(/\s+as\s+/);
			return {
				imported: parts[0].trim(),
				local: (parts[1] || parts[0]).trim()
			};
		});
		const exportMapMatch = proxyInfo.code.match(/export\s*\{([^}]+)\}/);
		if (!exportMapMatch) continue;
		const exportMap = {};
		for (const entry of exportMapMatch[1].split(",")) {
			const parts = entry.trim().split(/\s+as\s+/);
			if (parts.length === 2) exportMap[parts[1].trim()] = parts[0].trim();
		}
		const inlineable = [];
		const nonInlineable = [];
		const pendingLocals = new Set(bindings.map((binding) => binding.local));
		for (const b of bindings) {
			pendingLocals.delete(b.local);
			const proxyLocal = exportMap[b.imported];
			if (!proxyLocal) {
				claimedLocals.add(b.local);
				nonInlineable.push(b);
				continue;
			}
			const funcBody = extractFunctionDeclaration(proxyInfo.code, proxyLocal);
			if (funcBody) {
				inlineable.push({
					local: b.local,
					funcBody: funcBody.replace(functionDeclarationRegExp(proxyLocal), () => `function ${b.local}(`)
				});
				claimedLocals.add(b.local);
			} else {
				const unavailableLocals = new Set(claimedLocals);
				pendingLocals.forEach((local) => unavailableLocals.add(local));
				const resolvedBinding = resolveProxyAlias(b, proxyLocal, nextCode, fullImport, unavailableLocals);
				claimedLocals.add(resolvedBinding.local);
				nonInlineable.push(resolvedBinding);
			}
		}
		const hasRenamedAlias = nonInlineable.some((b) => bindings.find((ob) => ob.imported === b.imported)?.local !== b.local);
		if (inlineable.length === 0 && !hasRenamedAlias) continue;
		let replacement = "";
		if (nonInlineable.length > 0) replacement = `import{${nonInlineable.map((b) => b.imported === b.local ? b.imported : `${b.imported} as ${b.local}`).join(",")}}from"${importMatch[2]}";`;
		replacement += inlineable.map((f) => f.funcBody).join("");
		nextCode = nextCode.replace(fullImport, () => replacement);
	}
	return nextCode;
}
function rewriteSystemProxyConsumers(code, systemProxyInfo) {
	if (!code.includes("System.register(")) return code;
	let nextCode = code;
	for (const [proxyFileName, proxyInfo] of Array.from(systemProxyInfo.entries())) {
		const proxyBaseName = getProxyBaseName(proxyFileName);
		const depMatch = new RegExp(`["']([^"']*${escapeRegExp(proxyBaseName)}[^"']*)["']`).exec(nextCode);
		if (!depMatch) continue;
		let setterIndex = 0;
		const depListMatch = nextCode.match(/System\.register\(\[([\s\S]*?)\]/);
		if (depListMatch) setterIndex = Array.from(depListMatch[1].matchAll(/["']([^"']+)["']/g)).map((m) => m[1]).findIndex((dep) => dep.includes(proxyBaseName));
		if (setterIndex < 0) continue;
		const settersStart = nextCode.indexOf("setters: [");
		if (settersStart < 0) continue;
		const setterMatch = Array.from(nextCode.slice(settersStart).matchAll(/\((module\d+)\)\s*=>\s*\{([\s\S]*?)\}/g))[setterIndex];
		if (!setterMatch) continue;
		const [fullSetter, moduleLocal, setterBody] = setterMatch;
		const helpersToInline = [];
		const nextSetterBody = setterBody.replace(new RegExp(`([A-Za-z_$][\\w$]*)\\s*=\\s*${moduleLocal}\\.([A-Za-z_$][\\w$]*);?`, "g"), (assignment, local, imported) => {
			const mapped = proxyInfo.exportMap[imported];
			if (!mapped) return assignment;
			if (mapped.type === "helper") {
				helpersToInline.push(mapped.code.replace(functionDeclarationRegExp(imported), () => `function ${local}(`));
				return "";
			}
			return `${local} = ${moduleLocal}.${mapped.exportName};`;
		});
		if (nextSetterBody === setterBody && helpersToInline.length === 0) continue;
		const nextSetter = fullSetter.replace(setterBody, () => nextSetterBody);
		nextCode = nextCode.replace(fullSetter, () => nextSetter);
		nextCode = nextCode.replace(depMatch[0], JSON.stringify(proxyInfo.loadShareDep));
		if (helpersToInline.length > 0) nextCode = nextCode.replace("execute: (function() {", () => {
			return `execute: (function() {${helpersToInline.join("")}`;
		});
	}
	return nextCode;
}
function findRemoteEntryFile(filename, bundle) {
	const strippedName = filename.replace(/[\[\]]/g, "_").replace(/\.[^/.]+$/, "");
	let fallback;
	for (const fileData of Object.values(bundle)) {
		if (fileData.fileName === filename) return fileData.fileName;
		if (fallback === void 0 && (strippedName === fileData.name || fileData.name === "remoteEntry")) fallback = fileData.fileName;
	}
	return fallback;
}
//#endregion
//#region src/utils/codeRewriter.ts
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var CodeRewriter = class {
	original;
	replacements = [];
	constructor(original) {
		this.original = original;
	}
	overwrite(start, end, content) {
		if (start < 0 || end < start || end > this.original.length) throw new Error(`Invalid overwrite range: ${start}-${end}`);
		this.replacements.push({
			start,
			end,
			content
		});
	}
	toString() {
		return applyReplacements(this.original, this.getSortedReplacements()).code;
	}
	generateMap(source = "") {
		const { code, replacements } = applyReplacements(this.original, this.getSortedReplacements());
		return {
			version: 3,
			sources: [source],
			sourcesContent: [this.original],
			names: [],
			mappings: generateLineMappings(code, this.original, replacements)
		};
	}
	getSortedReplacements() {
		return [...this.replacements].sort((a, b) => a.start - b.start || a.end - b.end);
	}
};
function createSourceMap(code, source = "") {
	return {
		version: 3,
		sources: [source],
		sourcesContent: [code],
		names: [],
		mappings: generateLineMappings(code, code, [])
	};
}
function applyReplacements(original, replacements) {
	let code = "";
	let cursor = 0;
	let delta = 0;
	const applied = [];
	for (const replacement of replacements) {
		if (replacement.start < cursor) throw new Error("Overlapping overwrite ranges are not supported");
		code += original.slice(cursor, replacement.start);
		const generatedStart = replacement.start + delta;
		code += replacement.content;
		const generatedEnd = generatedStart + replacement.content.length;
		applied.push({
			...replacement,
			generatedStart,
			generatedEnd
		});
		cursor = replacement.end;
		delta += replacement.content.length - (replacement.end - replacement.start);
	}
	code += original.slice(cursor);
	return {
		code,
		replacements: applied
	};
}
function generateLineMappings(generated, original, replacements) {
	const generatedLineStarts = getLineStarts(generated);
	const originalLineStarts = getLineStarts(original);
	let previousOriginalLine = 0;
	let previousOriginalColumn = 0;
	let mappings = "";
	generatedLineStarts.forEach((generatedOffset, lineIndex) => {
		if (lineIndex > 0) mappings += ";";
		const originalOffset = generatedOffsetToOriginalOffset(generatedOffset, replacements);
		const originalLine = findLine(originalLineStarts, originalOffset);
		const originalColumn = originalOffset - originalLineStarts[originalLine];
		mappings += encodeSegment([
			0,
			0,
			originalLine - previousOriginalLine,
			originalColumn - previousOriginalColumn
		]);
		previousOriginalLine = originalLine;
		previousOriginalColumn = originalColumn;
	});
	return mappings;
}
function generatedOffsetToOriginalOffset(offset, replacements) {
	let delta = 0;
	for (const replacement of replacements) {
		if (offset < replacement.generatedStart) break;
		if (offset < replacement.generatedEnd) return replacement.start;
		delta += replacement.content.length - (replacement.end - replacement.start);
	}
	return offset - delta;
}
function getLineStarts(code) {
	const starts = [0];
	for (let i = 0; i < code.length; i++) if (code.charCodeAt(i) === 10) starts.push(i + 1);
	return starts;
}
function findLine(lineStarts, offset) {
	let low = 0;
	let high = lineStarts.length - 1;
	while (low <= high) {
		const mid = low + high >> 1;
		if (lineStarts[mid] <= offset) low = mid + 1;
		else high = mid - 1;
	}
	return Math.max(0, high);
}
function encodeSegment(values) {
	return values.map(encodeVlq).join("");
}
function encodeVlq(value) {
	let vlq = value < 0 ? (-value << 1) + 1 : value << 1;
	let encoded = "";
	do {
		let digit = vlq & 31;
		vlq >>>= 5;
		if (vlq > 0) digit |= 32;
		encoded += BASE64_CHARS[digit];
	} while (vlq > 0);
	return encoded;
}
//#endregion
//#region src/utils/mapCodeToCodeWithSourcemap.ts
async function mapCodeToCodeWithSourcemap(code) {
	const resolvedCode = await code;
	if (resolvedCode === void 0) return;
	return {
		code: resolvedCode,
		map: createSourceMap(resolvedCode)
	};
}
//#endregion
//#region src/utils/codePositionMap.ts
const REGEX_PREFIX_KEYWORDS = /* @__PURE__ */ new Set([
	"await",
	"case",
	"delete",
	"in",
	"instanceof",
	"new",
	"return",
	"throw",
	"typeof",
	"void",
	"yield"
]);
function isJsxClosingTagSlash(code, slashIndex) {
	if (code[slashIndex - 1] !== "<") return false;
	let cursor = slashIndex + 1;
	while (/\s/.test(code[cursor] || "")) cursor++;
	if (code[cursor] === ">") return true;
	const tagStart = cursor;
	while (/[-:.$_\u200C\u200D\p{ID_Continue}]/u.test(code[cursor] || "")) cursor++;
	if (cursor === tagStart) return false;
	while (/\s/.test(code[cursor] || "")) cursor++;
	return code[cursor] === ">";
}
/** Mark comments, string/template literals, and regular expressions as non-code. */
function createCodePositionMap(code) {
	const positions = Array(code.length).fill(true);
	const mask = (start, end) => {
		for (let index = start; index < end; index++) positions[index] = false;
	};
	let canStartRegex = true;
	for (let index = 0; index < code.length;) {
		const char = code[index];
		const next = code[index + 1];
		if (/\s/.test(char)) {
			index++;
			continue;
		}
		if (char === "/" && next === "/") {
			const start = index;
			index += 2;
			while (index < code.length && code[index] !== "\n" && code[index] !== "\r") index++;
			mask(start, index);
			continue;
		}
		if (char === "/" && next === "*") {
			const start = index;
			index += 2;
			while (index < code.length && !(code[index] === "*" && code[index + 1] === "/")) index++;
			index = Math.min(code.length, index + 2);
			mask(start, index);
			continue;
		}
		if (char === "\"" || char === "'" || char === "`") {
			const quote = char;
			const start = index++;
			while (index < code.length) {
				if (code[index] === "\\") {
					index += 2;
					continue;
				}
				if (code[index] === quote) {
					index++;
					break;
				}
				index++;
			}
			mask(start, index);
			canStartRegex = false;
			continue;
		}
		const closesJsxTag = isJsxClosingTagSlash(code, index);
		if (char === "/" && canStartRegex && !closesJsxTag) {
			const start = index;
			let cursor = index + 1;
			let escaped = false;
			let inCharacterClass = false;
			let closed = false;
			for (; cursor < code.length; cursor++) {
				const regexChar = code[cursor];
				if (regexChar === "\n" || regexChar === "\r") break;
				if (escaped) {
					escaped = false;
					continue;
				}
				if (regexChar === "\\") {
					escaped = true;
					continue;
				}
				if (regexChar === "[") {
					inCharacterClass = true;
					continue;
				}
				if (regexChar === "]" && inCharacterClass) {
					inCharacterClass = false;
					continue;
				}
				if (regexChar === "/" && !inCharacterClass) {
					cursor++;
					while (/[$_\p{ID_Continue}]/u.test(code[cursor] || "")) cursor++;
					closed = true;
					break;
				}
			}
			if (closed) {
				mask(start, cursor);
				index = cursor;
				canStartRegex = false;
				continue;
			}
		}
		if (/[$_\p{ID_Start}]/u.test(char)) {
			const start = index++;
			while (/[$_\u200C\u200D\p{ID_Continue}]/u.test(code[index] || "")) index++;
			canStartRegex = REGEX_PREFIX_KEYWORDS.has(code.slice(start, index));
			continue;
		}
		if (/\d/.test(char)) {
			index++;
			while (/[\w.]/.test(code[index] || "")) index++;
			canStartRegex = false;
			continue;
		}
		if ((char === "+" || char === "-") && next === char) {
			index += 2;
			continue;
		}
		if (char === "!" && next !== "=") {
			index++;
			continue;
		}
		if (char === ")" || char === "]" || char === "}") canStartRegex = false;
		else if (char !== ".") canStartRegex = true;
		index++;
	}
	return positions;
}
//#endregion
//#region src/utils/htmlEntryUtils.ts
const IDENTIFIER = String.raw`[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*`;
const NAMED_SPECIFIERS = String.raw`\{[^{}]*\}`;
const NAMESPACE_SPECIFIER = String.raw`\*\s*as\s+${IDENTIFIER}`;
const IMPORT_CLAUSE = String.raw`(?:(?<importType>type)\s+)?(?<importClause>${NAMESPACE_SPECIFIER}|${NAMED_SPECIFIERS}|${IDENTIFIER}(?:\s*,\s*(?:${NAMESPACE_SPECIFIER}|${NAMED_SPECIFIERS}))?)`;
const EXPORT_CLAUSE = String.raw`(?:(?<exportType>type)\s+)?(?<exportClause>\*(?:\s*as\s+(?:${IDENTIFIER}|"[^"]*"|'[^']*'))?|${NAMED_SPECIFIERS})`;
const SPECIFIER = String.raw`(?<quote>["'])(?<source>[^"'\r\n]*)\k<quote>`;
const KEYWORD_BOUNDARY = String.raw`(?<![.$\w])`;
const KEYWORD_GAP = String.raw`(?:\s+|(?=[{*]))`;
const STATIC_PATTERN = new RegExp(String.raw`${KEYWORD_BOUNDARY}(?:import${KEYWORD_GAP}${IMPORT_CLAUSE}|export${KEYWORD_GAP}${EXPORT_CLAUSE})\s*from\s*${SPECIFIER}`, "gud");
const DYNAMIC_PATTERN = new RegExp(String.raw`${KEYWORD_BOUNDARY}import\s*\(\s*${SPECIFIER}`, "gud");
const REQUIRE_PATTERN = new RegExp(String.raw`${KEYWORD_BOUNDARY}require\s*\(\s*${SPECIFIER}\s*\)`, "gud");
const SIDE_EFFECT_PATTERN = new RegExp(String.raw`${KEYWORD_BOUNDARY}import\s*${SPECIFIER}`, "gud");
/**
* Returns `code` with every non-code region blanked out to spaces so that
* regexes can run against real syntax only. String literals keep their
* delimiters (with a blank interior) so import specifiers stay locatable;
* comments, template literals, and regular expressions vanish entirely.
* The result has the same length as `code`, so match indices map back 1:1.
*/
function blankNonCode(code) {
	const codePositions = createCodePositionMap(code);
	const chars = code.split("");
	let index = 0;
	while (index < code.length) {
		if (codePositions[index]) {
			index++;
			continue;
		}
		const start = index;
		while (index < code.length && !codePositions[index]) index++;
		const quote = code[start];
		const isString = (quote === "\"" || quote === "'") && index - start >= 2 && code[index - 1] === quote;
		for (let position = start; position < index; position++) chars[position] = isString && (position === start || position === index - 1) ? quote : code[position] === "\n" ? "\n" : " ";
	}
	return chars.join("");
}
function isTypeOnlyNamedClause(clause) {
	const namedSpecifiers = clause.trim().match(/^\{([\s\S]*)\}$/)?.[1];
	if (namedSpecifiers === void 0) return false;
	const specifiers = namedSpecifiers.split(",").map((specifier) => specifier.trim()).filter(Boolean);
	return specifiers.length > 0 && specifiers.every((specifier) => /^type\s+(?!as(?:\s|$))\S/.test(specifier));
}
function readSource(code, match) {
	const range = match.indices?.groups?.source;
	if (!range) return void 0;
	const source = code.slice(range[0], range[1]);
	return source.length > 0 ? source : void 0;
}
/**
* Finds module imports while ignoring comments, strings, and regular expressions.
* The descriptor keeps enough information for callers to distinguish runtime
* static imports from type-only imports without introducing a parser dependency.
*
* Matching runs against a blanked copy of the code (see `blankNonCode`), so an
* `import` inside a comment or string can never match, comments inside a
* statement never change its classification, and a clause can never span
* multiple statements.
*/
function findModuleImportDescriptors(code) {
	const blanked = blankNonCode(code);
	const descriptors = [];
	for (const match of blanked.matchAll(STATIC_PATTERN)) {
		const source = readSource(code, match);
		if (!source) continue;
		const groups = match.groups;
		const typeOnly = groups.importType !== void 0 || groups.exportType !== void 0 || isTypeOnlyNamedClause(groups.importClause ?? groups.exportClause ?? "");
		descriptors.push({
			kind: "static",
			syntax: "import",
			source,
			typeOnly
		});
	}
	for (const match of blanked.matchAll(DYNAMIC_PATTERN)) {
		const source = readSource(code, match);
		if (source) descriptors.push({
			kind: "dynamic",
			syntax: "import",
			source,
			typeOnly: false
		});
	}
	for (const match of blanked.matchAll(REQUIRE_PATTERN)) {
		const source = readSource(code, match);
		if (source) descriptors.push({
			kind: "dynamic",
			syntax: "require",
			source,
			typeOnly: false
		});
	}
	for (const match of blanked.matchAll(SIDE_EFFECT_PATTERN)) {
		const source = readSource(code, match);
		if (source) descriptors.push({
			kind: "static",
			syntax: "import",
			source,
			typeOnly: false
		});
	}
	return descriptors;
}
/**
* Returns the JavaScript/TypeScript portion of a module for import scanning.
* Vue and Svelte single-file components only contribute their `<script>`
* blocks so template markup and styles are never misread as code.
*/
function getScannableModuleSource(id, code) {
	if (!/\.(?:vue|svelte)(?:\?|$)/.test(id)) return code;
	const blocks = [];
	for (const match of code.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script(?:\s[^>]*)?>/gi)) blocks.push(match[1]);
	return blocks.join("\n");
}
function findModuleImportSources(code) {
	return Array.from(new Set(findModuleImportDescriptors(code).filter(({ syntax, typeOnly }) => syntax === "import" && !typeOnly).map(({ source }) => source)));
}
function sanitizeDevEntryPath(devEntryPath) {
	return devEntryPath.replace(/\\\\?/g, "/");
}
/**
* Rewrites entry module script tags to point at an external wrapper module.
* The wrapper can then sequence federation init before the app entry without
* relying on CSP-breaking inline `<script type="module">`.
*/
function rewriteEntryScripts(html, createProxySrc) {
	return html.replace(/<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["'][^"']+["'])([^>]*)>/gi, (match, attrs) => {
		if (/\svite-ignore(?:\s|=|\/|$)/i.test(attrs)) return match;
		const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
		if (!srcMatch) return match;
		const originalSrc = srcMatch[1];
		if (originalSrc.includes("@vite/client")) return match;
		const proxySrc = createProxySrc(originalSrc);
		return match.replace(srcMatch[0], `src=${JSON.stringify(proxySrc)}`);
	});
}
function injectEntryScript(html, initSrc) {
	const src = sanitizeDevEntryPath(initSrc);
	const script = `<script type="module" src=${JSON.stringify(src)}><\/script>`;
	return html.replace(/<head\b[^>]*>/i, (openTag) => `${openTag}${script}`);
}
//#endregion
//#region src/utils/normalizeModuleFederationOptions.ts
const INTERNAL_NAME_PREFIX = "__mfe_internal__";
function toInternalModuleFederationName(name) {
	return name.startsWith(INTERNAL_NAME_PREFIX) ? name : `${INTERNAL_NAME_PREFIX}${name}`;
}
function warnOnReservedInternalNamePrefix(name, kind) {
	if (!name.startsWith(INTERNAL_NAME_PREFIX)) return;
	mfWarn(`Reserved internal ${kind} prefix "${INTERNAL_NAME_PREFIX}" detected in public ${kind} "${name}". This prefix is reserved for internal module federation names and may cause conflicts.`);
}
function normalizeExposesItem(item) {
	let importPath = "";
	if (typeof item === "string") importPath = item;
	if (typeof item === "object") importPath = item.import;
	return { import: importPath };
}
function normalizeExposes(exposes) {
	if (!exposes) return {};
	const res = {};
	Object.keys(exposes).forEach((key) => {
		res[key] = normalizeExposesItem(exposes[key]);
	});
	return res;
}
function normalizeRemotes(remotes) {
	if (!remotes) return {};
	const result = {};
	if (typeof remotes === "object") Object.keys(remotes).forEach((key) => {
		result[key] = normalizeRemoteItem(key, remotes[key]);
	});
	return result;
}
function warnOmittedObjectRemoteType(remoteKey) {
	mfWarn(`Remote "${remoteKey}" omits type and defaults to 'var'. Set type: 'module' for Vite ESM remotes, or type: 'var' explicitly to silence this warning.`);
}
function normalizeRemoteItem(key, remote) {
	warnOnReservedInternalNamePrefix(key, "remoteAlias");
	if (typeof remote === "string") {
		const separatorIndex = remote.startsWith("@") ? remote.indexOf("@", 1) : remote.indexOf("@");
		let entryGlobalName;
		let entry;
		if (separatorIndex > 0) {
			entryGlobalName = remote.slice(0, separatorIndex);
			entry = remote.slice(separatorIndex + 1);
		} else {
			entryGlobalName = remote;
			entry = remote;
		}
		return {
			type: "var",
			name: key,
			internalName: toInternalModuleFederationName(key),
			entry,
			entryGlobalName,
			shareScope: "default"
		};
	}
	const typeOmitted = remote.type === void 0 || remote.type === null || remote.type === "";
	if (typeOmitted) warnOmittedObjectRemoteType(key);
	return Object.assign({
		type: "var",
		name: key,
		internalName: toInternalModuleFederationName(key),
		shareScope: "default",
		entryGlobalName: key
	}, {
		...remote,
		type: typeOmitted ? "var" : remote.type,
		internalName: toInternalModuleFederationName(remote.name || key)
	});
}
/**
* Tries to find the package.json's version of a shared package
* if `package.json` is not declared in `exports`
* @param {string} sharedName
* @returns {string | undefined}
*/
function searchPackageVersion(sharedName) {
	const version = getInstalledPackageJson(sharedName)?.packageJson.version;
	return typeof version === "string" ? version : void 0;
}
function inferVersionFromRequiredVersion(requiredVersion) {
	if (typeof requiredVersion !== "string") return void 0;
	const isDigit = (char) => char !== void 0 && char >= "0" && char <= "9";
	const isSuffixChar = (char) => char !== void 0 && (char >= "0" && char <= "9" || char >= "A" && char <= "Z" || char >= "a" && char <= "z" || char === "." || char === "-");
	let index = 0;
	while (index < requiredVersion.length) {
		if (!isDigit(requiredVersion[index])) {
			index += 1;
			continue;
		}
		const start = index;
		while (isDigit(requiredVersion[index])) index += 1;
		if (requiredVersion[index] !== ".") continue;
		index += 1;
		if (!isDigit(requiredVersion[index])) continue;
		while (isDigit(requiredVersion[index])) index += 1;
		if (requiredVersion[index] !== ".") continue;
		index += 1;
		if (!isDigit(requiredVersion[index])) continue;
		while (isDigit(requiredVersion[index])) index += 1;
		if ((requiredVersion[index] === "-" || requiredVersion[index] === "+") && isSuffixChar(requiredVersion[index + 1])) {
			index += 1;
			while (isSuffixChar(requiredVersion[index])) index += 1;
		}
		return requiredVersion.slice(start, index);
	}
}
/** URI-style package specifiers are not semver ranges for runtime satisfy(). */
const PACKAGE_SPECIFIER_PROTOCOL_RE = /^[a-z][a-z\d+.-]*:/i;
function isProtocolRequiredVersion(requiredVersion) {
	return PACKAGE_SPECIFIER_PROTOCOL_RE.test(requiredVersion.trim());
}
function getLitExportSubpathShares(sharedName) {
	if (sharedName !== "lit") return [];
	const exportsField = getInstalledPackageJson(sharedName, { packageName: sharedName })?.packageJson.exports;
	if (!exportsField || typeof exportsField === "string") return [];
	return Object.keys(exportsField).filter((key) => key.startsWith("./") && key !== "." && !key.includes("*")).map((key) => `${sharedName}/${key.slice(2)}`);
}
function normalizeShareItem(key, shareItem) {
	const isImportFalse = typeof shareItem === "object" && shareItem.import === false;
	const explicitVersion = typeof shareItem === "object" ? shareItem.version : void 0;
	const inferredVersion = typeof shareItem === "object" ? inferVersionFromRequiredVersion(shareItem.requiredVersion) : void 0;
	const treeShaking = typeof shareItem === "object" ? shareItem.treeShaking : void 0;
	if (treeShaking && treeShaking.mode !== "server-calc" && treeShaking.mode !== "runtime-infer") throw createModuleFederationError(`Invalid shared config for "${key}": treeShaking.mode must be either "server-calc" or "runtime-infer".`);
	if (treeShaking && typeof shareItem === "object" && shareItem.eager) throw createModuleFederationError(`Invalid shared config for "${key}": cannot use both "eager: true" and "treeShaking.mode" simultaneously. Choose one strategy.`);
	if (treeShaking?.mode === "runtime-infer" && typeof shareItem === "object" && shareItem.singleton) mfWarn(`Shared singleton "${key}" uses runtime-infer tree shaking, which may load both a tree-shaken bundle and a full bundle when consumers require different exports. Prefer server-calc for singleton dependencies. If runtime-infer is required, expand usedExports to reduce this risk.`);
	const version = explicitVersion || searchPackageVersion(key) || inferredVersion;
	if (typeof shareItem === "string") return {
		name: shareItem,
		version,
		scope: "default",
		from: "",
		shareConfig: {
			import: void 0,
			singleton: false,
			eager: false,
			requiredVersion: version ? `^${version}` : "*"
		}
	};
	const userRequiredVersion = shareItem.requiredVersion;
	const keepUserRequiredVersion = userRequiredVersion === false || typeof userRequiredVersion === "string" && userRequiredVersion.trim() !== "" && !isProtocolRequiredVersion(userRequiredVersion);
	return {
		name: key,
		from: "",
		version,
		scope: shareItem.shareScope || "default",
		shareConfig: {
			import: shareItem.import,
			singleton: shareItem.singleton || false,
			eager: shareItem.eager || false,
			requiredVersion: keepUserRequiredVersion ? userRequiredVersion : isImportFalse || shareItem.version ? "*" : version ? `^${version}` : "*",
			strictVersion: !!shareItem.strictVersion,
			...shareItem.suppressMissingImportWarning ? { suppressMissingImportWarning: true } : {},
			...treeShaking ? { treeShaking: { ...treeShaking } } : {}
		}
	};
}
/**
* Trailing-slash keys are package namespace prefixes (`lodash/`, `@scope/ui/`).
*
* Packages in COMMON_SHARED_SUBPATHS historically collapsed `pkg/` → `pkg` so
* Vite would not resolve the invalid `pkg/` specifier, while still auto-mapping
* known subpaths when a local provider exists.
*
* `react/` is different: consumer-only shares need true namespace coverage for
* any actually-imported subpath, not a hardcoded export list. Keep `react/` as
* a prefix; concrete subpaths materialize on import via the generic matcher.
*
* `react-dom/` must keep collapsing. A browser-wide `react-dom/` prefix would
* also capture `react-dom/server*`. Browser-safe entries (`react-dom/client`,
* `react-dom/profiling`) stay via COMMON_SHARED_SUBPATHS (local provider) or
* an exact shared key; SSR server* entries need an explicit shared key.
*/
function normalizeSharedKey(key) {
	if (!key.endsWith("/")) return key;
	const baseKey = key.slice(0, -1);
	if (baseKey === "react") return key;
	return getCommonSharedSubpaths(baseKey).length > 0 ? baseKey : key;
}
function normalizeShared(shared) {
	explicitSharedKeys = /* @__PURE__ */ new Set();
	if (!shared) return {};
	const result = {};
	const sourceEntries = [];
	if (Array.isArray(shared)) shared.forEach((key) => {
		if (isModuleFederationRuntimePackage(key)) return;
		const normalizedKey = normalizeSharedKey(key);
		const hadConfiguredPackageSubpath = (result[normalizedKey]?.shareConfig)?.__mfConfiguredPackageSubpath === true;
		result[normalizedKey] = normalizeShareItem(normalizedKey, normalizedKey);
		if (key.endsWith("/") || hadConfiguredPackageSubpath) result[normalizedKey].shareConfig.__mfConfiguredPackageSubpath = true;
		explicitSharedKeys.add(normalizedKey);
		sourceEntries.push([normalizedKey, normalizedKey]);
	});
	else if (typeof shared === "object") Object.keys(shared).forEach((key) => {
		if (isModuleFederationRuntimePackage(key)) return;
		const normalizedKey = normalizeSharedKey(key);
		const value = shared[key];
		const hadConfiguredPackageSubpath = (result[normalizedKey]?.shareConfig)?.__mfConfiguredPackageSubpath === true;
		result[normalizedKey] = normalizeShareItem(normalizedKey, value);
		if (key.endsWith("/") || hadConfiguredPackageSubpath) result[normalizedKey].shareConfig.__mfConfiguredPackageSubpath = true;
		explicitSharedKeys.add(normalizedKey);
		sourceEntries.push([normalizedKey, value]);
	});
	sourceEntries.forEach(([key, value]) => {
		for (const subpathShare of getLitExportSubpathShares(key)) {
			if (result[subpathShare]) continue;
			result[subpathShare] = normalizeShareItem(subpathShare, value);
		}
	});
	return result;
}
function isModuleFederationRuntimePackage(key) {
	return key === "@module-federation/runtime" || key === "@module-federation/runtime-core";
}
function normalizeLibrary(library) {
	if (!library) return void 0;
	return library;
}
function normalizeManifest(manifest) {
	if (manifest === void 0) return;
	if (typeof manifest === "boolean") return manifest;
	return {
		...manifest,
		fileName: manifest.fileName || "mf-manifest.json"
	};
}
function normalizeExperiments(experiments) {
	return {
		externalRuntime: experiments?.externalRuntime === true,
		provideExternalRuntime: experiments?.provideExternalRuntime === true,
		ssrMode: experiments?.ssrMode === "ISLAND" ? "ISLAND" : void 0
	};
}
let config;
let explicitSharedKeys = /* @__PURE__ */ new Set();
const explicitSharedKeysByOptions = /* @__PURE__ */ new WeakMap();
function resolveRuntimeImplementation() {
	const fallback = resolveImportPath("@module-federation/runtime");
	try {
		const packageJsonPath = resolveImportPath("@module-federation/runtime/package.json");
		const packageJson = JSON.parse(fs$2.readFileSync(packageJsonPath, "utf-8"));
		const importExport = packageJson.exports?.["."];
		const exportImport = typeof importExport === "object" ? typeof importExport.import === "string" ? importExport.import : importExport.import?.default : void 0;
		const esmEntry = packageJson.module || exportImport;
		if (esmEntry) return path$1.join(path$1.dirname(packageJsonPath), esmEntry);
	} catch {}
	return fallback;
}
function getNormalizeModuleFederationOptions() {
	return config;
}
function isExplicitSharedKey(key, options) {
	return (options ? explicitSharedKeysByOptions.get(options) : explicitSharedKeys)?.has(key) ?? false;
}
function getNormalizeShareItem(key, options = getNormalizeModuleFederationOptions()) {
	return options.shared[key] || options.shared[getPackageName(key)] || options.shared[getPackageName(key) + "/"];
}
function normalizeModuleFederationOptions(options) {
	warnOnReservedInternalNamePrefix(options.name, "containerName");
	if (options.virtualModuleDir && options.virtualModuleDir.includes("/")) throw createModuleFederationError(`Invalid virtualModuleDir: "${options.virtualModuleDir}". The virtualModuleDir option cannot contain slashes (/). Please use a single directory name like '__mf__virtual__your_app_name'.`);
	const normalized = {
		exposes: normalizeExposes(options.exposes),
		filename: options.filename || "remoteEntry-[hash]",
		internalName: toInternalModuleFederationName(options.name),
		library: normalizeLibrary(options.library),
		name: options.name,
		remotes: normalizeRemotes(options.remotes),
		runtime: options.runtime,
		shareScope: options.shareScope || "default",
		shared: normalizeShared(options.shared),
		runtimePlugins: options.runtimePlugins || [],
		implementation: normalizePathForImport(options.implementation || resolveRuntimeImplementation()),
		manifest: normalizeManifest(options.manifest),
		dev: options.dev,
		dts: options.dts,
		getPublicPath: options.getPublicPath,
		publicPath: options.publicPath,
		shareStrategy: options.shareStrategy || "version-first",
		ignoreOrigin: options.ignoreOrigin || false,
		virtualModuleDir: options.virtualModuleDir || "__mf__virtual",
		hostInitInjectLocation: options.hostInitInjectLocation || "html",
		bundleAllCSS: options.bundleAllCSS || false,
		treeShakingDir: options.treeShakingDir,
		injectTreeShakingUsedExports: options.injectTreeShakingUsedExports,
		treeShakingSharedPlugins: options.treeShakingSharedPlugins,
		treeShakingSharedExcludePlugins: options.treeShakingSharedExcludePlugins,
		moduleParseTimeout: options.moduleParseTimeout ?? 10,
		moduleParseIdleTimeout: options.moduleParseIdleTimeout,
		varFilename: options.varFilename,
		target: options.target,
		ssrExternals: options.ssrExternals,
		disableRemote: options.disableRemote,
		disableShared: options.disableShared,
		disableSnapshot: options.disableSnapshot,
		experiments: normalizeExperiments(options.experiments)
	};
	if (normalized.experiments.ssrMode === "ISLAND" && Object.hasOwn(normalized.shared, "react")) mfWarn("Island expose generation is disabled because experiments.ssrMode is \"ISLAND\" and React is configured as shared. Remove \"react\" from shared to generate island exposes, or remove ssrMode to use standard shared rendering.");
	explicitSharedKeysByOptions.set(normalized, new Set(explicitSharedKeys));
	return config = normalized;
}
//#endregion
//#region src/utils/VirtualModule.ts
function getSuffix(name) {
	const base = basename(name);
	const dotIndex = base.lastIndexOf(".");
	if (dotIndex > 0 && dotIndex < base.length - 1) return base.slice(dotIndex);
	return ".js";
}
const patternMap = {};
const cacheMap = {};
const idCacheMap = {};
const VITE_ID_PREFIX = "/@id/";
const VITE_ENCODED_NULL_BYTE_PREFIX = `${VITE_ID_PREFIX}__x00__`;
const MF_OWNER_INFIX = "__mf_owner__";
function createViteEncodedIdPrefixRegExp(sourcePrefix = "") {
	return new RegExp(`^(?:${escapeRegExp(VITE_ENCODED_NULL_BYTE_PREFIX)})?${sourcePrefix}`);
}
function toViteEncodedId(id) {
	return `${VITE_ENCODED_NULL_BYTE_PREFIX}${id}`;
}
function decodeViteId(id) {
	if (!id.startsWith("/@id/")) return id;
	const viteId = id.slice(5);
	return viteId.startsWith("__x00__") ? `\0${viteId.slice(7)}` : viteId;
}
function assertModuleFound(tag, str = "") {
	const module = VirtualModule.findById(str) ?? VirtualModule.findModule(tag, str);
	if (!module) throw createModuleFederationError(`Module Federation shared module '${str}' not found. Please ensure it's installed as a dependency in your package.json.`);
	return module;
}
function normalizeVirtualModuleId(id) {
	const decoded = decodeViteId(id).replace(/^\0+/, "");
	const queryIndex = decoded.indexOf("?");
	const hashIndex = decoded.indexOf("#");
	const endIndex = queryIndex === -1 ? hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
	return endIndex === -1 ? decoded : decoded.slice(0, endIndex);
}
var VirtualModule = class VirtualModule {
	name;
	tag;
	suffix;
	inited = false;
	code;
	importId;
	importIdKey;
	scopeName;
	static findName(tag, str = "") {
		if (!patternMap[tag]) patternMap[tag] = new RegExp(`(.*${packageNameEncode(tag)}(.+?)${packageNameEncode(tag)}.*)`);
		const moduleName = (normalizeVirtualModuleId(str).match(patternMap[tag]) || [])[2];
		return moduleName ? packageNameDecode(moduleName) : void 0;
	}
	static findModule(tag, str = "") {
		const moduleName = VirtualModule.findName(tag, str);
		return moduleName ? cacheMap[tag][moduleName] : void 0;
	}
	static findById(id) {
		const normalized = normalizeVirtualModuleId(id);
		return normalized.startsWith("virtual:mf:") ? idCacheMap[normalized] : void 0;
	}
	constructor(name, tag = "__mf_v__", suffix = "", scopeName) {
		this.name = name;
		this.tag = tag;
		this.suffix = suffix || getSuffix(name);
		this.scopeName = scopeName;
		if (!cacheMap[this.tag]) cacheMap[this.tag] = {};
		cacheMap[this.tag][this.name] = this;
	}
	getImportId() {
		const importIdKey = `${this.scopeName ?? getNormalizeModuleFederationOptions().internalName}${this.tag}${this.name}${this.tag}`;
		if (this.importId && this.importIdKey === importIdKey) return this.importId;
		if (this.importId) delete idCacheMap[this.importId];
		this.importIdKey = importIdKey;
		this.importId = `virtual:mf:${packageNameEncode(importIdKey)}${this.suffix}`;
		idCacheMap[this.importId] = this;
		return this.importId;
	}
	getResolvedId() {
		return `\0${this.getImportId()}`;
	}
	writeSync(code, force) {
		if (!force && this.inited) return;
		if (!this.inited) this.inited = true;
		this.code = code;
	}
	write(code) {
		this.writeSync(code, true);
	}
};
//#endregion
//#region src/utils/ssrCapabilities.ts
/** A browser-safe generated expression that is true only in Node.js. */
const SERVER_ENV_GUARD = "import.meta.env.SSR";
const SSR_ENTRY_LOADER_SPECIFIER = "@module-federation/vite/ssrEntryLoader";
const SSR_ONLY_RUNTIME_PLUGINS = /* @__PURE__ */ new Set([SSR_ENTRY_LOADER_SPECIFIER]);
/**
* Single source of truth for SSR-related feature gates.
*
* - Vite 8+ dev: ModuleRunner + FetchableDevEnvironment for `/__mf_ssr__/` entries.
* - Any Vite major on build/preview: HTTP fetch + temp-file import via ssrEntryLoader.
*/
function getSsrCapabilities(viteMajor, command, hasRemotes) {
	if (!hasRemotes) return {
		enableSsrInitBootstrap: false,
		injectSsrEntryLoader: false
	};
	const supported = command === "build" || command === "serve" && viteMajor >= 8;
	return {
		enableSsrInitBootstrap: supported,
		injectSsrEntryLoader: supported
	};
}
//#endregion
//#region src/utils/serializeRuntimeOptions.ts
const UNSAFE_JS_CHAR_MAP = {
	"<": "\\u003C",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029"
};
const UNSAFE_JS_CHAR_PATTERN = /[<\u2028\u2029]/g;
function toSafeJsLiteral(value) {
	const json = JSON.stringify(value);
	if (json === void 0) return "undefined";
	return json.replace(UNSAFE_JS_CHAR_PATTERN, (char) => UNSAFE_JS_CHAR_MAP[char]);
}
/**
* Serializes a JavaScript object into a string of source code that can be evaluated.
* This function is used to create runtime plugin options without relying solely on JSON.stringify,
* allowing support for non-JSON types like RegExp, Date, Map, Set, and Functions.
* It also safely handles circular references.
*
* @param {Record<string, unknown>} options - The options object to serialize.
* @returns {string} The resulting JavaScript source code string.
*/
function serializeRuntimeOptions(options) {
	const ancestors = /* @__PURE__ */ new WeakSet();
	/**
	* Recursive inner function to serialize any value into a source code string.
	*/
	function valueToCode(val) {
		if (val === null) return "null";
		const type = typeof val;
		if (type === "string") return toSafeJsLiteral(val);
		if (type === "number" || type === "boolean") return String(val);
		if (type === "undefined") return "undefined";
		if (type === "symbol") return `Symbol(${toSafeJsLiteral(val.description ?? "")})`;
		if (type === "function") return functionToExpression(val);
		if (val instanceof Date) return `new Date(${toSafeJsLiteral(val.toISOString())})`;
		if (val instanceof RegExp) return `new RegExp(${toSafeJsLiteral(val.source)}, ${toSafeJsLiteral(val.flags)})`;
		if (type === "object") {
			if (ancestors.has(val)) return `"__circular__"`;
			ancestors.add(val);
			try {
				if (Array.isArray(val)) return `[${val.map(valueToCode).join(", ")}]`;
				if (val instanceof Map) return `new Map([${Array.from(val.entries()).map(([k, v]) => `[${valueToCode(k)}, ${valueToCode(v)}]`).join(", ")}])`;
				if (val instanceof Set) return `new Set([${Array.from(val.values()).map(valueToCode).join(", ")}])`;
				const properties = [];
				for (const key in val) if (Object.hasOwn(val, key)) properties.push(`${toSafeJsLiteral(key)}: ${valueToCode(val[key])}`);
				return `{${properties.join(", ")}}`;
			} finally {
				ancestors.delete(val);
			}
		}
		return toSafeJsLiteral(String(val));
	}
	const topLevelProps = [];
	for (const key in options) if (Object.hasOwn(options, key)) topLevelProps.push(`${toSafeJsLiteral(key)}: ${valueToCode(options[key])}`);
	return `{${topLevelProps.join(", ")}}`;
}
const NATIVE_FUNCTION_SOURCE = /\{\s*\[native code\]\s*\}\s*$/;
/**
* Turns `Function#toString()` output into a JS expression that is valid as an
* object-literal value.
*
* Method shorthand (`onError() { … }`) is not a valid expression after a `:`,
* so it is rewritten as a function expression. Native functions have no
* reconstructable source (`function parse() { [native code] }`) and serialize
* as `undefined` so the generated object stays loadable.
*/
function functionToExpression(fn) {
	let source;
	try {
		source = Function.prototype.toString.call(fn).trim();
	} catch {
		return "undefined";
	}
	if (NATIVE_FUNCTION_SOURCE.test(source) || /^(async\s+)?(?:get|set)\s+/.test(source)) return "undefined";
	if (/^(async\s+)?function\b/.test(source) || /^(async\s*)?\(/.test(source) || /^class\b/.test(source) || /^(async\s+)?[$_\p{ID_Start}][$\p{ID_Continue}]*\s*=>/u.test(source)) return isParsableExpression(source) ? source : "undefined";
	for (const [pattern, prefix] of [
		[/^async\s*\*\s*[$_\p{ID_Start}][$\p{ID_Continue}]*\s*(\([\s\S]*)$/u, "async function* "],
		[/^\*\s*[$_\p{ID_Start}][$\p{ID_Continue}]*\s*(\([\s\S]*)$/u, "function* "],
		[/^async\s+[$_\p{ID_Start}][$\p{ID_Continue}]*\s*(\([\s\S]*)$/u, "async function "],
		[/^[$_\p{ID_Start}][$\p{ID_Continue}]*\s*(\([\s\S]*)$/u, "function "]
	]) {
		const match = source.match(pattern);
		if (!match) continue;
		const expression = `${prefix}${match[1]}`;
		return isParsableExpression(expression) ? expression : "undefined";
	}
	return "undefined";
}
function isParsableExpression(source) {
	try {
		new Function(`return (${source});`);
		return true;
	} catch {
		return false;
	}
}
//#endregion
//#region src/utils/reactIsland.ts
const SOURCE_EXTENSIONS$1 = [
	".tsx",
	".jsx",
	".ts",
	".js",
	".mts",
	".mjs",
	".cts",
	".cjs"
];
function stripQueryAndHash$2(id) {
	return id.split(/[?#]/, 1)[0];
}
function resolveSourceFile(importPath, root) {
	const cleanImport = stripQueryAndHash$2(importPath);
	if (!cleanImport.startsWith(".") && !path$1.isAbsolute(cleanImport)) return;
	const candidate = path$1.isAbsolute(cleanImport) ? cleanImport : path$1.resolve(root, cleanImport);
	return [
		candidate,
		...SOURCE_EXTENSIONS$1.map((extension) => `${candidate}${extension}`),
		...SOURCE_EXTENSIONS$1.map((extension) => path$1.join(candidate, `index${extension}`))
	].find((filePath) => {
		try {
			return fs$1.statSync(filePath).isFile();
		} catch {
			return false;
		}
	});
}
function localDefaultReexport(source) {
	const match = source.match(/export\s*{\s*(?:default(?:\s+as\s+default)?|[A-Za-z_$][\w$]*\s+as\s+default)\s*}\s*from\s*["']([^"']+)["']/);
	return match?.[1]?.startsWith(".") ? match[1] : void 0;
}
function isReactComponentSource(source, filePath = "component.tsx") {
	if (!(/\bexport\s+default\b/.test(source) || /\bexport\s*{[^}]*\bdefault\b[^}]*}(?:\s*from\s*["'][^"']+["'])?/.test(source))) return false;
	const extension = path$1.extname(stripQueryAndHash$2(filePath)).toLowerCase();
	const canContainJsx = extension === ".tsx" || extension === ".jsx";
	const hasJsx = /<>|<\s*[A-Za-z][\w.:-]*(?:\s[^<>]*?)?\s*\/?>/.test(source);
	const importsReact = /\bfrom\s*["']react["']|\brequire\(\s*["']react["']\s*\)/.test(source);
	const usesReactApi = /\b(?:React\.)?(?:createElement|jsx|jsxs)\s*\(/.test(source);
	const isClientModule = /^\s*["']use client["']\s*;?/m.test(source);
	return canContainJsx && hasJsx || importsReact && (hasJsx || usesReactApi || isClientModule);
}
function isReactComponentFile(filePath, seen = /* @__PURE__ */ new Set()) {
	const normalizedPath = path$1.resolve(filePath);
	if (seen.has(normalizedPath)) return false;
	seen.add(normalizedPath);
	let source;
	try {
		source = fs$1.readFileSync(normalizedPath, "utf8");
	} catch {
		return false;
	}
	if (isReactComponentSource(source, normalizedPath)) return true;
	const reexport = localDefaultReexport(source);
	if (!reexport) return false;
	const reexportPath = resolveSourceFile(reexport, path$1.dirname(normalizedPath));
	return reexportPath ? isReactComponentFile(reexportPath, seen) : false;
}
/**
* React is shared by the normal MF runtime when explicitly configured. When it
* is local, UI exposes can safely advertise an island capability in addition
* to their unchanged default export.
*/
function getReactIslandExposes(options, root) {
	if (options.experiments.ssrMode !== "ISLAND") return /* @__PURE__ */ new Set();
	if (Object.hasOwn(options.shared, "react")) return /* @__PURE__ */ new Set();
	const islandExposes = /* @__PURE__ */ new Set();
	for (const [key, expose] of Object.entries(options.exposes)) {
		const sourceFile = resolveSourceFile(expose.import, root);
		if (sourceFile && isReactComponentFile(sourceFile)) islandExposes.add(key);
	}
	return islandExposes;
}
function generateReactIslandBrowserDefinition(enabled) {
	if (!enabled) return "";
	return `
          exportModule.__mf_island = {
            version: 1,
            renderToHtml() {
              return Promise.reject(new Error("[Module Federation] renderToHtml is only available in the SSR remote entry"));
            },
            hydrate(element, props) {
              const root = element && element.hasAttribute && element.hasAttribute("data-mf-island-state")
                ? element
                : element && element.querySelector
                  ? element.querySelector("[data-mf-island-state]") || element
                  : element;
              if (!root) {
                return Promise.reject(new Error("[Module Federation] Cannot hydrate an island without a root element"));
              }
              let serverProps = {};
              const encodedState = root.getAttribute && root.getAttribute("data-mf-island-state");
              if (encodedState) {
                try {
                  serverProps = JSON.parse(decodeURIComponent(encodedState));
                } catch {
                  serverProps = {};
                }
              }
              const finalProps = Object.assign({}, serverProps, props || {});
              return Promise.all([import("react"), import("react-dom/client")]).then(([React, ReactDOMClient]) => {
                if (typeof ReactDOMClient.hydrateRoot !== "function") {
                  throw new Error("[Module Federation] react-dom/client does not provide hydrateRoot");
                }
                return ReactDOMClient.hydrateRoot(
                  root,
                  React.createElement(importModule.default, finalProps)
                );
              });
            }
          }`;
}
function generateReactIslandSSRDefinition(enabled) {
	if (!enabled) return "";
	return `
          exportModule.__mf_island = {
            version: 1,
            async renderToHtml(props) {
              if (typeof importModule.default !== "function" && typeof importModule.default !== "object") {
                throw new Error("[Module Federation] A React island expose must have a default component export");
              }
              const loadedProps = typeof importModule.load === "function" ? await importModule.load() : {};
              const finalProps = Object.assign({}, loadedProps || {}, props || {});
              const [React, ReactDOMServer] = await Promise.all([
                import("react"),
                import("react-dom/server")
              ]);
              const body = ReactDOMServer.renderToString(
                React.createElement(importModule.default, finalProps)
              );
              const state = encodeURIComponent(JSON.stringify(finalProps));
              return '<div data-mf-island-state="' + state + '">' + body + '</div>';
            },
            hydrate() {
              return Promise.reject(new Error("[Module Federation] hydrate is only available in the browser remote entry"));
            }
          }`;
}
const REACT_ISLAND_CLIENT_ID_PREFIX = "virtual:mf-react-island-client:";
const REACT_ISLAND_SERVER_ID_PREFIX = "virtual:mf-react-island-server:";
const RESOLVED_REACT_ISLAND_CLIENT_ID_PREFIX = `\0${REACT_ISLAND_CLIENT_ID_PREFIX}`;
const RESOLVED_REACT_ISLAND_SERVER_ID_PREFIX = `\0${REACT_ISLAND_SERVER_ID_PREFIX}`;
function encodeIslandRemoteId(remoteId) {
	return encodeURIComponent(remoteId);
}
function decodeIslandRemoteId(encodedRemoteId) {
	return decodeURIComponent(encodedRemoteId);
}
function getReactIslandImportRemoteId(source) {
	const queryIndex = source.indexOf("?");
	if (queryIndex === -1) return;
	if (!new URLSearchParams(source.slice(queryIndex + 1)).has("mf-island")) return;
	return source.slice(0, queryIndex);
}
function getReactIslandServerImportId(remoteId) {
	return `${REACT_ISLAND_SERVER_ID_PREFIX}${encodeIslandRemoteId(remoteId)}`;
}
function getReactIslandClientImportId(remoteId) {
	return `${REACT_ISLAND_CLIENT_ID_PREFIX}${encodeIslandRemoteId(remoteId)}`;
}
function resolveReactIslandConsumerId(id) {
	if (id.startsWith("virtual:mf-react-island-server:")) return `\0${id}`;
	if (id.startsWith("virtual:mf-react-island-client:")) return `\0${id}`;
}
function remoteIdFromResolvedIslandId(id, prefix) {
	if (!id.startsWith(prefix)) return;
	return decodeIslandRemoteId(id.slice(prefix.length));
}
/** Generates the server half of the opt-in `?mf-island` consumer component. */
function generateReactIslandConsumerServer(remoteId) {
	const source = JSON.stringify(remoteId);
	return `import * as React from "react";
import IslandClient from ${JSON.stringify(getReactIslandClientImportId(remoteId))};

const islandModulePromise = import(${source});

async function loadIslandModule() {
  const namespace = await islandModulePromise;
  const pending = namespace && namespace.__mf_remote_pending;
  if (pending && typeof pending.then === "function") return pending;
  return namespace && namespace.__moduleExports || namespace;
}

export default async function ModuleFederationIsland(props) {
  const remoteModule = await loadIslandModule();
  const shell = remoteModule && remoteModule.__mf_island;
  if (!shell || typeof shell.renderToHtml !== "function") {
    throw new Error(${JSON.stringify(`[Module Federation] ${remoteId} does not expose an SSR island capability`)});
  }
  const html = await shell.renderToHtml(props);
  return React.createElement(IslandClient, { html, islandProps: props });
}`;
}
/** Generates the client boundary which hydrates with the remote-owned React. */
function generateReactIslandConsumerClient(remoteId) {
	return `"use client";

import * as React from "react";

const islandModulePromise = import(${JSON.stringify(remoteId)});

async function loadIslandModule() {
  const namespace = await islandModulePromise;
  const pending = namespace && namespace.__mf_remote_pending;
  if (pending && typeof pending.then === "function") return pending;
  return namespace && namespace.__moduleExports || namespace;
}

export default function ModuleFederationIslandClient({ html, islandProps }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    void loadIslandModule().then((remoteModule) => {
      const shell = remoteModule && remoteModule.__mf_island;
      if (!shell || typeof shell.hydrate !== "function") {
        throw new Error(${JSON.stringify(`[Module Federation] ${remoteId} does not expose a client island capability`)});
      }
      return shell.hydrate(element, islandProps);
    });
  }, []);

  return React.createElement("div", {
    ref,
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: { __html: html },
  });
}`;
}
function loadReactIslandConsumerModule(id) {
	const serverRemoteId = remoteIdFromResolvedIslandId(id, RESOLVED_REACT_ISLAND_SERVER_ID_PREFIX);
	if (serverRemoteId !== void 0) return generateReactIslandConsumerServer(serverRemoteId);
	const clientRemoteId = remoteIdFromResolvedIslandId(id, RESOLVED_REACT_ISLAND_CLIENT_ID_PREFIX);
	if (clientRemoteId !== void 0) return generateReactIslandConsumerClient(clientRemoteId);
}
//#endregion
//#region src/virtualModules/virtualModuleScope.ts
function getVirtualModuleScopeKey(options) {
	return `${options.internalName}__${options.filename}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function compareConfigValues(a, b) {
	const serializedA = JSON.stringify(a);
	const serializedB = JSON.stringify(b);
	return serializedA < serializedB ? -1 : serializedA > serializedB ? 1 : 0;
}
function stableConfigValue(value, ancestors = /* @__PURE__ */ new WeakSet()) {
	if (typeof value === "function") return value.toString();
	if (!value || typeof value !== "object") return value;
	if (value instanceof Date) return {
		type: "Date",
		value: value.toISOString()
	};
	if (value instanceof RegExp) return {
		type: "RegExp",
		source: value.source,
		flags: value.flags
	};
	if (ancestors.has(value)) return "__circular__";
	ancestors.add(value);
	let result;
	if (value instanceof Map) {
		const entries = [...value.entries()].map(([key, item]) => [stableConfigValue(key, ancestors), stableConfigValue(item, ancestors)]);
		entries.sort(compareConfigValues);
		result = {
			type: "Map",
			entries
		};
	} else if (value instanceof Set) {
		const values = [...value].map((item) => stableConfigValue(item, ancestors));
		values.sort(compareConfigValues);
		result = {
			type: "Set",
			values
		};
	} else result = Array.isArray(value) ? value.map((item) => stableConfigValue(item, ancestors)) : Object.fromEntries(Object.entries(value).filter(([key]) => key !== "implementation").sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, stableConfigValue(item, ancestors)]));
	ancestors.delete(value);
	return result;
}
function getFederationScopeKey(options) {
	const identity = JSON.stringify(stableConfigValue(options));
	const ownerId = BigInt(`0x${createHash("sha256").update(identity).digest("hex").slice(0, 12)}`);
	return `${options.internalName}${MF_OWNER_INFIX}${ownerId}`;
}
//#endregion
//#region src/virtualModules/virtualExposes.ts
const EXPOSES_CSS_MAP_PLACEHOLDER = "__MF_EXPOSES_CSS_MAP__";
function getExposesCssMapPlaceholder() {
	return EXPOSES_CSS_MAP_PLACEHOLDER;
}
function getVirtualExposesId(options) {
	return `virtual:mf-exposes:${getVirtualModuleScopeKey(options)}`;
}
function generateExposes(options, remoteDependencyMap = {}, command = "build", reactIslandExposes = /* @__PURE__ */ new Set()) {
	return `
    const cssAssetMap = ${JSON.stringify(options.bundleAllCSS ? EXPOSES_CSS_MAP_PLACEHOLDER : {})};
    const injectedCssHrefs = new Set();
    const exposeLoadPromises = new Map();

    // Shared and remote readiness is handled by explicit Promise barriers below
    // and by remoteEntry's pendingShareLoads barrier. Keep this map scoped to a
    // single expose: unrelated exposes must stay independent and load in parallel.
    function loadExposedModule(exposeKey, loader) {
      let load = exposeLoadPromises.get(exposeKey);
      if (!load) {
        load = Promise.resolve()
          .then(loader)
          .catch((error) => {
            exposeLoadPromises.delete(exposeKey);
            throw error;
          });
        exposeLoadPromises.set(exposeKey, load);
      }
      return load;
    }

    async function injectCssAssets(exposeKey) {
      if (typeof document === "undefined") {
        return;
      }

      // Replaced at build time with expose -> css asset paths.
      const cssAssets = cssAssetMap[exposeKey] || [];

      await Promise.all(
        cssAssets.map((cssAsset) => {
          const href = new URL(cssAsset, import.meta.url).href;

          // Same expose can be resolved multiple times in one page.
          if (injectedCssHrefs.has(href)) {
            return Promise.resolve();
          }
          injectedCssHrefs.add(href);

          // Check for any existing stylesheet with the same href, not just
          // MF-injected ones. This prevents duplicate <link> tags when Vite's
          // own CSS module injection or MF runtime's createLink has already
          // created a <link rel="stylesheet"> for the same URL.
          const existingLink = document.querySelector(
            \`link[rel="stylesheet"][href="\${href}"]\`
          );
          if (existingLink) {
            return Promise.resolve();
          }

          return new Promise((resolve, reject) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(\`[Module Federation] Failed to load CSS asset: \${href}\`));
            document.head.appendChild(link);
          });
        })
      );
    }

    export default {
    ${Object.keys(options.exposes).map((key) => {
		const remoteDependencyPreloads = (remoteDependencyMap[key] ?? []).map((remoteId) => {
			const virtualRemote = getRemoteVirtualModule(remoteId, command, false, "unified", options);
			return `import(${JSON.stringify(virtualRemote.getImportId())})
            .then((mod) => mod.__mf_remote_pending)`;
		}).join(",");
		return `
        ${JSON.stringify(key)}: async () => {
          await injectCssAssets(${JSON.stringify(key)})
          await Promise.all([${remoteDependencyPreloads}])
          const importModule = await loadExposedModule(
            ${JSON.stringify(key)},
            () => import(${JSON.stringify(options.exposes[key].import)})
          )
          const dependencyPending = importModule && importModule.__mf_remote_dependency_pending;
          if (dependencyPending && typeof dependencyPending.then === "function") {
            await dependencyPending;
          }
          const exportModule = {}
          Object.assign(exportModule, importModule)
          ${generateReactIslandBrowserDefinition(reactIslandExposes.has(key))}
          Object.defineProperty(exportModule, "__esModule", {
            value: true,
            enumerable: false
          })
          return exportModule
        }
      `;
	}).join(",")}
  }
  `;
}
//#endregion
//#region src/utils/sharedExportConditions.ts
const DEFAULT_CLIENT_EXPORT_CONDITIONS = [
	"browser",
	"import",
	"module",
	"default"
];
const DEFAULT_NODE_SSR_EXPORT_CONDITIONS = [
	"node",
	"import",
	"module",
	"default"
];
const DEFAULT_WEBWORKER_SSR_EXPORT_CONDITIONS = [
	"worker",
	"browser",
	"import",
	"module",
	"default"
];
const VITE_DEV_PROD_CONDITION = "development|production";
function appendConditions(conditions, fallbackConditions) {
	return [.../* @__PURE__ */ new Set([...conditions, ...fallbackConditions])];
}
function resolveViteModeCondition(conditions, isProduction) {
	const modeCondition = isProduction ? "production" : "development";
	return [...new Set(conditions.map((condition) => condition === VITE_DEV_PROD_CONDITION ? modeCondition : condition))];
}
function getSharedExportConditions({ environmentConditions, isProduction, isSsr, rootConditions, ssrConditions, ssrTarget = "node" }) {
	if (environmentConditions !== void 0) return resolveViteModeCondition(appendConditions(environmentConditions, ["import", "default"]), isProduction);
	const defaultConditions = isSsr ? ssrTarget === "webworker" ? DEFAULT_WEBWORKER_SSR_EXPORT_CONDITIONS : DEFAULT_NODE_SSR_EXPORT_CONDITIONS : DEFAULT_CLIENT_EXPORT_CONDITIONS;
	const configuredConditions = isSsr ? ssrConditions ?? rootConditions : rootConditions;
	if (configuredConditions !== void 0) return resolveViteModeCondition(appendConditions(configuredConditions, defaultConditions), isProduction);
	return [...defaultConditions];
}
function isReactServerConditions(conditions) {
	return Boolean(conditions?.includes("react-server"));
}
//#endregion
//#region src/virtualModules/virtualRuntimeInitStatus.ts
const virtualRuntimeInitStatus = new VirtualModule("runtimeInit");
const runtimeInitModules = /* @__PURE__ */ new WeakMap();
const MODULE_CACHE_GLOBAL_KEY = "__mf_module_cache__";
const REACT_SERVER_MODULE_CACHE_GLOBAL_KEY = "__mf_module_cache_react_server__";
const MODULE_CACHE_SHARE_SCOPE_KEY = "module-federation.vite-module-cache";
function getModuleCacheGlobalKey(exportConditions) {
	return isReactServerConditions(exportConditions) ? REACT_SERVER_MODULE_CACHE_GLOBAL_KEY : MODULE_CACHE_GLOBAL_KEY;
}
function getRuntimeInitModule(options) {
	if (!options) return virtualRuntimeInitStatus;
	let runtimeInitModule = runtimeInitModules.get(options);
	if (!runtimeInitModule) {
		runtimeInitModule = new VirtualModule("runtimeInit", "__mf_v__", "", getFederationScopeKey(options));
		runtimeInitModules.set(options, runtimeInitModule);
	}
	return runtimeInitModule;
}
function getRuntimeInitStatusImportId(options) {
	return getRuntimeInitModule(options).getImportId();
}
function getRuntimeRemoteCachePrefix(options) {
	return options ? `${getRuntimeInitStatusImportId(options)}::` : "";
}
function getRuntimeRemoteAlias(alias, options) {
	if (!options) return alias;
	return `${getFederationScopeKey(options)}__${alias}`;
}
function getSsrRuntimeRemotes(remotes, options) {
	return Object.entries(remotes).map(([name, item]) => ({
		name: getRuntimeRemoteAlias(name, options),
		entry: item.entry,
		type: item.type ?? "module"
	}));
}
function getRuntimeInitGlobalKey(ownerImportId) {
	return `__mf_init__${ownerImportId ?? virtualRuntimeInitStatus.getImportId()}__`;
}
function getDeferredInitPromiseCode() {
	return `let initResolve, initReject;
  const initPromise = new Promise((re, rj) => {
    initResolve = re;
    initReject = rj;
  });`;
}
let _ssrRemotes = [];
function getSsrNoopResolveCode(enableSsrInit, hostInitImportId, initResolveExpression = "initResolve", ssrRemotes = _ssrRemotes) {
	if (!enableSsrInit) return "";
	return `if (${SERVER_ENV_GUARD}) {
    var _noop = { loadRemote: function() { return Promise.resolve(undefined); }, loadShare: function() { return Promise.resolve(undefined); } };
    ${hostInitImportId ? `import(${toSafeJsLiteral(hostInitImportId)})
      .then(function(mod) { return mod.hostInitPromise; })
      .then(function(runtime) {
        ${initResolveExpression}(runtime);
        return true;
      })
      .catch(function() {
        return false;
      })` : "Promise.resolve(false)"}.then(function(resolved) {
      if (resolved) return;
      return import(/* @vite-ignore */ '@module-federation/runtime').then(function(runtimeMod) {
        return import(/* @vite-ignore */ '@module-federation/vite/ssrEntryLoader').then(
          function(loaderMod) { return [runtimeMod, [loaderMod.default()]]; },
          function() { return [runtimeMod, []]; }
        );
      }).then(function(pair) {
        var runtime = pair[0].init({ name: '__mf_ssr_host__', remotes: ${toSafeJsLiteral(ssrRemotes)}, shared: {}, plugins: pair[1] });
        ${initResolveExpression}(runtime);
      }, function() {
        ${initResolveExpression}(_noop);
      });
    });
  }`;
}
function getRuntimeInitStateBootstrapCode(options) {
	return `
const ${options.globalKeyVar} = ${toSafeJsLiteral(getRuntimeInitGlobalKey(options.ownerImportId))};
let ${options.stateVar} = globalThis[${options.globalKeyVar}];
if (!${options.stateVar}) {
  ${getDeferredInitPromiseCode()}
  ${options.stateVar} = globalThis[${options.globalKeyVar}] = {
    initPromise,
    initResolve,
    initReject,
  };
  ${getSsrNoopResolveCode(options.enableSsrInit, options.hostInitImportId, "initResolve", options.ssrRemotes)}
}
const ${options.exposedConst} = ${options.stateVar}.${options.exposedProperty};
`;
}
function getRuntimeInitBootstrapCode(enableSsrInit = false, ownerImportId, ssrRemotes, hostInitImportId = ownerImportId, exportConditions) {
	return `
const globalKey = ${toSafeJsLiteral(getRuntimeInitGlobalKey(ownerImportId))};
const moduleCacheGlobalKey = ${toSafeJsLiteral(getModuleCacheGlobalKey(exportConditions))};
globalThis[moduleCacheGlobalKey] ||= { share: {}, remote: {} };
globalThis[moduleCacheGlobalKey].share ||= {};
globalThis[moduleCacheGlobalKey].remote ||= {};
if (!globalThis[globalKey]) {
  ${getDeferredInitPromiseCode()}
globalThis[globalKey] = {
    initPromise,
    initResolve,
    initReject,
    moduleCache: globalThis[moduleCacheGlobalKey],
  };
}
${enableSsrInit ? `
if (${SERVER_ENV_GUARD} && !globalThis[globalKey].ssrInitStarted) {
  globalThis[globalKey].ssrInitStarted = true;
  ${getSsrNoopResolveCode(enableSsrInit, hostInitImportId, "globalThis[globalKey].initResolve", ssrRemotes)}
}` : ""}
globalThis[globalKey].moduleCache = globalThis[moduleCacheGlobalKey];
globalThis[globalKey].moduleCache.share ||= {};
globalThis[globalKey].moduleCache.remote ||= {};
`;
}
function getRuntimeModuleCacheBootstrapCode(exportConditions) {
	return `
const __mfCacheGlobalKey = ${toSafeJsLiteral(getModuleCacheGlobalKey(exportConditions))};
globalThis[__mfCacheGlobalKey] ||= { share: {}, remote: {} };
globalThis[__mfCacheGlobalKey].share ||= {};
globalThis[__mfCacheGlobalKey].remote ||= {};
const __mfModuleCache = globalThis[__mfCacheGlobalKey];
const __mfTrackPendingShareLoad = (promise) => {
  const pendingShareLoads = (__mfModuleCache.pendingShareLoads ||= []);
  pendingShareLoads.push(promise);
  const cleanup = () => {
    const index = pendingShareLoads.indexOf(promise);
    if (index !== -1) pendingShareLoads.splice(index, 1);
  };
  void promise.then(cleanup, cleanup);
  return promise;
};
for (const __mfShareKey of Object.keys(__mfModuleCache.share)) {
  if (__mfShareKey.startsWith("default:")) {
    const __mfLegacyShareKey = __mfShareKey.slice("default:".length);
    if (__mfModuleCache.share[__mfLegacyShareKey] === undefined) {
      __mfModuleCache.share[__mfLegacyShareKey] = __mfModuleCache.share[__mfShareKey];
    }
  } else if (!__mfShareKey.includes(":")) {
    const __mfDefaultShareKey = "default:" + __mfShareKey;
    if (__mfModuleCache.share[__mfDefaultShareKey] === undefined) {
      __mfModuleCache.share[__mfDefaultShareKey] = __mfModuleCache.share[__mfShareKey];
    }
  }
}
`;
}
function getRuntimeInitPromiseBootstrapCode(enableSsrInit = false, ownerImportId, ssrRemotes, hostInitImportId = ownerImportId) {
	return getRuntimeInitStateBootstrapCode({
		globalKeyVar: "__mfPromiseGlobalKey",
		stateVar: "__mfPromiseState",
		exposedConst: "initPromise",
		exposedProperty: "initPromise",
		enableSsrInit,
		ownerImportId,
		hostInitImportId,
		ssrRemotes
	});
}
function getRuntimeInitResolveBootstrapCode(enableSsrInit = false, ownerImportId, ssrRemotes, hostInitImportId = ownerImportId) {
	return getRuntimeInitStateBootstrapCode({
		globalKeyVar: "__mfResolveGlobalKey",
		stateVar: "__mfResolveState",
		exposedConst: "initResolve",
		exposedProperty: "initResolve",
		enableSsrInit,
		ownerImportId,
		hostInitImportId,
		ssrRemotes
	});
}
function writeRuntimeInitStatus(command, enableSsrInit = false, hostInitImportId, options, ssrRemotes = _ssrRemotes) {
	const exportStatement = command === "build" ? `const { initPromise, initResolve, initReject, moduleCache } = globalThis[globalKey];
export { initPromise, initResolve, initReject, moduleCache };` : `module.exports = globalThis[globalKey];`;
	const ownerImportId = options ? getRuntimeInitStatusImportId(options) : hostInitImportId;
	getRuntimeInitModule(options).writeSync(`
${getRuntimeInitBootstrapCode(enableSsrInit, ownerImportId, ssrRemotes, hostInitImportId)}
${exportStatement}
`);
}
//#endregion
//#region src/plugins/pluginReactMixedModeGuard.ts
function createReactMixedModeRuntimeGuard() {
	return `const __mfReactInternals = mod["__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE"];
if (__mfReactInternals && "A" in __mfReactInternals) {
  let __mfReactDispatcher = __mfReactInternals.A;
  Object.defineProperty(__mfReactInternals, "A", {
    configurable: true,
    enumerable: true,
    get: () => __mfReactDispatcher,
    set: (next) => {
      if (next && typeof next.getOwner !== "function") next.getOwner = () => null;
      __mfReactDispatcher = next;
    },
  });
  __mfReactInternals.A = __mfReactDispatcher;
}`;
}
//#endregion
//#region src/utils/treeShaking.ts
function shouldAnalyzeSharedExports(shareItem) {
	return !!(shareItem && (shareItem.shareConfig.treeShaking || shareItem.shareConfig.import === false));
}
const legacyTreeShakingState = {
	inferredUsage: /* @__PURE__ */ new Map(),
	buildMode: false
};
const treeShakingStates = /* @__PURE__ */ new WeakMap();
function getTreeShakingState(options) {
	if (!options) return legacyTreeShakingState;
	let state = treeShakingStates.get(options);
	if (!state) {
		state = {
			inferredUsage: /* @__PURE__ */ new Map(),
			buildMode: false
		};
		treeShakingStates.set(options, state);
	}
	return state;
}
function setTreeShakingBuildMode(enabled, options) {
	getTreeShakingState(options).buildMode = enabled;
}
function resetTreeShakingExports(options) {
	getTreeShakingState(options).inferredUsage.clear();
}
function getOrCreateExportRecord(sharedKey, request, options) {
	const inferredUsage = getTreeShakingState(options).inferredUsage;
	let byRequest = inferredUsage.get(sharedKey);
	if (!byRequest) {
		byRequest = /* @__PURE__ */ new Map();
		inferredUsage.set(sharedKey, byRequest);
	}
	let record = byRequest.get(request);
	if (!record) {
		record = {
			requiresFullBundle: false,
			usedExports: /* @__PURE__ */ new Set()
		};
		byRequest.set(request, record);
	}
	return record;
}
function recordTreeShakingExports(sharedKey, exports, request = sharedKey, options) {
	const record = getOrCreateExportRecord(sharedKey, request, options);
	exports.forEach((name) => record.usedExports.add(name));
}
function markTreeShakingPackageUnsafe(sharedKey, request = sharedKey, options) {
	getOrCreateExportRecord(sharedKey, request, options).requiresFullBundle = true;
}
function getExportRecords(sharedKey, request, options) {
	const inferredUsage = getTreeShakingState(options).inferredUsage;
	if (sharedKey) {
		const records = inferredUsage.get(sharedKey);
		const wildcard = records?.get("*");
		const exact = records?.get(request);
		return [wildcard, exact === wildcard ? void 0 : exact].filter((record) => !!record);
	}
	const records = [];
	inferredUsage.forEach((byRequest, configuredKey) => {
		const wildcard = byRequest.get("*");
		const exact = byRequest.get(request);
		const keyBase = configuredKey.endsWith("/") ? configuredKey.slice(0, -1) : configuredKey;
		const requestMatchesConfiguredKey = request === keyBase || request.startsWith(`${keyBase}/`);
		if (wildcard && requestMatchesConfiguredKey) records.push(wildcard);
		if (exact && exact !== wildcard) records.push(exact);
	});
	return records;
}
/**
* Return the analyzed requirement for one concrete shared request.
*
* Callers that know the configured share key should pass it explicitly. The
* fallback lookup across keys keeps aliases/backwards-compatible callers
* working, while still keeping each concrete request's exports isolated.
*/
function getSharedExportUsage(request, shareItem, sharedKey, options) {
	const treeShaking = shareItem?.shareConfig.treeShaking;
	if (!shouldAnalyzeSharedExports(shareItem) || !getTreeShakingState(options).buildMode) return;
	const records = getExportRecords(sharedKey, request, options);
	if (records.some((record) => record.requiresFullBundle)) return { kind: "full" };
	const configured = treeShaking?.usedExports ?? [];
	const result = new Set(configured);
	records.forEach((record) => record.usedExports.forEach((name) => result.add(name)));
	if (result.size > 0) return {
		kind: "exports",
		usedExports: [...result].sort()
	};
	return records.length > 0 ? {
		kind: "exports",
		usedExports: []
	} : { kind: "unknown" };
}
function getTreeShakingExportUsage(request, shareItem, sharedKey, options) {
	if (!shareItem?.shareConfig.treeShaking) return void 0;
	return getSharedExportUsage(request, shareItem, sharedKey, options);
}
function getModuleSource(node) {
	if (!node || typeof node !== "object") return void 0;
	const source = node;
	if (source.type === "Literal" && typeof source.value === "string") return source.value;
	if (source.type === "StringLiteral" && typeof source.value === "string") return source.value;
	if (source.type !== "TemplateLiteral") return void 0;
	const expressions = Array.isArray(source.expressions) ? source.expressions : [];
	const quasis = Array.isArray(source.quasis) ? source.quasis : [];
	if (expressions.length > 0 || quasis.length !== 1) return void 0;
	const value = quasis[0]?.value;
	return typeof value?.cooked === "string" ? value.cooked : typeof value?.raw === "string" ? value.raw : void 0;
}
function getExportedName(node) {
	if (!node || typeof node !== "object") return void 0;
	const exported = node;
	if (exported.type === "Identifier" && typeof exported.name === "string") return exported.name;
	if ((exported.type === "Literal" || exported.type === "StringLiteral") && typeof exported.value === "string") return exported.value;
}
function isTypeOnly(node) {
	return node.importKind === "type" || node.exportKind === "type";
}
function forEachAstNode(root, visit) {
	const stack = [root];
	const seen = /* @__PURE__ */ new Set();
	while (stack.length > 0) {
		const value = stack.pop();
		if (!value || typeof value !== "object") continue;
		if (seen.has(value)) continue;
		seen.add(value);
		if (Array.isArray(value)) {
			for (let index = value.length - 1; index >= 0; index--) stack.push(value[index]);
			continue;
		}
		const node = value;
		if (typeof node.type === "string") visit(node);
		Object.entries(node).forEach(([key, child]) => {
			if (key !== "parent" && key !== "loc") stack.push(child);
		});
	}
}
function collectImportDeclaration(node, source, record, markUnsafe) {
	if (isTypeOnly(node)) return;
	const specifiers = Array.isArray(node.specifiers) ? node.specifiers : [];
	if (specifiers.length === 0) {
		markUnsafe(source);
		return;
	}
	const names = [];
	for (const specifier of specifiers) {
		if (isTypeOnly(specifier)) continue;
		if (specifier.type === "ImportNamespaceSpecifier") {
			markUnsafe(source);
			return;
		}
		if (specifier.type === "ImportDefaultSpecifier") {
			names.push("default");
			continue;
		}
		if (specifier.type === "ImportSpecifier") {
			const imported = specifier.imported;
			if (imported?.type === "Literal" || imported?.type === "StringLiteral") {
				markUnsafe(source);
				return;
			}
			const name = getExportedName(specifier.imported);
			if (!name) {
				markUnsafe(source);
				return;
			}
			names.push(name);
			continue;
		}
		markUnsafe(source);
		return;
	}
	record(names, source);
}
function collectReExport(node, source, record, markUnsafe) {
	if (isTypeOnly(node)) return;
	if (node.type === "ExportAllDeclaration") {
		markUnsafe(source);
		return;
	}
	const specifiers = Array.isArray(node.specifiers) ? node.specifiers : [];
	if (specifiers.length === 0) {
		markUnsafe(source);
		return;
	}
	const names = [];
	for (const specifier of specifiers) {
		if (isTypeOnly(specifier)) continue;
		if (specifier.type !== "ExportSpecifier") {
			markUnsafe(source);
			return;
		}
		const local = specifier.local;
		if (local?.type === "Literal" || local?.type === "StringLiteral") {
			markUnsafe(source);
			return;
		}
		const name = getExportedName(specifier.local);
		if (!name) {
			markUnsafe(source);
			return;
		}
		names.push(name);
	}
	record(names, source);
}
/**
* Collect the exports required by a consumer's ESM graph.
*
* Parsing the module avoids treating import-looking text in comments, strings,
* templates, or regular expressions as real dependencies. If parsing fails,
* every configured share whose exports are analyzed is conservatively marked
* as requiring its full export surface instead of guessing from source text.
*
* Generated federation wrappers are excluded because their imports describe
* the wrapper implementation, not the consumer's requirements.
*/
function collectTreeShakingImports(code, id, shared, findSharedKey, record, markUnsafe) {
	const normalizedId = normalizePathForImport(id);
	if (normalizedId.includes("__prebuild__") || normalizedId.includes("__loadShare__") || normalizedId.includes("__mf_tree_shaking_graph__")) return;
	let ast;
	try {
		ast = parseAst(code);
	} catch {
		Object.entries(shared).forEach(([sharedKey, shareItem]) => {
			if (shouldAnalyzeSharedExports(shareItem)) markUnsafe(sharedKey, "*");
		});
		return;
	}
	const matchShared = (source) => {
		const sharedKey = findSharedKey(source, shared);
		return sharedKey && shouldAnalyzeSharedExports(shared[sharedKey]) ? sharedKey : void 0;
	};
	const recordSource = (names, source) => {
		const sharedKey = matchShared(source);
		if (sharedKey) record(sharedKey, names, source);
	};
	const markSourceUnsafe = (source) => {
		const sharedKey = matchShared(source);
		if (sharedKey) markUnsafe(sharedKey, source);
	};
	forEachAstNode(ast, (node) => {
		if (node.type === "ImportDeclaration") {
			const source = getModuleSource(node.source);
			if (source) collectImportDeclaration(node, source, recordSource, markSourceUnsafe);
			return;
		}
		if ((node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") && node.source) {
			const source = getModuleSource(node.source);
			if (source) collectReExport(node, source, recordSource, markSourceUnsafe);
			return;
		}
		if (node.type === "ImportExpression") {
			const source = getModuleSource(node.source);
			if (source) markSourceUnsafe(source);
			return;
		}
		if (node.type === "CallExpression") {
			const callee = node.callee;
			const args = Array.isArray(node.arguments) ? node.arguments : [];
			if (callee?.type === "Identifier" && callee.name === "require" && args.length > 0) {
				const source = getModuleSource(args[0]);
				if (source) markSourceUnsafe(source);
			}
		}
	});
}
//#endregion
//#region src/utils/typeArgumentScanner.ts
function getTypeArgumentStartContext(source, start) {
	let previous = start - 1;
	while (previous >= 0 && /\s/.test(source[previous])) previous--;
	const previousChar = source[previous] || "";
	const followsNamedExpression = /[$_\u200C\u200D\p{ID_Continue})\]>]/u.test(previousChar);
	const startsStandaloneGeneric = previousChar !== "" && "=([{,:".includes(previousChar);
	if (!followsNamedExpression && !startsStandaloneGeneric) return void 0;
	return { followsNamedExpression };
}
function updateTypeArgumentGroupDepth(char, state) {
	if (char === "(" || char === "[" || char === "{") {
		state.groupDepth++;
		return "handled";
	}
	if (char !== ")" && char !== "]" && char !== "}") return void 0;
	if (state.groupDepth === 0) return "invalid";
	state.groupDepth--;
	return "handled";
}
function updateTypeArgumentAngleDepth(source, index, state) {
	const char = source[index];
	if (char === "<") {
		if (source[index + 1] === "=" || source[index + 1] === "<") return "invalid";
		state.angleDepth++;
		return "handled";
	}
	if (char !== ">") return void 0;
	if (source[index - 1] === "=" || source[index + 1] === "=") return "handled";
	state.angleDepth--;
	return state.angleDepth === 0 ? "closed" : "handled";
}
function hasLikelyTypeArgumentFollower(source, end, codePositions, followsNamedExpression) {
	let next = end + 1;
	while (next < source.length && (!codePositions[next] || /\s/.test(source[next]))) next++;
	if (next >= source.length || /[([.!?=;,)\]}:|&]/.test(source[next])) return true;
	if (source.slice(end + 1, next).includes("\n")) return true;
	const followingToken = source.slice(next).match(/^[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*/u)?.[0];
	return followingToken === "as" || followingToken === "satisfies" || !followsNamedExpression && followingToken !== void 0;
}
function isInvalidTypeArgumentTerminator(source, index, followsNamedExpression) {
	const char = source[index];
	return char === ";" || char === "=" && source[index + 1] !== ">" && followsNamedExpression;
}
/**
* Finds the end of a balanced, type-like angle-bracket range that contains a
* comma. Ambiguous syntax returns `undefined` so callers can fail closed.
*/
function findLikelyTypeArgumentEnd(source, start, codePositions) {
	const context = getTypeArgumentStartContext(source, start);
	if (!context) return void 0;
	const state = {
		angleDepth: 1,
		groupDepth: 0,
		sawTypeComma: false
	};
	for (let index = start + 1; index < source.length; index++) {
		if (!codePositions[index]) continue;
		const char = source[index];
		const groupAction = updateTypeArgumentGroupDepth(char, state);
		if (groupAction === "invalid") return void 0;
		if (groupAction === "handled") continue;
		const angleAction = updateTypeArgumentAngleDepth(source, index, state);
		if (angleAction === "invalid") return void 0;
		if (angleAction === "closed") return state.sawTypeComma && hasLikelyTypeArgumentFollower(source, index, codePositions, context.followsNamedExpression) ? index : void 0;
		if (angleAction === "handled") continue;
		if (char === "," && state.groupDepth === 0) {
			state.sawTypeComma = true;
			continue;
		}
		if (state.angleDepth === 1 && state.groupDepth === 0 && isInvalidTypeArgumentTerminator(source, index, context.followsNamedExpression)) return;
	}
}
//#endregion
//#region src/virtualModules/virtualShared_preBuild.ts
/**
* Even the resolveId hook cannot interfere with vite pre-build,
* and adding query parameter virtual modules will also fail.
* You can only proxy to the real file through alias
*/
/**
* shared will be proxied:
* 1. __prebuild__: export shareModule (pre-built source code of modules such as vue, react, etc.)
* 2. __loadShare__: load shareModule (mfRuntime.loadShare('vue'))
*/
const JS_IDENTIFIER_REGEX = /* @__PURE__ */ new RegExp("^[$_\\p{ID_Start}][$_\\u200C\\u200D\\p{ID_Continue}]*$", "u");
function escapeGeneratedStringLiteral(value) {
	return JSON.stringify(value).replace(/[<>\u2028\u2029]/g, (char) => {
		switch (char) {
			case "<": return "\\u003C";
			case ">": return "\\u003E";
			case "\u2028": return "\\u2028";
			case "\u2029": return "\\u2029";
			default: return char;
		}
	});
}
function getSharedCacheDescriptorLiteral(pkg, shareItem) {
	return JSON.stringify(getSharedCacheDescriptor(pkg, shareItem));
}
function isValidJsIdentifier(name) {
	return JS_IDENTIFIER_REGEX.test(name);
}
function isValidEsmExportName(name) {
	return !!name && name !== "default" && name !== "__esModule" && isValidJsIdentifier(name);
}
const JS_IDENTIFIER_PATTERN = `[\$_\\p{ID_Start}][\$_\\u200C\\u200D\\p{ID_Continue}]*`;
function resolvePackageEntryFromProjectRoot(pkg) {
	try {
		return createRequire$1(pathToFileURL(path$1.join(getPackageDetectionCwd(), "package.json"))).resolve(pkg);
	} catch {
		return;
	}
}
function getPackageEsmEntryPath(pkg) {
	return getInstalledPackageEntry(pkg, {
		conditions: [
			"browser",
			"import",
			"module",
			"default"
		],
		resolveSubpathWithRequire: false
	}) || resolvePackageEntryFromProjectRoot(pkg);
}
const packageNamedExportsCache = /* @__PURE__ */ new Map();
const sharedExportInspectionCache = /* @__PURE__ */ new Map();
function invalidateSharedExportInspectionCache(filePath) {
	if (!/(?:^|[/\\])node_modules(?:[/\\]|$)/.test(filePath)) sharedExportInspectionCache.clear();
}
const DEFAULT_SHARED_EXPORT_CONDITIONS = [
	"browser",
	"import",
	"module",
	"default"
];
function hasCodeMatch(source, regex, codePositions) {
	regex.lastIndex = 0;
	let match;
	while ((match = regex.exec(source)) !== null) if (codePositions[match.index]) return true;
	return false;
}
function hasCommonJsExports(source) {
	const codePositions = createCodePositionMap(source);
	if (hasCodeMatch(source, /\bmodule\s*(?:\.exports|\[\s*['"]exports['"]\s*\])/g, codePositions)) return true;
	const exportsRegex = /\bexports\s*(?:\.|\[|[,)]|=(?!=|>))/g;
	let match;
	while ((match = exportsRegex.exec(source)) !== null) {
		if (!codePositions[match.index]) continue;
		let previousCodeIndex = match.index - 1;
		while (previousCodeIndex >= 0 && (/\s/.test(source[previousCodeIndex]) || !codePositions[previousCodeIndex])) previousCodeIndex--;
		if (source[previousCodeIndex] === ".") continue;
		return true;
	}
	return false;
}
function inspectSharedExportsFromFile(entryPath, exportConditions = DEFAULT_SHARED_EXPORT_CONDITIONS) {
	if (!entryPath) return void 0;
	const cacheKey = `${entryPath}\0${exportConditions.join("\0")}`;
	if (sharedExportInspectionCache.has(cacheKey)) return sharedExportInspectionCache.get(cacheKey);
	try {
		const source = readFileSync(entryPath, "utf-8");
		const scanState = { complete: true };
		const namedExports = getNamedExportsViaRegex(source, entryPath, void 0, scanState, exportConditions);
		const commonJs = hasCommonJsExports(source);
		const inspection = {
			namedExports: scanState.complete && !commonJs ? namedExports : void 0,
			commonJs
		};
		sharedExportInspectionCache.set(cacheKey, inspection);
		return inspection;
	} catch {
		sharedExportInspectionCache.set(cacheKey, void 0);
		return;
	}
}
function getMutableExportsFromFile(entryPath, exportConditions = DEFAULT_SHARED_EXPORT_CONDITIONS, visited = /* @__PURE__ */ new Set()) {
	if (!entryPath || visited.has(entryPath)) return [];
	visited.add(entryPath);
	try {
		const source = readFileSync(entryPath, "utf-8");
		const codePositions = createCodePositionMap(source);
		const mutableBindings = /* @__PURE__ */ new Set();
		const mutableExports = /* @__PURE__ */ new Set();
		let match;
		const declarationRegex = new RegExp(`\\b(?:export\\s+)?(?:let|var)\\s+(${JS_IDENTIFIER_PATTERN})`, "gu");
		let declarationScanIndex = 0;
		let braceDepth = 0;
		while ((match = declarationRegex.exec(source)) !== null) {
			if (!codePositions[match.index]) continue;
			for (let index = declarationScanIndex; index < match.index; index++) {
				if (!codePositions[index]) continue;
				if (source[index] === "{") braceDepth++;
				else if (source[index] === "}") braceDepth--;
			}
			declarationScanIndex = match.index;
			if (braceDepth !== 0) continue;
			mutableBindings.add(match[1]);
			if (match[0].trimStart().startsWith("export")) mutableExports.add(match[1]);
		}
		const listRegex = /export\s*\{([^}]+)\}(?:\s*from\s*['"]([^'"]+)['"])?/g;
		while ((match = listRegex.exec(source)) !== null) {
			if (!codePositions[match.index]) continue;
			const reExportPath = match[2] ? resolveReExportModule(entryPath, match[2], exportConditions) : void 0;
			const reExportedMutable = new Set(reExportPath ? getMutableExportsFromFile(reExportPath, exportConditions, visited) : []);
			for (const rawSpecifier of match[1].split(",")) {
				const specifier = rawSpecifier.trim();
				if (!specifier || specifier.startsWith("type ")) continue;
				const parts = specifier.split(/\s+as\s+/);
				const local = parts[0].trim();
				const exported = (parts[1] || local).trim();
				if (isValidEsmExportName(exported) && (mutableBindings.has(local) || reExportedMutable.has(local))) mutableExports.add(exported);
			}
		}
		const starExportRegex = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
		while ((match = starExportRegex.exec(source)) !== null) {
			if (!codePositions[match.index]) continue;
			const resolved = resolveReExportModule(entryPath, match[1], exportConditions);
			for (const name of getMutableExportsFromFile(resolved, exportConditions, visited)) mutableExports.add(name);
		}
		visited.delete(entryPath);
		return Array.from(mutableExports);
	} catch {
		visited.delete(entryPath);
		return [];
	}
}
function getSharedMutableExports(pkg, shareItem, exportConditions = DEFAULT_SHARED_EXPORT_CONDITIONS) {
	const configuredImport = shareItem?.shareConfig.import;
	return getMutableExportsFromFile(typeof configuredImport === "string" ? resolveConfiguredImportPath(configuredImport, exportConditions) : getInstalledPackageEntry(pkg, {
		conditions: exportConditions,
		resolveSubpathWithRequire: false
	}), exportConditions);
}
function resolveConfiguredImportPath(importSource, exportConditions = DEFAULT_SHARED_EXPORT_CONDITIONS) {
	if (path$1.isAbsolute(importSource)) return resolveFileLikeModule(importSource);
	const projectRoot = getPackageDetectionCwd();
	if (importSource.startsWith(".")) return resolveFileLikeModule(path$1.resolve(projectRoot, importSource));
	const esmEntry = getInstalledPackageEntry(importSource, {
		conditions: exportConditions,
		resolveSubpathWithRequire: false
	});
	if (esmEntry) return esmEntry;
	try {
		return createRequire$1(pathToFileURL(path$1.join(projectRoot, "package.json"))).resolve(importSource);
	} catch {
		return;
	}
}
function resolveFileLikeModule(filePath) {
	if (existsSync(filePath) && !statSync(filePath).isDirectory()) return filePath;
	const extensions = [
		".ts",
		".tsx",
		".js",
		".jsx",
		".mjs",
		".mts"
	];
	for (const ext of extensions) {
		const candidate = filePath + ext;
		if (existsSync(candidate) && !statSync(candidate).isDirectory()) return candidate;
	}
	for (const ext of extensions) {
		const candidate = path$1.join(filePath, "index" + ext);
		if (existsSync(candidate) && !statSync(candidate).isDirectory()) return candidate;
	}
}
function resolveRelativeModule(filePath, specifier) {
	const dir = path$1.dirname(filePath);
	const exact = path$1.resolve(dir, specifier);
	if (existsSync(exact) && !statSync(exact).isDirectory()) return exact;
	const extensions = [
		".ts",
		".tsx",
		".js",
		".jsx",
		".mjs",
		".mts"
	];
	for (const ext of extensions) {
		const candidate = path$1.resolve(dir, specifier + ext);
		if (existsSync(candidate) && !statSync(candidate).isDirectory()) return candidate;
	}
	const resolved = path$1.resolve(dir, specifier);
	for (const ext of extensions) {
		const candidate = path$1.join(resolved, "index" + ext);
		if (existsSync(candidate)) return candidate;
	}
}
function resolveReExportModule(filePath, specifier, exportConditions) {
	if (specifier.startsWith(".")) return resolveRelativeModule(filePath, specifier);
	const esmEntry = getInstalledPackageEntry(specifier, {
		cwd: path$1.dirname(filePath),
		conditions: exportConditions,
		resolveSubpathWithRequire: false
	});
	if (esmEntry) return esmEntry;
	try {
		return resolveFileLikeModule(createRequire$1(pathToFileURL(filePath)).resolve(specifier));
	} catch {
		return;
	}
}
/** Marks a template-literal frame whose text (not its interpolation) is being scanned. */
const TEMPLATE_TEXT = Symbol("templateText");
function getAdditionalTopLevelDeclaratorNames(source, start, codePositions) {
	const names = [];
	let depth = 0;
	let quote;
	let escaped = false;
	let canStartRegex = true;
	const templateFrames = [];
	const inTemplateText = () => templateFrames[templateFrames.length - 1] === TEMPLATE_TEXT;
	for (let index = start; index < source.length; index++) {
		const char = source[index];
		if (inTemplateText()) {
			if (escaped) escaped = false;
			else if (char === "\\") escaped = true;
			else if (char === "$" && source[index + 1] === "{") {
				templateFrames.push(depth);
				index++;
				canStartRegex = true;
			} else if (char === "`") {
				templateFrames.pop();
				canStartRegex = false;
			}
			continue;
		}
		if (quote) {
			if (escaped) escaped = false;
			else if (char === "\\") escaped = true;
			else if (char === quote) quote = void 0;
			continue;
		}
		if (char === "`") {
			templateFrames.push(TEMPLATE_TEXT);
			canStartRegex = false;
			continue;
		}
		if (char === "\"" || char === "'") {
			quote = char;
			canStartRegex = false;
			continue;
		}
		if (char === "<" && source[index + 1] === "/") {
			const jsxClosingTag = source.slice(index).match(/^<\/\s*(?:[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}.:-]*\s*)?>/u);
			if (jsxClosingTag) {
				index += jsxClosingTag[0].length - 1;
				canStartRegex = false;
				continue;
			}
		}
		if (char === "/" && source[index + 1] === "/") {
			index = source.indexOf("\n", index + 2);
			if (index === -1) return names;
			continue;
		}
		if (char === "/" && source[index + 1] === "*") {
			const commentEnd = source.indexOf("*/", index + 2);
			if (commentEnd === -1) return void 0;
			index = commentEnd + 1;
			continue;
		}
		if (char === "/" && canStartRegex) {
			let regexEscaped = false;
			let inCharacterClass = false;
			let closed = false;
			for (index++; index < source.length; index++) {
				const regexChar = source[index];
				if (regexEscaped) {
					regexEscaped = false;
					continue;
				}
				if (regexChar === "\\") {
					regexEscaped = true;
					continue;
				}
				if (regexChar === "[") {
					inCharacterClass = true;
					continue;
				}
				if (regexChar === "]" && inCharacterClass) {
					inCharacterClass = false;
					continue;
				}
				if (regexChar === "/" && !inCharacterClass) {
					closed = true;
					while (/[$_\p{ID_Continue}]/u.test(source[index + 1] || "")) index++;
					break;
				}
				if (regexChar === "\n" || regexChar === "\r") return void 0;
			}
			if (!closed) return void 0;
			canStartRegex = false;
			continue;
		}
		if (char === "/") {
			canStartRegex = true;
			continue;
		}
		if (/[$_\p{ID_Start}]/u.test(char)) {
			const tokenStart = index;
			while (/[$_\u200C\u200D\p{ID_Continue}]/u.test(source[index + 1] || "")) index++;
			const token = source.slice(tokenStart, index + 1);
			if (depth === 0 && templateFrames.length === 0 && token === "export") {
				let previous = tokenStart - 1;
				while (/\s/.test(source[previous] || "")) previous--;
				if (source[previous] !== "." && /^\s+(?:(?:async\s+)?function\b|(?:abstract\s+)?class\b|const\b|let\b|var\b|enum\b|namespace\b|module\b|interface\b|type\b|declare\b|default\b|\{|\*)/.test(source.slice(index + 1))) return names;
			}
			canStartRegex = /^(?:await|case|delete|in|instanceof|new|return|throw|typeof|void|yield)$/.test(token);
			continue;
		}
		if (/\d/.test(char)) {
			while (/[\w.]/.test(source[index + 1] || "")) index++;
			canStartRegex = false;
			continue;
		}
		if ((char === "+" || char === "-") && source[index + 1] === char) {
			index++;
			continue;
		}
		if (char === "!" && source[index + 1] !== "=") continue;
		if (char === "<") {
			const typeArgumentEnd = findLikelyTypeArgumentEnd(source, index, codePositions);
			if (typeArgumentEnd !== void 0) {
				index = typeArgumentEnd;
				canStartRegex = false;
				continue;
			}
		}
		if (char === "(" || char === "[" || char === "{") {
			depth++;
			canStartRegex = true;
			continue;
		}
		if (char === ")" || char === "]" || char === "}") {
			if (char === "}" && templateFrames.length > 0 && templateFrames[templateFrames.length - 1] === depth) {
				templateFrames.pop();
				canStartRegex = false;
				continue;
			}
			depth = Math.max(0, depth - 1);
			canStartRegex = false;
			continue;
		}
		if (templateFrames.length === 0 && depth === 0 && char === ",") {
			let bindingStart = index + 1;
			while (/\s/.test(source[bindingStart] || "")) bindingStart++;
			const binding = source.slice(bindingStart).match(new RegExp(`^(${JS_IDENTIFIER_PATTERN})`, "u"));
			if (!binding || !isValidEsmExportName(binding[1])) return void 0;
			names.push(binding[1]);
			index = bindingStart + binding[1].length - 1;
			canStartRegex = false;
			continue;
		}
		if (templateFrames.length === 0 && depth === 0 && char === ";") return names;
		if (!/\s/.test(char)) canStartRegex = char !== ".";
	}
	return names;
}
function hasUnsupportedBindingPattern(source, start) {
	const opening = source[start];
	if (opening !== "{" && opening !== "[") return false;
	let depth = 0;
	for (let index = start; index < source.length; index++) {
		const char = source[index];
		if (char === "\"" || char === "'" || char === "`") return true;
		if (char === "(" || char === "/" || char === ":" && opening === "[") return true;
		if (char === "{" || char === "[") {
			depth++;
			if (depth > 1) return true;
			continue;
		}
		if (char === "}" || char === "]") {
			depth--;
			if (depth === 0) {
				let next = index + 1;
				while (/\s/.test(source[next] || "")) next++;
				return source[next] !== "=";
			}
		}
	}
	return true;
}
function getNamedExportsViaRegex(source, filePath, visited, scanState = { complete: true }, exportConditions = DEFAULT_SHARED_EXPORT_CONDITIONS) {
	const names = /* @__PURE__ */ new Set();
	const codePositions = createCodePositionMap(source);
	const recognizedExportStarts = /* @__PURE__ */ new Set();
	visited = visited || /* @__PURE__ */ new Set();
	if (filePath) visited.add(filePath);
	const declRegex = new RegExp(`export\\s+(?:async\\s+)?(?:function(?:\\*\\s*|\\s+\\*?\\s*)|const\\s+enum\\s+|const\\s+|let\\s+|var\\s+|class\\s+|abstract\\s+class\\s+|enum\\s+|namespace\\s+|module\\s+)(${JS_IDENTIFIER_PATTERN})`, "gu");
	let match;
	while ((match = declRegex.exec(source)) !== null) {
		if (!codePositions[match.index]) continue;
		recognizedExportStarts.add(match.index);
		const name = match[1];
		if (isValidEsmExportName(name)) names.add(name);
	}
	const exportedVariableDeclarationRegex = /export\s+(?:const|let|var)\s+/g;
	while ((match = exportedVariableDeclarationRegex.exec(source)) !== null) {
		if (!codePositions[match.index]) continue;
		const additionalNames = getAdditionalTopLevelDeclaratorNames(source, exportedVariableDeclarationRegex.lastIndex, codePositions);
		if (additionalNames === void 0) scanState.complete = false;
		else for (const name of additionalNames) names.add(name);
		if (hasUnsupportedBindingPattern(source, exportedVariableDeclarationRegex.lastIndex)) scanState.complete = false;
	}
	if (hasCodeMatch(source, /export\s+import\s+/g, codePositions) || hasCodeMatch(source, /export\s*=/g, codePositions)) scanState.complete = false;
	if (hasCodeMatch(source, /export\s+@/g, codePositions)) scanState.complete = false;
	const destructureRegex = /export\s+(?:const|let|var)\s+(\{[^}]*\}|\[[^\]]*\])\s*=/g;
	const bindingNameRegex = new RegExp(`^(${JS_IDENTIFIER_PATTERN})`, "u");
	while ((match = destructureRegex.exec(source)) !== null) {
		if (!codePositions[match.index]) continue;
		recognizedExportStarts.add(match.index);
		const inner = match[1].slice(1, -1);
		for (const part of inner.split(",")) {
			let token = part.split("=")[0].trim();
			if (token.startsWith("...")) token = token.slice(3).trim();
			if (!token) continue;
			if (token.includes(":")) token = token.slice(token.indexOf(":") + 1).trim();
			const bindingMatch = token.match(bindingNameRegex);
			if (bindingMatch && isValidEsmExportName(bindingMatch[1])) names.add(bindingMatch[1]);
		}
	}
	const listRegex = /export\s*\{([^}]+)\}/g;
	const typeOnlySpecifierRegex = new RegExp(`^type\\s+${JS_IDENTIFIER_PATTERN}(?:\\s+as\\s+${JS_IDENTIFIER_PATTERN})?$`, "u");
	const exportSpecifierRegex = new RegExp(`(?:\\S+\\s+as\\s+)?(${JS_IDENTIFIER_PATTERN})$`, "u");
	while ((match = listRegex.exec(source)) !== null) {
		if (!codePositions[match.index]) continue;
		recognizedExportStarts.add(match.index);
		const specifiers = match[1].split(",");
		for (const specifier of specifiers) {
			const trimmed = specifier.trim();
			if (!trimmed) continue;
			if (typeOnlySpecifierRegex.test(trimmed)) continue;
			const asMatch = trimmed.match(exportSpecifierRegex);
			if (!asMatch) {
				scanState.complete = false;
				continue;
			}
			const name = asMatch[1];
			if (isValidEsmExportName(name)) names.add(name);
			else if (name === "default" || name === "__esModule") {} else scanState.complete = false;
		}
	}
	const namespaceReExportRegex = new RegExp(`export\\s+\\*\\s+as\\s+(${JS_IDENTIFIER_PATTERN})\\s+from\\s+['"][^'"]+['"]`, "gu");
	while ((match = namespaceReExportRegex.exec(source)) !== null) {
		if (!codePositions[match.index]) continue;
		recognizedExportStarts.add(match.index);
		if (isValidEsmExportName(match[1])) names.add(match[1]);
	}
	if (hasCodeMatch(source, /export\s+\*\s+as\s+['"]/g, codePositions)) scanState.complete = false;
	if (filePath) {
		const starExportRegex = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
		while ((match = starExportRegex.exec(source)) !== null) {
			if (!codePositions[match.index]) continue;
			recognizedExportStarts.add(match.index);
			const specifier = match[1];
			const resolvedPath = resolveReExportModule(filePath, specifier, exportConditions);
			if (!resolvedPath) {
				scanState.complete = false;
				continue;
			}
			if (visited.has(resolvedPath)) continue;
			try {
				const reExportSource = readFileSync(resolvedPath, "utf-8");
				if (path$1.extname(resolvedPath) === ".cjs" || hasCommonJsExports(reExportSource)) {
					const requiredNames = getRequiredNamedExports(resolvedPath);
					if (!requiredNames?.length) {
						scanState.complete = false;
						continue;
					}
					for (const name of requiredNames) names.add(name);
					continue;
				}
				const reExportNames = getNamedExportsViaRegex(reExportSource, resolvedPath, visited, scanState, exportConditions);
				for (const name of reExportNames) names.add(name);
			} catch {
				scanState.complete = false;
			}
		}
	}
	const noNamedExportRegex = /export(?:\s+default\b|\s*\{\s*\}|\s+(?:type|interface|declare)\b)/g;
	while ((match = noNamedExportRegex.exec(source)) !== null) {
		if (!codePositions[match.index]) continue;
		recognizedExportStarts.add(match.index);
	}
	const exportKeywordRegex = /\bexport\b/g;
	while ((match = exportKeywordRegex.exec(source)) !== null) {
		if (!codePositions[match.index]) continue;
		if (recognizedExportStarts.has(match.index)) continue;
		let previousCodeIndex = match.index - 1;
		while (previousCodeIndex >= 0 && (/\s/.test(source[previousCodeIndex]) || !codePositions[previousCodeIndex])) previousCodeIndex--;
		if (source[previousCodeIndex] === ".") continue;
		let nextCodeIndex = match.index + match[0].length;
		while (nextCodeIndex < source.length && (/\s/.test(source[nextCodeIndex]) || !codePositions[nextCodeIndex])) nextCodeIndex++;
		if (source[nextCodeIndex] === "(") continue;
		let memberIndex = nextCodeIndex;
		if (source[memberIndex] === "?") {
			memberIndex++;
			while (memberIndex < source.length && (/\s/.test(source[memberIndex]) || !codePositions[memberIndex])) memberIndex++;
		}
		if (source[memberIndex] === ":") continue;
		scanState.complete = false;
		break;
	}
	return Array.from(names);
}
/**
* Reading a module's export names runs its top-level code inside the build
* process, and getPackageNamedExports deliberately resolves the browser entry.
* A browser entry may open a handle Node never closes — react-dom/server.browser
* holds a module-scope MessageChannel — and one ref'd handle keeps the event loop
* alive forever, so `vite build` writes a correct bundle and then never exits.
*
* Unref'ing whatever the require created is safe here because the module is
* loaded purely to read Object.keys off it and is never used afterwards. The
* handle list is undocumented, so its absence degrades to the previous behaviour
* rather than failing the build. Side effects that are not handles (an exit
* listener, a global mutation) are still not contained.
*/
function getRequiredNamedExports(specifier) {
	const getActiveHandles = process._getActiveHandles;
	const handlesBeforeRequire = typeof getActiveHandles === "function" ? new Set(getActiveHandles.call(process)) : void 0;
	try {
		const mod = createRequire$1(pathToFileURL(path$1.join(getPackageDetectionCwd(), "package.json")))(specifier);
		const runtimeNamedKeys = Object.keys(mod).filter((key) => key !== "default" && key !== "__esModule");
		if (runtimeNamedKeys.some((key) => !isValidEsmExportName(key))) return void 0;
		return runtimeNamedKeys;
	} catch {
		return;
	} finally {
		if (handlesBeforeRequire && typeof getActiveHandles === "function") for (const handle of getActiveHandles.call(process)) {
			if (handlesBeforeRequire.has(handle)) continue;
			const unref = handle?.unref;
			if (typeof unref === "function") unref.call(handle);
		}
	}
}
function getPackageNamedExports(pkg, exportConditions = DEFAULT_SHARED_EXPORT_CONDITIONS) {
	const esmEntryPath = getInstalledPackageEntry(pkg, {
		conditions: exportConditions,
		resolveSubpathWithRequire: false
	});
	if (esmEntryPath) {
		const cacheKey = !isWorkspaceFilePath(esmEntryPath) ? `${getPackageDetectionCwd()}\0${esmEntryPath}\0${exportConditions.join("\0")}` : void 0;
		const cached = cacheKey ? packageNamedExportsCache.get(cacheKey) : void 0;
		if (cached) return cached.value;
		const inspection = inspectSharedExportsFromFile(esmEntryPath, exportConditions);
		const value = !inspection || inspection.commonJs || path$1.extname(esmEntryPath) === ".cjs" ? getRequiredNamedExports(esmEntryPath) : inspection.namedExports;
		if (cacheKey) packageNamedExportsCache.set(cacheKey, { value });
		return value;
	}
	return getRequiredNamedExports(pkg);
}
function getSharedNamedExports(pkg, shareItem, exportConditions = DEFAULT_SHARED_EXPORT_CONDITIONS) {
	const configuredImport = shareItem?.shareConfig.import;
	if (typeof configuredImport === "string") {
		const configuredImportPath = resolveConfiguredImportPath(configuredImport, exportConditions);
		const inspection = inspectSharedExportsFromFile(configuredImportPath, exportConditions);
		if (configuredImportPath && (inspection?.commonJs || path$1.extname(configuredImportPath) === ".cjs")) return getRequiredNamedExports(configuredImportPath);
		if (inspection?.namedExports !== void 0) return inspection.namedExports;
		return;
	}
	return getPackageNamedExports(pkg, exportConditions);
}
function getLocalProviderImportPath(pkg) {
	try {
		const resolved = resolveWorkspaceEsmEntry(pkg, createRequire$1(pathToFileURL(path$1.join(getPackageDetectionCwd(), "package.json"))).resolve(pkg));
		return isWorkspaceFilePath(resolved) ? resolved : void 0;
	} catch {
		const resolved = getInstalledPackageEntry(pkg, {
			conditions: [
				"browser",
				"import",
				"module",
				"default"
			],
			resolveSubpathWithRequire: false
		});
		return isWorkspaceFilePath(resolved) ? resolved : void 0;
	}
}
function getProjectResolvedImportPath(pkg) {
	if (pkg === getPackageName(pkg)) {
		const esmEntry = getPackageEsmEntryPath(pkg);
		if (esmEntry) return esmEntry;
	}
	try {
		return resolveWorkspaceEsmEntry(pkg, createRequire$1(pathToFileURL(path$1.join(getPackageDetectionCwd(), "package.json"))).resolve(pkg));
	} catch {
		return;
	}
}
function isWorkspaceFilePath(resolved) {
	if (!resolved) return false;
	let realResolved = resolved;
	try {
		realResolved = realpathSync.native(resolved);
	} catch {}
	return !normalizeNodeModulePath(realResolved).includes("/node_modules/");
}
/**
* When createRequire resolves a workspace package to a CJS entry (e.g. dist/index.cjs),
* re-resolve via getInstalledPackageEntry with ESM-preferring conditions.
*
* Workspace packages produce browser code, so they must use the ESM build — CJS files
* contain `module.exports` which is undefined in the browser. createRequire().resolve()
* follows Node.js CJS conditions ["node", "require"], which matches exports["."].require.default
* and returns the .cjs path for packages with dual ESM/CJS exports.
*/
function resolveWorkspaceEsmEntry(pkg, resolved, cwd = getPackageDetectionCwd()) {
	if (!isWorkspaceFilePath(resolved)) return resolved;
	const esmEntry = getInstalledPackageEntry(pkg, {
		cwd,
		conditions: [
			"browser",
			"import",
			"module",
			"default"
		],
		resolveSubpathWithRequire: false
	});
	if (esmEntry && isWorkspaceFilePath(esmEntry)) return esmEntry;
	return resolved;
}
function isWorkspacePackageEntry(pkg, resolved) {
	if (!resolved || !path$1.isAbsolute(resolved) || !isWorkspaceFilePath(resolved)) return false;
	return !!getInstalledPackageJson(pkg, {
		packageName: getPackageName(pkg),
		fromResolvedEntry: resolved
	});
}
function getWorkspacePackageJson(pkg) {
	const resolved = getLocalProviderImportPath(pkg) || getProjectResolvedImportPath(pkg);
	if (!isWorkspacePackageEntry(pkg, resolved)) return;
	return getInstalledPackageJson(pkg, {
		packageName: getPackageName(pkg),
		fromResolvedEntry: resolved
	})?.packageJson;
}
function getSharedDependencyGraphPackageJson(pkg) {
	const installedPackageJson = getInstalledPackageJson(pkg, { packageName: getPackageName(pkg) })?.packageJson;
	if (installedPackageJson) return installedPackageJson;
	try {
		const packageJsonPath = createRequire$1(pathToFileURL(path$1.join(getPackageDetectionCwd(), "package.json"))).resolve(`${getPackageName(pkg)}/package.json`);
		return JSON.parse(readFileSync(packageJsonPath, "utf-8"));
	} catch {}
	return getWorkspacePackageJson(pkg);
}
function getDependencyNames(packageJson) {
	if (!packageJson) return [];
	const names = /* @__PURE__ */ new Set();
	for (const field of [
		"dependencies",
		"peerDependencies",
		"optionalDependencies"
	]) {
		const deps = packageJson[field];
		if (!deps || typeof deps !== "object") continue;
		for (const dep of Object.keys(deps)) names.add(dep);
	}
	return Array.from(names);
}
function isSharedSingletonConsumedByPeer(pkg, options = getNormalizeModuleFederationOptions(), requireFederationRuntimeDependency = false) {
	const shared = options?.shared || {};
	if (!requireFederationRuntimeDependency && Object.entries(shared).some(([key, item]) => key !== pkg && key.startsWith(`${pkg}/`) && item.shareConfig.singleton === true)) return true;
	const sharedKeyByPackageName = /* @__PURE__ */ new Map();
	Object.entries(shared).filter(([, item]) => item.shareConfig.singleton === true).forEach(([key]) => {
		const packageName = getPackageName(key);
		if (!sharedKeyByPackageName.get(packageName) || key === packageName) sharedKeyByPackageName.set(packageName, key);
	});
	const reachesPkg = (current, seen, hasFederationRuntimeDependency = false) => {
		const dependencies = getDependencyNames(getSharedDependencyGraphPackageJson(current));
		const usesFederationRuntime = dependencies.some((dependency) => dependency === "@module-federation/enhanced" || dependency === "@module-federation/runtime" || dependency === "@module-federation/runtime-core");
		const runtimeIsReachable = hasFederationRuntimeDependency || usesFederationRuntime;
		for (const dependency of dependencies) {
			const sharedDependency = sharedKeyByPackageName.get(dependency);
			if (!sharedDependency) continue;
			if (sharedDependency === pkg) return !requireFederationRuntimeDependency || runtimeIsReachable;
			if (seen.has(sharedDependency)) continue;
			seen.add(sharedDependency);
			if (reachesPkg(sharedDependency, seen, runtimeIsReachable)) return true;
		}
		return false;
	};
	return Array.from(sharedKeyByPackageName.values()).some((sharedPkg) => sharedPkg !== pkg && reachesPkg(sharedPkg, /* @__PURE__ */ new Set([sharedPkg])));
}
function isRemoteOnlyContainer(options = getNormalizeModuleFederationOptions()) {
	return Object.keys(options.exposes || {}).length > 0 && Object.keys(options.remotes || {}).length === 0;
}
function isLocalOnlyContainer(options = getNormalizeModuleFederationOptions()) {
	return Object.keys(options.exposes || {}).length === 0 && Object.keys(options.remotes || {}).length === 0;
}
function tryResolveImportFromPackageRoot(pkg, root) {
	try {
		return resolveWorkspaceEsmEntry(pkg, createRequire$1(pathToFileURL(path$1.join(root, "package.json"))).resolve(pkg), root);
	} catch {
		return;
	}
}
/**
* Resolution walks from the project root up to the filesystem root, probing
* every level, and the shared-module resolver asks for the same few packages
* tens of thousands of times on a cold dev start. The detection cwd is part of
* the key because `setPackageDetectionCwd` can move it between config hooks.
*/
const concreteSharedImportSourceCache = /* @__PURE__ */ new Map();
function resetConcreteSharedImportSourceCache() {
	concreteSharedImportSourceCache.clear();
}
function getConcreteSharedImportSource(pkg, shareItem) {
	const configuredImport = shareItem?.shareConfig.import;
	if (typeof configuredImport === "string") return configuredImport;
	const projectRoot = getPackageDetectionCwd();
	const cacheKey = JSON.stringify([projectRoot, pkg]);
	if (concreteSharedImportSourceCache.has(cacheKey)) return concreteSharedImportSourceCache.get(cacheKey);
	const resolved = resolveConcreteSharedImportSource(pkg, projectRoot);
	concreteSharedImportSourceCache.set(cacheKey, resolved);
	return resolved;
}
function resolveConcreteSharedImportSource(pkg, projectRoot) {
	if (tryResolveImportFromPackageRoot(pkg, projectRoot)) return;
	let currentDir = path$1.dirname(projectRoot);
	while (currentDir !== path$1.dirname(currentDir)) {
		const resolved = tryResolveImportFromPackageRoot(pkg, currentDir);
		if (resolved) return resolved;
		currentDir = path$1.dirname(currentDir);
	}
	return tryResolveImportFromPackageRoot(pkg, currentDir);
}
const PREBUILD_TAG = "__prebuild__";
const TREE_SHAKING_PROVIDER_TAG = "__treeShakingProvider__";
const TREE_SHAKING_GRAPH_QUERY = "__mf_tree_shaking_graph__";
const legacySharedVirtualModuleState = {
	preBuildCacheMap: {},
	preBuildShareItemMap: {},
	treeShakingProviderCacheMap: {},
	materializedTreeShakingProviders: /* @__PURE__ */ new Set(),
	loadShareCacheMap: {},
	warnedMissingImportFalse: /* @__PURE__ */ new Set()
};
const sharedVirtualModuleStates = /* @__PURE__ */ new WeakMap();
function getSharedVirtualModuleState(options) {
	if (!options) try {
		const currentOptions = getNormalizeModuleFederationOptions();
		return sharedVirtualModuleStates.get(currentOptions) ?? legacySharedVirtualModuleState;
	} catch {
		return legacySharedVirtualModuleState;
	}
	let state = sharedVirtualModuleStates.get(options);
	if (!state) {
		state = {
			preBuildCacheMap: {},
			preBuildShareItemMap: {},
			treeShakingProviderCacheMap: {},
			materializedTreeShakingProviders: /* @__PURE__ */ new Set(),
			loadShareCacheMap: {},
			warnedMissingImportFalse: /* @__PURE__ */ new Set(),
			ownerKey: getFederationScopeKey(options)
		};
		sharedVirtualModuleStates.set(options, state);
	}
	return state;
}
function createScopedSharedVirtualModule(pkg, tag, options) {
	return new VirtualModule(pkg, tag, ".js", getSharedVirtualModuleState(options).ownerKey);
}
function getTreeShakingGraphToken(id) {
	if (!id) return void 0;
	const queryStart = id.indexOf("?");
	if (queryStart === -1) return void 0;
	const hashStart = id.indexOf("#", queryStart);
	const entry = id.slice(queryStart + 1, hashStart === -1 ? void 0 : hashStart).split("&").find((part) => part.split("=", 1)[0] === TREE_SHAKING_GRAPH_QUERY);
	if (!entry) return void 0;
	const value = entry.slice(26);
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
function stripTreeShakingGraphQuery(id) {
	const queryStart = id.indexOf("?");
	if (queryStart === -1) return id;
	const hashStart = id.indexOf("#", queryStart);
	const pathname = id.slice(0, queryStart);
	const hash = hashStart === -1 ? "" : id.slice(hashStart);
	const remaining = id.slice(queryStart + 1, hashStart === -1 ? void 0 : hashStart).split("&").filter(Boolean).filter((part) => part.split("=", 1)[0] !== TREE_SHAKING_GRAPH_QUERY);
	return `${pathname}${remaining.length ? `?${remaining.join("&")}` : ""}${hash}`;
}
function addTreeShakingGraphQuery(id, token) {
	const cleanId = stripTreeShakingGraphQuery(id);
	const hashStart = cleanId.indexOf("#");
	const base = hashStart === -1 ? cleanId : cleanId.slice(0, hashStart);
	const hash = hashStart === -1 ? "" : cleanId.slice(hashStart);
	return `${base}${base.includes("?") ? "&" : "?"}${TREE_SHAKING_GRAPH_QUERY}=${encodeURIComponent(token)}${hash}`;
}
function getConcreteTreeShakingExportUsage(pkg, shareItem, options) {
	return getTreeShakingExportUsage(pkg, shareItem, shareItem?.name, options);
}
function getTreeShakingSharedProviderName(pkg, options) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	return `${getSharedVirtualModuleState(options).ownerKey ?? resolvedOptions.internalName ?? resolvedOptions.name}__tree_shaking__${packageNameEncode(pkg)}`;
}
function getTreeShakingSharedProviderImportId(pkg, options) {
	const { treeShakingProviderCacheMap } = getSharedVirtualModuleState(options);
	if (!treeShakingProviderCacheMap[pkg]) treeShakingProviderCacheMap[pkg] = createScopedSharedVirtualModule(pkg, TREE_SHAKING_PROVIDER_TAG, options);
	return treeShakingProviderCacheMap[pkg].getImportId();
}
function hasTreeShakingSharedProvider(pkg, shareItem, options) {
	const { materializedTreeShakingProviders } = getSharedVirtualModuleState(options);
	const usage = getConcreteTreeShakingExportUsage(pkg, shareItem, options);
	return materializedTreeShakingProviders.has(pkg) && usage?.kind === "exports";
}
/**
* Materialize the locally optimized provider as a small ESM container.
*
* The normal prebuild module remains the complete fallback. This container only
* retains the selected exports and is installed as `treeShaking.get` by the
* generated runtime record. Keeping the two getters distinct lets the Runtime
* perform its normal usedExports compatibility check and safely choose the full
* provider when the optimized one is insufficient.
*/
function writeTreeShakingSharedProvider(pkg, shareItem, options) {
	const { materializedTreeShakingProviders, treeShakingProviderCacheMap } = getSharedVirtualModuleState(options);
	const usage = getConcreteTreeShakingExportUsage(pkg, shareItem, options);
	if (usage?.kind !== "exports" || !usage.usedExports.length || shareItem?.shareConfig.import === false) {
		materializedTreeShakingProviders.delete(pkg);
		return;
	}
	const usedExports = usage.usedExports;
	const unsupportedExport = usedExports.find((name) => name !== "default" && !isValidEsmExportName(name));
	if (unsupportedExport) {
		materializedTreeShakingProviders.delete(pkg);
		mfWarn(`Tree-shaking shared dependency "${pkg}" was disabled because export "${unsupportedExport}" cannot be represented by the generated ESM provider.`);
		return;
	}
	const provider = treeShakingProviderCacheMap[pkg] || (treeShakingProviderCacheMap[pkg] = createScopedSharedVirtualModule(pkg, "__treeShakingProvider__", options));
	const optimizedImportSource = addTreeShakingGraphQuery(getConcreteSharedImportSource(pkg, shareItem) || pkg, pkg);
	const namedExports = usedExports.filter((name) => name !== "default");
	const namedImports = namedExports.map((name, index) => `${name} as __mfTreeShaken_${index}`).join(", ");
	const importLines = [namedImports ? `import { ${namedImports} } from ${escapeGeneratedStringLiteral(optimizedImportSource)};` : "", usedExports.includes("default") ? `import __mfTreeShakenDefault from ${escapeGeneratedStringLiteral(optimizedImportSource)};` : ""].filter(Boolean).join("\n");
	const namespaceEntries = [...namedExports.map((name, index) => `[${JSON.stringify(name)}]: __mfTreeShaken_${index}`), ...usedExports.includes("default") ? ["default: __mfTreeShakenDefault"] : [`default: { ${namedExports.map((name, index) => `[${JSON.stringify(name)}]: __mfTreeShaken_${index}`).join(", ")} }`]];
	provider.writeSync(`${importLines}
const __mfTreeShakenModule = { ${namespaceEntries.join(", ")} };
Object.defineProperty(__mfTreeShakenModule, "__esModule", {
  value: true,
  enumerable: false,
});
async function init() {}
function get() {
  return () => __mfTreeShakenModule;
}
const usedExports = ${JSON.stringify([...usedExports].sort())};
export { get, init, usedExports };
export default { get, init };
`, true);
	materializedTreeShakingProviders.add(pkg);
}
function writePreBuildLibPath(pkg, shareItem, options, exportConditions) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	const { preBuildCacheMap, preBuildShareItemMap } = getSharedVirtualModuleState(options);
	if (!preBuildCacheMap[pkg]) preBuildCacheMap[pkg] = createScopedSharedVirtualModule(pkg, PREBUILD_TAG, options);
	preBuildShareItemMap[pkg] = shareItem;
	const importSource = getConcreteSharedImportSource(pkg, shareItem) || pkg;
	writeTreeShakingSharedProvider(pkg, shareItem, options);
	if (pkg === "react/compiler-runtime") {
		const reactCacheDescriptor = getSharedCacheDescriptorLiteral("react", shareItem ?? {
			name: "react",
			from: "",
			scope: "default",
			shareConfig: { singleton: true }
		});
		preBuildCacheMap[pkg].writeSync(`
    ${sharedCacheHelperCode}
    const __mfCacheGlobalKey = ${JSON.stringify(getModuleCacheGlobalKey(exportConditions))};
    export const c = function(size) {
      const cache = globalThis[__mfCacheGlobalKey]?.share;
      const sharedReact = cache && __mfReadSharedCache(cache, ${reactCacheDescriptor});
      const reactExports = sharedReact?.default ?? sharedReact;
      const internals = reactExports?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      return internals?.H?.useMemoCache(size);
    };
    export default { c };
  `, true);
		return;
	}
	if (pkg === "react/jsx-dev-runtime") {
		preBuildCacheMap[pkg].writeSync(`
    import __mfPrebuildDefault from ${escapeGeneratedStringLiteral(importSource)};
    import * as __mfPrebuildNamespace from ${escapeGeneratedStringLiteral(importSource)};
    const __mfPrebuildExports = __mfPrebuildDefault ?? __mfPrebuildNamespace;
    export const Fragment = __mfPrebuildExports.Fragment;
    export const jsxDEV = __mfPrebuildExports.jsxDEV;
    export default __mfPrebuildExports;
  `, true);
		return;
	}
	if (pkg === "react/jsx-runtime") {
		preBuildCacheMap[pkg].writeSync(`
    import __mfPrebuildDefault from ${escapeGeneratedStringLiteral(importSource)};
    import * as __mfPrebuildNamespace from ${escapeGeneratedStringLiteral(importSource)};
    const __mfPrebuildExports = __mfPrebuildDefault ?? __mfPrebuildNamespace;
    export const Fragment = __mfPrebuildExports.Fragment;
    export const jsx = __mfPrebuildExports.jsx;
    export const jsxs = __mfPrebuildExports.jsxs;
    export default __mfPrebuildExports;
  `, true);
		return;
	}
	const namedExports = getSharedNamedExports(pkg, shareItem, exportConditions) ?? [];
	if (namedExports.length > 0) {
		const mutableExports = new Set(isLocalOnlyContainer(resolvedOptions) ? getSharedMutableExports(pkg, shareItem, exportConditions) : []);
		const copiedExports = namedExports.filter((name) => !mutableExports.has(name));
		const liveExports = namedExports.filter((name) => mutableExports.has(name));
		const namedExportVars = copiedExports.map((_name, i) => `__mf_${i}`);
		const declarations = copiedExports.map((name, i) => `const ${namedExportVars[i]} = __mfPrebuildExports[${escapeGeneratedStringLiteral(name)}];`).join("\n    ");
		const namedExportLine = copiedExports.length ? `export { ${copiedExports.map((name, i) => `${namedExportVars[i]} as ${name}`).join(", ")} };` : "";
		const liveExportLine = liveExports.length ? `export { ${liveExports.join(", ")} } from ${escapeGeneratedStringLiteral(importSource)};` : "";
		preBuildCacheMap[pkg].writeSync(`
    import * as __mfPrebuildNamespace from ${escapeGeneratedStringLiteral(importSource)};
    const __mfPrebuildExports = __mfPrebuildNamespace;
    ${declarations}
    ${namedExportLine}
    ${liveExportLine}
    export default Reflect.get(__mfPrebuildNamespace, "default") ?? __mfPrebuildNamespace;
  `, true);
		return;
	}
	preBuildCacheMap[pkg].writeSync(`
    import * as __mfPrebuildExports from ${escapeGeneratedStringLiteral(importSource)};
    export * from ${escapeGeneratedStringLiteral(importSource)};
    // Reflect access avoids bundler warnings for ESM packages without a
    // default export (for example antd/es/index.js), while preserving the
    // namespace fallback for packages that do provide one.
    export default Reflect.get(__mfPrebuildExports, "default") ?? __mfPrebuildExports;
  `, true);
}
/** Re-render already materialized wrappers after import analysis discovers exports. */
function refreshTreeShakingModules(options, command = "build", isRolldown = false, exportConditions) {
	const { preBuildShareItemMap } = getSharedVirtualModuleState(options);
	for (const [pkg, shareItem] of Object.entries(preBuildShareItemMap)) {
		if (!shareItem?.shareConfig.treeShaking) continue;
		writePreBuildLibPath(pkg, shareItem, options, exportConditions);
		writeLoadShareModule(pkg, shareItem, command, isRolldown, options, exportConditions);
	}
}
function getPreBuildLibImportId(pkg, options) {
	const { preBuildCacheMap } = getSharedVirtualModuleState(options);
	if (!preBuildCacheMap[pkg]) preBuildCacheMap[pkg] = createScopedSharedVirtualModule(pkg, PREBUILD_TAG, options);
	return preBuildCacheMap[pkg].getImportId();
}
function getPreBuildShareItem(pkg, options) {
	return getSharedVirtualModuleState(options).preBuildShareItemMap[pkg];
}
function getSharedImportSource(pkg, shareItem, options) {
	return getConcreteSharedImportSource(pkg, shareItem) || getPreBuildLibImportId(pkg, options);
}
const LOAD_SHARE_TAG = "__loadShare__";
function getLoadShareImportId(pkg, _isRolldown, options) {
	const { loadShareCacheMap } = getSharedVirtualModuleState(options);
	if (!loadShareCacheMap[pkg]) loadShareCacheMap[pkg] = createScopedSharedVirtualModule(pkg, LOAD_SHARE_TAG, options);
	return loadShareCacheMap[pkg].getImportId();
}
function getLoadShareModulePath(pkg, isRolldown, options) {
	const { loadShareCacheMap } = getSharedVirtualModuleState(options);
	if (!loadShareCacheMap[pkg]) getLoadShareImportId(pkg, isRolldown, options);
	return loadShareCacheMap[pkg].getImportId();
}
function getCachedSharedVirtualPkg(id, tag) {
	if (!id.includes(tag)) return;
	const normalized = normalizeVirtualModuleId(id);
	if (!normalized.startsWith("virtual:mf:")) return;
	const start = normalized.indexOf(tag);
	if (start === -1) return;
	const encodedPkgStart = start + tag.length;
	const end = normalized.indexOf(tag, encodedPkgStart);
	if (end === -1) return;
	return packageNameDecode(normalized.slice(encodedPkgStart, end));
}
function getCachedPreBuildPkg(id) {
	return getCachedSharedVirtualPkg(id, PREBUILD_TAG);
}
function getCachedLoadSharePkg(id) {
	return getCachedSharedVirtualPkg(id, LOAD_SHARE_TAG);
}
function materializeCachedLoadShareModule(options) {
	const pkg = getCachedLoadSharePkg(options.id);
	if (!pkg) return;
	const key = options.findSharedKey(pkg, options.shared);
	if (!key) return;
	const shareItem = options.shared[key];
	writeLoadShareModule(pkg, shareItem, options.command, options.isRolldown, options.federationOptions);
	if (shareItem.shareConfig?.import !== false) writePreBuildLibPath(pkg, shareItem, options.federationOptions);
	options.addUsedShares(pkg);
	options.writeLocalSharedImportMap();
}
function findCurrentLoadShareForStaleOwnerId(id, shared, findSharedKey, options) {
	const pkg = getCachedLoadSharePkg(id);
	if (!pkg) return;
	const normalized = normalizeVirtualModuleId(id);
	if (!normalized.startsWith("virtual:mf:")) return;
	const encodedKey = normalized.slice(11);
	const ownerStart = encodedKey.indexOf(MF_OWNER_INFIX);
	if (ownerStart === -1) return;
	if (encodedKey.slice(0, ownerStart) !== packageNameEncode(options.internalName)) return;
	if (!findSharedKey(pkg, shared)) return;
	return getSharedVirtualModuleState(options).loadShareCacheMap[pkg];
}
function getSharedCacheReadExpression(cacheDescriptor, treeShakingConsumer) {
	return treeShakingConsumer ? `__mfReadTreeShakingSharedSelection(__mfModuleCache.share, ${cacheDescriptor}, ${JSON.stringify(treeShakingConsumer)})` : `__mfReadSharedCache(__mfModuleCache.share, ${cacheDescriptor})`;
}
/**
* Eager workspace singleton wrapper: reads the shared cache synchronously and falls back to the local
* namespace. Inside the fallback's own evaluation cycle that namespace is not initialized yet (undefined in
* a merged chunk, TDZ bindings otherwise), so the exports stay unassigned until the deferred cache write
* re-applies them; a host-provided copy re-applies them through the cache subscription as before.
*/
function generateEagerWorkspaceSingletonExports(namedExports, importSource, cacheDescriptor, cacheOwner, treeShakingConsumer, mutableExports = []) {
	const copiedExports = namedExports.filter((name) => !mutableExports.includes(name));
	const namedExportVars = copiedExports.map((_name, i) => `__mf_${i}`);
	const declarations = namedExports.length > 0 ? ["let __mf_default;", ...namedExportVars.map((name) => `let ${name};`)].join("\n    ") : "let __mf_default;";
	const assignments = [...copiedExports.map((name, i) => `${namedExportVars[i]} = mod[${escapeGeneratedStringLiteral(name)}];`), "__mf_default = mod.default ?? mod;"].join("\n      ");
	const namedExportLine = copiedExports.length > 0 ? `\n    export { ${copiedExports.map((name, i) => `${namedExportVars[i]} as ${name}`).join(", ")} };` : "";
	const mutableExportLine = mutableExports.length ? `\n    export { ${mutableExports.join(", ")} } from ${escapeGeneratedStringLiteral(importSource)};` : "";
	return `import * as __mfLocalShare from ${escapeGeneratedStringLiteral(importSource)};
    let exportModule = ${getSharedCacheReadExpression(cacheDescriptor, treeShakingConsumer)};
    if (exportModule === undefined) {
      Promise.resolve().then(() => {
        if (__mfReadSharedCache(__mfModuleCache.share, ${cacheDescriptor}) !== undefined) return;
        const localShare = __mfInitializedLocalShare(__mfLocalShare);
        if (localShare !== undefined) {
          __mfWriteSharedCache(__mfModuleCache.share, ${cacheDescriptor}, localShare, ${cacheOwner});
        }
      });
      exportModule = __mfLocalShare;
    }
    ${declarations}
    const __mfApplyEagerShareExports = (mod) => {
      ${assignments}
    };
    const __mfApplyEagerShareExportsWhenReady = (mod) => {
      if (mod === undefined) return;
      try {
        __mfApplyEagerShareExports(mod);
      } catch (error) {
        if (!(error instanceof ReferenceError)) throw error;
      }
    };
    __mfSubscribeSharedCache(__mfModuleCache.share, ${cacheDescriptor}, __mfApplyEagerShareExports);
    __mfApplyEagerShareExportsWhenReady(exportModule);
    export { __mf_default as default };${namedExportLine}${mutableExportLine}`;
}
function generateLazyWorkspaceSingletonExports(namedExports, importSource, cacheDescriptor, cacheOwner, treeShakingConsumer, serveLocalFallback = false, mutableExports = []) {
	const copiedExports = namedExports.filter((name) => !mutableExports.includes(name));
	const namedExportVars = copiedExports.map((_name, i) => `__mf_${i}`);
	const declarations = namedExports.length > 0 ? ["let __mf_default;", ...namedExportVars.map((name) => `let ${name};`)].join("\n    ") : "let __mf_default;";
	const assignments = copiedExports.length > 0 ? [...copiedExports.map((name, i) => `${namedExportVars[i]} = mod[${escapeGeneratedStringLiteral(name)}];`), "__mf_default = mod.default ?? mod;"].join("\n      ") : "__mf_default = mod.default ?? mod;";
	const namedExportLine = copiedExports.length > 0 ? `\n    export { ${copiedExports.map((name, i) => `${namedExportVars[i]} as ${name}`).join(", ")} };` : "";
	const mutableExportLine = mutableExports.length ? `\n    export { ${mutableExports.join(", ")} } from ${escapeGeneratedStringLiteral(importSource)};` : "";
	const applyLocalFallback = `exportModule = __mfNormalizeShareModule(__mfLocalShare);
      __mfWriteSharedCache(__mfModuleCache.share, ${cacheDescriptor}, exportModule, ${cacheOwner});
      __mfApplyLazyShareExports(exportModule);`;
	return `${declarations}
    const __mfApplyLazyShareExports = (mod) => {
      ${assignments}
    };
    __mfSubscribeSharedCache(__mfModuleCache.share, ${cacheDescriptor}, __mfApplyLazyShareExports);
    let exportModule = ${getSharedCacheReadExpression(cacheDescriptor, treeShakingConsumer)};
    if (exportModule === undefined) {
      if (import.meta.env.SSR${serveLocalFallback ? " || (import.meta.env.DEV && typeof __mfLocalShare !== 'undefined')" : ""}) {
        ${applyLocalFallback}
      } else {
        __mfTrackPendingShareLoad(initPromise.then(() => {
          exportModule = ${getSharedCacheReadExpression(cacheDescriptor, treeShakingConsumer)};
          if (exportModule !== undefined) {
            __mfApplyLazyShareExports(exportModule);
            return;
          }
          return import(${escapeGeneratedStringLiteral(importSource)}).then((mod) => {
            exportModule = __mfNormalizeShareModule(mod);
            __mfWriteSharedCache(__mfModuleCache.share, ${cacheDescriptor}, exportModule, ${cacheOwner});
          });
        }));
      }
    } else {
      __mfApplyLazyShareExports(exportModule);
    }
    export { __mf_default as default };${namedExportLine}${mutableExportLine}`;
}
const WORKSPACE_SINGLETON_SSR_LOCAL_SHARE = "__mfNormalizeShareModule(__mfLocalShare)";
function prependWorkspaceSingletonSsrImport(code) {
	if (!code.includes("if (import.meta.env.SSR)")) return code;
	if (!code.includes(WORKSPACE_SINGLETON_SSR_LOCAL_SHARE)) return code;
	const localShareImport = /^[ \t]*import\s+\*\s+as\s+__mfLocalShare\s+from\s+(['"])(.+?)\1\s*;?[ \t]*\r?\n?/gm;
	let hasLocalShareImport = false;
	code = code.replace(localShareImport, (statement) => {
		if (hasLocalShareImport) return "";
		hasLocalShareImport = true;
		return statement;
	});
	if (hasLocalShareImport) return code;
	const importMatch = code.match(/initPromise\.then\(\(\)\s*=>\s*\{[\s\S]*?\breturn import\((["'])(.+?)\1\)\.then\(\(mod\)\s*=>\s*\{[\s\S]*?__mfApplyLazyShareExports/) ?? code.match(/initPromise\.then\(\(\)\s*=>\s*\n\s*import\((["'])(.+?)\1\)\.then\(\(mod\)\s*=>\s*\{[\s\S]*?__mfApplyLazyShareExports/) ?? code.match(/import\((["'])(.+?)\1\)/);
	if (!importMatch) return code;
	const quote = importMatch[1];
	return `import * as __mfLocalShare from ${quote}${importMatch[2]}${quote};\n${code}`;
}
function generateDeferredHostProvidedExports(namedExports, pkg, cacheDescriptor, treeShakingConsumer) {
	const namedExportVars = namedExports.map((_name, i) => `__mf_${i}`);
	const declarations = ["let __mf_default;", ...namedExportVars.map((name) => `let ${name};`)].join("\n    ");
	const assignments = [...namedExports.map((name, i) => `${namedExportVars[i]} = exportModule[${escapeGeneratedStringLiteral(name)}];`), "__mf_default = exportModule.default ?? exportModule;"].join("\n      ");
	const namedExportLine = namedExports.length > 0 ? `\n    export { ${namedExports.map((name, i) => `${namedExportVars[i]} as ${name}`).join(", ")} };` : "";
	return `${declarations}
    const __mfApplyHostProvidedExports = (exportModule) => {
      ${assignments}
    };
    let exportModule = ${getSharedCacheReadExpression(cacheDescriptor, treeShakingConsumer)};
    if (exportModule === undefined) {
      __mfTrackPendingShareLoad(initPromise.then(() => {
        exportModule = ${getSharedCacheReadExpression(cacheDescriptor, treeShakingConsumer)};
        if (exportModule === undefined) {
          throw new Error("[Module Federation] Shared module ${pkg} was imported before federation bootstrap finished.");
        }
        __mfApplyHostProvidedExports(exportModule);
      }));
    } else {
      __mfApplyHostProvidedExports(exportModule);
    }
    export { __mf_default as default };${namedExportLine}`;
}
function selectImportFalseNamedExports(detectedNamedExports, usage) {
	if (!detectedNamedExports || usage?.kind !== "exports") return detectedNamedExports ?? [];
	const usedNamedExports = new Set(usage.usedExports.filter((name) => name !== "default"));
	if ([...usedNamedExports].some((name) => !detectedNamedExports.includes(name))) return detectedNamedExports;
	return detectedNamedExports.filter((name) => usedNamedExports.has(name));
}
function generateShareModuleUnwrapCode({ source, preserveNamedExports, stopWithReturn }) {
	return `let current = ${source};
      for (let i = 0; i < 5; i++) {
        const defaultExport = current?.default;
        ${stopWithReturn ? `if (!defaultExport || typeof defaultExport !== "object") return ${stopWithReturn};` : `if (!defaultExport || typeof defaultExport !== "object") break;`}${preserveNamedExports ? `
        const namedValues = Object.keys(current).filter((key) => key !== "default").map((key) => current[key]);
        if (namedValues.length > 0 && namedValues.some((value) => value !== undefined)) break;` : ""}
        current = defaultExport;
      }
      return current;`;
}
const normalizeLocalShareModuleCode = `const __mfNormalizeShareModule = (mod) => {
      const normalized = (() => {
        ${generateShareModuleUnwrapCode({
	source: "mod",
	preserveNamedExports: true
})}
      })();
      return normalized && Object.getPrototypeOf(normalized) === null
        ? Object.assign({}, normalized)
        : normalized;
    };`;
const initializedLocalShareModuleCode = `const __mfInitializedLocalShare = (mod) => {
      if (mod === undefined) return undefined;
      try {
        return __mfNormalizeShareModule(mod);
      } catch (error) {
        if (error instanceof ReferenceError) return undefined;
        throw error;
      }
    };`;
function writeLoadShareModule(pkg, shareItem, command, _isRolldown, options, exportConditions, importFalseExportUsage) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	const { loadShareCacheMap } = getSharedVirtualModuleState(options);
	if (!loadShareCacheMap[pkg]) loadShareCacheMap[pkg] = createScopedSharedVirtualModule(pkg, LOAD_SHARE_TAG, options);
	let importLine = getRuntimeModuleCacheBootstrapCode(exportConditions);
	const cacheDescriptor = getSharedCacheDescriptorLiteral(pkg, shareItem);
	const cacheOwner = JSON.stringify(resolvedOptions.name);
	const runtimeInitOwnerImportId = options ? getRuntimeInitStatusImportId(options) : void 0;
	const treeShakingConsumer = command === "build" && shareItem.shareConfig.treeShaking ? resolvedOptions.name : void 0;
	if (shareItem.shareConfig.import === false) {
		const detectedNamedExports = getPackageNamedExports(pkg, exportConditions);
		const namedExports = selectImportFalseNamedExports(detectedNamedExports, importFalseExportUsage);
		let exportLine;
		if (namedExports.length > 0) exportLine = generateDeferredHostProvidedExports(namedExports, pkg, cacheDescriptor, treeShakingConsumer);
		else {
			const { warnedMissingImportFalse } = getSharedVirtualModuleState(resolvedOptions);
			if (detectedNamedExports === void 0 && !shareItem.shareConfig.suppressMissingImportWarning && !warnedMissingImportFalse.has(pkg)) {
				warnedMissingImportFalse.add(pkg);
				mfWarn(`Shared dependency "${pkg}" has import: false but is not installed locally.\n  Named imports (e.g. import { ... } from '${pkg}') will not work in production builds.\n  Install it as a devDependency to enable named export detection.`);
			}
			exportLine = generateDeferredHostProvidedExports([], pkg, cacheDescriptor, treeShakingConsumer);
		}
		loadShareCacheMap[pkg].writeSync(`
    ${getRuntimeInitPromiseBootstrapCode(false, runtimeInitOwnerImportId)}
    ${importLine}
    ${sharedCacheHelperCode}
    ${exportLine}
  `, true);
		return;
	}
	const concreteSharedImportSource = getConcreteSharedImportSource(pkg, shareItem);
	const sharedImportSource = concreteSharedImportSource || getPreBuildLibImportId(pkg, options);
	const devImportSource = concreteSharedImportSource || pkg;
	const localProviderPath = getLocalProviderImportPath(pkg);
	const coherentLocalSource = concreteSharedImportSource || localProviderPath || devImportSource;
	const isWorkspacePackage = isWorkspacePackageEntry(pkg, localProviderPath) || isWorkspacePackageEntry(pkg, concreteSharedImportSource);
	const lazyLocalFallbackSource = command !== "build" ? concreteSharedImportSource || localProviderPath || devImportSource : concreteSharedImportSource || localProviderPath || sharedImportSource;
	const skipServePrebuildWarmup = command !== "build" && (pkg === "lit" || pkg.startsWith("lit/"));
	const detectedNamedExports = getSharedNamedExports(pkg, shareItem, exportConditions);
	const namedExports = detectedNamedExports ?? [];
	const mutableExports = new Set(isLocalOnlyContainer(resolvedOptions) ? getSharedMutableExports(pkg, shareItem, exportConditions) : []);
	const copiedNamedExports = namedExports.filter((name) => !mutableExports.has(name));
	const liveNamedExports = namedExports.filter((name) => mutableExports.has(name));
	const liveNamedExportLine = liveNamedExports.length ? `export { ${liveNamedExports.join(", ")} } from ${escapeGeneratedStringLiteral(sharedImportSource)};` : "";
	const hasCompleteExportCoverage = detectedNamedExports !== void 0;
	const isWorkspaceSingleton = isWorkspacePackage && shareItem.shareConfig.singleton === true;
	const isDefaultShareScope = shareItem.scope === void 0 || shareItem.scope === "default" || Array.isArray(shareItem.scope) && shareItem.scope[0] === "default";
	const usesDeferredSingletonFallback = hasCompleteExportCoverage && shareItem.shareConfig.eager !== true && (isWorkspacePackage || command !== "build" && isRemoteOnlyContainer(resolvedOptions) && shareItem.shareConfig.singleton === true || command === "build" && isRemoteOnlyContainer(resolvedOptions) && (shareItem.shareConfig.singleton === true || isDefaultShareScope) && !isSharedSingletonConsumedByPeer(pkg, resolvedOptions, true));
	const servesRemoteSingletonFallback = command !== "build" && isRemoteOnlyContainer(resolvedOptions) && shareItem.shareConfig.singleton === true;
	const isConsumedByPeerSingleton = isSharedSingletonConsumedByPeer(pkg, resolvedOptions);
	const usesEntryInjectedRemoteFallback = hasCompleteExportCoverage && !isWorkspaceSingleton && isRemoteOnlyContainer(resolvedOptions) && shareItem.shareConfig.singleton === true && resolvedOptions.hostInitInjectLocation === "entry" && (command === "build" || isConsumedByPeerSingleton);
	const usesEagerWorkspaceFallback = hasCompleteExportCoverage && isWorkspaceSingleton && !servesRemoteSingletonFallback && (isConsumedByPeerSingleton || shareItem.shareConfig.eager === true);
	const usesDeferredTreeShakingFallback = hasCompleteExportCoverage && Boolean(treeShakingConsumer);
	const reactMixedModeGuard = pkg === "react" ? createReactMixedModeRuntimeGuard() : "";
	let exportLine;
	let initBlock = "";
	if (usesDeferredTreeShakingFallback) {
		importLine = `${getRuntimeInitPromiseBootstrapCode(false, runtimeInitOwnerImportId)}\n    ${importLine}`;
		exportLine = generateLazyWorkspaceSingletonExports(namedExports, lazyLocalFallbackSource, cacheDescriptor, cacheOwner, treeShakingConsumer, command !== "build" && !servesRemoteSingletonFallback && (isWorkspaceSingleton || isWorkspacePackage), liveNamedExports);
	} else if (usesEagerWorkspaceFallback || usesEntryInjectedRemoteFallback) exportLine = generateEagerWorkspaceSingletonExports(namedExports, lazyLocalFallbackSource, cacheDescriptor, cacheOwner, treeShakingConsumer, liveNamedExports);
	else if (usesDeferredSingletonFallback) {
		importLine = `${getRuntimeInitPromiseBootstrapCode(false, runtimeInitOwnerImportId)}\n    ${importLine}`;
		exportLine = generateLazyWorkspaceSingletonExports(namedExports, lazyLocalFallbackSource, cacheDescriptor, cacheOwner, treeShakingConsumer, command !== "build" && !servesRemoteSingletonFallback && (isWorkspaceSingleton || isWorkspacePackage), liveNamedExports);
	} else if (detectedNamedExports === void 0) {
		exportLine = `const __mfDefaultExport = (() => {
      ${generateShareModuleUnwrapCode({
			source: "__mfLocalShare",
			preserveNamedExports: false,
			stopWithReturn: "defaultExport ?? current"
		})}
    })();
    export default __mfDefaultExport;
    export * from ${escapeGeneratedStringLiteral(coherentLocalSource)}`;
		initBlock = `exportModule = __mfNormalizeShareModule(__mfLocalShare);
      __mfWriteSharedCache(__mfModuleCache.share, ${cacheDescriptor}, exportModule, ${cacheOwner});`;
	} else if (namedExports.length > 0 && shareItem.shareConfig.singleton === true) {
		const namedExportVars = copiedNamedExports.map((_name, i) => `__mf_${i}`);
		exportLine = `${["let __mfDefaultExport;", ...namedExportVars.map((name) => `let ${name};`)].join("\n    ")}
    const __mfApplySharedExports = (mod) => {
      ${[
			...reactMixedModeGuard ? [reactMixedModeGuard] : [],
			...copiedNamedExports.map((name, i) => `${namedExportVars[i]} = mod[${escapeGeneratedStringLiteral(name)}];`),
			`__mfDefaultExport = (() => {
        ${generateShareModuleUnwrapCode({
				source: "mod",
				preserveNamedExports: false,
				stopWithReturn: "defaultExport ?? current"
			})}
      })();`
		].join("\n      ")}
    };
    __mfSubscribeSharedCache(__mfModuleCache.share, ${cacheDescriptor}, __mfApplySharedExports);
    __mfApplySharedExports(exportModule);
    export { __mfDefaultExport as default };
    ${copiedNamedExports.length ? `export { ${copiedNamedExports.map((name, i) => `__mf_${i} as ${name}`).join(", ")} };` : ""}
    ${liveNamedExportLine}`;
		initBlock = `exportModule = __mfNormalizeShareModule(__mfLocalShare);
      __mfWriteSharedCache(__mfModuleCache.share, ${cacheDescriptor}, exportModule, ${cacheOwner});`;
	} else if (namedExports.length > 0) {
		const destructure = copiedNamedExports.length ? `const { ${copiedNamedExports.map((name, i) => `${name}: __mf_${i}`).join(", ")} } = exportModule;` : "";
		const namedExportLine = copiedNamedExports.length ? `export { ${copiedNamedExports.map((name, i) => `__mf_${i} as ${name}`).join(", ")} };` : "";
		exportLine = `const __mfDefaultExport = (() => {
      ${generateShareModuleUnwrapCode({
			source: "exportModule",
			preserveNamedExports: false,
			stopWithReturn: "defaultExport ?? current"
		})}
    })();
    export default __mfDefaultExport;
    ${destructure}
    ${namedExportLine}
    ${liveNamedExportLine}`;
		initBlock = `exportModule = __mfNormalizeShareModule(__mfLocalShare);
      __mfWriteSharedCache(__mfModuleCache.share, ${cacheDescriptor}, exportModule, ${cacheOwner});`;
	} else if (shareItem.shareConfig.singleton === true) {
		exportLine = `let __mfDefaultExport;
    const __mfApplySharedDefaultExport = (mod) => {
      ${reactMixedModeGuard}
      __mfDefaultExport = mod.default ?? mod;
    };
    __mfSubscribeSharedCache(__mfModuleCache.share, ${cacheDescriptor}, __mfApplySharedDefaultExport);
    __mfApplySharedDefaultExport(exportModule);
    export { __mfDefaultExport as default };
    export * from ${escapeGeneratedStringLiteral(sharedImportSource)}`;
		initBlock = `exportModule = __mfNormalizeShareModule(__mfLocalShare);
      __mfWriteSharedCache(__mfModuleCache.share, ${cacheDescriptor}, exportModule, ${cacheOwner});`;
	} else {
		exportLine = `export default exportModule.default ?? exportModule\n    export * from ${escapeGeneratedStringLiteral(sharedImportSource)}`;
		initBlock = `exportModule = __mfNormalizeShareModule(__mfLocalShare);
      __mfWriteSharedCache(__mfModuleCache.share, ${cacheDescriptor}, exportModule, ${cacheOwner});`;
	}
	const prebuildImportLine = usesEagerWorkspaceFallback || usesEntryInjectedRemoteFallback ? "" : usesDeferredSingletonFallback || usesDeferredTreeShakingFallback ? !servesRemoteSingletonFallback && usesDeferredSingletonFallback && command !== "build" && (isWorkspaceSingleton || isWorkspacePackage) ? `import * as __mfLocalShare from ${escapeGeneratedStringLiteral(lazyLocalFallbackSource)};` : "" : `import * as __mfLocalShare from ${escapeGeneratedStringLiteral(detectedNamedExports === void 0 ? coherentLocalSource : skipServePrebuildWarmup ? devImportSource : sharedImportSource)};`;
	const devDynamicImportLine = isWorkspacePackage ? "" : usesDeferredSingletonFallback || usesDeferredTreeShakingFallback ? "" : command !== "build" && !skipServePrebuildWarmup ? `;() => import(${escapeGeneratedStringLiteral(devImportSource)}).catch(() => {});` : "";
	const moduleBody = usesDeferredSingletonFallback || usesDeferredTreeShakingFallback || usesEagerWorkspaceFallback || usesEntryInjectedRemoteFallback ? `
    ${prebuildImportLine}
    ${devDynamicImportLine}
    ${importLine}
    ${sharedCacheHelperCode}
    ${normalizeLocalShareModuleCode}
    ${initializedLocalShareModuleCode}
    ${exportLine}
  ` : `
    ${prebuildImportLine}
    ${devDynamicImportLine}
    ${importLine}
    ${sharedCacheHelperCode}
    ${normalizeLocalShareModuleCode}
    let exportModule = ${getSharedCacheReadExpression(cacheDescriptor, treeShakingConsumer)}
    if (exportModule === undefined) {
      ${initBlock}
    }
    ${exportLine}
  `;
	loadShareCacheMap[pkg].writeSync(moduleBody, true);
}
//#endregion
//#region src/virtualModules/virtualRemoteEntry.ts
let usedShares = /* @__PURE__ */ new Set();
const usedSharesByOptions = /* @__PURE__ */ new WeakMap();
const materializedSharesByOptions = /* @__PURE__ */ new WeakMap();
function getScopedUsedShares(options) {
	let scoped = usedSharesByOptions.get(options);
	if (!scoped) {
		scoped = /* @__PURE__ */ new Set();
		usedSharesByOptions.set(options, scoped);
	}
	return scoped;
}
function getUsedShares(options) {
	if (options) return getScopedUsedShares(options);
	return usedShares;
}
function addUsedShares(pkg, options) {
	usedShares.add(pkg);
	if (options) getScopedUsedShares(options).add(pkg);
	if (options) {
		let scoped = materializedSharesByOptions.get(options);
		if (!scoped) {
			scoped = /* @__PURE__ */ new Set();
			materializedSharesByOptions.set(options, scoped);
		}
		scoped.add(pkg);
	}
}
function addConfiguredShare(pkg, options) {
	usedShares.add(pkg);
	if (options) getScopedUsedShares(options).add(pkg);
}
const LOCAL_SHARED_IMPORT_MAP_ID = "virtual:mf-localSharedImportMap";
const localOwnerIds = /* @__PURE__ */ new WeakMap();
let nextLocalOwnerId = 1;
function getLocalOwnerKey(options) {
	let ownerId = localOwnerIds.get(options);
	if (!ownerId) {
		ownerId = nextLocalOwnerId++;
		localOwnerIds.set(options, ownerId);
	}
	return `${options.internalName}${MF_OWNER_INFIX}${ownerId}`;
}
function getLocalSharedImportMapPath(options) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	const ownerName = options ? getLocalOwnerKey(resolvedOptions) : resolvedOptions.internalName || resolvedOptions.name;
	return `${LOCAL_SHARED_IMPORT_MAP_ID}:${packageNameEncode(ownerName)}`;
}
function getResolvedLocalSharedImportMapId(options) {
	return `\0${getLocalSharedImportMapPath(options)}`;
}
let invalidateLocalSharedImportMap;
const localSharedImportMapInvalidators = /* @__PURE__ */ new WeakMap();
function setLocalSharedImportMapInvalidator(invalidator, options) {
	if (!options) invalidateLocalSharedImportMap = invalidator;
	else if (invalidator) localSharedImportMapInvalidators.set(options, invalidator);
	else localSharedImportMapInvalidators.delete(options);
}
function writeLocalSharedImportMap(options) {
	(options ? localSharedImportMapInvalidators.get(options) : invalidateLocalSharedImportMap)?.();
}
function shouldUseDirectReactImport() {
	const isVinext = hasPackageDependency("vinext");
	const isAstro = hasPackageDependency("astro");
	return isVinext || isAstro;
}
function getLocalSharedPackagePath(pkg, shareItem, options) {
	if (shouldUseDirectReactImport() && pkg === "react") return "react";
	return getConcreteSharedImportSource(pkg, shareItem) || getLocalProviderImportPath(pkg) || getSharedImportSource(pkg, shareItem, options);
}
function getDirectSharedCacheSeedImportPath(pkg, shareItem) {
	return getConcreteSharedImportSource(pkg, shareItem) || getProjectResolvedImportPath(pkg) || getLocalProviderImportPath(pkg) || pkg;
}
function generateLocalSharedImportMap(options) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	const useDirectReactImport = shouldUseDirectReactImport();
	const orderedShares = getOrderedUsedShares(options);
	const sharesToMaterialize = new Set(getMaterializedShares(options));
	return `
    import {loadShare} from "@module-federation/runtime";
    ${orderedShares.map((pkg, index) => {
		const shareItem = getNormalizeShareItem(pkg, resolvedOptions);
		if (!shareItem?.shareConfig.eager || shareItem.shareConfig.import === false) return "";
		return `import * as __mfEagerShare_${index} from ${toSafeJsLiteral(getLocalSharedPackagePath(pkg, shareItem, options))};`;
	}).filter(Boolean).join("\n")}
    ${normalizeRuntimeShareCode}
    const importMap = {
      ${orderedShares.map((pkg, index) => {
		const shareItem = getNormalizeShareItem(pkg, resolvedOptions);
		return `
        ${toSafeJsLiteral(pkg)}: async () => {
          ${shareItem?.shareConfig.import === false ? `throw new Error(\`[Module Federation] Shared module '\${${toSafeJsLiteral(pkg)}}' must be provided by host\`);` : shareItem?.shareConfig.eager ? `let pkg = __mfEagerShare_${index};
            return pkg;` : `let pkg = await import(${toSafeJsLiteral(getLocalSharedPackagePath(pkg, shareItem, options))});
            return pkg;`}
        }
      `;
	}).join(",")}
    }
      const usedShared = {
      ${orderedShares.map((key) => {
		const shareItem = getNormalizeShareItem(key, resolvedOptions);
		if (!shareItem) return null;
		const detectedNamedExports = getSharedNamedExports(key, shareItem);
		const canLiveRebind = shareItem.shareConfig.import === false || detectedNamedExports !== void 0;
		const treeShakingConfig = canLiveRebind ? shareItem.shareConfig.treeShaking : void 0;
		const treeShakingUsage = treeShakingConfig ? getTreeShakingExportUsage(key, shareItem, shareItem.name, options) : void 0;
		const treeShakingProviderExports = treeShakingUsage?.kind === "exports" ? treeShakingUsage.usedExports : [];
		const treeShakingUsedExports = resolvedOptions.injectTreeShakingUsedExports === false ? treeShakingConfig?.usedExports || [] : treeShakingProviderExports;
		const disableRuntimeInference = treeShakingConfig?.mode === "runtime-infer" && resolvedOptions.injectTreeShakingUsedExports === false;
		const treeShakingProviderImportId = treeShakingConfig && !disableRuntimeInference && hasTreeShakingSharedProvider(key, shareItem, options) ? getTreeShakingSharedProviderImportId(key, options) : void 0;
		const treeShakingStatus = treeShakingUsage?.kind === "full" || disableRuntimeInference || treeShakingConfig?.mode === "runtime-infer" && !treeShakingProviderImportId && shareItem.shareConfig.import !== false ? 0 : 1;
		return `
          ${toSafeJsLiteral(key)}: {
            name: ${toSafeJsLiteral(key)},
            version: ${toSafeJsLiteral(shareItem.version)},
            scope: [${toSafeJsLiteral(shareItem.scope)}],
            loaded: false,
            materialize: ${sharesToMaterialize.has(key)},
            eager: ${Boolean(shareItem.shareConfig.eager)},
            from: ${toSafeJsLiteral(resolvedOptions.name)},
            canLiveRebind: ${canLiveRebind},
            async get () {
              if (${shareItem.shareConfig.import === false}) {
                throw new Error(\`[Module Federation] Shared module '\${${toSafeJsLiteral(key)}}' must be provided by host\`);
              }
              usedShared[${toSafeJsLiteral(key)}].loaded = true
              const {${toSafeJsLiteral(key)}: pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = ${toSafeJsLiteral(useDirectReactImport)} && ${toSafeJsLiteral(key)} === "react"
                ? (res?.default ?? res)
                : __mfNormalizeRuntimeShare({...res})
              // All npm packages pre-built by vite will be converted to esm
              if (exportModule.__esModule !== true) {
                Object.defineProperty(exportModule, "__esModule", {
                  value: true,
                  enumerable: false
                })
              }
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: ${shareItem.shareConfig.singleton},
              requiredVersion: ${toSafeJsLiteral(shareItem.shareConfig.requiredVersion)},
              strictVersion: ${shareItem.shareConfig.strictVersion},
              eager: ${Boolean(shareItem.shareConfig.eager)},
              ${shareItem.shareConfig.import === false ? "import: false," : ""}
            },
            ${treeShakingConfig ? `treeShaking: {
              mode: ${toSafeJsLiteral(treeShakingConfig.mode)},
              usedExports: ${toSafeJsLiteral(treeShakingUsedExports)},
              providedExports: ${toSafeJsLiteral(treeShakingProviderExports)},
              status: ${treeShakingStatus},
              ${treeShakingProviderImportId ? `async get() {
                const container = await import(${toSafeJsLiteral(treeShakingProviderImportId)});
                if (typeof container.init === "function") await container.init();
                return container.get();
              },` : ""}
            }` : ""}
          }
        `;
	}).filter((x) => x !== null).join(",")}
    }
      const usedRemotes = [${Object.keys(getUsedRemotesMap(options)).map((key) => {
		const remote = resolvedOptions.remotes[key];
		if (!remote) return null;
		return `
                {
                  alias: ${toSafeJsLiteral(key)},
                  entryGlobalName: ${toSafeJsLiteral(remote.entryGlobalName)},
                  name: ${toSafeJsLiteral(options ? getRuntimeRemoteAlias(key, options) : remote.name)},
                  type: ${toSafeJsLiteral(remote.type)},
                  entry: ${toSafeJsLiteral(remote.entry)},
                  shareScope: ${toSafeJsLiteral(remote.shareScope ?? "default")},
                }
          `;
	}).filter((x) => x !== null).join(",")}
      ]
      export {
        usedShared,
        usedRemotes
      }
      `;
}
/** Expand `pkg/` → package root + matching usedShares; never returns the prefix string. */
function expandSharedPrefixKey(prefixKey, used) {
	const base = prefixKey.slice(0, -1);
	const expanded = /* @__PURE__ */ new Set([base]);
	for (const pkg of used) {
		if (pkg.endsWith("/")) continue;
		if (pkg === base || pkg.startsWith(`${base}/`)) expanded.add(pkg);
	}
	return [...expanded];
}
function getOrderedUsedShares(options) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	const used = getUsedShares(options);
	const shares = new Set(used);
	Object.keys(resolvedOptions.shared ?? {}).forEach((pkg) => {
		if (!pkg.endsWith("/")) shares.add(pkg);
	});
	for (const [pkg, share] of Object.entries(resolvedOptions.shared ?? {})) if (pkg.endsWith("/") && share.shareConfig?.eager) for (const concrete of expandSharedPrefixKey(pkg, used)) shares.add(concrete);
	return orderSharedDependenciesFirst(Array.from(shares).sort((a, b) => {
		const priority = (pkg) => pkg === "react" ? 0 : pkg === "react-dom" ? 1 : pkg.startsWith("react/") ? 2 : 3;
		return priority(a) - priority(b) || a.localeCompare(b);
	}));
}
function getMaterializedShares(options) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	const scopedRegistrations = options ? usedSharesByOptions.get(options) : void 0;
	const shares = new Set(options && scopedRegistrations?.size ? materializedSharesByOptions.get(options) ?? [] : usedShares);
	const usedForEager = options ? usedSharesByOptions.get(options) ?? [] : usedShares;
	for (const [pkg, share] of Object.entries(resolvedOptions.shared ?? {})) {
		if (!share.shareConfig?.eager) continue;
		if (pkg.endsWith("/")) for (const concrete of expandSharedPrefixKey(pkg, usedForEager)) shares.add(concrete);
		else shares.add(pkg);
	}
	const configured = /* @__PURE__ */ new Map();
	for (const pkg of getOrderedUsedShares(options)) {
		const packageName = getPackageName(pkg);
		if (!configured.has(packageName) || pkg === packageName) configured.set(packageName, pkg);
	}
	const pending = [...shares];
	while (pending.length) {
		const pkg = pending.pop();
		const share = getNormalizeShareItem(pkg, resolvedOptions);
		const packageName = getPackageName(pkg);
		const packageJson = getInstalledPackageJson(pkg)?.packageJson ?? (pkg !== packageName ? getInstalledPackageJson(packageName)?.packageJson : void 0);
		const dependencies = {
			...packageJson?.dependencies || {},
			...packageJson?.peerDependencies || {},
			...packageJson?.optionalDependencies || {}
		};
		for (const dependency of Object.keys(dependencies)) {
			const sharedDependency = configured.get(dependency);
			const dependencyShare = sharedDependency ? getNormalizeShareItem(sharedDependency, resolvedOptions) : void 0;
			if (sharedDependency && !shares.has(sharedDependency) && dependencyShare?.scope === share?.scope) {
				shares.add(sharedDependency);
				pending.push(sharedDependency);
			}
		}
	}
	return orderSharedDependenciesFirst([...shares].sort((a, b) => {
		const priority = (pkg) => pkg === "react" ? 0 : pkg === "react-dom" ? 1 : pkg.startsWith("react/") ? 2 : 3;
		return priority(a) - priority(b) || a.localeCompare(b);
	}));
}
/** Shared keys a share's package.json depends on (roots stand in for their subpaths, subpaths for their root), keyed by share. */
function getSharePrerequisites(ordered) {
	const roots = /* @__PURE__ */ new Map();
	const subpaths = /* @__PURE__ */ new Map();
	for (const pkg of ordered) {
		const packageName = getPackageName(pkg);
		if (pkg === packageName) roots.set(packageName, pkg);
		else subpaths.set(packageName, [...subpaths.get(packageName) ?? [], pkg]);
	}
	const prerequisitesByShare = /* @__PURE__ */ new Map();
	for (const pkg of ordered) {
		const packageName = getPackageName(pkg);
		const packageJson = getInstalledPackageJson(pkg)?.packageJson ?? (pkg !== packageName ? getInstalledPackageJson(packageName)?.packageJson : void 0);
		const dependencies = {
			...packageJson?.dependencies || {},
			...packageJson?.peerDependencies || {},
			...packageJson?.optionalDependencies || {}
		};
		const prerequisites = Object.keys(dependencies).map((dependency) => roots.get(dependency)).filter((dependency) => Boolean(dependency));
		if (pkg !== packageName && (packageName === "react" || packageName === "react-dom")) {
			const root = roots.get(packageName);
			if (root) prerequisites.push(root);
		} else if (pkg === packageName && packageName !== "react" && packageName !== "react-dom") prerequisites.push(...subpaths.get(packageName) ?? []);
		prerequisitesByShare.set(pkg, prerequisites);
	}
	return prerequisitesByShare;
}
function getShareBatches(options, materializedOnly = true) {
	const ordered = materializedOnly ? getMaterializedShares(options) : getOrderedUsedShares(options);
	const prerequisitesByShare = getSharePrerequisites(ordered);
	const levels = /* @__PURE__ */ new Map();
	for (const pkg of ordered) levels.set(pkg, (prerequisitesByShare.get(pkg) ?? []).reduce((level, dependency) => Math.max(level, (levels.get(dependency) ?? 0) + 1), 0));
	const batches = [];
	for (const pkg of ordered) (batches[levels.get(pkg) ?? 0] ??= []).push(pkg);
	return batches.filter(Boolean);
}
function orderSharedDependenciesFirst(sharedPackages) {
	const sharedKeyByPackageName = /* @__PURE__ */ new Map();
	const subpathKeysByPackageName = /* @__PURE__ */ new Map();
	sharedPackages.forEach((pkg) => {
		const packageName = getPackageName(pkg);
		if (!sharedKeyByPackageName.get(packageName) || pkg === packageName) sharedKeyByPackageName.set(packageName, pkg);
		if (pkg !== packageName) {
			const subpaths = subpathKeysByPackageName.get(packageName);
			if (subpaths) subpaths.push(pkg);
			else subpathKeysByPackageName.set(packageName, [pkg]);
		}
	});
	const visiting = /* @__PURE__ */ new Set();
	const visited = /* @__PURE__ */ new Set();
	const ordered = [];
	const visit = (pkg) => {
		if (visited.has(pkg)) return;
		if (visiting.has(pkg)) return;
		visiting.add(pkg);
		const packageName = getPackageName(pkg);
		const packageJson = getInstalledPackageJson(pkg)?.packageJson ?? (pkg !== packageName ? getInstalledPackageJson(packageName)?.packageJson : void 0);
		const dependencies = {
			...packageJson?.dependencies || {},
			...packageJson?.peerDependencies || {},
			...packageJson?.optionalDependencies || {}
		};
		Object.keys(dependencies).forEach((dependency) => {
			const sharedDependency = sharedKeyByPackageName.get(dependency);
			if (sharedDependency) visit(sharedDependency);
		});
		if (pkg === packageName) {
			const subpaths = subpathKeysByPackageName.get(packageName) || [];
			if (packageName === "react" || packageName === "react-dom") {
				visiting.delete(pkg);
				visited.add(pkg);
				ordered.push(pkg);
				subpaths.forEach(visit);
				return;
			}
			subpaths.forEach(visit);
		}
		visiting.delete(pkg);
		visited.add(pkg);
		ordered.push(pkg);
	};
	sharedPackages.forEach(visit);
	return ordered;
}
function getShareItemForPreload(pkg, options = getNormalizeModuleFederationOptions()) {
	const shared = options.shared;
	const wildcardKey = `${getPackageName(pkg)}/`;
	if (isExplicitSharedKey(pkg, options)) return shared[pkg];
	if (isExplicitSharedKey(wildcardKey, options)) return shared[wildcardKey];
}
function generateSharedCacheSeedItem(pkg, shareItem, importPath, options = getNormalizeModuleFederationOptions()) {
	const cacheDescriptor = getSharedCacheDescriptor(pkg, shareItem);
	const cacheOwner = options.name;
	return `if (__mfReadSharedCache(__mfModuleCache.share, ${toSafeJsLiteral(cacheDescriptor)}) === undefined) {
        const mod = await import(${toSafeJsLiteral(importPath)});
        ${normalizeRuntimeShareCode}
        const normalizedModule = __mfNormalizeRuntimeShare(mod);
        const exportModule = normalizedModule === mod ? {...mod} : normalizedModule;
        if (exportModule.__esModule !== true) Object.defineProperty(exportModule, "__esModule", {
          value: true,
          enumerable: false
        });
        __mfWriteSharedCache(__mfModuleCache.share, ${toSafeJsLiteral(cacheDescriptor)}, exportModule, ${toSafeJsLiteral(cacheOwner)});
      }`;
}
const normalizeRuntimeShareCode = `const __mfNormalizeRuntimeShare = (mod) => {
            let current = mod;
            for (let i = 0; i < 5; i++) {
              const defaultExport = current?.default;
              if (!defaultExport || typeof defaultExport !== "object" || Object.keys(defaultExport).length === 0) break;
              const namedValues = Object.keys(current).filter((key) => key !== "default").map((key) => current[key]);
              if (namedValues.length > 0 && namedValues.some((value) => value !== undefined)) break;
              current = defaultExport;
            }
            return current;
          };`;
const sharedProviderSelectionHelperCode = `const __mfOriginalProviderKey = Symbol("mf.originalSharedProvider");
          const __mfResolveShareHook = { emit: (params) => params };
          const __mfCreateProviderSelectionVersions = (versions, strategy) => {
            if (strategy !== "version-first") return versions;
            const selectionVersions = {};
            for (const [version, provider] of Object.entries(versions)) {
              selectionVersions[version] = Object.assign({}, provider, {
                [__mfOriginalProviderKey]: provider
              });
            }
            return selectionVersions;
          };
          const __mfFindSharedProviderEntry = (versions, provider) => {
            if (!provider) return undefined;
            const entries = Object.entries(versions || {});
            const registeredEntry = entries.find(([, candidate]) => candidate === provider);
            if (registeredEntry) {
              return { version: registeredEntry[0], provider, registered: true };
            }
            if (typeof provider.version === "string" && provider.version) {
              return { version: provider.version, provider, registered: false };
            }
            const provenanceEntries = entries.filter(([, candidate]) =>
              candidate === provider || Boolean(provider.from && candidate?.from === provider.from)
            );
            if (provenanceEntries.length !== 1) return undefined;
            return { version: provenanceEntries[0][0], provider, registered: false };
          };
          const __mfSelectSharedProvider = (
            versions,
            pkg,
            share,
            strategy
          ) => {
            if (!versions || !share) return undefined;
            // import:false stubs provide nothing, so they are never a selectable
            // provider and must not be satisfy-checked. Skip the runtime entirely
            // when nothing remains: it treats an empty map as version "0" and
            // warns that it fails even a "*" requirement.
            const candidates = Object.fromEntries(
              Object.entries(versions).filter(([, provider]) => provider?.shareConfig?.import !== false)
            );
            if (Object.keys(candidates).length === 0) return undefined;
            const scopes = Array.isArray(share.scope) ? share.scope : [share.scope || "default"];
            const selectionVersions = __mfCreateProviderSelectionVersions(candidates, strategy);
            const shareScopeMap = {};
            for (const scope of scopes) {
              shareScopeMap[scope || "default"] = { [pkg]: selectionVersions };
            }
            const selected = runtimeShare.getRegisteredShare(
              shareScopeMap,
              pkg,
              { ...share, scope: scopes, strategy },
              __mfResolveShareHook
            )?.shared;
            return selected?.[__mfOriginalProviderKey] || selected;
          };`;
const externalSharedProviderSelectionHelperCode = `const __mfSelectExternalSharedProvider = (
            versions,
            pkg,
            localShare,
            strategy
          ) => {
            const isLocalProvider = (provider) => __mfMatchesSharedProvider(provider, localShare);
            const candidates = Object.fromEntries(
              Object.entries(versions || {}).filter(([, provider]) =>
                !isLocalProvider(provider) && provider?.shareConfig?.import !== false
              )
            );
            if (localShare?.version && localShare.shareConfig?.import !== false) {
              const sameVersionProvider = candidates[localShare.version];
              // Runtime registration keeps an existing same-version record,
              // even when it has only a getter and is not loaded yet. Model
              // that retained provider here so pre-init seeding cannot choose
              // the local module while loadShare() later chooses the parent.
              if (!sameVersionProvider) {
                candidates[localShare.version] = localShare;
              }
            }
            const provider = __mfSelectSharedProvider(
              candidates,
              pkg,
              localShare,
              strategy
            );
            return isLocalProvider(provider) ? undefined : provider;
          };
          const __mfMatchesSharedProvider = (provider, expected) => provider === expected || Boolean(
            expected?.from && provider?.from === expected.from
          );
          const __mfGetScopeRootProvider = (
            instances,
            scopeRoot,
            shared,
            scopeName,
            pkg,
            version,
            provider,
            passedProvider,
            strategy
          ) => {
            if (strategy !== "version-first" || !passedProvider) return undefined;
            const scopeRootProviders = scopeRoot?.options?.shared?.[pkg];
            const configuredScopeRootProvider = Array.isArray(scopeRootProviders)
              ? scopeRootProviders.find((candidate) => candidate?.version === version)
              : undefined;
            const registeredScopeRootProvider = passedProvider?.from === scopeRoot?.options?.name
              ? passedProvider
              : undefined;
            const scopeRootProvider = registeredScopeRootProvider || (
              __mfMatchesSharedProvider(configuredScopeRootProvider, passedProvider)
                ? configuredScopeRootProvider
                // A plain Webpack/Rspack host has no enhanced-runtime instance.
                // Its pre-init snapshot is still authoritative when this remote's
                // registration rewrites the same-version provider in-place.
                : scopeRoot ? undefined : passedProvider
            );
            if (!scopeRootProvider) return undefined;
            const selectedFromLaterInstance = instances.some((instance) =>
              instance !== scopeRoot &&
              instance?.options?.name === provider?.from &&
              instance?.shareScopeMap?.[scopeName] === shared
            );
            return selectedFromLaterInstance ? scopeRootProvider : undefined;
          };
          const __mfResolveExternalSharedProvider = (
            instances,
            scopeRoot,
            shared,
            scopeName,
            pkg,
            providerEntry,
            selectedExternalProvider,
            passedProvider,
            strategy
          ) => {
            const scopeRootProvider = providerEntry.registered ? __mfGetScopeRootProvider(
              instances,
              scopeRoot,
              shared,
              scopeName,
              pkg,
              providerEntry.version,
              providerEntry.provider,
              passedProvider,
              strategy
            ) : undefined;
            const provider = scopeRootProvider || selectedExternalProvider;
            if (!provider) return undefined;
            if (
              providerEntry.registered &&
              !__mfMatchesSharedProvider(provider, passedProvider)
            ) return undefined;
            return { provider, scopeRootProvider };
          };`;
function generateRuntimeSharedCacheSeedCode(shareStrategy, options) {
	const seedBatches = getShareBatches(options, false);
	const seedOrder = seedBatches.flat();
	const seedIndex = new Map(seedOrder.map((pkg, index) => [pkg, index]));
	const seedPrerequisites = Object.fromEntries(Array.from(getSharePrerequisites(seedOrder)).filter(([, prerequisites]) => prerequisites.length > 0).map(([pkg, prerequisites]) => [seedIndex.get(pkg), prerequisites.map((prerequisite) => seedIndex.get(prerequisite))]));
	return `
    const __mfSeedOrder = ${toSafeJsLiteral(seedOrder)};
    const __mfSeedBatches = ${toSafeJsLiteral(seedBatches)};
    const __mfSeedIndex = new Map(__mfSeedOrder.map((pkg, index) => [pkg, index]));
    const __mfSeedPrerequisites = ${toSafeJsLiteral(seedPrerequisites)};
    // A share is normally skipped here until the dev scanner has observed a real
    // import and set materialize. An import:false share has no local fallback
    // though, so on a cold request (materialize not set yet) it must still be
    // attempted here, or it is never seeded and its consumer reads it undefined.
    const __mfSeedKeys = __mfSeedOrder.filter((pkg) => usedShared[pkg] && (usedShared[pkg].materialize !== false || usedShared[pkg].shareConfig?.import === false));
    __mfModuleCache.providerInit ||= new Map();
    const __mfInitializeProviderOnce = (key, initialize) => {
      const existing = __mfModuleCache.providerInit.get(key);
      if (existing) return existing;
      const pending = Promise.resolve().then(initialize);
      __mfModuleCache.providerInit.set(key, pending);
      pending.catch(() => __mfModuleCache.providerInit.delete(key));
      return pending;
    };
    var __mfSeedLocalShared = async (seedKeys) => {
      const requested = new Set(seedKeys);
      for (const batch of __mfSeedBatches) await Promise.all(batch.filter((pkg) => requested.has(pkg)).map(async (pkg) => {
        const share = usedShared[pkg];
        const cacheDescriptor = __mfGetSharedCacheDescriptor(pkg, share.shareConfig?.singleton, share.version, share.scope);
        if (
          share.shareConfig?.import === false ||
          Boolean(share.treeShaking) ||
          __mfReadSharedCache(__mfModuleCache.share, cacheDescriptor) !== undefined
        ) {
          return;
        }
        const singletonCacheDescriptor = __mfGetSharedCacheDescriptor(pkg, true, share.version, share.scope);
        const singletonModule = __mfReadSharedCache(__mfModuleCache.share, singletonCacheDescriptor);
        if (singletonModule !== undefined) {
          __mfWriteSharedCache(
            __mfModuleCache.share,
            cacheDescriptor,
            singletonModule,
            __mfReadSharedCacheOwner(__mfModuleCache.share, singletonCacheDescriptor)
          );
          return;
        }
        const pendingExternalProvider = typeof __mfGetPendingExternalSharedProvider === 'function'
          ? __mfGetPendingExternalSharedProvider(pkg, share)
          : undefined;
        if (pendingExternalProvider && !pendingExternalProvider.lib && !pendingExternalProvider.loaded) {
          return;
        }
        const providerKey = cacheDescriptor.canonical;
        const resolved = await __mfInitializeProviderOnce(providerKey, async () => {
          const factory = await share.get();
          const mod = typeof factory === "function" ? factory() : factory;
          return Promise.resolve(mod);
        });
        ${normalizeRuntimeShareCode}
        const normalizedModule = __mfNormalizeRuntimeShare(resolved);
        const exportModule = normalizedModule === resolved ? {...resolved} : normalizedModule;
        if (exportModule.__esModule !== true) Object.defineProperty(exportModule, "__esModule", {
          value: true,
          enumerable: false
        });
        __mfWriteSharedCache(__mfModuleCache.share, cacheDescriptor, exportModule, mfName);
      }));
    };
    const __mfIsRuntimeOnlySharePending = (pkg) => {
      const share = usedShared[pkg];
      if (!share.treeShaking && share.shareConfig?.import !== false) return false;
      const cacheDescriptor = __mfGetSharedCacheDescriptor(
        pkg,
        share.shareConfig?.singleton,
        share.version,
        share.scope
      );
      return share.treeShaking
        ? (
            __mfReadTreeShakingSharedSelection(
              __mfModuleCache.share,
              cacheDescriptor,
              mfName
            ) === undefined &&
            __mfReadSharedCache(__mfModuleCache.share, cacheDescriptor) === undefined
          )
        : __mfReadSharedCache(__mfModuleCache.share, cacheDescriptor) === undefined;
    };
    const __mfNeedsPreInitSeedBarrier = (pkg) => {
      const share = usedShared[pkg];
      const cacheDescriptor = __mfGetSharedCacheDescriptor(
        pkg,
        share.shareConfig?.singleton,
        share.version,
        share.scope
      );
      const cachedShare = share.treeShaking
        ? (
            __mfReadTreeShakingSharedSelection(
              __mfModuleCache.share,
              cacheDescriptor,
              mfName
            ) ?? __mfReadSharedCache(__mfModuleCache.share, cacheDescriptor)
          )
        : __mfReadSharedCache(__mfModuleCache.share, cacheDescriptor);
      if (cachedShare !== undefined) return false;
      if (share.treeShaking || share.shareConfig?.import === false) return true;
      if (typeof __mfSelectExternalSharedProvider !== 'function') return false;
      return Boolean(__mfSelectExternalSharedProvider(
        initialShared[pkg],
        pkg,
        share,
        ${toSafeJsLiteral(shareStrategy)}
      ));
    };
    const __mfExpandBlockedSeedKeys = (blocked) => {
      let changed = true;
      while (changed) {
        changed = false;
        for (const pkg of __mfSeedKeys) {
          const seedIndex = __mfSeedIndex.get(pkg);
          if (blocked.has(seedIndex)) continue;
          if ((__mfSeedPrerequisites[seedIndex] || []).some((dependency) => blocked.has(dependency))) {
            blocked.add(seedIndex);
            changed = true;
          }
        }
      }
      return blocked;
    };
    const __mfPreInitBlockedSeedKeys = __mfExpandBlockedSeedKeys(new Set(
      __mfSeedKeys.filter(__mfNeedsPreInitSeedBarrier).map((pkg) => __mfSeedIndex.get(pkg))
    ));
    const __mfImmediateSeedKeys = __mfSeedKeys.filter(
      (pkg) => !__mfPreInitBlockedSeedKeys.has(__mfSeedIndex.get(pkg))
    );
    var __mfDeferredSeedKeys = __mfSeedKeys.filter(
      (pkg) => __mfPreInitBlockedSeedKeys.has(__mfSeedIndex.get(pkg))
    );
    await __mfSeedLocalShared(__mfImmediateSeedKeys);`;
}
function getBrowserImportPath(importPath) {
	if (/^(?:[a-zA-Z]:[\\/]|\/)/.test(importPath) && !importPath.startsWith("/@")) return `/@fs/${importPath}`;
	return importPath;
}
function getHostAutoInitSharedSeedItems(options) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	return getMaterializedShares(options).map((pkg) => ({
		pkg,
		shareItem: getShareItemForPreload(pkg, resolvedOptions)
	})).filter(({ shareItem }) => shareItem?.shareConfig?.import === false).sort((a, b) => {
		const priority = (pkg) => pkg === "vue" ? 0 : pkg === "pinia" ? 1 : 2;
		const aIsLocal = !!getLocalProviderImportPath(a.pkg);
		const bIsLocal = !!getLocalProviderImportPath(b.pkg);
		return priority(a.pkg) - priority(b.pkg) || Number(aIsLocal) - Number(bIsLocal) || a.pkg.localeCompare(b.pkg);
	});
}
function generateHostAutoInitSharedCacheSeedCode(command = "build", options) {
	if (command === "build") return "";
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	return getHostAutoInitSharedSeedItems(options).map(({ pkg, shareItem }) => {
		if (!shareItem) return null;
		return generateSharedCacheSeedItem(pkg, shareItem, getBrowserImportPath(getDirectSharedCacheSeedImportPath(pkg, shareItem)), resolvedOptions);
	}).filter((item) => item !== null).join("\n");
}
const REMOTE_ENTRY_ID = "virtual:mf-REMOTE_ENTRY_ID";
function getRemoteEntryId(options) {
	return `${REMOTE_ENTRY_ID}:${getVirtualModuleScopeKey(options)}`;
}
const isSsrOnlyPlugin = (importStatement) => [...SSR_ONLY_RUNTIME_PLUGINS].some((s) => importStatement.includes(s));
const getSsrOnlyPluginSpecifier = (importStatement) => [...SSR_ONLY_RUNTIME_PLUGINS].find((s) => importStatement.includes(s));
function generateTreeShakingSharedResolutionCode(enabled) {
	if (!enabled) return "const __mfResolveTreeShakingShared = async () => {};";
	return `
    // Resolve tree-enabled shares through the Runtime after all providers have
    // registered. Partial providers are stored with their export coverage and
    // never occupy generic/legacy cache keys, which are reserved for complete
    // modules only.
    const __mfResolveTreeShakingShared = async (pkg, share) => {
      const treeShaking = share.treeShaking;
      if (!treeShaking) return;
      try {
        const factory = await initRes.loadShare(pkg, {
          customShareInfo: {
            shareConfig: share.shareConfig,
            treeShaking: {
              mode: treeShaking.mode,
              status: treeShaking.status,
              usedExports: treeShaking.usedExports,
            },
          },
        });
        if (factory === false) return;
        const mod = typeof factory === "function" ? factory() : factory;
        const resolved = await Promise.resolve(mod);
        ${normalizeRuntimeShareCode}
        const cacheDescriptor = __mfGetSharedCacheDescriptor(pkg, share.shareConfig?.singleton, share.version, share.scope);
        const normalizedShared = __mfNormalizeRuntimeShare(resolved);
        const providedExports = treeShaking.providedExports ?? treeShaking.usedExports ?? [];
        const hasPartialProvider =
          ((treeShaking.mode === "runtime-infer" && treeShaking.status !== 0) ||
            treeShaking.status === 2);
        if (hasPartialProvider) {
          __mfWriteTreeShakingSharedCache(
            __mfModuleCache.share,
            cacheDescriptor,
            providedExports,
            normalizedShared
          );
          __mfWriteTreeShakingSharedSelection(
            __mfModuleCache.share,
            cacheDescriptor,
            mfName,
            normalizedShared
          );
        } else {
          __mfWriteSharedCache(__mfModuleCache.share, cacheDescriptor, normalizedShared);
        }
      } catch (e) {
        console.warn('[Module Federation] Failed to load tree-shaken shared module', pkg, e);
      }
    };`;
}
const treeShakingResolveShareBodyCode = `const consumerTreeShaking = args.shareInfo?.treeShaking;
      if (consumerTreeShaking?.mode !== "runtime-infer") return args;
      const requiredExports = consumerTreeShaking.usedExports;
      if (!Array.isArray(requiredExports)) return args;

      const originalResolver = args.resolver;
      args.resolver = () => {
        const resolved = originalResolver();
        if (!resolved?.useTreesShaking) return resolved;

        const selectedExports = resolved.shared?.treeShaking?.usedExports;
        const selectedMatches = Array.isArray(selectedExports) &&
          requiredExports.every((name) => selectedExports.includes(name));
        if (selectedMatches) return resolved;

        // Runtime 2.7 prefers a tree provider by version before checking export
        // coverage. Prefer this consumer's own compatible provider when one is
        // available; otherwise retain the selected version but use its complete
        // top-level getter.
        const localExports = consumerTreeShaking.providedExports;
        const localMatches = typeof consumerTreeShaking.get === "function" &&
          Array.isArray(localExports) &&
          requiredExports.every((name) => localExports.includes(name));
        if (localMatches) {
          return { shared: args.shareInfo, useTreesShaking: true };
        }
        return { shared: resolved.shared, useTreesShaking: false };
      };
      return args;`;
function generateTreeShakingSnapshotPluginCode(enabled) {
	if (!enabled) return "";
	return `
  const __mfTreeShakingSnapshotPlugin = () => ({
    name: "vite-tree-shaking-snapshot-plugin",
    resolveShare(args) {
      ${treeShakingResolveShareBodyCode}
    },
    beforeInit(args) {
      const { userOptions, origin, options: registeredOptions } = args;
      const version = userOptions.version || registeredOptions.version;
      const hostSnapshot = runtimeGlobal.getGlobalSnapshotInfoByModuleInfo({
        name: origin.name,
        version,
      });
      if (!hostSnapshot || !("shared" in hostSnapshot)) return args;

      const candidates = [];
      const appendShared = (records) => {
        for (const [pkgName, value] of Object.entries(records || {})) {
          const values = Array.isArray(value) ? value : [value];
          for (const shared of values) candidates.push([pkgName, shared]);
        }
      };
      appendShared(userOptions.shared);
      appendShared(registeredOptions.shared);

      for (const [pkgName, shared] of candidates) {
        const treeShaking = shared?.treeShaking;
        if (!treeShaking || treeShaking.mode !== "server-calc") continue;
        const shareSnapshot = hostSnapshot.shared.find((item) => item.sharedName === pkgName);
        if (!shareSnapshot || typeof shareSnapshot.treeShakingStatus !== "number") continue;
        const {
          secondarySharedTreeShakingEntry: entry,
          secondarySharedTreeShakingName: name,
          treeShakingStatus: status,
          usedExports,
          fallbackType,
        } = shareSnapshot;

        // A CALCULATED snapshot without a loadable secondary entry is not safe:
        // retain UNKNOWN so the Runtime chooses the complete top-level getter.
        if (status === 2 && (!entry || !name)) continue;
        if (Array.isArray(usedExports)) {
          treeShaking.usedExports = usedExports;
          treeShaking.providedExports = usedExports;
        }
        if (entry && name) {
          const fullFallbackGet = shared.get;
          treeShaking.get = async () => {
            try {
              const shareEntry = await getRemoteEntry({
                origin,
                remoteInfo: {
                  name,
                  entry,
                  type: fallbackType || "global",
                  entryGlobalName: name,
                  shareScope: "default",
                },
              });
              if (!shareEntry) throw new Error("Tree-shaken shared entry did not load");
              if (typeof shareEntry.init === "function") {
                await shareEntry.init(origin);
              }
              return shareEntry.get();
            } catch (error) {
              if (typeof fullFallbackGet === "function") return fullFallbackGet();
              throw error;
            }
          };
        }
        treeShaking.status = status;
      }
      return args;
    },
  });`;
}
function generateRemoteEntry(options, virtualExposesId = getVirtualExposesId(options), command = "build", exportConditions) {
	const needsSharedProviderSelectionHelper = Object.keys(options.shared ?? {}).length > 0;
	const hasTreeShakingShared = Object.values(options.shared ?? {}).some((share) => !!share?.shareConfig.treeShaking);
	const hasMultipleShareScopes = Array.isArray(options.shareScope);
	const guardHostAutoInit = command === "build" && Object.keys(options.exposes ?? {}).length > 0 && Object.keys(options.remotes ?? {}).length > 0;
	const materializedShareBatches = toSafeJsLiteral(getShareBatches(options, false));
	const runtimeImports = [
		"init as runtimeInit",
		"loadRemote",
		...hasTreeShakingShared ? ["getRemoteEntry"] : []
	].join(", ");
	const runtimeHelperImports = [...hasTreeShakingShared ? ["global as runtimeGlobal"] : [], ...needsSharedProviderSelectionHelper ? ["share as runtimeShare"] : []];
	const pluginImportNames = options.runtimePlugins.map((p, i) => {
		if (typeof p === "string") return [
			`$runtimePlugin_${i}`,
			`import $runtimePlugin_${i} from "${p}";`,
			`undefined`
		];
		else return [
			`$runtimePlugin_${i}`,
			`import $runtimePlugin_${i} from "${p[0]}";`,
			serializeRuntimeOptions(p[1])
		];
	});
	const initializeSharingCode = hasMultipleShareScopes ? `for (const shareScopeName of shareScopeNamesToInitialize) {
      try {
        await retrySharedInit(async () => {
          await Promise.all(await initRes.initializeSharing(shareScopeName, {
            strategy: '${options.shareStrategy}',
            from: "build",
            initScope
          }));
        });
      } catch (e) {
        console.error('[Module Federation]', e)
      }
    }` : `try {
      await retrySharedInit(async () => {
        await Promise.all(await initRes.initializeSharing('${options.shareScope}', {
          strategy: '${options.shareStrategy}',
          from: "build",
          initScope
        }));
      });
    } catch (e) {
      console.error('[Module Federation]', e)
    }`;
	return `
  // Shim Vue HMR runtime for dev-compiled components loaded by a non-Vite host.
  // When a remote is served by a Vite dev server, Vue's SFC compiler injects HMR
  // hooks that reference __VUE_HMR_RUNTIME__. This global only exists on pages
  // served by Vite's client runtime. When a production host loads the remote,
  // the HMR calls would throw. This no-op shim prevents that.
  if (typeof __VUE_HMR_RUNTIME__ === 'undefined') {
    globalThis.__VUE_HMR_RUNTIME__ = { createRecord() {}, rerender() {}, reload() {} };
  }
  import {${runtimeImports}} from "@module-federation/runtime";
  ${runtimeHelperImports.length ? `import {${runtimeHelperImports.join(", ")}} from "@module-federation/runtime/helpers";` : ""}
  ${pluginImportNames.filter((item) => !isSsrOnlyPlugin(item[1])).map((item) => item[1]).join("\n")}
  ${command === "build" ? getRuntimeInitResolveBootstrapCode(false, getRuntimeInitStatusImportId(options)) : getRuntimeInitBootstrapCode(false, getRuntimeInitStatusImportId(options), void 0, void 0, exportConditions) + "\n  const { initResolve } = globalThis[globalKey];"}
  ${getRuntimeModuleCacheBootstrapCode(exportConditions)}
  const initTokens = {}
  const shareScopeNames = Array.isArray(${toSafeJsLiteral(options.shareScope)}) ? ${toSafeJsLiteral(options.shareScope)} : [${toSafeJsLiteral(options.shareScope)}]
  const shareScopeName = ${toSafeJsLiteral(hasMultipleShareScopes ? options.shareScope[0] : options.shareScope)}
  const mfName = ${toSafeJsLiteral(options.name)}
  const __mfMaterializedShareBatches = ${materializedShareBatches}
  let localSharedImportMapPromise
  let exposesMapPromise
  let __mfLateBridgeShared
  const shouldRetrySharedInitError = ${command !== "build"} && ((error) => {
    const message = String((error && error.message) || error || '');
    return message.includes('Importing a module script failed') ||
      message.includes('Failed to fetch') ||
      message.includes('Load failed') ||
      message.includes('Outdated Optimize Dep');
  });
  const waitSharedInitRetry = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function retrySharedInit(fn) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await fn();
      } catch (e) {
        const canRetry = typeof shouldRetrySharedInitError === 'function' && shouldRetrySharedInitError(e);
        if (!canRetry || attempt >= 19) throw e;
        await waitSharedInitRetry(250);
      }
    }
  }
  ${generateTreeShakingSnapshotPluginCode(hasTreeShakingShared)}
  ${needsSharedProviderSelectionHelper ? sharedProviderSelectionHelperCode : ""}
  ${needsSharedProviderSelectionHelper ? externalSharedProviderSelectionHelperCode : ""}

  async function getLocalSharedImportMap() {
    if (!localSharedImportMapPromise) {
      localSharedImportMapPromise = retrySharedInit(() => import("${getLocalSharedImportMapPath(options)}"))
        .catch((e) => { localSharedImportMapPromise = undefined; throw e; });
    }
    return localSharedImportMapPromise
  }

  async function getExposesMap() {
    if (!exposesMapPromise) {
      exposesMapPromise = retrySharedInit(() => import("${virtualExposesId}"))
        .then((mod) => mod.default ?? mod)
        .catch((e) => { exposesMapPromise = undefined; throw e; });
    }
    return exposesMapPromise
  }

  async function init(shared = {}, initScope = [], remoteEntryInitOptions = {}) {
    ${sharedCacheHelperCode}
    const getShareScope = (scopeName) => remoteEntryInitOptions.shareScopeMap?.[scopeName] ?? (${hasMultipleShareScopes} ? (shared?.[scopeName] || {}) : shared);
    const getShareScopeNames = (share) => {
      const configuredScopes = Array.isArray(share?.scope) ? share.scope : [share?.scope || shareScopeName];
      if (!${hasMultipleShareScopes}) return configuredScopes;
      return [...new Set([...configuredScopes, ...shareScopeNames])];
    };
    const getShareScopeName = (pkg, share) => {
      for (const scopeName of getShareScopeNames(share)) {
        if (getShareScope(scopeName)?.[pkg]) return scopeName;
      }
      return shareScopeName;
    };
    const getShareVersions = (pkg, share) => {
      for (const scopeName of getShareScopeNames(share)) {
        const versions = getShareScope(scopeName)?.[pkg];
        if (versions) return versions;
      }
      return getShareScope(shareScopeName)?.[pkg];
    };
    const federationInstances = globalThis.__FEDERATION__?.__INSTANCES__ || [];
    const initRootName = initScope.find((token) => token?.from)?.from;
    const scopeRoot = federationInstances.find((instance) =>
      instance?.options?.name === initRootName &&
      ${hasMultipleShareScopes ? "shareScopeNames.some((scopeName) => instance?.shareScopeMap?.[scopeName] === getShareScope(scopeName))" : `instance?.shareScopeMap?.['${options.shareScope}'] === shared`}
    ) || federationInstances.find((instance) =>
      instance?.options?.name !== mfName &&
      ${hasMultipleShareScopes ? "shareScopeNames.some((scopeName) => instance?.shareScopeMap?.[scopeName] === getShareScope(scopeName))" : `instance?.shareScopeMap?.['${options.shareScope}'] === shared`}
    );
    const __mfRuntimeShareScopes = Object.create(null);
    const __mfCloneShareScope = (hostScope) => {
      const runtimeScope = Object.create(null);
      for (const [pkg, versions] of Object.entries(hostScope || {})) {
        runtimeScope[pkg] = Object.assign(Object.create(null), versions);
      }
      return runtimeScope;
    };
    // runtimeInit() lets runtime plugins register providers (public
    // registerShared) before initShareScopeMap() replaces the runtime's own
    // scope map. Carry those registrations over; the runtime's own copies of
    // usedShared keep registering lazily through loadShare().
    const __mfKeepRegisteredShares = (scopeName, scope) => {
      for (const [pkg, versions] of Object.entries(initRes.shareScopeMap?.[scopeName] || {})) {
        for (const [version, provider] of Object.entries(versions || {})) {
          if (!provider || provider.get === usedShared[pkg]?.get) continue;
          const target = scope[pkg] ||= {};
          if (target[version] === undefined) target[version] = provider;
        }
      }
    };
    const __mfGetRuntimeShareScope = (scopeName, hostScope) => {
      __mfKeepRegisteredShares(scopeName, hostScope);
      const isWebpackScope = !scopeRoot && Object.values(hostScope || {}).some((versions) =>
        Object.values(versions || {}).some(isWebpackProvider)
      );
      const runtimeScope = isWebpackScope ? __mfCloneShareScope(hostScope) : hostScope;
      __mfRuntimeShareScopes[scopeName] = {
        host: hostScope,
        runtime: runtimeScope,
        isWebpackScope
      };
      return runtimeScope;
    };
    const __mfRestoreForeignSharedProviders = () => {
      const webpackScopes = Object.values(__mfRuntimeShareScopes).filter(
        ({ isWebpackScope }) => isWebpackScope
      );
      if (webpackScopes.length === 0) return;
      for (const { host, runtime } of webpackScopes) {
        for (const [pkg, versions] of Object.entries(host || {})) {
          const runtimeVersions = runtime[pkg] ||= Object.create(null);
          for (const [version, provider] of Object.entries(versions || {})) {
            runtimeVersions[version] = provider;
          }
        }
      }
    };
    const initialShared = Object.create(null);
    ${hasMultipleShareScopes ? `for (const scopeName of shareScopeNames) {
      for (const [pkg, versions] of Object.entries(getShareScope(scopeName))) {
        if (initialShared[pkg]) continue;
        const initialVersions = initialShared[pkg] = Object.create(null);
        for (const [version, provider] of Object.entries(versions)) {
          initialVersions[version] = Object.assign({}, provider);
        }
      }
    }` : `for (const [pkg, versions] of Object.entries(shared)) {
      const initialVersions = initialShared[pkg] = Object.create(null);
      for (const [version, provider] of Object.entries(versions)) {
        // Runtime registration mutates provider records in-place, notably their origin.
        // Preserve the parent-visible provider and its original provenance.
        initialVersions[version] = Object.assign({}, provider);
      }
    }`}
    const {usedShared, usedRemotes} = await getLocalSharedImportMap()
    function isWebpackProvider(provider) {
      if (typeof provider?.get !== 'function') return false;
      const source = Function.prototype.toString.call(provider.get);
      // Production minification renames __webpack_require__, but preserves
      // Webpack's lazy chunk-loading .e(...).then(...) shape.
      return (
        source.includes('__webpack_require__') ||
        /\\.\\s*e\\s*\\([^)]*\\)\\s*\\.then\\s*\\(/.test(source)
      );
    }
    const __mfUsesWebpackShareScope = Object.values(initialShared).some((versions) =>
      Object.values(versions || {}).some(isWebpackProvider)
    );
    const __mfGetSharePackageName = (pkg) => {
      const parts = pkg.split('/');
      return pkg.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
    };
    const __mfGetPendingExternalSharedProvider = (pkg, share, versionMap) => {
      if (typeof __mfSelectExternalSharedProvider !== 'function') return undefined;
      const packageName = __mfGetSharePackageName(pkg);
      const candidates = packageName === pkg
        ? [[pkg, share]]
        : [[pkg, share], [packageName, usedShared[packageName]]];
      for (const [candidatePkg, candidateShare] of candidates) {
        if (!candidateShare) continue;
        const candidateVersionMap = versionMap
          ? (candidatePkg === pkg ? versionMap : initialShared[candidatePkg])
          : ${hasMultipleShareScopes ? "getShareVersions(candidatePkg, candidateShare)" : "shared[candidatePkg]"};
        const provider = __mfSelectExternalSharedProvider(
          candidateVersionMap,
          candidatePkg,
          candidateShare,
          '${options.shareStrategy}'
        );
        if (provider && isWebpackProvider(provider) && !provider.lib && !provider.loaded) {
          return provider;
        }
      }
      return undefined;
    };
    // handling circular init calls before an external provider can re-enter this container
    ${hasMultipleShareScopes ? `const shareScopeNamesToInitialize = [];
    for (const shareScopeName of shareScopeNames) {
      let initToken = initTokens[shareScopeName];
      if (!initToken) initToken = initTokens[shareScopeName] = { from: mfName };
      if (initScope.indexOf(initToken) >= 0) continue;
      initScope.push(initToken);
      shareScopeNamesToInitialize.push(shareScopeName);
    }
    if (shareScopeNamesToInitialize.length === 0) return;` : `var initToken = initTokens[shareScopeName];
    if (!initToken)
      initToken = initTokens[shareScopeName] = { from: mfName };
    if (initScope.indexOf(initToken) >= 0) return;
    initScope.push(initToken);`}
    ${normalizeRuntimeShareCode}
    const __browserPlugins = [${pluginImportNames.filter((item) => !isSsrOnlyPlugin(item[1])).map((item) => `${item[0]}(${item[2]})`).join(", ")}];
    const __ssrPlugins = typeof globalThis.window === 'undefined'
      ? await Promise.all([${pluginImportNames.filter((item) => isSsrOnlyPlugin(item[1])).map((item) => {
		const specifier = getSsrOnlyPluginSpecifier(item[1]);
		const opts = item[2];
		return `import(${toSafeJsLiteral(specifier)}).then(m => (m.default ?? m)(${opts}))`;
	}).join(", ")}])
      : [];
    const __mfRuntimeShareLoadIdKey = "__mf_vite_runtime_share_load_id__";
    let __mfRuntimeShareLoadId = 0;
    const __mfRuntimeShareSelections = new Map();
    const __mfRuntimeShareLifecycles = new Map();
    const initRes = runtimeInit({
      name: mfName,
      remotes: ${options.shareStrategy === "loaded-first" ? "[]" : "usedRemotes"},
      shared: usedShared,
      plugins: [__mfSharePinLifecyclePlugin(), __mfRealNameSnapshotPlugin(), ${hasTreeShakingShared ? "__mfTreeShakingSnapshotPlugin()," : ""} ...__browserPlugins, ...__ssrPlugins],
      ${options.shareStrategy ? `shareStrategy: '${options.shareStrategy}'` : ""}
    });
    ${hasMultipleShareScopes ? `for (const shareScopeName of shareScopeNamesToInitialize) {
      const scopeShare = getShareScope(shareScopeName);
      initRes.initShareScopeMap(
        shareScopeName,
        __mfGetRuntimeShareScope(shareScopeName, scopeShare)
      );
    }` : `initRes.initShareScopeMap(
      '${options.shareScope}',
      __mfGetRuntimeShareScope('${options.shareScope}', shared)
    );`}
    function __mfSharePinLifecyclePlugin() {
      return {
        name: "vite-share-pin-lifecycle-plugin",
        resolveShare(args) {
          const loadId = args.shareInfo?.[__mfRuntimeShareLoadIdKey];
          const lifecycle = loadId === undefined
            ? undefined
            : __mfRuntimeShareLifecycles.get(loadId);
          if (!lifecycle) return args;
          const defaultResolver = args.resolver;
          args.resolver = (...resolverArgs) => {
            lifecycle.pinned.reapply();
            return defaultResolver(...resolverArgs);
          };
          lifecycle.pinned.reveal();
          return args;
        }
      };
    }
    function __mfRealNameSnapshotPlugin() {
      return {
        name: "vite-real-name-snapshot-plugin",
        afterLoadSnapshot(args) {
          // Remotes are registered under an owner-scoped runtime name, so the
          // global snapshot only ever holds that name. Containers built by other
          // bundlers ask for the same remote by its real container name, miss, and
          // fall back to that container's own entry, whose remoteEntry is empty
          // (RUNTIME-011). Mirroring the resolved snapshot under the real name
          // keeps the primary lookup off that fallback.
          const snapshot = args && args.remoteSnapshot;
          const globalName = snapshot && snapshot.globalName;
          const version = snapshot && snapshot.version;
          if (!globalName || !version || !snapshot.remoteEntry) return args;
          const moduleInfo = globalThis.__FEDERATION__ && globalThis.__FEDERATION__.moduleInfo;
          const realNameKey = globalName + ":" + version;
          // Stores the same object, not a copy, so a later mutation (e.g. runtime-core
          // normalizing fields) stays consistent across both keys. Never overwrites an
          // existing entry: a different owner may have already resolved this real name
          // to its own snapshot, and this mirror must not shadow that one.
          if (moduleInfo && !moduleInfo[realNameKey]) {
            moduleInfo[realNameKey] = snapshot;
          }
          return args;
        }
      };
    }
    const runtimeResolveShareHook = initRes.sharedHandler.hooks.lifecycle.resolveShare;
    const __mfRuntimeProviderOrigins = new WeakMap();
    runtimeResolveShareHook.on((args) => {
      const loadId = args.shareInfo?.[__mfRuntimeShareLoadIdKey];
      const resolver = args.resolver;
      if (typeof resolver !== "function") return args;
      const instrumentedResolver = (...resolverArgs) => {
        const resolved = resolver(...resolverArgs);
        const selectedProvider = resolved?.shared;
        if (
          selectedProvider &&
          (typeof selectedProvider === "object" || typeof selectedProvider === "function") &&
          !__mfRuntimeProviderOrigins.has(selectedProvider)
        ) {
          __mfRuntimeProviderOrigins.set(selectedProvider, { from: selectedProvider.from });
        }
        if (loadId !== undefined && selectedProvider) {
          __mfRuntimeShareSelections.set(loadId, selectedProvider);
        }
        return resolved;
      };
      args.resolver = instrumentedResolver;
      return args;
    });
    const __mfPinSharedProvider = (versionMap, version, currentProvider, provider) => {
      if (!versionMap || versionMap[version] !== currentProvider) return undefined;
      const pinnedProvider = Object.assign({}, provider, {
        version: provider.version ?? version,
        scope: provider.scope ?? currentProvider?.scope ?? ${toSafeJsLiteral(hasMultipleShareScopes ? options.shareScope : [options.shareScope])},
        strategy: 'loaded-first'
      });
      const providerFrom = provider.from;
      versionMap[version] = pinnedProvider;
      const isCurrentProviderActive = () => currentProvider === undefined
        ? versionMap[version] === undefined
        : versionMap[version] === currentProvider;
      return {
        provider: pinnedProvider,
        reveal() {
          if (versionMap[version] !== pinnedProvider) return false;
          if (currentProvider === undefined) delete versionMap[version];
          else versionMap[version] = currentProvider;
          return true;
        },
        reapply() {
          if (!isCurrentProviderActive()) return false;
          versionMap[version] = pinnedProvider;
          return true;
        },
        release(loaded, selected = true) {
          provider.from = providerFrom;
          if (versionMap[version] !== pinnedProvider) {
            return !selected && isCurrentProviderActive();
          }
          if (!selected) {
            if (currentProvider === undefined) delete versionMap[version];
            else versionMap[version] = currentProvider;
            return true;
          }
          if (!loaded) {
            if (currentProvider === undefined) delete versionMap[version];
            else versionMap[version] = currentProvider;
            return false;
          }
          pinnedProvider.from = providerFrom;
          if (loaded && pinnedProvider.lib) pinnedProvider.loaded = true;
          if (provider.strategy === undefined) delete pinnedProvider.strategy;
          else pinnedProvider.strategy = provider.strategy;
          return true;
        }
      };
    };
    const __mfSnapshotSharedProviders = (versionMap) => (
      Object.entries(versionMap || {}).map(([version, provider]) => ({
        provider,
        version,
        from: provider.from,
        registered: true
      }))
    );
    const __mfMatchLoadedSharedProvider = (providerSelections, factory) => {
      if (factory === undefined) return undefined;
      let match;
      for (const selection of providerSelections) {
        const provider = selection.provider;
        const directProvider = provider.treeShaking || provider;
        if (
          selection.loadedFactory !== factory &&
          provider.lib !== factory &&
          directProvider.lib !== factory
        ) continue;
        if (match) return undefined;
        match = selection;
      }
      return match;
    };
    const __mfLoadRuntimeShare = async (pkg, shareConfig, pinned) => {
      const loadId = ++__mfRuntimeShareLoadId;
      __mfRuntimeShareLifecycles.set(loadId, {
        pinned
      });
      try {
        const factory = await initRes.loadShare(pkg, {
          customShareInfo: {
            shareConfig,
            [__mfRuntimeShareLoadIdKey]: loadId
          }
        });
        return {
          factory: factory === false ? undefined : factory,
          selectedProvider: __mfRuntimeShareSelections.get(loadId)
        };
      } finally {
        __mfRuntimeShareSelections.delete(loadId);
        __mfRuntimeShareLifecycles.delete(loadId);
      }
    };
    const __mfLoadPinnedRuntimeShare = async (
      pkg,
      shareConfig,
      versionMap,
      version,
      currentProvider,
      provider,
      providerRegistered = true
    ) => {
      const providerFrom = provider.from;
      const pinned = __mfPinSharedProvider(
        versionMap,
        version,
        currentProvider,
        provider
      );
      if (!pinned) return undefined;
      let runtimeLoad;
      try {
        runtimeLoad = await __mfLoadRuntimeShare(pkg, shareConfig, pinned);
      } catch (error) {
        pinned.release(false);
        throw error;
      }
      const factory = runtimeLoad?.factory;
      if (factory === undefined) {
        pinned.release(false);
        return undefined;
      }
      const providerSelections = __mfSnapshotSharedProviders(versionMap);
      const directPinnedProvider = pinned.provider.treeShaking || pinned.provider;
      const pinnedMatchesFactory =
        pinned.provider.lib === factory || directPinnedProvider.lib === factory;
      if (!providerRegistered && pinnedMatchesFactory) {
        const pinnedSelectionIndex = providerSelections.findIndex(
          (selection) => selection.provider === pinned.provider
        );
        if (pinnedSelectionIndex !== -1) providerSelections.splice(pinnedSelectionIndex, 1);
      }
      if (!providerRegistered && !providerSelections.some((selection) => selection.provider === provider)) {
        providerSelections.push({
          provider,
          version,
          from: providerFrom,
          registered: false,
          loadedFactory: pinnedMatchesFactory ? factory : undefined
        });
      }
      const runtimeSelectedProvider =
        !providerRegistered &&
        runtimeLoad.selectedProvider === pinned.provider &&
        pinnedMatchesFactory
          ? provider
          : runtimeLoad.selectedProvider;
      if (
        runtimeSelectedProvider &&
        !providerSelections.some((selection) => selection.provider === runtimeSelectedProvider)
      ) {
        const runtimeProviderOrigin = __mfRuntimeProviderOrigins.get(runtimeSelectedProvider);
        const selectedVersion = typeof runtimeSelectedProvider.version === "string" && runtimeSelectedProvider.version
          ? runtimeSelectedProvider.version
          : version;
        providerSelections.push({
          provider: runtimeSelectedProvider,
          version: selectedVersion,
          from: runtimeProviderOrigin ? runtimeProviderOrigin.from : runtimeSelectedProvider.from,
          registered: versionMap?.[selectedVersion] === runtimeSelectedProvider,
          loadedFactory: factory
        });
      }
      const selection = providerSelections.find(
        (candidate) => candidate.provider === runtimeSelectedProvider
      ) ?? __mfMatchLoadedSharedProvider(providerSelections, factory);
      const providerStayedActive = pinned.release(
        true,
        selection?.provider === pinned.provider
      );
      if (!providerStayedActive || !selection) return undefined;
      const runtimeProviderOrigin = __mfRuntimeProviderOrigins.get(selection.provider);
      selection.from = selection.provider === provider
        ? providerFrom
        : runtimeProviderOrigin
          ? runtimeProviderOrigin.from
          : selection.provider.from;
      if (runtimeProviderOrigin) selection.provider.from = runtimeProviderOrigin.from;
      const mod = typeof factory === "function" ? factory() : factory;
      const resolved = await Promise.resolve(mod);
      if (selection.registered && versionMap?.[selection.version] !== selection.provider) return undefined;
      return { provider: selection.provider, selection, resolved };
    };
    const bridgedProviders = new Set();
    const bridgeSelections = new Map();
    const __mfBridgeMaterializedProvider = async (pkg, usedShare, versionMap) => {
      const singleton = Boolean(usedShare.shareConfig?.singleton);
      if (singleton && '${options.shareStrategy}' !== 'loaded-first') return;
      if (usedShare.canLiveRebind === false) return;
      try {
        const provider = __mfSelectExternalSharedProvider(
          versionMap,
          pkg,
          usedShare,
          '${options.shareStrategy}'
        );
        const providerEntry = __mfFindSharedProviderEntry(versionMap, provider);
        if (!providerEntry) return;
        if (usedShare.shareConfig?.import === false && __mfMatchesSharedProvider(provider, usedShare)) return;
        // Another container's consume-only stub has nothing to bridge to: its get() throws by construction.
        if (provider?.shareConfig?.import === false) return;
        const { version } = providerEntry;
        if (!singleton && version !== usedShare.version) return;
        if (
          !provider.lib &&
          !provider.loading &&
          !(provider.loaded && typeof provider.get === 'function')
        ) return;
        const usedCacheDescriptor = __mfGetSharedCacheDescriptor(
          pkg,
          singleton,
          usedShare.version,
          usedShare.scope
        );
        if (__mfReadSharedCache(__mfModuleCache.share, usedCacheDescriptor) !== undefined) return;
        const liveVersionMap = ${hasMultipleShareScopes ? "getShareVersions(pkg, usedShare)" : "shared[pkg]"};
        const liveProvider = liveVersionMap?.[version];
        if (providerEntry.registered && !__mfMatchesSharedProvider(liveProvider, provider)) return;
        let loadedShare;
        ${options.shareStrategy === "loaded-first" ? `loadedShare = await __mfLoadPinnedRuntimeShare(
            pkg,
            usedShare.shareConfig,
            liveVersionMap,
            version,
            liveProvider,
            provider,
            providerEntry.registered
          );` : `// Runtime loadShare() implicitly initializes version-first remotes without
          // this container's outer initScope. Materialized providers are already active,
          // so resolve them directly and keep remote initialization on the guarded path.
          let directFactory = provider.lib;
          if (!directFactory && isWebpackProvider(provider)) return;
          if (!directFactory && provider.loading) directFactory = await provider.loading;
          if (!directFactory && provider.loaded && typeof provider.get === 'function') {
            directFactory = await provider.get();
          }
          if (!directFactory) return;
          const directModule = typeof directFactory === "function" ? directFactory() : directFactory;
          const directResolved = await Promise.resolve(directModule);
          const directProvider = providerEntry.registered ? liveProvider : provider;
          loadedShare = {
            provider: directProvider,
            selection: {
              provider: directProvider,
              version,
              from: provider.from,
              registered: providerEntry.registered
            },
            resolved: directResolved
          };`}
        const actualProvider = loadedShare?.provider;
        const actualSelection = loadedShare?.selection;
        if (!actualSelection) return;
        const resolved = loadedShare?.resolved;
        if (resolved === undefined) return;
        if (__mfReadSharedCache(__mfModuleCache.share, usedCacheDescriptor) !== undefined) return;
        if (
          actualSelection.registered &&
          liveVersionMap?.[actualSelection.version] !== actualProvider
        ) return;
        __mfWriteSharedCache(
          __mfModuleCache.share,
          usedCacheDescriptor,
          __mfNormalizeRuntimeShare(resolved),
          actualSelection.from
        );
        bridgedProviders.add(actualProvider);
      } catch (e) {
        console.error('[Module Federation] Failed to bridge materialized shared module "' + pkg + '"', e)
      }
    };
    const __mfBridgeExternalSharedProvider = async (
      pkg,
      usedShare,
      versionMap,
      passedVersionMap,
      expectedSelection
    ) => {
      try {
        const usedCacheDescriptor = __mfGetSharedCacheDescriptor(pkg, usedShare.shareConfig?.singleton, usedShare.version, usedShare.scope);
        const cachedShare = __mfReadSharedCache(__mfModuleCache.share, usedCacheDescriptor);
        const cachedShareOwner = __mfReadSharedCacheOwner(__mfModuleCache.share, usedCacheDescriptor);
        const selectedExternalProvider = __mfSelectExternalSharedProvider(
          versionMap,
          pkg,
          usedShare,
          '${options.shareStrategy}'
        );
        const selectedRuntimeProvider = selectedExternalProvider ||
          __mfSelectSharedProvider(versionMap, pkg, usedShare, '${options.shareStrategy}') ||
          usedShare;
        const providerEntry = __mfFindSharedProviderEntry(versionMap, selectedRuntimeProvider);
        if (!providerEntry) return;
        const selectedLocalProvider = __mfMatchesSharedProvider(selectedRuntimeProvider, usedShare);
        const { version } = providerEntry;
        if (!usedShare.shareConfig?.singleton && version !== usedShare.version) return;
        const passedProvider = passedVersionMap?.[version];
        const resolvedExternalProvider = __mfResolveExternalSharedProvider(
          federationInstances,
          scopeRoot,
          ${hasMultipleShareScopes ? "getShareScope(getShareScopeName(pkg, usedShare))" : "shared"},
          ${hasMultipleShareScopes ? "getShareScopeName(pkg, usedShare)" : `'${options.shareScope}'`},
          pkg,
          providerEntry,
          selectedExternalProvider,
          passedProvider,
          '${options.shareStrategy}'
        );
        if (!resolvedExternalProvider && !selectedLocalProvider) return;
        const { provider, scopeRootProvider } = resolvedExternalProvider || {
          provider: selectedRuntimeProvider,
          scopeRootProvider: undefined
        };
        if (usedShare.canLiveRebind === false) return;
        if (usedShare.shareConfig?.import === false && __mfMatchesSharedProvider(provider, usedShare)) return;
        // Another container's consume-only stub has nothing to bridge to: its get() throws by construction.
        if (provider?.shareConfig?.import === false) return;
        // Preserve a singleton already selected by another container. The bridge may
        // only replace the provisional local fallback seeded by this container.
        if (cachedShare !== undefined && cachedShareOwner !== mfName) return;
        // Registration can replace an unloaded same-version root provider in-place.
        // Pin the chosen provider while loadShare() runs its implicit registration.
        const liveVersionMap = ${hasMultipleShareScopes ? "getShareVersions(pkg, usedShare)" : "shared[pkg]"};
        const liveProvider = liveVersionMap?.[version];
        if (
          providerEntry.registered &&
          !scopeRootProvider &&
          !__mfMatchesSharedProvider(liveProvider, provider)
        ) return;
        const loadedShare = await __mfLoadPinnedRuntimeShare(
          pkg,
          usedShare.shareConfig,
          liveVersionMap,
          version,
          liveProvider,
          provider,
          providerEntry.registered && !selectedLocalProvider
        );
        const actualProvider = loadedShare?.provider;
        const actualSelection = loadedShare?.selection;
        if (!actualSelection) return;
        if (__mfMatchesSharedProvider(actualProvider, usedShare)) return;
        if (expectedSelection) {
          if (
            expectedSelection.version !== actualSelection.version ||
            !__mfMatchesSharedProvider({ from: actualSelection.from }, expectedSelection.provider)
          ) return;
        }
        if (bridgedProviders.has(actualProvider)) return;
        const resolved = loadedShare?.resolved;
        if (resolved === undefined) return;
        const latestCachedShare = __mfReadSharedCache(__mfModuleCache.share, usedCacheDescriptor);
        const latestCachedShareOwner = __mfReadSharedCacheOwner(__mfModuleCache.share, usedCacheDescriptor);
        if (latestCachedShare !== undefined && latestCachedShareOwner !== mfName) return;
        if (
          actualSelection.registered &&
          liveVersionMap?.[actualSelection.version] !== actualProvider
        ) return;
        if (!expectedSelection) {
          bridgeSelections.set(pkg, {
            version: actualSelection.version,
            provider: { from: actualSelection.from }
          });
        }
        bridgedProviders.add(actualProvider);
        const normalized = __mfNormalizeRuntimeShare(resolved);
        __mfWriteSharedCache(
          __mfModuleCache.share,
          usedCacheDescriptor,
          normalized,
          actualSelection.from
        );
      } catch (e) {
        console.error('[Module Federation] Failed to bridge external shared module "' + pkg + '"', e)
      }
    };
    for (const batch of __mfMaterializedShareBatches) await Promise.all(batch.map(async (pkg) => {
      const usedShare = usedShared[pkg];
      if (!usedShare || usedShare.materialize === false || usedShare.treeShaking) return;
      await __mfBridgeMaterializedProvider(pkg, usedShare, initialShared[pkg]);
    }));
    for (const [pkg, share] of Object.entries(usedShared)) {
      if (share.treeShaking) continue;
      const cacheDescriptor = __mfGetSharedCacheDescriptor(pkg, share.shareConfig?.singleton, share.version, share.scope);
      if (__mfReadSharedCache(__mfModuleCache.share, cacheDescriptor) !== undefined) continue;
      const singletonCacheDescriptor = __mfGetSharedCacheDescriptor(pkg, true, share.version, share.scope);
      const singletonModule = __mfReadSharedCache(__mfModuleCache.share, singletonCacheDescriptor);
      if (singletonModule !== undefined) {
        __mfWriteSharedCache(
          __mfModuleCache.share,
          cacheDescriptor,
          singletonModule,
          __mfReadSharedCacheOwner(__mfModuleCache.share, singletonCacheDescriptor)
        );
      }
    }
    ${generateRuntimeSharedCacheSeedCode(options.shareStrategy, options)}
    ${initializeSharingCode}
    __mfRestoreForeignSharedProviders();
    // Calling provider.get() marks a provider as loaded. Wait until the Runtime has
    // finalized normal same-version precedence before materializing an external share.
    const __mfBridgeSharedProviders = async () => {
      for (const batch of __mfMaterializedShareBatches) await Promise.all(batch.map(async (pkg) => {
        const usedShare = usedShared[pkg];
        if (!usedShare || usedShare.materialize === false || usedShare.treeShaking) return;
        await __mfBridgeExternalSharedProvider(
          pkg,
          usedShare,
          ${hasMultipleShareScopes ? "getShareVersions(pkg, usedShare)" : "shared[pkg]"},
          initialShared[pkg],
          undefined
        );
      }));
    };
    await __mfBridgeSharedProviders();
    if (__mfUsesWebpackShareScope) {
      __mfLateBridgeShared = __mfBridgeSharedProviders;
    }
    try {
      const allInstances = globalThis.__FEDERATION__?.__SHARE__;
      const globalVersionsByPackage = Object.create(null);
      if (allInstances) {
        for (const [, scopes] of Object.entries(allInstances)) {
          for (const scopeName of shareScopeNames) {
            const scopeShare = scopes?.[scopeName];
            if (!scopeShare) continue;
            for (const [pkg, versionMap] of Object.entries(scopeShare)) {
            const usedShare = usedShared?.[pkg];
            const passedVersions = initialShared[pkg];
            const bridgeSelection = bridgeSelections.get(pkg);
            if (!usedShare) continue;
            if (!passedVersions) continue;
            if (!bridgeSelection) continue;
            if (usedShare.treeShaking) continue;
            const globalVersions = globalVersionsByPackage[pkg] || (globalVersionsByPackage[pkg] = Object.create(null));
            for (const [version, provider] of Object.entries(versionMap)) {
              if (!provider.lib) continue;
              if (bridgeSelection.version !== version) continue;
              if (!__mfMatchesSharedProvider(provider, bridgeSelection.provider)) continue;
              const passedProvider = passedVersions[version];
              const matchesPassedProvider = provider === passedProvider || (
                passedProvider?.from && provider.from === passedProvider.from
              );
              if (!matchesPassedProvider) continue;
              if (provider === usedShare || (usedShare.from && provider.from === usedShare.from)) continue;
              if (globalVersions[version] === undefined) globalVersions[version] = provider;
            }
            }
          }
        }
      }
      for (const batch of __mfMaterializedShareBatches) await Promise.all(batch.map(async (pkg) => {
        const versionMap = globalVersionsByPackage[pkg];
        if (!versionMap) return;
        await __mfBridgeExternalSharedProvider(
          pkg,
          usedShared[pkg],
          versionMap,
          initialShared[pkg],
          bridgeSelections.get(pkg)
        );
      }));
    } catch (e) {
      console.error('[Module Federation] Failed to bridge external shared modules', e)
    }
    ${generateTreeShakingSharedResolutionCode(hasTreeShakingShared)}
    const __mfResolveImportFalseShared = async (pkg, share) => {
      const cacheDescriptor = __mfGetSharedCacheDescriptor(pkg, share.shareConfig?.singleton, share.version, share.scope);
      const cachedShare = share.treeShaking
        ? __mfReadTreeShakingSharedSelection(__mfModuleCache.share, cacheDescriptor, mfName)
        : __mfReadSharedCache(__mfModuleCache.share, cacheDescriptor);
      if (share.shareConfig?.import !== false || cachedShare !== undefined) return;
      if (__mfGetPendingExternalSharedProvider(pkg, share, initialShared[pkg])) return;
      ${normalizeRuntimeShareCode}
      const versionMap = ${hasMultipleShareScopes ? "getShareVersions(pkg, share)" : "shared?.[pkg]"};
      const provider = __mfSelectSharedProvider(
        versionMap,
        pkg,
        share,
        '${options.shareStrategy}'
      ) || share;
      const providerEntry = __mfFindSharedProviderEntry(versionMap, provider);
      if (!providerEntry) return;
      // A provider registered on this instance through the public registerShared
      // API carries this container's own name, so tell the own stub apart by its
      // import:false config rather than by provenance.
      const __mfIsOwnStub = (candidate) => candidate === share || candidate?.shareConfig?.import === false;
      if (__mfIsOwnStub(provider)) return;
      const { version } = providerEntry;
      const currentProvider = versionMap?.[version];
      const loadedShare = await __mfLoadPinnedRuntimeShare(
        pkg,
        share.shareConfig,
        versionMap,
        version,
        currentProvider,
        provider,
        providerEntry.registered
      );
      const providerSelection = loadedShare?.selection;
      const actualProvider = loadedShare?.provider;
      const resolved = loadedShare?.resolved;
      if (!providerSelection) return;
      if (__mfIsOwnStub(actualProvider)) return;
      if (resolved === undefined) return;
      const latestCachedShare = share.treeShaking
        ? __mfReadTreeShakingSharedSelection(__mfModuleCache.share, cacheDescriptor, mfName)
        : __mfReadSharedCache(__mfModuleCache.share, cacheDescriptor);
      if (latestCachedShare !== undefined) return;
      if (
        providerSelection.registered &&
        versionMap?.[providerSelection.version] !== actualProvider
      ) return;
      const normalizedShared = __mfNormalizeRuntimeShare(resolved);
      if (share.treeShaking) {
        const providedExports = share.treeShaking.providedExports ?? share.treeShaking.usedExports ?? [];
        __mfWriteTreeShakingSharedCache(
          __mfModuleCache.share,
          cacheDescriptor,
          providedExports,
          normalizedShared
        );
        __mfWriteTreeShakingSharedSelection(
          __mfModuleCache.share,
          cacheDescriptor,
          mfName,
          normalizedShared
        );
      } else {
        __mfWriteSharedCache(
          __mfModuleCache.share,
          cacheDescriptor,
          normalizedShared,
          providerSelection.from
        );
      }
    };
    // Resolve runtime-only dependencies and seed local fallbacks in dependency
    // order. An unresolved provider blocks its consumers, which would otherwise
    // capture an undefined or provisional singleton; unrelated shares still seed.
    const __mfReadyDeferredSeedKeys = [];
    const __mfBlockedSeedKeys = new Set();
    for (const pkg of __mfDeferredSeedKeys) {
      const share = usedShared[pkg];
      const seedIndex = __mfSeedIndex.get(pkg);
      if (__mfIsRuntimeOnlySharePending(pkg)) {
        try {
          if (share.treeShaking) {
            await __mfResolveTreeShakingShared(pkg, share);
          } else if (share.shareConfig?.import === false) {
            await __mfResolveImportFalseShared(pkg, share);
          }
        } catch (err) {
          // A rejected provider is an unresolved provider: block its consumers as the
          // comment above prescribes, instead of escalating to a container-wide init() failure.
          console.error(
            \`[Module Federation] Failed to resolve runtime-only shared module "\${pkg}"\`,
            err
          );
        }
      }
      if (__mfIsRuntimeOnlySharePending(pkg)) {
        __mfBlockedSeedKeys.add(seedIndex);
      }
    }
    __mfExpandBlockedSeedKeys(__mfBlockedSeedKeys);
    __mfReadyDeferredSeedKeys.push(...__mfDeferredSeedKeys.filter(
      (pkg) => !__mfBlockedSeedKeys.has(__mfSeedIndex.get(pkg))
    ));
    await __mfSeedLocalShared(__mfReadyDeferredSeedKeys);
    initResolve(initRes)
    return initRes
  }

  async function getExposes(moduleName) {
    const exposesMap = await getExposesMap()
    if (!(moduleName in exposesMap)) throw new Error(\`[Module Federation] Module \${moduleName} does not exist in container.\`)
    if (__mfLateBridgeShared) await __mfLateBridgeShared()
    if (__mfModuleCache.pendingShareLoads) {
      await Promise.all(__mfModuleCache.pendingShareLoads)
    }
    return (exposesMap[moduleName])().then(res => () => res)
  }
  ${guardHostAutoInit ? `let __mfInitPromise;
  function __mfGuardedInit(shared, initScope, remoteEntryInitOptions) {
    if (shared === undefined && __mfInitPromise) return __mfInitPromise;
    __mfInitPromise = init(shared, initScope, remoteEntryInitOptions);
    return __mfInitPromise;
  }
  export { __mfGuardedInit as init, getExposes as get }` : `export { init, getExposes as get }`}
  `;
}
/**
* Inject entry file, automatically init when used as host,
* and will not inject remoteEntry
*/
const HOST_AUTO_INIT_TAG = "__H_A_I__";
const hostAutoInitStates = /* @__PURE__ */ new WeakMap();
const legacyHostAutoInitState = {
	module: new VirtualModule("hostAutoInit", HOST_AUTO_INIT_TAG),
	remoteEntryId: REMOTE_ENTRY_ID,
	command: "build"
};
function getHostAutoInitState(options) {
	if (!options) return legacyHostAutoInitState;
	let state = hostAutoInitStates.get(options);
	if (!state) {
		const ownerKey = getLocalOwnerKey(options);
		state = {
			module: new VirtualModule("hostAutoInit", HOST_AUTO_INIT_TAG, "", ownerKey),
			remoteEntryId: REMOTE_ENTRY_ID,
			command: "build"
		};
		hostAutoInitStates.set(options, state);
	}
	return state;
}
function generateHostAutoInitCode(remoteEntryImport, _command = "build", options, exportConditions) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	const shouldPreloadShares = resolvedOptions.shareStrategy !== "loaded-first";
	const hostInitShareBatches = toSafeJsLiteral(getShareBatches(options, false));
	const cacheOwner = toSafeJsLiteral(resolvedOptions.name);
	const preferLocalVinextReact = hasPackageDependency("vinext") && (!exportConditions?.includes("browser") || exportConditions.includes("worker"));
	return `
    ${getRuntimeModuleCacheBootstrapCode(exportConditions)}
    let hostInitPromise;
    async function initHost() {
      if (!hostInitPromise) {
        hostInitPromise = (async () => {
          ${sharedCacheHelperCode}
          ${generateHostAutoInitSharedCacheSeedCode(_command, options)}
          const remoteEntry = await import(${remoteEntryImport});
          const runtime = await remoteEntry.init();
          const {usedShared} = await import("${getLocalSharedImportMapPath(options)}");
          ${normalizeRuntimeShareCode}
          ${shouldPreloadShares ? `
          const __mfHasAlternativeSharedVersion = (pkg, share) =>
            (Array.isArray(share.scope) ? share.scope : [share.scope || 'default']).some(
              (scopeName) => Object.keys(runtime.shareScopeMap?.[scopeName]?.[pkg] || {}).some(
                (version) => version !== share.version
              )
            );
          const __mfHostInitShareBatches = ${hostInitShareBatches};
          for (const __mfHostInitShareBatch of __mfHostInitShareBatches) {
            await Promise.all(__mfHostInitShareBatch.map(async (pkg) => {
              const share = usedShared[pkg];
              if (!share || share.materialize === false) return;
              // remoteEntry.init resolves tree-enabled shares into the
              // coverage-aware cache. Never republish that selected partial under
              // a generic full-module key here.
              if (share.treeShaking) return;
              const cacheDescriptor = __mfGetSharedCacheDescriptor(pkg, share.shareConfig?.singleton, share.version, share.scope);
              if (
                __mfReadSharedCache(__mfModuleCache.share, cacheDescriptor) !== undefined &&
                ${_command === "serve" ? `__mfReadSharedCacheOwner(__mfModuleCache.share, cacheDescriptor) !== undefined` : `(
                        (!share.shareConfig?.singleton && __mfReadSharedCacheOwner(__mfModuleCache.share, cacheDescriptor) === ${cacheOwner}) ||
                        (share.shareConfig?.singleton && !__mfHasAlternativeSharedVersion(pkg, share))
                      )`}
              ) return;
              // An import:false share has nothing to load until a foreign provider
              // registers: its own stub getter throws by construction.
              if (
                share.shareConfig?.import === false &&
                !(Array.isArray(share.scope) ? share.scope : [share.scope || 'default']).some((scopeName) =>
                  Object.values(runtime.shareScopeMap?.[scopeName]?.[pkg] || {}).some(
                    (provider) => provider?.shareConfig?.import !== false
                  )
                )
              ) return;
              await runtime.loadShare(pkg, {
                customShareInfo: { shareConfig: share.shareConfig }
              }).then(async (factory) => {
                const mod = typeof factory === "function" ? factory() : factory;
                let resolved = __mfNormalizeRuntimeShare(await Promise.resolve(mod));
                ${preferLocalVinextReact ? `if (
                  (pkg === "react" || pkg === "react-dom") &&
                  typeof share.get === "function" &&
                  share.shareConfig?.import !== false
                ) {
                  try {
                    const localFactory = await share.get();
                    const localModule = typeof localFactory === "function" ? localFactory() : localFactory;
                    resolved = __mfNormalizeRuntimeShare(await Promise.resolve(localModule));
                  } catch {}
                }` : ""}
                __mfWriteSharedCache(
                  __mfModuleCache.share,
                  cacheDescriptor,
                  resolved,
                  ${cacheOwner}
                );
              });
            }));
          }
          ` : ""}
          return runtime;
        })();
      }
      return hostInitPromise;
    }
    hostInitPromise = initHost();
    export { initHost, hostInitPromise };
    `;
}
function writeHostAutoInit(remoteEntryId = REMOTE_ENTRY_ID, command = "build", options, exportConditions) {
	const state = getHostAutoInitState(options);
	state.remoteEntryId = remoteEntryId;
	state.command = command;
	if (exportConditions !== void 0) state.exportConditions = exportConditions;
	state.module.writeSync(generateHostAutoInitCode(toSafeJsLiteral(remoteEntryId), command, options, state.exportConditions), true);
}
function refreshHostAutoInit(options, exportConditions) {
	try {
		const state = getHostAutoInitState(options);
		writeHostAutoInit(state.remoteEntryId, state.command, options, exportConditions);
	} catch {}
}
function getHostAutoInitPath(options) {
	return getHostAutoInitState(options).module.getImportId();
}
function isOwnedHostAutoInitId(id, options) {
	return VirtualModule.findById(id) === getHostAutoInitState(options).module;
}
/**
* Build-time list of the loadShare wrappers this container bundles a fallback for, plus a function the host
* bootstrap calls after the remote preloads: a share still unseeded then (behind an unresolved runtime-only
* share in init()) has a deferred wrapper that only registers its pending load once evaluated. Importing it
* here puts that load in front of the bootstrap's pendingShareLoads barrier instead of inside the entry's own
* import graph, where module-scope reads would see it undefined. Kept out of hostInit so that chunk stays
* free of wrapper references.
*/
const PENDING_SHARES_TAG = "__P_S__";
const legacyPendingSharesState = {
	module: new VirtualModule("pendingShares", PENDING_SHARES_TAG),
	command: "build"
};
const pendingSharesStates = /* @__PURE__ */ new WeakMap();
function getPendingSharesState(options) {
	if (!options) return legacyPendingSharesState;
	let state = pendingSharesStates.get(options);
	if (!state) {
		state = {
			module: new VirtualModule("pendingShares", PENDING_SHARES_TAG, "", getLocalOwnerKey(options)),
			command: "build"
		};
		pendingSharesStates.set(options, state);
	}
	return state;
}
function generatePendingSharesCode(command = "build", options) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	const pendingShareImports = command === "build" ? getMaterializedShares(options).filter((pkg) => {
		const shareItem = getShareItemForPreload(pkg, resolvedOptions);
		if (!shareItem || pkg.endsWith("/")) return false;
		return shareItem.shareConfig.import !== false && !shareItem.shareConfig.treeShaking;
	}).map((pkg) => `[${toSafeJsLiteral(pkg)}, () => import(${toSafeJsLiteral(getLoadShareModulePath(pkg, false, options))})]`) : [];
	return `
    ${getRuntimeModuleCacheBootstrapCode()}
    ${sharedCacheHelperCode}
    const __mfPendingShareImports = [${pendingShareImports.join(", ")}];
    export async function preloadPendingShares() {
      if (__mfPendingShareImports.length === 0) return;
      const {usedShared} = await import("${getLocalSharedImportMapPath(options)}");
      await Promise.all(__mfPendingShareImports.map(async ([pkg, load]) => {
        const share = usedShared[pkg];
        if (!share || share.materialize === false || share.treeShaking || share.shareConfig?.import === false) return;
        const cacheDescriptor = __mfGetSharedCacheDescriptor(pkg, share.shareConfig?.singleton, share.version, share.scope);
        if (__mfReadSharedCache(__mfModuleCache.share, cacheDescriptor) !== undefined) return;
        await load().catch((err) => console.warn("[module-federation] shared preload failed:", pkg, err));
      }));
    }
  `;
}
function writePendingShares(command = "build", options) {
	const state = getPendingSharesState(options);
	state.command = command;
	state.module.writeSync(generatePendingSharesCode(command, options), true);
}
function refreshPendingShares(options) {
	try {
		writePendingShares(getPendingSharesState(options).command, options);
	} catch {}
}
function getPendingSharesPath(options) {
	return getPendingSharesState(options).module.getImportId();
}
function isOwnedPendingSharesId(id, options) {
	return VirtualModule.findById(id) === getPendingSharesState(options).module;
}
//#endregion
//#region src/virtualModules/virtualRemotes.ts
const cacheRemoteMap = /* @__PURE__ */ new WeakMap();
const remoteModuleMetadata = /* @__PURE__ */ new WeakMap();
const remoteOptionsIds = /* @__PURE__ */ new WeakMap();
let nextRemoteOptionsId = 1;
function getRemoteOptionsId(options) {
	let id = remoteOptionsIds.get(options);
	if (id === void 0) {
		id = nextRemoteOptionsId++;
		remoteOptionsIds.set(options, id);
	}
	return id;
}
const LOAD_REMOTE_TAG = "__loadRemote__";
function getRemoteVirtualModule(remote, command, enableSsrInit = false, consumer = "unified", options = getNormalizeModuleFederationOptions()) {
	let instanceCache = cacheRemoteMap.get(options);
	if (!instanceCache) {
		instanceCache = /* @__PURE__ */ new Map();
		cacheRemoteMap.set(options, instanceCache);
	}
	const cacheKey = `${remote}__${command}__${options.shareStrategy}__${consumer}__${enableSsrInit ? "ssr-init" : "no-ssr-init"}`;
	if (!instanceCache.has(cacheKey)) {
		const virtual = new VirtualModule(`${consumer === "unified" ? remote : `${remote}__mf_consumer__${consumer}`}${MF_OWNER_INFIX}${getRemoteOptionsId(options)}`, LOAD_REMOTE_TAG, ".js", options.internalName);
		virtual.writeSync(generateRemotes(remote, command, enableSsrInit, consumer, options));
		remoteModuleMetadata.set(virtual, {
			remote,
			command,
			enableSsrInit,
			consumer,
			options
		});
		instanceCache.set(cacheKey, virtual);
	}
	return instanceCache.get(cacheKey);
}
function refreshRemoteModuleForEnvironment(id, options, exportConditions) {
	const virtual = VirtualModule.findById(id);
	const metadata = virtual && remoteModuleMetadata.get(virtual);
	if (!virtual || !metadata || metadata.options !== options) return false;
	virtual.write(generateRemotes(metadata.remote, metadata.command, metadata.enableSsrInit, metadata.consumer, options, exportConditions));
	return true;
}
const usedRemotesMap = {};
const usedRemotesByOptions = /* @__PURE__ */ new WeakMap();
const dynamicRemotesByOptions = /* @__PURE__ */ new WeakMap();
const staticRemotesByOptions = /* @__PURE__ */ new WeakMap();
const preloadRemotesByOptions = /* @__PURE__ */ new WeakMap();
const EMPTY_STATIC_REMOTES = /* @__PURE__ */ new Set();
function getScopedUsedRemotesMap(options) {
	let scoped = usedRemotesByOptions.get(options);
	if (!scoped) {
		scoped = {};
		usedRemotesByOptions.set(options, scoped);
	}
	return scoped;
}
function recordUsedRemote(map, remoteKey, remoteModule) {
	ensureUsedRemoteKey(map, remoteKey).add(remoteModule);
}
function ensureUsedRemoteKey(map, remoteKey) {
	if (!map[remoteKey]) map[remoteKey] = /* @__PURE__ */ new Set();
	return map[remoteKey];
}
function ensureUsedRemote(remoteKey, options) {
	ensureUsedRemoteKey(usedRemotesMap, remoteKey);
	if (options) ensureUsedRemoteKey(getScopedUsedRemotesMap(options), remoteKey);
}
function addUsedRemote(remoteKey, remoteModule, options) {
	recordUsedRemote(usedRemotesMap, remoteKey, remoteModule);
	if (options) recordUsedRemote(getScopedUsedRemotesMap(options), remoteKey, remoteModule);
}
function getUsedRemotesMap(options) {
	if (options) return getScopedUsedRemotesMap(options);
	return usedRemotesMap;
}
function markDynamicRemote(remote, options) {
	let remotes = dynamicRemotesByOptions.get(options);
	if (!remotes) {
		remotes = /* @__PURE__ */ new Set();
		dynamicRemotesByOptions.set(options, remotes);
	}
	remotes.add(remote);
}
function markStaticRemote(remote, options) {
	let remotes = staticRemotesByOptions.get(options);
	if (!remotes) {
		remotes = /* @__PURE__ */ new Set();
		staticRemotesByOptions.set(options, remotes);
	}
	remotes.add(remote);
}
function markPreloadRemote(remote, options) {
	let remotes = preloadRemotesByOptions.get(options);
	if (!remotes) {
		remotes = /* @__PURE__ */ new Set();
		preloadRemotesByOptions.set(options, remotes);
	}
	remotes.add(remote);
}
function getPreloadRemotes(options) {
	return preloadRemotesByOptions.get(options) ?? EMPTY_STATIC_REMOTES;
}
function isDynamicOnlyRemote(remote, options) {
	return (dynamicRemotesByOptions.get(options)?.has(remote) ?? false) && !(staticRemotesByOptions.get(options)?.has(remote) ?? false);
}
function getRemoteAliasFromId(id, remotes) {
	return Object.keys(remotes).filter((name) => id === name || id.startsWith(name + "/")).sort((a, b) => b.length - a.length)[0];
}
function getRemoteRegistration(id, remotes, options) {
	const alias = getRemoteAliasFromId(id, remotes);
	if (!alias) return void 0;
	const remote = remotes[alias];
	return {
		entryGlobalName: remote.entryGlobalName,
		name: options ? getRuntimeRemoteAlias(alias, options) : remote.name,
		alias,
		type: remote.type,
		entry: remote.entry,
		shareScope: remote.shareScope ?? "default"
	};
}
function getRuntimeRemoteId(id, remotes, options) {
	const alias = getRemoteAliasFromId(id, remotes);
	if (!alias) return id;
	return `${getRuntimeRemoteAlias(alias, options)}${id.slice(alias.length)}`;
}
function resolveRemoteInitMode(shareStrategy, consumer) {
	if (shareStrategy !== "loaded-first") return "eager";
	if (consumer === "server") return "loaded-first-ssr";
	if (consumer === "client") return "loaded-first-client";
	return "loaded-first-unified";
}
function shouldDeferRemoteLoad(initMode) {
	return initMode === "loaded-first-client" || initMode === "loaded-first-unified";
}
/** Dev client wrappers can preload remotes while exposing stable proxies. */
function shouldEagerLoadClientRemoteInDev(command, enableSsrInit) {
	return enableSsrInit && command === "serve";
}
function getEagerDeferredClientInit() {
	return `__mfRemotePending = __mfStartRemoteLoad().then(__mfAssignRemoteModule);
      exportModule = __mfCreateDeferredRemoteProxy();`;
}
function shouldIncludeDeferredProxy(initMode, consumer, eagerLoadClientRemote, deferRemoteLoad) {
	if (eagerLoadClientRemote && consumer !== "server") return true;
	if (initMode === "eager") return consumer !== "server" && (consumer === "unified" || !eagerLoadClientRemote);
	if (consumer === "client" && eagerLoadClientRemote) return false;
	return deferRemoteLoad || consumer !== "server";
}
/** Codegen shared by every remote virtual module (no top-level await). */
function getRemoteModuleRuntimeHelpers() {
	return `
    function __mfUnwrapRemoteDefault(mod) {
      let value = mod;
      // A federated expose can pass through more than one ESM/CJS namespace
      // wrapper (notably with React/Preact lazy imports). Keep unwrapping
      // explicit default namespaces until the actual component is reached.
      const seen = new Set();
      while (value != null && typeof value === "object" && !seen.has(value)) {
        seen.add(value);
        if (value.__esModule && value.default != null) {
          value = value.default;
          continue;
        }
        if (!value.__esModule && value.default != null) {
          value = value.default;
          continue;
        }
        break;
      }
      return value;
    }
    let __mfDefaultExport;
    function __mfSyncDefaultExport() {
      __mfDefaultExport = exportModule?.__mf_is_remote_proxy
        ? exportModule
        : __mfUnwrapRemoteDefault(exportModule);
    }
    function __mfAssignRemoteModule(mod) {
      if (mod !== undefined) exportModule = mod;
      __mfSyncDefaultExport();
      return exportModule;
    }`;
}
function getDeferredProxyHelper(remoteCacheKey) {
	return `
    function __mfCreateDeferredRemoteProxy() {
      let pendingPromise;
      const ensurePending = () => {
        pendingPromise ||= __mfStartRemoteLoad();
        return pendingPromise;
      };
      const getModule = () => __mfModuleCache.remote[${JSON.stringify(remoteCacheKey)}];
      const proxyTarget = function (...args) {
        pendingPromise ||= __mfStartRemoteLoad();
        const mod = getModule();
        const fn = mod && (mod.default ?? mod);
        if (fn !== undefined && fn !== null) {
          return fn.apply(this, args);
        }
        return null;
      };
      return new Proxy(proxyTarget, {
        get(_target, prop) {
          if (prop === "__mf_is_remote_proxy") return true;
          if (prop === "__esModule") return true;
          if (prop === "then") return undefined;
          if (prop === Symbol.toPrimitive || prop === "toString")
            return () => "[MF remote: pending]";
          const mod = getModule();
          if (mod) {
            return prop in mod ? mod[prop] : mod.default?.[prop];
          }
          pendingPromise ||= __mfStartRemoteLoad();
          if (prop === "default") return proxyTarget;
          throw ensurePending();
        },
        has(_target, prop) {
          const mod = getModule();
          if (mod) return prop in mod;
          return (
            prop === "default" ||
            prop === "__esModule" ||
            prop === "__mf_is_remote_proxy"
          );
        },
        ownKeys() {
          const mod = getModule();
          const keys = new Set(mod ? Reflect.ownKeys(mod) : []);
          for (const k of Reflect.ownKeys(proxyTarget)) {
            const d = Object.getOwnPropertyDescriptor(proxyTarget, k);
            if (d && !d.configurable) keys.add(k);
          }
          return Array.from(keys);
        },
        getOwnPropertyDescriptor(_target, prop) {
          const targetDesc = Object.getOwnPropertyDescriptor(proxyTarget, prop);
          if (targetDesc && !targetDesc.configurable) return targetDesc;
          const mod = getModule();
          if (!mod) return undefined;
          return Object.getOwnPropertyDescriptor(mod, prop) || {
            configurable: true,
            enumerable: true,
            value: mod[prop],
          };
        },
        apply(target, thisArg, args) {
          return target.apply(thisArg, args);
        }
      });
    }`;
}
function getLazyRemotePendingExport() {
	return `export const __mf_remote_pending = __mfRemotePending ?? {
  then(onFulfilled, onRejected) {
    return (__mfRemotePending ??= __mfStartRemoteLoad().then(__mfAssignRemoteModule)).then(onFulfilled, onRejected);
  },
};`;
}
function getEagerRemotePendingExport() {
	return `export const __mf_remote_pending =
  __mfRemotePending ??
  __mfStartRemoteLoad().then(__mfAssignRemoteModule);`;
}
function getServerThenExport() {
	return `export function then(onFulfilled, onRejected) {
  return (__mfRemotePending ?? Promise.resolve(exportModule))
    .then(__mfAssignRemoteModule)
    .then(() => {
      __mfSyncDefaultExport();
      return {
        ...exportModule,
        default: __mfDefaultExport,
        __moduleExports: exportModule,
        __mf_remote_pending: __mfRemotePending,
      };
    })
    .then(onFulfilled, onRejected);
}`;
}
function getRemoteExportBlock(command, deferRemoteLoad, consumer) {
	if (command !== "serve" && command !== "build") return `__mfSyncDefaultExport();
export { __mfDefaultExport as default };`;
	return `__mfSyncDefaultExport();
__mfRemotePending?.then(__mfSyncDefaultExport, () => {});
export { exportModule as __moduleExports };
${deferRemoteLoad ? getLazyRemotePendingExport() : getEagerRemotePendingExport()}
${command === "serve" && consumer === "server" ? getServerThenExport() : ""}
export { __mfDefaultExport as default };`;
}
function generateRemotes(id, command, enableSsrInit = false, consumer = "unified", options, exportConditions) {
	const resolvedOptions = options ?? getNormalizeModuleFederationOptions();
	const isLoadedFirst = resolvedOptions.shareStrategy === "loaded-first";
	const initMode = resolveRemoteInitMode(resolvedOptions.shareStrategy, consumer);
	const deferRemoteLoad = shouldDeferRemoteLoad(initMode);
	const runtimeRemoteId = getRuntimeRemoteId(id, resolvedOptions.remotes, options);
	const remoteRegistration = getRemoteRegistration(id, resolvedOptions.remotes, options);
	const registerRemoteCode = isLoadedFirst && remoteRegistration ? `runtime.registerRemotes([${JSON.stringify(remoteRegistration)}]);` : "";
	const hostAutoInitPath = getHostAutoInitPath(options);
	const ssrRemotes = getSsrRuntimeRemotes(resolvedOptions.remotes, options);
	const browserHostInitCode = `import(${JSON.stringify(hostAutoInitPath)})
        .then((mod) => mod.hostInitPromise)
        .then(initResolve, initReject);`;
	const devRuntimeBootstrap = `${getRuntimeInitBootstrapCode(enableSsrInit, getRuntimeInitStatusImportId(options), ssrRemotes, hostAutoInitPath, exportConditions)}
    const { initPromise, initResolve, initReject, moduleCache: __mfModuleCache } = globalThis[globalKey];`;
	const importLine = command === "build" ? `${getRuntimeModuleCacheBootstrapCode(exportConditions)}
    import { hostInitPromise as __mfHostInitPromise } from ${JSON.stringify(hostAutoInitPath)};` : `${devRuntimeBootstrap}
    ${command === "serve" && consumer !== "server" ? browserHostInitCode : ""}`;
	const remoteLoadRuntimePromise = command === "build" ? "__mfHostInitPromise" : "initPromise";
	const remoteCacheKey = `${getRuntimeRemoteCachePrefix(options)}${id}`;
	const remoteLoadFailureHandler = command === "build" ? `.catch((error) => {
            delete __mfModuleCache.remote[pendingKey];
            throw error;
          })` : `.catch((error) => {
            delete __mfModuleCache.remote[pendingKey];
            throw error;
          })`;
	const remoteLoadCode = `
    function __mfStartRemoteLoad() {
      ${`
      const remoteCacheKey = ${JSON.stringify(remoteCacheKey)};
      const pendingKey = "__mf_pending__" + remoteCacheKey;
      if (!__mfModuleCache.remote[pendingKey]) {
        __mfModuleCache.remote[pendingKey] = ${remoteLoadRuntimePromise}
          .then((runtime) => {
            ${registerRemoteCode}
            const moduleCacheKey = Symbol.for(${JSON.stringify(MODULE_CACHE_SHARE_SCOPE_KEY)});
            const shareScopes = runtime.shareScopeMap || {};
            for (const scope of Object.values(shareScopes)) {
              if (scope && typeof scope === "object") scope[moduleCacheKey] = __mfModuleCache;
            }
            shareScopes[moduleCacheKey] = __mfModuleCache;
            return runtime.loadRemote(${JSON.stringify(runtimeRemoteId)});
          })
          .then((mod) => Promise.resolve(mod?.__mf_remote_dependency_pending).then(() => mod))
          .then((mod) => {
            __mfModuleCache.remote[remoteCacheKey] = mod;
            delete __mfModuleCache.remote[pendingKey];
            return mod;
          })
          ${remoteLoadFailureHandler};
      }
      return __mfModuleCache.remote[pendingKey];`}
    }`;
	const realRemoteInit = `__mfRemotePending = __mfStartRemoteLoad().then(__mfAssignRemoteModule);`;
	const deferredClientInit = `exportModule = __mfCreateDeferredRemoteProxy();`;
	const eagerLoadClientRemote = id === remoteRegistration?.alias || shouldEagerLoadClientRemoteInDev(command, enableSsrInit);
	const eagerClientInit = eagerLoadClientRemote ? getEagerDeferredClientInit() : deferredClientInit;
	const loadedFirstClientInit = eagerLoadClientRemote ? getEagerDeferredClientInit() : deferredClientInit;
	const environmentSplitInit = (clientInit, serverInit) => consumer === "client" ? clientInit : consumer === "server" ? serverInit : `if (${SERVER_ENV_GUARD}) {
      ${serverInit}
    } else {
      ${clientInit}
    }`;
	const initExportModule = initMode === "eager" ? environmentSplitInit(eagerClientInit, realRemoteInit) : environmentSplitInit(loadedFirstClientInit, realRemoteInit);
	const includeProxyHelper = shouldIncludeDeferredProxy(initMode, consumer, eagerLoadClientRemote, deferRemoteLoad);
	const deferredProxyCode = getDeferredProxyHelper(remoteCacheKey);
	return `
    ${importLine}
    ${remoteLoadCode}
    ${includeProxyHelper ? deferredProxyCode : ""}
    ${getRemoteModuleRuntimeHelpers()}
    let __mfRemotePending;
    let exportModule = __mfModuleCache.remote[${JSON.stringify(remoteCacheKey)}]
    if (exportModule === undefined) {
      ${initExportModule}
    }
    ${getRemoteExportBlock(command, deferRemoteLoad, consumer)}
  `;
}
//#endregion
//#region src/plugins/pluginAddEntry.ts
const isPreloadableVirtualMfChunk = (name) => name.includes("virtual_mf") && !name.includes("__prebuild__") && !name.includes("__loadShare__");
const HOST_INIT_PRELOAD_CHUNKS = [
	(name) => name === "hostInit",
	(name) => name === "remoteEntry",
	(name) => name === "virtualExposes",
	isPreloadableVirtualMfChunk,
	(name) => name === "index"
];
const isRemoteWarmupExcluded = (name) => name.includes("__prebuild__") || name.includes("__loadShare__");
const REMOTE_ENTRY_WARMUP_CHUNKS = [
	(name) => name === "hostInit",
	(name) => name === "virtualExposes",
	(name) => isPreloadableVirtualMfChunk(name) && !isRemoteWarmupExcluded(name)
];
function getChunksByFileName(bundle) {
	return new Map(Object.values(bundle).filter((chunk) => chunk.type === "chunk").map((chunk) => [chunk.fileName, chunk]));
}
function collectPreloadChunkFiles(chunksByFileName, seeds, excludeFromClosure = (name) => name.includes("__prebuild__")) {
	const seenFiles = /* @__PURE__ */ new Set();
	const files = [];
	const queue = [...seeds];
	while (queue.length > 0) {
		const chunk = queue.shift();
		if (seenFiles.has(chunk.fileName)) continue;
		seenFiles.add(chunk.fileName);
		for (const imported of chunk.imports ?? []) {
			const importedChunk = chunksByFileName.get(imported);
			if (importedChunk && !excludeFromClosure(importedChunk.name)) queue.push(importedChunk);
		}
		files.push(chunk.fileName);
	}
	return files;
}
function escapeHtmlAttr(value) {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function getExistingHrefSet(html) {
	return new Set(Array.from(html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi), (match) => match[1]));
}
function injectHostInitPreloads(html, bundle, resolvePath, externalHrefs = []) {
	const existingHrefs = getExistingHrefSet(html);
	const hrefs = [];
	for (const href of externalHrefs) {
		if (existingHrefs.has(href)) continue;
		existingHrefs.add(href);
		hrefs.push(href);
	}
	const chunksByFileName = getChunksByFileName(bundle);
	const seeds = Array.from(chunksByFileName.values()).filter((chunk) => HOST_INIT_PRELOAD_CHUNKS.some((match) => match(chunk.name)));
	for (const fileName of collectPreloadChunkFiles(chunksByFileName, seeds)) {
		const href = resolvePath(fileName);
		if (existingHrefs.has(href)) continue;
		existingHrefs.add(href);
		hrefs.push(href);
	}
	if (hrefs.length === 0) return html;
	const tags = hrefs.map((href) => `<link rel="modulepreload" crossorigin href="${escapeHtmlAttr(href)}">`).join("");
	return html.includes("</head>") ? html.replace("</head>", `${tags}</head>`) : `${tags}${html}`;
}
function appendRemoteEntryWarmup(bundle, entryFileName) {
	const chunksByFileName = getChunksByFileName(bundle);
	const entryChunk = chunksByFileName.get(entryFileName);
	if (!entryChunk || entryChunk.code.includes("__mfWarmupPath")) return;
	const reachable = /* @__PURE__ */ new Set();
	const walk = [entryChunk];
	while (walk.length > 0) {
		const chunk = walk.pop();
		if (reachable.has(chunk.fileName)) continue;
		reachable.add(chunk.fileName);
		for (const imported of [...chunk.imports ?? [], ...chunk.dynamicImports ?? []]) {
			const importedChunk = chunksByFileName.get(imported);
			if (importedChunk) walk.push(importedChunk);
		}
	}
	const seeds = Array.from(reachable).map((file) => chunksByFileName.get(file)).filter((chunk) => chunk.fileName !== entryFileName && REMOTE_ENTRY_WARMUP_CHUNKS.some((match) => match(chunk.name)));
	const lastSlash = entryFileName.lastIndexOf("/");
	const entryDir = lastSlash !== -1 ? entryFileName.slice(0, lastSlash + 1) : "";
	const files = collectPreloadChunkFiles(chunksByFileName, seeds, isRemoteWarmupExcluded).filter((file) => file !== entryFileName).map((file) => rebaseImport(file, entryDir));
	if (files.length === 0) return;
	entryChunk.code += `
if (typeof document !== 'undefined' && document.head) {
  try {
    for (const __mfWarmupPath of ${JSON.stringify(files)}) {
      const __mfWarmupLink = document.createElement('link');
      __mfWarmupLink.rel = 'modulepreload';
      __mfWarmupLink.crossOrigin = '';
      __mfWarmupLink.href = new URL(__mfWarmupPath, import.meta.url).href;
      document.head.appendChild(__mfWarmupLink);
    }
  } catch (__mfWarmupError) {}
}
`;
}
function getFirstHtmlEntryFile(entryFiles) {
	return entryFiles.find((file) => file.endsWith(".html"));
}
function stripQueryAndHash$1(file) {
	return file.split(/[?#]/)[0];
}
function isReactRouterClientRouteInput(file) {
	return /[?&]__react-router-build-client-route(?:[=&]|$)/.test(file);
}
function getBuildInput(config) {
	return config.build?.rollupOptions?.input ?? config.build?.rolldownOptions?.input;
}
function patchHashEntryFileName(output, entryName, fileName, defaultFileNames) {
	for (const option of ["entryFileNames", "chunkFileNames"]) {
		const originalFileNames = output[option];
		output[option] = (chunkInfo, ...args) => {
			if (chunkInfo?.name === entryName) return fileName;
			if (typeof originalFileNames === "function") return originalFileNames(chunkInfo, ...args);
			return originalFileNames || defaultFileNames;
		};
	}
}
function patchHashEntryFileNames(config, entryName, fileName) {
	if (!fileName?.includes?.("[hash")) return;
	fileName = fileName.replace(/(\[hash(?::\d+)?\])$/, "$1.js");
	config.build ??= {};
	config.build.rollupOptions ??= {};
	config.build.rolldownOptions ??= {};
	const assetsDir = config.build.assetsDir ?? "assets";
	const defaultFileNames = `${assetsDir ? `${assetsDir}/` : ""}[name]-[hash].js`;
	const patchOutput = (output) => patchHashEntryFileName(output, entryName, fileName, defaultFileNames);
	const patchBundlerOutput = (bundlerOptions) => {
		const output = bundlerOptions.output;
		if (Array.isArray(output)) {
			output.forEach(patchOutput);
			return;
		}
		patchOutput(bundlerOptions.output ??= {});
	};
	patchBundlerOutput(config.build.rollupOptions);
	patchBundlerOutput(config.build.rolldownOptions);
	Object.values(config.environments ?? {}).forEach((environment) => patchHashEntryFileNames(environment, entryName, fileName));
}
const addEntry = ({ entryName, entryPath, fileName, inject = "entry", forceClientInjected, skipTransformFor = [], federationOptions }) => {
	const DEV_HTML_PROXY_PREFIX = "virtual:mf-html-entry-proxy?";
	const ENTRY_BOOTSTRAP_PARAM = "mf-entry-bootstrap";
	const ENTRY_BOOTSTRAP_QUERY = `?${ENTRY_BOOTSTRAP_PARAM}`;
	const waitsForInit = entryName === "hostInit";
	const getEntryPath = () => typeof entryPath === "function" ? entryPath() : entryPath;
	let devEntryPath = "";
	let entryFiles = [];
	let htmlFilePath;
	let _command;
	let emitFileId;
	let pendingSharesEmitId;
	let viteConfig;
	let skipHtmlDevFallback = forceClientInjected ?? false;
	let clientInjected = false;
	let emittedFileName;
	let skipTransformIds = /* @__PURE__ */ new Set();
	let injectedTransformIds = /* @__PURE__ */ new Set();
	const ignoredHtmlScriptSources = /* @__PURE__ */ new Set();
	let bootstrapDir = "";
	function skipSvelteKitSsrBuild() {
		return (_command === "build" || viteConfig?.command === "build") && viteConfig?.build?.ssr && hasPackageDependency("@sveltejs/kit");
	}
	function isSvelteKitServerModule(id) {
		return hasPackageDependency("@sveltejs/kit") && (id.includes(".svelte-kit/generated/") || id.includes("/@sveltejs/kit/src/runtime/server/"));
	}
	function hasEntryBootstrapParam(id) {
		return id.includes(ENTRY_BOOTSTRAP_PARAM) || decodeURIComponent(id).includes(ENTRY_BOOTSTRAP_PARAM);
	}
	function rewriteSvelteKitInlineStart(html, initPath) {
		return html.replace(/<script>([\s\S]*?)<\/script>/gi, (scriptTag, body) => {
			if (!body.includes("kit.start(app, element);") || !body.includes("Promise.all([")) return scriptTag;
			if (body.includes("initHost")) return scriptTag;
			const blockStart = body.indexOf("{");
			const blockEnd = body.lastIndexOf("}");
			if (blockStart === -1 || blockEnd <= blockStart) return scriptTag;
			return `<script>${body.slice(0, blockStart + 1) + `
const __mfCurrentScript = document.currentScript;
(async () => {
  await import(${JSON.stringify(initPath)}).then(({ initHost }) => initHost());
` + body.slice(blockStart + 1, blockEnd).replaceAll("document.currentScript", "__mfCurrentScript") + `
})();
` + body.slice(blockEnd)}<\/script>`;
		});
	}
	function walkFiles(dir, predicate) {
		if (!fs$2.existsSync(dir)) return [];
		return fs$2.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
			const entryPath = path$1.join(dir, entry.name);
			if (entry.isDirectory()) return walkFiles(entryPath, predicate);
			return entry.isFile() && predicate(entry.name) ? [entryPath] : [];
		});
	}
	function walkHtmlFiles(dir) {
		return walkFiles(dir, (fileName) => fileName.endsWith(".html"));
	}
	function toRelativeImport(fromFile, targetFile) {
		const relative = normalizePathForImport(path$1.relative(path$1.dirname(fromFile), targetFile));
		return relative.startsWith(".") ? relative : `./${relative}`;
	}
	function patchSvelteKitStaticHtml() {
		const buildDir = path$1.resolve(viteConfig.root, "build");
		let initFile = emittedFileName ? path$1.resolve(buildDir, emittedFileName) : void 0;
		if (!initFile || !fs$2.existsSync(initFile)) initFile = walkFiles(buildDir, (fileName) => fileName.endsWith(".js")).find((file) => {
			const code = fs$2.readFileSync(file, "utf-8");
			return code.includes("hostInitPromise") && code.includes("initHost");
		});
		if (!initFile) return false;
		let patched = false;
		for (const htmlFile of walkHtmlFiles(buildDir)) {
			const html = fs$2.readFileSync(htmlFile, "utf-8");
			const rewritten = rewriteSvelteKitInlineStart(html, toRelativeImport(htmlFile, initFile));
			if (rewritten !== html) {
				fs$2.writeFileSync(htmlFile, rewritten);
				patched = true;
			}
		}
		return patched;
	}
	function getRemoteEntryPreloadUrls() {
		const normalizedOptions = federationOptions ?? getNormalizeModuleFederationOptions();
		const isLoadedFirstClientBuild = (_command === "build" || viteConfig?.command === "build") && waitsForInit && !viteConfig?.build?.ssr && normalizedOptions.shareStrategy === "loaded-first";
		if (normalizedOptions.shareStrategy === "loaded-first" && !isLoadedFirstClientBuild) return [];
		const remoteSources = isLoadedFirstClientBuild ? Array.from(getPreloadRemotes(normalizedOptions)) : Object.keys(getUsedRemotesMap(federationOptions));
		return Array.from(new Set(remoteSources.flatMap((remote) => {
			const registration = getRemoteRegistration(remote, normalizedOptions.remotes, federationOptions);
			return registration && (registration.type === "module" || registration.type === "esm") && /^(?:https?:)?\/\//.test(registration.entry) ? [registration.entry] : [];
		})));
	}
	function getBootstrapSource(initSrc, entrySrc, useSystemImportFallback = false, options) {
		const importHelper = useSystemImportFallback ? `const __mfImport = (src) =>
  globalThis.System && typeof globalThis.System.import === 'function'
    ? globalThis.System.import(src)
    : import(src);
` : "";
		const importExpression = (src) => useSystemImportFallback ? `__mfImport(${JSON.stringify(src)})` : `import(${JSON.stringify(src)})`;
		const isEncodedVirtualEntry = entrySrc.startsWith(VITE_ENCODED_NULL_BYTE_PREFIX);
		const entryImportDeclaration = isEncodedVirtualEntry ? `const __mfEntryUrl = ${JSON.stringify(entrySrc)};
` : "";
		const entryImportExpression = isEncodedVirtualEntry ? "import(/* @vite-ignore */ __mfEntryUrl)" : importExpression(entrySrc);
		const normalizedOptions = federationOptions ?? getNormalizeModuleFederationOptions();
		const isLoadedFirstClientBuild = (_command === "build" || viteConfig?.command === "build") && waitsForInit && !viteConfig?.build?.ssr && normalizedOptions.shareStrategy === "loaded-first";
		const shouldPreloadRemotes = !options?.skipRemotePreload && (normalizedOptions.shareStrategy !== "loaded-first" || isLoadedFirstClientBuild);
		const remoteSources = isLoadedFirstClientBuild ? Array.from(getPreloadRemotes(normalizedOptions)) : Object.entries(getUsedRemotesMap(federationOptions)).flatMap(([, remotes]) => Array.from(remotes)).filter((remote) => !federationOptions || !isDynamicOnlyRemote(remote, federationOptions));
		const remotePreloads = shouldPreloadRemotes ? remoteSources.sort().map((remote) => {
			const registration = isLoadedFirstClientBuild ? getRemoteRegistration(remote, normalizedOptions.remotes, federationOptions) : void 0;
			return `__mfPreloadRemote(${JSON.stringify(getRuntimeRemoteId(remote, normalizedOptions.remotes, federationOptions))}, ${JSON.stringify(remote)}${registration ? `, ${JSON.stringify(registration)}` : ""})`;
		}).join(",") : "";
		const remoteEntryPrefetchUrls = shouldPreloadRemotes ? getRemoteEntryPreloadUrls() : [];
		const remoteEntryPrefetchBlock = remoteEntryPrefetchUrls.length > 0 ? `const __mfRemoteEntryPrefetchUrls = ${JSON.stringify(remoteEntryPrefetchUrls)};
for (const __mfRemoteEntryPrefetchUrl of __mfRemoteEntryPrefetchUrls) {
  import(/* @vite-ignore */ __mfRemoteEntryPrefetchUrl).catch(() => {});
}
` : "";
		const sharedPreloadSources = _command === "serve" && waitsForInit && Object.keys(normalizedOptions.exposes || {}).length > 0 && Object.keys(normalizedOptions.remotes || {}).length === 0 && federationOptions ? Array.from(getUsedShares(federationOptions)).filter((pkg) => !pkg.endsWith("/")).filter((pkg) => {
			const shareItem = federationOptions.shared[pkg] || Object.entries(federationOptions.shared).find(([key]) => key.endsWith("/") && pkg.startsWith(key))?.[1];
			const isExplicitShare = Object.hasOwn(federationOptions.shared, pkg);
			return shareItem?.shareConfig?.singleton === true && shareItem?.shareConfig?.import !== false && !shareItem?.shareConfig?.treeShaking && (isExplicitShare || typeof shareItem?.shareConfig?.import === "string" || Boolean(getProjectResolvedImportPath(pkg)));
		}).map((pkg) => toViteEncodedId(getLoadShareModulePath(pkg, false, federationOptions))) : [];
		const sharedPreloadBlock = sharedPreloadSources.length > 0 ? `
  const __mfSharedPreloadUrls = ${JSON.stringify(sharedPreloadSources)};
  await Promise.all(__mfSharedPreloadUrls.map((src) => import(/* @vite-ignore */ src).catch((err) => console.warn("[module-federation] shared preload failed:", src, err))));` : "";
		const remoteCachePrefix = getRuntimeRemoteCachePrefix(federationOptions);
		const preloadBlock = remotePreloads ? `
  const runtime = await initHost();
  const __mfPreloadRemote = (runtimeRemote, remote${isLoadedFirstClientBuild ? ", registration" : ""}) => {
    ${isLoadedFirstClientBuild ? `if (registration && typeof runtime.registerRemotes === "function") {
      runtime.registerRemotes([registration]);
    }` : ""}
    const remoteCacheKey = ${JSON.stringify(remoteCachePrefix)} + remote;
    const pendingKey = "__mf_pending__" + remoteCacheKey;
    if (!__mfModuleCache.remote[pendingKey]) {
      __mfModuleCache.remote[pendingKey] = runtime.loadRemote(runtimeRemote)
        .then((mod) => {
          __mfModuleCache.remote[remoteCacheKey] = mod;
          delete __mfModuleCache.remote[pendingKey];
          return mod;
        })
        .catch((error) => {
          delete __mfModuleCache.remote[pendingKey];
          throw error;
        });
    }
    return __mfModuleCache.remote[pendingKey];
  };
  const __mfRemotePreloads = [${remotePreloads}];
  await ${isLoadedFirstClientBuild ? "Promise.all" : "Promise.allSettled"}(__mfRemotePreloads);` : `await initHost();`;
		const pendingShareLoadsAwait = `
  if (__mfModuleCache.pendingShareLoads) {
    await Promise.all(__mfModuleCache.pendingShareLoads);
  }
  const __mfReactServerModuleCache = globalThis[${JSON.stringify(getModuleCacheGlobalKey(["react-server"]))}];
  if (__mfReactServerModuleCache?.pendingShareLoads) {
    await Promise.all(__mfReactServerModuleCache.pendingShareLoads);
  }`;
		const pendingSharesBlock = waitsForInit && (_command === "build" || viteConfig?.command === "build") ? `
  const __mfPendingShares = await ${importExpression(options?.pendingSharesSrc ?? getPendingSharesPath(federationOptions))}.catch(() => undefined);
  if (__mfPendingShares && typeof __mfPendingShares.preloadPendingShares === "function") await __mfPendingShares.preloadPendingShares();` : "";
		const importCode = `
(async () => {
  const __mfHostInit = await ${importExpression(initSrc)};
  await __mfHostInit.__tla;
  const { initHost } = __mfHostInit;
  ${preloadBlock}${pendingSharesBlock}${sharedPreloadBlock}${pendingShareLoadsAwait}
})().then(() => ${entryImportExpression});
`;
		return [
			getRuntimeModuleCacheBootstrapCode(),
			importHelper,
			entryImportDeclaration,
			remoteEntryPrefetchBlock,
			importCode
		].join("\n");
	}
	function getSystemBootstrapSource(initSrc, entrySrc, pendingSharesSrc) {
		return getBootstrapSource(initSrc, entrySrc, true, { pendingSharesSrc });
	}
	function injectHtml() {
		return inject === "html" && (htmlFilePath || hasPackageDependency("@sveltejs/kit"));
	}
	function injectEntry() {
		if (inject === "html" && hasPackageDependency("@sveltejs/kit")) return false;
		return inject === "entry" || !htmlFilePath;
	}
	function normalizeDevHtmlProxyId(id) {
		return decodeViteId(id).replace(/^\0/, "");
	}
	function normalizeModuleId(id) {
		return normalizePathForImport(id.split("?")[0]);
	}
	function isReactRouterClientEntry(id) {
		const normalized = normalizeModuleId(decodeViteId(id).replace(/^\0+/, ""));
		return /(?:^|\/)entry\.client\.(?:[cm]?[jt]sx?)$/.test(normalized);
	}
	function resolveProjectId(id) {
		if (id.startsWith("\0") || id.startsWith("virtual:")) return normalizeModuleId(id);
		return normalizeModuleId(path$1.isAbsolute(id) ? id : path$1.resolve(viteConfig.root, id));
	}
	function isFederationInternalVirtualId(id) {
		const normalized = decodeViteId(id).replace(/^\0+/, "");
		return normalized.includes("virtual:mf:") || /__(?:loadShare|prebuild|loadRemote)__/.test(normalized);
	}
	function isWorkspaceSourceId(id) {
		const normalized = normalizeModuleId(decodeViteId(id));
		if (normalized.startsWith("\0") || normalized.startsWith("virtual:")) return false;
		const filePath = stripQueryAndHash$1(normalized);
		if (filePath.startsWith("/@fs/")) return true;
		if (!path$1.isAbsolute(filePath)) return false;
		const root = normalizePathForImport(path$1.resolve(viteConfig.root));
		const absolutePath = normalizePathForImport(path$1.resolve(filePath));
		const relativePath = normalizePathForImport(path$1.relative(root, absolutePath));
		return (relativePath === ".." || relativePath.startsWith("../") || path$1.isAbsolute(relativePath)) && fs$2.existsSync(absolutePath);
	}
	function addEntryFile(file) {
		const normalized = normalizeModuleId(file);
		if (!entryFiles.includes(normalized)) entryFiles.push(normalized);
	}
	function addHtmlScriptEntries(htmlPath) {
		if (!fs$2.existsSync(htmlPath)) return;
		const htmlContent = fs$2.readFileSync(htmlPath, "utf-8");
		const scriptRegex = /<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["']([^"']+)["'])[^>]*>/gi;
		let match;
		while ((match = scriptRegex.exec(htmlContent)) !== null) {
			if (/\svite-ignore(?:\s|=|\/?>)/i.test(match[0])) {
				ignoredHtmlScriptSources.add(match[1]);
				continue;
			}
			const scriptSrc = stripQueryAndHash$1(match[1]);
			if (/^(?:[a-z]+:)?\/\//i.test(scriptSrc)) continue;
			addEntryFile(scriptSrc);
			addEntryFile(scriptSrc.startsWith("/") ? path$1.resolve(viteConfig.root, scriptSrc.slice(1)) : path$1.resolve(path$1.dirname(htmlPath), scriptSrc));
		}
	}
	function addEntryRemoteImports(entrySrc) {
		if (!federationOptions || /^(?:[a-z]+:)?\/\//i.test(entrySrc)) return;
		const file = path$1.resolve(viteConfig.root, stripQueryAndHash$1(entrySrc).replace(/^\//, ""));
		if (!fs$2.existsSync(file)) return;
		const code = fs$2.readFileSync(file, "utf-8");
		for (const source of findModuleImportSources(code)) {
			const remote = Object.keys(federationOptions.remotes).find((name) => source === name || source.startsWith(`${name}/`));
			if (remote) addUsedRemote(remote, source, federationOptions);
		}
	}
	return [{
		name: "add-entry",
		apply: "serve",
		config(_config, { command }) {
			_command = command;
		},
		configResolved(config) {
			viteConfig = config;
			const resolvedEntryPath = getEntryPath();
			if (resolvedEntryPath.startsWith("virtual:mf")) devEntryPath = config.base + VITE_ID_PREFIX.slice(1) + resolvedEntryPath;
			else {
				const normalized = normalizePathForImport(resolvedEntryPath);
				const root = normalizePathForImport(config.root).replace(/\/$/, "");
				const relativePath = normalized.startsWith(root + "/") ? normalized.slice(root.length) : "/" + normalized.replace(/^[A-Za-z]:[\\/]/, "");
				devEntryPath = config.base + relativePath.replace(/^\//, "");
			}
			skipTransformIds = new Set(skipTransformFor.map(resolveProjectId));
		},
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const rawUrl = req.url?.split("#")[0] ?? "";
				if (normalizeDevHtmlProxyId(rawUrl.split("?")[0]) === DEV_HTML_PROXY_PREFIX.slice(0, -1)) {
					const query = rawUrl.slice(rawUrl.indexOf("?") + 1);
					const params = new URLSearchParams(query);
					const initSrc = params.get("init");
					const entrySrc = params.get("entry");
					if (initSrc && entrySrc) {
						const withBase = (src) => viteConfig.base + src.replace(/^\//, "");
						res.statusCode = 200;
						res.setHeader("Content-Type", "application/javascript");
						res.end(getBootstrapSource(withBase(initSrc), withBase(entrySrc)));
						return;
					}
				}
				if (!fileName) {
					next();
					return;
				}
				const devFileName = resolveHashPlaceholderFileName(fileName);
				if (devFileName !== fileName && req.url?.startsWith((viteConfig.base + devFileName).replace(/^\/?/, "/"))) req.url = req.url.replace(devFileName, fileName);
				if (req.url && req.url.startsWith((viteConfig.base + fileName).replace(/^\/?/, "/"))) {
					req.url = devEntryPath;
					req.headers["sec-fetch-dest"] = "script";
				}
				next();
			});
		},
		transformIndexHtml: {
			order: "pre",
			handler(c) {
				const shouldWrapEntryHtml = _command === "serve" && inject === "entry" && waitsForInit;
				if (!injectHtml() && !shouldWrapEntryHtml) return;
				clientInjected = true;
				const base = viteConfig.base.replace(/\/$/, "");
				const stripBase = (p) => base && p.startsWith(base + "/") ? p.slice(base.length) : p;
				const html = rewriteEntryScripts(c, (originalSrc) => {
					const entrySrc = stripBase(originalSrc);
					addEntryRemoteImports(entrySrc);
					const resolvedEntrySrc = entrySrc.startsWith("virtual:") ? toViteEncodedId(entrySrc) : entrySrc;
					const query = new URLSearchParams({
						init: sanitizeDevEntryPath(stripBase(devEntryPath)),
						entry: sanitizeDevEntryPath(resolvedEntrySrc)
					}).toString();
					return toViteEncodedId(`${DEV_HTML_PROXY_PREFIX}${query}`);
				});
				return html === c ? injectEntryScript(c, stripBase(devEntryPath)) : html;
			}
		},
		resolveId(id) {
			if (normalizeDevHtmlProxyId(id).startsWith(DEV_HTML_PROXY_PREFIX)) return id;
		},
		load(id) {
			const normalizedId = normalizeDevHtmlProxyId(id);
			if (!normalizedId.startsWith(DEV_HTML_PROXY_PREFIX)) return;
			const params = new URLSearchParams(normalizedId.slice(28));
			const initSrc = params.get("init");
			const entrySrc = params.get("entry");
			if (!initSrc || !entrySrc) return;
			return getBootstrapSource(initSrc, entrySrc);
		},
		transform(code, id) {
			if (id.includes("node_modules") || inject !== "html" || htmlFilePath) return;
			if (id.includes(".svelte-kit") && id.includes("internal.js")) return code.replace(/<head>/g, "<head><script type=\\\"module\\\" src=\\\"" + sanitizeDevEntryPath(devEntryPath) + "\\\"><\/script>");
		}
	}, {
		name: "add-entry",
		enforce: "post",
		applyToEnvironment() {
			return true;
		},
		config(config) {
			patchHashEntryFileNames(config, entryName, fileName);
		},
		configResolved(config) {
			viteConfig = config;
			skipTransformIds = new Set(skipTransformFor.map(resolveProjectId));
			const ctx = this;
			const envName = ctx != null && typeof ctx === "object" ? ctx["environment"] : void 0;
			if (envName?.name && envName.name !== "client") return;
			const inputOptions = getBuildInput(config);
			if (!inputOptions) htmlFilePath = path$1.resolve(config.root, "index.html");
			else if (typeof inputOptions === "string") entryFiles = [resolveProjectId(inputOptions)];
			else if (Array.isArray(inputOptions)) entryFiles = inputOptions.filter((input) => !isReactRouterClientRouteInput(String(input))).map(resolveProjectId);
			else if (typeof inputOptions === "object") entryFiles = Object.values(inputOptions).filter((input) => !isReactRouterClientRouteInput(String(input))).map((input) => resolveProjectId(String(input)));
			if (entryFiles.length > 0) htmlFilePath = getFirstHtmlEntryFile(entryFiles);
			if (config.command === "serve" && !htmlFilePath) {
				const rootIndexHtml = path$1.resolve(config.root, "index.html");
				if (fs$2.existsSync(rootIndexHtml)) htmlFilePath = rootIndexHtml;
			}
			if (htmlFilePath) addHtmlScriptEntries(htmlFilePath);
		},
		buildStart() {
			if (_command === "serve") return;
			if (skipSvelteKitSsrBuild()) return;
			if (this.environment?.name === "ssr") return;
			const hasHash = fileName?.includes?.("[hash");
			const emitFileOptions = {
				name: entryName,
				type: "chunk",
				id: getEntryPath(),
				preserveSignature: "strict"
			};
			if (!hasHash) emitFileOptions.fileName = fileName;
			emitFileId = this.emitFile(emitFileOptions);
			if (waitsForInit) pendingSharesEmitId = this.emitFile({
				name: "pendingShares",
				type: "chunk",
				id: getPendingSharesPath(federationOptions),
				preserveSignature: "strict"
			});
			if (htmlFilePath) addHtmlScriptEntries(htmlFilePath);
		},
		generateBundle(_options, bundle) {
			if (skipSvelteKitSsrBuild()) return;
			if (entryName === "remoteEntry" && emitFileId && fileName && !viteConfig?.build?.ssr && _options?.format === "es" && viteConfig?.build?.modulePreload !== false) {
				const remoteEntryFile = findRemoteEntryFile(fileName, bundle);
				if (remoteEntryFile) appendRemoteEntryWarmup(bundle, remoteEntryFile);
			}
			if (!injectHtml()) return;
			if (!emitFileId) return;
			const htmlFileNames = Object.keys(bundle).filter((fileName) => fileName.endsWith(".html"));
			if (htmlFileNames.length === 0) return;
			const file = this.getFileName(emitFileId);
			emittedFileName = file;
			const pendingSharesFile = pendingSharesEmitId ? this.getFileName(pendingSharesEmitId) : void 0;
			const lastSlash = file.lastIndexOf("/");
			bootstrapDir = lastSlash !== -1 ? file.slice(0, lastSlash + 1) : "";
			const resolvePath = (builtFileName, htmlFileName) => {
				if (!viteConfig.experimental?.renderBuiltUrl) return viteConfig.base + builtFileName;
				const result = viteConfig.experimental.renderBuiltUrl(builtFileName, {
					hostId: htmlFileName,
					hostType: "html",
					type: "asset",
					ssr: false
				});
				if (typeof result === "string") return result;
				if (result && typeof result === "object") {
					if ("runtime" in result) {
						mfWarn("renderBuiltUrl returned runtime code for HTML injection. Runtime code cannot be used in <script src=\"\">. Falling back to base path.");
						return viteConfig.base + builtFileName;
					}
					if (result.relative) return builtFileName;
				}
				return viteConfig.base + builtFileName;
			};
			const basePrefix = viteConfig.base?.replace(/\/$/, "") ?? "";
			const stripBase = (p) => basePrefix && p.startsWith(basePrefix + "/") ? p.slice(basePrefix.length) : p;
			let bootstrapIndex = 0;
			for (const fileName of htmlFileNames) {
				let htmlAsset = bundle[fileName];
				if (htmlAsset.type === "chunk") return;
				let htmlContent = htmlAsset.source.toString() || "";
				const initPath = resolvePath(file, fileName);
				const scriptRegex = /<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["']([^"']+)["'])[^>]*>\s*<\/script>/gi;
				let rewritten = false;
				htmlContent = htmlContent.replace(scriptRegex, (scriptTag, entrySrc) => {
					if (ignoredHtmlScriptSources.has(entrySrc)) return scriptTag;
					rewritten = true;
					const strippedInit = stripBase(initPath);
					const strippedEntry = stripBase(entrySrc);
					const rebasedInitPath = bootstrapDir ? rebaseImport(strippedInit, bootstrapDir) : initPath;
					const rebasedEntrySrc = bootstrapDir ? rebaseImport(strippedEntry, bootstrapDir) : entrySrc;
					const pendingSharesPath = pendingSharesFile ? resolvePath(pendingSharesFile, fileName) : void 0;
					const bootstrapSource = getSystemBootstrapSource(rebasedInitPath, rebasedEntrySrc, pendingSharesPath && bootstrapDir ? rebaseImport(stripBase(pendingSharesPath), bootstrapDir) : pendingSharesPath);
					const bootstrapHash = createHash("sha256").update(bootstrapSource).digest("hex").slice(0, 8);
					const bootstrapFileName = `${bootstrapDir}mf-entry-bootstrap-${bootstrapIndex++}-${bootstrapHash}.js`;
					const bootstrapRef = this.emitFile({
						type: "asset",
						fileName: bootstrapFileName,
						source: bootstrapSource
					});
					const bootstrapPath = viteConfig.base + this.getFileName(bootstrapRef);
					return scriptTag.replace(entrySrc, bootstrapPath);
				});
				if (!rewritten) {
					const svelteKitHtml = rewriteSvelteKitInlineStart(htmlContent, initPath);
					if (svelteKitHtml !== htmlContent) htmlContent = svelteKitHtml;
					else {
						const scriptContent = `
          <script type="module" src="${initPath}"><\/script>
        `;
						htmlContent = htmlContent.replace("<head>", `<head>${scriptContent}`);
					}
				}
				if (waitsForInit && viteConfig.build.modulePreload !== false) htmlContent = injectHostInitPreloads(htmlContent, bundle, (builtFileName) => resolvePath(builtFileName, fileName), getRemoteEntryPreloadUrls());
				htmlAsset.source = htmlContent;
			}
		},
		closeBundle() {
			if (_command === "serve" || !hasPackageDependency("@sveltejs/kit") || skipSvelteKitSsrBuild()) return;
			let attempts = 0;
			const retry = () => {
				attempts += 1;
				if (!patchSvelteKitStaticHtml() && attempts < 20) setTimeout(retry, 50);
			};
			setTimeout(retry, 0);
		},
		transform(code, id) {
			if (skipSvelteKitSsrBuild()) return;
			if (isSvelteKitServerModule(id)) return;
			if (hasEntryBootstrapParam(id)) return;
			if (normalizeModuleId(id).endsWith(".html")) return;
			const projectId = resolveProjectId(id);
			if (skipTransformIds.has(projectId)) return;
			const transformCtx = this;
			const transformEnv = transformCtx != null && typeof transformCtx === "object" ? transformCtx["environment"] : void 0;
			if (transformEnv?.name && transformEnv.name !== "client") return;
			const isVinext = hasPackageDependency("vinext");
			if (isVinext && inject === "html" && id.includes("virtual:vite-rsc/remove-duplicate-server-css")) {
				const namespaceReactImport = `import * as React from 'react';`;
				if (code.includes(namespaceReactImport)) return;
				const rewritten = code.replace(/import\s+React\s+from\s+['"]react['"];?/, namespaceReactImport);
				return rewritten === code ? void 0 : mapCodeToCodeWithSourcemap(rewritten);
			}
			if (isVinext && inject === "html" && (id.includes("virtual:vite-rsc/entry-browser") || id.includes("virtual:vinext-app-browser-entry"))) {
				const injection = `import ${JSON.stringify(getEntryPath())};\n`;
				if (code.includes(injection.trim())) {
					clientInjected = true;
					return;
				}
				clientInjected = true;
				return mapCodeToCodeWithSourcemap(injection + code);
			}
			if (_command === "serve" && inject === "entry" && waitsForInit && !clientInjected && /(?:^|\/)nuxt\/dist\/app\/entry\.js(?:\?|$)/.test(id) && code.includes("vueApp.mount(vueAppRootContainer);")) {
				clientInjected = true;
				const injection = `await import(${JSON.stringify(getEntryPath())}).then(({ initHost }) => initHost());\n      `;
				return mapCodeToCodeWithSourcemap(code.replace("vueApp.mount(vueAppRootContainer);", `${injection}vueApp.mount(vueAppRootContainer);`));
			}
			const isReactRouterEntry = isReactRouterClientEntry(id);
			const isHydrationEntryFallback = inject === "entry" && entryFiles.length === 0 && (!htmlFilePath || !fs$2.existsSync(htmlFilePath)) && !clientInjected && !isFederationInternalVirtualId(id) && !id.includes("node_modules") && (!code.includes("HydratedRouter") || isReactRouterEntry) && (id.startsWith("\0") || /\.(js|ts|mjs|vue|jsx|tsx)(\?|$)/.test(id)) && (/hydrateRoot|createRoot|ReactDOM\.render/.test(code) || /\.mount\s*\(\s*['"#]/.test(code) || /\.mount\s*\(/.test(code) && /createSSRApp|createApp/.test(code)) && !isWorkspaceSourceId(id);
			const isNuxtEntryAsyncModule = /(?:^|\/)nuxt\/dist\/app\/entry\.async\.js(?:\?|$)/.test(id) && code.includes("entry();");
			const isNuxtClientEntryFallback = _command === "serve" && inject === "entry" && (!htmlFilePath || !fs$2.existsSync(htmlFilePath)) && !clientInjected && !hasEntryBootstrapParam(id) && !id.includes("node_modules/.vite") && isNuxtEntryAsyncModule && !entryFiles.some((file) => projectId === file);
			if (!(_command === "serve" && isNuxtEntryAsyncModule) && (injectedTransformIds.has(projectId) || injectEntry() && entryFiles.some((file) => projectId === file) || _command === "serve" && inject === "html" && !isVinext && !clientInjected && !skipHtmlDevFallback && !id.startsWith("\0") && !id.includes("node_modules") && /\.(js|ts|mjs|vue|jsx|tsx)(\?|$)/.test(id) || isHydrationEntryFallback || inject === "entry" && waitsForInit && isReactRouterEntry || isNuxtClientEntryFallback)) {
				clientInjected = true;
				injectedTransformIds.add(projectId);
				if (!waitsForInit) return mapCodeToCodeWithSourcemap(`import ${JSON.stringify(getEntryPath())};\n` + code);
				const entrySrc = id.includes("?") ? `${id}&${ENTRY_BOOTSTRAP_QUERY.slice(1)}` : `${id}${ENTRY_BOOTSTRAP_QUERY}`;
				return mapCodeToCodeWithSourcemap(getBootstrapSource(getEntryPath(), entrySrc, false, { skipRemotePreload: _command === "serve" && isNuxtEntryAsyncModule }));
			}
		}
	}];
};
//#endregion
//#region src/plugins/pluginCheckAliasConflicts.ts
/**
* Check if user-defined alias conflicts with shared modules
* This should run after aliasToArrayPlugin to ensure alias is an array
*/
function checkAliasConflicts(options) {
	const { shared = {} } = options;
	const sharedKeys = Object.keys(shared);
	return {
		name: "check-alias-conflicts",
		configResolved(config) {
			if (sharedKeys.length === 0) return;
			const userAliases = config.resolve?.alias || [];
			const conflicts = [];
			const matchesSharedKey = (aliasEntry, sharedKey) => {
				const findPattern = aliasEntry.find;
				if (typeof findPattern === "string") return findPattern === sharedKey || sharedKey.startsWith(findPattern + "/");
				if (findPattern instanceof RegExp) {
					findPattern.lastIndex = 0;
					const matched = findPattern.test(sharedKey);
					findPattern.lastIndex = 0;
					return matched;
				}
				return false;
			};
			for (const sharedKey of sharedKeys) for (const aliasEntry of userAliases) {
				const replacement = aliasEntry.replacement;
				if (!matchesSharedKey(aliasEntry, sharedKey)) continue;
				if (replacement === "$1") break;
				if (typeof replacement === "string") {
					if (getPackageNameFromNodeModulePath(replacement) === (sharedKey.endsWith("/") ? sharedKey.slice(0, -1) : sharedKey)) continue;
					conflicts.push({
						sharedModule: sharedKey,
						alias: String(aliasEntry.find),
						target: replacement
					});
				}
			}
			if (conflicts.length > 0) {
				mfWarn("Detected alias conflicts with shared modules:");
				conflicts.forEach(({ sharedModule, alias, target }) => {
					mfWarn(`Shared module "${sharedModule}" is aliased by "${alias}" to "${target}"`);
				});
				mfWarn("This may cause runtime errors as the shared module will bypass Module Federation's sharing mechanism.");
			}
		}
	};
}
//#endregion
//#region src/plugins/hmr/react.ts
const REACT_REFRESH_PATH = "/@react-refresh";
const LOCAL_REACT_REFRESH_PATH = "/@mf-react-refresh-local";
const HOST_REACT_REFRESH_URL = "__MF_REACT_REFRESH_URL__";
function stripQuery(url) {
	return url?.replace(/\?.*$/, "");
}
function resolveReactRefreshRuntime(root) {
	const reactPluginEntry = createRequire(pathToFileURL$1(path.join(root, "package.json"))).resolve("@vitejs/plugin-react");
	const requireFromReactPlugin = createRequire(reactPluginEntry);
	const reactPluginRoot = path.dirname(reactPluginEntry);
	const runtimePath = path.join(reactPluginRoot, "refresh-runtime.js");
	const refreshUtilsPath = path.join(reactPluginRoot, "refreshUtils.js");
	if (existsSync$1(runtimePath)) return readFileSync$1(runtimePath, "utf-8");
	const reactRefreshDir = path.dirname(requireFromReactPlugin.resolve("react-refresh/package.json"));
	return [
		"const exports = {}",
		readFileSync$1(path.join(reactRefreshDir, "cjs/react-refresh-runtime.development.js"), "utf-8"),
		readFileSync$1(refreshUtilsPath, "utf-8"),
		"export default exports"
	].join("\n");
}
/**
* Proxy module served for `/@react-refresh` on MF remote dev servers.
* Delegates to the host page's RefreshRuntime when consumed by a host, but
* falls back to this remote's local runtime when the remote is opened directly.
*/
const REACT_REFRESH_PROXY_MODULE = [
	`const __remoteUrl = new URL(import.meta.url);`,
	`const __target = window.location.origin === __remoteUrl.origin ? new URL('.${LOCAL_REACT_REFRESH_PATH}', __remoteUrl).href : globalThis.${HOST_REACT_REFRESH_URL} || window.location.origin + '${REACT_REFRESH_PATH}';`,
	`const __rt = await import(__target);`,
	`export const injectIntoGlobalHook = __rt.injectIntoGlobalHook;`,
	`export const register = __rt.register;`,
	`export const getRefreshReg = __rt.getRefreshReg;`,
	`export const createSignatureFunctionForTransform = __rt.createSignatureFunctionForTransform;`,
	`export const registerExportsForReactRefresh = __rt.registerExportsForReactRefresh;`,
	`export const validateRefreshBoundaryAndEnqueueUpdate = __rt.validateRefreshBoundaryAndEnqueueUpdate;`,
	`export const __hmr_import = __rt.__hmr_import;`,
	`export default __rt.default || __rt;`
].join("\n");
const reactAdapter = {
	name: "react",
	pluginNames: ["vite:react-refresh", "vite:react-swc"],
	host: { transformIndexHtml({ server }) {
		const refreshPath = `${server.config.base.replace(/\/$/, "")}${REACT_REFRESH_PATH}`;
		return [{
			tag: "script",
			children: `globalThis.${HOST_REACT_REFRESH_URL} = new URL(${JSON.stringify(refreshPath)}, window.location.origin).href;`,
			injectTo: "head-prepend"
		}];
	} },
	remote: { configureServer({ server }) {
		let reactRefreshRuntime;
		server.middlewares.use((req, res, next) => {
			const url = stripQuery(req.url);
			if (url?.endsWith(LOCAL_REACT_REFRESH_PATH)) {
				reactRefreshRuntime ??= resolveReactRefreshRuntime(server.config.root);
				res.setHeader("Content-Type", "application/javascript; charset=utf-8");
				res.setHeader("Access-Control-Allow-Origin", "*");
				res.end(reactRefreshRuntime);
				return;
			}
			if (!url?.endsWith(REACT_REFRESH_PATH)) return next();
			res.setHeader("Content-Type", "application/javascript; charset=utf-8");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.end(REACT_REFRESH_PROXY_MODULE);
		});
	} }
};
//#endregion
//#region src/plugins/hmr/vue.ts
/**
* In dev mode each Vite dev server serves its own copy of Vue
* (`/node_modules/.vite/deps/vue.js`). When a remote module is loaded into the
* host page, the remote's Vue copy evaluates and runs:
*
*     globalThis.__VUE_HMR_RUNTIME__ = createHotReloadAPI()
*
* which silently overwrites the host's runtime. After that, `createRecord` for
* host components lives in the orphaned first runtime, but `reload(hmrId, ...)`
* goes through the second runtime — the lookup misses and HMR stops working.
*
* This guard pins `__VUE_HMR_RUNTIME__` to the first application Vue runtime
* via a property trap on `globalThis`. Subsequent writes from remote-side Vue
* copies are silently dropped. vite-plugin-checker bundles its own Vue runtime
* and evaluates it before the application, so writes from its virtual runtime
* are ignored explicitly. Must execute before any Vue module loads — injected
* as a plain (non-module) script at `head-prepend`.
*
* `singleton: true` in `shared` is not sufficient: in dev mode MF's share-scope
* does not actually dedupe Vue across dev servers, so without this guard the
* last-loaded copy wins.
*/
const VUE_HMR_RUNTIME_GUARD_SCRIPT = `
(function () {
  var h = null;
  Object.defineProperty(globalThis, '__VUE_HMR_RUNTIME__', {
    get: function () { return h; },
    set: function (v) {
      var stack = new Error().stack || '';
      if (stack.indexOf('@vite-plugin-checker-runtime') !== -1) return;
      if (h === null) h = v;
    },
    configurable: true,
    enumerable: true,
  });
})();`;
/**
* `@vitejs/plugin-vue` derives an SFC's `__hmrId` from a hash of the file path
* relative to Vite's `root`. With module federation, host and remote are
* separate Vite projects with independent roots — so an SFC at `src/App.vue`
* in both will hash to the same id. Once both copies of Vue collapse onto the
* shared `__VUE_HMR_RUNTIME__` (see the guard above), the host's instance and
* the remote's instance both register under that single id. A remote-only
* file change then calls `rerender(id, newRender)`, which iterates *every*
* instance under that id — including the host one — and applies the remote's
* render function to the host instance. The host's `setupState` doesn't have
* the remote's bindings, so the render throws and Vue falls back to a full
* reload required warning.
*
* Fix: rewrite the remote's emitted HMR id literals to be prefixed with the
* federation `name`, so the remote's instances live under a distinct key.
* Main SFC modules assign `.__hmrId`; template submodules pass the same id
* directly to `__VUE_HMR_RUNTIME__.rerender()`.
*/
const VUE_HMR_ID_LITERAL_RE = /((?:\.__hmrId\s*=|__VUE_HMR_RUNTIME__\.rerender\()\s*["'`])([^"'`]+)(["'`])/g;
function rewriteVueHmrIds(code, federationName) {
	let matched = false;
	return {
		code: code.replace(VUE_HMR_ID_LITERAL_RE, (_match, prefix, id, suffix) => {
			matched = true;
			if (id.startsWith(`${federationName}-`)) return `${prefix}${id}${suffix}`;
			return `${prefix}${federationName}-${id}${suffix}`;
		}),
		matched
	};
}
let pluginVueRegressionWarned = false;
function warnPluginVueRegression() {
	if (pluginVueRegressionWarned) return;
	pluginVueRegressionWarned = true;
	mfWarn("Detected a Vue SFC module with HMR calls but no HMR id literal could be rewritten. @vitejs/plugin-vue may have changed its output format — without the rewrite, host and remote SFCs that share a path will collide on the shared HMR runtime. Please report this to @module-federation/vite.");
}
const vueAdapter = {
	name: "vue",
	pluginNames: ["vite:vue", "vite:vue-jsx"],
	host: { transformIndexHtml() {
		return [{
			tag: "script",
			children: VUE_HMR_RUNTIME_GUARD_SCRIPT,
			injectTo: "head-prepend"
		}];
	} },
	remote: { transform(code, _id, ctx) {
		if (!code.includes("__VUE_HMR_RUNTIME__.createRecord(") && !code.includes("__VUE_HMR_RUNTIME__.rerender(")) return;
		const { code: rewritten, matched } = rewriteVueHmrIds(code, ctx.options.name);
		if (!matched) {
			warnPluginVueRegression();
			return;
		}
		return rewritten === code ? void 0 : rewritten;
	} }
};
//#endregion
//#region src/utils/devServerHost.ts
const UNSPECIFIED_HOSTS = /* @__PURE__ */ new Set(["0.0.0.0", "::"]);
/**
* Hostname for client-facing HTTP/WS origins built from Vite `server.host`.
*
* Unspecified bind addresses (`0.0.0.0`, `::`) map to `localhost`, matching
* Vite's own printed local URL. IPv6 addresses are wrapped in brackets so
* `http://[::1]:5173` / `ws://[::1]:5173` parse as valid URLs.
*/
function formatDevServerHostForOrigin(host) {
	if (typeof host !== "string" || UNSPECIFIED_HOSTS.has(host)) return "localhost";
	if (host.startsWith("[") && host.endsWith("]")) return host;
	return isIPv6(host) ? `[${host}]` : host;
}
//#endregion
//#region src/plugins/hmr/fullReload.ts
const REMOTE_HMR_ENDPOINT = "__mf_hmr";
const REMOTE_HMR_EVENT = "mf:remote-update";
const REMOTE_HMR_CONNECT_RETRY_DELAY_MS = 1e3;
const REMOTE_HMR_CONNECT_MAX_RETRIES = 10;
function getBasePath(base) {
	if (!base) return "/";
	if (base.startsWith("http://") || base.startsWith("https://")) try {
		return new URL(base).pathname || "/";
	} catch {
		return "/";
	}
	return base;
}
function getRemoteHmrPath(base) {
	return `${getBasePath(base).replace(/\/?$/, "/")}${REMOTE_HMR_ENDPOINT}`.replace(/\/{2,}/g, "/");
}
function getHmrWsPath(base, hmrPath) {
	const normalizedBase = getBasePath(base);
	const normalizedPath = getBasePath(hmrPath || "");
	if (!normalizedPath || normalizedPath === "/") return normalizedBase;
	return `${normalizedBase.endsWith("/") ? normalizedBase.slice(0, -1) : normalizedBase}/${normalizedPath.startsWith("/") ? normalizedPath.slice(1) : normalizedPath}`;
}
function getRemoteHmrWsUrl(server) {
	const hmr = server.config.server.hmr;
	return `${hmr && typeof hmr === "object" && hmr.protocol ? hmr.protocol : server.config.server.https ? "wss" : "ws"}://${formatDevServerHostForOrigin(hmr && typeof hmr === "object" && hmr.host ? hmr.host : server.config.server.host)}:${hmr && typeof hmr === "object" && (hmr.clientPort || hmr.port) ? hmr.clientPort || hmr.port : server.config.server.port}${getHmrWsPath(server.config.base, hmr && typeof hmr === "object" ? hmr.path : "")}?token=${server.config.webSocketToken}`;
}
function getLocalFallbackOrigin(server) {
	return `${server.config.server.https ? "https" : "http"}://${formatDevServerHostForOrigin(server.config.server.host)}:${server.config.server.port || 5173}`;
}
function getRemoteHmrEndpoint(remoteEntry, server) {
	try {
		const remoteManifestUrl = new URL(remoteEntry, getLocalFallbackOrigin(server));
		remoteManifestUrl.pathname = `/${remoteManifestUrl.pathname.split("/").filter(Boolean).slice(0, -1).join("/")}`;
		if (!remoteManifestUrl.pathname.endsWith("/")) remoteManifestUrl.pathname += "/";
		remoteManifestUrl.search = "";
		remoteManifestUrl.hash = "";
		return new URL(REMOTE_HMR_ENDPOINT, remoteManifestUrl).toString();
	} catch {
		return null;
	}
}
function parseRemoteHmrMessage(rawData) {
	if (typeof rawData !== "string") return null;
	try {
		const parsed = JSON.parse(rawData);
		if (parsed?.type !== "custom" || typeof parsed?.event !== "string") return null;
		return parsed;
	} catch {
		return null;
	}
}
function getStringPreview(value, max = 180) {
	let rawValue = "";
	if (typeof value === "string") rawValue = value;
	else if (value instanceof Error) rawValue = `${value.name}: ${value.message}`;
	else if (typeof value === "object" && value !== null) try {
		rawValue = JSON.stringify(value);
	} catch {}
	return rawValue.slice(0, max);
}
/**
* Installs the `/__mf_hmr` metadata endpoint on a remote dev server. The host
* fetches this to discover the remote's HMR WebSocket URL before opening a
* Node-to-Node relay socket. Always installed on remotes when `remoteHmr` is
* enabled — under `'native'` strategy the endpoint is unused but harmless;
* under `'full-reload'` it's the discovery hop for the host relay.
*/
function setupRemoteMetadataEndpoint(server, options) {
	const endpointPath = getRemoteHmrPath(server.config.base);
	const wsUrl = getRemoteHmrWsUrl(server);
	server.middlewares.use((req, res, next) => {
		if (req.url?.replace(/\?.*/, "") !== endpointPath) {
			next();
			return;
		}
		res.setHeader("Content-Type", "application/json");
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.end(JSON.stringify({
			remote: options.name,
			event: REMOTE_HMR_EVENT,
			wsUrl
		}));
	});
}
/**
* Installs file-watcher broadcasts on a remote dev server. Every non-ignored
* change/add/unlink emits a `mf:remote-update` custom event on the remote's
* own WS channel. The host relay (see `setupHostFullReloadRelay`) listens
* for these events and triggers a host-side full reload in response.
*
* Only called under the `'full-reload'` strategy.
*/
function setupRemoteBroadcast(server, options) {
	const broadcast = (file) => {
		if (shouldIgnoreFile(file, options)) return;
		server.ws.send({
			type: "custom",
			event: REMOTE_HMR_EVENT,
			data: {
				remote: options.name,
				file,
				ts: Date.now()
			}
		});
	};
	server.watcher.on("change", broadcast);
	server.watcher.on("add", broadcast);
	server.watcher.on("unlink", broadcast);
	server.httpServer?.once("close", () => {
		server.watcher.off("change", broadcast);
		server.watcher.off("add", broadcast);
		server.watcher.off("unlink", broadcast);
	});
}
/**
* Installs the host-side full-reload relay. For each configured remote:
*   1. Fetches the remote's `/__mf_hmr` metadata to get its WS URL.
*   2. Opens a Node-to-Node WebSocket to that URL.
*   3. On any `mf:remote-update` message, broadcasts `{ type: 'full-reload' }`
*      to the host's own browser-facing WS.
*
* Also reloads on local host file changes. Retries failed connections up to
* `REMOTE_HMR_CONNECT_MAX_RETRIES` times with a fixed delay.
*
* Only called under the `'full-reload'` strategy.
*/
function setupHostFullReloadRelay(server, options) {
	const connections = [];
	const reconnectTimers = /* @__PURE__ */ new Map();
	let isTearingDown = false;
	const clearReconnectTimer = (remoteName) => {
		const timer = reconnectTimers.get(remoteName);
		if (!timer) return;
		clearTimeout(timer);
		reconnectTimers.delete(remoteName);
	};
	const scheduleReconnect = (remoteName, remote, attempt, reason) => {
		if (isTearingDown) return;
		if (attempt >= REMOTE_HMR_CONNECT_MAX_RETRIES) {
			mfWarn(`Remote "${remoteName}" full HMR reconnect skipped after ${REMOTE_HMR_CONNECT_MAX_RETRIES} attempts: ${reason}`);
			return;
		}
		clearReconnectTimer(remoteName);
		const timer = setTimeout(() => {
			reconnectTimers.delete(remoteName);
			connectRemote(remoteName, remote, attempt + 1);
		}, REMOTE_HMR_CONNECT_RETRY_DELAY_MS);
		reconnectTimers.set(remoteName, timer);
	};
	const connectRemote = async (remoteName, remote, attempt = 0) => {
		if (isTearingDown) return;
		const endpoint = getRemoteHmrEndpoint(remote.entry, server);
		if (!endpoint) {
			mfWarn(`Failed to build HMR endpoint URL for remote "${remoteName}"`);
			return;
		}
		try {
			const metadataResponse = await fetch(endpoint);
			if (!metadataResponse.ok) {
				mfWarn(`Failed to fetch remote HMR metadata from "${remoteName}": ${metadataResponse.status}`);
				scheduleReconnect(remoteName, remote, attempt, `HTTP ${metadataResponse.status}`);
				return;
			}
			const metadata = await metadataResponse.json();
			if (metadata.event !== "mf:remote-update" || !metadata.wsUrl) {
				mfWarn(`Remote "${remoteName}" returned unexpected HMR metadata shape`);
				return;
			}
			const ws = new WebSocket(metadata.wsUrl, "vite-hmr");
			ws.onmessage = (rawEvent) => {
				const message = parseRemoteHmrMessage(rawEvent.data);
				if (!message || message.event !== "mf:remote-update") return;
				server.ws.send({ type: "full-reload" });
			};
			ws.onopen = () => clearReconnectTimer(remoteName);
			ws.onerror = (error) => mfWarn(`Remote HMR socket error for "${remoteName}":`, error);
			ws.onclose = () => scheduleReconnect(remoteName, remote, attempt, "socket closed");
			connections.push(ws);
		} catch (error) {
			mfWarn(`Failed to connect remote HMR for "${remoteName}" on attempt ${attempt + 1}: ${getStringPreview(error)}`);
			scheduleReconnect(remoteName, remote, attempt, getStringPreview(error));
		}
	};
	const teardown = () => {
		isTearingDown = true;
		reconnectTimers.forEach((timer) => clearTimeout(timer));
		reconnectTimers.clear();
		connections.forEach((connection) => {
			if (connection.readyState !== connection.CLOSING && connection.readyState !== connection.CLOSED) connection.close();
		});
		connections.length = 0;
	};
	for (const [remoteName, remote] of Object.entries(options.remotes)) connectRemote(remoteName, remote);
	const triggerHostReload = (file) => {
		if (shouldIgnoreFile(file, options)) return;
		server.ws.send({ type: "full-reload" });
	};
	server.watcher.on("change", triggerHostReload);
	server.watcher.on("add", triggerHostReload);
	server.watcher.on("unlink", triggerHostReload);
	server.httpServer?.once("close", teardown);
}
//#endregion
//#region src/plugins/pluginDevRemoteHmr.ts
/**
* Clears the federation runtime's `moduleCache` on every Vite `vite:beforeUpdate`
* event. Without this, after a remote SFC change Vite would patch the in-memory
* component, but `loadRemote()` would still return the cached stale module on
* the next call (e.g. after route navigation), making the patched version
* effectively unreachable.
*/
const FEDERATION_MODULE_CACHE_CLEAR_SCRIPT = `
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', function () {
    try {
      var f = globalThis.__FEDERATION__ || globalThis.__VMOK__;
      if (!f || !f.__INSTANCES__) return;
      for (var i = 0; i < f.__INSTANCES__.length; i++) {
        if (f.__INSTANCES__[i] && f.__INSTANCES__[i].moduleCache)
          f.__INSTANCES__[i].moduleCache.clear();
      }
    } catch (e) {}
  });
}`;
const HMR_ADAPTERS = [reactAdapter, vueAdapter];
function resolveAdapters(plugins) {
	const pluginNames = new Set(plugins.map((p) => p.name));
	return HMR_ADAPTERS.filter((adapter) => adapter.pluginNames.some((name) => pluginNames.has(name)));
}
function hasCrossFederationHmr(plugins) {
	return resolveAdapters(plugins).length > 0;
}
function isRemoteHmrEnabled(dev) {
	return typeof dev === "object" && dev !== null && !!dev.remoteHmr;
}
/**
* `'native'` — a matched framework adapter owns HMR through Vite's native
* channel (e.g. React Fast Refresh via the `/@react-refresh` proxy, Vue's
* patched `__VUE_HMR_RUNTIME__`). The broadcast/relay path stays idle.
*
* `'full-reload'` — no adapter matched, or the user explicitly opted in with
* `remoteHmr: 'full-reload'` to bypass adapters: the plugin's broadcast/relay
* machinery triggers a page reload on every remote file change.
*/
function resolveHmrStrategy(dev, plugins) {
	if (typeof dev === "object" && dev !== null && dev.remoteHmr === "full-reload") return "full-reload";
	return hasCrossFederationHmr(plugins) ? "native" : "full-reload";
}
function shouldIgnoreFile(file, options) {
	return file.includes("/node_modules/") || file.includes("\\node_modules\\") || file.includes(`/${options.virtualModuleDir}/`) || file.includes(`\\${options.virtualModuleDir}\\`) || file.includes("/.vite/") || file.includes("\\.vite\\") || file.includes("/.mf/") || file.includes("\\.mf\\") || file.includes("/mf-manifest.json") || file.includes("\\mf-manifest.json") || file.includes("/mf-stats.json") || file.includes("\\mf-stats.json");
}
function collectHostTags(server, options, adapters) {
	const ctx = {
		server,
		options
	};
	const tags = [];
	for (const adapter of adapters) {
		const adapterTags = adapter.host?.transformIndexHtml?.(ctx);
		if (adapterTags) tags.push(...adapterTags);
	}
	tags.push({
		tag: "script",
		attrs: { type: "module" },
		children: FEDERATION_MODULE_CACHE_CLEAR_SCRIPT,
		injectTo: "head"
	});
	return tags;
}
function pluginDevRemoteHmr(options) {
	const isHost = Object.keys(options.remotes).length > 0;
	const isRemote = Object.keys(options.exposes).length > 0;
	let adapters = [];
	let strategy = "full-reload";
	return {
		name: "module-federation-dev-remote-hmr",
		apply: "serve",
		configResolved(config) {
			adapters = resolveAdapters(config.plugins);
			strategy = resolveHmrStrategy(options.dev, config.plugins);
		},
		configureServer(server) {
			if (!isRemoteHmrEnabled(options.dev)) return;
			if (isRemote) {
				for (const adapter of adapters) adapter.remote?.configureServer?.({
					server,
					options
				});
				setupRemoteMetadataEndpoint(server, options);
				if (strategy === "full-reload") setupRemoteBroadcast(server, options);
			}
			if (isHost) {
				for (const adapter of adapters) adapter.host?.configureServer?.({
					server,
					options
				});
				if (strategy === "full-reload") setupHostFullReloadRelay(server, options);
			}
		},
		transform: {
			order: "post",
			handler(code, id) {
				if (!isRemote || !isRemoteHmrEnabled(options.dev)) return;
				if (!adapters.length) return;
				let result = code;
				const adapterCtx = { options };
				for (const adapter of adapters) {
					const next = adapter.remote?.transform?.(result, id, adapterCtx);
					if (typeof next === "string") result = next;
				}
				return result === code ? void 0 : result;
			}
		},
		transformIndexHtml: {
			order: "pre",
			handler(_html, ctx) {
				if (!isRemoteHmrEnabled(options.dev)) return;
				if (!isHost || !ctx.server) return;
				return collectHostTags(ctx.server, options, adapters);
			}
		}
	};
}
//#endregion
//#region src/plugins/pluginExternalRuntimeCore.ts
const EXTERNAL_RUNTIME_CORE_VIRTUAL_ID = "\0virtual:mf-external-runtime-core";
/** Package remotes import — rewritten to the host global shim. */
const RUNTIME_CORE_PACKAGE = "@module-federation/runtime-core";
/**
* Already depended on via `@module-federation/runtime`. Prefer this for Node
* introspection so we do not need a direct `runtime-core` dependency.
*/
const RUNTIME_CORE_INTROSPECT_PACKAGE = "@module-federation/runtime/core";
function isRuntimeCoreId(id) {
	return id === "@module-federation/runtime-core" || id === `@module-federation/runtime-core/`;
}
/** True when the importer is part of an SSR remote graph (skip browser shim). */
function isSsrRemoteRuntimeImporter(importer) {
	if (!importer) return false;
	return importer.includes("virtual:mf-REMOTE_ENTRY_SSR_ID") || importer.includes("virtual:mf-exposes-ssr:") || importer.includes("/__mf_ssr__/");
}
function collectRuntimeCoreExportShapes(runtimeCoreModule) {
	return Object.keys(runtimeCoreModule).filter((key) => key !== "default" && key !== "__esModule").sort().map((name) => ({
		name,
		callable: typeof runtimeCoreModule[name] === "function"
	}));
}
/**
* Builds a shim that defers reading `globalThis._FEDERATION_RUNTIME_CORE` until
* an export is accessed. Vite dev does not guarantee host `beforeInit` runs
* before remote graph modules evaluate, so an eager throw at import time can
* fail even when `provideExternalRuntime` is correctly configured.
*/
function buildExternalRuntimeCoreShimCode(exportShapes) {
	return `${[
		"function __mfGetExternalRuntimeCore() {",
		"  const mod = globalThis._FEDERATION_RUNTIME_CORE;",
		"  if (!mod) {",
		"    throw new Error(\"[Module Federation] experiments.externalRuntime is enabled, but globalThis._FEDERATION_RUNTIME_CORE is missing. Enable experiments.provideExternalRuntime on the host consumer.\");",
		"  }",
		"  return mod;",
		"}",
		"function __mfCreateLazyRuntimeCoreFunction(exportName) {",
		"  const target = function (...args) {",
		"    return Reflect.apply(__mfGetExternalRuntimeCore()[exportName], this, args);",
		"  };",
		"  return new Proxy(target, {",
		"    get(_target, prop) {",
		"      if (prop === \"__mf_is_external_runtime_core_export\") return true;",
		"      // Avoid thenable detection / introspection throwing before host init.",
		"      if (prop === \"then\") return undefined;",
		"      const value = __mfGetExternalRuntimeCore()[exportName];",
		"      if (prop === \"prototype\") return value?.prototype;",
		"      if (prop === Symbol.hasInstance) {",
		"        return (instance) => instance instanceof value;",
		"      }",
		"      if (value == null) return value;",
		"      const inner = Reflect.get(value, prop, value);",
		"      return typeof inner === \"function\" ? inner.bind(value) : inner;",
		"    },",
		"    set(_target, prop, nextValue) {",
		"      __mfGetExternalRuntimeCore()[exportName][prop] = nextValue;",
		"      return true;",
		"    },",
		"    has(_target, prop) {",
		"      if (prop === \"then\" || prop === \"__mf_is_external_runtime_core_export\") {",
		"        return prop === \"__mf_is_external_runtime_core_export\";",
		"      }",
		"      const mod = globalThis._FEDERATION_RUNTIME_CORE;",
		"      if (!mod) return false;",
		"      return prop in Object(mod[exportName]);",
		"    },",
		"    ownKeys() {",
		"      const mod = globalThis._FEDERATION_RUNTIME_CORE;",
		"      if (!mod) return [];",
		"      return Reflect.ownKeys(Object(mod[exportName]));",
		"    },",
		"    getOwnPropertyDescriptor(_target, prop) {",
		"      if (prop === \"then\") return undefined;",
		"      const mod = globalThis._FEDERATION_RUNTIME_CORE;",
		"      if (!mod) return undefined;",
		"      return Object.getOwnPropertyDescriptor(Object(mod[exportName]), prop);",
		"    },",
		"    apply(_target, thisArg, args) {",
		"      return Reflect.apply(__mfGetExternalRuntimeCore()[exportName], thisArg, args);",
		"    },",
		"    construct(_target, args) {",
		"      const Ctor = __mfGetExternalRuntimeCore()[exportName];",
		"      return new Ctor(...args);",
		"    },",
		"  });",
		"}",
		"function __mfCreateLazyRuntimeCoreObject(exportName) {",
		"  return new Proxy(Object.create(null), {",
		"    get(_target, prop) {",
		"      if (prop === \"__mf_is_external_runtime_core_export\") return true;",
		"      if (prop === \"then\") return undefined;",
		"      const value = __mfGetExternalRuntimeCore()[exportName];",
		"      const inner = Reflect.get(value, prop, value);",
		"      return typeof inner === \"function\" ? inner.bind(value) : inner;",
		"    },",
		"    set(_target, prop, nextValue) {",
		"      __mfGetExternalRuntimeCore()[exportName][prop] = nextValue;",
		"      return true;",
		"    },",
		"    has(_target, prop) {",
		"      if (prop === \"then\" || prop === \"__mf_is_external_runtime_core_export\") {",
		"        return prop === \"__mf_is_external_runtime_core_export\";",
		"      }",
		"      const mod = globalThis._FEDERATION_RUNTIME_CORE;",
		"      return !!mod && prop in Object(mod[exportName]);",
		"    },",
		"    ownKeys() {",
		"      const mod = globalThis._FEDERATION_RUNTIME_CORE;",
		"      return mod ? Reflect.ownKeys(Object(mod[exportName])) : [];",
		"    },",
		"    getOwnPropertyDescriptor(_target, prop) {",
		"      if (prop === \"then\") return undefined;",
		"      const mod = globalThis._FEDERATION_RUNTIME_CORE;",
		"      if (!mod) return undefined;",
		"      const descriptor = Object.getOwnPropertyDescriptor(Object(mod[exportName]), prop);",
		"      return descriptor && { ...descriptor, configurable: true };",
		"    },",
		"  });",
		"}",
		"export default /*#__PURE__*/ new Proxy(Object.create(null), {",
		"  get(_target, prop) {",
		"    if (prop === \"__esModule\") return true;",
		"    if (prop === \"then\") return undefined;",
		"    const mod = __mfGetExternalRuntimeCore();",
		"    const resolved = mod.default ?? mod;",
		"    const value = resolved[prop];",
		"    return typeof value === \"function\" ? value.bind(resolved) : value;",
		"  },",
		"  has(_target, prop) {",
		"    if (prop === \"then\") return false;",
		"    if (prop === \"__esModule\") return true;",
		"    const mod = globalThis._FEDERATION_RUNTIME_CORE;",
		"    if (!mod) return false;",
		"    const resolved = mod.default ?? mod;",
		"    return prop in Object(resolved);",
		"  },",
		"});",
		exportShapes.map(({ name, callable }) => `export const ${name} = /*#__PURE__*/ ${callable ? "__mfCreateLazyRuntimeCoreFunction" : "__mfCreateLazyRuntimeCoreObject"}(${JSON.stringify(name)});`).join("\n")
	].filter(Boolean).join("\n")}\n`;
}
let cachedExportShapes;
async function importRuntimeCoreForIntrospection(packageName) {
	try {
		return await import(pathToFileURL$1(resolveImportPath(packageName)).href);
	} catch {
		return await import(packageName);
	}
}
async function resolveRuntimeCoreExportShapes() {
	if (cachedExportShapes) return cachedExportShapes;
	try {
		cachedExportShapes = collectRuntimeCoreExportShapes(await importRuntimeCoreForIntrospection(RUNTIME_CORE_INTROSPECT_PACKAGE));
	} catch {
		try {
			cachedExportShapes = collectRuntimeCoreExportShapes(await importRuntimeCoreForIntrospection(RUNTIME_CORE_PACKAGE));
		} catch {
			cachedExportShapes = [];
		}
	}
	return cachedExportShapes;
}
/**
* Replaces `@module-federation/runtime-core` with a virtual module that reads
* `globalThis._FEDERATION_RUNTIME_CORE` (webpack/Rspack `externalRuntime` parity).
*/
function pluginExternalRuntimeCore() {
	let shimCodePromise;
	const getShimCode = () => {
		if (!shimCodePromise) shimCodePromise = resolveRuntimeCoreExportShapes().then((shapes) => {
			if (shapes.length === 0) throw createModuleFederationError(`Unable to introspect exports from ${RUNTIME_CORE_INTROSPECT_PACKAGE} for experiments.externalRuntime.`);
			return buildExternalRuntimeCoreShimCode(shapes);
		});
		return shimCodePromise;
	};
	return {
		name: "module-federation-external-runtime-core",
		enforce: "pre",
		config(config) {
			config.optimizeDeps ??= {};
			config.optimizeDeps.exclude ??= [];
			if (!config.optimizeDeps.exclude.includes("@module-federation/runtime-core")) config.optimizeDeps.exclude.push(RUNTIME_CORE_PACKAGE);
			if (Array.isArray(config.optimizeDeps.include)) config.optimizeDeps.include = config.optimizeDeps.include.filter((dep) => dep !== "@module-federation/runtime-core" && !String(dep).startsWith(`@module-federation/runtime-core/`));
		},
		resolveId(source, importer) {
			if (!isRuntimeCoreId(source)) return;
			if (isSsrRemoteRuntimeImporter(importer)) return;
			return EXTERNAL_RUNTIME_CORE_VIRTUAL_ID;
		},
		async load(id) {
			if (id !== "\0virtual:mf-external-runtime-core") return;
			return getShimCode();
		}
	};
}
//#endregion
//#region package.json
var version$1 = "1.21.6";
//#endregion
//#region src/virtualModules/index.ts
function initVirtualModules(command, remoteEntryId, enableSsrInit = false, options) {
	writeLocalSharedImportMap(options);
	writeHostAutoInit(remoteEntryId, command, options);
	writeRuntimeInitStatus(command, enableSsrInit, getHostAutoInitPath(options), options, options ? getSsrRuntimeRemotes(options.remotes, options) : void 0);
}
//#endregion
//#region src/utils/cssModuleHelpers.ts
const ASSET_TYPES = ["js", "css"];
const LOAD_TIMINGS = ["sync", "async"];
const JS_EXTENSIONS = [
	".ts",
	".tsx",
	".jsx",
	".mjs",
	".cjs"
];
/**
* Creates an empty asset map structure for tracking JS and CSS assets
* @returns Initialized asset map with sync/async arrays for JS and CSS
*/
const createEmptyAssetMap = () => ({
	js: {
		sync: [],
		async: []
	},
	css: {
		sync: [],
		async: []
	}
});
/**
* Tracks an asset in the preload map with deduplication
* @param map - The preload map to update
* @param key - The module key to track under
* @param fileName - The asset filename to track
* @param isAsync - Whether the asset is loaded async
* @param type - The asset type ('js' or 'css')
*/
const trackAsset = (map, key, fileName, isAsync, type) => {
	if (!map[key]) map[key] = createEmptyAssetMap();
	const target = isAsync ? map[key][type].async : map[key][type].sync;
	if (!target.includes(fileName)) target.push(fileName);
};
/**
* Checks if a file is a CSS file by extension
* @param fileName - The filename to check
* @returns True if file has a CSS extension (.css, .scss, .less)
*/
const isCSSFile = (fileName) => {
	return fileName.endsWith(".css") || fileName.endsWith(".scss") || fileName.endsWith(".less");
};
/**
* Collects all CSS assets from the bundle
* @param bundle - The Rollup output bundle
* @returns Set of CSS asset filenames
*/
const collectCssAssets = (bundle) => {
	const cssAssets = /* @__PURE__ */ new Set();
	for (const [fileName, fileData] of Object.entries(bundle)) if (fileData.type === "asset" && isCSSFile(fileName)) cssAssets.add(fileName);
	return cssAssets;
};
/**
* Checks if a chunk contains CSS modules (e.g. .css, .vanilla.css, .scss, .less)
* by scanning its module list
*/
const chunkContainsCssModules = (modules) => {
	for (const modulePath of Object.keys(modules)) if (isCSSFile(modulePath)) return true;
	return false;
};
const collectStaticChunks = (bundle, roots) => {
	const chunks = [];
	const visited = /* @__PURE__ */ new Set();
	const queue = [...roots];
	for (let queueIndex = 0; queueIndex < queue.length; queueIndex++) {
		const fileName = queue[queueIndex];
		if (visited.has(fileName)) continue;
		visited.add(fileName);
		const chunk = bundle[fileName];
		if (!chunk || chunk.type !== "chunk") continue;
		chunks.push(chunk);
		queue.push(...chunk.imports ?? []);
	}
	return chunks;
};
/**
* Analyzes assets associated with a chunk without mutating the output map.
* The static-import traversal is cycle-safe and ignores missing bundle entries.
*/
const analyzeChunkAssets = (bundle, fileName, chunk) => {
	const dynamicAssets = [];
	for (const currentChunk of collectStaticChunks(bundle, [fileName])) for (const dynamicImport of currentChunk.dynamicImports ?? []) {
		if (!bundle[dynamicImport]) continue;
		dynamicAssets.push({
			fileName: dynamicImport,
			type: isCSSFile(dynamicImport) ? "css" : "js"
		});
	}
	return {
		importedCss: Array.from(chunk.viteMetadata?.importedCss ?? []),
		containsCssModules: chunkContainsCssModules(chunk.modules),
		dynamicAssets
	};
};
/**
* Processes module assets and tracks them in the files map
* @param bundle - The Rollup output bundle
* @param filesMap - The preload map to populate
* @param moduleMatcher - Function that matches module paths to keys
*/
const processModuleAssets = (bundle, filesMap, moduleMatcher, options = {}) => {
	const bundleCssAssets = collectCssAssets(bundle);
	const chunkAnalysisCache = /* @__PURE__ */ new Map();
	for (const [fileName, fileData] of Object.entries(bundle)) {
		if (fileData.type !== "chunk") continue;
		if (!fileData.modules) continue;
		for (const modulePath of Object.keys(fileData.modules)) {
			const comparableModulePath = options.root ? path$1.resolve(options.root, modulePath) : modulePath;
			const comparableModulePaths = [comparableModulePath];
			if (options.stripKnownJsExtensions) {
				const ext = path$1.extname(comparableModulePath);
				if (JS_EXTENSIONS.includes(ext)) comparableModulePaths.push(path$1.join(path$1.dirname(comparableModulePath), path$1.basename(comparableModulePath, ext)));
			}
			const matchKey = comparableModulePaths.map(moduleMatcher).find(Boolean);
			if (!matchKey) continue;
			let analysis = chunkAnalysisCache.get(fileName);
			if (!analysis) {
				analysis = analyzeChunkAssets(bundle, fileName, fileData);
				chunkAnalysisCache.set(fileName, analysis);
			}
			trackAsset(filesMap, matchKey, fileName, false, "js");
			let foundCssViaMetadata = false;
			for (const cssFile of analysis.importedCss) {
				trackAsset(filesMap, matchKey, cssFile, false, "css");
				foundCssViaMetadata = true;
			}
			if (!foundCssViaMetadata && analysis.containsCssModules) for (const cssAsset of Array.from(bundleCssAssets)) trackAsset(filesMap, matchKey, cssAsset, false, "css");
			for (const asset of analysis.dynamicAssets) trackAsset(filesMap, matchKey, asset.fileName, true, asset.type);
		}
	}
};
/**
* Adds global CSS assets to all module exports
* @param filesMap - The preload map to update
* @param cssAssets - Set of CSS asset filenames to add
*/
const addCssAssetsToAllExports = (filesMap, cssAssets) => {
	Object.keys(filesMap).forEach((key) => {
		cssAssets.forEach((cssAsset) => {
			trackAsset(filesMap, key, cssAsset, false, "css");
		});
	});
};
/**
* Deduplicates assets in the files map
* @param filesMap - The preload map to deduplicate
* @returns New deduplicated preload map
*/
const deduplicateAssets = (filesMap) => {
	const result = {};
	for (const [key, assetMaps] of Object.entries(filesMap)) {
		result[key] = createEmptyAssetMap();
		for (const type of ASSET_TYPES) for (const timing of LOAD_TIMINGS) result[key][type][timing] = Array.from(new Set(assetMaps[type][timing]));
	}
	return result;
};
/**
* Builds a mapping between module files and their share keys
* @param shareKeys - Set of share keys to map
* @param resolveFn - Function to resolve module paths
* @returns Map of file paths to their corresponding share keys
*/
const buildFileToShareKeyMap = async (shareKeys, resolveFn, options) => {
	const fileToShareKey = /* @__PURE__ */ new Map();
	const resolutions = await Promise.all(Array.from(shareKeys).map((shareKey) => resolveFn(getPreBuildLibImportId(shareKey, options)).then((resolution) => ({
		shareKey,
		file: resolution?.id?.split("?")[0]
	})).catch(() => null)));
	for (const resolution of resolutions) if (resolution?.file) fileToShareKey.set(resolution.file, resolution.shareKey);
	return fileToShareKey;
};
//#endregion
//#region src/virtualModules/virtualExposesSSR.ts
/**
* Virtual module ID for the SSR exposes map.
* Separate from the browser exposes: no CSS injection, no document references,
* and shared packages are imported as bare specifiers (externals in the SSR build).
*/
function getVirtualExposesSSRId(options) {
	return `virtual:mf-exposes-ssr:${getVirtualModuleScopeKey(options)}`;
}
/**
* Generates the SSR exposes map module.
*
* Differences from the browser version (virtualExposes.ts):
* - No CSS asset injection (document APIs unavailable on Node)
* - Shared packages (react, react-dom, etc.) must be externals in the SSR
*   build so Node resolves them via its own module cache — this is what
*   guarantees the React singleton is shared with react-dom/server.
*/
function generateExposesSSR(options, reactIslandExposes = /* @__PURE__ */ new Set()) {
	return `
    export default {
    ${Object.keys(options.exposes).map((key) => {
		return `
        ${JSON.stringify(key)}: async () => {
          const importModule = await import(${JSON.stringify(options.exposes[key].import)})
          const exportModule = {}
          Object.assign(exportModule, importModule)
          ${generateReactIslandSSRDefinition(reactIslandExposes.has(key))}
          Object.defineProperty(exportModule, "__esModule", {
            value: true,
            enumerable: false
          })
          return exportModule
        }
      `;
	}).join(",")}
  }
  `;
}
//#endregion
//#region src/virtualModules/virtualRemoteEntrySSR.ts
const REMOTE_ENTRY_SSR_ID = "virtual:mf-REMOTE_ENTRY_SSR_ID";
function getRemoteEntrySSRId(options) {
	return `${REMOTE_ENTRY_SSR_ID}:${getVirtualModuleScopeKey(options)}`;
}
const FILE_EXTENSION_RE = /\.[^.]+$/;
function getSsrFileNameParts(browserFilename) {
	const filename = resolveHashPlaceholderFileName(browserFilename);
	const ext = FILE_EXTENSION_RE.exec(filename)?.[0];
	return {
		base: ext ? filename.slice(0, filename.length - ext.length) : filename,
		ext
	};
}
function getSsrRemoteEntryFileName(browserFilename) {
	const { base, ext } = getSsrFileNameParts(browserFilename);
	return `${base}.ssr${ext ?? ".js"}`;
}
function getSsrExposesFileName(browserFilename) {
	const { base } = getSsrFileNameParts(browserFilename);
	return `${base}.exposes.js`;
}
/** Singleton map for SSR loadShare: expand `pkg/` via usedShares; never serialize the prefix. */
function getSsrSharedSingletons(options) {
	const used = getUsedShares(options);
	const result = {};
	for (const [pkg, share] of Object.entries(options.shared)) {
		if (!share.shareConfig.singleton) continue;
		if (pkg.endsWith("/")) {
			for (const concrete of expandSharedPrefixKey(pkg, used)) result[concrete] = {
				...share,
				name: concrete
			};
			continue;
		}
		result[pkg] = share;
	}
	return result;
}
/**
* Generates the SSR remote entry module.
*
* This is intentionally minimal — no HMR shim, no loadShare virtual modules,
* no browser globals. Shared packages (react, react-dom, etc.) are imported
* as externals by the SSR build, so Node's require cache provides the singleton.
*
* The container API (init / get) mirrors the browser entry so the MF runtime
* can call it the same way on the server.
*/
function generateRemoteEntrySSR(options) {
	const virtualExposesSSRId = getVirtualExposesSSRId(options);
	const sharedSingletons = getSsrSharedSingletons(options);
	return `
  import { init as runtimeInit } from "@module-federation/runtime";

  const sharedSingletons = ${JSON.stringify(sharedSingletons)};
  const moduleCacheKey = Symbol.for(${JSON.stringify(MODULE_CACHE_SHARE_SCOPE_KEY)});
  let exposesMapPromise;

  function createShareInitError(errors) {
    const details = errors.map(({ scopeName, pkg, error }) => {
      const target = pkg
        ? \`scope "\${scopeName}" package "\${pkg}"\`
        : \`scope "\${scopeName}"\`;
      return \`\${target}: \${error instanceof Error ? error.message : String(error)}\`;
    });
    const message = \`[Module Federation SSR] Shared initialization failed: \${details.join('; ')}\`;
    return new AggregateError(errors.map(({ error }) => error), message);
  }

  async function getExposesMap() {
    exposesMapPromise ??= import(${JSON.stringify(virtualExposesSSRId)}).then((mod) => mod.default ?? mod);
    return exposesMapPromise;
  }

  /**
   * Called by the MF runtime on the host to register this remote's share scope.
   * On the server the host has already initialised the runtime, so we just need
   * to set up a minimal runtime instance for the remote container.
   */
  async function init(shared = {}, initScope = []) {
    const initRes = runtimeInit({
      name: ${JSON.stringify(options.name)},
      remotes: [],
      shared: {},
    });
    const initToken = { from: ${JSON.stringify(options.name)} };
    if (initScope.indexOf(initToken) >= 0) return;
    initScope.push(initToken);
    const shareScopeNames = Array.isArray(${JSON.stringify(options.shareScope)})
      ? ${JSON.stringify(options.shareScope)}
      : [${JSON.stringify(options.shareScope)}];
    const shareInitErrors = [];
    const cacheEntries = [];
    for (const scopeName of shareScopeNames) {
      let scopeShare;
      try {
        scopeShare = Array.isArray(${JSON.stringify(options.shareScope)})
          ? shared?.[scopeName] || {}
          : shared || {};
        initRes.initShareScopeMap(scopeName, scopeShare);
        await Promise.all(
          await initRes.initializeSharing(scopeName, {
            strategy: ${JSON.stringify(options.shareStrategy ?? "version-first")},
            from: 'build',
            initScope,
          })
        );
      } catch (e) {
        shareInitErrors.push({ scopeName, pkg: undefined, error: e });
        continue;
      }

      for (const [pkg, shareInfo] of Object.entries(sharedSingletons)) {
        try {
          if (shareInfo.scope !== scopeName) continue;
          if (!scopeShare[pkg]) continue;
          const factory = await initRes.loadShare(pkg, {
            customShareInfo: { ...shareInfo, scope: [scopeName] },
          });
          if (typeof factory !== 'function') {
            throw new Error('No compatible host provider was selected');
          }
          const module = await factory();
          cacheEntries.push({ scopeName, pkg, module });
        } catch (e) {
          shareInitErrors.push({ scopeName, pkg, error: e });
        }
      }
    }
    if (shareInitErrors.length > 0) {
      throw createShareInitError(shareInitErrors);
    }
    if (cacheEntries.length > 0) {
      const moduleCache = shared?.[moduleCacheKey] ||
        (globalThis.__mf_module_cache__ ||= { share: {}, remote: {} });
      const cache = (moduleCache.share ||= {});
      for (const { scopeName, pkg, module } of cacheEntries) {
        cache[scopeName + ':' + pkg] ??= module;
        if (scopeName === 'default') cache[pkg] ??= module;
      }
    }
    return initRes;
  }

  async function getExposes(moduleName) {
    const exposesMap = await getExposesMap();
    if (!(moduleName in exposesMap))
      throw new Error(\`[Module Federation] Module \${moduleName} does not exist in container.\`);
    return exposesMap[moduleName]().then((res) => () => res);
  }

  export { init, getExposes as get };
  `;
}
//#endregion
//#region src/plugins/pluginMFManifest.ts
/**
* Resolves the build version for the module federation manifest.
*
* Priority:
* 1. `MF_BUILD_VERSION` environment variable (set by CI or manually)
* 2. Falls back to `'1.0.0'` to preserve backward compatibility
*
* This mirrors the behavior of the webpack/rspack plugins via
* `getBuildVersion()` from `@module-federation/managers`.
*/
function getBuildVersion() {
	return process.env["MF_BUILD_VERSION"] ?? "1.0.0";
}
/**
* Builds the manifest `metaData.types` entry.
*
* When type generation is enabled, the dts plugin serves the type archive
* (`<typesFolder>.zip`) and api file (`<typesFolder>.d.ts`). Consumers using
* `@module-federation/dts-plugin` read `metaData.types.zip` to download those
* types and throw `Can not get <remote>'s types archive url!` when it is absent.
* Advertising the relative paths here (resolved against `publicPath` by the
* consumer) mirrors the webpack/rspack (`@module-federation/enhanced`) plugins.
*/
function resolveTypesMeta(dts) {
	if (dts === false) return {
		path: "",
		name: ""
	};
	const generateTypes = typeof dts === "object" && dts ? dts.generateTypes : void 0;
	if (generateTypes === false) return {
		path: "",
		name: ""
	};
	const typesFolder = typeof generateTypes === "object" && generateTypes?.typesFolder || "@mf-types";
	return {
		path: "",
		name: "",
		zip: `${typesFolder}.zip`,
		api: `${typesFolder}.d.ts`
	};
}
function createRemoteEntryAssetMap(fileName) {
	return {
		js: {
			async: [],
			sync: [fileName]
		},
		css: {
			async: [],
			sync: []
		}
	};
}
function isTreeShakingProviderChunk(file) {
	if (file.type !== "chunk") return false;
	if (file.facadeModuleId?.includes("__treeShakingProvider__")) return true;
	return Object.keys(file.modules || {}).some((id) => id.includes("__treeShakingProvider__") || id.includes("__mf_tree_shaking_graph__"));
}
function isContainerBootstrapChunk(chunk, moduleIds) {
	return [chunk.facadeModuleId, ...chunk.moduleIds ?? []].some((id) => typeof id === "string" && moduleIds.has(normalizeVirtualModuleId(id)));
}
function collectImportedCss(chunks) {
	const css = /* @__PURE__ */ new Set();
	for (const chunk of chunks) for (const cssFile of chunk.viteMetadata?.importedCss ?? []) css.add(cssFile);
	return Array.from(css);
}
function expandExposeAssets(filesMap, exposeModules, bundle, remoteEntryFileName, options) {
	if (exposeModules.length === 0) return;
	const containerChunks = remoteEntryFileName ? collectStaticChunks(bundle, [remoteEntryFileName]) : [];
	const bootstrapChunks = containerChunks.slice(1);
	const seen = new Set(containerChunks.map((chunk) => chunk.fileName));
	if (containerChunks.length > 0) {
		const bootstrapModuleIds = /* @__PURE__ */ new Set([getLocalSharedImportMapPath(options), getVirtualExposesId(options)]);
		for (const containerChunk of containerChunks) for (const imported of containerChunk.dynamicImports ?? []) {
			const importedChunk = bundle[imported];
			if (!importedChunk || importedChunk.type !== "chunk" || !isContainerBootstrapChunk(importedChunk, bootstrapModuleIds)) continue;
			for (const chunk of collectStaticChunks(bundle, [imported])) {
				if (seen.has(chunk.fileName)) continue;
				seen.add(chunk.fileName);
				bootstrapChunks.push(chunk);
			}
		}
	}
	const bootstrapAssets = bootstrapChunks.map((chunk) => chunk.fileName);
	const bootstrapCss = collectImportedCss(bootstrapChunks);
	for (const exposeModule of exposeModules) {
		const assets = filesMap[exposeModule];
		if (!assets) continue;
		const syncChunks = collectStaticChunks(bundle, assets.js.sync);
		const sync = Array.from(/* @__PURE__ */ new Set([...bootstrapAssets, ...syncChunks.map((chunk) => chunk.fileName)]));
		const syncSet = new Set(sync);
		const asyncChunks = collectStaticChunks(bundle, assets.js.async);
		const async = asyncChunks.map((chunk) => chunk.fileName).filter((fileName) => !syncSet.has(fileName));
		assets.js.sync = sync;
		assets.js.async = async;
		const syncCss = Array.from(/* @__PURE__ */ new Set([
			...assets.css.sync,
			...bootstrapCss,
			...collectImportedCss(syncChunks)
		]));
		const syncCssSet = new Set(syncCss);
		const asyncCss = Array.from(/* @__PURE__ */ new Set([...assets.css.async, ...collectImportedCss(asyncChunks)])).filter((fileName) => !syncCssSet.has(fileName));
		assets.css.sync = syncCss;
		assets.css.async = asyncCss;
	}
}
function getTreeShakingBuildInfo(options) {
	if (!(Object.values(options.shared || {}).some((share) => !!share.shareConfig.treeShaking) || !!options.treeShakingSharedPlugins?.length || !!options.treeShakingSharedExcludePlugins?.length)) return {};
	return {
		target: [options.target || "web"],
		...options.treeShakingSharedPlugins?.length ? { plugins: [...options.treeShakingSharedPlugins] } : {},
		...options.treeShakingSharedExcludePlugins?.length ? { excludePlugins: [...options.treeShakingSharedExcludePlugins] } : {}
	};
}
function getRemoteContainerName(remoteKey, remote) {
	const entryGlobalName = remote.entryGlobalName;
	if (entryGlobalName && entryGlobalName !== remoteKey && entryGlobalName !== remote.entry) return entryGlobalName;
	return remote.name;
}
const Manifest = (providedOptions) => {
	const mfOptions = providedOptions ?? getNormalizeModuleFederationOptions();
	const { name, filename, getPublicPath, manifest: manifestOptions, varFilename } = mfOptions;
	let mfManifestName = manifestOptions === true ? "mf-manifest.json" : typeof manifestOptions === "object" ? normalizePathForImport(path$1.join(manifestOptions?.filePath || "", manifestOptions?.fileName || "mf-manifest.json")) : void 0;
	let mfManifestStatsName = mfManifestName ? getStatsFileName(mfManifestName) : void 0;
	const isConsumerProject = Object.keys(mfOptions.exposes).length === 0;
	let disableAssetsAnalyze = false;
	const getDefaultDisableAssetsAnalyze = (command) => command === "serve" && isConsumerProject && (typeof manifestOptions !== "object" || !Object.hasOwn(manifestOptions, "disableAssetsAnalyze"));
	const getConfiguredDisableAssetsAnalyze = (command) => {
		if (typeof manifestOptions === "object" && manifestOptions !== null) {
			if (Object.hasOwn(manifestOptions, "disableAssetsAnalyze")) return manifestOptions.disableAssetsAnalyze === true;
		}
		return getDefaultDisableAssetsAnalyze(command);
	};
	let root;
	let remoteEntryFile;
	let ssrRemoteEntryFile;
	let publicPath;
	let _command;
	let _originalConfigBase;
	let viteConfig;
	return [{
		name: "module-federation-manifest",
		apply: "serve",
		/**
		* Stores resolved Vite config for later use
		*/
		/**
		* Finalizes configuration after all plugins are resolved
		* @param config - Fully resolved Vite config
		*/
		configResolved(config) {
			viteConfig = config;
		},
		/**
		* Configures dev server middleware to handle manifest requests
		* @param server - Vite dev server instance
		*/
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const devRemoteEntryFile = resolveHashPlaceholderFileName(filename);
				if (devRemoteEntryFile !== filename && Object.keys(mfOptions.exposes).length > 0 && req.url?.startsWith((viteConfig.base + devRemoteEntryFile).replace(/^\/?/, "/"))) {
					req.url = req.url.replace(devRemoteEntryFile, filename);
					next();
					return;
				}
				if (!mfManifestName) {
					next();
					return;
				}
				if (req.url?.replace(/\?.*/, "") === (viteConfig.base + mfManifestName).replace(/^\/?/, "/")) {
					res.setHeader("Content-Type", "application/json");
					res.setHeader("Access-Control-Allow-Origin", "*");
					(async () => {
						const manifest = await applyManifestAdditionalData({
							...generateMFManifest({}, disableAssetsAnalyze),
							id: name,
							name,
							metaData: {
								name,
								type: "app",
								buildInfo: {
									buildVersion: getBuildVersion(),
									buildName: name,
									...getTreeShakingBuildInfo(mfOptions)
								},
								remoteEntry: {
									name: devRemoteEntryFile,
									path: "",
									type: "module"
								},
								ssrRemoteEntry: {
									name: getSsrRemoteEntryFileName(devRemoteEntryFile),
									path: "/__mf_ssr__/",
									type: "module"
								},
								varRemoteEntry: varFilename ? {
									name: varFilename,
									path: "",
									type: "var"
								} : void 0,
								types: resolveTypesMeta(mfOptions.dts),
								globalName: name,
								pluginVersion: version$1,
								publicPath
							}
						});
						res.end(JSON.stringify(manifest));
					})().catch(next);
				} else next();
			});
		}
	}, {
		name: "module-federation-manifest",
		enforce: "post",
		/**
		* Initial plugin configuration
		* @param config - Vite config object
		* @param command - Current Vite command (serve/build)
		*/
		config(config, { command }) {
			_command = command;
			if (!config.build) config.build = {};
			if (!config.build.manifest) config.build.manifest = config.build.manifest || !!mfManifestName;
			disableAssetsAnalyze = getConfiguredDisableAssetsAnalyze(command);
			_originalConfigBase = config.base;
		},
		configResolved(config) {
			viteConfig = config;
			root = config.root;
			let base = config.base;
			if (_command === "serve") base = (config.server.origin || "") + config.base;
			publicPath = mfOptions.publicPath === "auto" ? "auto" : resolvePublicPath(mfOptions, base, _originalConfigBase);
		},
		/**
		* Generates the module federation manifest file
		* @param options - Rollup output options
		* @param bundle - Generated bundle assets
		*/
		async generateBundle(_options, bundle) {
			if (!mfManifestName) return;
			if (this.environment?.name === "ssr") return;
			let filesMap = {};
			const foundRemoteEntryFile = findRemoteEntryFile(mfOptions.filename, bundle);
			const expectedSsrRemoteEntryFile = getSsrRemoteEntryFileName(mfOptions.filename);
			const foundSsrRemoteEntryFile = Object.values(bundle).find((file) => file.fileName === expectedSsrRemoteEntryFile)?.fileName;
			if (foundRemoteEntryFile) remoteEntryFile = foundRemoteEntryFile;
			ssrRemoteEntryFile = foundSsrRemoteEntryFile || (_command === "serve" ? getSsrRemoteEntryFileName(resolveHashPlaceholderFileName(mfOptions.filename)) : expectedSsrRemoteEntryFile);
			const allCssAssets = mfOptions.bundleAllCSS && !disableAssetsAnalyze ? collectCssAssets(bundle) : /* @__PURE__ */ new Set();
			if (allCssAssets.size > 0) {
				const secondaryCss = /* @__PURE__ */ new Set();
				const primaryCss = /* @__PURE__ */ new Set();
				for (const file of Object.values(bundle)) {
					if (file.type !== "chunk") continue;
					const target = isTreeShakingProviderChunk(file) ? secondaryCss : primaryCss;
					for (const css of file.viteMetadata?.importedCss || []) target.add(css);
				}
				for (const css of secondaryCss) if (!primaryCss.has(css)) allCssAssets.delete(css);
			}
			if (!disableAssetsAnalyze) {
				const exposesModules = Object.keys(mfOptions.exposes).map((item) => mfOptions.exposes[item].import);
				processModuleAssets(bundle, filesMap, (modulePath) => {
					return exposesModules.find((exposeModule) => {
						return modulePath === path$1.resolve(root, exposeModule);
					});
				}, {
					root,
					stripKnownJsExtensions: true
				});
				expandExposeAssets(filesMap, exposesModules, bundle, foundRemoteEntryFile, mfOptions);
				const fileToShareKey = await buildFileToShareKeyMap(getUsedShares(mfOptions), this.resolve.bind(this), mfOptions);
				processModuleAssets(Object.fromEntries(Object.entries(bundle).filter(([, file]) => !isTreeShakingProviderChunk(file))), filesMap, (modulePath) => fileToShareKey.get(modulePath));
				for (const shareKey of getUsedShares(mfOptions)) {
					const shareItem = getNormalizeShareItem(shareKey, mfOptions);
					const assets = filesMap[shareKey];
					if (!assets || shareItem?.shareConfig.eager === true) continue;
					assets.js.async.push(...assets.js.sync.splice(0));
					assets.css.async.push(...assets.css.sync.splice(0));
				}
				if (mfOptions.bundleAllCSS) addCssAssetsToAllExports(filesMap, allCssAssets);
				filesMap = deduplicateAssets(filesMap);
			}
			const manifest = await applyManifestAdditionalData(generateMFManifest(filesMap, disableAssetsAnalyze), void 0);
			this.emitFile({
				type: "asset",
				fileName: mfManifestName,
				source: JSON.stringify(manifest)
			});
			if (mfManifestStatsName) {
				const stats = await applyManifestAdditionalData(generateMFStats(manifest, filesMap, bundle, disableAssetsAnalyze), manifest);
				this.emitFile({
					type: "asset",
					fileName: mfManifestStatsName,
					source: JSON.stringify(stats)
				});
			}
		}
	}];
	/**
	* Generates the final manifest JSON structure
	* @param preloadMap - Map of module assets to include
	* @returns Complete manifest object
	*/
	function generateMFManifest(preloadMap, disableAssetsAnalyze = false) {
		const options = mfOptions;
		const { name, varFilename } = options;
		const resolvedRemoteEntryFile = _command === "serve" ? remoteEntryFile || resolveHashPlaceholderFileName(filename) : remoteEntryFile;
		const remoteEntry = {
			name: resolvedRemoteEntryFile,
			path: "",
			type: "module"
		};
		const ssrRemoteEntry = {
			name: ssrRemoteEntryFile || getSsrRemoteEntryFileName(_command === "serve" ? resolveHashPlaceholderFileName(filename) : filename),
			path: _command === "serve" ? "/__mf_ssr__/" : "",
			type: "module"
		};
		const varRemoteEntry = varFilename ? {
			name: varFilename,
			path: "",
			type: "var"
		} : void 0;
		const remotes = Array.from(Object.entries(getUsedRemotesMap(options))).flatMap(([remoteKey, modules]) => {
			const remote = options.remotes[remoteKey];
			return Array.from(modules).map((moduleKey) => ({
				federationContainerName: getRemoteContainerName(remoteKey, remote),
				moduleName: moduleKey.replace(remoteKey, "").replace("/", ""),
				alias: remoteKey,
				entry: "*"
			}));
		});
		const shared = Array.from(getUsedShares(options)).flatMap((shareKey) => {
			const shareItem = getNormalizeShareItem(shareKey, options);
			if (!shareItem) return [];
			const assets = preloadMap[shareKey] || (_command === "serve" && resolvedRemoteEntryFile ? createRemoteEntryAssetMap(resolvedRemoteEntryFile) : createEmptyAssetMap());
			const treeShakingUsage = getTreeShakingExportUsage(shareKey, shareItem, shareItem.name, options);
			const treeShakingUsedExports = treeShakingUsage?.kind === "exports" ? treeShakingUsage.usedExports : [];
			const treeShakingStatus = treeShakingUsage?.kind === "full" ? 0 : 1;
			return [{
				id: `${name}:${shareKey}`,
				name: shareKey,
				version: shareItem.version,
				singleton: shareItem.shareConfig.singleton,
				requiredVersion: shareItem.shareConfig.requiredVersion,
				...shareItem.shareConfig.treeShaking ? {
					usedExports: treeShakingUsedExports,
					referenceExports: treeShakingUsedExports,
					treeShaking: {
						mode: shareItem.shareConfig.treeShaking.mode,
						...treeShakingUsage?.kind === "exports" ? { usedExports: treeShakingUsedExports } : {},
						status: treeShakingStatus
					}
				} : {},
				assets: {
					js: {
						async: assets.js.async,
						sync: assets.js.sync
					},
					css: {
						async: assets.css.async,
						sync: assets.css.sync
					}
				}
			}];
		});
		const exposes = Object.entries(options.exposes).map(([key, value]) => {
			const formatKey = key.replace("./", "");
			const assets = preloadMap[value.import] || (_command === "serve" && resolvedRemoteEntryFile ? createRemoteEntryAssetMap(resolvedRemoteEntryFile) : createEmptyAssetMap());
			return {
				id: `${name}:${formatKey}`,
				name: formatKey,
				assets: {
					js: {
						async: assets.js.async,
						sync: assets.js.sync
					},
					css: {
						async: assets.css.async,
						sync: assets.css.sync
					}
				},
				path: key
			};
		});
		return {
			id: name,
			name,
			metaData: {
				name,
				type: "app",
				buildInfo: {
					buildVersion: getBuildVersion(),
					buildName: name,
					...getTreeShakingBuildInfo(options)
				},
				remoteEntry,
				ssrRemoteEntry,
				varRemoteEntry,
				types: resolveTypesMeta(options.dts),
				globalName: name,
				pluginVersion: version$1,
				...!!getPublicPath ? { getPublicPath } : { publicPath }
			},
			...disableAssetsAnalyze ? {} : { shared },
			remotes,
			...disableAssetsAnalyze ? {} : { exposes }
		};
	}
	function generateMFStats(manifest, preloadMap, bundle, disableAssetsAnalyze = false) {
		const bundleSummary = Object.entries(bundle).map(([fileName, chunkOrAsset]) => ({
			fileName,
			type: chunkOrAsset.type,
			isEntry: chunkOrAsset.isEntry || false,
			size: typeof chunkOrAsset.code === "string" ? chunkOrAsset.code.length : chunkOrAsset.source?.length || void 0
		}));
		return {
			...manifest,
			buildOutput: bundleSummary,
			...disableAssetsAnalyze ? {} : { assetAnalysis: preloadMap }
		};
	}
	async function applyManifestAdditionalData(stats, manifest) {
		if (typeof manifestOptions !== "object" || typeof manifestOptions.additionalData !== "function") return stats;
		return await manifestOptions.additionalData({
			stats,
			manifest,
			pluginOptions: mfOptions,
			compiler: void 0,
			compilation: void 0,
			bundler: "vite"
		}) || stats;
	}
};
function getStatsFileName(manifestFileName) {
	const parsed = path$1.parse(manifestFileName);
	const fileExt = parsed.ext || ".json";
	const baseName = parsed.ext ? parsed.name : parsed.base;
	const fileName = `${baseName === "mf-manifest" ? "mf" : baseName}-stats${fileExt}`;
	return parsed.dir ? normalizePathForImport(path$1.join(parsed.dir, fileName)) : fileName;
}
//#endregion
//#region src/plugins/pluginModuleParseEnd.ts
function createModuleParseController() {
	return {
		resolve: null,
		parseTimeout: null,
		settleTimeout: null,
		parsePromise: Promise.resolve({
			complete: false,
			reason: "initial"
		}),
		parseStartSet: /* @__PURE__ */ new Set(),
		parseEndSet: /* @__PURE__ */ new Set(),
		discardWarned: false,
		externalSet: /* @__PURE__ */ new Set(),
		resolutionProbed: /* @__PURE__ */ new Set(),
		lastLoadedModule: "",
		lastParsedModule: ""
	};
}
function clearParseTimeout(controller) {
	if (controller.parseTimeout) {
		clearTimeout(controller.parseTimeout);
		controller.parseTimeout = null;
	}
}
function clearSettleTimeout(controller) {
	if (controller.settleTimeout) {
		clearTimeout(controller.settleTimeout);
		controller.settleTimeout = null;
	}
}
function resetParseState(controller) {
	clearParseTimeout(controller);
	clearSettleTimeout(controller);
	controller.parseStartSet = /* @__PURE__ */ new Set();
	controller.parseEndSet = /* @__PURE__ */ new Set();
	controller.externalSet = /* @__PURE__ */ new Set();
	controller.resolutionProbed = /* @__PURE__ */ new Set();
	controller.discardWarned = false;
	controller.lastLoadedModule = "";
	controller.lastParsedModule = "";
	controller.parsePromise = new Promise((resolve) => {
		controller.resolve = (result) => {
			clearParseTimeout(controller);
			clearSettleTimeout(controller);
			resolve(result);
		};
	});
}
function setParseTimeout(controller, timeout) {
	if (!controller.parseTimeout) controller.parseTimeout = setTimeout(() => {
		mfWarn(`Parse timeout (${timeout}s) - forcing resolve`);
		controller.resolve?.({
			complete: false,
			reason: "timeout"
		});
	}, timeout * 1e3);
}
function resetIdleTimeout(controller, timeout) {
	clearParseTimeout(controller);
	controller.parseTimeout = setTimeout(() => {
		const pendingModules = Array.from(controller.parseStartSet).filter((moduleId) => !controller.parseEndSet.has(moduleId));
		mfWarn(`moduleParseIdleTimeout: no module activity for ${timeout}s, forcing resolve. Some shared/remote dependencies may be missing. Consider increasing moduleParseIdleTimeout. Tracked modules: ${controller.parseEndSet.size}/${controller.parseStartSet.size}.` + (controller.lastLoadedModule ? ` Last loaded: ${controller.lastLoadedModule}.` : "") + (controller.lastParsedModule ? ` Last parsed: ${controller.lastParsedModule}.` : "") + (pendingModules.length ? ` Pending modules: ${pendingModules.slice(0, 10).join(", ")}` : ""));
		controller.resolve?.({
			complete: false,
			reason: "idle-timeout"
		});
	}, timeout * 1e3);
}
function scheduleParseCompletionCheck(controller) {
	clearSettleTimeout(controller);
	controller.settleTimeout = setTimeout(() => {
		controller.settleTimeout = null;
		if (controller.parseStartSet.size > 0 && Array.from(controller.parseStartSet).every((moduleId) => controller.parseEndSet.has(moduleId))) controller.resolve?.({
			complete: true,
			reason: "graph-complete"
		});
	}, 10);
}
function matchesExternal(external, id, importer) {
	if (!external) return false;
	if (typeof external === "function") return external(id, importer, true) === true;
	return (Array.isArray(external) ? external : [external]).some((entry) => {
		if (typeof entry === "string") return entry === id;
		entry.lastIndex = 0;
		return entry.test(id);
	});
}
function getConfiguredInputImports(input) {
	if (typeof input === "string") return [input];
	if (Array.isArray(input)) return input.filter((entry) => typeof entry === "string");
	if (!input || typeof input !== "object") return [];
	return Object.values(input).filter((entry) => typeof entry === "string");
}
function pluginModuleParseEnd_default(excludeFn, options, controller = createModuleParseController()) {
	const idleTimeout = options.moduleParseIdleTimeout ?? options.moduleParseTimeout;
	let configuredInputImports = [];
	let configuredExternal;
	return [{
		enforce: "pre",
		name: "parseStart",
		apply: "build",
		configResolved(config) {
			const buildOptions = config.build;
			configuredInputImports = getConfiguredInputImports(buildOptions.rollupOptions.input ?? buildOptions.rolldownOptions?.input);
			configuredExternal = buildOptions.rollupOptions.external ?? buildOptions.rolldownOptions?.external;
		},
		async buildStart() {
			resetParseState(controller);
			if (idleTimeout) resetIdleTimeout(controller, idleTimeout);
			else if (options.moduleParseTimeout) setParseTimeout(controller, options.moduleParseTimeout);
			const entryImports = /* @__PURE__ */ new Set([...options.exposedModuleImports || [], ...configuredInputImports]);
			for (const importSource of entryImports) {
				const resolved = await this.resolve(importSource);
				if (resolved && !resolved.external && !excludeFn(resolved.id)) controller.parseStartSet.add(resolved.id);
			}
		},
		load(id) {
			controller.lastLoadedModule = id;
			if (excludeFn(id)) return;
			clearSettleTimeout(controller);
			if (idleTimeout) resetIdleTimeout(controller, idleTimeout);
			controller.parseStartSet.add(id);
		}
	}, {
		enforce: "post",
		name: "parseEnd",
		apply: "build",
		moduleParsed(module) {
			clearSettleTimeout(controller);
			const id = module.id;
			controller.lastParsedModule = id;
			if (idleTimeout) resetIdleTimeout(controller, idleTimeout);
			const parsedModule = module;
			const addPendingResolutions = (resolutions) => {
				for (const resolution of resolutions || []) if (!resolution.external && !excludeFn(resolution.id)) controller.parseStartSet.add(resolution.id);
			};
			const probeExternal = (pendingId) => {
				if (typeof this.resolve !== "function") return;
				if (controller.resolutionProbed.has(pendingId)) return;
				controller.resolutionProbed.add(pendingId);
				this.resolve(pendingId, id, { skipSelf: true }).then((resolved) => {
					if (!resolved?.external) return;
					controller.externalSet.add(pendingId);
					controller.parseStartSet.delete(pendingId);
					scheduleParseCompletionCheck(controller);
				}).catch(() => {});
			};
			const addPendingIds = (ids) => {
				for (const pendingId of ids || []) {
					if (!this.getModuleInfo(pendingId) || controller.externalSet.has(pendingId) || matchesExternal(configuredExternal, pendingId, id) || excludeFn(pendingId)) continue;
					controller.parseStartSet.add(pendingId);
					if (!controller.parseEndSet.has(pendingId)) probeExternal(pendingId);
				}
			};
			addPendingResolutions(parsedModule.importedIdResolutions);
			addPendingResolutions(parsedModule.dynamicallyImportedIdResolutions);
			if (parsedModule.importedIdResolutions === void 0) addPendingIds(module.importedIds);
			if (parsedModule.dynamicallyImportedIdResolutions === void 0) addPendingIds(module.dynamicallyImportedIds);
			if (!excludeFn(id)) controller.parseEndSet.add(id);
			scheduleParseCompletionCheck(controller);
		},
		buildEnd() {
			controller.resolve?.({
				complete: false,
				reason: "build-end"
			});
		}
	}];
}
//#endregion
//#region src/plugins/pluginProxyRemoteEntry.ts
function resolveAbsoluteDevRemoteEntryUrl(publicPath, fileName) {
	const base = new URL(publicPath);
	base.pathname = ensureTrailingSlash(base.pathname);
	return new URL(fileName, base).href;
}
function pluginProxyRemoteEntry_default({ options, remoteEntryId, virtualExposesId, getParsePromise = () => Promise.resolve() }) {
	let viteConfig, _command, root, originalConfigBase;
	let exposeRemoteDependencies = {};
	let exposeRemoteDependenciesDirty = true;
	let refreshPromise;
	let dependencyInvalidationVersion = 0;
	let reactIslandExposes = /* @__PURE__ */ new Set();
	const isHostAutoInitId = (id) => {
		const cleanId = id.split("?")[0];
		return cleanId.includes(getHostAutoInitPath(options)) || cleanId.includes(getHostAutoInitPath());
	};
	const getEnvironmentConditions = (context) => context.environment?.config?.resolve?.conditions;
	function isRemoteImport(source) {
		return Object.keys(options.remotes).some((name) => source === name || source.startsWith(name + "/"));
	}
	function collectImportSources(code) {
		const sources = /* @__PURE__ */ new Map();
		for (const { source, kind, syntax, typeOnly } of findModuleImportDescriptors(code)) {
			if (syntax !== "import" || typeOnly) continue;
			const dynamic = kind === "dynamic";
			sources.set(source, (sources.get(source) ?? true) && dynamic);
		}
		return Array.from(sources, ([source, dynamic]) => ({
			source,
			dynamic
		})).sort((a, b) => a.source.localeCompare(b.source));
	}
	function shouldScanResolvedImport(id) {
		if (!id || id.includes("\0")) return false;
		if (id.includes("/node_modules/") || id.includes("\\node_modules\\")) return false;
		return /\.(?:[cm]?[jt]sx?|vue|svelte)(?:\?|$)/.test(id);
	}
	async function collectRemoteDependencies(ctx, id, seen = /* @__PURE__ */ new Set()) {
		if (seen.has(id) || !shouldScanResolvedImport(id)) return [];
		seen.add(id);
		let code;
		try {
			code = getScannableModuleSource(id, readFileSync$1(id, "utf8"));
		} catch {
			return [];
		}
		const dependencies = /* @__PURE__ */ new Set();
		for (const { source, dynamic } of collectImportSources(code)) {
			if (isRemoteImport(source)) {
				if (!dynamic) dependencies.add(source);
				continue;
			}
			const resolved = await ctx.resolve(source, id);
			if (!resolved?.id || !shouldScanResolvedImport(resolved.id)) continue;
			for (const dependency of await collectRemoteDependencies(ctx, resolved.id, seen)) dependencies.add(dependency);
		}
		return Array.from(dependencies).sort();
	}
	async function refreshExposeRemoteDependencies(ctx) {
		if (!exposeRemoteDependenciesDirty) return;
		if (!refreshPromise) {
			const refreshVersion = dependencyInvalidationVersion;
			refreshPromise = (async () => {
				const next = {};
				for (const [exposeKey, expose] of Object.entries(options.exposes)) {
					const resolved = await ctx.resolve(expose.import);
					next[exposeKey] = resolved?.id ? await collectRemoteDependencies(ctx, resolved.id) : [];
				}
				exposeRemoteDependencies = next;
				if (refreshVersion === dependencyInvalidationVersion) exposeRemoteDependenciesDirty = false;
			})().finally(() => {
				refreshPromise = void 0;
			});
		}
		await refreshPromise;
	}
	function invalidateExposeRemoteDependencies() {
		exposeRemoteDependenciesDirty = true;
		dependencyInvalidationVersion += 1;
	}
	return {
		name: "proxyRemoteEntry",
		enforce: "post",
		configResolved(config) {
			viteConfig = config;
			root = config.root;
			reactIslandExposes = getReactIslandExposes(options, root);
		},
		config(config, { command }) {
			_command = command;
			originalConfigBase = config.base;
		},
		async buildStart() {
			await refreshExposeRemoteDependencies(this);
			if (_command !== "build" || hasPackageDependency("@tanstack/react-start", root)) return;
			for (const expose of Object.values(options.exposes)) {
				const resolved = await this.resolve(expose.import);
				if (resolved) this.emitFile({
					type: "chunk",
					id: resolved.id
				});
			}
		},
		watchChange() {
			invalidateExposeRemoteDependencies();
		},
		handleHotUpdate() {
			invalidateExposeRemoteDependencies();
		},
		async resolveId(id, importer) {
			if (id === remoteEntryId) return remoteEntryId;
			if (id === virtualExposesId) return virtualExposesId;
			if (_command === "serve" && isHostAutoInitId(id)) return id;
			if (importer === remoteEntryId && !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0") && !id.startsWith("virtual:")) {
				const importPath = typeof __filename === "string" ? __filename : fileURLToPath(import.meta.url);
				const resolved = await this.resolve(id, importPath, { skipSelf: true });
				if (resolved) return resolved;
			}
		},
		async load(id) {
			if (id === remoteEntryId) return getParsePromise().then((_) => generateRemoteEntry(options, virtualExposesId, _command, getEnvironmentConditions(this)));
			if (id === virtualExposesId) {
				await refreshExposeRemoteDependencies(this);
				return generateExposes(options, exposeRemoteDependencies, _command, reactIslandExposes);
			}
			if (_command === "serve" && isHostAutoInitId(id)) return id;
		},
		async transform(code, id) {
			return mapCodeToCodeWithSourcemap(await (async () => {
				if (!filterId(id)) return;
				if (id.includes(remoteEntryId)) return getParsePromise().then((_) => generateRemoteEntry(options, virtualExposesId, _command, getEnvironmentConditions(this)));
				if (id === virtualExposesId) {
					await refreshExposeRemoteDependencies(this);
					return generateExposes(options, exposeRemoteDependencies, _command, reactIslandExposes);
				}
				if (isHostAutoInitId(id)) {
					if (_command === "serve") {
						const host = formatDevServerHostForOrigin(viteConfig.server?.host);
						const resolvedPublicPath = resolvePublicPath(options, viteConfig.base, originalConfigBase);
						const devPublicPath = resolvedPublicPath === "auto" ? "/" : resolvedPublicPath;
						const remoteEntryFileName = resolveHashPlaceholderFileName(options.filename);
						const isAbsolutePublicPath = /^https?:\/\//i.test(devPublicPath);
						const remoteEntryUrl = JSON.stringify(isAbsolutePublicPath ? resolveAbsoluteDevRemoteEntryUrl(devPublicPath, remoteEntryFileName) : `${ensureTrailingSlash(devPublicPath)}${remoteEntryFileName}`);
						const fallbackOrigin = `//${host}:${viteConfig.server?.port}`;
						const ssrRemoteEntry = "data:text/javascript," + encodeURIComponent("export async function init(){return {loadRemote:async()=>({}),loadShare:async()=>({})}}");
						return `
          const origin = typeof window !== 'undefined' && (${!options.ignoreOrigin}) ? window.origin : ${JSON.stringify(fallbackOrigin)};
          const remoteEntryImport = typeof window !== 'undefined' ? ${isAbsolutePublicPath ? remoteEntryUrl : `origin + ${remoteEntryUrl}`} : ${JSON.stringify(ssrRemoteEntry)};
          ${generateHostAutoInitCode("remoteEntryImport", "serve", options, getEnvironmentConditions(this))}
        `;
					}
					return code;
				}
			})());
		},
		generateBundle(_, bundle) {
			if (_command !== "build") return;
			const filesMap = {};
			const exposeEntries = Object.entries(options.exposes);
			const allCssAssets = options.bundleAllCSS ? collectCssAssets(bundle) : /* @__PURE__ */ new Set();
			processModuleAssets(bundle, filesMap, (modulePath) => {
				return exposeEntries.find(([_, exposeOptions]) => {
					return modulePath === path$1.resolve(root, exposeOptions.import);
				})?.[1].import;
			}, {
				root,
				stripKnownJsExtensions: true
			});
			if (options.bundleAllCSS) addCssAssetsToAllExports(filesMap, allCssAssets);
			const ensureRelativeImportPath = (fromFile, toFile) => {
				let relativePath = normalizePathForImport(path$1.relative(path$1.dirname(fromFile), toFile));
				if (!relativePath.startsWith(".")) relativePath = `./${relativePath}`;
				return relativePath;
			};
			const placeholderValue = getExposesCssMapPlaceholder();
			const placeholderPatterns = [
				JSON.stringify(placeholderValue),
				`'${placeholderValue}'`,
				`\`${placeholderValue}\``
			];
			for (const file of Object.values(bundle)) {
				if (file.type !== "chunk" || !file.code.includes(placeholderValue)) continue;
				const cssAssetMap = exposeEntries.reduce((acc, [exposeKey, expose]) => {
					const assets = filesMap[expose.import] || createEmptyAssetMap();
					acc[exposeKey] = [...assets.css.sync, ...assets.css.async].map((cssAsset) => ensureRelativeImportPath(file.fileName, cssAsset));
					return acc;
				}, {});
				for (const placeholderPattern of placeholderPatterns) file.code = file.code.replace(placeholderPattern, JSON.stringify(cssAssetMap));
			}
		}
	};
}
//#endregion
//#region src/utils/remoteConsumerTarget.ts
function getPluginEnvironmentName(ctx) {
	if (ctx == null || typeof ctx !== "object") return void 0;
	const environment = ctx["environment"];
	if (environment == null || typeof environment !== "object") return void 0;
	const name = environment["name"];
	return typeof name === "string" ? name : void 0;
}
function resolveRemoteConsumer(ctx, hasMultiEnvironment) {
	if (!hasMultiEnvironment) return "unified";
	const envName = getPluginEnvironmentName(ctx);
	if (!envName || envName === "client") return "client";
	return "server";
}
//#endregion
//#region src/plugins/pluginProxyRemotes.ts
function isNodeModulesImporter(importer) {
	return importer?.includes("/node_modules/") || importer?.includes("\\node_modules\\");
}
function appendAlias(config, alias) {
	config.resolve ??= {};
	const existingAlias = config.resolve.alias;
	if (!existingAlias) {
		config.resolve.alias = [alias];
		return;
	}
	if (Array.isArray(existingAlias)) {
		existingAlias.push(alias);
		return;
	}
	config.resolve.alias = [...Object.entries(existingAlias).map(([find, replacement]) => ({
		find,
		replacement
	})), alias];
}
function pluginProxyRemotes_default(options) {
	let command;
	let root = process.cwd();
	let enableSsrInit = false;
	let hasMultiEnvironment = false;
	const { remotes } = options;
	function resolveRemoteId(pluginContext, source, importer, remoteName) {
		if (source === remoteName) {
			const installedPackageEntry = getInstalledPackageEntry(source, { cwd: root });
			if (installedPackageEntry && (importer === void 0 || isNodeModulesImporter(importer))) return installedPackageEntry;
		}
		const consumer = resolveRemoteConsumer(pluginContext, hasMultiEnvironment);
		const remoteModule = getRemoteVirtualModule(source, command, enableSsrInit, consumer, options);
		addUsedRemote(remoteName, source, options);
		refreshHostAutoInit(options);
		return remoteModule.getImportId();
	}
	return {
		name: "proxyRemotes",
		enforce: "pre",
		applyToEnvironment() {
			return true;
		},
		config(config, { command: _command }) {
			command = _command;
			root = config.root || process.cwd();
			Object.keys(remotes).forEach((remoteAlias) => {
				appendAlias(config, {
					find: new RegExp(`^(${escapeRegExp(remoteAlias)}(\/.*|$))`),
					replacement: "$1"
				});
			});
		},
		configResolved(config) {
			hasMultiEnvironment = Boolean(config.environments?.ssr);
			enableSsrInit = getSsrCapabilities(parseInt(version, 10), command, Object.keys(remotes).length > 0).enableSsrInitBootstrap;
		},
		resolveId(source, importer) {
			const resolvedIslandConsumerId = resolveReactIslandConsumerId(source);
			if (resolvedIslandConsumerId) return resolvedIslandConsumerId;
			const islandRemoteId = getReactIslandImportRemoteId(source);
			if (islandRemoteId) for (const remoteAlias of Object.keys(remotes)) {
				if (islandRemoteId !== remoteAlias && !islandRemoteId.startsWith(`${remoteAlias}/`)) continue;
				addUsedRemote(remoteAlias, islandRemoteId, options);
				refreshHostAutoInit(options);
				return `\0${getReactIslandServerImportId(islandRemoteId)}`;
			}
			if (!filterId(source)) return;
			for (const remoteAlias of Object.keys(remotes)) {
				if (source !== remoteAlias && !source.startsWith(`${remoteAlias}/`)) continue;
				return resolveRemoteId(this, source, importer, remoteAlias);
			}
		},
		load(id) {
			return loadReactIslandConsumerModule(id);
		}
	};
}
//#endregion
//#region src/utils/PromiseStore.ts
/**
* example:
* const store = new PromiseStore<number>();
* store.get("example").then((result) => {
*  console.log("Result from example:", result); // 42
* });
* setTimeout(() => {
*  store.set("example", Promise.resolve(42));
* }, 2000);
*/
var PromiseStore = class {
	promiseMap = /* @__PURE__ */ new Map();
	resolveMap = /* @__PURE__ */ new Map();
	set(id, promise) {
		if (this.resolveMap.has(id)) {
			promise.then(this.resolveMap.get(id));
			this.resolveMap.delete(id);
		}
		this.promiseMap.set(id, promise);
	}
	get(id) {
		if (this.promiseMap.has(id)) return this.promiseMap.get(id);
		const pendingPromise = new Promise((resolve) => {
			this.resolveMap.set(id, resolve);
		});
		this.promiseMap.set(id, pendingPromise);
		return pendingPromise;
	}
};
//#endregion
//#region src/plugins/pluginProxySharedModule_preBuild.ts
function getPrebuildResolutionSource(pkgName, shareItem) {
	return getConcreteSharedImportSource(pkgName, shareItem) || pkgName;
}
function tryResolveFromProjectRoot(source) {
	if (path$1.isAbsolute(source) || source.startsWith(".") || source.startsWith("/")) return source;
	const browserEntry = getInstalledPackageEntry(source, { cwd: getPackageDetectionCwd() });
	if (browserEntry) return browserEntry;
	try {
		return createRequire$1(pathToFileURL(path$1.join(getPackageDetectionCwd(), "package.json"))).resolve(source);
	} catch {
		return;
	}
}
function isBuildConfigImporter(importer) {
	if (!importer) return false;
	return /(^|\/)(?:nuxt|vite|vitest|webpack|rollup|rspack)\.config\.[cm]?[jt]sx?$/.test(importer.replace(/\\/g, "/"));
}
function findSharedKeyForSource(source, shared) {
	const key = findSharedKey(source, shared);
	if (key) return key;
	const explicitSharedSubpathKeys = Object.keys(shared || {}).filter((sharedKey) => getPackageName(sharedKey) !== sharedKey && !sharedKey.endsWith("/"));
	if (isNodeModulePath(source)) {
		const explicitSubpathKey = getMatchingNodeModuleSubpath(source, explicitSharedSubpathKeys);
		if (explicitSubpathKey) return explicitSubpathKey;
		const normalizedSource = normalizeNodeModulePath(source);
		const explicitSubpathEntryKey = explicitSharedSubpathKeys.find((sharedKey) => {
			const entry = getInstalledPackageEntry(sharedKey, { cwd: getPackageDetectionCwd() });
			return entry ? normalizeNodeModulePath(entry) === normalizedSource : false;
		});
		if (explicitSubpathEntryKey) return explicitSubpathEntryKey;
	}
	const packageName = getPackageNameFromNodeModulePath(source);
	return packageName ? findSharedKey(packageName, shared) : void 0;
}
/**
* Reads the dependencies of an installed package from its package.json.
*/
function getPackageDependencies(pkg) {
	const packageName = getPackageName(pkg);
	const installed = getInstalledPackageJson(packageName, { packageName });
	return Object.keys(installed?.packageJson.dependencies || {});
}
/**
* In dev mode, detects shared packages that are sub-dependencies of other
* shared packages and removes them to avoid initialization order issues.
* For example, `lit` depends on `lit-html`, `lit-element`, and
* `@lit/reactive-element` — sharing them separately causes the child modules
* to load before their parent, resulting in `undefined` class extends errors.
*/
function excludeSharedSubDependencies(shared) {
	const sharedKeys = new Set(Object.keys(shared));
	const sharedKeyByBase = new Map(Object.keys(shared).map((key) => [key.endsWith("/") ? key.slice(0, -1) : key, key]));
	for (const parentKey of sharedKeys) {
		const deps = getPackageDependencies(parentKey);
		for (const dep of deps) {
			const depKey = sharedKeyByBase.get(dep);
			if (depKey && depKey !== parentKey) {
				if (shared[depKey]?.shareConfig.singleton === true || shared[depKey]?.shareConfig.import === false) continue;
				mfWarn(`"${dep}" is a dependency of shared package "${parentKey}" and is also shared separately. This may cause initialization order issues in dev mode. Consider sharing only "${parentKey}".\n  Auto-excluding "${dep}" from shared modules for dev mode.`);
				delete shared[depKey];
				sharedKeys.delete(depKey);
				sharedKeyByBase.delete(dep);
				invalidateSharedKeyMatcher(shared);
			}
		}
	}
}
const sharedDependencyCache = /* @__PURE__ */ new Map();
const sharedPackageDirectoryCache = /* @__PURE__ */ new WeakMap();
function getSharedPackageFromFile(importer, shared, cwd = getPackageDetectionCwd()) {
	if (!importer) return;
	const nodeModulePackage = getPackageNameFromNodeModulePath(importer);
	if (nodeModulePackage) return nodeModulePackage;
	let cached = sharedPackageDirectoryCache.get(shared);
	if (!cached || cached.cwd !== cwd) {
		const entries = /* @__PURE__ */ new Map();
		for (const key of Object.keys(shared)) {
			const packageName = getPackageName(key);
			const entry = getInstalledPackageEntry(packageName, { cwd });
			if (entry && !isNodeModulePath(entry)) entries.set(path$1.dirname(normalizePathForImport(entry)), packageName);
		}
		cached = {
			cwd,
			entries
		};
		sharedPackageDirectoryCache.set(shared, cached);
	}
	const normalizedImporter = normalizePathForImport(importer);
	return [...cached.entries].find(([dir]) => normalizedImporter === dir || normalizedImporter.startsWith(`${dir}/`))?.[1] ?? getWorkspacePackageNameFromFile(normalizedImporter);
}
const workspacePackageNameCache = /* @__PURE__ */ new Map();
/** Name from the nearest `package.json` above `file`, for files outside `node_modules`. */
function getWorkspacePackageNameFromFile(file) {
	const filePath = file.split("?")[0];
	if (!path$1.isAbsolute(filePath) || isNodeModulePath(filePath)) return;
	const visited = [];
	let dir = path$1.dirname(filePath);
	let name;
	while (true) {
		if (workspacePackageNameCache.has(dir)) {
			name = workspacePackageNameCache.get(dir);
			break;
		}
		visited.push(dir);
		const manifestPath = path$1.join(dir, "package.json");
		if (existsSync(manifestPath)) {
			try {
				const manifestName = JSON.parse(readFileSync(manifestPath, "utf-8")).name;
				if (typeof manifestName !== "string") {
					const parent = path$1.dirname(dir);
					if (parent === dir) break;
					dir = parent;
					continue;
				}
				name = manifestName;
			} catch {
				name = void 0;
			}
			break;
		}
		const parent = path$1.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	for (const visitedDir of visited) workspacePackageNameCache.set(visitedDir, name);
	return name;
}
const dependencyManifestCache = /* @__PURE__ */ new Map();
/**
* The manifest of `dep` as seen from `fromDir`: a plain `node_modules` walk-up first, because the
* cycle walk below visits every package in the tree and `getInstalledPackageJson`'s resolver is
* far too expensive for that many lookups; it stays the fallback for layouts the walk-up misses.
*/
function getDependencyManifest(dep, fromDir) {
	const cacheKey = `${fromDir}\0${dep}`;
	if (dependencyManifestCache.has(cacheKey)) return dependencyManifestCache.get(cacheKey);
	let found;
	let currentDir = fromDir;
	while (true) {
		const packageJsonPath = path$1.join(currentDir, "node_modules", dep, "package.json");
		if (existsSync(packageJsonPath)) {
			try {
				let dir = path$1.dirname(packageJsonPath);
				try {
					dir = realpathSync(dir);
				} catch {}
				found = {
					path: packageJsonPath,
					dir,
					packageJson: JSON.parse(readFileSync(packageJsonPath, "utf-8"))
				};
			} catch {}
			break;
		}
		const parentDir = path$1.dirname(currentDir);
		if (parentDir === currentDir) break;
		currentDir = parentDir;
	}
	found ??= getInstalledPackageJson(dep, {
		cwd: fromDir,
		packageName: dep
	});
	dependencyManifestCache.set(cacheKey, found);
	return found;
}
/** Whether `dependency` is reachable through the shared package's manifest dependencies. */
function isSharedPackageDependency(sharedKey, dependency) {
	const sharedPackage = getPackageName(sharedKey);
	let reachable = sharedDependencyCache.get(sharedPackage);
	if (!reachable) {
		reachable = /* @__PURE__ */ new Set();
		const visited = /* @__PURE__ */ new Set();
		const queue = [getInstalledPackageJson(sharedPackage, { packageName: sharedPackage })];
		while (queue.length) {
			const installed = queue.shift();
			if (!installed || visited.has(installed.dir)) continue;
			visited.add(installed.dir);
			const manifest = installed.packageJson;
			for (const dep of Object.keys({
				...manifest.dependencies,
				...manifest.peerDependencies,
				...manifest.optionalDependencies
			})) {
				reachable.add(dep);
				queue.push(getDependencyManifest(dep, installed.dir));
			}
		}
		sharedDependencyCache.set(sharedPackage, reachable);
	}
	return reachable.has(dependency);
}
const sharedRuntimeDependencyCache = /* @__PURE__ */ new Map();
const SOURCE_FILE_RE = /\.(?:[cm]?js|[cm]?ts|jsx|tsx)$/;
const NON_RUNTIME_SOURCE_RE = /(?:\.d\.[cm]?ts|\.(?:test|spec|stories)\.[cm]?[jt]sx?)$/;
const NON_RUNTIME_DIRS = /* @__PURE__ */ new Set([
	"node_modules",
	"__tests__",
	"dist",
	"build"
]);
/** Keep local runtime walks bounded without skipping the package entry itself. */
const MAX_SCANNED_SOURCE_BYTES = 256 * 1024;
const BARE_PACKAGE_SPECIFIER_RE = /^(?:@[^\s'"`()\/]+\/)?[^\s'"`()\/.@][^\s'"`()\/]*(?:\/[^\s'"`()]*)?$/;
/** Module specifiers evaluated by a source file. */
function getRuntimeModuleSpecifiers(code) {
	return findModuleImportDescriptors(code).filter(({ typeOnly }) => !typeOnly).map(({ source }) => source);
}
/** Bare specifiers a source file imports at runtime. */
function getRuntimeImportSpecifiers(code) {
	return getRuntimeModuleSpecifiers(code).filter((specifier) => BARE_PACKAGE_SPECIFIER_RE.test(specifier) && !isBuiltin(specifier));
}
function collectAllRuntimeImports(dir, into) {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return false;
	}
	let complete = true;
	for (const entry of entries) {
		if (entry.isDirectory()) {
			if (!NON_RUNTIME_DIRS.has(entry.name) && !collectAllRuntimeImports(path$1.join(dir, entry.name), into)) complete = false;
			continue;
		}
		if (!SOURCE_FILE_RE.test(entry.name) || NON_RUNTIME_SOURCE_RE.test(entry.name)) continue;
		const file = path$1.join(dir, entry.name);
		let code;
		try {
			if (statSync(file).size > MAX_SCANNED_SOURCE_BYTES) {
				complete = false;
				continue;
			}
			code = readFileSync(file, "utf-8");
		} catch {
			complete = false;
			continue;
		}
		for (const specifier of getRuntimeImportSpecifiers(code)) into.add(specifier);
	}
	return complete;
}
const SOURCE_EXTENSIONS = [
	"",
	".js",
	".mjs",
	".cjs",
	".ts",
	".mts",
	".cts",
	".jsx",
	".tsx"
];
function resolveLocalRuntimeImport(importer, specifier) {
	if (!specifier.startsWith(".")) return;
	const resolved = path$1.resolve(path$1.dirname(importer), specifier);
	return SOURCE_EXTENSIONS.flatMap((extension) => [`${resolved}${extension}`, path$1.join(resolved, `index${extension}`)]).find((candidate) => {
		try {
			return statSync(candidate).isFile();
		} catch {
			return false;
		}
	});
}
function collectReachableRuntimeImports(entry, dir, into) {
	const visited = /* @__PURE__ */ new Set();
	const queue = [{
		file: entry,
		isEntry: true
	}];
	let scanned = false;
	let complete = true;
	while (queue.length) {
		const { file, isEntry } = queue.shift();
		const relative = path$1.relative(dir, file);
		if (relative.startsWith("..") || path$1.isAbsolute(relative) || visited.has(file)) continue;
		visited.add(file);
		let code;
		try {
			if (!isEntry && statSync(file).size > MAX_SCANNED_SOURCE_BYTES) {
				complete = false;
				continue;
			}
			code = readFileSync(file, "utf-8");
			scanned = true;
		} catch {
			complete = false;
			continue;
		}
		for (const specifier of getRuntimeModuleSpecifiers(code)) {
			if (BARE_PACKAGE_SPECIFIER_RE.test(specifier) && !isBuiltin(specifier)) {
				into.add(specifier);
				continue;
			}
			const local = resolveLocalRuntimeImport(file, specifier);
			if (local) queue.push({
				file: local,
				isEntry: false
			});
		}
	}
	return scanned && complete;
}
/**
* Whether `dependency` is reachable from the shared package through the imports its source files
* (and those of the workspace packages they pull in) actually evaluate. Unlike the manifest walk
* above this ignores `import type` edges and stops at `node_modules` boundaries, so it approximates
* the fallback's evaluation graph rather than the package's declared closure — in a monorepo the
* latter covers far more than the module graph ever does.
*/
function isSharedPackageRuntimeDependency(sharedKey, dependency, conditions) {
	const sharedPackage = getPackageName(sharedKey);
	const cacheKey = `${sharedKey}\0${JSON.stringify(conditions ?? null)}`;
	let result = sharedRuntimeDependencyCache.get(cacheKey);
	if (!result) {
		const reachable = /* @__PURE__ */ new Set();
		let complete = true;
		const visited = /* @__PURE__ */ new Set();
		const queue = [{
			request: sharedKey,
			installed: getInstalledPackageJson(sharedPackage, { packageName: sharedPackage })
		}];
		while (queue.length) {
			const { request, installed } = queue.shift();
			if (!installed) {
				complete = false;
				continue;
			}
			const visitKey = `${installed.dir}\0${request}`;
			if (visited.has(visitKey)) continue;
			visited.add(visitKey);
			const specifiers = /* @__PURE__ */ new Set();
			const entry = getInstalledPackageEntry(request, {
				cwd: installed.dir,
				packageName: getPackageName(request),
				resolveSubpathWithRequire: false,
				...conditions !== void 0 ? { conditions: [...conditions] } : {}
			});
			if (!entry) {
				if (!collectAllRuntimeImports(installed.dir, specifiers)) complete = false;
			} else if (!collectReachableRuntimeImports(entry, installed.dir, specifiers)) {
				complete = false;
				collectAllRuntimeImports(installed.dir, specifiers);
			}
			for (const specifier of specifiers) {
				const dep = getPackageName(specifier);
				if (dep === sharedPackage) continue;
				reachable.add(dep);
				const manifest = getDependencyManifest(dep, installed.dir);
				if (manifest && !isNodeModulePath(manifest.dir)) queue.push({
					request: specifier,
					installed: manifest
				});
			}
		}
		result = {
			dependencies: reachable,
			complete
		};
		sharedRuntimeDependencyCache.set(cacheKey, result);
	}
	return result.dependencies.has(dependency) || !result.complete && isSharedPackageDependency(sharedKey, dependency);
}
function proxySharedModule(options) {
	const { shared = {}, federationOptions, getParsePromise = () => Promise.resolve() } = options;
	let _config;
	let _command = "serve";
	let useDirectReactImport = false;
	let useRolldown = false;
	let isProduction = false;
	let rootResolveConditions;
	let ssrResolveConditions;
	let ssrTarget = "node";
	const savePrebuild = new PromiseStore();
	let devServer;
	const materializedLoadShareSources = /* @__PURE__ */ new Set();
	const emittedTreeShakingProviders = /* @__PURE__ */ new Set();
	const hasAnalyzableShares = Object.values(shared).some((share) => shouldAnalyzeSharedExports(share));
	const getEnvironmentConfig = (context) => context.environment?.config;
	const getEnvironmentConditions = (context) => getEnvironmentConfig(context)?.resolve?.conditions;
	const getRuntimeDependencyConditions = (context, resolveOptions) => {
		const environment = context.environment;
		const environmentConfig = environment?.config;
		const isSsr = resolveOptions.ssr === true || Boolean(_config?.build?.ssr) || environmentConfig?.consumer === "server" || Boolean(environmentConfig?.build?.ssr) || environment?.name === "ssr" || environment?.name === "server";
		return getSharedExportConditions({
			environmentConditions: environmentConfig?.resolve?.conditions,
			isProduction: environmentConfig?.isProduction ?? isProduction,
			isSsr,
			rootConditions: rootResolveConditions,
			ssrConditions: ssrResolveConditions,
			ssrTarget
		});
	};
	const refreshTreeShakingForEnvironment = (context) => refreshTreeShakingModules(federationOptions, _command, getIsRolldown(context), getEnvironmentConditions(context));
	const normalizeTreeShakingOutputPath = (value) => {
		const normalized = normalizePathForImport(value);
		if (path$1.posix.isAbsolute(normalized) || /^[A-Za-z]:\//.test(normalized) || normalized.split("/").includes("..")) throw new Error(`Invalid treeShakingDir "${value}": absolute paths and parent segments are not allowed.`);
		let start = normalized.startsWith("./") ? 2 : 0;
		let end = normalized.length;
		while (start < end && normalized.charCodeAt(start) === 47) start++;
		while (end > start && normalized.charCodeAt(end - 1) === 47) end--;
		return normalized.slice(start, end);
	};
	const getTreeShakingProviderFileName = (pkg, shareItem) => {
		if (!shareItem.shareConfig.treeShaking) return void 0;
		const normalizedOptions = federationOptions ?? getNormalizeModuleFederationOptions();
		const outputDir = normalizedOptions.treeShakingDir ? normalizeTreeShakingOutputPath(normalizedOptions.treeShakingDir) : void 0;
		const fileName = outputDir ? path$1.posix.join(outputDir, `${getTreeShakingSharedProviderName(pkg, federationOptions)}.js`) : void 0;
		if (!fileName) return void 0;
		return fileName;
	};
	const emitTreeShakingProvider = (context, pkg, shareItem) => {
		if (_command !== "build" || emittedTreeShakingProviders.has(pkg)) return;
		if (!hasTreeShakingSharedProvider(pkg, shareItem, federationOptions)) return;
		const fileName = getTreeShakingProviderFileName(pkg, shareItem);
		context.emitFile({
			type: "chunk",
			id: getTreeShakingSharedProviderImportId(pkg, federationOptions),
			name: getTreeShakingSharedProviderName(pkg, federationOptions),
			...fileName ? { fileName } : {}
		});
		emittedTreeShakingProviders.add(pkg);
	};
	return [
		{
			name: "generateLocalSharedImportMap",
			enforce: "post",
			configureServer(server) {
				devServer = server;
				setLocalSharedImportMapInvalidator(() => {
					const module = server.moduleGraph.getModuleById(getResolvedLocalSharedImportMapId(federationOptions));
					if (module) server.moduleGraph.invalidateModule(module);
				}, federationOptions);
			},
			resolveId(source) {
				if (source === getLocalSharedImportMapPath(federationOptions)) return getResolvedLocalSharedImportMapId(federationOptions);
			},
			load(id) {
				if (id === getResolvedLocalSharedImportMapId(federationOptions)) return getParsePromise().then((_) => {
					refreshTreeShakingForEnvironment(this);
					const providerPackages = /* @__PURE__ */ new Set([...Object.keys(shared).filter((pkg) => !pkg.endsWith("/")), ...getUsedShares(federationOptions)]);
					for (const pkg of providerPackages) {
						const sharedKey = findSharedKeyForSource(pkg, shared);
						const shareItem = shared[pkg] || (sharedKey ? shared[sharedKey] : void 0);
						if (shareItem) emitTreeShakingProvider(this, pkg, shareItem);
					}
					return generateLocalSharedImportMap(federationOptions);
				});
			},
			closeBundle() {
				if (devServer) return;
				setLocalSharedImportMapInvalidator(void 0, federationOptions);
			}
		},
		{
			name: "proxyPreBuildShared",
			enforce: "post",
			config(config, { command }) {
				setPackageDetectionCwd(config.root || process.cwd());
				setTreeShakingBuildMode(command === "build", federationOptions);
				resetTreeShakingExports(federationOptions);
				emittedTreeShakingProviders.clear();
				sharedDependencyCache.clear();
				dependencyManifestCache.clear();
				sharedRuntimeDependencyCache.clear();
				workspacePackageNameCache.clear();
				const isVinext = hasPackageDependency("vinext");
				const isAstro = hasPackageDependency("astro");
				const isRolldown = getIsRolldown(this);
				_command = command;
				useRolldown = isRolldown;
				useDirectReactImport = isVinext || isAstro;
				if (command === "serve") excludeSharedSubDependencies(shared);
			},
			configResolved(config) {
				_config = config;
				isProduction = config.isProduction;
				rootResolveConditions = config.resolve?.conditions ? [...config.resolve.conditions] : void 0;
				ssrResolveConditions = config.ssr?.resolve?.conditions ? [...config.ssr.resolve.conditions] : void 0;
				ssrTarget = config.ssr?.target ?? "node";
				const isRolldown = getIsRolldown(this);
				const resolvedOptions = federationOptions ?? getNormalizeModuleFederationOptions();
				const registerConfiguredShare = _command === "build" && Object.keys(resolvedOptions.exposes).length > 0 ? addUsedShares : addConfiguredShare;
				Object.keys(shared).forEach((key) => {
					if (key.endsWith("/")) return;
					if (useDirectReactImport && key === "react") {
						registerConfiguredShare(key, federationOptions);
						return;
					}
					writeLoadShareModule(key, shared[key], _command, isRolldown, federationOptions);
					if (shared[key].shareConfig.import !== false) writePreBuildLibPath(key, shared[key], federationOptions);
					registerConfiguredShare(key, federationOptions);
				});
				writeLocalSharedImportMap(federationOptions);
				refreshHostAutoInit(federationOptions);
			},
			buildStart() {
				if (_command !== "build") return;
				resetTreeShakingExports(federationOptions);
				emittedTreeShakingProviders.clear();
				refreshTreeShakingForEnvironment(this);
			},
			shouldTransformCachedModule() {
				return _command === "build" && hasAnalyzableShares;
			},
			transform(code, id) {
				if (_command !== "build" || !hasAnalyzableShares) return;
				collectTreeShakingImports(code, id, shared, findSharedKeyForSource, (sharedKey, exports, request) => recordTreeShakingExports(sharedKey, exports, request, federationOptions), (sharedKey, request) => markTreeShakingPackageUnsafe(sharedKey, request, federationOptions));
				refreshTreeShakingForEnvironment(this);
			}
		},
		{
			name: "proxyPreBuildShared:tree-shaking-graph",
			enforce: "pre",
			apply: "build",
			async resolveId(source, importer, resolveOptions) {
				const sourceToken = getTreeShakingGraphToken(source);
				const importerToken = getTreeShakingGraphToken(importer);
				const token = sourceToken || importerToken;
				if (!token) return;
				const cleanSource = normalizePathForImport(stripTreeShakingGraphQuery(source));
				const cleanImporter = importer ? normalizePathForImport(stripTreeShakingGraphQuery(importer)) : void 0;
				if (!sourceToken && importerToken) {
					const nestedSharedKey = findSharedKeyForSource(cleanSource, shared);
					if (nestedSharedKey && getPackageName(nestedSharedKey) !== getPackageName(importerToken)) return this.resolve(cleanSource, cleanImporter, {
						...resolveOptions,
						skipSelf: true
					});
				}
				const projectResolvedSource = sourceToken ? tryResolveFromProjectRoot(cleanSource) || cleanSource : cleanSource;
				const resolved = await this.resolve(projectResolvedSource, cleanImporter, {
					...resolveOptions,
					custom: {
						...resolveOptions.custom,
						__mfTreeShakingGraph: true
					},
					skipSelf: true
				});
				if (!resolved || resolved.external) return resolved;
				if (resolved.id.startsWith("\0")) return resolved;
				return {
					...resolved,
					id: addTreeShakingGraphQuery(normalizePathForImport(resolved.id), token)
				};
			}
		},
		{
			name: "proxyPreBuildShared:resolve-shared-loadShare",
			enforce: "pre",
			async resolveId(source, importer, resolveOptions) {
				if (resolveOptions.custom?.__mfTreeShakingGraph) return;
				function shouldSkipTaggedImporterProxy(sharedKey, tag) {
					if (!importer?.includes(tag)) return false;
					const taggedModule = VirtualModule.findModule(tag, importer);
					if (!taggedModule) return true;
					return taggedModule.name === sharedKey || matchesSharedSource(source, taggedModule.name);
				}
				const key = findSharedKeyForSource(source, shared);
				if (!key) return;
				const importerPackage = getSharedPackageFromFile(importer, shared);
				if (importerPackage === getPackageName(key)) return;
				if (importerPackage) {
					const importerIsUnsharedWorkspacePackage = !isNodeModulePath(importer) && !Object.keys(shared).some((sharedKey) => getPackageName(sharedKey) === importerPackage);
					const runtimeDependencyRequest = key.endsWith("/") && matchesSharedSource(source, key) ? source : key;
					if (importerIsUnsharedWorkspacePackage ? isSharedPackageRuntimeDependency(runtimeDependencyRequest, importerPackage, getRuntimeDependencyConditions(this, resolveOptions)) : isSharedPackageDependency(key, importerPackage)) return;
				}
				if (useDirectReactImport && key === "react") return;
				if (isAssetLikeImport(source)) return;
				if (isBuildConfigImporter(importer)) return;
				if (useDirectReactImport && source === "react") return;
				if (importer && importer.includes("localSharedImportMap")) return;
				if (importer && (importer.includes("hostAutoInit") || importer.includes("__H_A_I__"))) return;
				if (shouldSkipTaggedImporterProxy(key, "__loadShare__")) return;
				if (shouldSkipTaggedImporterProxy(key, "__prebuild__")) return;
				const shareSource = key === "vue" && source.startsWith("vue/dist/") ? key : isNodeModulePath(source) ? getCommonSharedSubpathFromNodeModulePath(source, key) || key : source;
				const loadSharePath = getLoadShareModulePath(shareSource, useRolldown, federationOptions);
				if (!materializedLoadShareSources.has(shareSource)) {
					materializedLoadShareSources.add(shareSource);
					writeLoadShareModule(shareSource, shared[key], _command, useRolldown, federationOptions);
					if (shared[key].shareConfig.import !== false) writePreBuildLibPath(shareSource, shared[key], federationOptions);
					addUsedShares(shareSource, federationOptions);
					writeLocalSharedImportMap(federationOptions);
					refreshHostAutoInit(federationOptions);
				}
				return this.resolve(loadSharePath, importer, { skipSelf: true });
			}
		},
		{
			name: "proxyPreBuildShared:resolve-prebuild",
			enforce: "pre",
			async resolveId(source, importer) {
				if (!source.includes("__prebuild__")) return;
				if (source.startsWith(".")) return;
				const pkgName = assertModuleFound(PREBUILD_TAG, source).name;
				const importSource = getPrebuildResolutionSource(pkgName, getPreBuildShareItem(pkgName, federationOptions));
				if (_command === "build") return this.resolve(importSource, importer, { skipSelf: true });
				const direct = tryResolveFromProjectRoot(importSource);
				const directSource = direct && !isNodeModulePath(direct) ? direct : void 0;
				const resolved = await this.resolve(directSource || importSource, importer, { skipSelf: true });
				if (!resolved?.id) return;
				const result = resolved.id;
				if (!_config || result.includes(_config.cacheDir)) {
					if (directSource) return await this.resolve(directSource, importer, { skipSelf: true }) || { id: directSource };
					return resolved;
				}
				savePrebuild.set(pkgName, Promise.resolve(result));
				return await this.resolve(await savePrebuild.get(pkgName), importer, { skipSelf: true });
			}
		}
	];
}
//#endregion
//#region src/plugins/pluginRemoteNamedExports.ts
const JS_EXTENSIONS_RE = /\.(?:[mc]?[jt]sx?|vue|svelte)(?:\?|$)/;
function isAstNode(value) {
	return !!value && typeof value === "object" && typeof value.type === "string";
}
function walkAST(root, visitor) {
	const seen = /* @__PURE__ */ new WeakSet();
	function visit(node) {
		if (!isAstNode(node)) return;
		if (seen.has(node)) return;
		seen.add(node);
		let skipped = false;
		visitor.enter.call({ skip() {
			skipped = true;
		} }, node);
		if (skipped) return;
		for (const value of Object.values(node)) if (Array.isArray(value)) for (const item of value) visit(item);
		else visit(value);
	}
	visit(root);
}
function parseNamedSpecifiers(specifiersRaw, kind) {
	return specifiersRaw.split(",").map((s) => s.trim()).filter((s) => s.length > 0 && !s.startsWith("type ")).map((s) => {
		const asMatch = s.match(/^(\w+)\s+as\s+(\w+)$/);
		const sourceName = asMatch ? asMatch[1] : s;
		const targetName = asMatch ? asMatch[2] : s;
		return kind === "import" ? {
			imported: sourceName,
			local: targetName
		} : {
			local: sourceName,
			exported: targetName
		};
	});
}
function wrapDynamicImport(original) {
	return `${original}.then(function(__mf_m__) {\n  var __mf_pending__ = __mf_m__ && __mf_m__.__mf_remote_pending;\n  var __mf_ready__ = __mf_pending__ && typeof __mf_pending__.then === "function"\n    ? __mf_pending__.then(function(__mf_resolved__) { return __mf_resolved__ || __mf_m__; })\n    : Promise.resolve(__mf_m__);\n  return __mf_ready__.then(function(__mf_m__) {\n  if (!__mf_m__ || !__mf_m__.__moduleExports) {\n    if (__mf_m__ && __mf_m__.default && typeof __mf_m__.default === "object" && __mf_m__.default.__esModule) {\n      var __mf_nested_e__ = __mf_m__.default;\n      var __mf_nested_ns__ = Object.create(null);\n      Object.defineProperty(__mf_nested_ns__, Symbol.toStringTag, { value: "Module" });\n      Object.keys(__mf_nested_e__).forEach(function(k) { if (k !== "__esModule") __mf_nested_ns__[k] = __mf_nested_e__[k] });\n      if ("default" in __mf_nested_e__) __mf_nested_ns__.default = __mf_nested_e__.default;\n      return __mf_nested_ns__;\n    }\n    var __mf_flat_ns__ = Object.create(null);\n    Object.defineProperty(__mf_flat_ns__, Symbol.toStringTag, { value: "Module" });\n    var __mf_src__ = __mf_m__;\n    if (__mf_src__ && __mf_src__.default && typeof __mf_src__.default === "object" && __mf_src__.default.__esModule) __mf_src__ = __mf_src__.default;\n    if (__mf_src__) {\n      Object.keys(__mf_src__).forEach(function(k) { if (k !== "__esModule") __mf_flat_ns__[k] = __mf_src__[k]; });\n      __mf_flat_ns__.default = "default" in __mf_src__ ? __mf_src__.default : __mf_src__;\n    }\n    return __mf_flat_ns__;\n  }\n  var __mf_ns__ = Object.create(null);\n  Object.defineProperty(__mf_ns__, Symbol.toStringTag, { value: "Module" });\n  var __mf_e__ = __mf_m__.__moduleExports;\n  if (__mf_e__ && __mf_e__.default && typeof __mf_e__.default === "object" && __mf_e__.default.__esModule) __mf_e__ = __mf_e__.default;\n  Object.keys(__mf_e__).forEach(function(k) { if (k !== "__esModule") __mf_ns__[k] = __mf_e__[k] });\n  if ("default" in __mf_e__) __mf_ns__.default = __mf_e__.default;\n  else if ("default" in __mf_m__) __mf_ns__.default = __mf_m__.default;\n  return __mf_ns__;\n  });\n})`;
}
function applyRewrites(code, imports, id) {
	if (imports.length === 0) return;
	const ms = new CodeRewriter(code);
	let changed = false;
	let counter = 0;
	const dependencyPendingIds = [];
	for (const imp of imports) switch (imp.kind) {
		case "static": {
			const src = JSON.stringify(imp.source);
			if (imp.namespaceLocal && !imp.defaultLocal && imp.named.length === 0) {
				const pendingId = `${imp.namespaceLocal}__mf_pending`;
				dependencyPendingIds.push(pendingId);
				ms.overwrite(imp.start, imp.end, `import { __moduleExports as ${imp.namespaceLocal}, __mf_remote_pending as ${pendingId} } from ${src};`);
			} else {
				const nsId = `__mf_ns_${counter++}`;
				const pendingId = `${nsId}_pending`;
				dependencyPendingIds.push(pendingId);
				const importParts = [];
				if (imp.defaultLocal) importParts.push(`default as ${imp.defaultLocal}`);
				importParts.push(`__moduleExports as ${nsId}`);
				importParts.push(`__mf_remote_pending as ${pendingId}`);
				let rewrite = `import { ${importParts.join(", ")} } from ${src};`;
				if (imp.named.length > 0) {
					const declarations = imp.named.map((s) => `let ${s.local};`).join("\n");
					const initializers = imp.named.map((s) => `if (${JSON.stringify(s.imported)} in ${nsId}) {\n${s.local} = ${nsId}[${JSON.stringify(s.imported)}];\n}`).join("\n");
					const assignments = imp.named.map((s) => `${s.local} = ${nsId}[${JSON.stringify(s.imported)}];`).join("\n");
					rewrite += `\n${declarations}\n${initializers}\n${pendingId}.then(() => {\n${assignments}\n});`;
				}
				ms.overwrite(imp.start, imp.end, rewrite);
			}
			changed = true;
			break;
		}
		case "reexport": {
			const src = JSON.stringify(imp.source);
			const nsId = `__mf_ns_${counter++}`;
			const pendingId = `${nsId}_pending`;
			dependencyPendingIds.push(pendingId);
			const vars = imp.specifiers.map((s) => {
				const tmp = `__mf_re_${counter++}`;
				return {
					...s,
					tmp
				};
			});
			const importLine = `import { __moduleExports as ${nsId}, __mf_remote_pending as ${pendingId} } from ${src};`;
			const varLines = vars.map((v) => `let ${v.tmp};`).join("\n");
			const initializers = vars.map((v) => `if (${JSON.stringify(v.local)} in ${nsId}) {\n${v.tmp} = ${nsId}[${JSON.stringify(v.local)}];\n}`).join("\n");
			const syncLine = `${pendingId}.then(() => {\n${vars.map((v) => `${v.tmp} = ${nsId}[${JSON.stringify(v.local)}];`).join("\n")}\n});`;
			const exportLine = `export { ${vars.map((v) => `${v.tmp} as ${v.exported}`).join(", ")} };`;
			ms.overwrite(imp.start, imp.end, `${importLine}\n${varLines}\n${initializers}\n${syncLine}\n${exportLine}`);
			changed = true;
			break;
		}
		case "export-all":
			console.warn(`[module-federation] "export * from '${imp.source}'" is not supported with Rolldown — use explicit named re-exports instead. (${id})`);
			break;
		case "dynamic":
			ms.overwrite(imp.start, imp.end, wrapDynamicImport(imp.originalText));
			changed = true;
			break;
	}
	if (!changed) return;
	if (dependencyPendingIds.length > 0) ms.overwrite(code.length, code.length, `\nexport const __mf_remote_dependency_pending = Promise.all([${dependencyPendingIds.join(", ")}]);`);
	return {
		code: ms.toString(),
		map: ms.generateMap(id)
	};
}
async function collectFromAST(ast, code, isRemoteImport) {
	const result = [];
	walkAST(ast, { enter(node) {
		if (node.type === "ImportDeclaration" && node.source?.value) {
			if (!isRemoteImport(node.source.value)) return;
			const specifiers = node.specifiers || [];
			const named = specifiers.filter((s) => s.type === "ImportSpecifier" && s.importKind !== "type").map((s) => ({
				imported: s.imported.name ?? s.imported.value,
				local: s.local.name
			}));
			const defaultSpec = specifiers.find((s) => s.type === "ImportDefaultSpecifier");
			const nsSpec = specifiers.find((s) => s.type === "ImportNamespaceSpecifier");
			if (named.length === 0 && !nsSpec) return;
			result.push({
				kind: "static",
				source: node.source.value,
				start: node.start,
				end: node.end,
				named,
				defaultLocal: defaultSpec?.local.name,
				namespaceLocal: nsSpec?.local.name
			});
		}
		if (node.type === "ExportNamedDeclaration" && node.source?.value && isRemoteImport(node.source.value)) {
			const specifiers = (node.specifiers || []).filter((s) => s.exportKind !== "type").map((s) => ({
				local: s.local.name ?? s.local.value,
				exported: s.exported.name ?? s.exported.value
			}));
			if (specifiers.length === 0) return;
			result.push({
				kind: "reexport",
				source: node.source.value,
				start: node.start,
				end: node.end,
				specifiers
			});
		}
		if (node.type === "ExportAllDeclaration" && node.source?.value && isRemoteImport(node.source.value)) {
			this.skip();
			result.push({
				kind: "export-all",
				source: node.source.value,
				start: node.start,
				end: node.end
			});
		}
		if (node.type === "ImportExpression") {
			const source = node.source;
			if (source.type !== "Literal" && source.type !== "StringLiteral" && source.type !== "TemplateLiteral") return;
			const value = source.type === "TemplateLiteral" ? source.quasis?.length === 1 ? source.quasis[0].value?.cooked : void 0 : source.value;
			if (!value || !isRemoteImport(value)) return;
			result.push({
				kind: "dynamic",
				source: value,
				start: node.start,
				end: node.end,
				originalText: code.slice(node.start, node.end)
			});
		}
	} });
	return result;
}
function collectFromRegex(code, isRemoteImport) {
	const result = [];
	const codePositions = createCodePositionMap(code);
	const importAttributes = String.raw`(?:\s+(?:with|assert)\s+\{[^;]*\})?`;
	const staticRe = new RegExp(String.raw`^\s*import\s+([\s\S]*?)\s+from\s+(['"])([^'"]+)\2${importAttributes}\s*;?`, "gm");
	for (const match of code.matchAll(staticRe)) {
		const [full, specifiersPartRaw, , source] = match;
		if (!codePositions[match.index]) continue;
		if (!isRemoteImport(source)) continue;
		const specifiersPart = specifiersPartRaw.trim();
		if (/^type\s/.test(specifiersPart)) continue;
		const nsMatch = specifiersPart.match(/^\*\s+as\s+(\w+)$/);
		if (nsMatch) {
			result.push({
				kind: "static",
				source,
				start: match.index,
				end: match.index + full.length,
				named: [],
				namespaceLocal: nsMatch[1]
			});
			continue;
		}
		const braceMatch = specifiersPart.match(/\{([^}]*)\}/);
		if (!braceMatch) continue;
		const named = parseNamedSpecifiers(braceMatch[1], "import");
		if (named.length === 0) continue;
		const defaultMatch = specifiersPart.match(/^(\w+)\s*,/);
		result.push({
			kind: "static",
			source,
			start: match.index,
			end: match.index + full.length,
			named,
			defaultLocal: defaultMatch?.[1]
		});
	}
	const reexportRe = new RegExp(String.raw`^\s*export\s+\{([\s\S]*?)\}\s+from\s+(['"])([^'"]+)\2${importAttributes}\s*;?`, "gm");
	for (const match of code.matchAll(reexportRe)) {
		const [full, specifiersRaw, , source] = match;
		if (!codePositions[match.index]) continue;
		if (!isRemoteImport(source)) continue;
		const specifiers = parseNamedSpecifiers(specifiersRaw, "export");
		if (specifiers.length === 0) continue;
		result.push({
			kind: "reexport",
			source,
			start: match.index,
			end: match.index + full.length,
			specifiers
		});
	}
	const exportAllRe = new RegExp(String.raw`^\s*export\s+\*\s+from\s+(['"])([^'"]+)\1${importAttributes}\s*;?`, "gm");
	for (const match of code.matchAll(exportAllRe)) {
		const [full, , source] = match;
		if (!codePositions[match.index]) continue;
		if (!isRemoteImport(source)) continue;
		result.push({
			kind: "export-all",
			source,
			start: match.index,
			end: match.index + full.length
		});
	}
	for (const match of code.matchAll(/import\(\s*(?:\/\*[\s\S]*?\*\/\s*)?(['"])([^'"]+)\1\s*\)/g)) {
		const [full, , source] = match;
		if (!codePositions[match.index]) continue;
		if (!isRemoteImport(source)) continue;
		result.push({
			kind: "dynamic",
			source,
			start: match.index,
			end: match.index + full.length,
			originalText: full
		});
	}
	return result.length > 0 ? result : void 0;
}
function pluginRemoteNamedExports(options) {
	const remoteNames = Object.keys(options.remotes);
	const isNodeModulesId = (id) => id.includes("/node_modules/") || id.includes("\\node_modules\\");
	function isRemoteImport(source, importerId) {
		return remoteNames.some((name) => {
			if (source.startsWith(name + "/")) return true;
			if (source !== name) return false;
			return !isNodeModulesId(importerId);
		}) || source.includes("__loadRemote__");
	}
	return {
		name: "module-federation-remote-named-exports",
		enforce: "post",
		async transform(code, id) {
			if (remoteNames.length === 0) return;
			if (id.includes("__loadRemote__") || id.includes("__loadShare__")) return;
			if (!JS_EXTENSIONS_RE.test(id)) return;
			if (!remoteNames.some((name) => code.includes(name))) return;
			const matchesRemoteImport = (source) => isRemoteImport(source, id);
			for (const { kind, source, typeOnly } of findModuleImportDescriptors(code)) if (kind === "static" && !typeOnly && matchesRemoteImport(source)) markStaticRemote(source, options);
			let imports;
			try {
				imports = await collectFromAST(this.parse(code), code, matchesRemoteImport);
			} catch {
				if ((id.includes(".vue") || id.includes(".svelte")) && /^\s*</.test(code)) return;
				imports = collectFromRegex(code, matchesRemoteImport);
			}
			if (!imports) return;
			for (const remoteImport of imports) if (remoteImport.kind === "dynamic") markDynamicRemote(remoteImport.source, options);
			return applyRewrites(code, imports, id);
		}
	};
}
//#endregion
//#region src/plugins/pluginSSRRemoteEntry.ts
const MAX_RUNNER_BODY_BYTES = 1024 * 1024;
const MAX_RUNNER_START_OFFSET = 1024 * 1024;
const ALLOWED_RUNNER_INVOKE_NAMES = /* @__PURE__ */ new Set(["fetchModule", "getBuiltins"]);
const VITE_FS_PREFIX = "/@fs/";
function isPlainObject(value) {
	return !!value && typeof value === "object" && !Array.isArray(value);
}
function isSafeRunnerFetchModuleOptions(value) {
	if (!isPlainObject(value)) return false;
	const allowedKeys = /* @__PURE__ */ new Set([
		"cached",
		"startOffset",
		"inlineSourceMap"
	]);
	for (const [key, option] of Object.entries(value)) {
		if (!allowedKeys.has(key)) return false;
		if (key === "startOffset") {
			if (typeof option !== "number" || !Number.isSafeInteger(option) || option < 0 || option > MAX_RUNNER_START_OFFSET) return false;
		} else if (typeof option !== "boolean") return false;
	}
	return true;
}
function stripQueryAndHash(id) {
	const queryIndex = id.indexOf("?");
	const hashIndex = id.indexOf("#");
	const endIndex = queryIndex === -1 ? hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
	return endIndex === -1 ? id : id.slice(0, endIndex);
}
function decodeRunnerFilePath(filePath) {
	try {
		return decodeURIComponent(filePath);
	} catch {
		return;
	}
}
function hasRelativeTraversal(id) {
	return id.split(/[\\/]+/).includes("..");
}
function getRealPathIfExists(filePath) {
	try {
		return fs$1.realpathSync.native(filePath);
	} catch {
		return;
	}
}
function isCanonicalPathWithinDirectory(filePath, directory) {
	const realFilePath = getRealPathIfExists(filePath) ?? path$1.resolve(filePath);
	const realDirectory = getRealPathIfExists(directory) ?? path$1.resolve(directory);
	const relative = path$1.relative(realDirectory, realFilePath);
	return relative === "" || !relative.startsWith("..") && !path$1.isAbsolute(relative);
}
function getRunnerAllowedDirectories(config) {
	return [config.root, ...config.server?.fs?.allow ?? []].map((directory) => path$1.resolve(directory));
}
function isPathWithinAllowedDirectories(filePath, allowedDirectories) {
	return allowedDirectories.some((directory) => isCanonicalPathWithinDirectory(filePath, directory));
}
function isSafeRunnerFetchModuleId(id, config) {
	if (typeof id !== "string" || !id) return false;
	const decoded = decodeViteId(id).replace(/^\0+/, "");
	if (!decoded || decoded.startsWith("virtual:")) return !!decoded;
	if (decoded.startsWith("file://")) try {
		const filePath = decodeURIComponent(new URL(decoded).pathname);
		return path$1.isAbsolute(filePath) && isPathWithinAllowedDirectories(filePath, getRunnerAllowedDirectories(config));
	} catch {
		return false;
	}
	if (/^(?:https?|data|blob|javascript):/i.test(decoded) || decoded.startsWith("//")) return false;
	const cleanId = decodeRunnerFilePath(stripQueryAndHash(decoded));
	if (!cleanId || hasRelativeTraversal(cleanId)) return false;
	const allowedDirectories = getRunnerAllowedDirectories(config);
	if (cleanId.startsWith(VITE_FS_PREFIX)) {
		const fsPath = `/${cleanId.slice(5)}`;
		return path$1.isAbsolute(fsPath) && isPathWithinAllowedDirectories(fsPath, allowedDirectories);
	}
	if (path$1.isAbsolute(cleanId)) {
		if (isPathWithinAllowedDirectories(cleanId, allowedDirectories)) return true;
		return !fs$1.existsSync(cleanId);
	}
	return true;
}
function isRunnerInvokePayload(payload, config) {
	if (!payload || typeof payload !== "object") return false;
	if (payload.type !== "custom" || payload.event !== "vite:invoke") return false;
	const data = payload.data;
	if (!data || typeof data !== "object") return false;
	const name = data.name;
	const args = data.data;
	if (typeof name !== "string" || !ALLOWED_RUNNER_INVOKE_NAMES.has(name) || !Array.isArray(args)) return false;
	if (name === "getBuiltins") return args.length === 0;
	if (args.length < 1 || args.length > 3) return false;
	const [id, importer, opts] = args;
	return isSafeRunnerFetchModuleId(id, config) && (importer === void 0 || importer === null || isSafeRunnerFetchModuleId(importer, config)) && (opts === void 0 || isSafeRunnerFetchModuleOptions(opts));
}
function readBoundedRunnerBody(req, res) {
	return new Promise((resolve) => {
		const chunks = [];
		let size = 0;
		let done = false;
		const fail = (statusCode, message) => {
			if (done) return;
			done = true;
			res.statusCode = statusCode;
			res.end(message);
			resolve(void 0);
		};
		req.on("data", (chunk) => {
			if (done) return;
			size += chunk.length;
			if (size > MAX_RUNNER_BODY_BYTES) return fail(413, "Payload too large");
			chunks.push(chunk);
		});
		req.on("end", () => {
			if (done) return;
			done = true;
			resolve(Buffer.concat(chunks));
		});
		req.on("error", () => fail(400, "Bad request"));
	});
}
/**
* Emits a Node-compatible SSR remote entry alongside the browser entry.
*
* Format strategy:
*  - Emit a dedicated ESM SSR entry alongside the browser entry.
*  - Keep the SSR entry out of the browser remote graph for Rollup builds by
*    emitting it as a generated asset.
*
* In both cases shared packages (react, react-dom, etc.) are marked as external
* so Node resolves them through its own module cache, guaranteeing the singleton
* is shared with react-dom/server.
*/
function pluginSSRRemoteEntry(options) {
	const remoteEntrySSRId = getRemoteEntrySSRId(options);
	const virtualExposesSSRId = getVirtualExposesSSRId(options);
	let cachedSsrRemoteEntrySource;
	const ssrOutputFilename = getSsrRemoteEntryFileName(options.filename);
	const ssrExposesFileName = getSsrExposesFileName(options.filename);
	let ssrOutputFiles = /* @__PURE__ */ new Set();
	let ssrOutputDir = "";
	let clientOutputDir = "";
	const ssrOnlyExternals = [
		"@module-federation/runtime",
		"@module-federation/runtime-core",
		"@module-federation/sdk",
		...options.ssrExternals ?? []
	];
	const ssrOnlyExternalPattern = new RegExp(`^(${ssrOnlyExternals.map((e) => e.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})(\\/.*)?$`);
	const ssrModuleIds = /* @__PURE__ */ new Set([remoteEntrySSRId, virtualExposesSSRId]);
	const resolvedAbsToPackage = /* @__PURE__ */ new Map();
	let isServe = false;
	let viteConfig;
	let isNuxtProject = false;
	let reactIslandExposes = /* @__PURE__ */ new Set();
	const isSsrRemoteEntryBuild = (environment) => {
		const environmentName = environment?.name;
		const hasSsrEnvironment = Boolean(viteConfig?.environments?.ssr);
		const isLegacySsrBuild = Boolean(environment?.config?.build?.ssr ?? viteConfig?.build?.ssr);
		return Object.keys(options.exposes).length > 0 && !(hasSsrEnvironment && environmentName !== "ssr" || !hasSsrEnvironment && !isLegacySsrBuild);
	};
	const getSsrRemoteEntrySource = () => {
		if (cachedSsrRemoteEntrySource === void 0) cachedSsrRemoteEntrySource = generateRemoteEntrySSR(options);
		return cachedSsrRemoteEntrySource;
	};
	const findNuxtExposesChunk = (bundle) => {
		const exposeKeys = Object.keys(options.exposes);
		if (exposeKeys.length === 0) return;
		return Object.values(bundle).find((file) => {
			if (file.type !== "chunk" || !file.fileName.startsWith("_nuxt/") || !file.fileName.endsWith(".js")) return false;
			const code = file.code || "";
			return exposeKeys.every((key) => code.includes(JSON.stringify(key)));
		})?.fileName;
	};
	return [{
		name: "mf:ssr-remote-entry:pre",
		enforce: "pre",
		configResolved(config) {
			isServe = config.command === "serve";
			for (const pkg of ssrOnlyExternals) {
				const aliasEntry = (config.resolve?.alias)?.find((a) => a.find === pkg || a.find instanceof RegExp && a.find.test(pkg));
				if (aliasEntry?.replacement) resolvedAbsToPackage.set(aliasEntry.replacement, pkg);
			}
		},
		resolveId(id, importer) {
			if (id === remoteEntrySSRId || id.startsWith(remoteEntrySSRId)) return id;
			if (id === virtualExposesSSRId || id.startsWith(virtualExposesSSRId)) return id;
			if (!importer || !ssrModuleIds.has(importer)) return;
			if (ssrOnlyExternalPattern.test(id)) return {
				id,
				external: true
			};
			const pkg = resolvedAbsToPackage.get(id);
			if (pkg) return {
				id: pkg,
				external: true
			};
			if (id.startsWith(".") || id.startsWith("/") || id.startsWith("file:")) return this.resolve(id, importer, { skipSelf: true }).then((resolved) => {
				if (resolved) ssrModuleIds.add(resolved.id);
				return resolved;
			});
		}
	}, {
		name: "mf:ssr-remote-entry",
		sharedDuringBuild: true,
		configResolved(config) {
			viteConfig = config;
			isNuxtProject = isNuxtProjectRoot(config.root);
			reactIslandExposes = getReactIslandExposes(options, config.root);
		},
		configureServer(server) {
			const base = "/__mf_ssr__";
			const basePath = getBasePath$1(viteConfig?.base);
			const ssrEntryFileName = getSsrRemoteEntryFileName(options.filename);
			if (isNuxtProject || isNuxtClientBase(basePath)) server.middlewares.use((req, _res, next) => {
				if (req.url?.replace(/\?.*/, "") === `${basePath}/${ssrEntryFileName}`) req.url = `${basePath}/__mf_ssr__/${ssrEntryFileName}`;
				next();
			});
			const ssrEnv = server.environments?.ssr;
			const clientEnv = server.environments?.client;
			const runnerEnv = typeof ssrEnv?.hot?.handleInvoke === "function" ? ssrEnv : typeof clientEnv?.hot?.handleInvoke === "function" ? clientEnv : void 0;
			if (typeof (ssrEnv?.fetchModule ?? clientEnv?.fetchModule) === "function" && runnerEnv) server.middlewares.use("/__mf_runner__", async (req, res) => {
				if (req.method !== "POST") {
					res.statusCode = 405;
					res.end("Method not allowed");
					return;
				}
				try {
					const rawBody = await readBoundedRunnerBody(req, res);
					if (!rawBody) return;
					let body;
					try {
						body = JSON.parse(rawBody.toString("utf8"));
					} catch {
						res.statusCode = 400;
						res.end(JSON.stringify({ error: { message: "Invalid JSON" } }));
						return;
					}
					if (!isRunnerInvokePayload(body, server.config)) {
						res.statusCode = 400;
						res.end(JSON.stringify({ error: { message: "Invalid runner invoke" } }));
						return;
					}
					let result = await runnerEnv.hot.handleInvoke(body);
					if ("error" in result && body.data.name === "fetchModule") {
						const id = body.data.data[0];
						const bareId = typeof id === "string" ? decodeViteId(id).replace(/^\0/, "") : "";
						if (bareId && !bareId.startsWith(".") && !bareId.startsWith("/") && !bareId.startsWith("file:") && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(bareId)) try {
							const { createRequire } = await import("module");
							const path = await import("path");
							const { pathToFileURL } = await import("url");
							result = { result: {
								externalize: pathToFileURL(createRequire(pathToFileURL(path.join(server.config.root, "package.json"))).resolve(bareId)).href,
								type: "module"
							} };
						} catch {}
					}
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify(result));
				} catch (e) {
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ error: { message: String(e instanceof Error ? e.message : e) } }));
				}
			});
			const ssrPath = `${base}/${ssrEntryFileName}`;
			server.middlewares.use(ssrPath, (_req, res) => {
				const exposesUrl = `${base}/${ssrExposesFileName}`;
				const code = getSsrRemoteEntrySource().replace(JSON.stringify(virtualExposesSSRId), JSON.stringify(exposesUrl));
				res.setHeader("Content-Type", "application/javascript");
				res.setHeader("Access-Control-Allow-Origin", "*");
				res.end(code);
			});
			const exposesPath = `${base}/${ssrExposesFileName}`;
			server.middlewares.use(exposesPath, (_req, res) => {
				res.setHeader("Content-Type", "application/javascript");
				res.setHeader("Access-Control-Allow-Origin", "*");
				res.end(generateExposesSSR(options, reactIslandExposes));
			});
		},
		resolveId(id) {
			if (id === remoteEntrySSRId || id.startsWith(remoteEntrySSRId)) return id;
			if (id === virtualExposesSSRId || id.startsWith(virtualExposesSSRId)) return id;
			if (id === `/__mf_ssr__/${getSsrRemoteEntryFileName(options.filename)}`) return remoteEntrySSRId;
			if (id === `/__mf_ssr__/${ssrExposesFileName}`) return virtualExposesSSRId;
		},
		load(id) {
			if (id === remoteEntrySSRId || id.startsWith(remoteEntrySSRId)) return getSsrRemoteEntrySource();
			if (id === virtualExposesSSRId || id.startsWith(virtualExposesSSRId)) return generateExposesSSR(options, reactIslandExposes);
		},
		buildStart() {
			if (isServe) return;
			const isRolldown = getIsRolldown(this);
			const environment = this.environment;
			if (!isSsrRemoteEntryBuild(environment)) return;
			if (isRolldown) this.emitFile({
				type: "chunk",
				id: remoteEntrySSRId,
				name: "ssrRemoteEntry",
				fileName: ssrOutputFilename,
				preserveSignature: "strict"
			});
		},
		generateBundle: {
			order: "post",
			handler(_options, bundle) {
				const isRolldown = getIsRolldown(this);
				const environment = this.environment;
				const exposesChunk = findNuxtExposesChunk(bundle);
				if (!isRolldown && isSsrRemoteEntryBuild(environment)) {
					let source = getSsrRemoteEntrySource();
					if (exposesChunk) source = source.replace(/import\("virtual:mf-exposes-ssr:[^"]+"\)/g, `import("./${exposesChunk}")`);
					this.emitFile({
						type: "asset",
						fileName: ssrOutputFilename,
						source
					});
				}
				if (this.environment?.name === "ssr") ssrOutputFiles = collectEntryOutputFiles(bundle, ssrOutputFilename);
			}
		},
		writeBundle(outputOptions) {
			const environmentName = this.environment?.name;
			if (environmentName === "ssr" && outputOptions.dir) ssrOutputDir = outputOptions.dir;
			else if (environmentName === "client" && outputOptions.dir) clientOutputDir = outputOptions.dir;
			publishSsrOutputFiles(ssrOutputDir, clientOutputDir || viteConfig?.environments?.client?.build?.outDir);
		}
	}];
	function publishSsrOutputFiles(ssrOutDir, clientOutDir) {
		if (ssrOutputFiles.size === 0 || !ssrOutDir || !clientOutDir) return;
		const root = viteConfig?.root ?? process.cwd();
		const ssrDir = path$1.resolve(root, ssrOutDir);
		const clientDir = path$1.resolve(root, clientOutDir);
		if (ssrDir === clientDir || !fs$1.existsSync(ssrDir)) return;
		fs$1.mkdirSync(clientDir, { recursive: true });
		for (const fileName of ssrOutputFiles) {
			const source = path$1.resolve(ssrDir, fileName);
			const destination = path$1.resolve(clientDir, fileName);
			if (!isResolvedPathWithinDirectory(source, ssrDir) || !isResolvedPathWithinDirectory(destination, clientDir)) continue;
			if (!fs$1.existsSync(source) || fs$1.existsSync(destination)) continue;
			fs$1.mkdirSync(path$1.dirname(destination), { recursive: true });
			fs$1.copyFileSync(source, destination);
		}
	}
}
const RELATIVE_IMPORT_RE = /(?:\bfrom|\bimport\s*(?:\(\s*)?|\bexport\s*\*\s*from)\s*["'`](\.\.?\/[^"'`]+)["'`]/g;
function collectEntryOutputFiles(bundle, entryFileName) {
	const files = /* @__PURE__ */ new Set();
	const visit = (fileName) => {
		if (files.has(fileName)) return;
		const file = bundle[fileName];
		if (!file) return;
		files.add(fileName);
		const dependencies = /* @__PURE__ */ new Set([
			...file.imports || [],
			...file.dynamicImports || [],
			...file.implicitlyLoadedBefore || [],
			...file.referencedFiles || []
		]);
		const source = typeof file.code === "string" ? file.code : typeof file.source === "string" ? file.source : "";
		if (source) {
			const directory = path$1.posix.dirname(fileName);
			for (const match of source.matchAll(RELATIVE_IMPORT_RE)) dependencies.add(path$1.posix.normalize(path$1.posix.join(directory, match[1])));
		}
		for (const dependency of dependencies) visit(dependency);
	};
	visit(entryFileName);
	return files;
}
function isResolvedPathWithinDirectory(filePath, directory) {
	const relative = path$1.relative(directory, filePath);
	return relative !== "" && !relative.startsWith(`..${path$1.sep}`) && relative !== "..";
}
//#endregion
//#region src/plugins/pluginVarRemoteEntry.ts
const VarRemoteEntry = (providedOptions) => {
	const mfOptions = providedOptions ?? getNormalizeModuleFederationOptions();
	const { name, varFilename, filename } = mfOptions;
	let viteConfig;
	return [{
		name: "module-federation-var-remote-entry",
		apply: "serve",
		/**
		* Stores resolved Vite config for later use
		*/
		/**
		* Finalizes configuration after all plugins are resolved
		* @param config - Fully resolved Vite config
		*/
		configResolved(config) {
			viteConfig = config;
		},
		/**
		* Configures dev server middleware to handle varRemoteEntry requests
		* @param server - Vite dev server instance
		*/
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (!varFilename) {
					next();
					return;
				}
				if (req.url?.replace(/\?.*/, "") === (viteConfig.base + varFilename).replace(/^\/?/, "/")) {
					res.setHeader("Content-Type", "text/javascript");
					res.setHeader("Access-Control-Allow-Origin", "*");
					res.end(generateVarRemoteEntry(filename));
				} else next();
			});
		}
	}, {
		name: "module-federation-var-remote-entry",
		enforce: "post",
		/**
		* Initial plugin configuration
		* @param config - Vite config object
		* @param command - Current Vite command (serve/build)
		*/
		config(config) {
			if (!config.build) config.build = {};
		},
		configResolved(config) {
			viteConfig = config;
		},
		/**
		* Generates the module federation "var" remote entry file
		* @param options - Rollup output options
		* @param bundle - Generated bundle assets
		*/
		async generateBundle(_options, bundle) {
			if (!varFilename) return;
			if (!isValidVarName(name)) mfWarn(`Provided remote name "${name}" is not valid for "var" remoteEntry type, thus it's placed in globalThis['${name}'].\nIt may cause problems, so you would better want to use valid var name (see https://www.w3schools.com/js/js_variables.asp).`);
			const remoteEntryFile = findRemoteEntryFile(mfOptions.filename, bundle);
			if (!remoteEntryFile) throw createModuleFederationError(`Couldn't find a remoteEntry chunk file for ${mfOptions.filename}, can't generate varRemoteEntry file`);
			this.emitFile({
				type: "asset",
				fileName: varFilename,
				source: generateVarRemoteEntry(remoteEntryFile)
			});
		}
	}];
	function isValidVarName(name) {
		return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
	}
	/**
	* Generates the final "var" remote entry file
	* @param remoteEntryFile - Path to esm remote entry file
	* @returns Complete "var" remoteEntry.js file source
	*/
	function generateVarRemoteEntry(remoteEntryFile) {
		const { name, varFilename } = mfOptions;
		const isValidName = isValidVarName(name);
		return `
  ${isValidName ? `var ${name};` : ""}
  ${isValidName ? name : `globalThis['${name}']`} = (function () {
    function getScriptUrl() {
      const currentScript = document.currentScript;
      if (!currentScript) {
        console.error("[Module Federation] ${varFilename} script should be called from sync <script> tag (document.currentScript is undefined)")
        return '/';
      }
      return document.currentScript.src.replace(/\\/[^/]*$/, '/');
    }

    const entry = getScriptUrl() + '${remoteEntryFile}';

    return {
      get: (...args) => import(entry).then(m => m.get(...args)),
      init: (...args) => import(entry).then(m => m.init(...args)),
    };
  })();
  `;
	}
};
//#endregion
//#region src/utils/aliasToArrayPlugin.ts
var aliasToArrayPlugin_default = {
	name: "alias-transform-plugin",
	config: (config) => {
		if (!config.resolve) config.resolve = {};
		if (!config.resolve.alias) config.resolve.alias = [];
		const { alias } = config.resolve;
		if (typeof alias === "object" && !Array.isArray(alias)) config.resolve.alias = Object.entries(alias).map(([find, replacement]) => ({
			find,
			replacement
		}));
	}
};
//#endregion
//#region src/utils/controlChunkSanitizer.ts
const FEDERATION_CONTROL_CHUNK_HINTS = [
	"hostInit",
	"virtualExposes",
	"localSharedImportMap"
];
function stripEmptyPreloadCalls(code) {
	const helperImportRegex = /import\s*\{\s*_\s*as\s*([A-Za-z_$][\w$]*)\s*\}\s*from\s*["'][^"']+["']\s*;?/g;
	const helperAliases = [];
	let helperImportMatch;
	while ((helperImportMatch = helperImportRegex.exec(code)) !== null) helperAliases.push(helperImportMatch[1]);
	let nextCode = code;
	for (const alias of helperAliases) {
		const marker = `${alias}(()=>`;
		let start = nextCode.indexOf(marker);
		while (start !== -1) {
			const exprStart = start + marker.length;
			let depth = 0;
			let cursor = exprStart;
			let replacementEnd = -1;
			while (cursor < nextCode.length) {
				const char = nextCode[cursor];
				if (char === "(") depth++;
				else if (char === ")") {
					depth--;
					if (depth < 0) break;
				} else if (depth === 0 && nextCode.startsWith(",[],import.meta.url)", cursor)) {
					replacementEnd = cursor;
					break;
				}
				cursor++;
			}
			if (replacementEnd === -1) {
				start = nextCode.indexOf(marker, start + marker.length);
				continue;
			}
			const expression = nextCode.slice(exprStart, replacementEnd);
			nextCode = nextCode.slice(0, start) + expression + nextCode.slice(replacementEnd + 20);
			start = nextCode.indexOf(marker, start + expression.length);
		}
	}
	nextCode = nextCode.replace(/import\s*["'][^"']*__loadShare__[^"']*["']\s*;?/g, "");
	nextCode = nextCode.replace(helperImportRegex, (statement, local) => {
		return isIdentifierReferenced(local, nextCode.replace(statement, "")) ? statement : "";
	});
	return nextCode;
}
function isFederationControlChunk(fileName, filename) {
	return fileName.includes(filename) || FEDERATION_CONTROL_CHUNK_HINTS.some((hint) => fileName.includes(hint));
}
function sanitizeFederationControlChunk(code, fileName, filename) {
	let nextCode = stripEmptyPreloadCalls(code);
	if (fileName.includes("localSharedImportMap")) {
		const remoteEntryImportRegex = new RegExp(`import\\s*["'][^"']*${escapeRegExp(filename)}["']\\s*;?`, "g");
		nextCode = nextCode.replace(remoteEntryImportRegex, "");
	}
	return nextCode;
}
//#endregion
//#region src/utils/isTestEnv.ts
/**
* Detects whether the current process is running in a test environment
* Set `MFE_VITE_NO_TEST_ENV_CHECK=true` to load federation plugins during tests.
*/
function isTestEnv() {
	if (process.env.MFE_VITE_NO_TEST_ENV_CHECK === "true") return false;
	return process.env.NODE_ENV === "test" || process.env.VITEST != null || process.env.JEST_WORKER_ID != null;
}
//#endregion
//#region src/utils/normalizeOptimizeDeps.ts
var normalizeOptimizeDeps_default = {
	name: "normalizeOptimizeDeps",
	config: (config) => {
		let { optimizeDeps } = config;
		if (!optimizeDeps) {
			config.optimizeDeps = {};
			optimizeDeps = config.optimizeDeps;
		}
		if (!optimizeDeps.include) optimizeDeps.include = [];
		if (!optimizeDeps.exclude) optimizeDeps.exclude = [];
		if (!optimizeDeps.needsInterop) optimizeDeps.needsInterop = [];
	},
	configResolved: (config) => {
		const include = config.optimizeDeps?.include;
		const exclude = config.optimizeDeps?.exclude;
		if (!include?.length || !exclude?.length) return;
		const included = new Set(include);
		config.optimizeDeps.exclude = exclude.filter((dep) => !included.has(dep));
	}
};
//#endregion
//#region src/utils/runtimeCapabilityOptimization.ts
const RUNTIME_CAPABILITIES = [
	{
		option: "disableRemote",
		define: "FEDERATION_OPTIMIZE_NO_REMOTE"
	},
	{
		option: "disableShared",
		define: "FEDERATION_OPTIMIZE_NO_SHARED"
	},
	{
		option: "disableSnapshot",
		define: "FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN"
	}
];
function isEquivalentBooleanDefine(value, expected) {
	return String(value) === JSON.stringify(expected);
}
function applyRuntimeCapabilityDefines(define, options, { defaultDisableSnapshot, onConflict } = {}) {
	for (const capability of RUNTIME_CAPABILITIES) {
		const explicitValue = options[capability.option];
		const desiredValue = capability.option === "disableSnapshot" ? explicitValue ?? defaultDisableSnapshot : explicitValue;
		if (desiredValue === void 0) continue;
		if (!(capability.define in define)) {
			define[capability.define] = JSON.stringify(desiredValue);
			continue;
		}
		if (explicitValue !== void 0 && !isEquivalentBooleanDefine(define[capability.define], explicitValue)) onConflict?.(`${capability.define} define (${define[capability.define]}) differs from ${capability.option} option (${explicitValue}). The existing define will not be overridden.`);
	}
	if (!("FEDERATION_HAS_EXPOSES" in define)) define["FEDERATION_HAS_EXPOSES"] = JSON.stringify(Object.keys(options.exposes).length > 0);
}
function getRuntimeCapabilityConfigurationWarnings(options) {
	const warnings = [];
	if (options.disableRemote && Object.keys(options.remotes).length > 0) warnings.push("disableRemote is true, but remotes are configured. Remote loading will be unavailable at runtime.");
	if (options.disableShared && Object.keys(options.shared).length > 0) warnings.push("disableShared is true, but shared dependencies are configured. Shared dependency loading will be unavailable at runtime.");
	return warnings;
}
//#endregion
//#region src/index.ts
const patchedManualChunks = /* @__PURE__ */ new WeakSet();
const federationGroups = /* @__PURE__ */ new WeakSet();
const PRELOAD_HELPER_CHUNK = "vite-preload-helper";
const PRELOAD_HELPER_TEST = /\0?vite\/preload-helper/;
const MF_GROUP_PRIORITY = 1e6;
const USER_GROUP_MAX_PRIORITY = MF_GROUP_PRIORITY - 1;
function normalizeVinextRscPreloadHints(code) {
	return code.replace(/(:HL\[[^\]\n]*?,)"stylesheet"/g, "$1\"style\"").replace(/(:HL\[[^\]\n]*?,)\\"stylesheet\\"/g, "$1\\\"style\\\"");
}
function ignoreFederationGeneratedFiles(config, options) {
	config.server ??= {};
	const watch = config.server.watch;
	if (watch === false || watch === null) return;
	const watchOptions = watch === true || watch === void 0 ? {} : watch;
	config.server.watch = watchOptions;
	const federationIgnore = (file) => shouldIgnoreFile(file, options);
	const ignored = watchOptions.ignored;
	if (!ignored) {
		watchOptions.ignored = federationIgnore;
		return;
	}
	if (Array.isArray(ignored)) {
		ignored.push(federationIgnore);
		return;
	}
	watchOptions.ignored = [ignored, federationIgnore];
}
function isSharedResolverInternalImporter(importer) {
	return !!importer && (importer.includes("__loadShare__") || importer.includes("__prebuild__"));
}
function isCommonJsImporter(importer) {
	return !!importer && (importer.endsWith(".cjs") || importer.includes("/cjs/"));
}
function isReactDomSelfReference(source, importer) {
	return source === "react-dom" && getPackageNameFromNodeModulePath(importer ?? "") === "react-dom";
}
function isOutputChunk(chunk) {
	return chunk.type === "chunk";
}
function appendResolveAlias(config, alias) {
	const resolve = config.resolve ??= {};
	const existingAlias = resolve.alias;
	if (!existingAlias) {
		resolve.alias = [alias];
		return;
	}
	if (Array.isArray(existingAlias)) {
		existingAlias.push(alias);
		return;
	}
	resolve.alias = [...Object.entries(existingAlias).map(([find, replacement]) => ({
		find,
		replacement
	})), alias];
}
const RUNTIME_INDEX_ENTRY_RE = /^(.*[\\/])index(\.[cm]?js)$/;
const TRAILING_SLASH_RE = /\/$/;
function getRuntimeHelpersImplementation(runtimeImplementation) {
	const indexEntryMatch = RUNTIME_INDEX_ENTRY_RE.exec(runtimeImplementation);
	if (indexEntryMatch) return normalizePathForImport(`${indexEntryMatch[1]}helpers${indexEntryMatch[2]}`);
	const extension = path$1.extname(runtimeImplementation);
	if (extension) return normalizePathForImport(path$1.join(path$1.dirname(runtimeImplementation), `helpers${extension}`));
	if (path$1.isAbsolute(runtimeImplementation) || runtimeImplementation.startsWith(".")) return normalizePathForImport(path$1.join(runtimeImplementation, "helpers"));
	return `${runtimeImplementation.replace(TRAILING_SLASH_RE, "")}/helpers`;
}
const UNSAFE_JS_SOURCE_CHAR_MAP = {
	"<": "\\u003C",
	">": "\\u003E",
	"/": "\\u002F",
	"\\": "\\\\",
	"\b": "\\b",
	"\f": "\\f",
	"\n": "\\n",
	"\r": "\\r",
	"	": "\\t",
	"\0": "\\0",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029"
};
function escapeUnsafeJsSourceChars(str) {
	return str.replace(/[<>/\\\b\f\n\r\t\0\u2028\u2029]/g, (char) => {
		return UNSAFE_JS_SOURCE_CHAR_MAP[char] ?? char;
	});
}
function isFederationHtmlPreloadDependency(dep, includeSharedRuntime = false) {
	const file = path$1.basename(dep);
	if (file.includes("__mfe_internal__") || file.includes("virtual_mf-") || file.includes("virtualExposes") || file.includes("localSharedImportMap") || file.includes("hostInit")) return true;
	return includeSharedRuntime && (file.includes("preload-helper") || file.includes("rolldown-runtime") || file.startsWith("dist-"));
}
function canResolveSharedSubpath(subpath, projectRoot) {
	try {
		return isViteOptimizableEntry(createRequire$1(pathToFileURL(path$1.join(projectRoot, "package.json"))).resolve(subpath));
	} catch (error) {
		if (error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED" && !isBarePackageSubpath(subpath)) {
			const entry = resolveViteImportPackageEntry(subpath, projectRoot);
			return entry !== void 0 && existsSync(entry) && isViteOptimizableEntry(entry);
		}
		return false;
	}
}
const VITE_DEV_IMPORT_CONDITIONS = /* @__PURE__ */ new Set([
	"browser",
	"development",
	"import",
	"module",
	"default"
]);
function resolveConditionalExportTarget(target) {
	if (typeof target === "string") return target;
	if (Array.isArray(target)) {
		for (const candidate of target) {
			const resolved = resolveConditionalExportTarget(candidate);
			if (resolved) return resolved;
		}
		return;
	}
	if (!target || typeof target !== "object") return void 0;
	for (const [condition, candidate] of Object.entries(target)) {
		if (!VITE_DEV_IMPORT_CONDITIONS.has(condition)) continue;
		const resolved = resolveConditionalExportTarget(candidate);
		if (resolved) return resolved;
	}
}
function resolveViteImportPackageEntry(packageName, projectRoot) {
	const installed = getInstalledPackageJson(packageName, { cwd: projectRoot });
	if (!installed) return void 0;
	const exportsField = installed.packageJson.exports;
	let rootExport = exportsField;
	if (exportsField && typeof exportsField === "object" && !Array.isArray(exportsField)) {
		const exportsRecord = exportsField;
		if (Object.keys(exportsRecord).some((key) => key.startsWith("."))) rootExport = exportsRecord["."];
	}
	const target = resolveConditionalExportTarget(rootExport);
	if (!target?.startsWith("./")) return void 0;
	const resolved = path$1.resolve(installed.dir, target);
	const relative = path$1.relative(installed.dir, resolved);
	if (relative.startsWith(`..${path$1.sep}`) || path$1.isAbsolute(relative)) return void 0;
	return resolved;
}
function isBarePackageSubpath(specifier) {
	const segments = specifier.split("/");
	return specifier.startsWith("@") ? segments.length > 2 : segments.length > 1;
}
/**
* Vite's dependency scanner cannot see through the virtual loadShare modules
* generated for shared packages. As a result, dependencies of a linked/shared
* package may be discovered one request at a time and each discovery starts a
* new optimizer pass. Seed the optimizer with the complete dependency graph
* before the first request instead.
*
* Vite then resolves the package's own dependency graph using its normal
* scanner, preserving package and peer-dependency resolution semantics.
*/
function includeLinkedSharedEntries(optimizeDeps, shared, projectRoot, exposes, outDir) {
	const additions = /* @__PURE__ */ new Set();
	const entries = new Set(Array.isArray(optimizeDeps.entries) ? optimizeDeps.entries : optimizeDeps.entries ? [optimizeDeps.entries] : [
		"**/*.html",
		"!**/node_modules/**",
		`!**/${outDir.replace(/\\/g, "/")}/**`,
		"!**/__tests__/**",
		"!**/coverage/**"
	]);
	for (const [packageName, share] of Object.entries(shared ?? {})) {
		if (share?.shareConfig?.import === false) continue;
		const configuredImport = share?.shareConfig?.import;
		if (typeof configuredImport === "string") {
			const entry = path$1.isAbsolute(configuredImport) ? configuredImport : path$1.resolve(projectRoot, configuredImport);
			if (existsSync(entry) && !entry.replaceAll("\\", "/").includes("/node_modules/")) {
				additions.add(entry);
				continue;
			}
		}
		const installed = getInstalledPackageJson(packageName, { cwd: projectRoot });
		if (!installed || installed.dir.replaceAll("\\", "/").includes("/node_modules/")) continue;
		const entry = getInstalledPackageEntry(packageName, { cwd: projectRoot });
		if (entry && existsSync(entry)) additions.add(entry);
	}
	for (const expose of Object.values(exposes ?? {})) {
		const source = expose.import;
		if (source.startsWith(".") || path$1.isAbsolute(source)) {
			const entry = path$1.resolve(projectRoot, source);
			if (existsSync(entry)) additions.add(entry);
		}
	}
	if (additions.size === 0) return;
	for (const entry of additions) entries.add(entry);
	optimizeDeps.entries = [...entries];
}
function stabilizeOptimizeDeps(optimizeDeps) {
	optimizeDeps.include = [...new Set(optimizeDeps.include ?? [])].sort();
	optimizeDeps.exclude = [...new Set(optimizeDeps.exclude ?? [])].sort();
}
function isFile(candidate) {
	try {
		return statSync(candidate).isFile();
	} catch {
		return false;
	}
}
function isReactRouterBuildClientRouteInput(entry) {
	return /[?&]__react-router-build-client-route(?:[=&]|$)/.test(entry);
}
/**
* Files whose JSX the compiler rewrites to an automatic-runtime import.
* Vite only applies the JSX transform to these extensions by default.
*/
const JSX_SOURCE_EXTENSIONS = [".jsx", ".tsx"];
function getAutomaticJsxRuntime(config) {
	for (const candidate of [config.oxc, config.esbuild]) {
		if (!candidate || typeof candidate !== "object") continue;
		const transform = candidate;
		const jsx = transform.jsx;
		const runtime = typeof jsx === "object" ? jsx.runtime : jsx;
		if (runtime && runtime !== "automatic") return void 0;
		if (runtime !== "automatic") continue;
		return `${(typeof jsx === "object" ? jsx.importSource : void 0) ?? transform.jsxImportSource ?? "react"}/${(typeof jsx === "object" ? jsx.development : void 0) ?? transform.jsxDev ?? true ? "jsx-dev-runtime" : "jsx-runtime"}`;
	}
}
function registerEntryImports(options, projectRoot, recordShared = true, entryFiles = []) {
	const sourceExtensions = [
		".mjs",
		".js",
		".mts",
		".ts",
		".jsx",
		".tsx",
		".vue",
		".svelte"
	];
	const root = path$1.resolve(projectRoot);
	const pending = [];
	const visited = /* @__PURE__ */ new Map();
	let hasJsxSource = false;
	const enqueue = (request, importer = path$1.join(root, "index.html"), preloadRemotes = false) => {
		const cleanRequest = request.replace(/[?#].*$/, "");
		if (!cleanRequest.startsWith(".") && !cleanRequest.startsWith("/") && !path$1.isAbsolute(cleanRequest)) return;
		const base = cleanRequest.startsWith("/") ? path$1.resolve(root, `.${cleanRequest}`) : path$1.resolve(path$1.dirname(importer), cleanRequest);
		const relative = path$1.relative(root, base);
		if (relative.startsWith(`..${path$1.sep}`) || path$1.isAbsolute(relative)) return;
		const file = [
			base,
			...sourceExtensions.map((extension) => `${base}${extension}`),
			...sourceExtensions.map((extension) => path$1.join(base, `index${extension}`))
		].find(isFile);
		if (file && (!visited.has(file) || preloadRemotes && !visited.get(file))) pending.push({
			file,
			preloadRemotes
		});
	};
	const htmlEntries = entryFiles.filter((file) => file.endsWith(".html"));
	const htmlEntryPaths = htmlEntries.length ? htmlEntries : entryFiles.length === 0 ? [path$1.join(root, "index.html")] : [];
	for (const htmlEntry of htmlEntryPaths) if (existsSync(htmlEntry)) {
		const html = readFileSync(htmlEntry, "utf8");
		for (const match of html.matchAll(/<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=(['"])([^'"]+)\1)[^>]*>/gi)) enqueue(match[2], htmlEntry, true);
	}
	for (const entry of entryFiles.filter((file) => !file.endsWith(".html"))) {
		const relativeEntry = path$1.relative(root, entry);
		enqueue(relativeEntry.startsWith(".") ? relativeEntry : `./${relativeEntry}`, path$1.join(root, "index.html"), true);
	}
	for (const expose of Object.values(options.exposes ?? {})) enqueue(expose.import);
	while (pending.length) {
		const { file, preloadRemotes } = pending.pop();
		if (visited.get(file) || visited.has(file) && !preloadRemotes) continue;
		visited.set(file, preloadRemotes);
		const code = getScannableModuleSource(file, readFileSync(file, "utf8"));
		if (JSX_SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension))) hasJsxSource = true;
		for (const { source: request, kind, typeOnly } of findModuleImportDescriptors(code)) {
			const isStatic = kind === "static" && !typeOnly;
			const remoteKey = preloadRemotes && isStatic && request ? Object.keys(options.remotes).find((name) => request === name || request.startsWith(`${name}/`)) : void 0;
			const sharedKey = !typeOnly && request && findSharedKey(request, options.shared);
			if (remoteKey) {
				addUsedRemote(remoteKey, request, options);
				markStaticRemote(request, options);
				markPreloadRemote(request, options);
			} else if (sharedKey && recordShared) addUsedShares(request, options);
			else if (request && !typeOnly) enqueue(request, file, preloadRemotes && isStatic);
		}
	}
	return hasJsxSource;
}
function materializeAutomaticJsxRuntime(options, runtime) {
	if (!findSharedKey(runtime, options.shared)) return false;
	addUsedShares(runtime, options);
	const packageName = getPackageName(runtime);
	if (packageName !== runtime && findSharedKey(packageName, options.shared)) addUsedShares(packageName, options);
	return true;
}
/**
* Plugin that runs FIRST to register generated virtual modules in the config hook.
* This prevents 504 "Outdated Optimize Dep" errors by ensuring ids are known
* before Vite's optimization phase.
*/
function createEarlyVirtualModulesPlugin(options) {
	const { shared, remotes } = options;
	const isLitShare = (pkg) => pkg === "lit" || pkg.startsWith("lit/");
	let hasClientJsxSource = false;
	return {
		name: "vite:module-federation-early-init",
		enforce: "pre",
		config(config, { command: _command }) {
			if (_command === "serve") ignoreFederationGeneratedFiles(config, options);
			const root = config.root || process.cwd();
			const buildInput = getBuildInput(config);
			const resolvedConfiguredEntryFiles = (typeof buildInput === "string" ? [buildInput] : Array.isArray(buildInput) ? buildInput : buildInput && typeof buildInput === "object" ? Object.values(buildInput) : []).map((entry) => String(entry)).filter((entry) => !isReactRouterBuildClientRouteInput(entry)).map((entry) => entry.split(/[?#]/)[0]).map((entry) => path$1.isAbsolute(entry) ? entry : path$1.resolve(root, entry));
			resetConcreteSharedImportSourceCache();
			setPackageDetectionCwd(root);
			const isVinext = hasPackageDependency("vinext");
			initVirtualModules(_command, getRemoteEntryId(options), false, options);
			const isRolldown = getIsRolldown(this);
			if (remotes && Object.keys(remotes).length > 0) {
				for (const key of Object.keys(remotes)) ensureUsedRemote(key, options);
				if (_command === "serve") {
					config.optimizeDeps = config.optimizeDeps || {};
					config.optimizeDeps.exclude = config.optimizeDeps.exclude || [];
					config.optimizeDeps.include = config.optimizeDeps.include || [];
					config.optimizeDeps.exclude.push(...Object.keys(remotes || {}));
				}
			}
			if (!config.build?.ssr && (Object.keys(shared ?? {}).length > 0 || Object.keys(remotes ?? {}).length > 0)) {
				const hasJsxSource = registerEntryImports(options, root, _command === "serve", resolvedConfiguredEntryFiles);
				if (_command === "serve") hasClientJsxSource = hasJsxSource;
			}
			if (shared && Object.keys(shared).length > 0) {
				if (_command === "serve") {
					excludeSharedSubDependencies(shared);
					config.optimizeDeps = config.optimizeDeps || {};
					config.optimizeDeps.include = config.optimizeDeps.include || [];
					const optimizeDeps = config.optimizeDeps;
					if (isRolldown) {
						optimizeDeps.rolldownOptions ??= {};
						optimizeDeps.rolldownOptions.plugins ??= [];
						optimizeDeps.rolldownOptions.plugins.push({
							name: "module-federation:optimize-shared-resolver",
							load(id) {
								if (!id.startsWith("module-federation:optimized-require-")) return;
								const sourcePackage = id.slice(36);
								if (sourcePackage !== "react" && sourcePackage !== "react-dom") return;
								const loadSharePath = getLoadShareModulePath(sourcePackage, isRolldown, options);
								const source = JSON.stringify(loadSharePath);
								return "import * as __mfShared from " + source + ";\nexport * from " + source + ";\nexport default __mfShared.default ?? __mfShared;";
							},
							resolveId(source, importer, resolveOptions) {
								if (createViteEncodedIdPrefixRegExp("virtual:mf:").test(source)) return {
									id: source,
									external: true
								};
								if (isSharedResolverInternalImporter(importer)) return;
								const key = findSharedKey(source, shared);
								if (!key) return;
								const importerPackage = getSharedPackageFromFile(importer, shared, root);
								if (!isReactDomSelfReference(source, importer) && (importerPackage === getPackageName(key) || importerPackage && isSharedPackageDependency(key, importerPackage))) return;
								if (isAssetLikeImport(source)) return;
								const shareItem = shared[key];
								const isReactSingleton = source === "react" && key === "react" && shareItem.shareConfig?.singleton === true;
								const isReactRequire = resolveOptions?.kind?.startsWith("require") && isReactSingleton;
								const isReactDomRequire = resolveOptions?.kind?.startsWith("require") && isReactDomSelfReference(source, importer);
								if (resolveOptions?.kind?.startsWith("require") && !isReactRequire && !isReactDomRequire) return;
								if (isCommonJsImporter(importer) && !isReactSingleton && !isReactDomRequire) return;
								if (resolveOptions?.kind !== "entry-point") addUsedShares(source, options);
								if (isReactRequire || isReactDomRequire) {
									writeLoadShareModule(source, shareItem, _command, isRolldown, options);
									if (shareItem.shareConfig?.import !== false) writePreBuildLibPath(source, shareItem, options);
									return { id: `module-federation:optimized-require-${source}` };
								}
								const loadSharePath = getLoadShareModulePath(source, isRolldown, options);
								writeLoadShareModule(source, shareItem, _command, isRolldown, options);
								if (shareItem.shareConfig?.import !== false) writePreBuildLibPath(source, shareItem, options);
								return {
									id: loadSharePath,
									external: true
								};
							}
						});
					} else {
						optimizeDeps.esbuildOptions ??= {};
						optimizeDeps.esbuildOptions.plugins ??= [];
						optimizeDeps.esbuildOptions.plugins.push({
							name: "module-federation:optimize-shared-proxy",
							setup(build) {
								build.onResolve({ filter: createViteEncodedIdPrefixRegExp("virtual:mf:") }, (args) => ({
									path: args.path,
									external: true
								}));
								build.onResolve({ filter: /.*/ }, (args) => {
									if (args.kind === "entry-point") return;
									if (!args.importer || args.namespace === "mf-shared") return;
									if (isSharedResolverInternalImporter(args.importer)) return;
									const key = findSharedKey(args.path, shared);
									if (!key || isAssetLikeImport(args.path)) return;
									const importerPackage = getSharedPackageFromFile(args.importer, shared, root);
									if (importerPackage === getPackageName(args.path) && !isReactDomSelfReference(args.path, args.importer)) return;
									if (importerPackage && isSharedPackageDependency(key, importerPackage)) return;
									addUsedShares(args.path, options);
									if (args.kind === "import-statement" || args.kind === "dynamic-import") {
										const shareItem = shared[key];
										const loadSharePath = getLoadShareModulePath(args.path, isRolldown, options);
										writeLoadShareModule(args.path, shareItem, _command, isRolldown, options);
										if (shareItem.shareConfig?.import !== false) writePreBuildLibPath(args.path, shareItem, options);
										return {
											path: loadSharePath,
											external: true
										};
									}
									return {
										path: args.path,
										namespace: "mf-shared"
									};
								});
								build.onLoad({
									filter: /.*/,
									namespace: "mf-shared"
								}, (args) => {
									const key = findSharedKey(args.path, shared);
									if (!key) return;
									const shareItem = shared[key];
									const loadSharePath = getLoadShareModulePath(args.path, isRolldown, options);
									writeLoadShareModule(args.path, shareItem, _command, isRolldown, options);
									if (shareItem.shareConfig?.import !== false) writePreBuildLibPath(args.path, shareItem, options);
									return {
										loader: "js",
										resolveDir: root,
										contents: `import * as __mfShared from ${JSON.stringify(loadSharePath)};
export * from ${JSON.stringify(loadSharePath)};
export default __mfShared.default ?? __mfShared;`
									};
								});
							}
						});
					}
				}
				for (const key of Object.keys(shared)) {
					const shareItem = shared[key];
					if (key.endsWith("/")) {
						if (_command === "serve" && shareItem.shareConfig?.import !== false) {
							const optimizeDeps = config.optimizeDeps ??= {};
							optimizeDeps.include ??= [];
							optimizeDeps.exclude ??= [];
							for (const subpath of getCommonSharedSubpaths(key)) {
								writePreBuildLibPath(subpath, shareItem, options);
								if (canResolveSharedSubpath(subpath, root)) optimizeDeps.include.push(subpath);
								else optimizeDeps.exclude.push(subpath);
							}
						}
						continue;
					}
					if (isVinext && key === "react") {
						addConfiguredShare(key, options);
						continue;
					}
					getLoadShareModulePath(key, isRolldown, options);
					writeLoadShareModule(key, shareItem, _command, isRolldown, options);
					if (shareItem.shareConfig?.import !== false) writePreBuildLibPath(key, shareItem, options);
					addConfiguredShare(key, options);
					if (_command === "serve" && shareItem.shareConfig?.import !== false) {
						const optimizeDeps = config.optimizeDeps ??= {};
						optimizeDeps.include ??= [];
						optimizeDeps.exclude ??= [];
						const shouldBypassOptimizeDep = isLitShare(key) || !canResolveSharedSubpath(key, root);
						if (optimizeDeps.include.includes(key)) optimizeDeps.exclude = optimizeDeps.exclude.filter((dep) => dep !== key);
						else if (shouldBypassOptimizeDep || optimizeDeps.exclude.includes(key)) optimizeDeps.exclude.push(key);
						else optimizeDeps.include.push(key);
						for (const subpath of getCommonSharedSubpaths(key)) {
							const canResolveSubpath = canResolveSharedSubpath(subpath, root);
							if ([
								"react/compiler-runtime",
								"react-dom/client",
								"react-dom/profiling"
							].includes(subpath) && !canResolveSubpath) {
								optimizeDeps.exclude.push(subpath);
								continue;
							}
							getLoadShareModulePath(subpath, isRolldown, options);
							writeLoadShareModule(subpath, shareItem, _command, isRolldown, options);
							writePreBuildLibPath(subpath, shareItem, options);
							addConfiguredShare(subpath, options);
							if (canResolveSubpath) {
								optimizeDeps.include.push(subpath);
								if (key === "react-dom") optimizeDeps.include.push(`${key} > ${subpath}`);
							} else optimizeDeps.exclude.push(subpath);
						}
					}
				}
				writeLocalSharedImportMap(options);
			}
			if (_command === "serve") {
				config.optimizeDeps ??= {};
				includeLinkedSharedEntries(config.optimizeDeps, shared, root, options.exposes, config.build?.outDir ?? "dist");
				stabilizeOptimizeDeps(config.optimizeDeps);
			}
		},
		configResolved(config) {
			if (hasClientJsxSource) {
				const automaticJsxRuntime = getAutomaticJsxRuntime(config);
				if (automaticJsxRuntime && materializeAutomaticJsxRuntime(options, automaticJsxRuntime)) writeLocalSharedImportMap(options);
			}
			const viteMajor = parseInt(version, 10);
			const hasRemotes = Object.keys(options.remotes).length > 0;
			if (!getSsrCapabilities(viteMajor, config.command, hasRemotes).injectSsrEntryLoader) return;
			if (options.runtimePlugins.some((p) => {
				return (typeof p === "string" ? p : p[0]) === "@module-federation/vite/ssrEntryLoader";
			})) return;
			const projectRequire = createRequire$1(pathToFileURL(path$1.join(config.root, "package.json")));
			const sharedKeys = Object.keys(options.shared ?? {});
			const commonSharedPkgs = [
				"react",
				"react-dom",
				"react/jsx-runtime",
				"react/jsx-dev-runtime",
				"react/compiler-runtime",
				"@module-federation/runtime",
				"@module-federation/runtime-core",
				"@module-federation/sdk"
			];
			const resolvedShared = {};
			for (const pkg of [...commonSharedPkgs, ...sharedKeys]) try {
				resolvedShared[pkg] = projectRequire.resolve(pkg);
			} catch {
				try {
					resolvedShared[pkg] = resolveImportPath(pkg);
				} catch {}
			}
			const ssrEntryLoaderSpecifier = SSR_ENTRY_LOADER_SPECIFIER;
			try {
				resolveImportPath(ssrEntryLoaderSpecifier);
				options.runtimePlugins.push([ssrEntryLoaderSpecifier, { resolvedShared }]);
			} catch {}
		}
	};
}
function applyBuildTimeRuntimeDefines(define, options, { target, isAstro, defaultDisableSnapshot }) {
	const envTargetDefineValue = !options.target && isAstro ? "undefined" : JSON.stringify(target);
	if (!("ENV_TARGET" in define)) define.ENV_TARGET = envTargetDefineValue;
	applyRuntimeCapabilityDefines(define, options, {
		defaultDisableSnapshot,
		onConflict: mfWarn
	});
	if (options.target && define.ENV_TARGET !== JSON.stringify(options.target)) mfWarn(`ENV_TARGET define (${define.ENV_TARGET}) differs from target option ("${options.target}"). ENV_TARGET will not be overridden.`);
}
function loadPluginDts(options) {
	if (options.dts === false) return [];
	return [import("./pluginDts-4sHIZPIi.js").then(({ default: pluginDts }) => pluginDts(options))];
}
const INJECT_EXTERNAL_RUNTIME_CORE_PLUGIN = "@module-federation/vite/injectExternalRuntimeCorePlugin";
function isInjectExternalRuntimeCorePlugin(specifier) {
	return specifier === INJECT_EXTERNAL_RUNTIME_CORE_PLUGIN || specifier.includes("injectExternalRuntimeCorePlugin") || specifier.includes("inject-external-runtime-core-plugin");
}
function hasInjectExternalRuntimeCorePlugin(runtimePlugins) {
	return runtimePlugins.some((plugin) => {
		return isInjectExternalRuntimeCorePlugin(typeof plugin === "string" ? plugin : plugin[0]);
	});
}
function resolveInjectExternalRuntimeCorePlugin() {
	try {
		return normalizePathForImport(resolveImportPath(INJECT_EXTERNAL_RUNTIME_CORE_PLUGIN));
	} catch {
		for (const rel of ["./utils/injectExternalRuntimeCorePlugin.js", "./utils/injectExternalRuntimeCorePlugin.ts"]) {
			const candidate = fileURLToPath(new URL(rel, import.meta.url));
			if (existsSync(candidate)) return normalizePathForImport(candidate);
		}
		return INJECT_EXTERNAL_RUNTIME_CORE_PLUGIN;
	}
}
function applyExternalRuntimeExperiments(options) {
	const { experiments } = options;
	if (experiments.provideExternalRuntime) {
		if (Object.keys(options.exposes).length > 0) throw createModuleFederationError("You can only set provideExternalRuntime: true in pure consumer which not expose modules.");
		if (!hasInjectExternalRuntimeCorePlugin(options.runtimePlugins)) options.runtimePlugins = options.runtimePlugins.concat(resolveInjectExternalRuntimeCorePlugin());
	}
}
function federation(mfUserOptions) {
	if (isTestEnv()) return [];
	const options = normalizeModuleFederationOptions(mfUserOptions);
	applyExternalRuntimeExperiments(options);
	const isVinext = hasPackageDependency("vinext");
	const { name, shared, filename, hostInitInjectLocation } = options;
	const hasTreeShakingShared = Object.values(shared).some((share) => !!share.shareConfig.treeShaking);
	if (!name) throw createModuleFederationError("name is required");
	const remoteEntryId = getRemoteEntryId(options);
	const virtualExposesId = getVirtualExposesId(options);
	const moduleParseController = createModuleParseController();
	const moduleParsePlugins = pluginModuleParseEnd_default((id) => {
		return id.includes(getHostAutoInitPath(options)) || id.includes(getPendingSharesPath(options)) || id.includes(remoteEntryId) || id.includes(virtualExposesId) || id.includes("virtual:mf-localSharedImportMap") || id.includes("__loadShare__") || id.includes("__prebuild__") || id.includes("__treeShakingProvider__") || id.includes("__mf_tree_shaking_graph__");
	}, {
		moduleParseTimeout: options.moduleParseTimeout,
		moduleParseIdleTimeout: options.moduleParseIdleTimeout,
		exposedModuleImports: Object.values(options.exposes).map((expose) => expose.import)
	}, moduleParseController);
	let command;
	let desiredRolldownOutput;
	let isSsrBuild = false;
	let isProduction = false;
	let rootResolveConditions;
	let ssrResolveConditions;
	let ssrTarget = "node";
	const emittedRuntimeCapabilityWarnings = /* @__PURE__ */ new Set();
	const getLoadHookExportConditions = (context, loadOptions) => {
		const environment = context.environment;
		const isSsr = loadOptions?.ssr === true || isSsrBuild || environment?.config?.consumer === "server" || Boolean(environment?.config?.build?.ssr) || environment?.name === "ssr" || environment?.name === "server";
		return getSharedExportConditions({
			environmentConditions: environment?.config?.resolve?.conditions,
			isProduction: environment?.config?.isProduction ?? isProduction,
			isSsr,
			rootConditions: rootResolveConditions,
			ssrConditions: ssrResolveConditions,
			ssrTarget
		});
	};
	const refreshLoadRemoteModuleForEnvironment = (id, context, loadOptions) => refreshRemoteModuleForEnvironment(id, options, getLoadHookExportConditions(context, loadOptions));
	const refreshPreBuildModuleForEnvironment = (id, context, loadOptions) => {
		const pkg = getCachedPreBuildPkg(id);
		if (!pkg) return "not-applicable";
		const key = findSharedKey(pkg, shared);
		if (!key) return "not-applicable";
		const requestedModule = VirtualModule.findById(id);
		const ownedModule = VirtualModule.findById(getPreBuildLibImportId(pkg, options));
		if (!requestedModule || requestedModule !== ownedModule) return "not-owned";
		writePreBuildLibPath(pkg, shared[key], options, getLoadHookExportConditions(context, loadOptions));
		return "refreshed";
	};
	const refreshLoadShareModuleForEnvironment = (id, context, loadOptions, importFalseExportUsage) => {
		const pkg = getCachedLoadSharePkg(id);
		if (!pkg) return "not-applicable";
		const key = findSharedKey(pkg, shared);
		if (!key) return "not-applicable";
		const requestedModule = VirtualModule.findById(id);
		const ownedModule = VirtualModule.findById(getLoadShareModulePath(pkg, false, options));
		if (!requestedModule || requestedModule !== ownedModule) return "not-owned";
		writeLoadShareModule(pkg, shared[key], command, getIsRolldown(context), options, getLoadHookExportConditions(context, loadOptions), importFalseExportUsage);
		return "refreshed";
	};
	const getCompleteImportFalseExportUsage = (id) => {
		if (command !== "build") return void 0;
		const pkg = getCachedLoadSharePkg(id);
		if (!pkg) return void 0;
		const key = findSharedKey(pkg, shared);
		if (!key || shared[key].shareConfig.import !== false) return void 0;
		return moduleParseController.parsePromise.then((completion) => {
			if (!completion.complete) {
				if (!moduleParseController.discardWarned) {
					moduleParseController.discardWarned = true;
					mfWarn(`import: false shared export analysis was discarded (reason: ${completion.reason}) — falling back to the complete export surface, so shared consumers keep every detected named export.` + (completion.reason === "idle-timeout" || completion.reason === "timeout" ? " If the build is simply slow, increasing moduleParseIdleTimeout may let the analysis finish." : ""));
				}
				return;
			}
			return getSharedExportUsage(pkg, shared[key], key, options);
		});
	};
	return [
		{
			name: "vite:module-federation-virtual-modules",
			enforce: "pre",
			configureServer(server) {
				server.watcher.on("change", invalidateSharedExportInspectionCache);
				server.watcher.on("add", invalidateSharedExportInspectionCache);
				server.watcher.on("unlink", invalidateSharedExportInspectionCache);
			},
			resolveId(id) {
				if (id === "@module-federation/vite/ssrEntryLoader") return resolveImportPath(id);
				let virtualModule = VirtualModule.findById(id);
				if (!virtualModule) {
					materializeCachedLoadShareModule({
						id,
						shared: options.shared,
						command,
						isRolldown: getIsRolldown(this),
						findSharedKey,
						addUsedShares: (pkg) => addUsedShares(pkg, options),
						writeLocalSharedImportMap: () => writeLocalSharedImportMap(options),
						federationOptions: options
					});
					virtualModule = VirtualModule.findById(id) ?? findCurrentLoadShareForStaleOwnerId(id, options.shared, findSharedKey, options);
				}
				if (!virtualModule) return;
				return virtualModule.getResolvedId();
			},
			load(id, loadOptions) {
				if (id.includes("__loadRemote__") && !refreshLoadRemoteModuleForEnvironment(id, this, loadOptions)) return;
				if (command !== "build" && id.includes("__loadShare__")) {
					id = findCurrentLoadShareForStaleOwnerId(id, options.shared, findSharedKey, options)?.getResolvedId() ?? id;
					if (refreshLoadShareModuleForEnvironment(id, this, loadOptions) === "not-owned") return;
				}
				if (id.includes("__prebuild__") && refreshPreBuildModuleForEnvironment(id, this, loadOptions) === "not-owned") return;
				if (id.includes("__H_A_I__") && isOwnedHostAutoInitId(id, options)) refreshHostAutoInit(options, getLoadHookExportConditions(this, loadOptions));
				if (id.includes("__P_S__") && isOwnedPendingSharesId(id, options)) refreshPendingShares(options);
				const virtualModule = VirtualModule.findById(id);
				if (!virtualModule) return;
				if (command === "build" && (id.includes("__loadShare__") || id.includes("__loadRemote__"))) return;
				return virtualModule.code;
			}
		},
		...options.experiments.externalRuntime ? [pluginExternalRuntimeCore()] : [],
		createEarlyVirtualModulesPlugin(options),
		...isVinext ? [{
			name: "module-federation-vinext-react-server-build-alias",
			apply: "build",
			enforce: "pre",
			resolveId(id) {
				const reactServerEntryMap = {
					"react/jsx-runtime": "react/cjs/react-jsx-runtime.production.js",
					"react/jsx-dev-runtime": "react/cjs/react-jsx-dev-runtime.production.js",
					"react/compiler-runtime": "react/cjs/react-compiler-runtime.production.js"
				};
				if (!(id in reactServerEntryMap)) return;
				const environmentName = this.environment?.name;
				if (!environmentName || environmentName === "client") return;
				const target = reactServerEntryMap[id];
				const reactPackageJson = createRequire$1(pathToFileURL(path$1.join(process.cwd(), "package.json"))).resolve("react/package.json");
				return path$1.join(path$1.dirname(reactPackageJson), target.replace(/^react\//, ""));
			}
		}] : [],
		{
			name: "vite:module-federation-config",
			enforce: "pre",
			config(_config, env) {
				command = env.command;
			},
			configResolved(config) {
				rootResolveConditions = config.resolve?.conditions ? [...config.resolve.conditions] : void 0;
				ssrResolveConditions = config.ssr?.resolve?.conditions ? [...config.ssr.resolve.conditions] : void 0;
				ssrTarget = config.ssr?.target ?? "node";
				isProduction = config.isProduction;
				const ssrCapabilities = getSsrCapabilities(parseInt(version, 10), command, Object.keys(options.remotes).length > 0);
				initVirtualModules(command, remoteEntryId, ssrCapabilities.enableSsrInitBootstrap, options);
			}
		},
		aliasToArrayPlugin_default,
		checkAliasConflicts({ shared }),
		normalizeOptimizeDeps_default,
		...loadPluginDts(options),
		pluginDevRemoteHmr(options),
		{
			name: "mf:normalize-entry-chunks",
			enforce: "pre",
			apply: "build",
			generateBundle(_options, bundle) {
				for (const chunk of Object.values(bundle)) {
					if (typeof chunk !== "object" || chunk === null || chunk.type !== "chunk" || !chunk.isEntry) continue;
					const facadeId = chunk.facadeModuleId ?? "";
					if (facadeId.includes("__mf__virtual") || facadeId.startsWith("virtual:mf-") || facadeId.startsWith("virtual:mf:") || facadeId.startsWith("\0virtual:mf-") || facadeId.startsWith("\0virtual:mf:")) chunk.isEntry = false;
				}
			}
		},
		...addEntry({
			entryName: "remoteEntry",
			entryPath: remoteEntryId,
			fileName: filename,
			federationOptions: options
		}),
		...addEntry({
			entryName: "hostInit",
			entryPath: () => getHostAutoInitPath(options),
			inject: hostInitInjectLocation,
			forceClientInjected: Object.keys(options.exposes).length > 0,
			skipTransformFor: Object.values(options.exposes).map((expose) => expose.import),
			federationOptions: options
		}),
		...addEntry({
			entryName: "virtualExposes",
			entryPath: virtualExposesId,
			federationOptions: options
		}),
		pluginProxyRemoteEntry_default({
			options,
			remoteEntryId,
			virtualExposesId,
			getParsePromise: () => moduleParseController.parsePromise
		}),
		pluginProxyRemotes_default(options),
		pluginRemoteNamedExports(options),
		...moduleParsePlugins,
		...proxySharedModule({
			shared,
			federationOptions: options,
			getParsePromise: () => moduleParseController.parsePromise
		}),
		{
			name: "module-federation-esm-shims",
			enforce: "pre",
			apply: "build",
			config(config) {
				isSsrBuild = Boolean(config.build?.ssr);
				const runtimeInitId = getRuntimeInitStatusImportId(options);
				config.build = config.build || {};
				if (config.build.modulePreload !== false) {
					const currentModulePreload = config.build.modulePreload && typeof config.build.modulePreload === "object" ? config.build.modulePreload : {};
					const existingResolveDependencies = currentModulePreload.resolveDependencies;
					config.build.modulePreload = {
						...currentModulePreload,
						resolveDependencies(filename, deps, context) {
							const resolvedDeps = existingResolveDependencies ? existingResolveDependencies(filename, deps, context) : deps;
							const hostFile = path$1.basename(context.hostId);
							if (context.hostType === "js" && (hostFile === options.filename || hostFile.includes("hostInit") || hostFile.includes("virtualExposes") || hostFile.includes("localSharedImportMap"))) return [];
							const hasFederationHtmlDeps = context.hostType === "html" && resolvedDeps.some((dep) => isFederationHtmlPreloadDependency(dep));
							const hasFederationJsDeps = context.hostType === "js" && resolvedDeps.some((dep) => isFederationHtmlPreloadDependency(dep));
							const treeShakingFallbackDeps = hasTreeShakingShared ? (dep) => dep.includes("__prebuild__") : () => false;
							return hasFederationHtmlDeps || hasFederationJsDeps ? resolvedDeps.filter((dep) => !isFederationHtmlPreloadDependency(dep, true) && !treeShakingFallbackDeps(dep)) : resolvedDeps.filter((dep) => !treeShakingFallbackDeps(dep));
						}
					};
				}
				let warnedAboutCodeSplitting = false;
				const ensureCodeSplitting = (output) => {
					if (output?.codeSplitting !== false) return;
					delete output.codeSplitting;
					if (warnedAboutCodeSplitting) return;
					warnedAboutCodeSplitting = true;
					mfWarn("Ignoring `output.codeSplitting = false` because module federation requires chunk splitting.");
				};
				const isFederationGroup = (group) => typeof group === "object" && group !== null && federationGroups.has(group);
				let warnedAboutGroupPriority = false;
				const clampUserGroup = (group) => {
					const candidate = group;
					if (typeof candidate?.priority !== "number") return group;
					if (candidate.priority <= USER_GROUP_MAX_PRIORITY) return group;
					if (!warnedAboutGroupPriority) {
						warnedAboutGroupPriority = true;
						mfWarn(`Clamping \`output.codeSplitting.groups\` priority to ${USER_GROUP_MAX_PRIORITY} — module federation groups must keep the highest priority so shared dependency init wrappers stay isolated in their own chunks.`);
					}
					return {
						...candidate,
						priority: USER_GROUP_MAX_PRIORITY
					};
				};
				let warnedAboutManualChunks = false;
				let warnedAboutObjectManualChunks = false;
				const applyManualChunks = (output, useCodeSplitting) => {
					ensureCodeSplitting(output);
					const isPatchedByPlugin = typeof output.manualChunks === "function" && patchedManualChunks.has(output.manualChunks);
					const mfChunkName = function(id) {
						if (id.includes(runtimeInitId) || id.includes("__mf_v__runtimeInit__mf_v__")) return "runtimeInit";
						if (id.includes("__loadShare__")) {
							const match = id.match(/([^/\\]+__loadShare__[^/\\]+)/);
							return match ? match[1] : "loadShare";
						}
						return null;
					};
					patchedManualChunks.add(mfChunkName);
					if (!useCodeSplitting) {
						if (isPatchedByPlugin) return;
						const userManualChunks = output.manualChunks;
						if (userManualChunks && typeof userManualChunks !== "function" && !warnedAboutObjectManualChunks) {
							warnedAboutObjectManualChunks = true;
							mfWarn("Ignoring the object form of `output.manualChunks` because module federation cannot safely compose with it. Use the function form instead: federation modules are claimed first and your function runs for everything else.");
						}
						const mfManualChunks = function(id, ...rest) {
							if (PRELOAD_HELPER_TEST.test(id)) return PRELOAD_HELPER_CHUNK;
							const mfChunk = mfChunkName(id);
							if (mfChunk) return mfChunk;
							if (typeof userManualChunks === "function") return userManualChunks(id, ...rest) ?? void 0;
						};
						patchedManualChunks.add(mfManualChunks);
						output.manualChunks = mfManualChunks;
						return;
					}
					if (output.manualChunks && !isPatchedByPlugin && !warnedAboutManualChunks) {
						warnedAboutManualChunks = true;
						mfWarn("Ignoring `output.manualChunks` for the Rolldown build because module federation manages chunking with `output.codeSplitting.groups`. Move your grouping there — user groups are kept below the federation groups.");
					}
					const existingGroups = output.codeSplitting && typeof output.codeSplitting === "object" ? output.codeSplitting.groups : void 0;
					const userGroups = Array.isArray(existingGroups) ? existingGroups.filter((group) => !isFederationGroup(group)).map(clampUserGroup) : [];
					const mfPreloadGroup = {
						name: PRELOAD_HELPER_CHUNK,
						test: PRELOAD_HELPER_TEST,
						priority: 1000001
					};
					const mfNameGroup = {
						name: mfChunkName,
						priority: MF_GROUP_PRIORITY
					};
					federationGroups.add(mfPreloadGroup);
					federationGroups.add(mfNameGroup);
					const groups = [
						mfPreloadGroup,
						mfNameGroup,
						...userGroups
					];
					output.codeSplitting = {
						...output.codeSplitting || {},
						groups
					};
					delete output.manualChunks;
				};
				config.build.rollupOptions = config.build.rollupOptions || {};
				const rollupOutput = config.build.rollupOptions.output;
				if (Array.isArray(rollupOutput)) rollupOutput.forEach((output) => applyManualChunks(output, false));
				else applyManualChunks(config.build.rollupOptions.output ||= {}, false);
				const buildWithRolldown = config.build;
				buildWithRolldown.rolldownOptions = buildWithRolldown.rolldownOptions || {};
				const rolldownOutput = buildWithRolldown.rolldownOptions.output;
				const snapshotRolldownOutput = (output) => ({
					entryFileNames: output.entryFileNames,
					chunkFileNames: output.chunkFileNames,
					assetFileNames: output.assetFileNames
				});
				if (Array.isArray(rolldownOutput)) {
					rolldownOutput.forEach((output) => applyManualChunks(output, true));
					desiredRolldownOutput = rolldownOutput.map((output) => snapshotRolldownOutput(output));
				} else {
					applyManualChunks(buildWithRolldown.rolldownOptions.output ||= {}, true);
					desiredRolldownOutput = [snapshotRolldownOutput(buildWithRolldown.rolldownOptions.output)];
				}
			},
			async buildApp(builder) {
				const desiredOutput = desiredRolldownOutput;
				if (!desiredOutput) return;
				const applyRolldownOutput = (output, restoredOutput) => {
					if (!output || !restoredOutput) return;
					if (restoredOutput.entryFileNames !== void 0) output.entryFileNames = restoredOutput.entryFileNames;
					if (restoredOutput.chunkFileNames !== void 0) output.chunkFileNames = restoredOutput.chunkFileNames;
					if (restoredOutput.assetFileNames !== void 0) output.assetFileNames = restoredOutput.assetFileNames;
				};
				for (const environment of Object.values(builder.environments)) {
					const getRolldownOptions = environment.getRolldownOptions;
					if (typeof getRolldownOptions !== "function") continue;
					environment.getRolldownOptions = async () => {
						const rolldownOptions = await getRolldownOptions.call(environment);
						if (Array.isArray(rolldownOptions.output)) rolldownOptions.output.forEach((output, index) => {
							applyRolldownOutput(output, desiredOutput[index]);
						});
						else {
							rolldownOptions.output ||= {};
							applyRolldownOutput(rolldownOptions.output, desiredOutput[0]);
						}
						return rolldownOptions;
					};
				}
			},
			load(id, loadOptions) {
				if (id.includes("__loadShare__") && id.endsWith("?commonjs-proxy")) {
					const target = id.slice(id.startsWith("\0") ? 1 : 0, -15);
					return `export { __moduleExports as default } from ${JSON.stringify(target)};`;
				}
				const loadVirtualModule = (importFalseExportUsage) => {
					if (!id.includes("__loadShare__") && !id.includes("__loadRemote__")) return;
					if (id.includes("__loadRemote__") && !refreshLoadRemoteModuleForEnvironment(id, this, loadOptions)) return;
					if (id.includes("__loadShare__") && refreshLoadShareModuleForEnvironment(id, this, loadOptions, importFalseExportUsage) === "not-owned") return;
					const virtualModule = VirtualModule.findById(id);
					if (!virtualModule?.code) return null;
					let code = virtualModule.code;
					const environmentName = this.environment?.name;
					if (environmentName && environmentName !== "client" || !environmentName && isSsrBuild) code = prependWorkspaceSingletonSsrImport(code);
					code = code.replace(/import\s+["'][^"']*__prebuild__[^"']*["']\s*;?/g, "");
					code = code.replace(/export\s+\*\s+from\s+["'][^"']*__prebuild__[^"']*["']\s*;?/g, "");
					if (!(/\b(?:var|let|const)\s+__moduleExports\b/.test(code) || /\bexport\s+const\s+__moduleExports\b/.test(code) || /\bexport\s*\{[^}]*__moduleExports/.test(code))) {
						const nextCode = code.replace("export default exportModule", "export const __moduleExports = exportModule;\nexport default exportModule.__esModule ? exportModule.default : exportModule");
						code = nextCode === code ? `${code}\nexport const __moduleExports = exportModule;\n` : nextCode;
					}
					if (getIsRolldown(this)) return { code };
					return {
						code,
						syntheticNamedExports: "__moduleExports"
					};
				};
				const pendingImportFalseExportUsage = id.includes("__loadShare__") ? getCompleteImportFalseExportUsage(id) : void 0;
				if (pendingImportFalseExportUsage) return pendingImportFalseExportUsage.then(loadVirtualModule);
				return loadVirtualModule();
			},
			generateBundle(_outputOptions, bundle, _isWrite) {
				for (const [fileName, chunk] of Object.entries(bundle)) {
					if (!isOutputChunk(chunk)) continue;
					if (!isFederationControlChunk(fileName, filename)) continue;
					chunk.code = sanitizeFederationControlChunk(chunk.code, fileName, filename);
				}
				const proxyChunks = collectLoadShareProxyChunks(bundle, LOAD_SHARE_TAG);
				if (proxyChunks.size > 0) {
					const systemProxyInfo = collectSystemProxyInfos(proxyChunks, LOAD_SHARE_TAG);
					for (const [fileName, chunk] of Object.entries(bundle)) {
						if (!isOutputChunk(chunk)) continue;
						if (proxyChunks.has(fileName)) continue;
						let code = chunk.code;
						if (!fileName.includes("__loadShare__")) code = rewriteEsmProxyConsumers(code, proxyChunks);
						code = rewriteSystemProxyConsumers(code, systemProxyInfo);
						if (code !== chunk.code) chunk.code = code;
					}
				}
			}
		},
		{
			name: "module-federation-strip-empty-preload-helper",
			enforce: "post",
			apply: "build",
			renderChunk(code, chunk) {
				if (!isFederationControlChunk(chunk.fileName, filename)) return;
				const nextCode = sanitizeFederationControlChunk(code, chunk.fileName, filename);
				return nextCode === code ? null : {
					code: nextCode,
					map: null
				};
			},
			writeBundle(outputOptions, bundle) {
				if (!outputOptions.dir) return;
				for (const chunk of Object.values(bundle)) {
					if (!isOutputChunk(chunk)) continue;
					if (!isFederationControlChunk(chunk.fileName, filename)) continue;
					const outputPath = path$1.join(outputOptions.dir, chunk.fileName);
					writeFileSync(outputPath, sanitizeFederationControlChunk(readFileSync(outputPath, "utf-8"), chunk.fileName, filename));
				}
			}
		},
		{
			name: "module-federation-vite",
			enforce: "post",
			_options: options,
			config(config, { command: _command }) {
				const isRolldown = getIsRolldown(this);
				isSsrBuild = _command === "build" && Boolean(config.build?.ssr);
				const needsRuntimeHelpers = Object.keys(options.shared ?? {}).length > 0;
				if (needsRuntimeHelpers) appendResolveAlias(config, {
					find: /^@module-federation\/runtime\/helpers$/,
					replacement: getRuntimeHelpersImplementation(options.implementation)
				});
				appendResolveAlias(config, {
					find: /^@module-federation\/runtime$/,
					replacement: options.implementation
				});
				config.build ||= {};
				config.build.commonjsOptions ||= {};
				config.build.commonjsOptions.strictRequires ??= "auto";
				config.optimizeDeps ||= {};
				config.optimizeDeps.include ||= [];
				config.optimizeDeps.include.push("@module-federation/runtime");
				if (needsRuntimeHelpers) config.optimizeDeps.include.push("@module-federation/runtime/helpers");
				options.runtimePlugins.forEach((p) => {
					const pluginPath = typeof p === "string" ? p : p[0];
					if (SSR_ONLY_RUNTIME_PLUGINS.has(pluginPath)) return;
					if (pluginPath && !pluginPath.startsWith(".") && !pluginPath.startsWith("/") && !pluginPath.startsWith("\0") && !pluginPath.startsWith("virtual:")) {
						let optimizeDep = pluginPath;
						if (pluginPath === "@module-federation/dts-plugin/dynamic-remote-type-hints-plugin") try {
							optimizeDep = normalizePathForImport(resolveImportPath(pluginPath));
						} catch {
							optimizeDep = pluginPath;
						}
						config.optimizeDeps.include.push(optimizeDep);
					}
				});
				if (isRolldown) {
					config.build ??= {};
					config.build.target ??= "esnext";
				}
				const isAstro = hasPackageDependency("astro");
				const resolvedTarget = options.target ?? (config.build?.ssr ? "node" : "web");
				if (!config.define) config.define = {};
				applyBuildTimeRuntimeDefines(config.define, options, {
					target: resolvedTarget,
					isAstro,
					defaultDisableSnapshot: resolvedTarget === "node" ? true : void 0
				});
				for (const warning of getRuntimeCapabilityConfigurationWarnings(options)) {
					if (emittedRuntimeCapabilityWarnings.has(warning)) continue;
					emittedRuntimeCapabilityWarnings.add(warning);
					mfWarn(warning);
				}
			},
			configResolved(config) {
				if (!hasPackageDependency("nitro")) return;
				const prematureExit = config.plugins.find((plugin) => plugin.name === "tanstack-build-exit");
				if (prematureExit) prematureExit.closeBundle = void 0;
			},
			configEnvironment(name, config) {
				if (!(config.consumer === "server" || name === "ssr" || name === "server" || config.build?.ssr === true)) return;
				const isAstro = hasPackageDependency("astro");
				config.define = { ...config.define ?? {} };
				applyBuildTimeRuntimeDefines(config.define, options, {
					target: options.target ?? "node",
					isAstro,
					defaultDisableSnapshot: true
				});
			}
		},
		...Manifest(options),
		...pluginSSRRemoteEntry(options),
		...VarRemoteEntry(options),
		{
			name: "module-federation-vinext-fix-rsc-preload-as",
			enforce: "post",
			configureServer(server) {
				if (!hasPackageDependency("vinext")) return;
				server.middlewares.use((req, res, next) => {
					if (!req.headers.accept?.includes("text/html")) {
						next();
						return;
					}
					const chunks = [];
					const end = res.end.bind(res);
					res.write = (chunk) => {
						if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
						return true;
					};
					res.end = (chunk, ...args) => {
						if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
						const body = normalizeVinextRscPreloadHints(Buffer.concat(chunks).toString());
						return end(body, ...args);
					};
					next();
				});
			},
			generateBundle(_, bundle, _isWrite) {
				if (!hasPackageDependency("vinext")) return;
				for (const chunk of Object.values(bundle)) {
					if (!isOutputChunk(chunk)) continue;
					if (!chunk.code.includes("case\"L\"")) continue;
					chunk.code = chunk.code.replace(/case"L":(\w+)=(\w+)\[0\],(\w+)=\2\[1\],\2\.length===3\?(\w+)\.L\(\1,\3,\2\[2\]\):\4\.L\(\1,\3\)/g, "case\"L\":$1=$2[0],$3=$2[1],$3===\"stylesheet\"&&($3=\"style\"),$2.length===3?$4.L($1,$3,$2[2]):$4.L($1,$3)");
				}
			}
		},
		...(function() {
			let disablePreload = false;
			return Object.keys(options.exposes).length > 0 ? [{
				name: "module-federation-fix-preload",
				enforce: "post",
				apply: "build",
				config(_config, { command }) {
					const manifest = options.manifest;
					const getDefaultDisableAssetsAnalyze = (cfgCommand) => cfgCommand === "serve" && (typeof manifest !== "object" || !Object.hasOwn(manifest, "disableAssetsAnalyze"));
					const getConfiguredDisableAssetsAnalyze = (cfgCommand) => {
						if (typeof manifest === "object" && manifest !== null) {
							if (Object.hasOwn(manifest, "disableAssetsAnalyze")) return manifest.disableAssetsAnalyze === true;
						}
						return getDefaultDisableAssetsAnalyze(cfgCommand);
					};
					disablePreload = getConfiguredDisableAssetsAnalyze(command);
				},
				generateBundle(_outputOptions, bundle, _isWrite) {
					if (disablePreload) return;
					for (const chunk of Object.values(bundle)) {
						if (!isOutputChunk(chunk)) continue;
						if (!chunk.code.includes("modulepreload")) continue;
						const chunkDir = path$1.dirname(chunk.fileName);
						const prefixToRoot = chunkDir === "." ? "" : `${normalizePathForImport(path$1.relative(chunkDir, "."))}/`;
						const replacementExpr = prefixToRoot ? `${escapeUnsafeJsSourceChars(JSON.stringify(prefixToRoot))}+$1` : "$1";
						const replacement = `=function($1){return new URL(${replacementExpr},import.meta.url).href}`;
						const replaced = chunk.code.replace(/=\s*\(?(\w+)(?:,\w+)?\)?\s*=>\s*[`"'][./][^`"']*[`"']\s*\+\s*\1/, replacement);
						if (replaced !== chunk.code) {
							chunk.code = replaced;
							continue;
						}
						chunk.code = chunk.code.replace(/=\s*function\((\w+)(?:,\w+)?\)\s*\{\s*return\s*[`"'][./][^`"']*[`"']\s*\+\s*\1;?\s*\}/, replacement);
						chunk.code = chunk.code.replace(/=function\((\w+)(?:,\w+)?\)\{return new URL\("\.\.\/"\+\1,import\.meta\.url\)\.href\}/, replacement);
						chunk.code = chunk.code.replace(/new URL\("\.\.\/"\+(\w+),import\.meta\.url\)\.href/g, `new URL(${replacementExpr},import.meta.url).href`);
					}
				}
			}] : [];
		})()
	];
}
function createModuleFederationConfig(options) {
	return options;
}
//#endregion
export { createModuleFederationConfig, federation };
