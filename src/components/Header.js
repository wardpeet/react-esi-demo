import * as React from "react";

export function Header({ items = [] }) {
  return (
    <header>
      <nav>
        <ul>
          {items.map((item) => {
            return (
              <li key={item.to}>
                <a href={item.to}>{item.name}</a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
