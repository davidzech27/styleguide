import { type Ref, type ParentProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import cl from "../utils/cl"

export default function Text(
    props: ParentProps<{
        ref?: Ref<HTMLElement>
        variant:
            | "heading-1"
            | "heading-2"
            | "heading-3"
            | "text"
            | "subtext"
            | "label"
        as?:
            | "h1"
            | "h2"
            | "h3"
            | "h4"
            | "h5"
            | "h6"
            | "p"
            | "div"
            | "span"
            | "label"
        class?: string
    }>,
) {
    return (
        <Dynamic
            ref={props.ref}
            component={
                props.as ??
                (props.variant === undefined
                    ? ("p" as const)
                    : {
                          "heading-1": "h1" as const,
                          "heading-2": "h2" as const,
                          "heading-3": "h3" as const,
                          text: "p" as const,
                          subtext: "p" as const,
                          label: "label" as const,
                      }[props.variant])
            }
            class={cl(
                "break-words tracking-default",
                {
                    "heading-1": "text-6xl font-medium+ text-text",
                    "heading-2": "text-4xl font-medium+ text-text",
                    "heading-3": "text-2xl font-medium+ text-text",
                    text: "text-base font-normal+ text-text",
                    subtext: "text-base font-normal+ text-subtext",
                    label: "text-sm font-medium+ text-text",
                }[props.variant],
                props.class,
            )}
        >
            {props.children}
        </Dynamic>
    )
}
