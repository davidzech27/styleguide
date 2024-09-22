import {
    onMount,
    createEffect,
    onCleanup,
    batch,
    createComputed,
    on,
    createMemo,
    Show,
    type ComponentProps,
} from "solid-js"
import { render } from "solid-js/web"
import cl from "../utils/cl"
import { blendColors } from "../utils/colors"
import { getCaretPosition, setCaretPosition } from "../utils/caret"

const highlightedRangeIdsAttributeName = "data-highlighted-range-ids"
function encodeHighlightedRangeIdsAttribute(highlightedRangeIds: number[]) {
    return highlightedRangeIds
}
function decodeHighlightedRangeIdsAttribute(
    encodedHighlightedRangeIds: string,
) {
    return encodedHighlightedRangeIds.split(",").filter(Boolean).map(Number)
}

export default function HighlightedEditor(props: {
    text: string
    onChangeText: (text: string) => void
    highlightedRanges: {
        id: number
        start: number
        end: number
        color: `#${string}`
        active: boolean
    }[]
    onChangeHighlightedRanges: (
        highlightedRanges: typeof props.highlightedRanges,
    ) => void
    onLayoutHighlightedRanges?: (
        highlightedRanges: {
            id: number
            top: number
        }[],
    ) => void
    autoFocus?: boolean
    class?: string
}) {
    let ref: HTMLDivElement

    createComputed(() => {
        if (props.text === "") {
            props.onChangeText("\n")
        }
    })

    const insertText = (text: string) => {
        const selection = window.getSelection()
        if (!selection) return
        selection.deleteFromDocument()
        selection.getRangeAt(0).insertNode(document.createTextNode(text))
        selection.collapseToEnd()
    }

    let caretPosition = 0
    const onKeyDown = (event: KeyboardEvent) => {
        caretPosition = getCaretPosition({ element: ref })

        if (
            event.key === "Enter" &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey &&
            ["\n", undefined].includes(props.text[caretPosition - 1])
        ) {
            event.preventDefault()

            insertText("\n")

            onInput()
        }
    }

    const onLayoutHighlightedRanges = () => {
        const highlightedRangeTopMap = new Map<number, number>()

        ref.querySelectorAll("*").forEach((element) =>
            decodeHighlightedRangeIdsAttribute(
                element.getAttribute(highlightedRangeIdsAttributeName) || "",
            ).forEach(
                (id) =>
                    !highlightedRangeTopMap.has(id) &&
                    highlightedRangeTopMap.set(
                        id,
                        element.getBoundingClientRect().top -
                            ref.getBoundingClientRect().top,
                    ),
            ),
        )

        const highlightedRangeTops = Array.from(
            highlightedRangeTopMap.entries(),
        ).map(([id, top]) => ({
            id,
            top,
        }))

        props.onLayoutHighlightedRanges?.(highlightedRangeTops)
    }

    const onInput = () => {
        const oldText = props.text
        const newText = ref.innerText

        const oldCaretPosition = caretPosition
        const newCaretPosition =
            oldCaretPosition + (newText.length - oldText.length)
        caretPosition = newCaretPosition

        const oldHighlightedRanges = props.highlightedRanges
        const newHighlightedRanges = oldHighlightedRanges
            .map(({ start, end, ...rest }) => {
                end = Math.min(end, newText.length)

                if (newCaretPosition <= start && oldCaretPosition >= end) {
                    if (newCaretPosition === start) {
                        return {
                            ...rest,
                            start,
                            end: newCaretPosition,
                        }
                    }

                    return undefined
                }

                if (newCaretPosition < start && oldCaretPosition > start) {
                    return {
                        ...rest,
                        start: newCaretPosition,
                        end: end + newText.length - oldText.length,
                    }
                }
                if (newCaretPosition < end && oldCaretPosition > end) {
                    return {
                        ...rest,
                        start,
                        end: newCaretPosition,
                    }
                }

                return {
                    ...rest,
                    start:
                        oldCaretPosition <= start &&
                        !(start === end && oldCaretPosition === start)
                            ? start + newText.length - oldText.length
                            : start,
                    end:
                        oldCaretPosition <= end
                            ? end + newText.length - oldText.length
                            : end,
                }
            })
            .filter((highlightedRange) => highlightedRange !== undefined)

        batch(() => {
            props.onChangeText(newText)
            props.onChangeHighlightedRanges(newHighlightedRanges)
            onLayoutHighlightedRanges()
        })
    }

    const onPaste = (event: ClipboardEvent) => {
        event.preventDefault()

        const pastedText = event.clipboardData?.getData("text/plain") ?? ""

        insertText(pastedText)

        onInput()
    }

    onMount(() => {
        window.addEventListener("resize", onLayoutHighlightedRanges)
    })
    onCleanup(() => {
        window.removeEventListener("resize", onLayoutHighlightedRanges)
    })

    createEffect(
        on(
            createMemo<
                {
                    text: string
                    highlightedRangeIds: number[]
                    prioritizedHighlightedRangeId: number | undefined
                }[]
            >((oldSegments) => {
                const newSegments = props.text
                    .split("")
                    .reduce<typeof oldSegments>((segments, char, charIndex) => {
                        const ranges = props.highlightedRanges.filter(
                            ({ start, end }) =>
                                charIndex >= start && charIndex < end,
                        )

                        const highlightedRangeIds = ranges.map(({ id }) => id)

                        const oldHighlightedRangeIds =
                            segments.at(-1)?.highlightedRangeIds

                        const newSegment =
                            oldHighlightedRangeIds === undefined ||
                            highlightedRangeIds.length !==
                                oldHighlightedRangeIds.length ||
                            !highlightedRangeIds.every(
                                (rangeId, index) =>
                                    rangeId === oldHighlightedRangeIds[index],
                            )

                        return !newSegment
                            ? [
                                  ...segments.slice(0, -1),
                                  {
                                      text: segments.at(-1)!.text + char,
                                      highlightedRangeIds,
                                      prioritizedHighlightedRangeId:
                                          highlightedRangeIds.at(-1),
                                  },
                              ]
                            : [
                                  ...segments,
                                  {
                                      text: char,
                                      highlightedRangeIds,
                                      prioritizedHighlightedRangeId:
                                          highlightedRangeIds.at(-1),
                                  },
                              ]
                    }, [])

                return oldSegments.length === newSegments.length &&
                    oldSegments.every((oldSegment, index) => {
                        const newSegment = newSegments[index]!

                        return (
                            oldSegment.highlightedRangeIds.length ===
                                newSegment.highlightedRangeIds.length &&
                            oldSegment.highlightedRangeIds.every(
                                (rangeId, index) =>
                                    rangeId ===
                                    newSegment.highlightedRangeIds[index],
                            )
                        )
                    })
                    ? oldSegments
                    : newSegments
            }, []),
            (segments) => {
                const disposes = segments.map((segment) => {
                    const segmentHighlightedRanges = () =>
                        props.highlightedRanges.filter(({ id }) =>
                            segment.highlightedRangeIds.includes(id),
                        )

                    return render(
                        () => (
                            <Show
                                when={segmentHighlightedRanges().length > 0}
                                fallback={<span>{segment.text}</span>}
                            >
                                <Highlight
                                    text={segment.text}
                                    highlightedRanges={segmentHighlightedRanges()}
                                    onActive={() =>
                                        props.onChangeHighlightedRanges(
                                            props.highlightedRanges.map(
                                                (highlightedRange) =>
                                                    highlightedRange.id ===
                                                    segment.prioritizedHighlightedRangeId
                                                        ? {
                                                              ...highlightedRange,
                                                              active: true,
                                                          }
                                                        : highlightedRange,
                                            ),
                                        )
                                    }
                                    onInactive={() =>
                                        props.onChangeHighlightedRanges(
                                            props.highlightedRanges.map(
                                                (highlightedRange) =>
                                                    highlightedRange.id ===
                                                    segment.prioritizedHighlightedRangeId
                                                        ? {
                                                              ...highlightedRange,
                                                              active: false,
                                                          }
                                                        : highlightedRange,
                                            ),
                                        )
                                    }
                                />
                            </Show>
                        ),
                        ref,
                    )
                })

                onCleanup(() => disposes.forEach((dispose) => dispose()))

                onLayoutHighlightedRanges()

                setCaretPosition({ element: ref, position: caretPosition })
            },
        ),
    )

    onMount(() => {
        if (props.autoFocus) {
            ref.focus()
        }
    })

    return (
        <div
            ref={ref!}
            contentEditable
            onInput={onInput}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            class={cl("whitespace-pre-wrap outline-none", props.class)}
        />
    )
}

