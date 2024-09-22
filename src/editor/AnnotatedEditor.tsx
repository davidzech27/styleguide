import {
    createComputed,
    createEffect,
    on,
    onCleanup,
    Show,
    type JSXElement,
} from "solid-js"
import { createStore, reconcile } from "solid-js/store"
import { render } from "solid-js/web"
import HighlightedEditor from "./HighlightedEditor"
import Card from "../components/Card"
import Text from "../components/Text"
import cl from "../utils/cl"

const MINIMUM_ANNOTATION_SPACING = 8

export default function AnnotatedEditor(props: {
    text: string
    onChangeText: (text: string) => void
    annotations: {
        id: number
        start: number
        end: number
        title: string
        content: string
        color: `#${string}`
    }[]
    onChangeAnnotations: (annotations: typeof props.annotations) => void
    fallback?: JSXElement
    autoFocus?: boolean
    class?: string
}) {
    const [annotations, setAnnotations] = createStore<
        ((typeof props.annotations)[number] & {
            active: boolean
            top: number
        })[]
    >([])

    createComputed(
        on(
            () => props.annotations,
            () =>
                setAnnotations(
                    reconcile(
                        props.annotations.map((annotation) => ({
                            ...annotation,
                            active: false,
                            top: 0,
                        })),
                    ),
                ),
        ),
    )

    let annotationColumnRef: HTMLDivElement

    createEffect(
        on(
            () => annotations.forEach((annotation) => annotation.id),
            () => {
                const disposes = annotations.map((annotation) => {
                    const lastElement = annotationColumnRef.lastElementChild

                    return render(
                        () => (
                            <Annotation
                                title={annotation.title}
                                content={annotation.content}
                                color={annotation.color}
                                active={annotation.active}
                                top={Math.max(
                                    annotation.top,
                                    lastElement
                                        ? lastElement.getBoundingClientRect()
                                              .top -
                                              annotationColumnRef.getBoundingClientRect()
                                                  .top +
                                              lastElement.clientHeight +
                                              MINIMUM_ANNOTATION_SPACING
                                        : 0,
                                )}
                                onActive={() =>
                                    setAnnotations(
                                        ({ id }) => id === annotation.id,
                                        "active",
                                        true,
                                    )
                                }
                                onInactive={() =>
                                    setAnnotations(
                                        ({ id }) => id === annotation.id,
                                        "active",
                                        false,
                                    )
                                }
                            />
                        ),
                        annotationColumnRef,
                    )
                })

                onCleanup(() => disposes.forEach((dispose) => dispose()))
            },
        ),
    )

    return (
        <>
            <div class="w-72">
                <Show when={annotations.length} fallback={props.fallback}>
                    <div ref={annotationColumnRef!} class="relative" />
                </Show>
            </div>
            <HighlightedEditor
                text={props.text}
                onChangeText={props.onChangeText}
                highlightedRanges={annotations}
                onChangeHighlightedRanges={(highlightedRanges) =>
                    setAnnotations(
                        reconcile(
                            highlightedRanges.map((highlightedRange) => ({
                                ...(annotations.find(
                                    ({ id }) => id === highlightedRange.id,
                                ) ?? {
                                    title: "",
                                    content: "",
                                    top: 0,
                                }),
                                ...highlightedRange,
                            })),
                        ),
                    )
                }
                onLayoutHighlightedRanges={(highlightedRanges) =>
                    setAnnotations(
                        reconcile(
                            annotations.map((annotation) => ({
                                ...annotation,
                                top:
                                    highlightedRanges.find(
                                        ({ id }) => id === annotation.id,
                                    )?.top ?? annotation.top,
                            })),
                        ),
                    )
                }
                autoFocus={props.autoFocus}
                class={props.class}
            />
        </>
    )
}

function Annotation(props: {
    title: string
    content: string
    color: `#${string}`
    active: boolean
    top: number
    onActive: () => void
    onInactive: () => void
}) {
    let textHeight = 0

    return (
        <div
            onMouseEnter={() => props.onActive()}
            onMouseLeave={() => props.onInactive()}
            style={{
                top: `${props.top}px`,
            }}
            class={cl("absolute w-full bg-white", props.active && "z-10")}
        >
            <Card active={props.active}>
                <Text variant="text" class="font-medium+">
                    {props.title}
                </Text>
                <div
                    style={{
                        height: `${props.active ? textHeight : 0}px`,
                    }}
                    class="overflow-hidden transition-all"
                >
                    <Text
                        ref={(element) =>
                            setTimeout(() => {
                                textHeight = element.clientHeight
                            }, 0)
                        }
                        variant="subtext"
                    >
                        {props.content}
                    </Text>
                </div>
            </Card>
        </div>
    )
}
