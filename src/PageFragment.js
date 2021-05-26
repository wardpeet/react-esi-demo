import * as React from "react";
import { readFragment } from "./react-fragment";

function Server({ component, exportedName, ...props }) {
  return readFragment(component, exportedName, props);
}

export function PageFragment({
  component,
  export: exportedName = "default",
  ...props
}) {
  const LazyComponent = React.lazy(() =>
    import(component).then((mod) => mod[exportedName])
  );
  // this is some hackery to resolve components properly
  component = `.${component}`;

  // in the browser we'll do lazy importing
  if (typeof document !== "undefined") {
    return (
      <React.Suspense fallback={null}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  }

  // we do our esi voodoo
  return (
    <React.Suspense fallback={null}>
      <Server component={component} exportedName={exportedName} {...props} />
    </React.Suspense>
  );
}