function Highlight(props: {
    text: string
    highlightedRanges: ComponentProps<
        typeof HighlightedEditor
    >["highlightedRanges"]
    onActive: () => void
    onInactive: () => void
}) {
    let ref: HTMLSpanElement

    let containsCaret = false
    const onParentKeyDown = () => {
        setTimeout(() => {
            const oldContainsCaret = containsCaret
            const newContainsCaret = ref.contains(
                document.getSelection()?.focusNode ?? null,
            )

            if (!oldContainsCaret && newContainsCaret) {
                props.onActive()
            }
            if (oldContainsCaret && !newContainsCaret) {
                props.onInactive()
            }

            containsCaret = newContainsCaret
        }, 0)
    }
    onMount(() => {
        if (ref.parentElement === null) return
        ref.parentElement.addEventListener("keydown", onParentKeyDown)
    })
    onCleanup(() => {
        if (ref.parentElement === null) return
        ref.parentElement.removeEventListener("keydown", onParentKeyDown)
    })

    const highlighted = () =>
        props.highlightedRanges.some(({ active }) => active)

    const backgroundColor = () =>
        highlighted()
            ? blendColors([
                  {
                      color: blendColors(
                          props.highlightedRanges
                              .filter(({ active }) => active)
                              .map(({ color }) => color),
                      ),
                      weight: 0.375,
                  },
                  {
                      color: "#FFFFFF",
                      weight: 0.625,
                  },
              ])
            : "#FFFFFF"

    const underlineColor = () =>
        highlighted()
            ? blendColors(
                  props.highlightedRanges
                      .filter(({ active }) => active)
                      .map(({ color }) => color),
              )
            : blendColors(props.highlightedRanges.map(({ color }) => color))

    return (
        <span
            ref={ref!}
            onMouseEnter={() => props.onActive()}
            onMouseLeave={() => props.onInactive()}
            {...{
                [highlightedRangeIdsAttributeName]:
                    encodeHighlightedRangeIdsAttribute(
                        props.highlightedRanges.map(({ id }) => id),
                    ),
            }}
            style={{
                "background-color": backgroundColor(),
                "border-bottom-color": underlineColor(),
                "border-bottom-width": "2px",
            }}
            class="transition"
        >
            {props.text}
        </span>
    )
}
