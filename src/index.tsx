import { render } from "solid-js/web"
import { attachDevtoolsOverlay } from "@solid-devtools/overlay"

import "./index.css"
import App from "./app/App"

const root = document.getElementById("root")

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
    throw new Error("Root element not found.")
}

render(() => <App />, root!)

// attachDevtoolsOverlay({
//     alwaysOpen: true,
//     noPadding: true,
// })
