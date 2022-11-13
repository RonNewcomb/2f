# 2f

A toy UI framework related to uif but closure-based. Basically, it's React's Hooks without anything else but the hooks. Typescript + jsx/tsx because I'm not a savage.

## Try it out

After git-cloning and `npm install`, just `npm run build` to build the app and `npm run serve` to build the server and serve the app from `/.build/` onto http://localhost:7777

## Observations

The node_modules folder and package-lock.json are huge when installing even a "minimalist" web server like express, koa, or diet. Instead, we write our own one-page webserver in file `server.cts`, a CommonJS file not a ES Module. We use separate tsconfig.json files for the app and for the server because we must for several options that differ -- lib has dom or not, completely separate sets of input files, different outDir, separate module systems, etc.

CommonJS has \_\_dirname and require() available while ES Modules do not. ES Modules have import/export fully functional while cjs does not. See https://www.typescriptlang.org/docs/handbook/esm-node.html

TS option allowSyntheticDefaultImports didn't seem to make much difference in .cts files; I had to use the longer `import * as foo from 'foo'` instead of the shorter `import foo from 'foo'` regardless. I was promised `import foo = require('foo')` worked but it didn't.

## How server works

A GET request just gets the file of the same name from .build folder. I added code for a graceful 404. Slashes moving the other direction for a Windows systems was stupid.

## Typescript Watch

Typescript's `watch:true` is almost the cheap hot-module-reload i'm looking for. Almost!

## jsx

Currently trying tsx-dom as my jsx/tsx solution of choice. No dependencies...

## imports from browser

2if gets the file for a component, but when that component has imports the browser tries to resolve them. With an explicit .js extension in the import statement the browser can find them since they're in the build folder in the same places as the src folder had them. But its both flaky and also doesn't work with npm packages.

Either my build process needs bundling and/or my server needs to somehow push extra files to browser.

## index.html

..isn't copied to .build folder. Typescript doesn't do that. Server could, at startup. Or, a separate nodejs script that isn't the server can do these little build steps.
