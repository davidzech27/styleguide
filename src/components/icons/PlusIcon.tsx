import cl from "../../utils/cl"

export default function PlusIcon(props: { class?: string }) {
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
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="12" x2="12" y1="4" y2="20" />
        </svg>
    )
}
