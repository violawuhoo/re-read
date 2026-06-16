[OPEN] Debug Session: insert-before-error

# Symptom

- H5 预览页出现运行时异常：`NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.`
- 调用栈落在 `@stencil/core/internal/client` 的渲染阶段。

# Hypotheses

1. 某个列表渲染节点使用了不稳定的 key，导致 React/Taro 在局部重排时复用了错误 DOM 引用。
2. 某个条件渲染分支在同一父节点下频繁切换，和 Stencil web component 的内部 patch 冲突。
3. 某个 Taro 组件 children 结构不合法，导致真实 DOM 树和虚拟树在更新时失配。
4. 页面切换或异步状态更新过快，组件卸载后仍触发了二次渲染，向已变更父节点执行 `insertBefore`。
5. 报告页中的第三方 web component 或 H5 特有组件在 React 18 严格模式/双渲染下存在兼容性问题。

# Evidence Plan

- 先定位异常发生页面与触发动作。
- 给最可疑的页面渲染路径加最小化埋点，记录渲染分支、关键列表长度、关键 key 集合。
- 在浏览器中复现并结合日志确认具体触发组件。

# Status

- Instrumentation added to `src/pages/report/index.tsx`.
- Debug server running on `http://127.0.0.1:7778`.

# Evidence

- Fresh tab load of `http://localhost:10086/#/pages/report/index?mock=1` succeeds.
- Debug log shows report payload shape is stable on fresh load:
  - `sectionKeys`: 12 structured sections
  - `referenceIds`: 6 items
  - `timelineKeys / overseasKeys / domesticKeys / opportunityKeys / signalKeys` all present and well-formed
- Existing preview tab shows:
  - `webpack-dev-server` hot update messages
  - then `NotFoundError: Failed to execute 'insertBefore' on 'Node'`
  - then additional HMR recompilation messages
- Existing preview tab becomes `WebView not ready`, while a newly opened tab renders normally.

# Interim Conclusion

- Hypothesis 1: not yet supported on fresh load; payload keys look stable.
- Hypothesis 2: possible, but currently no direct evidence of a specific conditional branch.
- Hypothesis 3: possible but unproven.
- Hypothesis 4: possible side effect of hot update / teardown timing.
- Hypothesis 5: currently strongest; issue appears tied to H5 dev hot update + Stencil component rerender, not initial page render.
