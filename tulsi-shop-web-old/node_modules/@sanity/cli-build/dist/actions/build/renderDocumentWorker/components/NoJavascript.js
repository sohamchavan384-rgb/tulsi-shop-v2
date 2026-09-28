import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const NoJsStyles = `
.sanity-app-no-js__root {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: #fff;
}

.sanity-app-no-js__content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: helvetica, arial, sans-serif;
}
`;
/** @internal */ export function NoJavascript() {
    return /*#__PURE__*/ _jsx("noscript", {
        children: /*#__PURE__*/ _jsx("div", {
            className: "sanity-app-no-js__root",
            children: /*#__PURE__*/ _jsxs("div", {
                className: "sanity-app-no-js__content",
                children: [
                    /*#__PURE__*/ _jsx("style", {
                        type: "text/css",
                        children: NoJsStyles
                    }),
                    /*#__PURE__*/ _jsx("h1", {
                        children: "JavaScript disabled"
                    }),
                    /*#__PURE__*/ _jsxs("p", {
                        children: [
                            "Please ",
                            /*#__PURE__*/ _jsx("a", {
                                href: "https://www.enable-javascript.com/",
                                children: "enable JavaScript"
                            }),
                            " in your browser and reload the page to proceed."
                        ]
                    })
                ]
            })
        })
    });
}

//# sourceMappingURL=NoJavascript.js.map