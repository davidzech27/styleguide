import cl from "../../utils/cl"

export default function CheckIcon(props: { class?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.125"
            stroke-linecap="round"
            stroke-linejoin="round"
            class={cl("size-6", props.class)}
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}
