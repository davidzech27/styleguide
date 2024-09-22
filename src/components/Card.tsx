import { type ParentProps } from "solid-js"
import cl from "../utils/cl"

export default function Card(
    props: ParentProps<{
        active?: boolean
        class?: string
    }>,
) {
    return (
        <div
            classList={{
                "shadow-lg": props.active,
            }}
            class={cl(
                "border-border rounded-lg border-[0.5px] px-3 py-2 transition focus-within:shadow-lg",
                props.class,
            )}
        >
            {props.children}
        </div>
    )
}
