import * as React from "react";
import { PageFragment } from "../PageFragment.js";

export default function Home() {
  return (
    <div>
      <PageFragment
        component="/components/Header.js"
        export="Header"
        items={[
          { to: "/", name: "Home" },
          { to: "/page-2", name: "Page 2" },
        ]}
      />
      <main>Page 2</main>
    </div>
  );
}
