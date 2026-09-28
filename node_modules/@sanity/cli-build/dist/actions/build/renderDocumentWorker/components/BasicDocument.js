/**
 * App HTML Document, this is in the _internal package
 * to avoid importing styled-components from sanity package
 */ import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Favicons } from './Favicons.js';
import { GlobalErrorHandler } from './GlobalErrorHandler.js';
import { NoJavascript } from './NoJavascript.js';
const EMPTY_ARRAY = [];
/**
 * This is the equivalent of DefaultDocument for non-studio apps.
 * @internal
 */ export function BasicDocument(props) {
    const { css = EMPTY_ARRAY, entryPath, title } = props;
    return /*#__PURE__*/ _jsxs("html", {
        lang: "en",
        children: [
            /*#__PURE__*/ _jsxs("head", {
                children: [
                    /*#__PURE__*/ _jsx("meta", {
                        charSet: "utf-8"
                    }),
                    /*#__PURE__*/ _jsx("meta", {
                        content: "width=device-width, initial-scale=1, viewport-fit=cover",
                        name: "viewport"
                    }),
                    /*#__PURE__*/ _jsx("meta", {
                        content: "noindex",
                        name: "robots"
                    }),
                    /*#__PURE__*/ _jsx("meta", {
                        content: "same-origin",
                        name: "referrer"
                    }),
                    /*#__PURE__*/ _jsx(Favicons, {}),
                    /*#__PURE__*/ _jsx("title", {
                        children: title || 'Sanity App'
                    }),
                    /*#__PURE__*/ _jsx(GlobalErrorHandler, {}),
                    css.map((href)=>/*#__PURE__*/ _jsx("link", {
                            href: href,
                            rel: "stylesheet"
                        }, href))
                ]
            }),
            /*#__PURE__*/ _jsxs("body", {
                children: [
                    /*#__PURE__*/ _jsx("div", {
                        id: "root"
                    }),
                    /*#__PURE__*/ _jsx("script", {
                        src: entryPath,
                        type: "module"
                    }),
                    /*#__PURE__*/ _jsx(NoJavascript, {})
                ]
            })
        ]
    });
}

//# sourceMappingURL=BasicDocument.js.map