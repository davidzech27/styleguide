import cl from "../../utils/cl"

export default function SpinnerIcon(props: { class?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.125"
            stroke-linecap="round"
            stroke-linejoin="round"
            class={cl("size-6 animate-spin", props.class)}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
