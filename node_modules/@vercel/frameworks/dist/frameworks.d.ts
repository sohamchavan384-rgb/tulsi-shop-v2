import { Framework } from './types';
export * from './types';
/**
 * Please note that is extremely important that the `dependency` property needs
 * to reference a CLI. This is needed because you might want (for example) a
 * Gatsby site that is powered by Preact, so you can't look for the `preact`
 * dependency.  Instead, you need to look for `preact-cli` when optimizing Preact
 * CLI projects.
 */
export declare const frameworks: readonly [{
    readonly name: "Blitz.js (Legacy)";
    readonly slug: "blitzjs";
    readonly demo: "https://blitz-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/blitz.svg";
    readonly tagline: "Blitz.js: The Fullstack React Framework";
    readonly description: "A brand new Blitz.js app - the result of running `npx blitz@0.45.4 new`.";
    readonly website: "https://blitzjs.com";
    readonly envPrefix: "NEXT_PUBLIC_";
    readonly useRuntime: {
        readonly src: "package.json";
        readonly use: "@vercel/next";
    };
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "blitz.config.js";
        }, {
            readonly path: "blitz.config.ts";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `blitz build`";
            readonly value: "blitz build";
        };
        readonly devCommand: {
            readonly value: "blitz start";
        };
        readonly outputDirectory: {
            readonly placeholder: "Next.js default";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Next.js";
    readonly slug: "nextjs";
    readonly demo: "https://nextjs-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/next.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/next-dark.svg";
    readonly screenshot: "https://py8fhxnkzwtsqdo9.public.blob.vercel-storage.com/front/import/nextjs.png";
    readonly tagline: "Next.js makes you productive with React instantly — whether you want to build static or dynamic sites.";
    readonly description: "A Next.js app and a Serverless Function API.";
    readonly website: "https://nextjs.org";
    readonly sort: 1;
    readonly envPrefix: "NEXT_PUBLIC_";
    readonly useRuntime: {
        readonly src: "package.json";
        readonly use: "@vercel/next";
    };
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "next";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `next build`";
            readonly value: "next build";
        };
        readonly devCommand: {
            readonly value: "next dev --port $PORT";
            readonly placeholder: "next";
        };
        readonly outputDirectory: {
            readonly placeholder: "Next.js default";
        };
    };
    readonly recommendedIntegrations: readonly [{
        readonly id: "oac_5lUsiANun1DEzgLg0NZx5Es3";
        readonly dependencies: readonly ["next-plugin-sentry", "next-sentry-source-maps"];
    }];
    readonly getOutputDirName: () => Promise<string>;
    readonly cachePattern: ".next/cache/**";
}, {
    readonly name: "Gatsby.js";
    readonly slug: "gatsby";
    readonly demo: "https://gatsby.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/gatsby.svg";
    readonly tagline: "Gatsby helps developers build blazing fast websites and apps with React.";
    readonly description: "A Gatsby starter app with an API Route.";
    readonly website: "https://gatsbyjs.org";
    readonly sort: 5;
    readonly envPrefix: "GATSBY_";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "gatsby";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `gatsby build`";
            readonly value: "gatsby build";
        };
        readonly devCommand: {
            readonly value: "gatsby develop --port $PORT";
            readonly placeholder: "gatsby develop";
        };
        readonly outputDirectory: {
            readonly value: "public";
        };
    };
    readonly dependency: "gatsby";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: (dirPrefix: string) => Promise<any>;
    readonly cachePattern: "{.cache,public}/**";
}, {
    readonly name: "Remix";
    readonly slug: "remix";
    readonly demo: "https://remix-run-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/remix-no-shadow.svg";
    readonly tagline: "Build Better Websites";
    readonly description: "A new Remix app — the result of running `npx create-remix`.";
    readonly website: "https://remix.run";
    readonly sort: 6;
    readonly supersedes: readonly ["hydrogen", "vite", "node"];
    readonly useRuntime: {
        readonly src: "package.json";
        readonly use: "@vercel/remix-builder";
    };
    readonly ignoreRuntimes: readonly ["@vercel/node"];
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "@remix-run/dev";
        }, {
            readonly path: "remix.config.js";
        }, {
            readonly path: "remix.config.mjs";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly value: "remix build";
            readonly placeholder: "`npm run build` or `remix build`";
        };
        readonly devCommand: {
            readonly value: "remix dev";
            readonly placeholder: "remix dev";
        };
        readonly outputDirectory: {
            readonly value: "public";
        };
    };
    readonly dependency: "remix";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "React Router";
    readonly slug: "react-router";
    readonly demo: "https://react-router-v7-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/react-router.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/react-router-dark.svg";
    readonly tagline: "Declarative routing for React";
    readonly description: "A user-obsessed, standards-focused, multi-strategy router you can deploy anywhere.";
    readonly website: "https://reactrouter.com";
    readonly sort: 7;
    readonly supersedes: readonly ["hydrogen", "vite", "node"];
    readonly useRuntime: {
        readonly src: "package.json";
        readonly use: "@vercel/remix-builder";
    };
    readonly ignoreRuntimes: readonly ["@vercel/node"];
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "vite.config.js";
            readonly matchContent: "@react-router/dev/vite";
        }, {
            readonly path: "vite.config.ts";
            readonly matchContent: "@react-router/dev/vite";
        }, {
            readonly path: "react-router.config.js";
        }, {
            readonly path: "react-router.config.ts";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly value: "react-router build";
            readonly placeholder: "`npm run build` or `react-router build`";
        };
        readonly devCommand: {
            readonly value: "react-router dev";
            readonly placeholder: "react-router dev";
        };
        readonly outputDirectory: {
            readonly value: "build";
        };
    };
    readonly dependency: "react-router";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Astro";
    readonly slug: "astro";
    readonly demo: "https://astro-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/astro.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/astro-dark.svg";
    readonly tagline: "Astro is a new kind of static site builder for the modern web. Powerful developer experience meets lightweight output.";
    readonly description: "An Astro site, using the basics starter kit.";
    readonly website: "https://astro.build";
    readonly envPrefix: "PUBLIC_";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "astro";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly value: "astro build";
            readonly placeholder: "`npm run build` or `astro build`";
        };
        readonly devCommand: {
            readonly value: "astro dev --port $PORT";
            readonly placeholder: "astro dev";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "astro";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly src: "^/assets/(.*)$";
        readonly headers: {
            readonly 'cache-control': "public, max-age=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly src: "^/_astro/(.*)$";
        readonly headers: {
            readonly 'cache-control': "public, max-age=31536000, immutable";
        };
        readonly continue: true;
    }];
}, {
    readonly name: "Hexo";
    readonly slug: "hexo";
    readonly demo: "https://hexo-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/hexo.svg";
    readonly tagline: "Hexo is a fast, simple & powerful blog framework powered by Node.js.";
    readonly description: "A Hexo site, created with the Hexo CLI.";
    readonly website: "https://hexo.io";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "hexo";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `hexo generate`";
            readonly value: "hexo generate";
        };
        readonly devCommand: {
            readonly value: "hexo server --port $PORT";
            readonly placeholder: "hexo server";
        };
        readonly outputDirectory: {
            readonly value: "public";
        };
    };
    readonly dependency: "hexo";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Eleventy";
    readonly slug: "eleventy";
    readonly demo: "https://eleventy-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/eleventy.svg";
    readonly tagline: "11ty is a simpler static site generator written in JavaScript, created to be an alternative to Jekyll.";
    readonly description: "An Eleventy site, created with npm init.";
    readonly website: "https://www.11ty.dev";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@11ty/eleventy";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `npx @11ty/eleventy`";
            readonly value: "npx @11ty/eleventy";
        };
        readonly devCommand: {
            readonly value: "npx @11ty/eleventy --serve --watch --port $PORT";
            readonly placeholder: "npx @11ty/eleventy --serve";
        };
        readonly outputDirectory: {
            readonly value: "_site";
        };
    };
    readonly dependency: "@11ty/eleventy";
    readonly getOutputDirName: () => Promise<string>;
    readonly cachePattern: ".cache/**";
}, {
    readonly name: "Docusaurus (v2+)";
    readonly slug: "docusaurus-2";
    readonly demo: "https://docusaurus-2-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/docusaurus.svg";
    readonly tagline: "Docusaurus makes it easy to maintain Open Source documentation websites.";
    readonly description: "A static Docusaurus site that makes it easy to maintain OSS documentation.";
    readonly website: "https://v2.docusaurus.io";
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "@docusaurus/core";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `docusaurus build`";
            readonly value: "docusaurus build";
        };
        readonly devCommand: {
            readonly value: "docusaurus start --port $PORT";
            readonly placeholder: "docusaurus start";
        };
        readonly outputDirectory: {
            readonly value: "build";
        };
    };
    readonly dependency: "@docusaurus/core";
    readonly getOutputDirName: (dirPrefix: string) => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly src: "^/[^./]+\\.[0-9a-f]{8}\\.(css|js)$";
        readonly headers: {
            readonly 'cache-control': "max-age=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly src: "^/assets/images/[^/]+-[0-9a-f]{32}\\.(ico|svg|jpg|jpeg|png|gif|webp)$";
        readonly headers: {
            readonly 'cache-control': "max-age=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly src: "^/assets/medias/[^/]+-[0-9a-f]{32}\\.(ogv|wav|mp3|m4a|aac|oga|flac)$";
        readonly headers: {
            readonly 'cache-control': "max-age=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly src: "^/assets/files/[^/]+-[0-9a-f]{32}\\.(pdf|doc|docx|xls|xlsx|zip|rar)$";
        readonly headers: {
            readonly 'cache-control': "max-age=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly src: "^/ideal-img/[^/]+\\.[0-9a-f]{7}\\.\\d+\\.(png|jpe?g|gif)$";
        readonly headers: {
            readonly 'cache-control': "max-age=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly handle: "filesystem";
    }, {
        readonly src: ".*";
        readonly status: 404;
        readonly dest: "404.html";
    }];
}, {
    readonly name: "Docusaurus (v1)";
    readonly slug: "docusaurus";
    readonly demo: "https://docusaurus-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/docusaurus.svg";
    readonly tagline: "Docusaurus makes it easy to maintain Open Source documentation websites.";
    readonly description: "A static Docusaurus site that makes it easy to maintain OSS documentation.";
    readonly website: "https://docusaurus.io/";
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "docusaurus";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `docusaurus-build`";
            readonly value: "docusaurus-build";
        };
        readonly devCommand: {
            readonly value: "docusaurus-start --port $PORT";
            readonly placeholder: "docusaurus-start";
        };
        readonly outputDirectory: {
            readonly value: "build";
        };
    };
    readonly dependency: "docusaurus";
    readonly getOutputDirName: (dirPrefix: string) => Promise<string>;
}, {
    readonly name: "Preact";
    readonly slug: "preact";
    readonly demo: "https://preact-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/preact.svg";
    readonly tagline: "Preact is a fast 3kB alternative to React with the same modern API.";
    readonly description: "A Preact app, created with the Preact CLI.";
    readonly website: "https://preactjs.com";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "preact-cli";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `preact build`";
            readonly value: "preact build";
        };
        readonly devCommand: {
            readonly value: "preact watch --port $PORT";
            readonly placeholder: "preact watch";
        };
        readonly outputDirectory: {
            readonly value: "build";
        };
    };
    readonly dependency: "preact-cli";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "SolidStart (v1)";
    readonly slug: "solidstart-1";
    readonly demo: "https://solid-start-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/solid.svg";
    readonly tagline: "Simple and performant reactivity for building user interfaces.";
    readonly description: "A Solid app, created with SolidStart.";
    readonly website: "https://start.solidjs.com";
    readonly envPrefix: "VITE_";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "solid-js";
        }, {
            readonly matchPackage: "@solidjs/start";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `vinxi build`";
            readonly value: "vinxi build";
        };
        readonly devCommand: {
            readonly value: "vinxi dev";
        };
        readonly outputDirectory: {
            readonly value: ".output";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "SolidStart (v0)";
    readonly slug: "solidstart";
    readonly demo: "https://solid-start-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/solid.svg";
    readonly tagline: "Simple and performant reactivity for building user interfaces.";
    readonly description: "A Solid app, created with SolidStart.";
    readonly website: "https://solidjs.com";
    readonly envPrefix: "VITE_";
    readonly sort: 98;
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "solid-js";
        }, {
            readonly matchPackage: "solid-start";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `solid-start build`";
            readonly value: "solid-start build";
        };
        readonly devCommand: {
            readonly value: "solid-start dev";
        };
        readonly outputDirectory: {
            readonly value: ".output";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Dojo";
    readonly slug: "dojo";
    readonly demo: "https://dojo-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/dojo.png";
    readonly tagline: "Dojo is a modern progressive, TypeScript first framework.";
    readonly description: "A Dojo app, created with the Dojo CLI's cli-create-app command.";
    readonly website: "https://dojo.io";
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "@dojo/framework";
        }, {
            readonly path: ".dojorc";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `dojo build`";
            readonly value: "dojo build";
        };
        readonly devCommand: {
            readonly value: "dojo build -m dev -w -s -p $PORT";
            readonly placeholder: "dojo build -m dev -w -s";
        };
        readonly outputDirectory: {
            readonly value: "output/dist";
        };
    };
    readonly dependency: "@dojo/cli";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/service-worker.js";
        readonly headers: {
            readonly 'cache-control': "s-maxage=0";
        };
        readonly continue: true;
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
    readonly defaulHeaders: readonly [{
        readonly source: "/service-worker.js";
        readonly regex: "/service-worker.js";
        readonly headers: {
            readonly 'cache-control': "s-maxage=0";
        };
        readonly continue: true;
    }];
}, {
    readonly name: "Ember.js";
    readonly slug: "ember";
    readonly demo: "https://ember-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/ember.svg";
    readonly tagline: "Ember.js helps webapp developers be more productive out of the box.";
    readonly description: "An Ember app, created with the Ember CLI.";
    readonly website: "https://emberjs.com/";
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "ember-source";
        }, {
            readonly matchPackage: "ember-cli";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `ember build`";
            readonly value: "ember build";
        };
        readonly devCommand: {
            readonly value: "ember serve --port $PORT";
            readonly placeholder: "ember serve";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "ember-cli";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Vue.js";
    readonly slug: "vue";
    readonly demo: "https://vue-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/vue.svg";
    readonly tagline: "Vue.js is a versatile JavaScript framework that is as approachable as it is performant.";
    readonly description: "A Vue.js app, created with the Vue CLI.";
    readonly website: "https://vuejs.org";
    readonly envPrefix: "VUE_APP_";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@vue/cli-service";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `vue-cli-service build`";
            readonly value: "vue-cli-service build";
        };
        readonly devCommand: {
            readonly value: "vue-cli-service serve --port $PORT";
            readonly placeholder: "vue-cli-service serve";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "@vue/cli-service";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly src: "^/[^/]*\\.(js|txt|ico|json)";
        readonly headers: {
            readonly 'cache-control': "max-age=300";
        };
        readonly continue: true;
    }, {
        readonly src: "^/(img|js|css|fonts|media)/[^/]+\\.[0-9a-f]{8}\\.*";
        readonly headers: {
            readonly 'cache-control': "max-age=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly handle: "filesystem";
    }, {
        readonly src: "^.*";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Scully";
    readonly slug: "scully";
    readonly demo: "https://scully-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/scullyio-logo.png";
    readonly tagline: "Scully is a static site generator for Angular.";
    readonly description: "The Static Site Generator for Angular apps.";
    readonly website: "https://github.com/scullyio/scully";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@scullyio/init";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `ng build && scully`";
            readonly value: "ng build && scully";
        };
        readonly devCommand: {
            readonly value: "ng serve --port $PORT";
            readonly placeholder: "ng serve";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "@scullyio/init";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Ionic Angular";
    readonly slug: "ionic-angular";
    readonly demo: "https://ionic-angular-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/ionic.svg";
    readonly tagline: "Ionic Angular allows you to build mobile PWAs with Angular and the Ionic Framework.";
    readonly description: "An Ionic Angular site, created with the Ionic CLI.";
    readonly website: "https://ionicframework.com";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@ionic/angular";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `ng build`";
            readonly value: "ng build";
        };
        readonly devCommand: {
            readonly value: "ng serve --port $PORT";
        };
        readonly outputDirectory: {
            readonly value: "www";
        };
    };
    readonly dependency: "@ionic/angular";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Angular";
    readonly slug: "angular";
    readonly demo: "https://angular-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/angular.svg";
    readonly tagline: "Angular is a TypeScript-based cross-platform framework from Google.";
    readonly description: "An Angular app, created with the Angular CLI.";
    readonly website: "https://angular.io";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@angular/cli";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `ng build`";
            readonly value: "ng build";
        };
        readonly devCommand: {
            readonly value: "ng serve --port $PORT";
            readonly placeholder: "ng serve";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "@angular/cli";
    readonly getOutputDirName: (dirPrefix: string) => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Polymer";
    readonly slug: "polymer";
    readonly demo: "https://polymer-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/polymer.svg";
    readonly tagline: "Polymer is an open-source webapps library from Google, for building using Web Components.";
    readonly description: "A Polymer app, created with the Polymer CLI.";
    readonly website: "https://www.polymer-project.org/";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "polymer-cli";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `polymer build`";
            readonly value: "polymer build";
        };
        readonly devCommand: {
            readonly value: "polymer serve --port $PORT";
            readonly placeholder: "polymer serve";
        };
        readonly outputDirectory: {
            readonly value: "build";
        };
    };
    readonly dependency: "polymer-cli";
    readonly getOutputDirName: (dirPrefix: string) => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Svelte";
    readonly slug: "svelte";
    readonly demo: "https://svelte.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/svelte.svg";
    readonly tagline: "Svelte lets you write high performance reactive apps with significantly less boilerplate.";
    readonly description: "A basic Svelte app using the default template.";
    readonly website: "https://svelte.dev";
    readonly sort: 3;
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "svelte";
        }, {
            readonly matchPackage: "sirv-cli";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `rollup -c`";
            readonly value: "rollup -c";
        };
        readonly devCommand: {
            readonly value: "rollup -c -w";
        };
        readonly outputDirectory: {
            readonly value: "public";
        };
    };
    readonly dependency: "sirv-cli";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "SvelteKit (v0)";
    readonly slug: "sveltekit";
    readonly demo: "https://sveltekit-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/svelte.svg";
    readonly screenshot: "https://py8fhxnkzwtsqdo9.public.blob.vercel-storage.com/front/import/sveltekit.png";
    readonly tagline: "SvelteKit is a framework for building web applications of all sizes.";
    readonly description: "A SvelteKit legacy app optimized Edge-first.";
    readonly website: "https://kit.svelte.dev";
    readonly supersedes: readonly ["vite"];
    readonly sort: 99;
    readonly envPrefix: "VITE_";
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "package.json";
            readonly matchContent: "\"(dev)?(d|D)ependencies\":\\s*{[^}]*\"@sveltejs\\/kit\":\\s*\"1\\.0\\.0-next\\.(\\d+)\"[^}]*}";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `svelte-kit build`";
            readonly value: "svelte-kit build";
        };
        readonly devCommand: {
            readonly value: "svelte-kit dev --port $PORT";
            readonly placeholder: "svelte-kit dev";
        };
        readonly outputDirectory: {
            readonly value: "public";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "SvelteKit";
    readonly slug: "sveltekit-1";
    readonly demo: "https://sveltekit-1-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/svelte.svg";
    readonly screenshot: "https://py8fhxnkzwtsqdo9.public.blob.vercel-storage.com/front/import/sveltekit.png";
    readonly tagline: "SvelteKit is a framework for building web applications of all sizes.";
    readonly description: "A SvelteKit app optimized Edge-first.";
    readonly website: "https://kit.svelte.dev";
    readonly supersedes: readonly ["vite"];
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "package.json";
            readonly matchContent: "\"(dev)?(d|D)ependencies\":\\s*{[^}]*\"@sveltejs\\/kit\":\\s*\".+?\"[^}]*}";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "vite build";
            readonly value: "vite build";
        };
        readonly devCommand: {
            readonly placeholder: "vite dev";
            readonly value: "vite dev --port $PORT";
        };
        readonly outputDirectory: {
            readonly value: "public";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Ionic React";
    readonly slug: "ionic-react";
    readonly demo: "https://ionic-react-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/ionic.svg";
    readonly tagline: "Ionic React allows you to build mobile PWAs with React and the Ionic Framework.";
    readonly description: "An Ionic React site, created with the Ionic CLI.";
    readonly website: "https://ionicframework.com";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@ionic/react";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `react-scripts build`";
            readonly value: "react-scripts build";
        };
        readonly devCommand: {
            readonly value: "react-scripts start";
        };
        readonly outputDirectory: {
            readonly value: "build";
        };
    };
    readonly dependency: "@ionic/react";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly src: "/static/(.*)";
        readonly headers: {
            readonly 'cache-control': "s-maxage=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly src: "/service-worker.js";
        readonly headers: {
            readonly 'cache-control': "s-maxage=0";
        };
        readonly continue: true;
    }, {
        readonly src: "/sockjs-node/(.*)";
        readonly dest: "/sockjs-node/$1";
    }, {
        readonly handle: "filesystem";
    }, {
        readonly src: "/static/(.*)";
        readonly status: 404;
        readonly dest: "/404.html";
    }, {
        readonly src: "/(.*)";
        readonly headers: {
            readonly 'cache-control': "s-maxage=0";
        };
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Create React App";
    readonly slug: "create-react-app";
    readonly demo: "https://create-react-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/react.svg";
    readonly tagline: "Create React App allows you to get going with React in no time.";
    readonly description: "A client-side React app created with create-react-app.";
    readonly website: "https://create-react-app.dev";
    readonly sort: 4;
    readonly envPrefix: "REACT_APP_";
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "react-scripts";
        }, {
            readonly matchPackage: "react-dev-utils";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `react-scripts build`";
            readonly value: "react-scripts build";
        };
        readonly devCommand: {
            readonly value: "react-scripts start";
        };
        readonly outputDirectory: {
            readonly value: "build";
        };
    };
    readonly dependency: "react-scripts";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly src: "/static/(.*)";
        readonly headers: {
            readonly 'cache-control': "s-maxage=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly src: "/service-worker.js";
        readonly headers: {
            readonly 'cache-control': "s-maxage=0";
        };
        readonly continue: true;
    }, {
        readonly src: "/sockjs-node/(.*)";
        readonly dest: "/sockjs-node/$1";
    }, {
        readonly handle: "filesystem";
    }, {
        readonly src: "/static/(.*)";
        readonly status: 404;
        readonly dest: "/404.html";
    }, {
        readonly src: "/(.*)";
        readonly headers: {
            readonly 'cache-control': "s-maxage=0";
        };
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Gridsome";
    readonly slug: "gridsome";
    readonly demo: "https://gridsome-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/gridsome.svg";
    readonly tagline: "Gridsome is a Vue.js-powered framework for building websites & apps that are fast by default.";
    readonly description: "A Gridsome app, created with the Gridsome CLI.";
    readonly website: "https://gridsome.org/";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "gridsome";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `gridsome build`";
            readonly value: "gridsome build";
        };
        readonly devCommand: {
            readonly value: "gridsome develop -p $PORT";
            readonly placeholder: "gridsome develop";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "gridsome";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "UmiJS";
    readonly slug: "umijs";
    readonly demo: "https://umijs-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/umi.svg";
    readonly tagline: "UmiJS is an extensible enterprise-level React application framework.";
    readonly description: "An UmiJS app, created using the Umi CLI.";
    readonly website: "https://umijs.org";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "umi";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `umi build`";
            readonly value: "umi build";
        };
        readonly devCommand: {
            readonly value: "umi dev --port $PORT";
            readonly placeholder: "umi dev";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "umi";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Sapper";
    readonly slug: "sapper";
    readonly demo: "https://sapper-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/svelte.svg";
    readonly tagline: "Sapper is a framework for building high-performance universal web apps with Svelte.";
    readonly description: "A Sapper app, using the Sapper template.";
    readonly website: "https://sapper.svelte.dev";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "sapper";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `sapper export`";
            readonly value: "sapper export";
        };
        readonly devCommand: {
            readonly value: "sapper dev --port $PORT";
            readonly placeholder: "sapper dev";
        };
        readonly outputDirectory: {
            readonly value: "__sapper__/export";
        };
    };
    readonly dependency: "sapper";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Saber";
    readonly slug: "saber";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/saber.svg";
    readonly tagline: "Saber is a framework for building static sites in Vue.js that supports data from any source.";
    readonly description: "A Saber site, created with npm init.";
    readonly website: "https://saber.egoist.dev";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "saber";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `saber build`";
            readonly value: "saber build";
        };
        readonly devCommand: {
            readonly value: "saber --port $PORT";
            readonly placeholder: "saber";
        };
        readonly outputDirectory: {
            readonly value: "public";
        };
    };
    readonly dependency: "saber";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly src: "/_saber/.*";
        readonly headers: {
            readonly 'cache-control': "max-age=31536000, immutable";
        };
    }, {
        readonly handle: "filesystem";
    }, {
        readonly src: ".*";
        readonly status: 404;
        readonly dest: "404.html";
    }];
}, {
    readonly name: "Stencil";
    readonly slug: "stencil";
    readonly demo: "https://stencil.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/stencil.svg";
    readonly tagline: "Stencil is a powerful toolchain for building Progressive Web Apps and Design Systems.";
    readonly description: "A Stencil site, created with the Stencil CLI.";
    readonly website: "https://stenciljs.com/";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@stencil/core";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `stencil build`";
            readonly value: "stencil build";
        };
        readonly devCommand: {
            readonly value: "stencil build --dev --watch --serve --port $PORT";
            readonly placeholder: "stencil build --dev --watch --serve";
        };
        readonly outputDirectory: {
            readonly value: "www";
        };
    };
    readonly dependency: "@stencil/core";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly src: "/assets/(.*)";
        readonly headers: {
            readonly 'cache-control': "max-age=2592000";
        };
        readonly continue: true;
    }, {
        readonly src: "/build/p-.*";
        readonly headers: {
            readonly 'cache-control': "max-age=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly src: "/sw.js";
        readonly headers: {
            readonly 'cache-control': "no-cache";
        };
        readonly continue: true;
    }, {
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Nuxt";
    readonly slug: "nuxtjs";
    readonly demo: "https://nuxtjs-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/nuxt.svg";
    readonly screenshot: "https://py8fhxnkzwtsqdo9.public.blob.vercel-storage.com/front/import/nuxtjs.png";
    readonly tagline: "Nuxt is the open source framework that makes full-stack development with Vue.js intuitive.";
    readonly description: "A Nuxt app, bootstrapped with create-nuxt-app.";
    readonly website: "https://nuxt.com";
    readonly sort: 2;
    readonly envPrefix: "NUXT_ENV_";
    readonly supersedes: readonly ["nitro"];
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "nuxt";
        }, {
            readonly matchPackage: "nuxt3";
        }, {
            readonly matchPackage: "nuxt-edge";
        }, {
            readonly matchPackage: "nuxt-nightly";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `nuxt build`";
            readonly value: "nuxt build";
        };
        readonly devCommand: {
            readonly value: "nuxt dev";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "nuxt";
    readonly getOutputDirName: () => Promise<string>;
    readonly cachePattern: ".nuxt/**";
    readonly defaultRoutes: readonly [{
        readonly src: "/sw.js";
        readonly headers: {
            readonly 'cache-control': "no-cache";
        };
        readonly continue: true;
    }, {
        readonly src: "/_nuxt/(.*)";
        readonly headers: {
            readonly 'cache-control': "public,max-age=31536000,immutable";
        };
        readonly continue: true;
    }, {
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/200.html";
    }];
}, {
    readonly name: "RedwoodJS";
    readonly slug: "redwoodjs";
    readonly demo: "https://redwood-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/redwoodjs.svg";
    readonly tagline: "RedwoodJS is a full-stack framework for the Jamstack.";
    readonly description: "A RedwoodJS app, bootstraped with create-redwood-app.";
    readonly website: "https://redwoodjs.com";
    readonly envPrefix: "REDWOOD_ENV_";
    readonly useRuntime: {
        readonly src: "package.json";
        readonly use: "@vercel/redwood";
    };
    readonly ignoreRuntimes: readonly ["@vercel/node"];
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@redwoodjs/core";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly value: "yarn rw deploy vercel";
        };
        readonly devCommand: {
            readonly value: "yarn rw dev --fwd=\"--port=$PORT --open=false\"";
            readonly placeholder: "yarn rw dev";
        };
        readonly outputDirectory: {
            readonly placeholder: "RedwoodJS default";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Hugo";
    readonly slug: "hugo";
    readonly demo: "https://hugo-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/hugo.svg";
    readonly tagline: "Hugo is the world’s fastest framework for building websites, written in Go.";
    readonly description: "A Hugo site, created with the Hugo CLI.";
    readonly website: "https://gohugo.io";
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "config.yaml";
            readonly matchContent: "baseURL";
        }, {
            readonly path: "config.toml";
            readonly matchContent: "baseURL";
        }, {
            readonly path: "config.json";
            readonly matchContent: "baseURL";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "None";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `hugo --gc`";
            readonly value: "hugo --gc";
        };
        readonly devCommand: {
            readonly value: "hugo server -D -w -p $PORT";
            readonly placeholder: "hugo server -D";
        };
        readonly outputDirectory: {
            readonly placeholder: "`public` or `publishDir` from the `config` file";
        };
    };
    readonly getOutputDirName: (dirPrefix: string) => Promise<string>;
    readonly defaultVersion: "0.58.2";
}, {
    readonly name: "Jekyll";
    readonly slug: "jekyll";
    readonly demo: "https://jekyll-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/jekyll.svg";
    readonly tagline: "Jekyll makes it super easy to transform your plain text into static websites and blogs.";
    readonly description: "A Jekyll site, created with the Jekyll CLI.";
    readonly website: "https://jekyllrb.com/";
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "_config.yml";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly value: "bundle install";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `jekyll build`";
            readonly value: "jekyll build";
        };
        readonly devCommand: {
            readonly value: "bundle exec jekyll serve --watch --port $PORT";
            readonly placeholder: "bundle exec jekyll serve";
        };
        readonly outputDirectory: {
            readonly placeholder: "`_site` or `destination` from `_config.yml`";
        };
    };
    readonly getOutputDirName: (dirPrefix: string) => Promise<string>;
    readonly cachePattern: "{vendor/bin,vendor/cache,vendor/bundle}/**";
}, {
    readonly name: "Brunch";
    readonly slug: "brunch";
    readonly demo: "https://brunch-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/brunch.svg";
    readonly tagline: "Brunch is a fast and simple webapp build tool with seamless incremental compilation for rapid development.";
    readonly description: "A Brunch app, created with the Brunch CLI.";
    readonly website: "https://brunch.io/";
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "brunch";
        }, {
            readonly path: "brunch-config.js";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `brunch build --production`";
            readonly value: "brunch build --production";
        };
        readonly devCommand: {
            readonly value: "brunch watch --server --port $PORT";
            readonly placeholder: "brunch watch --server";
        };
        readonly outputDirectory: {
            readonly value: "public";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Middleman";
    readonly slug: "middleman";
    readonly demo: "https://middleman-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/middleman.svg";
    readonly tagline: "Middleman is a static site generator that uses all the shortcuts and tools in modern web development.";
    readonly description: "A Middleman app, created with the Middleman CLI.";
    readonly website: "https://middlemanapp.com/";
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "config.rb";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly value: "bundle install";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `bundle exec middleman build`";
            readonly value: "bundle exec middleman build";
        };
        readonly devCommand: {
            readonly placeholder: "bundle exec middleman server";
            readonly value: "bundle exec middleman server -p $PORT";
        };
        readonly outputDirectory: {
            readonly value: "build";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly cachePattern: "{vendor/bin,vendor/cache,vendor/bundle}/**";
}, {
    readonly name: "Zola";
    readonly slug: "zola";
    readonly demo: "https://zola-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/zola.png";
    readonly tagline: "Everything you need to make a static site engine in one binary.";
    readonly description: "A Zola app, created with the \"Getting Started\" tutorial.";
    readonly website: "https://www.getzola.org";
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "config.toml";
            readonly matchContent: "base_url";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "None";
        };
        readonly buildCommand: {
            readonly value: "zola build";
        };
        readonly devCommand: {
            readonly placeholder: "zola serve";
            readonly value: "zola serve --port $PORT";
        };
        readonly outputDirectory: {
            readonly value: "public";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultVersion: "0.13.0";
}, {
    readonly name: "Hydrogen (v1)";
    readonly slug: "hydrogen";
    readonly demo: "https://hydrogen-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/hydrogen.svg";
    readonly tagline: "React framework for headless commerce";
    readonly description: "React framework for headless commerce";
    readonly website: "https://hydrogen.shopify.dev";
    readonly supersedes: readonly ["vite"];
    readonly useRuntime: {
        readonly src: "package.json";
        readonly use: "@vercel/hydrogen";
    };
    readonly envPrefix: "PUBLIC_";
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "@shopify/hydrogen";
        }, {
            readonly path: "hydrogen.config.js";
        }, {
            readonly path: "hydrogen.config.ts";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly value: "shopify hydrogen build";
            readonly placeholder: "`npm run build` or `shopify hydrogen build`";
        };
        readonly devCommand: {
            readonly value: "shopify hydrogen dev";
            readonly placeholder: "shopify hydrogen dev";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "@shopify/hydrogen";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Vite";
    readonly slug: "vite";
    readonly demo: "https://vite-vue-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/vite.svg";
    readonly tagline: "Vite is a new breed of frontend build tool that significantly improves the frontend development experience.";
    readonly description: "A Vue.js app, created with Vite.";
    readonly website: "https://vitejs.dev";
    readonly supersedes: readonly ["ionic-react"];
    readonly envPrefix: "VITE_";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "vite";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `vite build`";
            readonly value: "vite build";
        };
        readonly devCommand: {
            readonly placeholder: "vite";
            readonly value: "vite --port $PORT";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "vite";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "TanStack Start";
    readonly slug: "tanstack-start";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/tanstack-start.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/tanstack-start-dark.svg";
    readonly tagline: "Full-stack Framework powered by TanStack Router for React and Solid.";
    readonly description: "Full-document SSR, Streaming, Server Functions, bundling and more, powered by TanStack Router and Vite - Ready to deploy to your favorite hosting provider.";
    readonly website: "https://tanstack.com/start";
    readonly supersedes: readonly ["ionic-react", "vite"];
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@tanstack/router-plugin";
        }];
        readonly some: readonly [{
            readonly matchPackage: "@tanstack/react-start";
        }, {
            readonly matchPackage: "@tanstack/solid-start";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `vite build`";
            readonly value: "vite build";
        };
        readonly devCommand: {
            readonly placeholder: "vite";
            readonly value: "vite --port $PORT";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "VitePress";
    readonly slug: "vitepress";
    readonly demo: "https://vitepress-starter-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/vite.svg";
    readonly tagline: "VitePress is VuePress' little brother, built on top of Vite.";
    readonly description: "VuePress on top of Vite";
    readonly website: "https://vitepress.vuejs.org/";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "vitepress";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `vitepress build docs`";
            readonly value: "vitepress build docs";
        };
        readonly devCommand: {
            readonly value: "vitepress dev docs --port $PORT";
        };
        readonly outputDirectory: {
            readonly value: "docs/.vitepress/dist";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "VuePress";
    readonly slug: "vuepress";
    readonly demo: "https://vuepress-starter-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/vuepress.png";
    readonly tagline: "Vue-powered Static Site Generator";
    readonly description: "Vue-powered Static Site Generator";
    readonly website: "https://vuepress.vuejs.org/";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "vuepress";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `vuepress build src`";
            readonly value: "vuepress build src";
        };
        readonly devCommand: {
            readonly value: "vuepress dev src --port $PORT";
        };
        readonly outputDirectory: {
            readonly value: "src/.vuepress/dist";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Parcel";
    readonly slug: "parcel";
    readonly demo: "https://parcel-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/parcel.png";
    readonly tagline: "Parcel is a zero configuration build tool for the web that scales to projects of any size and complexity.";
    readonly description: "A vanilla web app built with Parcel.";
    readonly website: "https://parceljs.org";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "parcel";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `parcel build`";
            readonly value: "parcel build";
        };
        readonly devCommand: {
            readonly placeholder: "parcel";
            readonly value: "parcel";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "parcel";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly src: "^/[^./]+\\.[0-9a-f]{8}\\.(css|js|png|jpg|webp|avif|svg)$";
        readonly headers: {
            readonly 'cache-control': "s-maxage=31536000, immutable";
        };
        readonly continue: true;
    }, {
        readonly handle: "filesystem";
    }];
}, {
    readonly name: "FastAPI";
    readonly slug: "fastapi";
    readonly demo: "https://vercel-fastapi-gamma-smoky.vercel.app/";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/fastapi.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/fastapi.svg";
    readonly tagline: "FastAPI framework, high performance, easy to learn, fast to code, ready for production";
    readonly description: "FastAPI framework, high performance, easy to learn, fast to code, ready for production";
    readonly website: "https://fastapi.tiangolo.com";
    readonly supersedes: readonly ["python"];
    readonly useRuntime: {
        readonly src: "<detect>";
        readonly use: "@vercel/python";
    };
    readonly ignoreRuntimes: readonly ["@vercel/python"];
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "requirements.txt";
            readonly matchContent: "fastapi";
        }, {
            readonly path: "pyproject.toml";
            readonly matchContent: "fastapi";
        }, {
            readonly path: "Pipfile";
            readonly matchContent: "fastapi";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`pip install -r requirements.txt`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
}, {
    readonly name: "Flask";
    readonly slug: "flask";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/flask.svg";
    readonly tagline: "The Python micro web framework";
    readonly description: "A Flask app, ready for production";
    readonly website: "https://flask.palletsprojects.com";
    readonly supersedes: readonly ["python"];
    readonly useRuntime: {
        readonly src: "<detect>";
        readonly use: "@vercel/python";
    };
    readonly ignoreRuntimes: readonly ["@vercel/python"];
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "requirements.txt";
            readonly matchContent: "[Ff]lask";
        }, {
            readonly path: "pyproject.toml";
            readonly matchContent: "[Ff]lask";
        }, {
            readonly path: "Pipfile";
            readonly matchContent: "[Ff]lask";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`pip install -r requirements.txt`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
}, {
    readonly name: "FastHTML";
    readonly slug: "fasthtml";
    readonly demo: "https://fasthtml-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/fasthtml.png";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/fasthtml-dark.png";
    readonly tagline: "The fastest way to create an HTML app";
    readonly description: "A library for writing fast and scalable Starlette-powered web applications";
    readonly website: "https://fastht.ml";
    readonly supersedes: readonly ["python"];
    readonly useRuntime: {
        readonly src: "main.py";
        readonly use: "@vercel/python";
    };
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "requirements.txt";
            readonly matchContent: "python-fasthtml";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`pip install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly value: "uvicorn main:app --reload";
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/main";
    }];
}, {
    readonly name: "Django";
    readonly slug: "django";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/django.svg";
    readonly tagline: "Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design. ";
    readonly description: "A Django project served via the Python Runtime.";
    readonly website: "https://www.djangoproject.com";
    readonly supersedes: readonly ["python"];
    readonly useRuntime: {
        readonly src: "<detect>";
        readonly use: "@vercel/python";
    };
    readonly ignoreRuntimes: readonly ["@vercel/python"];
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "requirements.txt";
            readonly matchContent: "[Dd]jango";
        }, {
            readonly path: "pyproject.toml";
            readonly matchContent: "[Dd]jango";
        }, {
            readonly path: "Pipfile";
            readonly matchContent: "[Dd]jango";
        }, {
            readonly path: "manage.py";
            readonly matchContent: "DJANGO_SETTINGS_MODULE";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`pip install -r requirements.txt`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
}, {
    readonly name: "Ash";
    readonly slug: "ash";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/ash.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/ash-dark.svg";
    readonly tagline: "A filesystem-first framework for durable backend agents on Vercel.";
    readonly description: "An Ash app: agents authored as a directory of files, compiled and served on Vercel.";
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "package.json";
            readonly matchContent: "\"(dev)?(d|D)ependencies\":\\s*{[^}]*\"experimental-ash\":\\s*\".+?\"[^}]*}";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`pnpm install`, `yarn install`, or `npm install`";
        };
        readonly buildCommand: {
            readonly value: "ash build";
            readonly placeholder: "`npm run build` or `ash build`";
        };
        readonly devCommand: {
            readonly value: "ash dev";
            readonly placeholder: "ash dev";
        };
        readonly outputDirectory: {
            readonly value: ".output";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly experimental: true;
}, {
    readonly name: "Eve";
    readonly slug: "eve";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/eve.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/eve-dark.svg";
    readonly tagline: "A filesystem-first framework for durable backend agents on Vercel.";
    readonly description: "An Eve app: agents authored as a directory of files, compiled and served on Vercel.";
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "package.json";
            readonly matchContent: "\"(dev)?(d|D)ependencies\":\\s*{[^}]*\"eve\":\\s*\".+?\"[^}]*}";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`pnpm install`, `yarn install`, or `npm install`";
        };
        readonly buildCommand: {
            readonly value: "eve build";
            readonly placeholder: "`npm run build` or `eve build`";
        };
        readonly devCommand: {
            readonly value: "eve dev";
            readonly placeholder: "eve dev";
        };
        readonly outputDirectory: {
            readonly value: ".output";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Sanity";
    readonly slug: "sanity";
    readonly demo: "https://template-studio-clean.sanity.dev";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/sanity.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/sanity-dark.svg";
    readonly tagline: "The back-end built for AI content operations. Power web, mobile, and agentic applications at scale.";
    readonly description: "A Sanity Studio";
    readonly website: "https://www.sanity.io";
    readonly envPrefix: "SANITY_STUDIO_";
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "sanity.config.js";
        }, {
            readonly path: "sanity.config.jsx";
        }, {
            readonly path: "sanity.config.ts";
        }, {
            readonly path: "sanity.config.tsx";
        }];
        readonly every: readonly [{
            readonly matchPackage: "sanity";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `sanity build`";
            readonly value: "sanity build";
        };
        readonly devCommand: {
            readonly value: "sanity dev --port $PORT";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "sanity";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Sanity (v2 - legacy)";
    readonly slug: "sanity-v2";
    readonly demo: "https://sanity-studio-template.vercel.app";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/sanity-v2.svg";
    readonly tagline: "The structured content platform.";
    readonly description: "A Sanity Studio";
    readonly website: "https://www.sanity.io";
    readonly envPrefix: "SANITY_STUDIO_";
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "sanity.json";
        }];
        readonly every: readonly [{
            readonly path: "package.json";
            readonly matchContent: "\"(dev)?(d|D)ependencies\":\\s*{[^}]*\"@sanity/cli\":\\s*\"\\^?2\\..*\"[^}]*}";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `sanity build`";
            readonly value: "sanity build";
        };
        readonly devCommand: {
            readonly value: "sanity start --port $PORT";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "@sanity/cli";
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/index.html";
    }];
}, {
    readonly name: "Storybook";
    readonly slug: "storybook";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/storybook.svg";
    readonly tagline: "Frontend workshop for UI development";
    readonly description: "Storybook is a frontend workshop for building UI components and pages in isolation.";
    readonly website: "https://storybook.js.org";
    readonly ignoreRuntimes: readonly ["@vercel/next", "@vercel/node"];
    readonly disableRootMiddleware: true;
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "storybook";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly value: "storybook build";
            readonly ignorePackageJsonScript: true;
        };
        readonly devCommand: {
            readonly value: "storybook dev -p $PORT";
        };
        readonly outputDirectory: {
            readonly value: "storybook-static";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Nitro";
    readonly slug: "nitro";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/nitro.svg";
    readonly demo: "https://nitro-template.vercel.app";
    readonly tagline: "Nitro is a next generation server toolkit.";
    readonly description: "Nitro lets you create web servers that run on multiple platforms.";
    readonly website: "https://nitro.build/";
    readonly detectors: {
        readonly some: readonly [{
            readonly matchPackage: "nitropack";
        }, {
            readonly matchPackage: "nitro";
        }];
    };
    readonly supersedes: readonly ["vite"];
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `nitro build`";
            readonly value: "nitro build";
        };
        readonly devCommand: {
            readonly value: "nitro dev";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Hono";
    readonly slug: "hono";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/hono.svg";
    readonly demo: "https://hono.vercel.dev";
    readonly tagline: "Web framework built on Web Standards";
    readonly description: "Fast, lightweight, built on Web Standards. Support for any JavaScript runtime.";
    readonly website: "https://hono.dev";
    readonly supersedes: readonly ["node"];
    readonly useRuntime: {
        readonly src: "index.js";
        readonly use: "@vercel/hono";
    };
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "hono";
        }];
        readonly some: readonly [{
            readonly path: "app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']hono[\"']\\s*(?:\\))?";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly dependency: "hono";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Express";
    readonly slug: "express";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/express.svg";
    readonly demo: "https://express-vercel-example-demo.vercel.app/";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/express-dark.svg";
    readonly tagline: "Fast, unopinionated, minimalist web framework for Node.js";
    readonly description: "Fast, unopinionated, minimalist web framework for Node.js";
    readonly website: "https://expressjs.com";
    readonly supersedes: readonly ["node"];
    readonly useRuntime: {
        readonly src: "index.js";
        readonly use: "@vercel/express";
    };
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "express";
        }];
        readonly some: readonly [{
            readonly path: "app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']express[\"']\\s*(?:\\))?";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly dependency: "express";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "H3";
    readonly slug: "h3";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/h3.svg";
    readonly tagline: "Universal, Tiny, and Fast Servers";
    readonly description: "H(TTP) server framework built on top of web standards for high performance and composability.";
    readonly website: "https://h3.dev/";
    readonly supersedes: readonly ["node"];
    readonly useRuntime: {
        readonly src: "index.js";
        readonly use: "@vercel/h3";
    };
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "h3";
        }];
        readonly some: readonly [{
            readonly path: "app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']h3[\"']\\s*(?:\\))?";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly dependency: "h3";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Koa";
    readonly slug: "koa";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/koa.svg";
    readonly tagline: "Expressive middleware for Node.js using ES2017 async functions";
    readonly description: "Koa is a new web framework designed by the team behind Express, which aims to be a smaller, more expressive, and more robust foundation for web applications and APIs.";
    readonly website: "https://koajs.com";
    readonly supersedes: readonly ["node"];
    readonly useRuntime: {
        readonly src: "index.js";
        readonly use: "@vercel/koa";
    };
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "koa";
        }];
        readonly some: readonly [{
            readonly path: "app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']koa[\"']\\s*(?:\\))?";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly dependency: "koa";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "NestJS";
    readonly slug: "nestjs";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/nestjs.svg";
    readonly tagline: "Framework for building efficient, scalable Node.js server-side applications";
    readonly description: "A progressive Node.js framework for building efficient, reliable and scalable server-side applications.";
    readonly website: "https://nestjs.com/";
    readonly supersedes: readonly ["node"];
    readonly useRuntime: {
        readonly src: "index.js";
        readonly use: "@vercel/nestjs";
    };
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "@nestjs/core";
        }];
        readonly some: readonly [{
            readonly path: "src/main.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/main.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/main.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/main.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/main.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/main.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "main.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "main.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "main.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "main.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "main.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "main.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']@nestjs/core[\"']\\s*(?:\\))?";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly dependency: "nestjs";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Elysia";
    readonly slug: "elysia";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/elysia.svg";
    readonly tagline: "Ergonomic framework for humans";
    readonly description: "TypeScript with End-to-End Type Safety, type integrity, and exceptional developer experience. Supercharged by Bun.";
    readonly website: "https://elysiajs.com/";
    readonly supersedes: readonly ["node"];
    readonly useRuntime: {
        readonly src: "index.js";
        readonly use: "@vercel/elysia";
    };
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "elysia";
        }];
        readonly some: readonly [{
            readonly path: "app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']elysia[\"']\\s*(?:\\))?";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Fastify";
    readonly slug: "fastify";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/fastify.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/fastify-dark.svg";
    readonly tagline: "Fast and low overhead web framework, for Node.js";
    readonly description: "Fastify is a web framework highly focused on providing the best developer experience with the least overhead and a powerful plugin architecture.";
    readonly website: "https://fastify.dev/";
    readonly supersedes: readonly ["node"];
    readonly useRuntime: {
        readonly src: "index.js";
        readonly use: "@vercel/fastify";
    };
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "fastify";
        }];
        readonly some: readonly [{
            readonly path: "app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/index.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/app.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.js";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mjs";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.mts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.ts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }, {
            readonly path: "src/server.cts";
            readonly matchContent: "(?:from|require|import)\\s*(?:\\(\\s*)?[\"']fastify[\"']\\s*(?:\\))?";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "xmcp";
    readonly slug: "xmcp";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/xmcp.svg";
    readonly demo: "https://xmcp-template.vercel.app/";
    readonly tagline: "The MCP framework for building AI-powered tools";
    readonly description: "A framework for building Model Context Protocol servers with zero configuration.";
    readonly website: "https://xmcp.dev";
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "xmcp.config.ts";
        }, {
            readonly path: "xmcp.config.js";
        }, {
            readonly matchPackage: "xmcp";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `xmcp build`";
            readonly value: "xmcp build --vercel";
        };
        readonly devCommand: {
            readonly value: "xmcp dev";
            readonly placeholder: "xmcp dev";
        };
        readonly outputDirectory: {
            readonly value: "dist";
        };
    };
    readonly dependency: "xmcp";
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Python";
    readonly slug: "python";
    readonly runtimeFramework: true;
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/python.svg";
    readonly tagline: "Python is a programming language that lets you work quickly and integrate systems more effectively.";
    readonly description: "A generic Python application deployed as a serverless function.";
    readonly website: "https://python.org";
    readonly useRuntime: {
        readonly src: "<detect>";
        readonly use: "@vercel/python";
    };
    readonly ignoreRuntimes: readonly ["@vercel/python"];
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "requirements.txt";
        }, {
            readonly path: "pyproject.toml";
        }, {
            readonly path: "Pipfile";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`pip install -r requirements.txt`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
}, {
    readonly name: "Ruby";
    readonly slug: "ruby";
    readonly experimental: true;
    readonly runtimeFramework: true;
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/ruby.svg";
    readonly tagline: "A dynamic, open source programming language with a focus on simplicity and productivity.";
    readonly description: "A generic Ruby application deployed as a serverless function.";
    readonly website: "https://www.ruby-lang.org";
    readonly useRuntime: {
        readonly src: "config.ru";
        readonly use: "@vercel/ruby";
    };
    readonly ignoreRuntimes: readonly ["@vercel/ruby"];
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "config.ru";
        }, {
            readonly path: "Gemfile";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`bundle install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/config";
    }];
}, {
    readonly name: "Rust";
    readonly slug: "rust";
    readonly experimental: true;
    readonly runtimeFramework: true;
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/rust.svg";
    readonly tagline: "A language empowering everyone to build reliable and efficient software.";
    readonly description: "A generic Rust application deployed as a serverless function.";
    readonly website: "https://www.rust-lang.org";
    readonly useRuntime: {
        readonly src: "src/main.rs";
        readonly use: "@vercel/rust";
    };
    readonly ignoreRuntimes: readonly ["@vercel/rust"];
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "Cargo.toml";
        }, {
            readonly path: "src/main.rs";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "None";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "`cargo run`";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/src/main";
    }];
}, {
    readonly name: "Axum";
    readonly slug: "axum";
    readonly experimental: true;
    readonly supersedes: readonly ["rust"];
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/axum.svg";
    readonly tagline: "Ergonomic and modular web framework built with Tokio, Tower, and Hyper.";
    readonly description: "An Axum application deployed as a serverless function.";
    readonly website: "https://github.com/tokio-rs/axum";
    readonly useRuntime: {
        readonly src: "src/main.rs";
        readonly use: "@vercel/rust";
    };
    readonly ignoreRuntimes: readonly ["@vercel/rust"];
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "Cargo.toml";
            readonly matchContent: "axum\\s*=";
        }, {
            readonly path: "src/main.rs";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "None";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "`cargo run`";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/src/main";
    }];
}, {
    readonly name: "Actix Web";
    readonly slug: "actix-web";
    readonly experimental: true;
    readonly runtimeFramework: true;
    readonly supersedes: readonly ["rust"];
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/actix-web.svg";
    readonly tagline: "A powerful, pragmatic, and extremely fast web framework for Rust.";
    readonly description: "An Actix Web application deployed as a serverless function.";
    readonly website: "https://actix.rs";
    readonly useRuntime: {
        readonly src: "src/main.rs";
        readonly use: "@vercel/rust";
    };
    readonly ignoreRuntimes: readonly ["@vercel/rust"];
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "Cargo.toml";
            readonly matchContent: "actix-web\\s*=";
        }, {
            readonly path: "src/main.rs";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "None";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "`cargo run`";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/src/main";
    }];
}, {
    readonly name: "Bun";
    readonly slug: "bun";
    readonly runtimeFramework: true;
    readonly experimental: true;
    readonly supersedes: readonly ["node"];
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/bun.svg";
    readonly tagline: "Bun is a fast all-in-one JavaScript runtime, bundler, and package manager.";
    readonly description: "A Bun application deployed as a serverless function.";
    readonly website: "https://bun.com";
    readonly useRuntime: {
        readonly src: "package.json";
        readonly use: "@vercel/backends";
    };
    readonly ignoreRuntimes: readonly ["@vercel/node"];
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "bun.lock";
        }];
        readonly some: readonly [{
            readonly path: "server.cjs";
        }, {
            readonly path: "server.js";
        }, {
            readonly path: "server.mjs";
        }, {
            readonly path: "server.mts";
        }, {
            readonly path: "server.ts";
        }, {
            readonly path: "server.cts";
        }, {
            readonly path: "src/server.cjs";
        }, {
            readonly path: "src/server.js";
        }, {
            readonly path: "src/server.mjs";
        }, {
            readonly path: "src/server.mts";
        }, {
            readonly path: "src/server.ts";
        }, {
            readonly path: "src/server.cts";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly value: "bun install";
            readonly placeholder: "bun install";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "`bun dev`, `bun run dev`, or `bun --hot server.ts`";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
}, {
    readonly name: "Node";
    readonly slug: "node";
    readonly runtimeFramework: true;
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/node.svg";
    readonly tagline: "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine.";
    readonly description: "A generic Node.js application deployed as a serverless function.";
    readonly website: "https://nodejs.org";
    readonly useRuntime: {
        readonly src: "package.json";
        readonly use: "@vercel/backends";
    };
    readonly ignoreRuntimes: readonly ["@vercel/node"];
    readonly detectors: {
        readonly some: readonly [{
            readonly path: "server.cjs";
        }, {
            readonly path: "server.js";
        }, {
            readonly path: "server.mjs";
        }, {
            readonly path: "server.mts";
        }, {
            readonly path: "server.ts";
        }, {
            readonly path: "server.cts";
        }, {
            readonly path: "src/server.cjs";
        }, {
            readonly path: "src/server.js";
        }, {
            readonly path: "src/server.mjs";
        }, {
            readonly path: "src/server.mts";
        }, {
            readonly path: "src/server.ts";
        }, {
            readonly path: "src/server.cts";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "`npm run dev`, `node server.js`, or `npx ts-node server.ts`";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
}, {
    readonly name: "Go";
    readonly slug: "go";
    readonly runtimeFramework: true;
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/go.svg";
    readonly tagline: "An open-source programming language supported by Google.";
    readonly description: "A generic Go application deployed as a serverless function.";
    readonly website: "https://go.dev";
    readonly useRuntime: {
        readonly src: "index.go";
        readonly use: "@vercel/go";
    };
    readonly ignoreRuntimes: readonly ["@vercel/go"];
    readonly detectors: {
        readonly every: readonly [{
            readonly path: "go.mod";
        }];
        readonly some: readonly [{
            readonly path: "main.go";
        }, {
            readonly path: "cmd/api/main.go";
        }, {
            readonly path: "cmd/server/main.go";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`go mod download`";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "`go run .` or `go run ./cmd/api`";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
    readonly defaultRoutes: readonly [{
        readonly handle: "filesystem";
    }, {
        readonly src: "/(.*)";
        readonly dest: "/";
    }];
}, {
    readonly name: "Services";
    readonly slug: "services";
    readonly experimental: true;
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/other.svg";
    readonly tagline: "Multiple services deployed as serverless functions within your project.";
    readonly description: "Multiple services deployed as serverless functions within your project.";
    readonly website: "https://vercel.com";
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "None";
        };
        readonly buildCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly value: "N/A";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Mastra";
    readonly slug: "mastra";
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/mastra.svg";
    readonly darkModeLogo: "https://api-frameworks.vercel.sh/framework-logos/mastra-dark.svg";
    readonly tagline: "Build AI agents with a modern TypeScript stack";
    readonly description: "Mastra is a framework for building AI-powered apps and agents with workflows, memory, streaming, evals, tracing, and Studio, an interactive UI for dev and testing.";
    readonly website: "https://mastra.ai";
    readonly detectors: {
        readonly every: readonly [{
            readonly matchPackage: "mastra";
        }];
    };
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run build` or `mastra build`";
            readonly value: "mastra build";
        };
        readonly devCommand: {
            readonly value: "mastra dev";
        };
        readonly outputDirectory: {
            readonly value: ".mastra";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}, {
    readonly name: "Other";
    readonly slug: null;
    readonly logo: "https://api-frameworks.vercel.sh/framework-logos/other.svg";
    readonly description: "No framework or an unoptimized framework.";
    readonly settings: {
        readonly installCommand: {
            readonly placeholder: "`yarn install`, `pnpm install`, `npm install`, or `bun install`";
        };
        readonly buildCommand: {
            readonly placeholder: "`npm run vercel-build` or `npm run build`";
            readonly value: null;
        };
        readonly devCommand: {
            readonly placeholder: "None";
            readonly value: null;
        };
        readonly outputDirectory: {
            readonly placeholder: "`public` if it exists, or `.`";
        };
    };
    readonly getOutputDirName: () => Promise<string>;
}];
export declare const frameworkList: readonly Framework[];
export default frameworkList;
