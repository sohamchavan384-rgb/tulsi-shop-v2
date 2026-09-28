import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Favicons } from './Favicons.js';
import { GlobalErrorHandler } from './GlobalErrorHandler.js';
import { NoJavascript } from './NoJavascript.js';
const globalStyles = `
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-Regular.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 400;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-Italic.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-Medium.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 500;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-MediumItalic.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-SemiBold.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 600;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-SemiBoldItalic.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-Bold.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 700;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-BoldItalic.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 800;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-ExtraBold.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 800;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-ExtraBoldItalic.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 900;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-Black.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 900;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-BlackItalic.woff2") format("woff2");
  }
  html {
    @media (prefers-color-scheme: dark) {
      background-color: #13141b;
    }
    @media (prefers-color-scheme: light) {
      background-color: #ffffff;
    }
  }
  html,
  body,
  #sanity {
    height: 100%;
  }
  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
`;
const EMPTY_ARRAY = [];
/**
 * @internal
 */ export function DefaultDocument(props) {
    const { css = EMPTY_ARRAY, entryPath } = props;
    return /*#__PURE__*/ _jsxs("html", {
        lang: "en",
        children: [
            /*#__PURE__*/ _jsxs("head", {
                children: [
                    /*#__PURE__*/ _jsx("meta", {
                        charSet: "utf-8"
                    }),
                    /*#__PURE__*/ _jsx("meta", {
                        content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
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
                        children: "Sanity Studio"
                    }),
                    /*#__PURE__*/ _jsx(GlobalErrorHandler, {}),
                    css.map((href)=>/*#__PURE__*/ _jsx("link", {
                            href: href,
                            rel: "stylesheet"
                        }, href)),
                    /*#__PURE__*/ _jsx("style", {
                        dangerouslySetInnerHTML: {
                            __html: globalStyles
                        }
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("body", {
                children: [
                    /*#__PURE__*/ _jsx("div", {
                        id: "sanity"
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

//# sourceMappingURL=DefaultDocument.js.map