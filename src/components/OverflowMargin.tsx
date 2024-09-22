import { type ParentProps } from "solid-js"
import cl from "../utils/cl"

export default function OverflowMargin(
    props: ParentProps<{
        margin?: number
        marginTop?: number
        marginBottom?: number
        marginLeft?: number
        marginRight?: number
        class?: string
    }>,
) {
    return (
        <div class={cl("relative", props.class)}>
            <div
                style={{
                    top: `-${props.marginTop ?? props.margin ?? 0}px`,
                    bottom: `-${props.marginBottom ?? props.margin ?? 0}px`,
                    left: `-${props.marginLeft ?? props.margin ?? 0}px`,
                    right: `-${props.marginRight ?? props.margin ?? 0}px`,
                }}
                class="absolute"
            >
                {props.children}
            </div>
        </div>
    )
}
