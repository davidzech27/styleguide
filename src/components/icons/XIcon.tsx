import cl from "../../utils/cl"

export default function XIcon(props: { class?: string }) {
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
