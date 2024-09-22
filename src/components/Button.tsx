import { type ParentProps } from "solid-js"
import Text from "./Text"
import cl from "../utils/cl"

export default function Button(
    props: ParentProps<{
        onClick: () => void
        disabled?: boolean
        variant?: "solid" | "text"
        class?: string
    }>,
) {
    return (
        <button
            onClick={props.onClick}
            disabled={props.disabled}
            class={cl(
                "disabled:opacity-disabled flex justify-center rounded-lg px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500",
                {
                    solid: "bg-button-background hover:bg-active-button-background active:bg-active-button-background",
                    text: "bg-transparent hover:bg-button-background active:bg-active-button-background",
                }[props.variant ?? "solid"],
                props.class,
            )}
        >
            <Text variant="label" as="span">
                {props.children}
            </Text>
        </button>
    )
}
