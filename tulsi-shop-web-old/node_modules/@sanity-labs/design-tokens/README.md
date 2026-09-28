# css

This repo is a proof of concept for the Sanity Design System’s design tokens distribution.

At present, it demonstrates ingesting design tokens from a dataset in Content Lake (which uses a schema adhering to the [the DTCG’s Design Tokens spec](https://www.designtokens.org/tr/drafts/)) and emitting DTCG compliant JSON tokens and CSS custom properties.

## Usage

Install via npm:

```shell
npm i @sanity-labs/design-tokens
```

Then import what you need:

```css
@import '@sanity-labs/design-tokens/css/color.css';
```

## Project structure

### `src`

Contains the `fetchTokens` function and associated `tokenQueries` used by that function. `fetchTokens`, as you'd expect, fetches design token documents from the Design Tokens dataset. Each `tokenQuery` (organized by token type) includes a Groq projection which returns token data in a `{name, $type, $value}` structure to facilitate ease of serialization to DTCG spec compliant JSON tokens.

### `scripts`

Scripts for composing ingestion of design token documents and emission of JSON tokens and CSS custom properties.

The `build-json` script runs first. It takes the output of the `fetchTokens` function (which is an object of tokens keyed by token group, e.g. `color`, `fontFamily`…), and for each token group:

1. Sorts tokens alphabetically
2. Reformats the array of tokens into an object keyed by token name (thus returning a `{tokenName: tokenContent}` structure)
3. Writes the token group’s tokens to a new JSON file in `dist/json`

The `build-css` script operates on the JSON files written by `build-json`. It creates CSS custom properties for every JSON token by leveraging [Style Dictionary](https://styledictionary.com/) with some minimal configuration. In particular, instead of Style Dictionary’s default output — a single CSS file containing every single design tokens as CSS custom properties — the file structure of the JSON tokens (organized by token group) is preserved, in order to keep the generated CSS clearly delineated and importable in small, categorized chunks. These are written to `dist/css`.

The `build-css-manifest` script handles enumerating the generated CSS files and preparing an `index.css` manifest file, which allows importing the entire CSS bundle in one go.

### `dist`

JSON and CSS output is written to the `dist` directory.

## Token definitions

Tokens are defined in Content Lake via [the design tokens studio](https://github.com/sanity-labs/design-tokens), which be accessed via the Sanity org’s dashboard.

## Where can I go to discuss this?

Head to the **#prj-design-system** channel on Slack!
