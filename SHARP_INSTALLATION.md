# Sharp Installation Guide

This document explains how `sharp` is configured to work both locally and on Vercel.

## Configuration Files

### `.npmrc`
- Configures sharp binary download sources
- Ensures build scripts are enabled (`ignore-scripts=false`)
- Enables pre/post install scripts (`enable-pre-post-scripts=true`)

### `vercel.json`
- Configures Vercel to run build scripts during installation
- Uses `pnpm install --ignore-scripts=false` to ensure native modules compile

### `package.json`
- `sharp` is listed as a direct dependency (version ^0.33.5)
- `pnpm.overrides` forces all packages (including `@xenova/transformers`) to use sharp ^0.33.5 instead of older versions
- `postinstall` script runs `pnpm exec sharp install` to ensure binaries are available

## Local Installation

1. Run `pnpm install` - sharp will automatically download the correct binaries for your platform
2. If you encounter issues, run `pnpm rebuild sharp` to force a rebuild

## Vercel Deployment

Vercel will automatically:
1. Run `pnpm install --ignore-scripts=false` (as configured in `vercel.json`)
2. Execute the `postinstall` script which runs `sharp install`
3. Download the correct sharp binaries for the Vercel build environment (Linux x64)

## Troubleshooting

If sharp fails to load:
1. Check that `.npmrc` exists and has the correct configuration
2. Verify `vercel.json` has `--ignore-scripts=false` in the install command
3. Ensure `sharp` is in `package.json` dependencies
4. Try `pnpm rebuild sharp` locally
5. Check Vercel build logs for any installation errors

## Why Sharp is Needed

`sharp` is a transitive dependency of `@xenova/transformers`, which is used for:
- Sentiment analysis (Spanish text)
- Audio transcription (Whisper)
- Audio emotion prediction (wav2vec2)

Sharp is used internally by Transformers.js for image processing operations.

