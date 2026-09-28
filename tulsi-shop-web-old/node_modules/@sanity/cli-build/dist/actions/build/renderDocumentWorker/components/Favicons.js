import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export function Favicons() {
    const base = '/static';
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            /*#__PURE__*/ _jsx("link", {
                href: `${base}/favicon.ico`,
                rel: "icon",
                sizes: "any"
            }),
            /*#__PURE__*/ _jsx("link", {
                href: `${base}/favicon.svg`,
                rel: "icon",
                type: "image/svg+xml"
            }),
            /*#__PURE__*/ _jsx("link", {
                href: `${base}/apple-touch-icon.png`,
                rel: "apple-touch-icon"
            }),
            /*#__PURE__*/ _jsx("link", {
                href: `${base}/manifest.webmanifest`,
                rel: "manifest"
            })
        ]
    });
}

//# sourceMappingURL=Favicons.js.map