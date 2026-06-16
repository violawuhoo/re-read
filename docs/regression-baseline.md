# Re-Read Regression Baseline

## Scope

This document separates the current regression baseline into two layers:

- Local baseline: runs without real API calls and guards `report-engine` output shape and fallback language.
- Real-link regression: manual checks that exercise the end-to-end article fetch, task queue, and real report generation flow.

## Local Baseline

- Command: `npm run test:baseline`
- Real API required: No
- Goal:
  - Ensure degraded modules still produce a formal report
  - Ensure fallback copy avoids raw technical wording such as `待补充` or direct module names
  - Ensure non-structured agent outputs still use formal section titles and guidance

## Real-Link Regression Samples

| Sample ID | URL | Purpose | Real API |
| --- | --- | --- | --- |
| `wechat-real-001` | `https://mp.weixin.qq.com/s/xWuw6SQ40gxNJAbE1Yfcpg` | Validate real WeChat link intake, task progress updates, and final report rendering on the current main path | Yes |

## Pending Real-Sample Categories

The following categories are still needed to make the real regression set more representative:

- WeChat verification required sample
- One-way PR or launch article with insufficient first-hand material
- Stable A-class paper interpretation sample
- Stable A+C mixed sample from a different domain

## Manual Real-Link Checklist

When running a real-link regression, check the following:

1. The index page accepts the link and starts task creation normally.
2. Progress no longer stalls at a misleading fixed percentage.
3. Failure states, if any, are user-readable and recoverable.
4. The final report keeps the formal template structure.
5. Degraded sections still read like a finished report instead of a debug page.
6. The report page can open and render without empty white blocks.
