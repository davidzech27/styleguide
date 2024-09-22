import { onMount, type Ref } from "solid-js"
import cl from "../utils/cl"

export default function TextInput(
    props:
        | {
              ref?: Ref<HTMLInputElement>
              value: string
              onInput: (value: string) => void
              onKeyDown?: (event: KeyboardEvent) => void
              onFocus?: (event: FocusEvent) => void
              onBlur?: (event: FocusEvent) => void
              expanding?: false
              autoFocus?: boolean
              spellcheck?: boolean
              class?: string
          }
        | {
              ref?: Ref<HTMLTextAreaElement>
              value: string
              onInput: (value: string) => void
              onKeyDown?: (event: KeyboardEvent) => void
              onFocus?: (event: FocusEvent) => void
              onBlur?: (event: FocusEvent) => void
              expanding: true
              autoFocus?: boolean
              spellcheck?: boolean
              class?: string
          },
) {
    let ref: HTMLInputElement | HTMLTextAreaElement

    onMount(() => {
        if (props.autoFocus) {
            ref.focus()
        }
    })

    const classAttribute = () =>
        cl(
            "border-border text-text font-normal+ rounded-lg border px-3 py-1.5 text-base outline-none transition focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500",
            props.class,
        )

    if (!props.expanding) {
        return (
            <input
                ref={(element) => {
                    ref = element

                    typeof props.ref === "function" && props.ref(element)
                }}
                type="text"
                value={props.value}
                onInput={(e) => props.onInput(e.currentTarget.value)}
                onKeyDown={props.onKeyDown}
                onFocus={props.onFocus}
                onBlur={props.onBlur}
                spellcheck={props.spellcheck}
                class={classAttribute()}
            />
        )
    }

    const updateHeight = () => {
        ref.style.height = "auto"
        ref.style.height = ref.scrollHeight + 2 + "px"
    }

    onMount(updateHeight)

    return (
        <textarea
            ref={(element) => {
                ref = element

                typeof props.ref === "function" && props.ref(element)
            }}
            value={props.value}
            onInput={(event) => {
                props.onInput(event.currentTarget.value)
                updateHeight()
            }}
            onKeyDown={props.onKeyDown}
            onFocus={props.onFocus}
            onBlur={props.onBlur}
            spellcheck={props.spellcheck}
            rows={1}
            style={{
                "margin-bottom": "-6px",
            }}
            class={cl("resize-none overflow-hidden", classAttribute())}
        />
    )
}
